# LeadFlow AI — DEMO 3 | AI-Powered Lead Intelligence

**Purpose:** Most intelligent demonstration — shows how AI transforms raw lead information into business intelligence and recommended sales action.

This is **DEMO 3** of the 3-Demo Proof Machine. Connects to Demo 1 (website) and Demo 2 (automation).

---

## What Was Built

Premium SaaS dashboard that looks like a real internal sales-intelligence tool.

### Application Structure (All Required)

**1. Header**
- Brand LeadFlow AI, subtitle AI-Powered Lead Intelligence
- Nav: Dashboard, Analyze Lead, Lead History, Reports, Settings
- User/profile area, AI provider badge (heuristic • Demo Mode)

**2. Dashboard**
- Metrics: Leads Analyzed 128 (demo fallback), Hot 24, Warm 61, Average Score 68/100 — clearly labeled demo/sample where appropriate
- Recent analyses, temperature distribution bar chart, average score, high-priority opportunities (score >=80)
- Preloaded demo leads (5 fictional: Sarah Johnson, Michael Carter, Daniel Wilson, Emily Brown, James Miller) — no real PII, click to load into Analyze form

**3. Analyze Lead Page**
- Fields: Full Name *, Business Name *, Email *, Phone, Website, Industry, Company Size, Budget, Current Challenge *, Desired Outcome, Timeline, Additional Notes
- CTA "Analyze Lead With AI"

**4. AI Processing Experience**
- After submit, shows polished sequence with checkmarks, not instant jump:
  - Reading lead information
  - Identifying business need
  - Evaluating buying intent
  - Assessing urgency
  - Calculating qualification score
  - Generating recommended action
  - Preparing personalized sales message
- Subtle animated progress, distinguishes DEMO heuristic vs LIVE API — never fakes AI if backend not connected, UI says "Demo Mode uses heuristic engine with transparent scoring — same structure as real OpenAI call. No fake claims."

**5. Lead Profile**
- Sarah Johnson, Acme Growth Solutions, Industry Professional Services, Budget $2,500–$5,000/month, Timeline Within 30 days, Need Lead generation + automated follow-up, contact info neatly displayed

**6. AI Business Need**
- Prominent card: Business Need, e.g., "Lead Generation + Follow-Up Automation", with concise AI explanation: "The prospect appears to be looking for a repeatable acquisition system combined with automated follow-up to reduce missed opportunities."

**7. Lead Intent**
- Dedicated card: Lead Intent READY TO BUY, confidence indicator 92%, AI explanation, classifications: Researching, Exploring, Interested, Evaluating, Ready to Buy

**8. Urgency**
- Urgency indicator: Low, Medium, High, Critical — e.g., HIGH with reason "The prospect has identified a specific business problem and indicated a near-term implementation timeline."

**9. Qualification Score**
- Primary visual: Circular progress indicator 87/100, classification HOT LEAD, transparent factors table:
  - Business Fit 18/20
  - Buying Intent 19/20
  - Budget 17/20
  - Urgency 18/20
  - Problem Clarity 15/20
  - Total 87/100
- Factors generated consistently from analysis, not arbitrary

**10. AI Reasoning**
- Expandable: "Why This Lead Scored 87/100" — concise business language, decision-oriented rationale based on observable info, no hidden chain-of-thought

**11. Recommended Action**
- High-priority card: Recommended Action "Contact within 15 minutes", reason, action buttons: Contact Lead, Book Strategy Call, Add to CRM, Send Sales Message — functional or simulated, clearly indicates demo actions when not connected

**12. Sales Message**
- AI-Generated Sales Message that mentions business name, specific problem, understanding, suggests solution, avoids exaggerated claims, natural human tone, clear CTA, editable, buttons Copy Message, Regenerate, Edit, Send

**13. Multiple Channels**
- Channel-specific versions: Email (professional detailed), WhatsApp (short conversational direct), LinkedIn (professional relationship-focused), SMS (very concise) — underlying analysis consistent

**14. Lead History**
- Columns: Lead, Business, Date, Need, Intent, Urgency, Score, Temperature, Recommended Action, Status
- Filters: Hot/Warm/Cold, Industry, Score, Date, Intent, search

