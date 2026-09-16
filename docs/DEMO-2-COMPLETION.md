# DEMO 2 — LeadFlow Automation — COMPLETED

## Summary

DEMO 2 is a complete, production-style n8n lead automation system that demonstrates how a professional agency processes leads from Demo 1 website through validation, normalization, AI qualification, scoring, routing, notification, follow-up, and daily reporting.

## What Was Built

### 1. Live Backend Server (Node/Express) — `leadflow-automation/server/index.js`
- **Port 3001** — implements full pipeline without requiring n8n cloud
- **Endpoints:**
  - `POST /leadflow/new-lead` — Node 1 Webhook
  - `GET /api/leads` — Leads (simulates Google Sheets)
  - `GET /api/logs` — Automation logs (Node 10 Error Handling)
  - `POST /api/daily-report` — Node 11 Daily Report
  - `POST /api/test/hot|warm|cold|invalid` — Test payloads
- **Features:**
  - Node 2 Validation: required fields, email regex, business, need, industry, budget
  - Node 3 Normalization: capitalize name, lower email, clean phone, generate lead_id `LF-YYYYMMDD-XXXX`, timestamp
  - Node 4 Google Sheets: 22 columns, local JSON simulation, LIVE ready via env
  - Node 5 AI Qualification: Heuristic engine mimicking LLM, transparent scoring (Budget 35pts, Intent 25pts, Urgency 15pts, Quality 25pts = 100), returns business_need, lead_intent, urgency, score, temperature, recommended_action, reasoning, sales_message
  - Node 6 Router: 80-100 HOT, 50-79 WARM, 0-49 COLD, validates temperature corresponds to score
  - Node 7 Email Notification: HOT immediate to sales team, WARM to manager, COLD suppressed, env-based recipients
  - Node 8 Follow-Up: Personalized message referencing business + need, professional, CTA for strategy call
  - Node 9 Delivery: Email LIVE ready, WhatsApp/CRM/Slack placeholder documented as DEMO, never claims sent when simulated
  - Node 10 Error Handling: Invalid payload, invalid email, Sheets failure, AI failure, JSON parsing, email failure, timeout, missing creds, unexpected AI output — logs lead_id, error type, timestamp, failed node, message
  - Node 11 Daily Report: Scheduled, totals, valid/invalid, hot/warm/cold, avg score, highest lead, most common need/industry, immediate action, follow-ups, failed automations

### 2. Four n8n Workflow JSONs — `workflows/`
- **Workflow A: Lead Intake & Validation** — Webhook, IF required fields, IF valid email, Code Full Validation, Code Normalize, Google Sheets Append, Execute Workflow B, Respond Invalid
- **Workflow B: AI Qualification** — Execute Workflow Trigger, OpenAI Chat Complete (gpt-4o-mini) with system prompt for structured JSON, Code Validate AI Output (score 0-100, temp correspondence), Google Sheets Update, Execute Workflow C, Fallback scoring
- **Workflow C: Notification & Follow-Up** — Execute Trigger, IF HOT?, IF WARM?, Email HOT, Email WARM, Handle COLD, Generate Follow-Up Package, Update Sheets, Log Automation
- **Workflow D: Daily Reporting** — Schedule Daily 9AM, Read Sheets, Generate Report, Email Report, Save to Daily Reports sheet
- All use env vars, credentials via n8n credential system, no hard-coded secrets, maintainable

### 3. Polished Dashboard — `frontend/` (Port 5174)
- React + Tailwind, live polling every 4s
- Shows: Pipeline visual, stats (total, HOT, WARM, COLD, avg score), Leads table (Google Sheets simulation), Test buttons (HOT/WARM/COLD/INVALID), Daily Report card, Automation Logs, Lead Detail drawer with AI qualification, score breakdown, email notification preview, follow-up message, LIVE vs DEMO badges
- Click lead to see full detail

### 4. Google Sheets Templates — `sheets/`
- Leads.csv (22 columns), Automation-Logs.csv, Daily-Reports.csv, Configuration.csv
- Exact structure as specified, ready to create real sheet

### 5. Test Payloads — `tests/`
- hot-lead.json (high budget, urgent, ready to buy → should be HOT 80-100)
- warm-lead.json (moderate budget, evaluating → WARM 50-79)
- cold-lead.json (low budget, gmail, vague → COLD 0-49)
- invalid-lead.json (missing fields → 400, INVALID)

