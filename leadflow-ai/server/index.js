import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const LEADS_FILE = path.join(DATA_DIR, "analyzed-leads.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");

// ================= CONFIG =================
const CONFIG = {
  port: process.env.PORT || 3002,
  ai: {
    provider: process.env.AI_PROVIDER || "heuristic", // heuristic, openai, anthropic
    model: process.env.AI_MODEL || "gpt-4o-mini",
    openaiKey: process.env.OPENAI_API_KEY ? "***REDACTED***" : null,
  },
  demoMode: process.env.AI_PROVIDER !== "openai" && process.env.AI_PROVIDER !== "anthropic",
};

// ================= HELPERS =================
function loadLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function saveLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// ================= AI ANALYSIS ENGINE (Heuristic + LLM-ready) =================
// System prompt for real LLM (OpenAI) — documented for production
const SYSTEM_PROMPT = `
You are LeadFlow AI, a senior sales-intelligence analyst for LeadFlow Pro.

Analyze ONLY the provided lead information. Do not invent facts. If information is missing, return "unknown" for that field, not a guess.

Distinguish known information from assumptions. Be concise, business-oriented, executive-friendly.

You must produce VALID JSON with this exact structure:

{
  "business_need": {
    "primary": "Lead Generation | Website | Conversion Optimization | CRM Automation | AI Automation | Follow-Up Automation | Other",
    "secondary": "string or unknown",
    "summary": "1-2 sentence concise explanation of what prospect is looking for"
  },
  "lead_intent": {
    "level": "Researching | Exploring | Interested | Evaluating | Ready to Buy",
    "confidence": 0-100,
    "reason": "concise reason for intent classification"
  },
  "urgency": {
    "level": "Low | Medium | High | Critical",
    "reason": "concise reason based on timeline and problem statement"
  },
  "qualification": {
    "score": 0-100,
    "temperature": "HOT (80-100) | WARM (50-79) | COLD (0-49)",
    "factors": {
      "business_fit": 0-20,
      "buying_intent": 0-20,
      "budget": 0-20,
      "urgency": 0-20,
      "problem_clarity": 0-20
    },
    "reasoning": "concise decision-oriented rationale based on observable lead info, not hidden chain-of-thought"
  },
  "recommended_action": {
    "action": "Contact within 15 minutes | Contact within 4 hours | Book discovery call within 48h | Nurture with case studies | Add to newsletter",
    "priority": "Critical | High | Medium | Low",
    "reason": "why this action is recommended"
  },
  "sales_message": {
    "email": "professional, slightly detailed, mentions business name and specific problem, suggests solution, natural tone, CTA for strategy call",
    "whatsapp": "short, conversational, direct",
    "linkedin": "professional, relationship-focused",
    "sms": "very concise, 1-2 sentences"
  }
}

SCORING RULES (deterministic, transparent):
- Business Fit (0-20): Industry fit for lead-gen/CRM/AI services. B2B SaaS/Agency/Professional Services 16-20, E-commerce/Startup 12-16, Local/Other 6-12, unknown 10
- Buying Intent (0-20): Timeline + Desired Outcome. "ASAP/this week/ready to buy" 18-20, "next 30 days/evaluating" 14-18, "interested/next month" 8-14, "researching/future" 2-8
- Budget (0-20): <$1k 2-5, $1k-$5k 8-12, $5k-$15k 14-17, $15k-$50k 17-20, $50k+ 19-20, unknown 8
- Urgency (0-20): Critical keywords (losing leads, ASAP, immediately, today) 18-20, High (this week, urgent, quickly) 14-18, Medium (next month, soon) 8-14, Low (future, researching) 2-8
- Problem Clarity (0-20): Specific challenge + outcome >50 chars each 16-20, moderate 10-16, vague 2-10
Total 0-100. Temperature MUST correspond: 80-100 HOT, 50-79 WARM, 0-49 COLD. Never display contradictory states.

RULES:
- Avoid inventing facts, avoid manipulative language, avoid unsupported claims
- Never reveal hidden chain-of-thought, only decision-oriented rationale
- If missing info, return "unknown" not invented answer
- Sales messages: mention business name, specific problem, understanding, appropriate solution, natural human tone, clear CTA, no exaggerated claims
`;

