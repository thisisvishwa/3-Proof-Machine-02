import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, "[]");
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, "[]");

// ================= CONFIG =================
const CONFIG = {
  webhookPath: "/leadflow/new-lead",
  port: process.env.PORT || 3001,
  sheets: {
    enabled: process.env.GOOGLE_SHEETS_ENABLED === "true",
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || "DEMO_SPREADSHEET_ID",
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json",
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    host: process.env.SMTP_HOST || "smtp.demo.com",
    port: process.env.SMTP_PORT || 587,
    from: process.env.EMAIL_FROM || "automation@leadflowpro.demo",
    salesTeam: process.env.SALES_TEAM_EMAIL || "sales@leadflowpro.demo",
    managerEmail: process.env.MANAGER_EMAIL || "manager@leadflowpro.demo",
  },
  ai: {
    provider: process.env.AI_PROVIDER || "heuristic", // openai, anthropic, heuristic
    openaiKey: process.env.OPENAI_API_KEY ? "***REDACTED***" : undefined,
    model: process.env.AI_MODEL || "gpt-4o-mini",
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === "true",
    number: process.env.WHATSAPP_NUMBER || "14155552671",
  },
};

// ================= HELPERS =================
function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}
function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function logEvent({ lead_id, type, node, message, level = "info", data = null }) {
  const logs = loadJson(LOGS_FILE);
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    lead_id: lead_id || "system",
    type,
    node,
    message,
    level,
    data,
  };
  logs.unshift(entry);
  saveJson(LOGS_FILE, logs.slice(0, 500));
  console.log(`[${entry.level.toUpperCase()}] [${entry.node}] ${entry.message}`, data ? JSON.stringify(data).slice(0, 200) : "");
  return entry;
}

