# LeadFlow Pro — 3-Demo Proof Machine

**Purpose:** Demonstrate technical implementation capability to prospective digital, marketing, web, AI, automation, CRM, and lead-generation agencies.

**Company:** LeadFlow Pro — Fictional B2B lead-generation and growth company — Tagline "Turn More Traffic Into Qualified Customers."

**All demos are clearly labeled as fictional demonstrations, no fake client claims.**

---

## Architecture — 3-Piece Ecosystem

```
DEMO 1: Front-end Capability (5173)
LeadFlow Pro Website — Conversion-focused business website
    |
    | POST /leadflow/new-lead (webhook)
    v
DEMO 2: Technical Automation Capability (3001 + 5174)
LeadFlow Automation — n8n-style pipeline
Webhook → Validate → Normalize → Sheets → AI Qualification → Score → HOT/WARM/COLD → Email → Follow-Up → Daily Report
    |
    | POST /api/from-automation
    v
DEMO 3: AI Capability (3002 + 5175)
LeadFlow AI — AI-Powered Lead Intelligence
Lead Info → AI Analysis → Business Need → Intent → Urgency → Score → Recommended Action → Sales Message
    |
    v
Sales Team Dashboard — Who, What Need, How Likely, How Urgent, What To Do Next
```

---

## DEMO 1 — Agency-Quality Business Website (Port 5173)

**Folder:** `/home/user/leadflow-pro`
**Live:** https://5173-...e2b.app
**Stack:** React + TypeScript + Tailwind v4 + Vite + lucide-react

**Sections:** Navigation, Hero with dashboard visual, Trust (2,500+ Leads, 38% Lift, 24/7 Follow-up, 4.8/5 Satisfaction — labeled demo), Services (6 cards), How It Works (4 steps), Lead Capture (9 fields, validation, loading/success/error, payload ready for POST /api/leads), Results (3 case studies with before/after), Booking (date selector, time slots, IST, confirmation), WhatsApp CTA (configurable number), FAQ (8 questions accordion), Contact, Footer

**Key Features:**
- Lead form payload: `{name, business, email, phone, website, industry, budget, needs, message, timestamp, source}`
- Webhook ready: `VITE_LEAD_WEBHOOK_URL=http://localhost:3001/leadflow/new-lead` — now LIVE connected to Demo 2
- Saves to localStorage + POSTs to automation backend
- Fully responsive, accessible, SEO tags, premium B2B SaaS aesthetic

**Run:**
```bash
cd /home/user/leadflow-pro
npm run dev
```

---

## DEMO 2 — n8n Lead Automation (Port 3001 + 5174)

**Folder:** `/home/user/leadflow-automation`
**Backend Live:** https://3001-...e2b.app — `POST /leadflow/new-lead`
**Dashboard Live:** https://5174-...e2b.app

**Core Workflow:**
Website Form → Webhook POST /leadflow/new-lead → Validate Lead → Normalize Data → Google Sheets → AI Qualification → Lead Score 0-100 → HOT/WARM/COLD Router → Email Notification → Follow-Up Generation → Follow-Up Delivery → Daily Report → Error Handling

**What Was Built:**
- **Live Backend Server** (`server/index.js`): Express, full pipeline, heuristic AI (no keys needed), transparent scoring, validation, normalization, routing, logs, daily report, local JSON simulating Sheets
- **4 n8n Workflow JSONs** (`workflows/`): Workflow A Intake & Validation, Workflow B AI Qualification (OpenAI prompt + validation + fallback), Workflow C Notification & Follow-Up (HOT/WARM/COLD routing, email, follow-up package, placeholders), Workflow D Daily Reporting (schedule 9AM, metrics, email, save)
- **Dashboard** (`frontend/`): Pipeline visual, stats, leads table, test buttons HOT/WARM/COLD/INVALID, daily report, logs, lead detail drawer
- **Sheets Templates** (`sheets/`): Leads (22 cols), Automation Logs, Daily Reports, Configuration
- **Test Payloads** (`tests/`): hot, warm, cold, invalid