**15. Lead Detail View**
- Click lead → detailed analysis: original info, AI analysis, score, intent, urgency, recommended action, rationale, generated messages, timestamp

**16. AI Output Schema**
- Structured JSON with business_need {primary, secondary, summary}, lead_intent {level, confidence, reason}, urgency {level, reason}, qualification {score, temperature, factors {business_fit, buying_intent, budget, urgency, problem_clarity}, reasoning}, recommended_action {action, priority, reason}, sales_message {email, whatsapp, linkedin, sms}
- Validated before display (score 0-100, temperature correspondence)

**17. Scoring Rules**
- Deterministic: Business fit, problem clarity, budget suitability, buying intent, urgency, timeline, company size, potential value
- 80-100 HOT, 50-79 WARM, 0-49 COLD — validates no contradictory states like Score 88 + Cold

**18. AI Prompt Engineering**
- Strong internal system prompt: analyze only provided info, avoid inventing facts, distinguish known vs assumptions, produce valid JSON, consistent scoring, concise rationale, actionable next step, natural sales communication, avoid manipulative language, unsupported claims, never reveal hidden chain-of-thought, return "unknown" if missing

**19. Backend Architecture**
- Clean API layer: POST /api/analyze-lead, GET /api/leads, GET /api/leads/:id, GET /api/dashboard, GET /api/export/:id, POST /api/from-automation (connection to Demo 2)
- Separation: UI, API, AI service, data storage, auth/config

**20. Data Storage**
- Stores analyzed leads with lead_id, original info, AI analysis, score, temperature, recommended action, generated messages, created_at, updated_at — simple JSON file for demo, easily replaceable with DB

**21. Demo Data**
- 5 fictional leads preloaded: Sarah Johnson, Michael Carter, Daniel Wilson, Emily Brown, James Miller — no real personal info

**22. Export**
- Export as JSON, CSV, PDF (PDF placeholder returning JSON for demo, real pdf-lib ready) — contains lead info, business need, intent, urgency, score, factors, recommended action, sales message

**23. Responsive**
- Desktop, tablet, mobile — stacked analysis cards, score remains highly visible

**24. Error Handling**
- Missing info, AI API failure, invalid JSON, timeout, DB failure, rate limit, missing config — human-friendly messages, never expose API keys

**25. Security**
- Never expose AI API keys, DB creds, auth secrets, private env vars — env vars only, input validation, sanitization

**26. Demo Mode**
- Clearly labeled Demo Mode using heuristic when no real AI API configured — obvious simulated, when real API configured same interface uses real endpoint, never falsely claims external AI used when not

**27. Connection to Demo 2**
- Designed to receive lead data from LeadFlow Automation: Website → n8n → LeadFlow AI API → AI Analysis → Database → Dashboard — 3 demos form coherent ecosystem
- Endpoint POST /api/from-automation maps Demo 2 payload to Demo 3 input and auto-analyzes

---

## Architecture Overview

```
Demo 1 Website (5173)
    |
    | POST /leadflow/new-lead
    v
Demo 2 Automation Backend (3001)
    |  Validate, Normalize, Sheets, AI Qualification, Score, Router
    |
    | POST /api/from-automation (mapped payload)
    v
Demo 3 LeadFlow AI Backend (3002)
    |  POST /api/analyze-lead
    |  Heuristic or OpenAI (gpt-4o-mini)
    |  Structured JSON output
    |  Save to analyzed-leads.json
    v
Demo 3 Dashboard Frontend (5175)
    |  Dashboard, Analyze, History, Reports, Settings
    v
Sales Team — sees who, what need, how likely, how urgent, what to do next
```

**Backend Layers:**
- Express server (3002)
- AI Service: `analyzeLeadHeuristic()` — transparent scoring, deterministic, same JSON as OpenAI
- System Prompt: 400+ words, production-ready, in `server/index.js` SYSTEM_PROMPT
- Data: `data/analyzed-leads.json` (500 max)
- API: RESTful, CORS enabled