// ================= NODE 2: VALIDATE =================
function validateLead(payload) {
  const errors = [];
  if (!payload.name || payload.name.trim().length < 2) errors.push("Name is required and must be at least 2 characters");
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push("Valid email is required");
  if (!payload.business || payload.business.trim().length < 2) errors.push("Business name is required");
  if (!payload.needs && !payload.message) errors.push("Lead need or message is required");
  // Additional checks
  if (payload.phone && !/^[\+]?[\d\s\-\(\)]{8,20}$/.test(payload.phone)) errors.push("Phone format invalid");
  if (!payload.industry) errors.push("Industry is required");
  if (!payload.budget) errors.push("Budget is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ================= NODE 3: NORMALIZE =================
function normalizeLead(payload) {
  const now = new Date();
  const lead_id = `LF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${uuidv4().slice(0, 8).toUpperCase()}`;

  const capitalize = (s) =>
    s
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const normalized = {
    lead_id,
    received_at: now.toISOString(),
    name: payload.name ? capitalize(payload.name) : "",
    business: payload.business ? payload.business.trim() : "",
    email: payload.email ? payload.email.trim().toLowerCase() : "",
    phone: payload.phone ? payload.phone.replace(/[^\d\+]/g, "").trim() : "",
    website: payload.website
      ? payload.website.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
      : "",
    industry: payload.industry ? payload.industry.trim() : "Other",
    budget: payload.budget ? payload.budget.trim() : "Unknown",
    needs: payload.needs ? payload.needs.trim() : "",
    message: payload.message ? payload.message.trim() : "",
    source: payload.source || "LeadFlow Pro Website",
    timestamp: payload.timestamp || now.toISOString(),
    raw_payload: payload,
  };

  // Generate domain from email for enrichment hint
  normalized.email_domain = normalized.email.split("@")[1] || "";
  normalized.is_business_email = !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"].includes(
    normalized.email_domain
  );

  return normalized;
}

// ================= NODE 5: AI QUALIFICATION (Heuristic + LLM-ready) =================
function aiQualifyLead(lead) {
  // This is the HEURISTIC engine that mimics LLM behavior for demo without API keys
  // In production n8n, replace with OpenAI node using prompt below

  const text = `${lead.needs} ${lead.message}`.toLowerCase();

  // Business Need detection
  let business_need = "Other";
  if (text.includes("lead") && (text.includes("generation") || text.includes("more leads") || text.includes("qualified"))) business_need = "Lead Generation";
  else if (text.includes("website") || text.includes("landing page") || text.includes("site")) business_need = "Website";
  else if (text.includes("conversion") || text.includes("cvr") || text.includes("turn visitors")) business_need = "Conversion Optimization";
  else if (text.includes("crm") || text.includes("hubspot") || text.includes("salesforce") || text.includes("pipeline")) business_need = "CRM Automation";
  else if (text.includes("ai") || text.includes("qualification") || text.includes("scoring") || text.includes("intelligence")) business_need = "AI Automation";
  else if (text.includes("follow") || text.includes("nurture") || text.includes("sequence") || text.includes("whatsapp")) business_need = "Follow-Up Automation";

  // Intent detection
  let lead_intent = "Researching";
  if (text.includes("ready to buy") || text.includes("ready to start") || text.includes("want to buy") || text.includes("need now") || text.includes("asap") || text.includes("immediately") || text.includes("urgent") || text.includes("this week") || text.includes("today")) {
    lead_intent = "Ready to Buy";
  } else if (text.includes("evaluating") || text.includes("comparing") || text.includes("options") || text.includes("proposal") || text.includes("quote") || text.includes("pricing") || text.includes("demo")) {
    lead_intent = "Evaluating";
  } else if (text.includes("interested") || text.includes("looking for") || text.includes("need help") || text.includes("improve") || text.includes("growth")) {
    lead_intent = "Interested";
  }

  // Urgency detection
  let urgency = "Low";
  if (text.includes("critical") || text.includes("emergency") || text.includes("losing") || text.includes("asap") || text.includes("immediately") || text.includes("today")) urgency = "Critical";
  else if (text.includes("urgent") || text.includes("this week") || text.includes("quickly") || text.includes("fast") || lead.budget.includes("$15k") || lead.budget.includes("$50k")) urgency = "High";
  else if (text.includes("next month") || text.includes("soon") || text.includes("interested") || lead.budget.includes("$5k")) urgency = "Medium";

  // Scoring framework (transparent, 0-100)
  let score = 0;
  const breakdown = {};

  // Budget scoring (max 35)
  if (lead.budget.includes("$50k")) { score += 35; breakdown.budget = 35; }
  else if (lead.budget.includes("$15k")) { score += 28; breakdown.budget = 28; }
  else if (lead.budget.includes("$5k")) { score += 20; breakdown.budget = 20; }
  else if (lead.budget.includes("$1k")) { score += 10; breakdown.budget = 10; }
  else { score += 5; breakdown.budget = 5; }

  // Intent scoring (max 25)
  if (lead_intent === "Ready to Buy") { score += 25; breakdown.intent = 25; }
  else if (lead_intent === "Evaluating") { score += 18; breakdown.intent = 18; }
  else if (lead_intent === "Interested") { score += 12; breakdown.intent = 12; }
  else { score += 5; breakdown.intent = 5; }

  // Urgency scoring (max 15)
  if (urgency === "Critical") { score += 15; breakdown.urgency = 15; }
  else if (urgency === "High") { score += 10; breakdown.urgency = 10; }
  else if (urgency === "Medium") { score += 6; breakdown.urgency = 6; }
  else { score += 2; breakdown.urgency = 2; }

  // Data quality (max 25)
  let quality = 0;
  if (lead.is_business_email) { quality += 8; }
  if (lead.website) { quality += 5; }
  if (lead.message && lead.message.length > 50) { quality += 7; }
  if (lead.needs && lead.needs.length > 5) { quality += 5; }
  score += quality;
  breakdown.quality = quality;

  score = Math.min(100, Math.max(0, Math.round(score)));

  // Temperature mapping (must correspond to score)
  let lead_temperature = "COLD";
  if (score >= 80) lead_temperature = "HOT";
  else if (score >= 50) lead_temperature = "WARM";

  // Recommended action
  let recommended_action = "";
  if (lead_temperature === "HOT") recommended_action = "Immediate sales outreach — call within 15 mins, send personalized proposal";
  else if (lead_temperature === "WARM") recommended_action = "Nurture sequence — send case studies, book discovery call within 48h";
  else recommended_action = "Add to newsletter & retargeting — low priority, monthly check-in";

  // Reasoning
  const reasoning = `Lead scored ${score}/100. Budget ${lead.budget} (${breakdown.budget}pts), Intent ${lead_intent} (${breakdown.intent}pts), Urgency ${urgency} (${breakdown.urgency}pts), Data quality ${quality}pts. Business need identified as ${business_need}. ${lead.is_business_email ? "Business email indicates professional buyer." : "Personal email — may need extra qualification."} ${lead.website ? "Website provided — can research before call." : "No website — ask for URL on call."}`;

  // Sales message (personalized)
  const sales_message = `Hi ${lead.name.split(" ")[0]},

Thanks for reaching out about ${business_need.toLowerCase()} for ${lead.business} — I saw you mentioned "${lead.needs || lead.message.slice(0, 80)}".

Based on what you shared, there’s a clear opportunity to ${business_need === "Lead Generation" ? "build a predictable lead engine that turns your existing traffic into qualified pipeline" : business_need === "Conversion Optimization" ? "increase your visitor-to-lead conversion without more ad spend" : business_need === "CRM Automation" ? "connect your funnel so no lead gets lost between form and sales" : "automate qualification and follow-up so your team focuses on hot opportunities"}.

We’ve helped similar ${lead.industry.toLowerCase()} companies ${lead_temperature === "HOT" ? "launch this in 7-14 days" : "map their funnel in a 30-min call and identify 3 quick wins"}.

Worth a quick 30-min strategy call this week? I can share a tailored teardown of your current flow.

Best,
Alex — LeadFlow Pro

P.S. ${urgency === "Critical" || urgency === "High" ? "Saw you need this urgently — I’ve blocked time today/tomorrow if helpful." : "No pitch, just actionable feedback you can use even if we don’t work together."}`;

  return {
    business_need,
    lead_intent,
    urgency,
    qualification_score: score,
    lead_temperature,
    recommended_action,
    reasoning,
    sales_message,
    score_breakdown: breakdown,
  };
}

// ================= NODE 6: ROUTER =================
function routeLead(qualification) {
  if (qualification.qualification_score >= 80) return "HOT";
  if (qualification.qualification_score >= 50) return "WARM";
  return "COLD";
}

// ================= NODE 7 & 8: NOTIFICATION & FOLLOW-UP =================
function generateEmailNotification(lead, qual, route) {
  const subject =
    route === "HOT"
      ? `🔥 HOT LEAD — ${lead.business} — Score ${qual.qualification_score}`
      : route === "WARM"
      ? `🟡 WARM LEAD — ${lead.business} — Score ${qual.qualification_score}`
      : `⚪ COLD LEAD — ${lead.business} — Score ${qual.qualification_score}`;

  const body = `
${subject}

Lead ID: ${lead.lead_id}
Received: ${lead.received_at}

--- CONTACT ---
Name: ${lead.name}
Business: ${lead.business}
Email: ${lead.email}
Phone: ${lead.phone}
Website: ${lead.website}
Industry: ${lead.industry}
Budget: ${lead.budget}

--- NEED ---
Focus: ${lead.needs}
Message: ${lead.message}
Source: ${lead.source}

--- AI QUALIFICATION ---
Business Need: ${qual.business_need}
Intent: ${qual.lead_intent}
Urgency: ${qual.urgency}
Score: ${qual.qualification_score}/100 (${qual.lead_temperature})
Breakdown: ${JSON.stringify(qual.score_breakdown)}

Reasoning: ${qual.reasoning}

Recommended Action: ${qual.recommended_action}

--- SALES MESSAGE PREVIEW ---
${qual.sales_message.slice(0, 400)}...

---
This is a demo notification. In production, this would be sent via SMTP to ${CONFIG.email.salesTeam}
`;

  return { subject, body, to: route === "HOT" ? CONFIG.email.salesTeam : CONFIG.email.managerEmail };
}

// ================= NODE 4: GOOGLE SHEETS (Simulated + Real Integration Ready) =================
function saveToSheets(lead, qual = null, route = null, notification = null) {
  const leads = loadJson(LEADS_FILE);

  const existingIndex = leads.findIndex((l) => l.lead_id === lead.lead_id);
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
    // Internal
    _raw: lead,
    _qual: qual,
    _route: route,
  };

  if (existingIndex >= 0) leads[existingIndex] = sheetRow;
  else leads.unshift(sheetRow);

  saveJson(LEADS_FILE, leads.slice(0, 1000));

  // If real Google Sheets enabled, this is where you'd call Sheets API
  if (CONFIG.sheets.enabled) {
    logEvent({
      lead_id: lead.lead_id,
      type: "sheets",
      node: "Google Sheets",
      message: `Would append to spreadsheet ${CONFIG.sheets.spreadsheetId} — LIVE mode`,
      level: "info",
    });
    // Example real implementation:
    // await google.sheets({version: 'v4'}).spreadsheets.values.append({...})
  }

  return sheetRow;
}

