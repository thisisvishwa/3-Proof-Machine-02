# START COMMANDS — Local & Live

## Local Development — All 5 Services

### Prerequisites (Free)
- Node.js 18+ — https://nodejs.org/ (free)
- npm (comes with Node)

### Install All (One Command)
```bash
cd leadflow-proof-machine
npm run install:all
```

### Run Each Demo (Separate Terminals)

**Terminal 1 — Demo 1 Website (Port 5173):**
```bash
cd leadflow-pro
npm install
npm run dev
# → http://localhost:5173
# → Network: http://YOUR_IP:5173
```

**Terminal 2 — Demo 2 Backend (Port 3001):**
```bash
cd leadflow-automation
npm install
node server/index.js
# → http://localhost:3001
# → Webhook: POST http://localhost:3001/leadflow/new-lead
# → API: GET http://localhost:3001/api/leads
```

**Terminal 3 — Demo 2 Dashboard (Port 5174):**
```bash
cd leadflow-automation/frontend
npm install
npm run dev
# → http://localhost:5174
```

**Terminal 4 — Demo 3 Backend (Port 3002):**
```bash
cd leadflow-ai
npm install
node server/index.js
# → http://localhost:3002
# → API: POST http://localhost:3002/api/analyze-lead
# → Dashboard API: GET http://localhost:3002/api/dashboard
```

**Terminal 5 — Demo 3 Dashboard (Port 5175):**
```bash
cd leadflow-ai/frontend
npm install
npm run dev
# → http://localhost:5175
```

### One-Line Start All (using concurrently — optional)

Install concurrently globally free:
```bash
npm install -g concurrently
```

Then at root:
```bash
concurrently \
  "cd leadflow-pro && npm run dev" \
  "cd leadflow-automation && node server/index.js" \
  "cd leadflow-automation/frontend && npm run dev" \
  "cd leadflow-ai && node server/index.js" \
  "cd leadflow-ai/frontend && npm run dev"
```

---

## Live Deployment — Start Commands (Free Hosting)

### Vercel Frontends — No Start Command Needed (Auto)

Vercel auto builds and serves — you just push to GitHub:

```bash
git add .
git commit -m "update"
git push
# Vercel auto deploys in 1-2 min
```

**Manual redeploy:** Vercel Dashboard → Project → Deployments → Redeploy

### Render Backends — No Start Command Needed (Auto)

Render uses start command from `render.yaml`:

```
Build Command: npm install
Start Command: node server/index.js
```

**Manual redeploy:** Render Dashboard → Service → Manual Deploy → Deploy latest commit

**View Logs:** Render Dashboard → Service → Logs tab

### n8n on Render — No Start Command (Docker)

Image: `n8nio/n8n:latest`

**Start is automatic.** Logs in Render Dashboard → leadflow-n8n → Logs

**Login:** `https://your-n8n-url.onrender.com` → admin / LeadFlow123

---

## How to Get Deployed URLs

### Vercel URLs (Mission Control)

1. Go to https://vercel.com/dashboard
2. You see 3 projects:
   - leadflow-pro
   - leadflow-automation-dashboard
   - leadflow-ai-dashboard
3. Click project → **Settings → Domains** → Copy URL like `https://leadflow-pro-xxxx.vercel.app`
4. **Live URL is there.** Click to open.

**Vercel Mission Control Features (Free):**
- Deployments tab → See build logs, commit history
- Analytics tab → Page views, visitors
- Settings → Environment Variables → Update webhook URLs
- Domains → Add custom domain free (optional)

### Render URLs (Backend + n8n Mission Control)

1. Go to https://dashboard.render.com
2. You see services:
   - leadflow-automation-backend
   - leadflow-ai-backend
   - leadflow-n8n
3. Click service → Top left shows URL `https://...onrender.com` → Copy
4. **Test:** Open `https://your-backend.onrender.com/` in browser → Should show JSON status

**Render Mission Control Features (Free):**
- Logs tab → Live server logs
- Metrics tab → CPU, RAM, Requests
- Environment tab → Edit env vars (auto redeploys)
- Deploys tab → Build history, manual deploy
- Settings → Free plan info, region

### n8n Mission Control

1. Open `https://leadflow-n8n.onrender.com`
2. Login: User `admin`, Password `LeadFlow123` (from render.yaml env)
3. **Workflows:** Left → Workflows → See 4 imported LeadFlow workflows
4. **Executions:** Left → Executions → See every lead execution with data
5. **Credentials:** Left → Credentials → Add Google Sheets OAuth2, OpenAI, SMTP (all free Google account, optional)

---

## Live Testing Commands (After Deploy)

**Test Demo 2 Backend Live:**
```bash
curl https://leadflow-automation-backend.onrender.com/
curl -X POST https://leadflow-automation-backend.onrender.com/leadflow/new-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Sarah Chen","business":"Atlas Labs","email":"sarah@atlaslabs.io","phone":"+14155552671","website":"atlaslabs.io","industry":"B2B SaaS","budget":"$15k - $50k","needs":"Ready to Buy","message":"Need CRM automation ASAP, ready to start this week","source":"LeadFlow Pro Website","timestamp":"2026-09-13T10:00:00Z"}'
```

**Test Demo 3 Backend Live:**
```bash
curl https://leadflow-ai-backend.onrender.com/api/dashboard
curl -X POST https://leadflow-ai-backend.onrender.com/api/analyze-lead \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Sarah Johnson","businessName":"Acme Growth Solutions","email":"sarah@acme.co","industry":"Professional Services","budget":"$5k - $15k","currentChallenge":"Leads slip through, no follow-up","timeline":"Within 30 days"}'
```

**Test Full Ecosystem Live:**
1. Open Demo 1 live URL → Submit form
2. Open Demo 2 Dashboard live URL → See lead HOT
3. Open Demo 3 Dashboard live URL → Lead History → See intelligence

---

## Environment Variables for Live

**After deploy, update these to connect live:**

**Vercel Demo 1 Env:**
```
VITE_LEAD_WEBHOOK_URL=https://leadflow-automation-backend.onrender.com/leadflow/new-lead
VITE_API_BASE=https://leadflow-automation-backend.onrender.com
```

**Vercel Demo 2 Dashboard Env:**
```
VITE_API_BASE=https://leadflow-automation-backend.onrender.com
```

**Vercel Demo 3 Dashboard Env:**
```
VITE_API_BASE=https://leadflow-ai-backend.onrender.com
```

**Render Demo 2 Backend Env:**
```
LEADFLOW_AI_URL=https://leadflow-ai-backend.onrender.com
```

Redeploy after updating env vars.

---

## Troubleshooting Free Tier

**Render sleeps after 15 min inactivity:**
- First request takes 30-50 sec to wake — normal for free
- Fix free: https://uptimerobot.com/ → Add monitors for your 3 Render URLs every 5 min → Keeps awake

**Vercel build fails:**
- Check Root Directory is correct (leadflow-pro, not root)
- Check Build Command `npm run build`
- Check Node version: Vercel → Settings → Node.js Version → 20.x

**CORS errors:**
- Our backends have `cors({ origin: "*" })` — allows all origins free
- If you still see CORS, add frontend URL to backend env `CORS_ORIGIN=https://your-frontend.vercel.app`

**Data resets on Render:**
- Render free filesystem ephemeral — data in `data/*.json` resets on redeploy
- Free fix: Use Google Sheets as DB (free forever) — set `GOOGLE_SHEETS_ENABLED=true` + `GOOGLE_SHEETS_ID`
- Or use Supabase Free Postgres (free) — replace JSON with DB

All free, no money involved.