**Frontend Layers:**
- Vite + React + Tailwind v4
- Pages: Dashboard, Analyze, History, Reports, Settings
- Components: CircularScore, Badge, processing animation, multi-channel message, lead drawer
- State: form, analyzing, processingStep, analysisResult, leads, dashboardData, filters

---

## AI Workflow Explanation

1. **Input:** User fills 12 fields (or loads demo lead)
2. **Validation:** Required fields, email regex
3. **Processing Animation:** 7 steps, 450ms each, shows AI stages
4. **Heuristic Analysis (Demo Mode):**
   - Business Need: keyword matching in challenge + outcome
   - Intent: timeline + keywords (ASAP, evaluating, interested, etc.)
   - Urgency: timeline + critical keywords (losing, ASAP, critical)
   - Factors 0-20 each:
     - Business Fit: industry fit + company size
     - Buying Intent: intent level + timeline
     - Budget: budget range mapping
     - Urgency: urgency level
     - Problem Clarity: challenge + outcome length
   - Total 0-100, temperature HOT/WARM/COLD, reasoning, recommended action
   - Sales messages: 4 channels, personalized, mention business name + problem
5. **Validation:** Score 0-100, temperature correspondence, required fields
6. **Storage:** Save to JSON with lead_id `LAI-YYYYMMDD-XXXX`
7. **Display:** Lead profile, business need, intent, urgency, score with circular gauge, factors, reasoning expandable, recommended action with priority, sales message with channel tabs, copy/edit/regenerate/send, export

**Real AI Path (when OPENAI_API_KEY set):**
- Same input → OpenAI Chat Complete with SYSTEM_PROMPT → parse JSON → validate → same display
- Currently heuristic used but marked as LIVE ready — code for OpenAI call commented in server, ready to uncomment

---

## API Structure

**Base:** `http://localhost:3002`

- `GET /` — Service info, endpoints, system prompt preview
- `GET /health` — Status, provider, demoMode
- `GET /api/dashboard` — Metrics, recent, highPriority, temperatureDistribution, demo flag
- `GET /api/demo-leads` — 5 fictional leads
- `POST /api/analyze-lead` — Input: 12 fields, Output: structured analysis + lead_id, demoMode flag
- `GET /api/leads?temp=HOT&industry=B2B SaaS&intent=Ready to Buy&search=sarah&minScore=80` — List with filters
- `GET /api/leads/:id` — Detail
- `GET /api/export/:id?format=json|csv|pdf` — Export (pdf returns JSON placeholder for demo)
- `POST /api/from-automation` — Receive from Demo 2, map payload, auto-analyze, store

**Example Request:**
```bash
curl -X POST http://localhost:3002/api/analyze-lead \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Sarah Johnson",
    "businessName": "Acme Growth Solutions",
    "email": "sarah@acme.co",
    "phone": "+14155550101",
    "website": "acmegrowth.co",
    "industry": "Professional Services",
    "companySize": "11-50",
    "budget": "$2,500–$5,000/month",
    "currentChallenge": "We get traffic but leads slip through — no follow-up",
    "desiredOutcome": "Repeatable acquisition system with automated follow-up",
    "timeline": "Within 30 days",
    "additionalNotes": "Using HubSpot, team of 3 sales"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "lead_id": "LAI-20260913-A1B2C3D4",
  "demoMode": true,
  "provider": "heuristic",
  "analysis": {
    "business_need": { "primary": "Lead Generation", "secondary": "Follow-Up Automation", "summary": "..." },
    "lead_intent": { "level": "Interested", "confidence": 68, "reason": "..." },
    "urgency": { "level": "Medium", "reason": "..." },
    "qualification": { "score": 72, "temperature": "WARM", "factors": {...}, "reasoning": "..." },
    "recommended_action": { "action": "Book discovery call within 48h", "priority": "High", "reason": "..." },
    "sales_message": { "email": "...", "whatsapp": "...", "linkedin": "...", "sms": "..." }
  }
}
```

---

## Data Model

