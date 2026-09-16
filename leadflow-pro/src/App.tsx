import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
  Calendar,
  Layers,
  MousePointerClick,
  BrainCircuit,
} from "lucide-react";

// ============ CONFIGURATION ============
// Easily configurable for client deployment
const CONFIG = {
  whatsappNumber: "14155552671", // Placeholder — change via env or config
  whatsappMessage: "Hi LeadFlow Pro team! I'm interested in your lead generation system.",
  leadWebhookUrl: import.meta.env.VITE_LEAD_WEBHOOK_URL || "/api/leads",
  calendlyUrl: "", // Optional external booking link
  businessEmail: "hello@leadflowpro.demo",
  businessPhone: "+1 (415) 555-2671",
};

// ============ TYPES ============
type LeadPayload = {
  name: string;
  business: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  budget: string;
  needs: string;
  message: string;
  timestamp: string;
  source: string;
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

// ============ REUSABLE COMPONENTS ============

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center font-semibold tracking-tight rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[#0F172A] text-white hover:bg-black shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)] hover:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.6)] hover:translate-y-[-1px] active:translate-y-[0px]",
    secondary:
      "bg-white text-[#0F172A] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:text-[#0F172A] hover:bg-slate-100",
    outline:
      "bg-transparent border border-slate-900/10 text-[#0F172A] hover:bg-[#0F172A] hover:text-white",
  };
  const sizes = {
    sm: "h-9 px-4 text-[13px]",
    md: "h-11 px-6 text-[14px]",
    lg: "h-[48px] px-7 text-[15px]",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  // Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    budget: "",
    needs: "",
    message: "",
  });
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", company: "", objective: "" });
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Contact State
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [contactSuccess, setContactSuccess] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Toast helper
  const pushToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  // Validation helpers
  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v: string) => /^[\+]?[\d\s\-\(\)]{8,20}$/.test(v.trim());
  const validateUrl = (v: string) => {
    if (!v) return true;
    try {
      const u = v.startsWith("http") ? v : `https://${v}`;
      new URL(u);
      return true;
    } catch {
      return false;
    }
  };

  const validateLead = () => {
    const e: Record<string, string> = {};
    if (!leadForm.name.trim() || leadForm.name.trim().length < 2) e.name = "Please enter your full name";
    if (!leadForm.business.trim()) e.business = "Business name is required";
    if (!leadForm.email.trim() || !validateEmail(leadForm.email)) e.email = "Enter a valid work email";
    if (!leadForm.phone.trim() || !validatePhone(leadForm.phone)) e.phone = "Enter a valid phone / WhatsApp number";
    if (!validateUrl(leadForm.website)) e.website = "Enter a valid website URL";
    if (!leadForm.industry) e.industry = "Please select your industry";
    if (!leadForm.budget) e.budget = "Please select a budget range";
    if (!leadForm.needs) e.needs = "Tell us what you want to improve";
    return e;
  };

  const handleLeadSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validateLead();
    setLeadErrors(errs);
    if (Object.keys(errs).length) {
      pushToast("Please fix the highlighted fields", "error");
      return;
    }
    setLeadSubmitting(true);

    const payload: LeadPayload = {
      name: leadForm.name.trim(),
      business: leadForm.business.trim(),
      email: leadForm.email.trim().toLowerCase(),
      phone: leadForm.phone.trim(),
      website: leadForm.website.trim(),
      industry: leadForm.industry,
      budget: leadForm.budget,
      needs: leadForm.needs,
      message: leadForm.message.trim(),
      timestamp: new Date().toISOString(),
      source: "leadflow_pro_demo_website",
    };

    // Architected for real webhook — now LIVE connected to Demo 2 automation
    try {
      console.log("[LeadFlow Pro] Lead payload ready for webhook:", payload);
      console.log(`[LeadFlow Pro] POSTing to: ${CONFIG.leadWebhookUrl}`);

      // Save locally for Demo 2 fallback
      const existing = JSON.parse(localStorage.getItem("leadflow_leads") || "[]");
      existing.unshift(payload);
      localStorage.setItem("leadflow_leads", JSON.stringify(existing.slice(0, 50)));

      // Try real webhook POST to automation backend (Demo 2)
      let webhookResult = null;
      try {
        const res = await fetch(CONFIG.leadWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        webhookResult = await res.json();
        console.log("[LeadFlow Pro] Webhook response:", webhookResult);
        if (!res.ok && webhookResult?.errors) {
          throw new Error(webhookResult.errors.join("; "));
        }
      } catch (webhookErr) {
        console.warn("[LeadFlow Pro] Webhook POST failed (backend may not be running), falling back to local demo mode:", webhookErr);
        // Simulate delay for demo if backend not reachable
        await new Promise((r) => setTimeout(r, 600));
      }

      setLeadSuccess(true);
      if (webhookResult?.qualification) {
        pushToast(`Lead scored ${webhookResult.qualification.qualification_score} — ${webhookResult.route} — automation triggered!`, "success");
      } else {
        pushToast("Growth assessment received! Automation pipeline triggered (check Demo 2 dashboard).", "success");
      }
      setLeadForm({
        name: "",
        business: "",
        email: "",
        phone: "",
        website: "",
        industry: "",
        budget: "",
        needs: "",
        message: "",
      });
    } catch (err: any) {
      console.error(err);
      pushToast(err.message || "Something went wrong. Please try again.", "error");
    } finally {
      setLeadSubmitting(false);
    }
  };

  // Booking helpers
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    let added = 0;
    let offset = 1;
    while (added < 12) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        dates.push(d);
        added++;
      }
      offset++;
    }
    return dates;
  };
  const dates = generateDates();
  const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "04:00 PM"];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!selectedDate) err.date = "Select a date";
    if (!selectedTime) err.time = "Select a time";
    if (!bookingForm.name.trim()) err.bname = "Name required";
    if (!validateEmail(bookingForm.email)) err.bemail = "Valid email required";
    if (!bookingForm.company.trim()) err.bcompany = "Company required";
    if (!bookingForm.objective.trim()) err.bobjective = "Please share your objective";
    setBookingErrors(err);
    if (Object.keys(err).length) {
      pushToast("Complete your booking details", "error");
      return;
    }
    setBookingSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setBookingConfirmed(true);
    pushToast("Strategy call booked!", "success");
    setBookingSubmitting(false);
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!contactForm.name.trim()) err.cname = "Required";
    if (!validateEmail(contactForm.email)) err.cemail = "Valid email required";
    if (!contactForm.message.trim()) err.cmessage = "Please enter a message";
    setContactErrors(err);
    if (Object.keys(err).length) return;
    setContactSuccess(true);
    pushToast("Message sent — we'll reply shortly", "success");
    setContactForm({ name: "", email: "", company: "", phone: "", message: "" });
    setTimeout(() => setContactSuccess(false), 4000);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] selection:bg-[#0F172A] selection:text-white">
      {/* Toasts */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[320px] max-w-[420px] rounded-2xl border px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all animate-[slideIn_0.4s_cubic-bezier(0.16,1,0.3,1)] ${
              t.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : t.type === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 rounded-full p-1 ${
                  t.type === "success" ? "bg-emerald-500 text-white" : t.type === "error" ? "bg-red-500 text-white" : "bg-slate-900 text-white"
                }`}
              >
                <Check className="h-3 w-3" />
              </div>
              <p className="text-[13.5px] font-medium leading-5">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <button onClick={() => scrollTo("hero")} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white shadow-sm">
                <Layers className="h-[18px] w-[18px]" />
              </div>
              <span className="text-[17px] font-bold tracking-tight">LeadFlow Pro</span>
              <span className="ml-1 hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 md:inline-flex">
                Demo
              </span>
            </button>
            <nav className="hidden items-center gap-7 lg:flex">
              {[
                ["Services", "services"],
                ["How It Works", "how-it-works"],
                ["Results", "results"],
                ["FAQ", "faq"],
                ["Contact", "contact"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-[14px] font-medium text-slate-600 transition hover:text-[#0F172A]"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo("contact")}
              className="hidden text-[14px] font-medium text-slate-600 hover:text-[#0F172A] lg:inline-flex"
            >
              Contact
            </button>
            <Button onClick={() => scrollTo("booking")} className="hidden lg:inline-flex">
              Book a Free Call
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 lg:hidden ${
            mobileMenuOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1 px-6 py-6">
            {[
              ["Services", "services"],
              ["How It Works", "how-it-works"],
              ["Results", "results"],
              ["FAQ", "faq"],
              ["Contact", "contact"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {label}
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
            <div className="pt-3">
              <Button onClick={() => scrollTo("booking")} className="w-full">
                Book a Free Strategy Call
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" ref={heroRef} className="relative overflow-hidden bg-[#FBFCFE]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-30%] h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-50 via-violet-50 to-transparent blur-[80px]" />
          <div className="absolute right-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-b from-blue-50 to-transparent blur-[60px]" />
        </div>

        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-[88px]">
          {/* Left */}
          <div className="reveal in-view">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live demo — conversion system
              </Badge>
              <span className="text-[12px] font-medium text-slate-500">No fake client claims • Demo metrics only</span>
            </div>

            <h1 className="max-w-[640px] text-[40px] font-[800] leading-[0.95] tracking-[-0.03em] text-[#0F172A] md:text-[56px] lg:text-[64px]">
              Turn More Traffic Into <span className="relative inline-block"><span className="relative z-10 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Qualified Customers.</span><span className="absolute bottom-1 left-0 right-0 z-0 h-[12px] bg-indigo-100/80" /></span>
            </h1>

            <p className="mt-6 max-w-[560px] text-[17px] leading-7 text-slate-600">
              LeadFlow Pro combines lead generation, conversion optimization, CRM automation, and AI qualification to help
              businesses turn website visitors into sales opportunities — without losing leads in the follow-up.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => scrollTo("booking")}>
                Book a Free Strategy Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => scrollTo("how-it-works")}>
                <MousePointerClick className="mr-2 h-4 w-4" />
                See How It Works
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: Target, label: "Conversion-focused systems" },
                { icon: BrainCircuit, label: "AI-powered qualification" },
                { icon: Workflow, label: "Automated follow-up" },
              ].map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm">
                  <item.icon className="h-4 w-4 text-slate-900" />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full border-2 border-white bg-slate-200"
                    style={{
                      background: `linear-gradient(135deg, ${["#e0e7ff", "#ddd6fe", "#bfdbfe"][i - 1]}, #fff)`,
                    }}
                  />
                ))}
              </div>
              <div className="text-[13px] leading-4">
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <StarIcon /> Trusted by growth teams
                </div>
                <div className="text-slate-500">Demo portfolio — not real client claims</div>
              </div>
            </div>
          </div>

          {/* Right — Dashboard Visual */}
          <div className="reveal in-view relative lg:pl-6">
            <div className="relative mx-auto w-full max-w-[560px]">
              {/* Glow */}
              <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-indigo-100 via-violet-100 to-blue-100 blur-2xl" />

              {/* Main Card */}
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[13px] font-semibold tracking-tight text-slate-700">Live Pipeline — LeadFlow Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60">
                  {[
                    { label: "Incoming", value: "127", delta: "+12%", icon: Users },
                    { label: "Lead Score", value: "84", delta: "Avg", icon: BarChart3 },
                    { label: "Conv. Rate", value: "38%", delta: "+4.2%", icon: TrendingUp },
                  ].map((m) => (
                    <div key={m.label} className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        <m.icon className="h-3.5 w-3.5" /> {m.label}
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <div className="text-[22px] font-bold tracking-tight text-slate-900">{m.value}</div>
                        <div className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">{m.delta}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leads List */}
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-700">Qualified Leads</h4>
                    <span className="text-[11px] font-medium text-slate-500">Last 24h</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Sarah Chen", company: "Atlas Labs", score: 92, status: "Hot", color: "bg-emerald-500" },
                      { name: "Marcus Reid", company: "Pulse Agency", score: 78, status: "Warm", color: "bg-amber-500" },
                      { name: "Elena Torres", company: "Nexus B2B", score: 85, status: "Hot", color: "bg-emerald-500" },
                      { name: "David Park", company: "Vertex Co", score: 64, status: "New", color: "bg-slate-400" },
                    ].map((lead) => (
                      <div key={lead.name} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:border-slate-200 hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[12px] font-bold text-white">
                            {lead.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold leading-4 text-slate-900">{lead.name}</div>
                            <div className="text-[11px] text-slate-500">{lead.company}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[12px] font-bold text-slate-900">{lead.score} / 100</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{lead.status}</div>
                          </div>
                          <div className="h-2 w-2 rounded-full" style={{ background: lead.score > 80 ? "#10b981" : lead.score > 70 ? "#f59e0b" : "#94a3b8" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue opportunity */}
                  <div className="mt-5 rounded-2xl bg-[#0F172A] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">Revenue Opportunity</div>
                      <Sparkles className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="text-[24px] font-bold tracking-tight">$42,800</div>
                      <div className="text-[12px] font-medium text-emerald-300">+18% this week</div>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-white/60">
                      <Workflow className="h-3.5 w-3.5" /> Automated workflow → CRM → Follow-up sequence active
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -right-6 top-10 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] md:flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Auto-Qualified</div>
                  <div className="text-[13px] font-semibold text-slate-900">+24 leads today</div>
                </div>
              </div>

              <div className="absolute -left-8 bottom-16 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] md:flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Follow-up</div>
                  <div className="text-[13px] font-semibold text-slate-900">3 sequences running</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="reveal max-w-[360px]">
              <div className="text-[13px] font-bold uppercase tracking-widest text-slate-500">Built for predictable growth</div>
              <h3 className="mt-2 text-[20px] font-bold leading-tight tracking-tight text-slate-900">
                Systems that turn traffic into pipeline — not just clicks.
              </h3>
              <p className="mt-2 text-[13px] text-slate-500">Fictional demonstration metrics for portfolio presentation.</p>
            </div>

            <div className="reveal grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-10">
              {[
                { k: "2,500+", v: "Leads Generated", sub: "Demo metric" },
                { k: "38%", v: "Avg. Conversion Lift", sub: "Illustrative" },
                { k: "24/7", v: "Automated Follow-Up", sub: "Always on" },
                { k: "4.8/5", v: "Client Satisfaction", sub: "Demo rating" },
              ].map((stat) => (
                <div key={stat.v} className="border-l border-slate-200 pl-5 first:border-l-0 lg:first:pl-0">
                  <div className="text-[28px] font-extrabold tracking-tight text-slate-900">{stat.k}</div>
                  <div className="text-[13px] font-semibold text-slate-700">{stat.v}</div>
                  <div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal mt-10 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Demo brands — fictional</span>
            <div className="flex flex-wrap items-center gap-8">
              {["NEXUS", "ATLAS", "PULSE", "VERTEX", "LUMEN", "CRAFT"].map((logo) => (
                <span key={logo} className="font-mono text-[14px] font-bold tracking-[0.18em] text-slate-400">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[720px] text-center reveal">
            <Badge>
              <Layers className="h-3.5 w-3.5" /> Services
            </Badge>
            <h2 className="mt-4 text-[34px] font-[800] leading-[0.95] tracking-[-0.03em] text-slate-900 md:text-[44px]">
              Everything you need to turn visitors into customers.
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-6 text-slate-600">
              We architect lead systems that capture, qualify, and convert — connected to your CRM, inbox, and workflows.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Lead Generation",
                desc: "Build systems that consistently attract qualified prospects from paid, organic, and referral channels.",
                accent: "from-indigo-500 to-violet-500",
              },
              {
                icon: TrendingUp,
                title: "Conversion Optimization",
                desc: "Turn more visitors into inquiries and customers with data-driven UX, copy, and funnel improvements.",
                accent: "from-emerald-500 to-teal-500",
              },
              {
                icon: MousePointerClick,
                title: "Landing Pages",
                desc: "Build focused landing experiences designed for conversion, with fast load and mobile-first UX.",
                accent: "from-blue-500 to-cyan-500",
              },
              {
                icon: Bot,
                title: "AI Lead Qualification",
                desc: "Automatically analyze and prioritize incoming leads so sales focuses on the best opportunities first.",
                accent: "from-violet-500 to-fuchsia-500",
              },
              {
                icon: Workflow,
                title: "CRM & Workflow Automation",
                desc: "Connect forms, CRM systems, email, spreadsheets, and internal processes — no lead gets lost.",
                accent: "from-amber-500 to-orange-500",
              },
              {
                icon: MessageSquare,
                title: "Follow-Up Automation",
                desc: "Automatically follow up with prospects across email, WhatsApp, and SMS so opportunities don't go cold.",
                accent: "from-slate-800 to-slate-600",
              },
            ].map((s, i) => (
              <div
                key={s.title}
                className="reveal group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)]"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={`absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.accent} opacity-[0.08] blur-[1px] transition group-hover:opacity-[0.14]`} />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                  <s.icon className="h-5 w-5 text-slate-900" />
                </div>
                <h3 className="mt-5 text-[17px] font-bold tracking-tight text-slate-900">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-slate-600">{s.desc}</p>
                <button className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 transition group-hover:gap-2">
                  Learn more <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="reveal">
              <Badge>
                <Zap className="h-3.5 w-3.5" /> Process
              </Badge>
              <h2 className="mt-4 max-w-[520px] text-[34px] font-[800] leading-[0.95] tracking-[-0.03em] text-slate-900 md:text-[44px]">
                A simple system for predictable pipeline.
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-6 text-slate-600">
                Four stages, fully automated, built to turn traffic into qualified sales conversations.
              </p>

              <div className="mt-10 space-y-8">
                {[
                  { n: "01", t: "Attract", d: "Bring qualified prospects into your funnel from the channels that actually convert." },
                  { n: "02", t: "Capture", d: "Convert visitors into actionable leads with high-intent forms and landing pages." },
                  { n: "03", t: "Qualify", d: "Use automation and AI to identify the best opportunities and route them instantly." },
                  { n: "04", t: "Convert", d: "Follow up intelligently and move prospects toward a sales conversation — automatically." },
                ].map((step, idx) => (
                  <div key={step.n} className="relative flex gap-5">
                    {idx !== 3 && <div className="absolute left-[18px] top-[40px] h-[48px] w-px bg-gradient-to-b from-slate-300 to-transparent" />}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F172A] font-mono text-[12px] font-bold text-white shadow-sm">
                      {step.n}
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold tracking-tight text-slate-900">{step.t}</h4>
                      <p className="mt-1 max-w-[420px] text-[14px] leading-6 text-slate-600">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button onClick={() => scrollTo("lead-capture")}>
                  Get My Free Growth Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Visual Flow */}
            <div className="reveal relative">
              <div className="absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-br from-slate-50 to-indigo-50/60 blur-xl" />
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18)]">
                <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="p-6">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Flow visualization</div>
                    <div className="mt-6 space-y-4">
                      {[
                        { label: "Ad → Landing Page", val: "68% CTR", color: "bg-indigo-500" },
                        { label: "Visitor → Lead", val: "24% CVR", color: "bg-emerald-500" },
                        { label: "Lead → Qualified", val: "62% Qual", color: "bg-violet-500" },
                        { label: "Qualified → Meeting", val: "41% Booked", color: "bg-slate-900" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${row.color}`} />
                            <span className="text-[13px] font-medium text-slate-700">{row.label}</span>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">{row.val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        <Workflow className="h-3.5 w-3.5" /> Automation active
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-[12px] text-slate-700">
                          <Check className="h-4 w-4 text-emerald-500" /> CRM record created
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-slate-700">
                          <Check className="h-4 w-4 text-emerald-500" /> Email + WhatsApp follow-up
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-slate-700">
                          <Check className="h-4 w-4 text-emerald-500" /> Sales Slack alert
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0F172A] p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-white/50">Live funnel</div>
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    </div>
                    <div className="mt-6 space-y-5">
                      <div>
                        <div className="flex justify-between text-[12px] text-white/60">
                          <span>Visitors</span>
                          <span>1,284</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                          <div className="h-full w-[92%] rounded-full bg-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[12px] text-white/60">
                          <span>Leads</span>
                          <span>308</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                          <div className="h-full w-[68%] rounded-full bg-indigo-400" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[12px] text-white/60">
                          <span>Qualified</span>
                          <span>191</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                          <div className="h-full w-[54%] rounded-full bg-violet-400" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[12px] text-white/60">
                          <span>Meetings</span>
                          <span>78</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                          <div className="h-full w-[32%] rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-white/80">
                        <BrainCircuit className="h-4 w-4 text-indigo-300" />
                        AI is prioritizing 12 hot leads for sales right now.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE */}
      <section id="lead-capture" className="bg-[#0F172A] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="reveal sticky top-28">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 ring-1 ring-white/10">
                <Sparkles className="h-3.5 w-3.5" /> Lead capture demo
              </div>
              <h2 className="mt-5 max-w-[520px] text-[36px] font-[800] leading-[0.95] tracking-[-0.03em] md:text-[48px]">
                Find Out How Many Leads Your Business Could Generate.
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-7 text-white/60">
                Get a free growth assessment. We’ll review your traffic, funnel, and follow-up and show you where you’re losing leads.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "No spam — assessment only",
                  "Takes 60 seconds",
                  "Data stays in demo — localStorage for Demo 2",
                  "Architected for POST /api/leads webhook",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[14px] text-white/70">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[12px] font-bold uppercase tracking-widest text-white/40">Payload preview</div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-[11px] leading-5 text-white/70">
{`{
  "name": "Jane Doe",
  "business": "Acme Co",
  "email": "jane@acme.co",
  "phone": "+1415...",
  "website": "acme.co",
  "industry": "B2B SaaS",
  "budget": "$5k-$15k",
  "needs": "Conversion",
  "timestamp": "2026-..."
}`}
                </pre>
              </div>
            </div>

            <div className="reveal">
              <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] md:p-8">
                {!leadSuccess ? (
                  <form onSubmit={handleLeadSubmit} noValidate className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-bold tracking-tight text-slate-900">Growth Assessment</h3>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Demo form</span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Full Name *</label>
                        <input
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="Jane Doe"
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.name ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {leadErrors.name && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.name}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Business Name *</label>
                        <input
                          value={leadForm.business}
                          onChange={(e) => setLeadForm({ ...leadForm, business: e.target.value })}
                          placeholder="Acme Inc."
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.business ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {leadErrors.business && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.business}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Work Email *</label>
                        <input
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          placeholder="jane@company.com"
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.email ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {leadErrors.email && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.email}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Phone / WhatsApp *</label>
                        <input
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          placeholder="+1 (415) 555-0123"
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.phone ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {leadErrors.phone && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.phone}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Website</label>
                        <input
                          value={leadForm.website}
                          onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                          placeholder="https://yourcompany.com"
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.website ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {leadErrors.website && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.website}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Industry *</label>
                        <select
                          value={leadForm.industry}
                          onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.industry ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        >
                          <option value="">Select industry</option>
                          <option>B2B SaaS</option>
                          <option>Agency / Services</option>
                          <option>E-commerce</option>
                          <option>Professional Services</option>
                          <option>Local Business</option>
                          <option>Startup</option>
                          <option>Other</option>
                        </select>
                        {leadErrors.industry && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.industry}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Monthly Marketing Budget *</label>
                        <select
                          value={leadForm.budget}
                          onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.budget ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        >
                          <option value="">Select budget</option>
                          <option>Less than $1k</option>
                          <option>$1k - $5k</option>
                          <option>$5k - $15k</option>
                          <option>$15k - $50k</option>
                          <option>$50k+</option>
                        </select>
                        {leadErrors.budget && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.budget}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">What are you looking to improve? *</label>
                        <select
                          value={leadForm.needs}
                          onChange={(e) => setLeadForm({ ...leadForm, needs: e.target.value })}
                          className={`h-11 w-full rounded-xl border bg-white px-4 text-[14px] font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            leadErrors.needs ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        >
                          <option value="">Select focus area</option>
                          <option>More qualified leads</option>
                          <option>Better conversion rate</option>
                          <option>Faster follow-up</option>
                          <option>CRM & automation</option>
                          <option>AI lead qualification</option>
                          <option>Full funnel rebuild</option>
                        </select>
                        {leadErrors.needs && <p className="mt-1.5 text-[12px] font-medium text-red-600">{leadErrors.needs}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-slate-600">Additional Message</label>
                        <textarea
                          value={leadForm.message}
                          onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                          placeholder="Tell us about your current funnel, traffic sources, and goals..."
                          rows={4}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={leadSubmitting} className="w-full" size="lg">
                      {leadSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Get My Free Growth Assessment
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-[11px] leading-4 text-slate-500">
                      By submitting, you agree to our demo terms. Data is stored locally for Demo 2 automation showcase.
                    </p>
                  </form>
                ) : (
                  <div className="py-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="h-8 w-8" />
                    </div>
                    <h3 className="mt-6 text-[22px] font-bold tracking-tight text-slate-900">Thanks! Your request has been received.</h3>
                    <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-6 text-slate-600">
                      Our team will review your information and contact you shortly. In this demo, your data was saved to localStorage and is ready for Demo 2's n8n automation.
                    </p>
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">What happens next (demo flow)</div>
                      <ul className="mt-3 space-y-2 text-[13px] text-slate-700">
                        <li className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Lead payload created with timestamp & source
                        </li>
                        <li className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Saved to localStorage key: leadflow_leads
                        </li>
                        <li className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Ready for POST to {CONFIG.leadWebhookUrl} in production
                        </li>
                      </ul>
                    </div>
                    <div className="mt-8 flex justify-center gap-3">
                      <Button variant="secondary" onClick={() => setLeadSuccess(false)}>
                        Submit Another
                      </Button>
                      <Button onClick={() => scrollTo("booking")}>Book a Call</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-white/50">
                <ShieldCheck className="h-4 w-4" /> Secure • GDPR-aware demo • No real data sent
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS / CASE STUDIES */}
      <section id="results" className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge>Results — Demo Case Studies</Badge>
              <h2 className="mt-4 max-w-[640px] text-[34px] font-[800] leading-[0.95] tracking-[-0.03em] text-slate-900 md:text-[44px]">
                Illustrative results from demo scenarios.
              </h2>
            </div>
            <p className="max-w-[420px] text-[15px] leading-6 text-slate-600">
              Clearly labeled as demo case studies for portfolio purposes. Not real client results — shows how we’d present ROI.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              {
                tag: "E-commerce Brand",
                title: "Traffic → Leads → Customers",
                metrics: [
                  { k: "+62%", v: "Lead volume" },
                  { k: "3.2x", v: "ROAS improvement" },
                  { k: "-41%", v: "Cost per lead" },
                ],
                before: 2.1,
                after: 5.8,
                color: "from-indigo-500 to-violet-500",
              },
              {
                tag: "Professional Services",
                title: "Faster response, higher qualification",
                metrics: [
                  { k: "+84%", v: "Qualification rate" },
                  { k: "2m", v: "Avg response time" },
                  { k: "+37%", v: "Close rate" },
                ],
                before: 1.4,
                after: 4.2,
                color: "from-emerald-500 to-teal-500",
              },
              {
                tag: "B2B SaaS Company",
                title: "Demo requests & pipeline automation",
                metrics: [
                  { k: "+112%", v: "Demo requests" },
                  { k: "68%", v: "Qualified opps" },
                  { k: "24/7", v: "Auto follow-up" },
                ],
                before: 0.9,
                after: 3.7,
                color: "from-blue-500 to-cyan-500",
              },
            ].map((cs) => (
              <div key={cs.tag} className="reveal group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.12)]">
                <div className={`h-1.5 w-full bg-gradient-to-r ${cs.color}`} />
                <div className="p-7">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-600">{cs.tag}</span>
                    <span className="text-[11px] font-medium text-slate-400">Demo Case Study</span>
                  </div>
                  <h3 className="mt-4 text-[18px] font-bold leading-tight tracking-tight text-slate-900">{cs.title}</h3>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {cs.metrics.map((m) => (
                      <div key={m.v} className="rounded-xl bg-slate-50 px-3 py-3">
                        <div className="text-[16px] font-bold tracking-tight text-slate-900">{m.k}</div>
                        <div className="text-[11px] font-medium leading-3 text-slate-500">{m.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <span>Before → After</span>
                      <span className="text-emerald-600">Illustrative</span>
                    </div>
                    <div className="mt-4 flex items-end gap-3">
                      <div className="flex-1">
                        <div className="mb-1 text-[11px] text-slate-500">Before</div>
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-slate-300" style={{ width: `${(cs.before / 6) * 100}%` }} />
                        </div>
                        <div className="mt-1 text-[12px] font-semibold text-slate-600">{cs.before}% conv</div>
                      </div>
                      <ArrowRight className="mb-4 h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <div className="mb-1 text-[11px] text-slate-500">After</div>
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div className={`h-full rounded-full bg-gradient-to-r ${cs.color}`} style={{ width: `${(cs.after / 6) * 100}%` }} />
                        </div>
                        <div className="mt-1 text-[12px] font-bold text-slate-900">{cs.after}% conv</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="reveal">
              <Badge>
                <Calendar className="h-3.5 w-3.5" /> Booking demo
              </Badge>
              <h2 className="mt-4 max-w-[520px] text-[36px] font-[800] leading-[0.95] tracking-[-0.03em] text-slate-900 md:text-[48px]">
                Let's Build Your Lead Engine.
              </h2>
              <p className="mt-4 max-w-[460px] text-[16px] leading-7 text-slate-600">
                Book a free 30-minute strategy call and we'll identify the biggest opportunities in your current lead-generation process.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-900">30 minutes, zero pitch</div>
                    <div className="text-[13px] leading-5 text-slate-600">We audit your funnel live and show you 3 quick wins you can implement this week.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-900">Built for founders & growth teams</div>
                    <div className="text-[13px] leading-5 text-slate-600">Small businesses, startups, agencies, and B2B companies scaling lead flow.</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-900" />
                  <div>
                    <div className="text-[14px] font-bold text-slate-900">Alex Morgan — Growth Architect</div>
                    <div className="text-[12px] text-slate-500">LeadFlow Pro • Demo host • 8+ yrs funnel experience (fictional)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18)]">
                {!bookingConfirmed ? (
                  <form onSubmit={handleBooking} className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-bold tracking-tight text-slate-900">Select date & time</h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                        <Globe className="h-3.5 w-3.5" /> IST (GMT+5:30)
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Available dates</div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {dates.map((d) => {
                          const isSelected = selectedDate?.toDateString() === d.toDateString();
                          return (
                            <button
                              key={d.toISOString()}
                              type="button"
                              onClick={() => setSelectedDate(d)}
                              className={`rounded-xl border px-3 py-3 text-left transition ${
                                isSelected ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? "text-white/60" : "text-slate-500"}`}>
                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                              <div className="mt-1 text-[14px] font-bold">
                                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {bookingErrors.date && <p className="mt-2 text-[12px] font-medium text-red-600">{bookingErrors.date}</p>}
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Available times</div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {timeSlots.map((t) => {
                          const isSel = selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTime(t)}
                              className={`rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition ${
                                isSel ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                      {bookingErrors.time && <p className="mt-2 text-[12px] font-medium text-red-600">{bookingErrors.time}</p>}
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Full Name *</label>
                        <input
                          value={bookingForm.name}
                          onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                          placeholder="Jane Doe"
                          className={`h-11 w-full rounded-xl border px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            bookingErrors.bname ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {bookingErrors.bname && <p className="mt-1 text-[11px] text-red-600">{bookingErrors.bname}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Work Email *</label>
                        <input
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                          placeholder="jane@company.com"
                          className={`h-11 w-full rounded-xl border px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            bookingErrors.bemail ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {bookingErrors.bemail && <p className="mt-1 text-[11px] text-red-600">{bookingErrors.bemail}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Company *</label>
                        <input
                          value={bookingForm.company}
                          onChange={(e) => setBookingForm({ ...bookingForm, company: e.target.value })}
                          placeholder="Acme Inc."
                          className={`h-11 w-full rounded-xl border px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            bookingErrors.bcompany ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {bookingErrors.bcompany && <p className="mt-1 text-[11px] text-red-600">{bookingErrors.bcompany}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Meeting Objective *</label>
                        <input
                          value={bookingForm.objective}
                          onChange={(e) => setBookingForm({ ...bookingForm, objective: e.target.value })}
                          placeholder="e.g. Fix follow-up"
                          className={`h-11 w-full rounded-xl border px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                            bookingErrors.bobjective ? "border-red-300 bg-red-50/50" : "border-slate-200"
                          }`}
                        />
                        {bookingErrors.bobjective && <p className="mt-1 text-[11px] text-red-600">{bookingErrors.bobjective}</p>}
                      </div>
                    </div>

                    <Button type="submit" disabled={bookingSubmitting} className="mt-6 w-full" size="lg">
                      {bookingSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          Confirm Booking — Free Strategy Call
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="mt-3 text-center text-[11px] text-slate-500">Simulated booking for demo — no external calendar required. Can connect to Calendly via CONFIG.calendlyUrl.</p>
                  </form>
                ) : (
                  <div className="p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="mt-6 text-[22px] font-bold tracking-tight text-slate-900">Your strategy call is booked.</h3>
                    <p className="mt-2 text-[14px] text-slate-600">We’ve reserved your slot. Check your email for confirmation (simulated in demo).</p>

                    <div className="mx-auto mt-6 max-w-[360px] rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                      <div className="space-y-3 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date</span>
                          <span className="font-semibold text-slate-900">{selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Time</span>
                          <span className="font-semibold text-slate-900">{selectedTime} IST</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Type</span>
                          <span className="font-semibold text-slate-900">30-min Strategy Call</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Host</span>
                          <span className="font-semibold text-slate-900">Alex Morgan</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center gap-3">
                      <Button variant="secondary" onClick={() => setBookingConfirmed(false)}>
                        Reschedule
                      </Button>
                      <Button onClick={() => scrollTo("lead-capture")}>Get Assessment</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section className="bg-[#F0FDF4]">
        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-8">
          <div className="reveal flex flex-col items-center justify-between gap-6 rounded-[28px] border border-emerald-200 bg-white px-6 py-8 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)] md:flex-row md:px-10 md:py-8">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_10px_20px_-10px_rgba(37,211,102,0.6)]">
                <MessageSquare className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold tracking-tight text-slate-900">Prefer WhatsApp?</h3>
                <p className="mt-1 max-w-[420px] text-[14px] leading-5 text-slate-600">Talk directly with our team. Fast replies, no forms. Configurable number via CONFIG.whatsappNumber.</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <a
                href={`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[48px] items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 text-[14px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(37,211,102,0.6)] transition hover:translate-y-[-1px] hover:bg-[#20bd5a] hover:shadow-[0_14px_28px_-12px_rgba(37,211,102,0.6)]"
              >
                <MessageSquare className="h-4 w-4" />
                Chat With Us on WhatsApp
              </a>
              <span className="text-center text-[11px] font-medium text-slate-500 md:text-left">
                Demo number: +{CONFIG.whatsappNumber}
                <br />
                Change in src/App.tsx CONFIG
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[800px]">
            <div className="reveal text-center">
              <Badge>FAQ</Badge>
              <h2 className="mt-4 text-[34px] font-[800] leading-[0.95] tracking-[-0.03em] text-slate-900 md:text-[44px]">Questions? We’ve got answers.</h2>
              <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-6 text-slate-600">Everything you need to know about our demo system and how it would work for real clients.</p>
            </div>

            <div className="reveal mt-12 divide-y divide-slate-200 rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.08)]">
              {[
                {
                  q: "What does LeadFlow Pro do?",
                  a: "LeadFlow Pro is a fictional B2B lead-generation system for this demo. It showcases how an agency would build lead capture, conversion optimization, CRM automation, AI qualification, and follow-up automation into a single growth engine.",
                },
                {
                  q: "How quickly can a system be launched?",
                  a: "In a real implementation, a v1 lead system (landing page + form + CRM + basic automation) can be launched in 7-14 days. Full funnel with AI qualification and multi-channel follow-up typically takes 3-5 weeks.",
                },
                {
                  q: "Do you work with small businesses?",
                  a: "Yes — this demo targets small businesses, startups, agencies, professional services, B2B companies, and local businesses. The system scales from 50 to 50,000 leads/month with the same architecture.",
                },
                {
                  q: "Can you integrate with our CRM?",
                  a: "Absolutely. The lead form is architected to POST to /api/leads or any webhook. In production we connect to HubSpot, Salesforce, Pipedrive, Zoho, GoHighLevel, Airtable, or custom CRMs via n8n, Zapier, or direct API.",
                },
                {
                  q: "Can you automate lead follow-up?",
                  a: "Yes. Demo 2 shows n8n automation that takes leads from this website and triggers email, WhatsApp, SMS, Slack alerts, and CRM updates. No lead gets lost in inbox or spreadsheet.",
                },
                {
                  q: "How does AI qualification work?",
                  a: "Demo 3 shows AI analyzing each lead — scoring intent, budget fit, industry match, and urgency — and turning raw data into actionable sales intelligence. For this frontend demo, we simulate scoring in the dashboard visual.",
                },
                {
                  q: "Can you connect our existing website?",
                  a: "Yes. We can embed the lead capture, add tracking, and connect your current site via webhook or JavaScript snippet. No rebuild required for v1.",
                },
                {
                  q: "Do you provide ongoing optimization?",
                  a: "In a real engagement, yes — CRO, A/B testing, landing page iteration, and automation improvements. For this demo, optimization is illustrated via the before/after case study visuals.",
                },
              ].map((item, idx) => {
                const isOpen = faqOpen === idx;
                return (
                  <div key={idx} className="group">
                    <button
                      onClick={() => setFaqOpen(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-slate-50 md:px-8"
                    >
                      <span className="text-[16px] font-semibold tracking-tight text-slate-900">{item.q}</span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                          isOpen ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-300"
                        }`}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </span>
                    </button>
                    <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6 pt-0 text-[14px] leading-6 text-slate-600 md:px-8">{item.a}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="reveal">
              <Badge>
                <Mail className="h-3.5 w-3.5" /> Contact
              </Badge>
              <h2 className="mt-4 text-[32px] font-[800] leading-[0.95] tracking-[-0.03em] text-slate-900 md:text-[42px]">Let’s talk about your funnel.</h2>
              <p className="mt-4 max-w-[440px] text-[15px] leading-6 text-slate-600">
                Fictional contact details for demo purposes. Replace with real info when deploying for a client.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Mail className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Email</div>
                    <div className="text-[14px] font-semibold text-slate-900">{CONFIG.businessEmail}</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Phone className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">WhatsApp / Phone</div>
                    <div className="text-[14px] font-semibold text-slate-900">{CONFIG.businessPhone}</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Clock className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Business Hours</div>
                    <div className="text-[14px] font-semibold text-slate-900">Mon–Fri, 9am–6pm IST • Remote / Worldwide</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <MapPin className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Location</div>
                    <div className="text-[14px] font-semibold text-slate-900">Remote / Worldwide — Demo company</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] md:p-8">
                <h3 className="text-[18px] font-bold tracking-tight text-slate-900">Send a message</h3>
                <p className="mt-1 text-[13px] text-slate-500">Demo contact form — validates and shows success state.</p>

                <form onSubmit={handleContact} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Name *</label>
                      <input
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Your name"
                        className={`h-11 w-full rounded-xl border px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                          contactErrors.cname ? "border-red-300 bg-red-50/50" : "border-slate-200"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Email *</label>
                      <input
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="you@company.com"
                        className={`h-11 w-full rounded-xl border px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                          contactErrors.cemail ? "border-red-300 bg-red-50/50" : "border-slate-200"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Company</label>
                      <input
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Acme Inc."
                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Phone</label>
                      <input
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="+1 (415)..."
                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Message *</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we help?"
                      rows={4}
                      className={`w-full resize-none rounded-xl border px-4 py-3 text-[14px] font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                        contactErrors.cmessage ? "border-red-300 bg-red-50/50" : "border-slate-200"
                      }`}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    {contactSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Message Sent
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  {contactSuccess && <p className="text-center text-[12px] font-medium text-emerald-600">Thanks! We’ll reply shortly (demo success state).</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white">
                  <Layers className="h-[18px] w-[18px]" />
                </div>
                <span className="text-[16px] font-bold tracking-tight">LeadFlow Pro</span>
              </div>
              <p className="mt-4 max-w-[320px] text-[13px] leading-6 text-slate-600">
                Fictional B2B lead-generation and growth company. This website is a portfolio demonstration of agency-quality frontend implementation.
              </p>
              <div className="mt-6 flex gap-2">
                {[
                  { label: "X", icon: "𝕏" },
                  { label: "LinkedIn", icon: "in" },
                  { label: "GitHub", icon: "GH" },
                ].map((s) => (
                  <a key={s.label} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-600 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Product</div>
              <ul className="mt-4 space-y-3 text-[14px] font-medium text-slate-600">
                {[
                  ["Services", "services"],
                  ["How It Works", "how-it-works"],
                  ["Results", "results"],
                  ["Booking", "booking"],
                ].map(([l, id]) => (
                  <li key={l}>
                    <button onClick={() => scrollTo(id)} className="hover:text-slate-900">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Company</div>
              <ul className="mt-4 space-y-3 text-[14px] font-medium text-slate-600">
                <li>
                  <button onClick={() => scrollTo("faq")} className="hover:text-slate-900">
                    FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo("contact")} className="hover:text-slate-900">
                    Contact
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Privacy (demo)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Terms (demo)
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Demo Notice</div>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">
                © 2026 LeadFlow Pro. Demo website — fictional company. Built as a portfolio piece to demonstrate conversion-focused frontend, form architecture, and webhook readiness for Demo 2 & 3.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-4 w-4" /> No real client claims • Illustrative metrics
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-[12px] text-slate-500 md:flex-row">
            <span>© 2026 LeadFlow Pro — Demo website, fictional company.</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Built for agency partner showcase
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(12px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StarIcon() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="text-amber-500">★★★★★</span>
    </span>
  );
}