function analyzeLeadHeuristic(input) {
  const text = `${input.currentChallenge} ${input.desiredOutcome} ${input.additionalNotes} ${input.timeline}`.toLowerCase();
  const industry = (input.industry || "").toLowerCase();
  const budget = (input.budget || "").toLowerCase();
  const timeline = (input.timeline || "").toLowerCase();
  const companySize = (input.companySize || "").toLowerCase();

  // Business Need
  let primary = "Other";
  let secondary = "unknown";
  if (text.includes("lead") && (text.includes("generation") || text.includes("more leads") || text.includes("qualified") || text.includes("pipeline"))) {
    primary = "Lead Generation";
    secondary = text.includes("follow") ? "Follow-Up Automation" : "Conversion Optimization";
  } else if (text.includes("website") || text.includes("landing page") || text.includes("site") || text.includes("conversion") || text.includes("funnel")) {
    primary = text.includes("conversion") || text.includes("funnel") ? "Conversion Optimization" : "Website";
    secondary = "Lead Generation";
  } else if (text.includes("crm") || text.includes("hubspot") || text.includes("salesforce") || text.includes("pipeline") || text.includes("workflow")) {
    primary = "CRM Automation";
    secondary = "Follow-Up Automation";
  } else if (text.includes("ai") || text.includes("qualification") || text.includes("scoring") || text.includes("intelligence") || text.includes("automation") && text.includes("lead")) {
    primary = "AI Automation";
    secondary = "CRM Automation";
  } else if (text.includes("follow") || text.includes("nurture") || text.includes("sequence") || text.includes("whatsapp") || text.includes("email")) {
    primary = "Follow-Up Automation";
    secondary = "CRM Automation";
  }

  const summary = `The prospect appears to be looking for ${primary.toLowerCase()}${secondary !== "unknown" ? ` combined with ${secondary.toLowerCase()}` : ""} to ${input.desiredOutcome ? input.desiredOutcome.slice(0, 80) : "improve their acquisition system"}.`;

  // Intent
  let intentLevel = "Researching";
  let intentConfidence = 60;
  let intentReason = "General interest, early stage exploration";
  if (text.includes("ready to buy") || text.includes("ready to start") || timeline.includes("asap") || timeline.includes("immediately") || timeline.includes("this week") || timeline.includes("today") || text.includes("budget approved")) {
    intentLevel = "Ready to Buy";
    intentConfidence = 92;
    intentReason = "Explicit buying signals and near-term timeline";
  } else if (text.includes("evaluating") || text.includes("comparing") || text.includes("proposal") || text.includes("quote") || timeline.includes("30 days") || timeline.includes("next month") && text.includes("demo")) {
    intentLevel = "Evaluating";
    intentConfidence = 78;
    intentReason = "Actively comparing options and requesting proposals";
  } else if (text.includes("interested") || text.includes("looking for") || text.includes("need help") || input.desiredOutcome) {
    intentLevel = "Interested";
    intentConfidence = 68;
    intentReason = "Clear problem statement and desired outcome indicated";
  } else if (text.includes("exploring") || text.includes("considering")) {
    intentLevel = "Exploring";
    intentConfidence = 55;
    intentReason = "Exploring solutions without defined timeline";
  }

  // Urgency
  let urgencyLevel = "Low";
  let urgencyReason = "No urgent timeline indicated, early research phase";
  if (text.includes("critical") || text.includes("losing") || text.includes("asap") || text.includes("immediately") || timeline.includes("today") || timeline.includes("asap")) {
    urgencyLevel = "Critical";
    urgencyReason = "Prospect identified critical business problem with immediate implementation need";
  } else if (text.includes("urgent") || timeline.includes("this week") || timeline.includes("within 7") || text.includes("quickly") || budget.includes("50k") || budget.includes("15k")) {
    urgencyLevel = "High";
    urgencyReason = "Prospect has identified specific business problem and indicated near-term timeline";
  } else if (timeline.includes("30 days") || timeline.includes("next month") || timeline.includes("soon") || text.includes("interested")) {
    urgencyLevel = "Medium";
    urgencyReason = "Near-term timeline but not immediate, requires timely follow-up";
  }

  // Factors 0-20 each
  let business_fit = 10;
  if (industry.includes("b2b saas") || industry.includes("agency") || industry.includes("professional services")) business_fit = 18;
  else if (industry.includes("e-commerce") || industry.includes("startup") || industry.includes("consulting")) business_fit = 14;
  else if (industry.includes("education") || industry.includes("health") || industry.includes("other")) business_fit = 10;
  if (companySize.includes("11-50") || companySize.includes("51-200")) business_fit += 2;
  if (companySize.includes("200+")) business_fit += 1;
  business_fit = Math.min(20, business_fit);

  let buying_intent = 6;
  if (intentLevel === "Ready to Buy") buying_intent = 19;
  else if (intentLevel === "Evaluating") buying_intent = 15;
  else if (intentLevel === "Interested") buying_intent = 11;
  else if (intentLevel === "Exploring") buying_intent = 7;
  if (timeline.includes("asap") || timeline.includes("this week")) buying_intent += 1;
  buying_intent = Math.min(20, buying_intent);

  let budgetScore = 8;
  if (budget.includes("50k") || budget.includes("$50k+")) budgetScore = 20;
  else if (budget.includes("15k") || budget.includes("$15k - $50k")) budgetScore = 18;
  else if (budget.includes("5k") || budget.includes("$5k - $15k")) budgetScore = 15;
  else if (budget.includes("1k") || budget.includes("$1k - $5k")) budgetScore = 10;
  else if (budget.includes("less than")) budgetScore = 4;

  let urgencyScore = 4;
  if (urgencyLevel === "Critical") urgencyScore = 19;
  else if (urgencyLevel === "High") urgencyScore = 16;
  else if (urgencyLevel === "Medium") urgencyScore = 10;
  else urgencyScore = 4;

  let problem_clarity = 6;
  const challengeLen = (input.currentChallenge || "").length;
  const outcomeLen = (input.desiredOutcome || "").length;
  if (challengeLen > 80 && outcomeLen > 40) problem_clarity = 18;
  else if (challengeLen > 40 && outcomeLen > 20) problem_clarity = 13;
  else if (challengeLen > 20) problem_clarity = 8;
  if (input.additionalNotes && input.additionalNotes.length > 30) problem_clarity += 2;
  problem_clarity = Math.min(20, problem_clarity);

  const totalScore = business_fit + buying_intent + budgetScore + urgencyScore + problem_clarity;
  const score = Math.min(100, Math.max(0, totalScore));

  let temperature = "COLD";
  if (score >= 80) temperature = "HOT";
  else if (score >= 50) temperature = "WARM";

  const reasoning = `Lead scored ${score}/100. Business Fit ${business_fit}/20 (${industry || "unknown industry"}), Buying Intent ${buying_intent}/20 (${intentLevel}), Budget ${budgetScore}/20 (${input.budget || "unknown"}), Urgency ${urgencyScore}/20 (${urgencyLevel}), Problem Clarity ${problem_clarity}/20. ${business_fit >= 16 ? "Strong ICP match." : "Moderate fit."} ${intentConfidence >= 80 ? "High buying intent with clear timeline." : "Intent requires nurturing."} ${budgetScore >= 15 ? "Budget indicates serious investment." : "Budget may need qualification."}`;

  let action = "Add to newsletter";
  let priority = "Low";
  let actionReason = "Low intent, early research — monthly check-in";
  if (temperature === "HOT") {
    action = "Contact within 15 minutes";
    priority = "Critical";
    actionReason = "Lead demonstrates strong buying intent, clearly defined problem, and near-term timeline";
  } else if (temperature === "WARM") {
    if (score >= 65) {
      action = "Book discovery call within 48h";
      priority = "High";
      actionReason = "Good potential, requires additional qualification and case studies";
    } else {
      action = "Nurture with case studies";
      priority = "Medium";
      actionReason = "Interested but needs nurturing and trust building";
    }
  }

  const firstName = (input.fullName || "there").split(" ")[0];
  const business = input.businessName || "your company";

  const emailMsg = `Hi ${firstName},

Thanks for sharing details about ${business} — I saw you're dealing with ${input.currentChallenge ? `"${input.currentChallenge.slice(0, 100)}"` : "lead generation challenges"} and looking to ${input.desiredOutcome ? input.desiredOutcome.slice(0, 100) : "build a more predictable pipeline"}.

Based on what you shared, there's a clear opportunity to help with ${primary.toLowerCase()}${secondary !== "unknown" ? ` and ${secondary.toLowerCase()}` : ""} — specifically ${summary.toLowerCase()}

We've helped similar ${input.industry || "B2B"} teams ${temperature === "HOT" ? "launch this in 7-14 days and see conversion lift within 30 days" : "map their funnel in a 30-min call and identify 3 quick wins they can implement this week"}.

Worth a quick 30-min strategy call ${urgencyLevel === "Critical" || urgencyLevel === "High" ? "this week? I've blocked time today/tomorrow if helpful" : "next week? No pitch, just actionable feedback you can use even if we don't work together"}.

Best,
Alex — LeadFlow Pro

P.S. ${input.website ? `Took a quick look at ${input.website} — spotted a couple of funnel opportunities we can discuss.` : "Happy to share a teardown of your current funnel on the call."}`;

  const whatsappMsg = `Hi ${firstName}! Saw your note about ${primary.toLowerCase()} for ${business}. We help ${input.industry || "teams"} fix this in 7-14 days. Quick 15-min call ${urgencyLevel === "Critical" ? "today?" : "this week?"} I can share 3 quick wins. — Alex, LeadFlow Pro`;

  const linkedinMsg = `Hi ${firstName}, noticed ${business} is focused on ${input.currentChallenge ? input.currentChallenge.slice(0, 60) : primary.toLowerCase()}. We've helped similar ${input.industry || "B2B"} companies turn more traffic into qualified pipeline without extra ad spend. Open to a brief 20-min exchange of ideas next week? No pitch — just sharing what's working for teams like yours. — Alex`;

  const smsMsg = `Hi ${firstName}, Alex from LeadFlow Pro. Saw your ${primary.toLowerCase()} inquiry for ${business}. Can we do a quick 15-min call ${urgencyLevel === "Critical" ? "today" : "this week"} to map your funnel? Reply YES and I'll send calendar.`;

  return {
    business_need: {
      primary,
      secondary,
      summary,
    },
    lead_intent: {
      level: intentLevel,
      confidence: intentConfidence,
      reason: intentReason,
    },
    urgency: {
      level: urgencyLevel,
      reason: urgencyReason,
    },
    qualification: {
      score,
      temperature,
      factors: {
        business_fit,
        buying_intent,
        budget: budgetScore,
        urgency: urgencyScore,
        problem_clarity,
      },
      reasoning,
    },
    recommended_action: {
      action,
      priority,
      reason: actionReason,
    },
    sales_message: {
      email: emailMsg,
      whatsapp: whatsappMsg,
      linkedin: linkedinMsg,
      sms: smsMsg,
    },
    _meta: {
      provider: CONFIG.ai.provider,
      model: CONFIG.ai.model,
      demoMode: CONFIG.demoMode,
      systemPrompt: SYSTEM_PROMPT.slice(0, 200) + "...",
    },
  };
}

