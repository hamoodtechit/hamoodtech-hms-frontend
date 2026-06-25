"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useRef, useCallback } from "react"
import {
  Activity, ArrowRight, BadgeCheck, BarChart3, BedDouble, CalendarCheck,
  ChevronDown, ChevronRight, ClipboardList, FlaskConical, HeartPulse, Layers, Lock,
  MessageCircle, Microscope, Pill, Shield, Sparkles, Star, Stethoscope, Users, Zap
} from "lucide-react"

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, visible } = useInView()
  const num = parseInt(target.replace(/[^0-9]/g, "")) || 0
  const pre = target.replace(/[0-9.]/g, "").replace(num.toString(), "")
  useEffect(() => {
    if (!visible || num === 0) return
    let start = 0
    const step = Math.max(1, Math.floor(num / 40))
    const timer = setInterval(() => { start += step; if (start >= num) { setCount(num); clearInterval(timer) } else setCount(start) }, 30)
    return () => clearInterval(timer)
  }, [visible, num])
  const display = num === 0 ? target : `${count}${target.includes("+") ? "+" : ""}${target.includes("%") ? "%" : ""}${target.includes("x") ? "x" : ""}`
  return <span ref={ref}>{visible ? display : target}</span>
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{ border: "1px solid rgba(0,0,0,0.06)", background: open ? "#f8fafc" : "white" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="text-sm font-bold pr-4" style={{ color: "#0c4a6e" }}>{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} style={{ color: "#0f766e" }} />
      </button>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? "200px" : "0px" }}>
        <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