**LIVE vs DEMO:**
- LIVE: Webhook, Validation, Normalization, Heuristic AI, Scoring, Router, Logs, Daily Report, Local JSON
- DEMO placeholder (LIVE ready with creds): Google Sheets API, SMTP Email, WhatsApp Business API, HubSpot/Salesforce, Slack — clearly documented

**Run:**
```bash
cd /home/user/leadflow-automation
node server/index.js
cd frontend && npm run dev
```

**Test:**
```bash
curl -X POST http://localhost:3001/leadflow/new-lead -H "Content-Type: application/json" -d @tests/hot-lead.json
curl -X POST http://localhost:3001/api/test/hot
```

---

## DEMO 3 — AI Business Automation (Port 3002 + 5175)

**Folder:** `/home/user/leadflow-ai`
**Backend Live:** https://3002-...e2b.app — `POST /api/analyze-lead`
**Dashboard Live:** https://5175-...e2b.app

**Core Concept:**
Lead Information → AI Analysis → Business Need → Lead Intent → Urgency → Qualification Score → Recommended Action → Sales Message

**Application Structure:**
- Header: LeadFlow AI, AI-Powered Lead Intelligence, nav Dashboard, Analyze Lead, Lead History, Reports, Settings
- Dashboard: Leads Analyzed 128, Hot 24, Warm 61, Avg Score 68/100 (demo labeled), recent analyses, temp distribution, high-priority, preloaded demo leads (5 fictional)
- Analyze Lead Page: 12 fields (Full Name *, Business Name *, Email *, Phone, Website, Industry, Company Size, Budget, Current Challenge *, Desired Outcome, Timeline, Additional Notes) + CTA Analyze Lead With AI
- AI Processing: 7 steps animation (Reading, Identifying need, Evaluating intent, Assessing urgency, Calculating score, Generating action, Preparing message) — distinguishes DEMO heuristic vs LIVE API
- Lead Profile: name, business, industry, budget, timeline, need, contact
- Business Need: primary + secondary + summary explanation
- Lead Intent: level (Researching, Exploring, Interested, Evaluating, Ready to Buy), confidence, reason
- Urgency: Low, Medium, High, Critical + reason
- Qualification Score: Circular progress 87/100, HOT LEAD, factors table Business Fit, Buying Intent, Budget, Urgency, Problem Clarity each 0-20, total 100, validated temperature correspondence
- AI Reasoning: expandable "Why This Lead Scored 87/100" — decision-oriented, no hidden chain-of-thought
- Recommended Action: "Contact within 15 minutes", priority, reason, buttons Contact Lead, Book Strategy Call, Add to CRM, Send Sales Message (demo labeled)
- Sales Message: AI-generated, mentions business name + problem, understanding, solution, natural tone, CTA, editable, buttons Copy, Regenerate, Edit, Send, channel-specific Email (detailed), WhatsApp (short direct), LinkedIn (relationship), SMS (concise)
- Lead History: columns Lead, Business, Date, Need, Intent, Urgency, Score, Temp, Recommended Action, Status, filters Hot/Warm/Cold, Industry, Score, Date, Intent, search
- Lead Detail View, Export JSON/CSV/PDF (PDF placeholder returning JSON, real pdf-lib ready), Responsive, Error Handling, Security (no exposed keys), Demo Mode clearly labeled

**AI Output Schema:**
```json
{
  "business_need": { "primary", "secondary", "summary" },
  "lead_intent": { "level", "confidence", "reason" },
  "urgency": { "level", "reason" },
  "qualification": { "score", "temperature", "factors": { "business_fit", "buying_intent", "budget", "urgency", "problem_clarity" }, "reasoning" },
  "recommended_action": { "action", "priority", "reason" },
  "sales_message": { "email", "whatsapp", "linkedin", "sms" }
}
```

**Scoring Rules:** Deterministic, 0-20 each factor, total 0-100, 80-100 HOT, 50-79 WARM, 0-49 COLD, no contradictory states

**AI Prompt Engineering:** System prompt 400+ words in server/index.js — analyze only provided info, avoid inventing facts, distinguish known vs assumptions, valid JSON, consistent scoring, concise rationale, actionable next step, natural sales communication, avoid manipulative language, unsupported claims, never reveal hidden chain-of-thought, return "unknown" if missing