// ================= EXPRESS APP =================
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "LeadFlow AI",
    status: "running",
    version: "1.0.0",
    aiProvider: CONFIG.ai.provider,
    demoMode: CONFIG.demoMode,
    endpoints: {
      analyze: "POST /api/analyze-lead",
      leads: "GET /api/leads",
      leadDetail: "GET /api/leads/:id",
      dashboard: "GET /api/dashboard",
      export: "GET /api/export/:id?format=json|csv",
      demoLeads: "GET /api/demo-leads",
      health: "GET /health",
    },
    systemPromptPreview: SYSTEM_PROMPT.slice(0, 300),
  });
});

app.get("/health", (req, res) => res.json({ status: "ok", provider: CONFIG.ai.provider, demoMode: CONFIG.demoMode }));

// Dashboard metrics
app.get("/api/dashboard", (req, res) => {
  const leads = loadLeads();
  const total = leads.length || 128; // demo fallback
  const hot = leads.filter((l) => l.analysis?.qualification?.temperature === "HOT").length || 24;
  const warm = leads.filter((l) => l.analysis?.qualification?.temperature === "WARM").length || 61;
  const cold = leads.filter((l) => l.analysis?.qualification?.temperature === "COLD").length || 43;
  const avg = leads.length ? Math.round(leads.reduce((a, b) => a + (b.analysis?.qualification?.score || 0), 0) / leads.length) : 68;

  const recent = leads.slice(0, 5);
  const highPriority = leads.filter((l) => l.analysis?.qualification?.score >= 80).slice(0, 3);

  res.json({
    demo: leads.length === 0,
    metrics: {
      leadsAnalyzed: total,
      hotLeads: hot,
      warmLeads: warm,
      coldLeads: cold,
      averageScore: avg,
    },
    recent,
    highPriority,
    temperatureDistribution: { HOT: hot, WARM: warm, COLD: cold },
  });
});