// ================= EXPRESS APP =================
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/", (req, res) => {
  res.json({
    service: "LeadFlow Automation",
    status: "running",
    version: "1.0.0",
    webhook: CONFIG.webhookPath,
    config: {
      sheets: CONFIG.sheets.enabled ? "LIVE" : "DEMO (local JSON)",
      email: CONFIG.email.enabled ? "LIVE" : "DEMO (simulated)",
      ai: CONFIG.ai.provider,
      whatsapp: CONFIG.whatsapp.enabled ? "LIVE" : "DEMO (placeholder)",
    },
    endpoints: {
      webhook: `POST ${CONFIG.webhookPath}`,
      leads: "GET /api/leads",
      logs: "GET /api/logs",
      reports: "GET /api/reports",
      dailyReport: "POST /api/daily-report",
      test: "POST /api/test/:type",
      config: "GET /api/config",
    },
  });
});

app.get("/api/config", (req, res) => res.json(CONFIG));

// ================= NODE 1: WEBHOOK =================
app.post(CONFIG.webhookPath, async (req, res) => {
  const requestId = uuidv4();
  const payload = req.body;

  logEvent({
    lead_id: requestId,
    type: "webhook",
    node: "Webhook",
    message: `Incoming lead webhook received`,
    data: { payload: Object.keys(payload) },
  });

  try {
    // NODE 2: VALIDATE
    const validation = validateLead(payload);
    if (!validation.valid) {
      logEvent({
        lead_id: requestId,
        type: "validation_failed",
        node: "Validate Lead",
        message: `Validation failed: ${validation.errors.join("; ")}`,
        level: "warn",
        data: { errors: validation.errors, payload },
      });

      // Store invalid lead for reporting
      const leads = loadJson(LEADS_FILE);
      leads.unshift({
        "Lead ID": `INVALID-${requestId.slice(0, 8)}`,
        Date: new Date().toLocaleDateString(),
        Name: payload.name || "",
        Business: payload.business || "",
        Email: payload.email || "",
        "Lead Temperature": "INVALID",
        "Qualification Score": 0,
        validation_errors: validation.errors,
        _raw: payload,
        "Created At": new Date().toISOString(),
      });
      saveJson(LEADS_FILE, leads.slice(0, 1000));

      return res.status(400).json({
        success: false,
        lead_id: requestId,
        valid: false,
        errors: validation.errors,
        message: "Lead validation failed — recorded as invalid",
      });
    }

    logEvent({
      lead_id: requestId,
      type: "validation_passed",
      node: "Validate Lead",
      message: "Lead validation passed",
      level: "info",
    });

    // NODE 3: NORMALIZE
    const normalized = normalizeLead(payload);
    logEvent({
      lead_id: normalized.lead_id,
      type: "normalized",
      node: "Normalize Data",
      message: `Lead normalized: ${normalized.name} (${normalized.email})`,
      data: { lead_id: normalized.lead_id },
    });

    // NODE 4: Initial save (before AI)
    saveToSheets(normalized);

    // NODE 5: AI QUALIFICATION
    let qualification;
    try {
      qualification = aiQualifyLead(normalized);
      logEvent({
        lead_id: normalized.lead_id,
        type: "ai_qualified",
        node: "AI Qualification",
        message: `AI qualification complete: ${qualification.business_need}, ${qualification.lead_intent}, Score ${qualification.qualification_score}, ${qualification.lead_temperature}`,
        data: qualification,
      });

      // Validate score
      if (typeof qualification.qualification_score !== "number" || qualification.qualification_score < 0 || qualification.qualification_score > 100) {
        throw new Error(`Invalid score: ${qualification.qualification_score}`);
      }
      // Validate temperature corresponds to score
      const expectedTemp = routeLead(qualification);
      if (expectedTemp !== qualification.lead_temperature) {
        logEvent({
          lead_id: normalized.lead_id,
          type: "temperature_mismatch",
          node: "AI Qualification",
          message: `Temperature mismatch: score ${qualification.qualification_score} should be ${expectedTemp} but got ${qualification.lead_temperature} — correcting`,
          level: "warn",
        });
        qualification.lead_temperature = expectedTemp;
      }
    } catch (aiErr) {
      logEvent({
        lead_id: normalized.lead_id,
        type: "ai_failed",
        node: "AI Qualification",
        message: `AI qualification failed: ${aiErr.message}`,
        level: "error",
        data: { error: aiErr.message },
      });
      // Fallback to basic scoring
      qualification = {
        business_need: "Other",
        lead_intent: "Researching",
        urgency: "Low",
        qualification_score: 45,
        lead_temperature: "COLD",
        recommended_action: "Manual review required — AI failed",
        reasoning: `AI failed, fallback scoring applied: ${aiErr.message}`,
        sales_message: `Hi ${normalized.name}, thanks for reaching out — we'll review and get back to you shortly.`,
        score_breakdown: { fallback: 45 },
      };
    }

    // NODE 6: ROUTER
    const route = routeLead(qualification);
    logEvent({
      lead_id: normalized.lead_id,
      type: "routed",
      node: "Hot/Warm/Cold Router",
      message: `Lead routed to ${route} path (score ${qualification.qualification_score})`,
      data: { route, score: qualification.qualification_score },
    });

    // NODE 7: EMAIL NOTIFICATION
    let notification = null;
    if (route !== "COLD") {
      notification = generateEmailNotification(normalized, qualification, route);
      logEvent({
        lead_id: normalized.lead_id,
        type: "notification_sent",
        node: "Email Notification",
        message: `Notification prepared for ${route} lead: ${notification.subject} → ${notification.to} [${CONFIG.email.enabled ? "LIVE" : "DEMO"}]`,
        data: { subject: notification.subject, to: notification.to, mode: CONFIG.email.enabled ? "LIVE" : "DEMO" },
      });
      if (CONFIG.email.enabled) {
        // Real email sending would happen here via nodemailer
        // await transporter.sendMail({...})
      }
    } else {
      logEvent({
        lead_id: normalized.lead_id,
        type: "notification_suppressed",
        node: "Email Notification",
        message: `Notification suppressed for COLD lead (score ${qualification.qualification_score})`,
        level: "info",
      });
    }

    // NODE 8 & 9: FOLLOW-UP
    const followUpStatus = route === "HOT" ? "Immediate outreach required" : route === "WARM" ? "Nurture sequence queued" : "Newsletter only";
    logEvent({
      lead_id: normalized.lead_id,
      type: "follow_up_generated",
      node: "Follow-Up Generation",
      message: `Follow-up message generated (${qualification.sales_message.length} chars) — status: ${followUpStatus}`,
      data: { mode: CONFIG.email.enabled ? "LIVE" : "DEMO", whatsapp: CONFIG.whatsapp.enabled ? "LIVE" : "DEMO" },
    });

    // Final save to sheets with AI results
    const finalRow = saveToSheets(normalized, qualification, route, notification);

    // NODE 10: Success logging
    logEvent({
      lead_id: normalized.lead_id,
      type: "workflow_completed",
      node: "Workflow Complete",
      message: `Workflow completed successfully: ${normalized.name} → ${route} (${qualification.qualification_score})`,
      level: "info",
      data: { lead_id: normalized.lead_id, route, score: qualification.qualification_score },
    });

    return res.json({
      success: true,
      lead_id: normalized.lead_id,
      valid: true,
      normalized,
      qualification,
      route,
      notification: notification ? { subject: notification.subject, to: notification.to, mode: CONFIG.email.enabled ? "LIVE" : "DEMO" } : null,
      follow_up: {
        message: qualification.sales_message,
        status: followUpStatus,
        delivery: {
          email: CONFIG.email.enabled ? "LIVE" : "DEMO — simulated",
          whatsapp: CONFIG.whatsapp.enabled ? "LIVE" : "DEMO — placeholder",
          crm: "DEMO — placeholder for HubSpot/Salesforce",
          slack: "DEMO — placeholder",
        },
      },
      sheets: {
        mode: CONFIG.sheets.enabled ? "LIVE" : "DEMO — local JSON",
        row: finalRow,
      },
      message: "Lead processed successfully through full automation pipeline",
    });
  } catch (err) {
    logEvent({
      lead_id: requestId,
      type: "workflow_error",
      node: "Error Handler",
      message: `Workflow error: ${err.message}`,
      level: "error",
      data: { stack: err.stack, payload },
    });
    return res.status(500).json({
      success: false,
      lead_id: requestId,
      error: err.message,
      message: "Automation workflow failed — check logs",
    });
  }
});

