import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Edit3,
  Flame,
  Globe,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Thermometer,
  Users,
  Zap,
  Layers,
  BrainCircuit,
  ArrowRight,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3002";

type Analysis = {
  business_need: { primary: string; secondary: string; summary: string };
  lead_intent: { level: string; confidence: number; reason: string };
  urgency: { level: string; reason: string };
  qualification: {
    score: number;
    temperature: string;
    factors: { business_fit: number; buying_intent: number; budget: number; urgency: number; problem_clarity: number };
    reasoning: string;
  };
  recommended_action: { action: string; priority: string; reason: string };
  sales_message: { email: string; whatsapp: string; linkedin: string; sms: string };
  _meta?: any;
};

type LeadRecord = {
  lead_id: string;
  created_at: string;
  input: any;
  analysis: Analysis;
  score: number;
  temperature: string;
  recommended_action: string;
};

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "violet" }) {
  const tones: any = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${tones[tone]}`}>{children}</span>;
}

function CircularScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#64748b";
  return (
    <div className="relative flex h-[140px] w-[140px] items-center justify-center">
      <svg className="h-[140px] w-[140px] -rotate-90">
        <circle cx="70" cy="70" r="54" stroke="#e2e8f0" strokeWidth="10" fill="none" />
        <circle
          cx="70"
          cy="70"
          r="54"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[32px] font-extrabold tracking-tight">{score}</div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">/100</div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState<"dashboard" | "analyze" | "history" | "reports" | "settings">("dashboard");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LeadRecord | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [demoLeads, setDemoLeads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTemp, setFilterTemp] = useState<string>("all");
  const [showReasoning, setShowReasoning] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"email" | "whatsapp" | "linkedin" | "sms">("email");
  const [editMessage, setEditMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    companySize: "",
    budget: "",
    currentChallenge: "",
    desiredOutcome: "",
    timeline: "",
    additionalNotes: "",
  });

  const fetchData = async () => {
    try {
      const [leadsRes, dashRes, demoRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads`).then((r) => r.json()),
        fetch(`${API_BASE}/api/dashboard`).then((r) => r.json()),
        fetch(`${API_BASE}/api/demo-leads`).then((r) => r.json()),
      ]);
      setLeads(leadsRes.leads || []);
      setDashboardData(dashRes);
      setDemoLeads(demoRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pushToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadDemoLead = (demo: any) => {
    setForm(demo);
    setActiveNav("analyze");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const processingSteps = [
    "Reading lead information",
    "Identifying business need",
    "Evaluating buying intent",
    "Assessing urgency",
    "Calculating qualification score",
    "Generating recommended action",
    "Preparing personalized sales message",
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.businessName || !form.email) {
      pushToast("Please fill required fields");
      return;
    }
    setAnalyzing(true);
    setProcessingStep(0);
    setAnalysisResult(null);

    // Animate processing steps
    const interval = setInterval(() => {
      setProcessingStep((s) => {
        if (s >= processingSteps.length - 1) {
          clearInterval(interval);
          return s;
        }
        return s + 1;
      });
    }, 450);

    try {
      const res = await fetch(`${API_BASE}/api/analyze-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      // Ensure animation completes
      setTimeout(() => {
        clearInterval(interval);
        setProcessingStep(processingSteps.length);
        setAnalysisResult({
          lead_id: data.lead_id,
          created_at: new Date().toISOString(),
          input: form,
          analysis: data.analysis,
          score: data.analysis.qualification.score,
          temperature: data.analysis.qualification.temperature,
          recommended_action: data.analysis.recommended_action.action,
        });
        setAnalyzing(false);
        fetchData();
        pushToast(`Analyzed — Score ${data.analysis.qualification.score} • ${data.analysis.qualification.temperature}`);
      }, 800);
    } catch (err: any) {
      clearInterval(interval);
      setAnalyzing(false);
      pushToast(err.message || "Analysis failed");
    }
  };

  const copyMessage = () => {
    const msg = editMessage ? editedMessage : analysisResult?.analysis.sales_message[activeChannel] || selectedLead?.analysis.sales_message[activeChannel] || "";
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    pushToast("Message copied to clipboard");
  };

  const filteredLeads = leads.filter((l) => {
    if (filterTemp !== "all" && l.temperature !== filterTemp) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.input.fullName.toLowerCase().includes(q) || l.input.businessName.toLowerCase().includes(q) || l.input.email.toLowerCase().includes(q);
    }
    return true;
  });

  const currentAnalysis = analysisResult || selectedLead;

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-[100] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-medium shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)]">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold tracking-tight">LeadFlow AI</span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-700">Demo 3</span>
                </div>
                <div className="hidden text-[11px] font-medium text-slate-500 md:block">AI-Powered Lead Intelligence</div>
              </div>
            </div>

            <nav className="hidden items-center gap-1 lg:flex">
              {[
                ["Dashboard", "dashboard"],
                ["Analyze Lead", "analyze"],
                ["Lead History", "history"],
                ["Reports", "reports"],
                ["Settings", "settings"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => setActiveNav(id as any)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${activeNav === id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 md:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              AI: heuristic • Demo Mode — no API key needed
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-700">AM</div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 bg-white px-4 py-2 lg:hidden">
          {[
            ["Dashboard", "dashboard"],
            ["Analyze", "analyze"],
            ["History", "history"],
            ["Reports", "reports"],
            ["Settings", "settings"],
          ].map(([label, id]) => (
            <button
              key={id}
              onClick={() => setActiveNav(id as any)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium ${activeNav === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        {/* DASHBOARD */}
        {activeNav === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] font-bold tracking-tight">Lead Intelligence Dashboard</h1>
              <p className="text-[14px] text-slate-600">Executive view — who are your leads, what do they need, how likely to buy, what to do next. Demo data labeled.</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Leads Analyzed", value: dashboardData?.metrics?.leadsAnalyzed || 128, sub: "Total", icon: Users, demo: dashboardData?.demo },
                { label: "Hot Leads", value: dashboardData?.metrics?.hotLeads || 24, sub: "80-100 score", icon: Flame, tone: "red" },
                { label: "Warm Leads", value: dashboardData?.metrics?.warmLeads || 61, sub: "50-79 score", icon: Thermometer, tone: "amber" },
                { label: "Average Score", value: `${dashboardData?.metrics?.averageScore || 68}/100`, sub: "Qualification", icon: BarChart3, tone: "violet" },
              ].map((m: any) => (
                <div key={m.label} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{m.label}</span>
                    <m.icon className={`h-4 w-4 ${m.tone === "red" ? "text-red-500" : m.tone === "amber" ? "text-amber-500" : m.tone === "violet" ? "text-violet-500" : "text-slate-400"}`} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-[32px] font-extrabold tracking-tight">{m.value}</span>
                    {m.demo && <Badge tone="slate">Demo</Badge>}
                  </div>
                  <div className="mt-1 text-[12px] text-slate-500">{m.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Recent + High Priority */}
              <div className="space-y-6">
                <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold tracking-tight">Recent Analyses</h3>
                    <button onClick={() => setActiveNav("history")} className="text-[12px] font-medium text-slate-500 hover:text-slate-900">
                      View all →
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(dashboardData?.recent?.length ? dashboardData.recent : leads.slice(0, 3)).map((lead: any) => (
                      <div key={lead.lead_id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                            {(lead.input?.fullName || lead.fullName || "U").split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold">{lead.input?.fullName || lead.fullName} — {lead.input?.businessName || lead.businessName}</div>
                            <div className="text-[11px] text-slate-500">{lead.analysis?.business_need?.primary || "Lead Gen"} • {lead.analysis?.lead_intent?.level || "Interested"} • {new Date(lead.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Badge tone={lead.temperature === "HOT" ? "red" : lead.temperature === "WARM" ? "amber" : "blue"}>{lead.temperature} {lead.score}</Badge>
                      </div>
                    ))}
                    {leads.length === 0 && <div className="py-6 text-center text-[13px] text-slate-500">No analyses yet — analyze a lead to see here. Demo data shown above.</div>}
                  </div>
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-[14px] font-bold tracking-tight">Lead Temperature Distribution</h3>
                  <div className="mt-5 flex items-end gap-3">
                    {[
                      { label: "HOT", value: dashboardData?.temperatureDistribution?.HOT || 24, color: "bg-red-500", max: 80 },
                      { label: "WARM", value: dashboardData?.temperatureDistribution?.WARM || 61, color: "bg-amber-500", max: 80 },
                      { label: "COLD", value: dashboardData?.temperatureDistribution?.COLD || 43, color: "bg-slate-300", max: 80 },
                    ].map((bar) => (
                      <div key={bar.label} className="flex-1">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          <span>{bar.label}</span>
                          <span>{bar.value}</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-xl bg-slate-900 p-4 text-white">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
                      <Sparkles className="h-3.5 w-3.5" /> High-priority opportunities
                    </div>
                    <div className="mt-3 space-y-2">
                      {(dashboardData?.highPriority?.length ? dashboardData.highPriority : leads.filter((l) => l.score >= 80).slice(0, 3)).map((lead: any) => (
                        <div key={lead.lead_id} className="flex items-center justify-between text-[12px]">
                          <span>{lead.input?.fullName} — {lead.input?.businessName}</span>
                          <span className="font-bold">{lead.score}/100</span>
                        </div>
                      ))}
                      {leads.filter((l) => l.score >= 80).length === 0 && <div className="text-[12px] text-white/60">No HOT leads yet — analyze Daniel Wilson demo lead (ASAP, $15k-$50k) to see HOT example</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo leads quick load */}
              <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
                  <Bot className="h-4 w-4" /> Preloaded Demo Leads — Fictional
                </h3>
                <p className="mt-1 text-[12px] text-slate-500">Click to load into Analyze Lead form — no real personal data</p>
                <div className="mt-4 space-y-3">
                  {demoLeads.map((demo) => (
                    <button key={demo.email} onClick={() => loadDemoLead(demo)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-900 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-semibold">{demo.fullName} — {demo.businessName}</div>
                        <Badge tone="slate">{demo.industry}</Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">{demo.currentChallenge}</div>
                      <div className="mt-2 flex gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{demo.budget}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">• {demo.timeline}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-violet-700">Connection to Demo 2</div>
                  <p className="mt-1 text-[12px] leading-5 text-violet-900/70">
                    LeadFlow AI can receive leads from Demo 2 automation via <code className="rounded bg-white px-1 py-0.5">POST /api/from-automation</code> — Demo 2 forwards normalized lead, Demo 3 analyzes and stores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYZE LEAD */}
        {activeNav === "analyze" && (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Form */}
            <div>
              <h1 className="text-[24px] font-bold tracking-tight">Analyze Lead With AI</h1>
              <p className="mt-1 text-[13px] text-slate-600">Enter lead information — AI will transform raw data into business intelligence and recommended sales action.</p>

              <form onSubmit={handleAnalyze} className="mt-6 space-y-4 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { key: "fullName", label: "Full Name *", placeholder: "Sarah Johnson" },
                    { key: "businessName", label: "Business Name *", placeholder: "Acme Growth Solutions" },
                    { key: "email", label: "Email *", placeholder: "sarah@acme.co", type: "email" },
                    { key: "phone", label: "Phone", placeholder: "+14155550101" },
                    { key: "website", label: "Website", placeholder: "acmegrowth.co" },
                    { key: "industry", label: "Industry", placeholder: "B2B SaaS / Agency / Professional Services", type: "select", options: ["B2B SaaS", "Agency / Services", "Professional Services", "E-commerce", "Healthcare", "Education", "Local Business", "Startup", "Other"] },
                    { key: "companySize", label: "Company Size", placeholder: "Select size", type: "select", options: ["1-10", "11-50", "51-200", "200+"] },
                    { key: "budget", label: "Budget", placeholder: "Select budget", type: "select", options: ["Less than $1k", "$1k - $5k", "$5k - $15k", "$15k - $50k", "$50k+", "$2,500–$5,000/month"] },
                    { key: "timeline", label: "Timeline", placeholder: "ASAP / Within 30 days / Next month", type: "select", options: ["ASAP — this week", "Within 30 days", "Next month", "Within 90 days", "Future — researching"] },
                  ].map((field: any) => (
                    <div key={field.key} className={field.key === "industry" || field.key === "companySize" ? "" : ""}>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          value={(form as any)[field.key]}
                          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          <option value="">Select {field.label.replace(" *", "")}</option>
                          {field.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={(form as any)[field.key]}
                          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Current Challenge *</label>
                  <textarea
                    value={form.currentChallenge}
                    onChange={(e) => setForm({ ...form, currentChallenge: e.target.value })}
                    placeholder="What problem are they facing? e.g. We get traffic but leads slip through, no follow-up system..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Desired Outcome</label>
                  <textarea
                    value={form.desiredOutcome}
                    onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
                    placeholder="What do they want to achieve? e.g. Repeatable acquisition system with automated follow-up"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Additional Notes</label>
                  <input
                    value={form.additionalNotes}
                    onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                    placeholder="CRM, team size, traffic sources, etc."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <button type="submit" disabled={analyzing} className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-[14px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)] transition hover:bg-black disabled:opacity-50">
                  {analyzing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze Lead With AI
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-500">Demo Mode: heuristic AI — no API key needed. Set AI_PROVIDER=openai + OPENAI_API_KEY for LIVE LLM.</p>
              </form>
            </div>

            {/* AI Processing + Result */}
            <div className="space-y-6">
              {analyzing && (
                <div className="rounded-[20px] border border-violet-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(124,58,237,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                      <Bot className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold tracking-tight">Analyzing Lead</div>
                      <div className="text-[11px] font-medium uppercase tracking-widest text-slate-500">AI processing — transparent steps, not fake</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {processingSteps.map((step, idx) => {
                      const done = idx < processingStep;
                      const active = idx === processingStep;
                      return (
                        <div key={step} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${done ? "border-emerald-200 bg-emerald-50" : active ? "border-violet-200 bg-violet-50" : "border-slate-100 bg-slate-50/50"}`}>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : active ? "bg-violet-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                            {done ? <Check className="h-3.5 w-3.5" /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                          </div>
                          <span className={`text-[13px] font-medium ${done ? "text-emerald-800" : active ? "text-violet-800" : "text-slate-500"}`}>{step}</span>
                          {active && <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-violet-600">Processing</span>}
                          {done && <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-emerald-600">Done</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-[11px] text-slate-500">Demo Mode uses heuristic engine with transparent scoring — same structure as real OpenAI call. No fake claims.</div>
                </div>
              )}

              {currentAnalysis && !analyzing && (
                <div className="space-y-6">
                  {/* Lead Profile */}
                  <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-[14px] font-bold text-white">
                          {currentAnalysis.input.fullName.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-[18px] font-bold tracking-tight">{currentAnalysis.input.fullName}</div>
                          <div className="flex items-center gap-2 text-[13px] text-slate-600">
                            <Building2 className="h-4 w-4" /> {currentAnalysis.input.businessName}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="slate">{currentAnalysis.input.industry}</Badge>
                            <Badge tone="slate">{currentAnalysis.input.companySize}</Badge>
                            <Badge tone="slate">{currentAnalysis.input.budget}</Badge>
                            <Badge tone="blue">{currentAnalysis.input.timeline}</Badge>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedLead(null)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 lg:hidden">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-[12px] md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" /> {currentAnalysis.input.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" /> {currentAnalysis.input.phone || "unknown"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-400" /> {currentAnalysis.input.website || "unknown"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-400" /> {currentAnalysis.input.companySize || "unknown"} • {currentAnalysis.input.industry}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Need</div>
                      <div className="mt-1 text-[13px] font-medium">{currentAnalysis.input.currentChallenge}</div>
                      <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Desired Outcome</div>
                      <div className="mt-1 text-[13px] text-slate-600">{currentAnalysis.input.desiredOutcome}</div>
                    </div>
                  </div>

                  {/* Score + Business Need + Intent + Urgency Grid */}
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Qualification Score</h3>
                      <div className="mt-4 flex flex-col items-center">
                        <CircularScore score={currentAnalysis.analysis.qualification.score} />
                        <div className="mt-3">
                          <Badge tone={currentAnalysis.temperature === "HOT" ? "red" : currentAnalysis.temperature === "WARM" ? "amber" : "blue"}>
                            {currentAnalysis.temperature} LEAD • {currentAnalysis.analysis.qualification.score}/100
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2.5">
                        {[
                          { label: "Business Fit", value: currentAnalysis.analysis.qualification.factors.business_fit },
                          { label: "Buying Intent", value: currentAnalysis.analysis.qualification.factors.buying_intent },
                          { label: "Budget", value: currentAnalysis.analysis.qualification.factors.budget },
                          { label: "Urgency", value: currentAnalysis.analysis.qualification.factors.urgency },
                          { label: "Problem Clarity", value: currentAnalysis.analysis.qualification.factors.problem_clarity },
                        ].map((f) => (
                          <div key={f.label} className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-slate-600">{f.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-[80px] overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-slate-900" style={{ width: `${(f.value / 20) * 100}%` }} />
                              </div>
                              <span className="w-[50px] text-right text-[11px] font-bold">{f.value}/20</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => setShowReasoning(!showReasoning)} className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left text-[12px] font-semibold hover:bg-slate-100">
                        Why This Lead Scored {currentAnalysis.analysis.qualification.score}/100
                        <ChevronDown className={`h-4 w-4 transition ${showReasoning ? "rotate-180" : ""}`} />
                      </button>
                      {showReasoning && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-[12px] leading-5 text-slate-700">{currentAnalysis.analysis.qualification.reasoning}</div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-violet-200 bg-violet-50/50 p-5">
                        <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-violet-700">
                          <Target className="h-4 w-4" /> Business Need
                        </h3>
                        <div className="mt-3 text-[16px] font-bold tracking-tight text-slate-900">{currentAnalysis.analysis.business_need.primary} {currentAnalysis.analysis.business_need.secondary !== "unknown" ? `+ ${currentAnalysis.analysis.business_need.secondary}` : ""}</div>
                        <p className="mt-2 text-[13px] leading-5 text-slate-700">{currentAnalysis.analysis.business_need.summary}</p>
                      </div>

                      <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">
                          <Activity className="h-4 w-4" /> Lead Intent
                        </h3>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="text-[18px] font-bold tracking-tight">{currentAnalysis.analysis.lead_intent.level}</div>
                          <Badge tone="violet">{currentAnalysis.analysis.lead_intent.confidence}% confidence</Badge>
                        </div>
                        <p className="mt-2 text-[12px] leading-5 text-slate-600">{currentAnalysis.analysis.lead_intent.reason}</p>
                      </div>

                      <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">
                          <Clock className="h-4 w-4" /> Urgency
                        </h3>
                        <div className="mt-3 flex items-center gap-3">
                          <div className={`text-[18px] font-bold tracking-tight ${currentAnalysis.analysis.urgency.level === "Critical" ? "text-red-600" : currentAnalysis.analysis.urgency.level === "High" ? "text-amber-600" : "text-slate-900"}`}>{currentAnalysis.analysis.urgency.level}</div>
                          <Badge tone={currentAnalysis.analysis.urgency.level === "Critical" ? "red" : currentAnalysis.analysis.urgency.level === "High" ? "amber" : "slate"}>{currentAnalysis.analysis.urgency.level}</Badge>
                        </div>
                        <p className="mt-2 text-[12px] leading-5 text-slate-600">{currentAnalysis.analysis.urgency.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="rounded-[20px] border border-slate-900 bg-slate-900 p-6 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.4)]">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
                        <Zap className="h-4 w-4" /> Recommended Action
                      </h3>
                      <Badge tone={currentAnalysis.analysis.recommended_action.priority === "Critical" ? "red" : currentAnalysis.analysis.recommended_action.priority === "High" ? "amber" : "slate"}>{currentAnalysis.analysis.recommended_action.priority} Priority</Badge>
                    </div>
                    <div className="mt-3 text-[20px] font-bold tracking-tight">{currentAnalysis.analysis.recommended_action.action}</div>
                    <p className="mt-2 max-w-[600px] text-[13px] leading-5 text-white/70">{currentAnalysis.analysis.recommended_action.reason}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {[
                        ["Contact Lead", Mail],
                        ["Book Strategy Call", Calendar],
                        ["Add to CRM", Layers],
                        ["Send Sales Message", Send],
                      ].map(([label, Icon]: any) => (
                        <button key={label} onClick={() => pushToast(`${label} — demo action (would integrate with CRM/calendar)`)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur hover:bg-white/20">
                          <Icon className="h-4 w-4" /> {label} <span className="text-[10px] opacity-60">DEMO</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sales Message — Multi Channel */}
                  <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-[13px] font-bold tracking-tight">
                        <Sparkles className="h-4 w-4" /> AI-Generated Sales Message
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="hidden text-[11px] text-slate-500 md:block">Channel-specific versions — same analysis</span>
                        <Badge tone="violet">Editable</Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {[
                        ["Email", "email", Mail],
                        ["WhatsApp", "whatsapp", MessageSquare],
                        ["LinkedIn", "linkedin", Link2],
                        ["SMS", "sms", Phone],
                      ].map(([label, id, Icon]: any) => (
                        <button key={id} onClick={() => setActiveChannel(id)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${activeChannel === id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {editMessage ? (
                        <textarea
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          rows={8}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-6 focus:border-slate-900 focus:outline-none"
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap text-[13px] leading-6 text-slate-800">{currentAnalysis.analysis.sales_message[activeChannel]}</pre>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={copyMessage} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-[12px] font-bold text-white hover:bg-black">
                        <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy Message"}
                      </button>
                      <button
                        onClick={() => {
                          if (!editMessage) setEditedMessage(currentAnalysis.analysis.sales_message[activeChannel]);
                          setEditMessage(!editMessage);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4" /> {editMessage ? "Save Edit" : "Edit"}
                      </button>
                      <button onClick={() => pushToast("Regenerate — would call AI again with same lead")} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold hover:bg-slate-50">
                        <RefreshCw className="h-4 w-4" /> Regenerate
                      </button>
                      <button onClick={() => pushToast("Send — demo action, would integrate with email/WhatsApp API")} className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[12px] font-bold text-violet-700 hover:bg-violet-100">
                        <Send className="h-4 w-4" /> Send <span className="text-[10px]">DEMO</span>
                      </button>
                      <button onClick={() => window.open(`${API_BASE}/api/export/${currentAnalysis.lead_id}?format=json`, "_blank")} className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold hover:bg-slate-50">
                        <Download className="h-4 w-4" /> Export JSON
                      </button>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500">Message mentions business name, specific problem, demonstrates understanding, suggests appropriate solution, natural human tone, clear CTA — no exaggerated claims.</div>
                  </div>
                </div>
              )}

              {!analyzing && !currentAnalysis && (
                <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <BrainCircuit className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold tracking-tight">No analysis yet</h3>
                  <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-5 text-slate-500">Fill the lead form and click Analyze Lead With AI — see processing steps, score, reasoning, recommended action, and multi-channel sales messages.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeNav === "history" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-[24px] font-bold tracking-tight">Lead History</h1>
                <p className="text-[13px] text-slate-600">Previously analyzed leads — search, filter by temperature, industry, intent, score</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, business, email" className="h-10 w-[260px] rounded-full border border-slate-200 bg-white pl-10 pr-4 text-[13px] focus:border-slate-900 focus:outline-none" />
                </div>
                <select value={filterTemp} onChange={(e) => setFilterTemp(e.target.value)} className="h-10 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-medium">
                  <option value="all">All Temps</option>
                  <option value="HOT">HOT</option>
                  <option value="WARM">WARM</option>
                  <option value="COLD">COLD</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Lead</th>
                      <th className="px-4 py-3 font-semibold">Business</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Need</th>
                      <th className="px-4 py-3 font-semibold">Intent</th>
                      <th className="px-4 py-3 font-semibold">Urgency</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Temp</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.lead_id} onClick={() => { setSelectedLead(lead); setActiveNav("analyze"); }} className="cursor-pointer hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{lead.input.fullName}</div>
                          <div className="text-[11px] text-slate-500">{lead.input.email}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">{lead.input.businessName}</td>
                        <td className="px-4 py-3 text-[11px]">{new Date(lead.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-[11px]">{lead.analysis.business_need.primary}</td>
                        <td className="px-4 py-3">
                          <Badge tone="violet">{lead.analysis.lead_intent.level}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={lead.analysis.urgency.level === "Critical" ? "red" : lead.analysis.urgency.level === "High" ? "amber" : "slate"}>{lead.analysis.urgency.level}</Badge>
                        </td>
                        <td className="px-4 py-3 font-bold">{lead.score}</td>
                        <td className="px-4 py-3">
                          <Badge tone={lead.temperature === "HOT" ? "red" : lead.temperature === "WARM" ? "amber" : "blue"}>{lead.temperature}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[11px]">{lead.recommended_action}</td>
                        <td className="px-4 py-3">
                          <Badge tone="green">Analyzed</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLeads.length === 0 && <div className="p-10 text-center text-[13px] text-slate-500">No leads match filters — analyze a lead or clear filters</div>}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {activeNav === "reports" && (
          <div className="space-y-6">
            <h1 className="text-[24px] font-bold tracking-tight">Reports</h1>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[14px] font-bold">Export Analysis</h3>
                <p className="mt-1 text-[12px] text-slate-500">Export contains lead info, business need, intent, urgency, score, factors, recommended action, sales message</p>
                <div className="mt-4 space-y-2">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.lead_id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                      <div className="text-[13px] font-medium">{lead.input.fullName} — {lead.score}/100 {lead.temperature}</div>
                      <div className="flex gap-2">
                        <a href={`${API_BASE}/api/export/${lead.lead_id}?format=json`} target="_blank" className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold hover:bg-slate-50">JSON</a>
                        <a href={`${API_BASE}/api/export/${lead.lead_id}?format=csv`} target="_blank" className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold hover:bg-slate-50">CSV</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[14px] font-bold">Temperature Distribution & Avg Score</h3>
                <div className="mt-4 h-[200px] rounded-xl bg-slate-50 p-4">
                  <div className="flex h-full items-end gap-4">
                    {[
                      { label: "HOT", value: dashboardData?.temperatureDistribution?.HOT || 0, color: "bg-red-500" },
                      { label: "WARM", value: dashboardData?.temperatureDistribution?.WARM || 0, color: "bg-amber-500" },
                      { label: "COLD", value: dashboardData?.temperatureDistribution?.COLD || 0, color: "bg-slate-300" },
                    ].map((b) => (
                      <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                        <div className="text-[12px] font-bold">{b.value}</div>
                        <div className={`w-full rounded-t-xl ${b.color}`} style={{ height: `${Math.max(12, (b.value / 80) * 140)}px` }} />
                        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{b.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
                  <div className="text-[11px] uppercase tracking-widest text-white/50">Average Score</div>
                  <div className="mt-1 text-[24px] font-bold">{dashboardData?.metrics?.averageScore || 68}/100</div>
                  <div className="mt-1 text-[11px] text-white/60">Across {dashboardData?.metrics?.leadsAnalyzed || 0} leads — demo data included</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeNav === "settings" && (
          <div className="max-w-[800px] space-y-6">
            <h1 className="text-[24px] font-bold tracking-tight">Settings</h1>
            <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-[14px] font-bold">
                <Settings className="h-4 w-4" /> Environment Variables
              </h3>
              <div className="mt-4 space-y-3 font-mono text-[12px]">
                {[
                  ["AI_PROVIDER", "heuristic | openai | anthropic", "Current: heuristic — no API key needed, transparent scoring"],
                  ["OPENAI_API_KEY", "sk-...", "Set for LIVE OpenAI analysis — uses system prompt in server/index.js"],
                  ["AI_MODEL", "gpt-4o-mini", "Model for qualification"],
                  ["PORT", "3002", "Backend port"],
                  ["VITE_API_BASE", "http://localhost:3002", "Frontend API base"],
                ].map(([k, v, desc]) => (
                  <div key={k} className="rounded-xl bg-slate-50 p-3">
                    <div className="font-bold">{k}=<span className="text-slate-600">{v}</span></div>
                    <div className="mt-1 font-sans text-[11px] text-slate-500">{desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-[12px] font-bold text-amber-800">
                  <ShieldCheck className="h-4 w-4" /> Security — Never Expose
                </div>
                <ul className="mt-2 list-disc pl-5 text-[11px] leading-5 text-amber-900/70">
                  <li>AI API keys — via env only, never in frontend</li>
                  <li>Database credentials — env only</li>
                  <li>Auth secrets — env only</li>
                  <li>Input validation on all endpoints</li>
                  <li>Sanitize user content before display</li>
                </ul>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-600">AI Prompt Engineering — System Prompt</h4>
                <pre className="mt-2 max-h-[200px] overflow-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-5 text-white/80">
                  {`You are LeadFlow AI, senior sales-intelligence analyst...
Analyze ONLY provided lead info. Do not invent facts.
If missing, return "unknown" not guess.
Produce VALID JSON with exact structure...
Scoring Rules: Business Fit 0-20, Buying Intent 0-20, Budget 0-20, Urgency 0-20, Problem Clarity 0-20
Total 0-100, Temperature MUST correspond...
Avoid manipulative language, unsupported claims...
Never reveal hidden chain-of-thought...`}
                </pre>
                <div className="mt-2 text-[11px] text-slate-500">Full prompt in server/index.js SYSTEM_PROMPT — 400+ words, production-ready</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-[11px] text-slate-500">
        LeadFlow AI — DEMO 3 • Premium AI SaaS • Heuristic + OpenAI-ready • Connection to Demo 2 via /api/from-automation • © 2026 LeadFlow Pro Demo
      </footer>
    </div>
  );
}