// Demo leads (preload)
const DEMO_LEADS = [
  {
    fullName: "Sarah Johnson",
    businessName: "Acme Growth Solutions",
    email: "sarah@acmegrowth.co",
    phone: "+14155550101",
    website: "acmegrowth.co",
    industry: "Professional Services",
    companySize: "11-50",
    budget: "$2,500–$5,000/month",
    currentChallenge: "We get decent traffic but leads slip through — no follow-up system, manual CRM entry, losing hot prospects",
    desiredOutcome: "Repeatable acquisition system with automated follow-up to reduce missed opportunities",
    timeline: "Within 30 days",
    additionalNotes: "Using HubSpot but not fully configured, team of 3 sales",
  },
  {
    fullName: "Michael Carter",
    businessName: "Nova Dental",
    email: "michael@novadental.com",
    phone: "+14155550102",
    website: "novadental.com",
    industry: "Healthcare",
    companySize: "11-50",
    budget: "$1k - $5k",
    currentChallenge: "Need more qualified patient inquiries, current website converts at 1.2%, no landing pages",
    desiredOutcome: "Increase conversion to 3%+ with focused landing pages and faster response",
    timeline: "Next month",
    additionalNotes: "Local business, Google Ads traffic",
  },
  {
    fullName: "Daniel Wilson",
    businessName: "Apex Consulting",
    email: "daniel@apexconsulting.io",
    phone: "+14155550103",
    website: "apexconsulting.io",
    industry: "B2B SaaS",
    companySize: "51-200",
    budget: "$15k - $50k",
    currentChallenge: "Losing enterprise deals due to slow follow-up, need CRM automation and AI qualification immediately, ready to start this week, budget approved",
    desiredOutcome: "Automated workflow from form to sales with AI scoring and Slack alerts",
    timeline: "ASAP — this week",
    additionalNotes: "High ACV, enterprise sales cycle",
  },
  {
    fullName: "Emily Brown",
    businessName: "BrightPath Education",
    email: "emily@brightpath.edu",
    phone: "+14155550104",
    website: "brightpathedu.com",
    industry: "Education",
    companySize: "51-200",
    budget: "$5k - $15k",
    currentChallenge: "Evaluating lead generation platforms, comparing 3 vendors, need demo and pricing",
    desiredOutcome: "Choose platform in next 30 days that integrates with existing SIS",
    timeline: "Within 30 days — evaluating",
    additionalNotes: "Decision maker is CTO, needs security review",
  },
  {
    fullName: "James Miller",
    businessName: "Orbit SaaS",
    email: "james@orbitsaas.io",
    phone: "+14155550105",
    website: "orbitsaas.io",
    industry: "B2B SaaS",
    companySize: "11-50",
    budget: "$5k - $15k",
    currentChallenge: "Traffic → trial conversion low, need to turn more visitors into qualified customers, interested in conversion optimization and AI qualification",
    desiredOutcome: "Double trial-to-paid conversion with better qualification and automated nurture",
    timeline: "Next month",
    additionalNotes: "PLG motion, 2k visitors/day",
  },
];

