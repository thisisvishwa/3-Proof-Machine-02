import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Check,
  Clock,
  Database,
  FileText,
  Flame,
  Mail,
  Play,
  RefreshCw,
  Zap,
  Thermometer,
  Users,
  Workflow,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type Lead = any;
type Log = any;

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "violet" }) {
  const tones: any = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest ${tones[tone]}`}>{children}</span>;
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [lRes, logRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads`).then((r) => r.json()),
        fetch(`${API_BASE}/api/logs`).then((r) => r.json()),
        fetch(`${API_BASE}/api/daily-report`).then((r) => r.json()),
      ]);
      setLeads(lRes.leads || []);
      setLogs(logRes.logs || []);
      setReport(rRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 4000);
    return () => clearInterval(id);
  }, []);

  const testLead = async (type: "hot" | "warm" | "cold" | "invalid") => {
    setTesting(type);
    try {
      await fetch(`${API_BASE}/api/test/${type}`, { method: "POST" });
      setTimeout(fetchData, 1000);
    } finally {
      setTesting(null);
    }
  };

  const triggerReport = async () => {
    await fetch(`${API_BASE}/api/daily-report`, { method: "POST" });
    fetchData();
  };

  const hotCount = leads.filter((l) => l["Lead Temperature"] === "HOT").length;
  const warmCount = leads.filter((l) => l["Lead Temperature"] === "WARM").length;
  const coldCount = leads.filter((l) => l["Lead Temperature"] === "COLD").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold tracking-tight">LeadFlow Automation</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">DEMO 2</span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              </div>
              <div className="text-[11px] font-medium text-slate-500">n8n-style pipeline • Webhook → Validate → Normalize → Sheets → AI → Score → Notify → Follow-up → Report</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="green">LIVE API: {API_BASE}</Badge>
            <button onClick={fetchData} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Pipeline Visual */}
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-slate-600">
              <Activity className="h-4 w-4" /> Pipeline — Core Workflow
            </h3>
            <span className="text-[11px] text-slate-500">Production-style • Error handling • Transparent scoring</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {[
              "Website Form",
              "Webhook POST /leadflow/new-lead",
              "Validate Lead",
              "Normalize Data",
              "Google Sheets",
              "AI Qualification",
              "Lead Score 0-100",
              "HOT / WARM / COLD Router",
              "Email Notification",
              "Follow-Up Generation",
              "Daily Report",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700">{step}</div>
                {i !== 10 && <div className="h-px w-4 bg-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            { label: "Total Leads", value: leads.length, icon: Users, tone: "slate" },
            { label: "HOT", value: hotCount, icon: Flame, tone: "red" },
            { label: "WARM", value: warmCount, icon: Thermometer, tone: "amber" },
            { label: "COLD", value: coldCount, icon: BarChart3, tone: "blue" },
            { label: "Avg Score", value: report?.average_qualification_score || report?.average_score || 0, icon: Zap, tone: "violet" },
          ].map((s) => (
            <div key={s.label} className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{s.label}</span>
                <s.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-[28px] font-extrabold tracking-tight">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Leads Table */}
          <div className="rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
                <Database className="h-4 w-4" /> Leads — Google Sheets (Demo: local JSON)
              </h3>
              <div className="flex gap-2">
                <button onClick={() => testLead("hot")} disabled={!!testing} className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black disabled:opacity-50">
                  {testing === "hot" ? "..." : "Test HOT"}
                </button>
                <button onClick={() => testLead("warm")} disabled={!!testing} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold hover:bg-slate-50 disabled:opacity-50">
                  Test WARM
                </button>
                <button onClick={() => testLead("cold")} disabled={!!testing} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold hover:bg-slate-50 disabled:opacity-50">
                  Test COLD
                </button>
                <button onClick={() => testLead("invalid")} disabled={!!testing} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">
                  Test INVALID
                </button>
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              {loading ? (
                <div className="p-10 text-center text-slate-500">Loading...</div>
              ) : leads.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Users className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mt-3 text-[14px] font-medium text-slate-600">No leads yet — submit from Demo 1 website or click Test HOT</p>
                  <p className="mt-1 text-[12px] text-slate-400">Webhook: POST {API_BASE}/leadflow/new-lead</p>
                </div>
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Lead</th>
                      <th className="px-4 py-2.5 font-semibold">Business</th>
                      <th className="px-4 py-2.5 font-semibold">Score</th>
                      <th className="px-4 py-2.5 font-semibold">Temp</th>
                      <th className="px-4 py-2.5 font-semibold">Need</th>
                      <th className="px-4 py-2.5 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.slice(0, 50).map((lead) => (
                      <tr key={lead["Lead ID"]} onClick={() => setActiveLead(lead)} className="cursor-pointer hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{lead.Name || lead["Lead ID"]}</div>
                          <div className="text-[11px] text-slate-500">{lead.Email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{lead.Business}</div>
                          <div className="text-[11px] text-slate-500">{lead.Industry} • {lead.Budget}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${ (lead["Qualification Score"] || 0) >= 80 ? "bg-red-50 text-red-700" : (lead["Qualification Score"] || 0) >= 50 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600" }`}>
                            {lead["Qualification Score"] ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={lead["Lead Temperature"] === "HOT" ? "red" : lead["Lead Temperature"] === "WARM" ? "amber" : lead["Lead Temperature"] === "INVALID" ? "slate" : "blue"}>
                            {lead["Lead Temperature"] || "PENDING"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[12px]">{lead["AI Business Need"] || lead.Need}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{lead["Follow-Up Status"] || "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Logs & Report */}
          <div className="space-y-6">
            {/* Daily Report */}
            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-slate-600">
                  <FileText className="h-4 w-4" /> Daily Report — Node 11
                </h3>
                <button onClick={triggerReport} className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black">
                  <Play className="mr-1 inline h-3 w-3" /> Trigger Now
                </button>
              </div>
              {report ? (
                <div className="mt-4 space-y-3 text-[12px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">Total Today</div>
                      <div className="text-[20px] font-bold">{report.total_leads ?? report.total ?? 0}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">Avg Score</div>
                      <div className="text-[20px] font-bold">{report.average_qualification_score ?? report.average_score ?? 0}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Breakdown</div>
                    <div className="mt-2 flex gap-2">
                      <Badge tone="red">HOT {report.hot_leads}</Badge>
                      <Badge tone="amber">WARM {report.warm_leads}</Badge>
                      <Badge tone="blue">COLD {report.cold_leads}</Badge>
                      <Badge tone="slate">INVALID {report.invalid_leads}</Badge>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-600">
                      Most common need: <b>{report.most_common_business_need || report.most_common_need}</b> • Industry: <b>{report.most_common_industry}</b>
                    </div>
                    {report.highest_scoring_lead && (
                      <div className="mt-2 text-[11px]">
                        Highest: <b>{report.highest_scoring_lead.name}</b> ({report.highest_scoring_lead.business}) — Score {report.highest_scoring_lead.score}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl bg-[#0F172A] p-3 text-white">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">Email Preview — LIVE vs DEMO</div>
                    <div className="mt-1 text-[12px] font-medium">Subject: LeadFlow Daily Report — {report.date}</div>
                    <div className="mt-1 text-[11px] text-white/60">To: manager@leadflowpro.demo [{report.email?.mode || "DEMO"}] • Follow-ups: {report.follow_ups_sent} • Failed: {report.failed_automations}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-[12px] text-slate-500">No report yet</div>
              )}
            </div>

            {/* Logs */}
            <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-slate-600">
                <Clock className="h-4 w-4" /> Automation Logs — Error Handling (Node 10)
              </h3>
              <div className="mt-4 max-h-[320px] space-y-2 overflow-auto">
                {logs.slice(0, 30).map((log) => (
                  <div key={log.id} className="flex gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${log.level === "error" ? "bg-red-500" : log.level === "warn" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{log.node}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="truncate text-[10px] text-slate-400">{log.lead_id}</span>
                      </div>
                      <div className="text-[12px] font-medium leading-4 text-slate-700">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Lead Drawer */}
        {activeLead && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setActiveLead(null)}>
            <div className="h-full w-full max-w-[560px] overflow-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 border-b border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-bold tracking-tight">Lead Detail — {activeLead["Lead ID"]}</h3>
                  <button onClick={() => setActiveLead(null)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">✕</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={activeLead["Lead Temperature"] === "HOT" ? "red" : activeLead["Lead Temperature"] === "WARM" ? "amber" : "blue"}>{activeLead["Lead Temperature"]} • Score {activeLead["Qualification Score"]}</Badge>
                  <Badge tone="violet">{activeLead["AI Business Need"]}</Badge>
                  <Badge tone="slate">{activeLead["Lead Intent"]} • {activeLead.Urgency}</Badge>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Contact</h4>
                  <div className="mt-2 rounded-xl bg-slate-50 p-4 text-[13px]">
                    <div><b>{activeLead.Name}</b> at {activeLead.Business}</div>
                    <div className="text-slate-600">{activeLead.Email} • {activeLead.Phone}</div>
                    <div className="text-slate-600">{activeLead.Website} • {activeLead.Industry} • {activeLead.Budget}</div>
                    <div className="mt-2 text-slate-700">Need: {activeLead.Need}</div>
                    <div className="text-slate-600">Message: {activeLead.Message}</div>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">
                    <Bot className="h-4 w-4" /> AI Qualification — Node 5
                  </h4>
                  <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-[13px]">
                    <div>Business Need: <b>{activeLead["AI Business Need"]}</b></div>
                    <div>Intent: <b>{activeLead["Lead Intent"]}</b> • Urgency: <b>{activeLead.Urgency}</b></div>
                    <div className="mt-2 text-[12px] leading-5 text-slate-700">Reasoning: {activeLead._qual?.reasoning || "Heuristic scoring based on budget, intent, urgency, data quality"}</div>
                    <div className="mt-2">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Score Breakdown</div>
                      <pre className="mt-1 rounded-lg bg-white p-2 text-[11px]">{JSON.stringify(activeLead._qual?.score_breakdown || {}, null, 2)}</pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">
                    <Mail className="h-4 w-4" /> Email Notification — Node 7
                  </h4>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-[12px] font-bold">Subject: {activeLead["Lead Temperature"] === "HOT" ? "🔥" : activeLead["Lead Temperature"] === "WARM" ? "🟡" : "⚪"} {activeLead["Lead Temperature"]} LEAD — {activeLead.Business} — Score {activeLead["Qualification Score"]}</div>
                    <div className="mt-2 text-[11px] text-slate-500">To: {activeLead["Notification Status"]} • Mode: DEMO (simulated) — LIVE would use SMTP creds</div>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">
                    <Zap className="h-4 w-4" /> Follow-Up Generation — Node 8 & 9
                  </h4>
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Personalized Sales Message</div>
                    <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-800">{activeLead["Sales Message"] || activeLead._qual?.sales_message}</pre>
                    <div className="mt-3 flex gap-2">
                      <Badge tone="green">Email: DEMO — simulated</Badge>
                      <Badge tone="slate">WhatsApp: DEMO — placeholder</Badge>
                      <Badge tone="slate">CRM: DEMO — placeholder</Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900 p-4 text-white">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/50">Google Sheets Row — Node 4</div>
                  <pre className="mt-2 max-h-[200px] overflow-auto text-[10px] leading-4 text-white/70">{JSON.stringify(activeLead, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentation Footer */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[16px] border border-slate-200 bg-white p-5">
            <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-600">
              <Check className="h-4 w-4" /> LIVE vs DEMO
            </h4>
            <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-slate-600">
              <li><b className="text-emerald-700">LIVE in this demo:</b> Webhook, Validation, Normalization, Heuristic AI, Scoring, Routing, Logs, Daily Report, Local JSON Sheets</li>
              <li><b className="text-amber-700">DEMO / Placeholder:</b> Google Sheets API (needs OAuth creds), SMTP Email (needs SMTP creds), WhatsApp Business API, HubSpot/Salesforce, Slack — all documented with real integration code ready</li>
            </ul>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-5">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-600">Security</h4>
            <ul className="mt-3 space-y-1 text-[12px] leading-5 text-slate-600">
              <li>• No hard-coded secrets — env vars only</li>
              <li>• Input validation & sanitization</li>
              <li>• Error logging without exposing creds</li>
              <li>• Webhook auth ready (add header check)</li>
              <li>• Minimal PII exposure in logs</li>
            </ul>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-5">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-600">Test Every Path</h4>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => testLead("hot")} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">HOT — $15k+, urgent, ready</button>
              <button onClick={() => testLead("warm")} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-700">WARM — $5k, evaluating</button>
              <button onClick={() => testLead("cold")} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-700">COLD — &lt;$1k, researching</button>
              <button onClick={() => testLead("invalid")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-500">INVALID — missing fields</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-[11px] text-slate-500">
        LeadFlow Automation — DEMO 2 • Production-style n8n workflows • 4 workflows • Heuristic AI + OpenAI-ready • © 2026 LeadFlow Pro Demo
      </footer>
    </div>
  );
}