// ================= API: LEADS, LOGS, REPORTS =================
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

// ================= NODE 11: DAILY REPORT =================
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
    highest_scoring_lead: highest
      ? { name: highest.Name, business: highest.Business, score: highest["Qualification Score"], temperature: highest["Lead Temperature"] }
      : null,
    most_common_business_need: mostCommonNeed,
    most_common_industry: mostCommonIndustry,
    leads_requiring_immediate_action: hot.map((h) => ({ name: h.Name, business: h.Business, score: h["Qualification Score"] })),
    follow_ups_sent: followUpsSent,
    failed_automations: failed,
    breakdown: { needs, industries },
    raw_leads: todayLeads,
  };

  const reports = loadJson(REPORTS_FILE);
  reports.unshift(report);
  saveJson(REPORTS_FILE, reports.slice(0, 100));

  logEvent({
    lead_id: "system",
    type: "daily_report_generated",
    node: "Daily Reporting",
    message: `Daily report generated for ${today}: ${todayLeads.length} leads, ${hot.length} hot, avg score ${avgScore}`,
    data: { date: today, total: todayLeads.length, hot: hot.length },
  });

  return report;
}

app.post("/api/daily-report", (req, res) => {
  const report = generateDailyReport();
  // In LIVE mode, would send email here
  logEvent({
    lead_id: "system",
    type: "daily_report_emailed",
    node: "Daily Reporting",
    message: `Daily report email would be sent to ${CONFIG.email.managerEmail} [${CONFIG.email.enabled ? "LIVE" : "DEMO"}]`,
    data: { to: CONFIG.email.managerEmail, mode: CONFIG.email.enabled ? "LIVE" : "DEMO" },
  });
  res.json({ success: true, report, email: { to: CONFIG.email.managerEmail, subject: `LeadFlow Daily Report — ${report.date}`, mode: CONFIG.email.enabled ? "LIVE" : "DEMO" } });
});