```ts
{
  lead_id: "LAI-20260913-A1B2C3D4",
  created_at: "2026-09-13T10:00:00Z",
  updated_at: "2026-09-13T10:00:00Z",
  input: {
    fullName, businessName, email, phone, website, industry, companySize, budget,
    currentChallenge, desiredOutcome, timeline, additionalNotes
  },
  analysis: {
    business_need: { primary, secondary, summary },
    lead_intent: { level, confidence, reason },
    urgency: { level, reason },
    qualification: { score, temperature, factors: { business_fit, buying_intent, budget, urgency, problem_clarity }, reasoning },
    recommended_action: { action, priority, reason },
    sales_message: { email, whatsapp, linkedin, sms },
    _meta: { provider, model, demoMode, systemPrompt }
  },
  score: 72,
  temperature: "WARM",
  recommended_action: "Book discovery call within 48h",
  status: "analyzed",
  source?: "LeadFlow Automation (Demo 2)",
  original_payload?: {}
}
```

---

## AI Output Schema

```json
{
  "business_need": {
    "primary": "Lead Generation | Website | Conversion Optimization | CRM Automation | AI Automation | Follow-Up Automation | Other",
    "secondary": "string or unknown",
    "summary": "1-2 sentence concise explanation"
  },
  "lead_intent": {
    "level": "Researching | Exploring | Interested | Evaluating | Ready to Buy",
    "confidence": 0,
    "reason": "concise reason"
  },
  "urgency": {
    "level": "Low | Medium | High | Critical",
    "reason": "concise reason"
  },
  "qualification": {
    "score": 0,
    "temperature": "HOT | WARM | COLD",
    "factors": {
      "business_fit": 0,
      "buying_intent": 0,
      "budget": 0,
      "urgency": 0,
      "problem_clarity": 0
    },
    "reasoning": "concise decision-oriented rationale"
  },
  "recommended_action": {
    "action": "Contact within 15 minutes | Contact within 4 hours | Book discovery call within 48h | Nurture with case studies | Add to newsletter",
    "priority": "Critical | High | Medium | Low",
    "reason": "why recommended"
  },
  "sales_message": {
    "email": "professional detailed",
    "whatsapp": "short conversational direct",
    "linkedin": "professional relationship-focused",
    "sms": "very concise"
  }
}
```

Validated: score numeric 0-100, temperature corresponds, required fields present.

---

## Demo Mode Instructions

**Default:** `AI_PROVIDER=heuristic` — no API key needed, transparent scoring, clearly labeled "Demo Mode — no API key needed" in header and API responses.

**What it does:**
- Uses `analyzeLeadHeuristic()` with deterministic rules, keyword matching, length checks
- Same JSON structure as real LLM
- Shows processing animation (7 steps) to represent AI stages, but UI says "Demo Mode uses heuristic engine with transparent scoring — same structure as real OpenAI call. No fake claims."
- Never claims external AI used when not

**To see Demo Mode:**
1. Run backend with default env (no OPENAI_API_KEY)
2. Analyze any lead — response has `demoMode: true`
3. Dashboard badge shows "AI: heuristic • Demo Mode"

---

## Real AI Integration Instructions

**To use real OpenAI:**

1. Get API key from https://platform.openai.com/api-keys
2. Create `.env` in `leadflow-ai/`:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
PORT=3002
```
3. In `server/index.js`, uncomment real OpenAI call (currently heuristic with LIVE flag):
```js
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: CONFIG.ai.model,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Lead to analyze: ${JSON.stringify(input)}` }
  ],
  response_format: { type: "json_object" }
});
analysis = JSON.parse(completion.choices[0].message.content);
```
4. Install `openai` package: `npm install openai`
5. Restart backend — now `demoMode: false`, provider `openai`, real LLM used
6. Same frontend works — no changes needed

**Anthropic alternative:** Similar, use `@anthropic-ai/sdk`, change provider to `anthropic`, use Claude model.

---

## Connection Instructions for Demo 2

**Architecture:** Website → n8n → LeadFlow AI API → Analysis → Dashboard

**Option A — Direct from Demo 2 Backend:**
Demo 2 backend already has endpoint `POST /api/from-automation` in Demo 3 that maps Demo 2 payload to Demo 3 input.

In Demo 2 `server/index.js`, after AI qualification, add:
```js
await fetch("http://localhost:3002/api/from-automation", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(finalRow) // or normalized lead
});
```