**Backend:** Express 3002, heuristic engine (transparent, no keys) + OpenAI-ready (uncomment code), data `analyzed-leads.json`, endpoints: POST /api/analyze-lead, GET /api/leads, GET /api/leads/:id, GET /api/dashboard, GET /api/export/:id, POST /api/from-automation (connection from Demo 2), GET /api/demo-leads

**Connection to Demo 2:** Demo 2 can POST to `/api/from-automation` with lead payload, Demo 3 maps and auto-analyzes, appears in dashboard — 3 demos form coherent ecosystem

**Run:**
```bash
cd /home/user/leadflow-ai
node server/index.js
cd frontend && npm run dev
```

**Test:**
```bash
curl -X POST http://localhost:3002/api/analyze-lead -H "Content-Type: application/json" -d '{"fullName":"Sarah Johnson","businessName":"Acme Growth Solutions","email":"sarah@acme.co","industry":"Professional Services","budget":"$5k - $15k","currentChallenge":"Leads slip through","timeline":"Within 30 days"}'
```

---

## All Services Running

- 5173 — Demo 1 Website — LeadFlow Pro
- 3001 — Demo 2 Backend — LeadFlow Automation API
- 5174 — Demo 2 Dashboard — Automation Visual
- 3002 — Demo 3 Backend — LeadFlow AI API
- 5175 — Demo 3 Dashboard — AI Intelligence SaaS

Check `get_process_output` for each process_id to see logs.

---

## Environment Variables

**Demo 1 (`leadflow-pro/.env`):**
```
VITE_LEAD_WEBHOOK_URL=http://localhost:3001/leadflow/new-lead
VITE_API_BASE=http://localhost:3001
VITE_WHATSAPP_NUMBER=14155552671
```

**Demo 2 (`leadflow-automation/.env.example`):**
```
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SHEETS_ID=...
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
AI_PROVIDER=heuristic
OPENAI_API_KEY=sk-...
PORT=3001
```

**Demo 3 (`leadflow-ai/.env`):**
```
AI_PROVIDER=heuristic
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
PORT=3002
VITE_API_BASE=http://localhost:3002
```

---

## Testing the Full Ecosystem

1. **Demo 1 → Demo 2:** Open Demo 1 website (5173), submit lead form with HOT data (budget $15k-$50k, message "ASAP, ready to start this week, losing leads") → check Demo 2 dashboard (5174) — lead appears with score 90+ HOT, AI qualification, email notification preview, follow-up message, logs

2. **Demo 2 → Demo 3:** Demo 2 backend forwards to Demo 3 via POST /api/from-automation (or click Test HOT in Demo 2 dashboard, then manually trigger or wait for auto-forward) → check Demo 3 dashboard (5175) — lead appears in Lead History with full intelligence, score, business need, intent, urgency, recommended action, multi-channel sales messages

3. **Demo 3 Standalone:** Open Demo 3 dashboard (5175), click preloaded demo lead Daniel Wilson (ASAP, $15k-$50k) → Analyze → see 7-step processing, circular score 85+ HOT, factors, reasoning, recommended action "Contact within 15 minutes", sales messages for Email/WhatsApp/LinkedIn/SMS, copy/edit/export

4. **All paths:** Test HOT, WARM, COLD, INVALID in Demo 2 dashboard, test different industries/budgets/timelines in Demo 3

---

## Final Quality Standard

Each demo is:
- Professional, production-quality, responsive, clean architecture
- No fake client claims, demo metrics clearly labeled
- Suitable for agency sales presentation
- Prioritizes practical implementation over unnecessary complexity
- Uses free/low-cost infra, no unnecessary paid services
- Faithfully implements specifications exactly

**The complete 3-piece Proof Machine is ready to demonstrate:**
- Front-end capability (Demo 1)
- Technical automation capability (Demo 2)
- AI capability (Demo 3)

As a coherent technology ecosystem that turns traffic into qualified customers into actionable sales intelligence.

---

© 2026 LeadFlow Pro — Demo websites, fictional company — Built as portfolio demonstration for agency partners.
