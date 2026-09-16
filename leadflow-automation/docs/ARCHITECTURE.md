# LeadFlow Automation — Architecture Documentation

## System Overview

LeadFlow Automation is a production-style lead processing pipeline that demonstrates how a professional automation agency would handle incoming website leads.

It is designed to be:
- **Reliable** — every node has error handling
- **Maintainable** — 4 logical workflows, not one monolith
- **Secure** — no hard-coded secrets, env vars, credential management
- **Transparent** — scoring criteria documented, breakdown logged
- **Demo-ready** — works without API keys, clearly marks LIVE vs DEMO

## High-Level Flow

```
[Demo 1 Website] --POST JSON--> [Webhook /leadflow/new-lead]
                                      |
                              [Validate Lead]
                                      |
                              [Normalize Data] --lead_id, received_at-->
                                      |
                              [Google Sheets Append] --Leads sheet-->
                                      |
                              [AI Qualification] --OpenAI or Heuristic-->
                                      |
                              [Validate Score 0-100 & Temp]
                                      |
                              [HOT/WARM/COLD Router]
                                     / | \
                               HOT  WARM COLD
                                |    |    |
                        [Email Sales] [Email Manager] [Suppress]
                                |    |    |
                        [Generate Follow-Up Message]
                                |    |    |
                        [Update Sheets + Log]
                                      |
                              [Daily Report Cron 9AM]
                                      |
                              [Email Report + Save to Sheets]
```

## Workflows

### A: Intake & Validation
- **Purpose:** Receive, validate, normalize, store initial lead
- **Trigger:** Webhook
- **Key Logic:** 
  - Required fields check
  - Email regex
  - Full validation code node
  - Normalize: capitalize name, lower email, clean phone, generate lead_id `LF-YYYYMMDD-XXXX`
  - Append to Sheets
  - Call Workflow B
- **Error Path:** Invalid → Respond 400 + Log + Store as INVALID

### B: AI Qualification
- **Purpose:** Analyze lead with LLM, produce structured qualification
- **Trigger:** Execute Workflow Trigger (from A)
- **Key Logic:**
  - OpenAI Chat Complete with system prompt defining exact JSON output and scoring criteria
  - Code Validate AI Output: parse JSON (handle markdown code blocks), validate score 0-100, validate temperature correspondence, validate required fields
  - Update Sheets with AI results
  - Call Workflow C
- **Fallback:** Heuristic scoring when AI fails (budget, intent keywords, urgency, data quality)
- **Scoring:** Transparent, not random

### C: Notification & Follow-Up
- **Purpose:** Route based on temperature, notify team, generate follow-up
- **Trigger:** Execute Workflow Trigger (from B)
- **Key Logic:**
  - IF HOT (score >=80) → Email HOT Alert to sales team
  - IF WARM (50-79) → Email WARM to manager
  - ELSE COLD → Handle COLD (store only)
  - Generate Follow-Up Package: personalized sales_message, channels status
  - Update Sheets with notification + follow-up status
  - Log automation
- **Channels:** Email LIVE ready (SMTP), WhatsApp placeholder, CRM placeholder, Slack placeholder

### D: Daily Reporting
- **Purpose:** Summarize daily leads, send report
- **Trigger:** Schedule Daily 9AM
- **Key Logic:**
  - Read Leads sheet
  - Filter today's leads
  - Calculate: total, valid, invalid, hot/warm/cold, avg score, highest lead, most common need/industry, immediate action list
  - Email report to manager
  - Save to Daily Reports sheet

## Data Model

### Lead (Normalized)
```ts
{
  lead_id: "LF-20260913-A1B2C3D4",
  received_at: "2026-09-13T10:00:00Z",
  name: "Sarah Chen",
  business: "Atlas Labs",
  email: "sarah@atlaslabs.io",
  phone: "+14155552671",
  website: "atlaslabs.io",
  industry: "B2B SaaS",
  budget: "$15k - $50k",
  needs: "Ready to Buy",
  message: "We need to fix...",
  source: "LeadFlow Pro Website",
  timestamp: "2026-09-13T10:00:00Z",
  email_domain: "atlaslabs.io",
  is_business_email: true
}
```

### AI Qualification
```ts
{
  business_need: "CRM Automation",
  lead_intent: "Ready to Buy",
  urgency: "Critical",
  qualification_score: 92,
  lead_temperature: "HOT",
  recommended_action: "Immediate sales outreach — call within 15 mins",
  reasoning: "Lead scored 92/100. Budget $15k-$50k (28pts)...",
  sales_message: "Hi Sarah, thanks for reaching out...",
  score_breakdown: { budget: 28, intent: 25, urgency: 15, quality: 24 }
}
```

### Google Sheets Row (22 columns)
Lead ID, Date, Name, Business, Email, Phone, Website, Industry, Budget, Need, Message, Source, AI Business Need, Lead Intent, Urgency, Qualification Score, Lead Temperature, Recommended Action, Sales Message, Notification Status, Follow-Up Status, Created At

## Security Assumptions

- Webhook: In production, add header auth `X-API-Key` or n8n webhook auth
- Input validation: All fields validated, sanitized (trim, lower, regex)
- No hard-coded secrets: All via env vars or n8n credentials
- Error logging: Logs lead_id, error type, timestamp, failed node, message — no credentials, no full payload with PII in error logs (only keys)
- Minimal PII exposure: Logs contain lead_id and message, not full email/phone unless necessary
- Google Sheets: OAuth2, not API key in code
- Email: SMTP via credential, not hard-coded

## Deployment

### Local Demo (No Credentials)
- Backend: `node server/index.js` — uses local JSON for Sheets, heuristic AI, simulated email
- Frontend: `npm run dev` — dashboard
- Works out of box

### Production (With Credentials)
1. Set env vars: GOOGLE_SHEETS_ENABLED=true, EMAIL_ENABLED=true, AI_PROVIDER=openai, OPENAI_API_KEY, etc.
2. Create n8n credentials: Google Sheets OAuth2, OpenAI API, SMTP
3. Import 4 workflow JSONs into n8n
4. Set env vars in n8n: GOOGLE_SHEETS_ID, SALES_TEAM_EMAIL, etc.
5. Activate workflows
6. Point Demo 1 website webhook URL to n8n webhook URL

## Scaling

- Leads stored in Sheets (good for <10k), for larger scale replace with database (Postgres, Airtable)
- n8n can handle thousands of executions/day
- For high volume, add queue (e.g., n8n + Redis)
- Daily report reads all leads — for large datasets, filter by date in Sheets query

## Future Enhancements (Not in Demo Scope)

- Add Slack node for HOT leads
- Add HubSpot/Salesforce node to create contact/deal
- Add WhatsApp Business API node for follow-up
- Add enrichment: Clearbit for company data
- Add calendar booking: Calendly API
- Add sentiment analysis