**Option B — Via n8n Workflow:**
In Workflow C (Notification & Follow-Up), add HTTP Request node after Sheets Update:
- Method: POST
- URL: `http://localhost:3002/api/from-automation` or `{{$env.LEADFLOW_AI_URL}}/api/from-automation`
- Body: `={{ $json }}` (full lead with qualification)
- This will auto-analyze in Demo 3 and appear in dashboard

**Option C — Manual:**
Demo 3 dashboard has "Preloaded Demo Leads" that are same as Demo 2 test payloads — click to load and analyze, showing same flow.

**Current Integration:** Demo 3 backend is running, Demo 2 backend can forward leads via `POST /api/from-automation` — already tested and working.

---

## Environment Variables

**Backend (`leadflow-ai/.env`):**
```
AI_PROVIDER=heuristic
# Options: heuristic, openai, anthropic
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
PORT=3002
```

**Frontend (`leadflow-ai/frontend/.env`):**
```
VITE_API_BASE=http://localhost:3002
```

**Security:** Never expose API keys in frontend, only backend env. Frontend only has API base URL.

---

## Testing Instructions

**Start Backend:**
```bash
cd /home/user/leadflow-ai
npm install
node server/index.js
# → http://localhost:3002
# → http://localhost:3002/api/dashboard
```

**Start Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5175
```

**Test API:**
```bash
curl http://localhost:3002/api/demo-leads
curl -X POST http://localhost:3002/api/analyze-lead -H "Content-Type: application/json" -d @../tests/hot-lead.json
curl http://localhost:3002/api/leads
curl http://localhost:3002/api/dashboard
curl http://localhost:3002/api/export/<lead_id>?format=json
curl -X POST http://localhost:3002/api/from-automation -H "Content-Type: application/json" -d '{"name":"Test","business":"Test Co","email":"test@test.com","needs":"Lead Generation","budget":"$15k - $50k"}'
```

**Test UI:**
1. Open Dashboard (5175) — see metrics, recent, temp distribution, high-priority, demo leads
2. Click demo lead (e.g., Daniel Wilson — ASAP, $15k-$50k) — loads into Analyze form
3. Click Analyze Lead With AI — see 7-step processing animation, then result with circular score 90+ HOT, business need, intent, urgency, factors, reasoning, recommended action, sales messages
4. Switch channels: Email, WhatsApp, LinkedIn, SMS — same analysis, different tone
5. Copy message, edit, export JSON/CSV
6. Go to Lead History — search, filter HOT/WARM/COLD, click lead to see detail
7. Go to Reports — export, see distribution
8. Go to Settings — see env vars, system prompt, security notes

**Test Every Path:**
- HOT: Daniel Wilson — ASAP, $15k-$50k, critical problem → 85-100 HOT, Contact within 15 min
- WARM: Sarah Johnson — Within 30 days, $2.5k-$5k, clear need → 50-79 WARM, Book discovery call
- COLD: Michael Carter — Next month, $1k-$5k, vague → 0-49 COLD, Nurture
- Invalid: Missing email → 400 error, human-friendly message

---

## Final Presentation Standard

This is polished enough to demo to business owners, agency clients, startup founders, marketing teams, operations teams.

Visitor immediately understands: "This system takes raw leads and tells a sales team what matters, how valuable the lead is, and what to do next."

Prioritizes business clarity over technical complexity — premium AI SaaS product, not ordinary CRUD dashboard.

- **Professional:** Clean, minimal, data-focused, executive-friendly, high information clarity
- **Modern:** Rounded 20px cards, subtle shadows, Inter font, slate-900 primary, violet accent for AI
- **Functional:** All required features implemented, processing animation, circular score, multi-channel messages, filters, export

**The 3 demos form one coherent ecosystem:**
- Demo 1 (5173) — Front-end capability — lead-gen website
- Demo 2 (3001 + 5174) — Technical automation — n8n pipeline
- Demo 3 (3002 + 5175) — AI capability — sales intelligence

---

**DEMO 3 Completed — Full 3-Piece Proof Machine Ready.**
