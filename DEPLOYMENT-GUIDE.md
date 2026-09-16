# FREE LIVE DEPLOYMENT — Complete Step-by-Step Guide

This guide is 100% FREE — Vercel Hobby + Render Free — no credit card.

## Prerequisites (Free)

1. GitHub account (free) — https://github.com/signup
2. Vercel account (free) — https://vercel.com/signup → Continue with GitHub
3. Render account (free) — https://dashboard.render.com/register → Continue with GitHub

## Step 1: Push to GitHub

```bash
cd /home/user/leadflow-proof-machine
git init
git add .
git commit -m "feat: complete 3-demo proof machine"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leadflow-proof-machine.git
git push -u origin main
```

## Step 2: Deploy Backends + n8n on Render (One-Click)

Render can deploy all 3 backends from `render.yaml` blueprint:

1. Go to https://dashboard.render.com/blueprints → **New Blueprint Instance**
2. Connect GitHub repo `leadflow-proof-machine`
3. Render detects `render.yaml` → Shows 3 services:
   - leadflow-automation-backend
   - leadflow-ai-backend
   - leadflow-n8n
4. Click **Apply** → Wait 5-7 min
5. After deploy, open each service → Copy URL:
   - `https://leadflow-automation-backend.onrender.com`
   - `https://leadflow-ai-backend.onrender.com`
   - `https://leadflow-n8n.onrender.com` → Login admin / LeadFlow123

**Test backend:**
```
https://leadflow-automation-backend.onrender.com/
→ Should return {"service":"LeadFlow Automation","status":"running"...}
```

## Step 3: Deploy Frontends on Vercel (3 Projects)

### Demo 1 Website

1. https://vercel.com/new → Import `leadflow-proof-machine`
2. **IMPORTANT:** Click Edit next to Root Directory → Select `leadflow-pro`
3. Framework: Vite, Build: `npm run build`, Output: `dist`
4. Env Vars:
   ```
   VITE_LEAD_WEBHOOK_URL=https://leadflow-automation-backend.onrender.com/leadflow/new-lead
   VITE_API_BASE=https://leadflow-automation-backend.onrender.com
   VITE_WHATSAPP_NUMBER=14155552671
   ```
5. Deploy → Get URL `https://leadflow-pro-xxxx.vercel.app`

### Demo 2 Dashboard

1. Vercel → Add New Project → Same repo → Root Directory `leadflow-automation/frontend`
2. Env: `VITE_API_BASE=https://leadflow-automation-backend.onrender.com`
3. Deploy → Get URL `https://leadflow-automation-dashboard-xxxx.vercel.app`

### Demo 3 Dashboard

1. Vercel → Add New Project → Same repo → Root Directory `leadflow-ai/frontend`
2. Env: `VITE_API_BASE=https://leadflow-ai-backend.onrender.com`
3. Deploy → Get URL `https://leadflow-ai-dashboard-xxxx.vercel.app`

## Step 4: Connect Live URLs

After all deployed, update env vars:

**Vercel Demo 1 → Settings → Environment Variables:**
- Update `VITE_LEAD_WEBHOOK_URL` to your actual Render automation backend URL + `/leadflow/new-lead`
- Save → Redeploy

**Render Automation Backend → Environment:**
- `LEADFLOW_AI_URL=https://leadflow-ai-backend.onrender.com`
- Save → Auto redeploys

## Step 5: Import n8n Workflows

1. Open `https://leadflow-n8n.onrender.com` → Login admin / LeadFlow123
2. Workflows → Import from File → Upload from `leadflow-automation/workflows/`:
   - Workflow-A-Lead-Intake-Validation.json
   - Workflow-B-AI-Qualification.json
   - Workflow-C-Notification-FollowUp.json
   - Workflow-D-Daily-Reporting.json
3. For each, create credentials if you want LIVE mode (optional, keep DEMO for free):
   - Google Sheets OAuth2 (free Google account)
   - OpenAI API (optional, costs money — keep heuristic for free)
   - SMTP (free Gmail app password)
4. Activate workflows

## Step 6: Test Live Ecosystem

1. Open Demo 1 live URL → Submit HOT lead:
   - Name: Daniel Wilson
   - Business: Apex Consulting
   - Email: daniel@apexconsulting.io
   - Budget: $15k - $50k
   - Message: Losing enterprise deals due to slow follow-up, need CRM automation immediately, ready to start this week, budget approved, ASAP
2. Wait 10 sec (Render free cold start 30 sec first time)
3. Open Demo 2 Dashboard live URL → See lead HOT 90+
4. Open Demo 3 Dashboard live URL → Lead History → See same lead with full intelligence
5. Open n8n live URL → Executions → See workflow execution

## Keep Render Awake Free

Render free sleeps after 15 min. First request after sleep takes 30 sec.

**Free fix:** https://uptimerobot.com/ → Free account → Add 3 monitors (HTTP) for your 3 Render URLs, interval 5 min → Keeps awake.

## Alternative: Deploy Backends on Vercel Free (Serverless)

We added `api/index.js` wrappers so backends can also deploy on Vercel as serverless functions (100% free, no sleep):

1. Vercel → New Project → Root Directory `leadflow-automation` → Deploy
   - Vercel will use `vercel.json` → Routes all to `api/index.js` → Serverless
   - Get URL `https://leadflow-automation-backend.vercel.app`
2. Same for `leadflow-ai` → Get URL `https://leadflow-ai-backend.vercel.app`
3. Update frontend env vars to point to Vercel backend URLs instead of Render

**Pros:** No sleep, faster cold start, all on Vercel
**Cons:** Filesystem ephemeral (/tmp), data resets — use Google Sheets free for persistence

## Getting URLs & Mission Control

**Vercel:** https://vercel.com/dashboard → Each project → Domains → Copy URL → Deployments → Logs

**Render:** https://dashboard.render.com → Each service → URL at top → Logs tab → Metrics tab

**n8n:** https://leadflow-n8n.onrender.com → Workflows, Executions, Credentials

## Final Live URLs Example

```
Website: https://leadflow-pro.vercel.app
Automation API: https://leadflow-automation-backend.onrender.com
Automation Dashboard: https://leadflow-automation-dashboard.vercel.app
AI API: https://leadflow-ai-backend.onrender.com
AI Dashboard: https://leadflow-ai-dashboard.vercel.app
n8n: https://leadflow-n8n.onrender.com
```

All free forever on hobby tiers.