### 6. Documentation — `README.md`, `docs/ARCHITECTURE.md`
- Architecture diagram (mermaid), workflow descriptions, required credentials, env vars, Google Sheets setup, webhook setup, AI config, email config, testing instructions, troubleshooting, LIVE vs DEMO table, security assumptions

## LIVE vs DEMO

| Component | Status |
|-----------|--------|
| Webhook | LIVE |
| Validation | LIVE |
| Normalization | LIVE |
| Google Sheets | DEMO local JSON by default, LIVE ready (set GOOGLE_SHEETS_ENABLED=true + OAuth) |
| AI Qualification | LIVE heuristic (no keys) + LIVE ready OpenAI |
| Lead Score | LIVE transparent |
| Router | LIVE |
| Email Notification | DEMO simulated, LIVE ready (EMAIL_ENABLED=true + SMTP) |
| Follow-Up Generation | LIVE |
| Follow-Up Delivery | DEMO placeholder for WhatsApp/CRM/Slack, LIVE for Email |
| Error Handling | LIVE |
| Daily Report | LIVE |

## How Demo 2 Connects to Demo 1

- Demo 1 website `.env` has `VITE_LEAD_WEBHOOK_URL=http://localhost:3001/leadflow/new-lead`
- Lead form now POSTs to backend (with fallback to localStorage if backend down)
- Backend processes through full pipeline and saves to `data/leads.json`
- Dashboard (5174) shows lead instantly with AI qualification
- Test via: Submit form on Demo 1 (5173) → see lead in Dashboard (5174) with score, temp, reasoning, follow-up

## Running / Testing

**Backend:**
```bash
cd /home/user/leadflow-automation
node server/index.js
# → http://localhost:3001
```

**Dashboard:**
```bash
cd frontend
npm run dev
# → http://localhost:5174
```

**Demo 1 Website:**
```bash
cd /home/user/leadflow-pro
npm run dev
# → http://localhost:5173
```

**Test curl:**
```bash
curl -X POST http://localhost:3001/leadflow/new-lead -H "Content-Type: application/json" -d @tests/hot-lead.json
curl -X POST http://localhost:3001/api/test/hot
curl -X POST http://localhost:3001/api/daily-report
```

## Demo Flow for Client

1. Open Demo 1 website, submit HOT lead
2. Show backend terminal logs: webhook received, validation passed, normalized, AI qualified 92 HOT
3. Open Dashboard 5174: see lead in table, HOT badge, score 92, business need CRM Automation, intent Ready to Buy
4. Click lead: show AI reasoning, score breakdown, email notification preview (🔥 HOT LEAD — Atlas Labs — Score 92), follow-up message personalized
5. Show logs: validation, normalization, AI, routing, notification, follow-up
6. Test WARM, COLD, INVALID via buttons: show different routing, COLD suppressed, INVALID 400
7. Trigger Daily Report: show totals, avg score, highest lead, breakdowns
8. Show n8n workflow JSONs: importable, production-style, credential-aware
9. Show Google Sheets templates
10. Explain LIVE vs DEMO: what needs creds to go LIVE

## Files Delivered

- `leadflow-automation/server/index.js` — Live backend
- `leadflow-automation/workflows/Workflow-A...D.json` — 4 n8n workflows
- `leadflow-automation/frontend/src/App.tsx` — Dashboard
- `leadflow-automation/sheets/*.csv` — Sheets templates
- `leadflow-automation/tests/*.json` — Test payloads
- `leadflow-automation/README.md` — Full documentation
- `leadflow-automation/docs/ARCHITECTURE.md` — Architecture
- `leadflow-automation/.env.example` — Env template
- `data/leads.json`, `logs.json`, `reports.json` — Live data

## Final Standard Met

- Reliability: Every node has error handling, fallback, validation
- Clear Architecture: 4 workflows, not monolith, Execute Workflow nodes
- Maintainability: Env vars, credentials, no hard-coded secrets
- Data Quality: Normalization, validation, business email check
- Transparent Scoring: Exact criteria, breakdown logged, temp validated
- Security: Input validation, sanitization, credential management, minimal PII in logs
- Professional Documentation: README, architecture, setup, troubleshooting

**DEMO 2 Completed — Ready for agency showcase and DEMO 3.**
