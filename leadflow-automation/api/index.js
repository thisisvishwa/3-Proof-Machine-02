// Vercel Serverless Wrapper for LeadFlow Automation Backend
// This allows deploying the same Express backend on Vercel FREE as alternative to Render
// For Render, we still use server/index.js with listen. For Vercel, we export app without listen.

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");

// In Vercel serverless, filesystem is ephemeral — use /tmp for data
const isVercel = !!process.env.VERCEL;
const EFFECTIVE_DATA_DIR = isVercel ? "/tmp" : DATA_DIR;
const LEADS_FILE = path.join(EFFECTIVE_DATA_DIR, "leads.json");
const LOGS_FILE = path.join(EFFECTIVE_DATA_DIR, "logs.json");
const REPORTS_FILE = path.join(EFFECTIVE_DATA_DIR, "reports.json");

if (!fs.existsSync(EFFECTIVE_DATA_DIR)) fs.mkdirSync(EFFECTIVE_DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, "[]");
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, "[]");

const CONFIG = {
  webhookPath: "/leadflow/new-lead",
  sheets: {
    enabled: process.env.GOOGLE_SHEETS_ENABLED === "true",
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || "DEMO_SPREADSHEET_ID",
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    salesTeam: process.env.SALES_TEAM_EMAIL || "sales@leadflowpro.demo",
    managerEmail: process.env.MANAGER_EMAIL || "manager@leadflowpro.demo",
  },
  ai: {
    provider: process.env.AI_PROVIDER || "heuristic",
    model: process.env.AI_MODEL || "gpt-4o-mini",
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === "true",
  },
};

function loadJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { return []; }
}
function saveJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch {}
}
function logEvent({ lead_id, type, node, message, level = "info", data = null }) {
  const logs = loadJson(LOGS_FILE);
  const entry = { id: uuidv4(), timestamp: new Date().toISOString(), lead_id: lead_id || "system", type, node, message, level, data };
  logs.unshift(entry);
  saveJson(LOGS_FILE, logs.slice(0, 500));
  return entry;
}
function validateLead(payload) {
  const errors = [];
  if (!payload.name || payload.name.trim().length < 2) errors.push("Name is required");
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push("Valid email required");
  if (!payload.business || payload.business.trim().length < 2) errors.push("Business required");
  if (!payload.needs && !payload.message) errors.push("Need/message required");
  if (payload.phone && !/^[\+]?[\d\s\-\(\)]{8,20}$/.test(payload.phone)) errors.push("Phone invalid");
  if (!payload.industry) errors.push("Industry required");
  if (!payload.budget) errors.push("Budget required");
  return { valid: errors.length === 0, errors };
}
function normalizeLead(payload) {
  const now = new Date();
  const lead_id = `LF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const capitalize = (s) => s.trim().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return {
    lead_id,
    received_at: now.toISOString(),
    name: payload.name ? capitalize(payload.name) : "",
    business: payload.business ? payload.business.trim() : "",
    email: payload.email ? payload.email.trim().toLowerCase() : "",
    phone: payload.phone ? payload.phone.replace(/[^\d\+]/g, "") : "",
    website: payload.website ? payload.website.trim().replace(/^https?:\/\//, "").replace(/\/$/, "") : "",
    industry: payload.industry ? payload.industry.trim() : "Other",
    budget: payload.budget ? payload.budget.trim() : "Unknown",
    needs: payload.needs ? payload.needs.trim() : "",
    message: payload.message ? payload.message.trim() : "",
    source: payload.source || "LeadFlow Pro Website",
    timestamp: payload.timestamp || now.toISOString(),
    email_domain: payload.email ? payload.email.split("@")[1] || "" : "",
    is_business_email: payload.email ? !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(payload.email.split("@")[1]) : false,
    raw_payload: payload,
  };
}
function aiQualifyLead(lead) {
  const text = `${lead.needs} ${lead.message}`.toLowerCase();
  let business_need = "Other";
  if (text.includes("lead") && (text.includes("generation") || text.includes("more leads"))) business_need = "Lead Generation";
  else if (text.includes("website") || text.includes("landing")) business_need = "Website";
  else if (text.includes("conversion")) business_need = "Conversion Optimization";
  else if (text.includes("crm") || text.includes("hubspot")) business_need = "CRM Automation";
  else if (text.includes("ai") || text.includes("qualification")) business_need = "AI Automation";
  else if (text.includes("follow") || text.includes("nurture")) business_need = "Follow-Up Automation";

  let lead_intent = "Researching";
  if (text.includes("ready to buy") || text.includes("asap") || text.includes("immediately") || text.includes("urgent") || text.includes("this week")) lead_intent = "Ready to Buy";
  else if (text.includes("evaluating") || text.includes("comparing") || text.includes("proposal")) lead_intent = "Evaluating";
  else if (text.includes("interested") || text.includes("looking for")) lead_intent = "Interested";

  let urgency = "Low";
  if (text.includes("critical") || text.includes("asap") || text.includes("immediately") || text.includes("today")) urgency = "Critical";
  else if (text.includes("urgent") || text.includes("this week") || lead.budget.includes("$15k") || lead.budget.includes("$50k")) urgency = "High";
  else if (text.includes("next month") || text.includes("soon")) urgency = "Medium";

  let score = 0;
  const breakdown = {};
  if (lead.budget.includes("$50k")) { score += 35; breakdown.budget = 35; }
  else if (lead.budget.includes("$15k")) { score += 28; breakdown.budget = 28; }
  else if (lead.budget.includes("$5k")) { score += 20; breakdown.budget = 20; }
  else if (lead.budget.includes("$1k")) { score += 10; breakdown.budget = 10; }
  else { score += 5; breakdown.budget = 5; }

  if (lead_intent === "Ready to Buy") { score += 25; breakdown.intent = 25; }
  else if (lead_intent === "Evaluating") { score += 18; breakdown.intent = 18; }
  else if (lead_intent === "Interested") { score += 12; breakdown.intent = 12; }
  else { score += 5; breakdown.intent = 5; }

  if (urgency === "Critical") { score += 15; breakdown.urgency = 15; }
  else if (urgency === "High") { score += 10; breakdown.urgency = 10; }
  else if (urgency === "Medium") { score += 6; breakdown.urgency = 6; }
  else { score += 2; breakdown.urgency = 2; }

  let quality = 0;
  if (lead.is_business_email) quality += 8;
  if (lead.website) quality += 5;
  if (lead.message && lead.message.length > 50) quality += 7;
  if (lead.needs && lead.needs.length > 5) quality += 5;
  score += quality;
  breakdown.quality = quality;
  score = Math.min(100, Math.max(0, Math.round(score)));

  let lead_temperature = "COLD";
  if (score >= 80) lead_temperature = "HOT";
  else if (score >= 50) lead_temperature = "WARM";

  const recommended_action = lead_temperature === "HOT" ? "Immediate sales outreach — call within 15 mins" : lead_temperature === "WARM" ? "Nurture sequence — send case studies, book discovery call within 48h" : "Add to newsletter & retargeting — low priority";
  const reasoning = `Lead scored ${score}/100. Budget ${lead.budget} (${breakdown.budget}pts), Intent ${lead_intent} (${breakdown.intent}pts), Urgency ${urgency} (${breakdown.urgency}pts), Quality ${quality}pts. Business need ${business_need}.`;
  const sales_message = `Hi ${lead.name.split(" ")[0]},\n\nThanks for reaching out about ${business_need.toLowerCase()} for ${lead.business} — I saw you mentioned "${lead.needs || lead.message.slice(0, 80)}".\n\nWe help similar ${lead.industry.toLowerCase()} companies ${lead_temperature === "HOT" ? "launch this in 7-14 days" : "map their funnel in 30-min call"}.\n\nWorth a quick strategy call this week?\n\nBest,\nAlex — LeadFlow Pro`;

  return { business_need, lead_intent, urgency, qualification_score: score, lead_temperature, recommended_action, reasoning, sales_message, score_breakdown: breakdown };
}
function routeLead(q) { if (q.qualification_score >= 80) return "HOT"; if (q.qualification_score >= 50) return "WARM"; return "COLD"; }
function saveToSheets(lead, qual = null, route = null, notification = null) {
  const leads = loadJson(LEADS_FILE);
  const sheetRow = {
    "Lead ID": lead.lead_id,
    Date: new Date(lead.received_at).toLocaleDateString(),
    Name: lead.name,
    Business: lead.business,
    Email: lead.email,
    Phone: lead.phone,
    Website: lead.website,
    Industry: lead.industry,
    Budget: lead.budget,
    Need: lead.needs,
    Message: lead.message,
    Source: lead.source,
    "AI Business Need": qual?.business_need || "",
    "Lead Intent": qual?.lead_intent || "",
    Urgency: qual?.urgency || "",
    "Qualification Score": qual?.qualification_score ?? "",
    "Lead Temperature": qual?.lead_temperature || route || "",
    "Recommended Action": qual?.recommended_action || "",
    "Sales Message": qual?.sales_message || "",
    "Notification Status": notification ? `Sent to ${notification.to}` : "Pending",
    "Follow-Up Status": route === "HOT" ? "Immediate outreach required" : route === "WARM" ? "Nurture sequence queued" : "Newsletter only",
    "Created At": lead.received_at,
    _raw: lead,
    _qual: qual,
    _route: route,
  };
  const idx = leads.findIndex((l) => l["Lead ID"] === lead.lead_id);
  if (idx >= 0) leads[idx] = sheetRow; else leads.unshift(sheetRow);
  saveJson(LEADS_FILE, leads.slice(0, 1000));
  return sheetRow;
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "LeadFlow Automation",
    status: "running",
    version: "1.0.0",
    platform: isVercel ? "vercel-free" : "render-free",
    webhook: "/leadflow/new-lead",
    config: {
      sheets: CONFIG.sheets.enabled ? "LIVE" : "DEMO (local JSON)",
      email: CONFIG.email.enabled ? "LIVE" : "DEMO (simulated)",
      ai: CONFIG.ai.provider,
    },
    endpoints: {
      webhook: "POST /leadflow/new-lead",
      leads: "GET /api/leads",
      logs: "GET /api/logs",
      reports: "GET /api/reports",
      dailyReport: "POST /api/daily-report",
      test: "POST /api/test/:type",
    },
  });
});

app.get("/api/config", (req, res) => res.json(CONFIG));

app.post("/leadflow/new-lead", async (req, res) => {
  const requestId = uuidv4();
  const payload = req.body;
  logEvent({ lead_id: requestId, type: "webhook", node: "Webhook", message: "Incoming lead webhook received" });
  try {
    const validation = validateLead(payload);
    if (!validation.valid) {
      logEvent({ lead_id: requestId, type: "validation_failed", node: "Validate Lead", message: `Validation failed: ${validation.errors.join("; ")}`, level: "warn" });
      const leads = loadJson(LEADS_FILE);
      leads.unshift({ "Lead ID": `INVALID-${requestId.slice(0, 8)}`, Date: new Date().toLocaleDateString(), Name: payload.name || "", Business: payload.business || "", Email: payload.email || "", "Lead Temperature": "INVALID", "Qualification Score": 0, validation_errors: validation.errors, _raw: payload, "Created At": new Date().toISOString() });
      saveJson(LEADS_FILE, leads.slice(0, 1000));
      return res.status(400).json({ success: false, lead_id: requestId, valid: false, errors: validation.errors });
    }
    const normalized = normalizeLead(payload);
    logEvent({ lead_id: normalized.lead_id, type: "normalized", node: "Normalize Data", message: `Lead normalized: ${normalized.name}` });
    saveToSheets(normalized);
    let qualification;
    try {
      qualification = aiQualifyLead(normalized);
      logEvent({ lead_id: normalized.lead_id, type: "ai_qualified", node: "AI Qualification", message: `AI qualification: ${qualification.business_need}, Score ${qualification.qualification_score}, ${qualification.lead_temperature}`, data: qualification });
      const expectedTemp = routeLead(qualification);
      if (expectedTemp !== qualification.lead_temperature) qualification.lead_temperature = expectedTemp;
    } catch (aiErr) {
      qualification = { business_need: "Other", lead_intent: "Researching", urgency: "Low", qualification_score: 45, lead_temperature: "COLD", recommended_action: "Manual review required", reasoning: `Fallback: ${aiErr.message}`, sales_message: `Hi ${normalized.name}, thanks for reaching out`, score_breakdown: { fallback: 45 } };
    }
    const route = routeLead(qualification);
    logEvent({ lead_id: normalized.lead_id, type: "routed", node: "Router", message: `Routed to ${route} path (score ${qualification.qualification_score})` });
    let notification = null;
    if (route !== "COLD") {
      notification = { subject: route === "HOT" ? `🔥 HOT LEAD — ${normalized.business} — Score ${qualification.qualification_score}` : `🟡 WARM LEAD — ${normalized.business}`, to: route === "HOT" ? CONFIG.email.salesTeam : CONFIG.email.managerEmail };
      logEvent({ lead_id: normalized.lead_id, type: "notification_sent", node: "Email Notification", message: `Notification prepared for ${route} lead: ${notification.subject} [DEMO]` });
    }
    logEvent({ lead_id: normalized.lead_id, type: "follow_up_generated", node: "Follow-Up", message: `Follow-up generated (${qualification.sales_message.length} chars)` });
    const finalRow = saveToSheets(normalized, qualification, route, notification);
    logEvent({ lead_id: normalized.lead_id, type: "workflow_completed", node: "Complete", message: `Workflow completed: ${normalized.name} → ${route} (${qualification.qualification_score})` });
    return res.json({ success: true, lead_id: normalized.lead_id, valid: true, normalized, qualification, route, notification: notification ? { ...notification, mode: "DEMO" } : null, follow_up: { message: qualification.sales_message, status: route === "HOT" ? "Immediate outreach required" : route === "WARM" ? "Nurture sequence queued" : "Newsletter only", delivery: { email: "DEMO — simulated", whatsapp: "DEMO — placeholder", crm: "DEMO — placeholder" } }, sheets: { mode: "DEMO — local JSON", row: finalRow } });
  } catch (err) {
    logEvent({ lead_id: requestId, type: "workflow_error", node: "Error Handler", message: `Workflow error: ${err.message}`, level: "error" });
    return res.status(500).json({ success: false, lead_id: requestId, error: err.message });
  }
});

app.get("/api/leads", (req, res) => {
  const leads = loadJson(LEADS_FILE);
  res.json({ total: leads.length, leads: leads.slice(0, 100) });
});
app.get("/api/logs", (req, res) => {
  const logs = loadJson(LOGS_FILE);
  res.json({ total: logs.length, logs: logs.slice(0, 200) });
});
app.get("/api/reports", (req, res) => {
  const reports = loadJson(REPORTS_FILE);
  res.json({ total: reports.length, reports });
});

function generateDailyReport() {
  const leads = loadJson(LEADS_FILE);
  const today = new Date().toLocaleDateString();
  const todayLeads = leads.filter((l) => l.Date === today);
  const validLeads = todayLeads.filter((l) => l["Lead Temperature"] !== "INVALID");
  const invalidLeads = todayLeads.filter((l) => l["Lead Temperature"] === "INVALID");
  const hot = validLeads.filter((l) => l["Lead Temperature"] === "HOT");
  const warm = validLeads.filter((l) => l["Lead Temperature"] === "WARM");
  const cold = validLeads.filter((l) => l["Lead Temperature"] === "COLD");
  const scores = validLeads.map((l) => l["Qualification Score"]).filter((s) => typeof s === "number");
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highest = validLeads.sort((a, b) => (b["Qualification Score"] || 0) - (a["Qualification Score"] || 0))[0];
  const needs = {};
  const industries = {};
  validLeads.forEach((l) => {
    if (l["AI Business Need"]) needs[l["AI Business Need"]] = (needs[l["AI Business Need"]] || 0) + 1;
    if (l.Industry) industries[l.Industry] = (industries[l.Industry] || 0) + 1;
  });
  const mostCommonNeed = Object.entries(needs).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const mostCommonIndustry = Object.entries(industries).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const logs = loadJson(LOGS_FILE);
  const todayLogs = logs.filter((l) => new Date(l.timestamp).toLocaleDateString() === today);
  const followUpsSent = todayLogs.filter((l) => l.type === "follow_up_generated").length;
  const failed = todayLogs.filter((l) => l.level === "error").length;
  const report = {
    id: uuidv4(),
    date: today,
    generated_at: new Date().toISOString(),
    total_leads: todayLeads.length,
    valid_leads: validLeads.length,
    invalid_leads: invalidLeads.length,
    hot_leads: hot.length,
    warm_leads: warm.length,
    cold_leads: cold.length,
    average_qualification_score: avgScore,
    highest_scoring_lead: highest ? { name: highest.Name, business: highest.Business, score: highest["Qualification Score"], temperature: highest["Lead Temperature"] } : null,
    most_common_business_need: mostCommonNeed,
    most_common_industry: mostCommonIndustry,
    leads_requiring_immediate_action: hot.map((h) => ({ name: h.Name, business: h.Business, score: h["Qualification Score"] })),
    follow_ups_sent: followUpsSent,
    failed_automations: failed,
    breakdown: { needs, industries },
  };
  const reports = loadJson(REPORTS_FILE);
  reports.unshift(report);
  saveJson(REPORTS_FILE, reports.slice(0, 100));
  return report;
}

app.post("/api/daily-report", (req, res) => {
  const report = generateDailyReport();
  res.json({ success: true, report, email: { to: CONFIG.email.managerEmail, subject: `LeadFlow Daily Report — ${report.date}`, mode: "DEMO" } });
});
app.get("/api/daily-report", (req, res) => {
  const report = generateDailyReport();
  res.json(report);
});

app.post("/api/test/:type", (req, res) => {
  const type = req.params.type;
  const payloads = {
    hot: { name: "Sarah Chen", business: "Atlas Labs", email: "sarah@atlaslabs.io", phone: "+14155552671", website: "atlaslabs.io", industry: "B2B SaaS", budget: "$15k - $50k", needs: "Ready to Buy", message: "We need to fix our follow-up ASAP. We're losing hot leads, need CRM automation and AI qualification immediately. Ready to start this week, budget approved.", source: "LeadFlow Pro Website", timestamp: new Date().toISOString() },
    warm: { name: "Marcus Reid", business: "Pulse Agency", email: "marcus@pulseagency.co", phone: "+14155552672", website: "pulseagency.co", industry: "Agency / Services", budget: "$5k - $15k", needs: "Conversion Optimization", message: "Interested in improving our landing page conversion. We're evaluating a few agencies and comparing options. Looking to improve next month.", source: "LeadFlow Pro Website", timestamp: new Date().toISOString() },
    cold: { name: "John Smith", business: "Test Ventures", email: "john@gmail.com", phone: "+14155552673", website: "", industry: "Other", budget: "Less than $1k", needs: "Lead Generation", message: "Just researching lead gen options for future.", source: "LeadFlow Pro Website", timestamp: new Date().toISOString() },
    invalid: { name: "", business: "", email: "not-an-email", phone: "123", industry: "", budget: "", needs: "", message: "", source: "LeadFlow Pro Website", timestamp: new Date().toISOString() },
  };
  const payload = payloads[type] || payloads.hot;
  // Simulate internal processing without self-fetch (Vercel serverless can't self-fetch easily)
  const validation = validateLead(payload);
  if (!validation.valid) {
    return res.json({ test_type: type, payload, result: { success: false, valid: false, errors: validation.errors } });
  }
  const normalized = normalizeLead(payload);
  const qualification = aiQualifyLead(normalized);
  const route = routeLead(qualification);
  saveToSheets(normalized, qualification, route, null);
  logEvent({ lead_id: normalized.lead_id, type: "workflow_completed", node: "Test", message: `Test ${type} lead processed: ${route} ${qualification.qualification_score}` });
  res.json({ test_type: type, payload, result: { success: true, lead_id: normalized.lead_id, qualification, route } });
});

// For Vercel serverless, export app. For Render/Node, listen if not Vercel.
if (!isVercel) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 LeadFlow Automation running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