const BRAND = {
  navy: "#0c4a6e",
  teal: "#0f766e",
  navyLight: "#0e7490",
  tealLight: "#14b8a6",
  accent: "#06b6d4",
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeModule, setActiveModule] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setActiveModule(p => (p + 1) % modules.length), 4000)
    return () => clearInterval(interval)
  }, [])

  const modules = [
    { icon: Stethoscope, title: "OPD Management", desc: "Streamline outpatient visits with smart queuing, consultation tracking, and instant prescriptions.", tags: ["Smart Queuing", "Prescriptions", "Vitals Tracking", "Patient History"], img: "/module-opd.png" },
    { icon: BedDouble, title: "IPD & Admissions", desc: "Manage bed allocation, patient admissions, transfers, and discharge workflows effortlessly.", tags: ["Bed Management", "Discharge Flow", "Ward Transfers", "Service Billing"], img: "/module-ipd.png" },
    { icon: Pill, title: "Pharmacy & POS", desc: "Full inventory control, barcode scanning, expiry tracking, and integrated point-of-sale billing.", tags: ["Barcode Scanning", "Expiry Alerts", "Stock Control", "POS Billing"], img: "/module-pharmacy.png" },
    { icon: FlaskConical, title: "Pathology Lab", desc: "Automated test workflows, result entry, report generation, and direct patient notifications.", tags: ["Test Workflows", "Auto Reports", "Sample Tracking", "Result SMS"], img: "/module-pathology.png" },
    { icon: Microscope, title: "Radiology", desc: "Digital imaging management, report templates, and seamless integration with patient records.", tags: ["Image Upload", "Report Templates", "DICOM Ready", "Doctor Access"], img: "/module-radiology.png" },
    { icon: BarChart3, title: "Finance & Billing", desc: "Complete accounting, invoice generation, payment tracking, and comprehensive financial reports.", tags: ["Ledger System", "Invoice Gen", "Due Tracking", "Profit Reports"], img: "/module-finance.png" },
    { icon: CalendarCheck, title: "Appointments", desc: "Online booking, doctor schedules, automated reminders, and real-time availability management.", tags: ["Online Booking", "Auto Reminders", "Doctor Slots", "Walk-in Queue"], img: "/module-appointments.png" },
    { icon: Users, title: "HR & Payroll", desc: "Staff management, attendance tracking, shift scheduling, duty rosters, and payroll processing.", tags: ["Attendance", "Shift Roster", "Payroll", "Leave Management"], img: "/module-hr.png" },
  ]

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Built on modern tech for instant load times and zero lag." },
    { icon: Shield, title: "Enterprise Security", desc: "Role-based access, audit logs, and encrypted data at rest." },
    { icon: Layers, title: "Multi-Branch", desc: "Manage unlimited branches from a single unified dashboard." },
    { icon: Activity, title: "Real-Time Analytics", desc: "Live dashboards with actionable insights across all departments." },
    { icon: Lock, title: "HIPAA Ready", desc: "Built with healthcare compliance and data privacy in mind." },
    { icon: Sparkles, title: "Modern UI/UX", desc: "Beautiful, intuitive interface that staff actually enjoy using." },
  ]

  const stats = [
    { value: "50+", label: "Modules" },
    { value: "99.9%", label: "Uptime" },
    { value: "10x", label: "Faster Billing" },
    { value: "24/7", label: "Support" },
  ]

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
          padding: scrolled ? "12px 0" : "20px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})` }}
            >
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-black tracking-tight"
              style={{ color: scrolled ? BRAND.navy : "white" }}
            >
              HamoodTech<span style={{ color: BRAND.tealLight }}>HMS</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-80"
              style={{ color: scrolled ? BRAND.navy : "white" }}
            >
              Login
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.navyLight})`,
                boxShadow: "0 4px 15px rgba(15,118,110,0.3)",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-24 pb-20 lg:pt-28 lg:pb-32"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, #064e3b 50%, ${BRAND.teal} 100%)` }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.accent, filter: "blur(100px)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10" style={{ background: BRAND.tealLight, filter: "blur(80px)" }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-5" style={{ background: "white", filter: "blur(60px)" }} />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase" style={{ background: "rgba(255,255,255,0.1)", color: BRAND.tealLight, border: "1px solid rgba(255,255,255,0.1)" }}>
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Hospital Software
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Your All-in-One{" "}
              <span style={{ color: BRAND.tealLight }}>Hospital Management</span>{" "}
              Solution
            </h1>
            <p className="text-lg text-white/70 max-w-xl leading-relaxed">
              Streamline every department — from patient registration to pharmacy, billing to pathology — with a single powerful platform built for modern healthcare.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth/login"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.accent})`,
                  boxShadow: "0 8px 30px rgba(6,182,212,0.3)",
                }}
              >
                Request a Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-200 hover:bg-white/20"
                style={{ color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                Learn More
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[BRAND.teal, BRAND.navy, BRAND.navyLight, BRAND.accent].map((c, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>
                    {["H", "A", "M", "T"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-xs text-white/50 mt-1">Trusted by healthcare providers</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Image src="/hero-doctor.png" alt="Healthcare Professional" width={600} height={600} className="w-full h-auto object-cover" priority />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BRAND.navy}cc 0%, transparent 50%)` }} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BRAND.teal }}>
                      <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Quick Access Portal</p>
                      <p className="text-white/50 text-[10px]">Manage everything in one place</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["Patient Records", "Appointments", "Lab Results", "Billing"].map(item => (
                      <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-white/90" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl bg-white shadow-xl" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black tracking-tight" style={{ color: BRAND.navy }}><AnimatedCounter target={s.value} /></p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-14 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: BRAND.teal }}>Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: BRAND.navy }}>
              Built for Modern Healthcare
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Every feature is crafted with precision to solve real-world hospital challenges, from small clinics to multi-branch enterprises.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{ border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${BRAND.teal}15, ${BRAND.navy}15)` }}>
                  <f.icon className="w-6 h-6" style={{ color: BRAND.teal }} />
                </div>
                <h3 className="text-lg font-black mb-2" style={{ color: BRAND.navy }}>{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES SHOWCASE ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: BRAND.teal }}>Comprehensive Modules</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: BRAND.navy }}>
              Everything Your Hospital Needs
            </h2>
            <p className="text-gray-500 leading-relaxed">
              From outpatient registration to pharmacy POS, lab reports to financial analytics — all integrated in one seamless platform.
            </p>
          </div>
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-start">
            <div className="space-y-2">
              {modules.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveModule(i)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300"
                  style={{
                    background: activeModule === i ? `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})` : "transparent",
                    color: activeModule === i ? "white" : "#64748b",
                    boxShadow: activeModule === i ? "0 8px 30px rgba(12,74,110,0.2)" : "none",
                  }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{
                    background: activeModule === i ? "rgba(255,255,255,0.15)" : `${BRAND.teal}10`,
                  }}>
                    <m.icon className="w-5 h-5" style={{ color: activeModule === i ? "white" : BRAND.teal }} />
                  </div>
                  <span className="text-sm font-bold">{m.title}</span>
                  {activeModule === i && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
            <div
              className="rounded-3xl min-h-[550px] flex flex-col overflow-hidden relative group self-center w-full"
              style={{
                border: `1px solid ${BRAND.teal}15`,
              }}
            >
              <Image
                src={modules[activeModule].img}
                alt={modules[activeModule].title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BRAND.navy}FA 10%, ${BRAND.navy}D0 50%, ${BRAND.navy}90 100%)` }} />
              
              <div className="relative z-10 p-10 flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.navy})`, boxShadow: "0 8px 30px rgba(15,118,110,0.4)" }}>
                  {(() => { const Icon = modules[activeModule].icon; return <Icon className="w-8 h-8 text-white" /> })()}
                </div>
                <h3 className="text-3xl font-black mb-4 text-white">
                  {modules[activeModule].title}
                </h3>
                <p className="text-white/80 leading-relaxed text-lg mb-8 max-w-md">
                  {modules[activeModule].desc}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {modules[activeModule].tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold" style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14" style={{ background: `linear-gradient(180deg, white 0%, ${BRAND.teal}06 100%)` }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: BRAND.teal }}>Simple Onboarding</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: BRAND.navy }}>
              Get Started in 3 Easy Steps
            </h2>
            <p className="text-gray-500 leading-relaxed">From first contact to full deployment — we make the transition smooth and hassle-free.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Request a Demo", desc: "Schedule a free demo call. We understand your hospital's unique needs and show you the platform in action." },
              { step: "02", title: "Setup & Training", desc: "Our team deploys the system, migrates your data, and trains your staff — all within days, not months." },
              { step: "03", title: "Go Live & Grow", desc: "Start managing your hospital with ease. Our 24/7 support team is always here to help you succeed." },
            ].map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})`, boxShadow: "0 8px 25px rgba(12,74,110,0.2)" }}>
                  <span className="text-white text-lg font-black">{s.step}</span>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px]" style={{ background: `linear-gradient(to right, ${BRAND.teal}30, transparent)` }} />}
                <h3 className="text-lg font-black mb-2" style={{ color: BRAND.navy }}>{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: BRAND.teal }}>What Our Clients Say</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: BRAND.navy }}>
              Trusted by Healthcare Leaders
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Dr. Rahman", role: "Director", hospital: "City General Hospital", text: "This HMS transformed how we operate. Billing that took hours now takes minutes. The pharmacy module alone saved us from stock losses." },
              { name: "Fatima Akter", role: "Admin Head", hospital: "Care Plus Clinic", text: "The multi-branch feature is a game changer. We manage 3 locations from one dashboard. Staff actually enjoy using it — that's rare!" },
              { name: "Dr. Hossain", role: "Managing Director", hospital: "MediCare Hospital", text: "From appointment scheduling to lab reports, everything is seamless. Patient satisfaction improved significantly since we adopted HamoodTech HMS." },
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white hover:shadow-xl transition-all duration-300" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})` }}>
                    {t.name[0]}{t.name.split(" ")[1]?.[0] || ""}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: BRAND.navy }}>{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.role}, {t.hospital}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: BRAND.teal }}>FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: BRAND.navy }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Can I migrate data from my current system?", a: "Absolutely! Our team handles full data migration from any existing system — spreadsheets, legacy software, or paper records. We ensure zero data loss during the transition." },
              { q: "Do you provide staff training?", a: "Yes, comprehensive on-site and remote training is included. We train doctors, nurses, pharmacists, receptionists, and admin staff separately based on their roles." },
              { q: "Is there a mobile app?", a: "The entire system is fully responsive and works beautifully on phones, tablets, and desktops. Dedicated mobile apps for doctors and patients are on our roadmap." },
              { q: "How long does setup take?", a: "Most hospitals are fully operational within 3-5 days. Complex multi-branch setups may take 1-2 weeks. We work on your timeline, not ours." },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})` }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "white", filter: "blur(80px)" }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: BRAND.accent, filter: "blur(60px)" }} />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                Ready to Transform Your Hospital?
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
                Join healthcare providers who have modernized their operations with our comprehensive HMS platform. Get started today.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/login"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-300 hover:scale-105"
                  style={{ background: "white", color: BRAND.navy, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
                >
                  Get Started Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})` }}>
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black" style={{ color: BRAND.navy }}>
                HamoodTech<span style={{ color: BRAND.teal }}>HMS</span>
              </span>
            </div>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} HamoodTech. All rights reserved. Built with ❤️ for healthcare.
            </p>
            <div className="flex gap-6">
              <Link href="/auth/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Privacy</Link>
              <Link href="/auth/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Terms</Link>
              <Link href="/auth/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOAT ── */}
      <a
        href="https://wa.me/8801XXXXXXXXX"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
        style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </a>
    </div>
  )
}