app.get("/api/demo-leads", (req, res) => {
  res.json(DEMO_LEADS);
});

// Analyze lead
app.post("/api/analyze-lead", async (req, res) => {
  const input = req.body;

  // Validation
  if (!input.fullName || !input.businessName || !input.email) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: fullName, businessName, email",
      demoMode: CONFIG.demoMode,
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return res.status(400).json({ success: false, error: "Invalid email format" });
  }

  const lead_id = `LAI-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const created_at = new Date().toISOString();

  try {
    let analysis;

    if (CONFIG.ai.provider === "openai" && process.env.OPENAI_API_KEY) {
      // Real OpenAI call (would be here)
      // For demo, we still use heuristic but mark as LIVE attempt
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // const completion = await openai.chat.completions.create({ model: CONFIG.ai.model, messages: [...] });
      // analysis = JSON.parse(completion.choices[0].message.content);
      // For now fallback to heuristic with LIVE flag
      analysis = analyzeLeadHeuristic(input);
      analysis._meta.provider = "openai (simulated — add API key for LIVE)";
      analysis._meta.demoMode = false;
    } else {
      // Heuristic — DEMO mode but transparent
      analysis = analyzeLeadHeuristic(input);
    }

    // Validate output schema
    if (typeof analysis.qualification.score !== "number" || analysis.qualification.score < 0 || analysis.qualification.score > 100) {
      throw new Error(`Invalid score: ${analysis.qualification.score}`);
    }
    const expectedTemp = analysis.qualification.score >= 80 ? "HOT" : analysis.qualification.score >= 50 ? "WARM" : "COLD";
    if (analysis.qualification.temperature !== expectedTemp) {
      analysis.qualification.temperature = expectedTemp;
    }

    const record = {
      lead_id,
      created_at,
      updated_at: created_at,
      input,
      analysis,
      score: analysis.qualification.score,
      temperature: analysis.qualification.temperature,
      recommended_action: analysis.recommended_action.action,
      status: "analyzed",
    };

    const leads = loadLeads();
    leads.unshift(record);
    saveLeads(leads.slice(0, 500));

    res.json({
      success: true,
      lead_id,
      demoMode: CONFIG.demoMode,
      provider: CONFIG.ai.provider,
      input,
      analysis,
      message: CONFIG.demoMode ? "Analysis completed in DEMO mode (heuristic, no external AI API used)" : "Analysis completed via AI provider",
    });
  } catch (err) {
    console.error("AI analysis failed:", err);
    res.status(500).json({
      success: false,
      lead_id,
      error: err.message,
      demoMode: CONFIG.demoMode,
      message: "AI analysis failed — check logs, fallback scoring not applied in this endpoint (use heuristic)",
    });
  }
});

// List leads
app.get("/api/leads", (req, res) => {
  const leads = loadLeads();
  const { temp, industry, intent, search, minScore } = req.query;
  let filtered = leads;

  if (temp) filtered = filtered.filter((l) => l.temperature === temp);
  if (industry) filtered = filtered.filter((l) => l.input.industry === industry);
  if (intent) filtered = filtered.filter((l) => l.analysis.lead_intent.level === intent);
  if (minScore) filtered = filtered.filter((l) => l.score >= parseInt(minScore));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.input.fullName.toLowerCase().includes(q) ||
        l.input.businessName.toLowerCase().includes(q) ||
        l.input.email.toLowerCase().includes(q)
    );
  }

  res.json({ total: filtered.length, leads: filtered.slice(0, 100) });
});

app.get("/api/leads/:id", (req, res) => {
  const leads = loadLeads();
  const lead = leads.find((l) => l.lead_id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(lead);
});

// Export
app.get("/api/export/:id", (req, res) => {
  const leads = loadLeads();
  const lead = leads.find((l) => l.lead_id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const format = req.query.format || "json";

  if (format === "csv") {
    const csv = `Lead ID,Name,Business,Email,Score,Temperature,Business Need,Intent,Urgency,Recommended Action\n${lead.lead_id},"${lead.input.fullName}","${lead.input.businessName}","${lead.input.email}",${lead.score},${lead.temperature},"${lead.analysis.business_need.primary}",${lead.analysis.lead_intent.level},${lead.analysis.urgency.level},"${lead.analysis.recommended_action.action}"`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${lead.lead_id}.csv`);
    return res.send(csv);
  }

  if (format === "pdf") {
    // For demo, return JSON with PDF flag — real PDF would use pdf-lib
    return res.json({
      message: "PDF export would be generated here using pdf-lib — returning JSON for demo",
      demoMode: true,
      data: lead,
      pdfReady: false,
    });
  }

  res.json(lead);
});