app.get("/api/daily-report", (req, res) => {
  const report = generateDailyReport();
  res.json(report);
});

// ================= TEST PAYLOADS =================
app.post("/api/test/:type", (req, res) => {
  const type = req.params.type;
  const payloads = {
    hot: {
      name: "Sarah Chen",
      business: "Atlas Labs",
      email: "sarah@atlaslabs.io",
      phone: "+14155552671",
      website: "atlaslabs.io",
      industry: "B2B SaaS",
      budget: "$15k - $50k",
      needs: "Ready to Buy",
      message: "We need to fix our follow-up ASAP. We're losing hot leads, need CRM automation and AI qualification immediately. Ready to start this week, budget approved.",
      source: "LeadFlow Pro Website",
      timestamp: new Date().toISOString(),
    },
    warm: {
      name: "Marcus Reid",
      business: "Pulse Agency",
      email: "marcus@pulseagency.co",
      phone: "+14155552672",
      website: "pulseagency.co",
      industry: "Agency / Services",
      budget: "$5k - $15k",
      needs: "Conversion Optimization",
      message: "Interested in improving our landing page conversion. We're evaluating a few agencies and comparing options. Looking to improve next month.",
      source: "LeadFlow Pro Website",
      timestamp: new Date().toISOString(),
    },
    cold: {
      name: "John Smith",
      business: "Test Ventures",
      email: "john@gmail.com",
      phone: "+14155552673",
      website: "",
      industry: "Other",
      budget: "Less than $1k",
      needs: "Lead Generation",
      message: "Just researching lead gen options for future.",
      source: "LeadFlow Pro Website",
      timestamp: new Date().toISOString(),
    },
    invalid: {
      name: "",
      business: "",
      email: "not-an-email",
      phone: "123",
      industry: "",
      budget: "",
      needs: "",
      message: "",
      source: "LeadFlow Pro Website",
      timestamp: new Date().toISOString(),
    },
  };

  const payload = payloads[type] || payloads.hot;
  // Forward to webhook internally
  fetch(`http://localhost:${CONFIG.port}${CONFIG.webhookPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then((data) => res.json({ test_type: type, payload, result: data }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// ================= START =================
app.listen(CONFIG.port, "0.0.0.0", () => {
  console.log(`\n🚀 LeadFlow Automation running on http://0.0.0.0:${CONFIG.port}`);
  console.log(`📥 Webhook: POST http://localhost:${CONFIG.port}${CONFIG.webhookPath}`);
  console.log(`📊 Dashboard API: http://localhost:${CONFIG.port}/api/leads`);
  console.log(`\n⚙️  Config:`);
  console.log(`   Sheets: ${CONFIG.sheets.enabled ? "LIVE" : "DEMO (local JSON)"}`);
  console.log(`   Email: ${CONFIG.email.enabled ? "LIVE" : "DEMO (simulated)"}`);
  console.log(`   AI: ${CONFIG.ai.provider}`);
  console.log(`   WhatsApp: ${CONFIG.whatsapp.enabled ? "LIVE" : "DEMO (placeholder)"}`);
  console.log(`\n🧪 Test endpoints:`);
  console.log(`   POST /api/test/hot | /warm | /cold | /invalid`);
  console.log(`   POST /api/daily-report to trigger daily report\n`);
});