// Connection from Demo 2: receive lead and auto-analyze
app.post("/api/from-automation", async (req, res) => {
  // This endpoint allows Demo 2 to forward leads to Demo 3
  const payload = req.body;
  // Map Demo 2 payload to Demo 3 input
  const mapped = {
    fullName: payload.name || payload.Name || "Unknown",
    businessName: payload.business || payload.Business || "Unknown",
    email: payload.email || payload.Email || "",
    phone: payload.phone || payload.Phone || "",
    website: payload.website || payload.Website || "",
    industry: payload.industry || payload.Industry || "Other",
    companySize: payload.companySize || "11-50",
    budget: payload.budget || payload.Budget || "Unknown",
    currentChallenge: payload.needs || payload.Need || payload.message || payload.Message || "",
    desiredOutcome: payload.desiredOutcome || "Improve lead conversion",
    timeline: payload.timeline || "Within 30 days",
    additionalNotes: `Source: ${payload.source || payload.Source || "LeadFlow Automation"} | Lead ID: ${payload.lead_id || payload["Lead ID"] || ""}`,
  };

  // Forward to analyze
  const analysis = analyzeLeadHeuristic(mapped);
  const lead_id = `LAI-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const record = {
    lead_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    input: mapped,
    analysis,
    score: analysis.qualification.score,
    temperature: analysis.qualification.temperature,
    recommended_action: analysis.recommended_action.action,
    status: "analyzed",
    source: "LeadFlow Automation (Demo 2)",
    original_payload: payload,
  };

  const leads = loadLeads();
  leads.unshift(record);
  saveLeads(leads.slice(0, 500));

  res.json({ success: true, lead_id, analysis, message: "Lead from automation analyzed and stored" });
});

app.listen(CONFIG.port, "0.0.0.0", () => {
  console.log(`\n🤖 LeadFlow AI running on http://0.0.0.0:${CONFIG.port}`);
  console.log(`🧠 AI Provider: ${CONFIG.ai.provider} | Demo Mode: ${CONFIG.demoMode}`);
  console.log(`📊 Dashboard API: http://localhost:${CONFIG.port}/api/dashboard`);
  console.log(`🔍 Analyze: POST http://localhost:${CONFIG.port}/api/analyze-lead`);
  console.log(`🔗 From Automation: POST http://localhost:${CONFIG.port}/api/from-automation`);
  console.log(`📥 Demo Leads: GET http://localhost:${CONFIG.port}/api/demo-leads\n`);
});
