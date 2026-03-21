"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── Section wrapper with fade-up animation ─────────────────── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Data ────────────────────────────────────────────────────── */
const PAIN_POINTS = [
  {
    icon: "📂",
    title: "ข้อมูลกระจัดกระจาย",
    desc: "Excel หลายไฟล์ PDF หลายฉบับ และอีเมลที่หาไม่เจอ — ทีมเสียเวลาหาข้อมูลมากกว่าทำงานจริง",
  },
  {
    icon: "🔄",
    title: "สถานะไม่อัปเดตจริง",
    desc: "ประชุมเสร็จ ข้อมูลก็เปลี่ยน คนละทีมเห็นคนละเวอร์ชัน ไม่มีใครรู้ว่าอะไรคือ 'ล่าสุด' จริงๆ",
  },
  {
    icon: "🔍",
    title: "ค้นหายาก เสียเวลานาน",
    desc: "จะดูโครงการที่หนึ่ง ต้องเปิดหลายแท็บ ถามหลายคน กว่าจะได้คำตอบก็ผ่านไปครึ่งวัน",
  },
];

const FEATURES = [
  {
    icon: "🗺️",
    title: "แผนที่ Interactive",
    desc: "เห็นทุกโครงการบนแผนที่เดียว zoom เข้าดูรายละเอียด คลิกดูข้อมูลได้ทันที",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: "⚡",
    title: "ค้นหาและ Filter ทันที",
    desc: "กรอง filter ตามสถานะ ประเภท หรือพื้นที่ได้ในพริบตา ไม่ต้องเลื่อน Excel อีกต่อไป",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: "🔔",
    title: "Real-time Updates",
    desc: "ทุกการเปลี่ยนแปลงอัปเดตทันที ทุกคนในทีมเห็นข้อมูลเดียวกันพร้อมกัน",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: "🔐",
    title: "ควบคุมสิทธิ์ได้",
    desc: "กำหนดว่าใครเห็นอะไร แยกสิทธิ์ตามทีม ตำแหน่ง หรือโครงการได้อย่างละเอียด",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: "🏗️",
    title: "รวมทุกโครงการ",
    desc: "บริหารหลายโครงการพร้อมกัน ดูภาพรวมทั้งหมดจากหน้าเดียว ไม่ต้องสลับแอป",
    color: "bg-slate-50 text-slate-600",
  },
  {
    icon: "📱",
    title: "ใช้งานทุกอุปกรณ์",
    desc: "Desktop หรือมือถือก็ใช้ได้เหมือนกัน รองรับทีมภาคสนามที่ต้องการดูข้อมูลหน้างาน",
    color: "bg-pink-50 text-pink-600",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "สมัครและตั้งค่าองค์กร",
    desc: "กรอกข้อมูลองค์กร ระบบตรวจสอบและเปิดใช้งานภายใน 1 วันทำการ",
    icon: "📋",
  },
  {
    step: "02",
    title: "เพิ่มโครงการและทีมงาน",
    desc: "สร้างโครงการ ปักหมุดบนแผนที่ เชิญสมาชิกทีม และตั้งค่าสิทธิ์การเข้าถึง",
    icon: "👥",
  },
  {
    step: "03",
    title: "เริ่มใช้งานได้เลย",
    desc: "ทีมทั้งหมดเริ่มทำงานร่วมกันได้ทันที เห็นข้อมูลเดียวกัน อัปเดต real-time",
    icon: "🚀",
  },
];

const STATS = [
  { value: "50+", label: "โครงการที่บริหาร" },
  { value: "200+", label: "ผู้ใช้งานทั้งหมด" },
  { value: "9", label: "องค์กรที่ไว้วางใจ" },
  { value: "99.9%", label: "Uptime SLA" },
];

const TARGET_USERS = [
  { icon: "🏛️", label: "หน่วยงานรัฐ" },
  { icon: "🏗️", label: "ผู้รับเหมาก่อสร้าง" },
  { icon: "📐", label: "บริษัทสถาปนิก" },
  { icon: "🔍", label: "ที่ปรึกษา QA/QC" },
  { icon: "🌏", label: "โครงการหลายพื้นที่" },
  { icon: "👷", label: "ทีมภาคสนาม" },
];

const PRICING = [
  {
    name: "Starter",
    price: "ติดต่อสอบถาม",
    desc: "เหมาะสำหรับทีมเล็กหรือโครงการเดียว",
    features: ["ผู้ใช้ 1–5 คน", "โครงการ 1–3 โครงการ", "พื้นที่จัดเก็บ 10 GB", "Support ทางอีเมล"],
    cta: "ติดต่อเรา",
    highlight: false,
  },
  {
    name: "Professional",
    price: "ติดต่อสอบถาม",
    desc: "เหมาะสำหรับองค์กรที่มีหลายโครงการ",
    features: ["ผู้ใช้ไม่จำกัด", "โครงการไม่จำกัด", "พื้นที่จัดเก็บ 100 GB", "Priority Support", "Custom Map Layer"],
    cta: "เริ่มต้นตอนนี้",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom Pricing",
    desc: "สำหรับองค์กรขนาดใหญ่ที่ต้องการ custom",
    features: ["ทุกอย่างใน Professional", "On-premise deployment", "SLA 99.9%", "Dedicated support", "Training & Onboarding"],
    cta: "นัด Demo",
    highlight: false,
  },
];

/* ─── Map Mockup SVG ──────────────────────────────────────────── */
function MapMockup() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="mx-auto flex w-64 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-400">
          <span>🔒</span> ammap.app/dashboard
        </div>
      </div>

      {/* App layout */}
      <div className="flex h-80">
        {/* Sidebar */}
        <div className="hidden w-52 flex-shrink-0 border-r border-slate-100 p-3 sm:block">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600" />
            <span className="text-xs font-bold text-slate-700">AMMAP</span>
          </div>
          {["📊 Dashboard", "🗺️ แผนที่", "📁 โครงการ", "✅ งาน", "🔍 ตรวจสอบ", "👥 ทีมงาน"].map((item) => (
            <div
              key={item}
              className={`mb-1 rounded-lg px-2.5 py-1.5 text-xs ${
                item.startsWith("🗺️") ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="relative flex-1 overflow-hidden">
          {/* Map background */}
          <svg width="100%" height="100%" viewBox="0 0 600 320" className="absolute inset-0">
            <rect width="600" height="320" fill="#e8f0fe" />
            {/* Grid lines */}
            {[0, 60, 120, 180, 240, 300].map((y) => (
              <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#c7d7f8" strokeWidth="1" />
            ))}
            {[0, 80, 160, 240, 320, 400, 480, 560].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="320" stroke="#c7d7f8" strokeWidth="1" />
            ))}
            {/* Roads */}
            <path d="M 0 160 Q 150 140 300 160 T 600 160" stroke="#fff" strokeWidth="8" fill="none" />
            <path d="M 200 0 Q 220 160 200 320" stroke="#fff" strokeWidth="6" fill="none" />
            <path d="M 400 0 Q 380 160 400 320" stroke="#fff" strokeWidth="5" fill="none" />
            {/* Blocks */}
            <rect x="40" y="40" width="100" height="80" rx="4" fill="#dce8fa" opacity="0.8" />
            <rect x="250" y="60" width="80" height="60" rx="4" fill="#dce8fa" opacity="0.8" />
            <rect x="420" y="30" width="120" height="90" rx="4" fill="#dce8fa" opacity="0.8" />
            <rect x="50" y="200" width="90" height="80" rx="4" fill="#dce8fa" opacity="0.8" />
            <rect x="440" y="190" width="110" height="100" rx="4" fill="#dce8fa" opacity="0.8" />
            {/* Project pins */}
            <g transform="translate(85,75)">
              <circle cx="0" cy="0" r="12" fill="#2563EB" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">A</text>
            </g>
            <g transform="translate(280,85)">
              <circle cx="0" cy="0" r="12" fill="#10B981" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">B</text>
            </g>
            <g transform="translate(470,65)">
              <circle cx="0" cy="0" r="12" fill="#F59E0B" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
            </g>
            <g transform="translate(95,240)">
              <circle cx="0" cy="0" r="10" fill="#6366F1" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">D</text>
            </g>
            <g transform="translate(490,235)">
              <circle cx="0" cy="0" r="10" fill="#EF4444" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">E</text>
            </g>
          </svg>

          {/* Info card overlay */}
          <div className="absolute right-3 top-3 w-44 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-1 text-xs font-semibold text-slate-700">โครงการ A</p>
            <p className="text-xs text-slate-500">ก่อสร้างอาคาร 5 ชั้น</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-3/5 rounded-full bg-blue-500" />
              </div>
              <span className="text-xs font-medium text-blue-600">60%</span>
            </div>
            <div className="mt-2 flex gap-1">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">กำลังดำเนินการ</span>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 border-t border-slate-100 bg-white/90 px-3 py-2 backdrop-blur-sm">
            {[
              { label: "โครงการทั้งหมด", value: "5", color: "text-blue-600" },
              { label: "กำลังดำเนินการ", value: "3", color: "text-emerald-600" },
              { label: "งานค้าง", value: "12", color: "text-orange-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-bold text-slate-900">AMMAP</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          {["ฟีเจอร์", "วิธีใช้งาน", "ราคา"].map((item) => (
            <a key={item} href={`#${item}`} className="text-sm text-slate-600 transition-colors hover:text-blue-600">
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-blue-600 md:block">
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            ลองใช้งานฟรี
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pb-24 pt-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-100 opacity-40 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-100 opacity-30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Advanced Map Management Platform
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                เห็นทุกโครงการ<br />
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  ในแผนที่เดียว
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                AMMAP รวมข้อมูลโครงการ แผนที่ และทีมงานไว้ในที่เดียว<br className="hidden sm:block" />
                ค้นหาได้ทันที อัปเดต real-time ตัดสินใจได้เร็วขึ้น
              </p>

              {/* Emotional hooks */}
              <div className="mt-4 flex flex-wrap gap-3">
                {["✅ เลิกเปิด Excel หลายไฟล์", "✅ เลิกถามข้อมูลซ้ำ", "✅ ทุกอย่างอยู่ในที่เดียว"].map((hook) => (
                  <span key={hook} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    {hook}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200"
                >
                  เริ่มต้นภายใน 1 นาที
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#วิธีใช้งาน"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:border-blue-300 hover:text-blue-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ดูการสาธิต
                </a>
              </div>

              <p className="mt-4 text-sm text-slate-400">ไม่ต้องใช้บัตรเครดิต • ตั้งค่าเสร็จใน 1 วัน</p>
            </div>

            {/* Map mockup */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-100 to-emerald-100 opacity-50 blur-2xl" />
              <div className="relative">
                <MapMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <Section key={s.label}>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-blue-600">{s.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{s.label}</div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Section>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">ปัญหาที่คุณเผชิญอยู่</p>
              <h2 className="text-3xl font-extrabold text-slate-900">
                ทำงานหนักขึ้น แต่ได้ผลลัพธ์เท่าเดิม?
              </h2>
              <p className="mt-3 text-slate-500">ทีมส่วนใหญ่เสียเวลา 30–40% ไปกับการหาข้อมูลแทนที่จะทำงานจริง</p>
            </div>
          </Section>

          <div className="grid gap-6 md:grid-cols-3">
            {PAIN_POINTS.map((p, i) => (
              <Section key={p.title}>
                <div
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="mb-4 text-4xl">{p.icon}</div>
                  <h3 className="mb-2 text-base font-semibold text-slate-800">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{p.desc}</p>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="ฟีเจอร์" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Section>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">ฟีเจอร์หลัก</p>
              <h2 className="text-3xl font-extrabold text-slate-900">ทุกอย่างที่ทีมคุณต้องการ</h2>
              <p className="mt-3 text-slate-500">ออกแบบมาเพื่อองค์กรที่มีโครงการหลายพื้นที่โดยเฉพาะ</p>
            </div>
          </Section>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Section key={f.title}>
                <div
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="วิธีใช้งาน" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Section>
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">วิธีเริ่มต้น</p>
              <h2 className="text-3xl font-extrabold text-slate-900">เริ่มใช้งานได้ใน 3 ขั้นตอน</h2>
              <p className="mt-3 text-slate-500">ไม่ซับซ้อน ไม่ต้องอบรมนาน ทีมพร้อมใช้งานได้ภายใน 1 วัน</p>
            </div>
          </Section>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-1/2 top-10 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 md:block" />

            {HOW_IT_WORKS.map((step, i) => (
              <Section key={step.step}>
                <div
                  className="relative flex flex-col items-center gap-4 text-center"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg shadow-blue-200">
                    {step.icon}
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-800 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Section>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">เหมาะกับใคร</p>
            <h2 className="mb-3 text-3xl font-extrabold">
              สำหรับทุกองค์กรที่มีโครงการภาคสนาม
            </h2>
            <p className="mb-10 text-blue-200">ไม่ว่าจะเป็นทีมเล็ก หรือองค์กรขนาดใหญ่</p>
          </Section>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TARGET_USERS.map((u, i) => (
              <Section key={u.label}>
                <div
                  className="rounded-2xl border border-blue-500/50 bg-blue-700/50 p-4 backdrop-blur-sm transition-all hover:bg-blue-600/50"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="mb-2 text-3xl">{u.icon}</div>
                  <div className="text-sm font-medium text-blue-100">{u.label}</div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="ราคา" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Section>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">แพ็กเกจ</p>
              <h2 className="text-3xl font-extrabold text-slate-900">เลือกแพ็กเกจที่เหมาะกับองค์กร</h2>
              <p className="mt-3 text-slate-500">ราคาเหมาะสม คุ้มค่ากับเวลาที่ประหยัดได้</p>
            </div>
          </Section>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan, i) => (
              <Section key={plan.name}>
                <div
                  className={`relative flex flex-col rounded-2xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                    plan.highlight
                      ? "border-2 border-blue-500 bg-blue-600 text-white"
                      : "border border-slate-100 bg-white"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
                      ⭐ แนะนำ
                    </div>
                  )}
                  <h3 className={`text-lg font-bold ${plan.highlight ? "text-white" : "text-slate-800"}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-2xl font-extrabold ${plan.highlight ? "text-white" : "text-blue-600"}`}>
                    {plan.price}
                  </p>
                  <p className={`mt-1 mb-5 text-sm ${plan.highlight ? "text-blue-200" : "text-slate-500"}`}>
                    {plan.desc}
                  </p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <svg className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? "text-blue-300" : "text-emerald-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={plan.highlight ? "text-blue-100" : "text-slate-600"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      plan.highlight
                        ? "bg-white text-blue-600 hover:bg-blue-50 shadow-sm"
                        : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST / SECURITY ─────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <Section>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
              {[
                { icon: "🔒", text: "ข้อมูลเข้ารหัส TLS/SSL" },
                { icon: "🛡️", text: "สิทธิ์แยกตามบทบาท RLS" },
                { icon: "☁️", text: "Cloud infrastructure" },
                { icon: "⚙️", text: "Backup อัตโนมัติ" },
                { icon: "🌏", text: "รองรับ Multi-organization" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 py-24 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-600 opacity-10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-500 opacity-10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Section>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
              พร้อมเริ่มต้นหรือยัง?
            </p>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              หากยังใช้ Excel อยู่<br />
              <span className="text-blue-400">นี่คือเวลาที่ควรเปลี่ยน</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              เริ่มจัดการโครงการบนแผนที่ ร่วมกับทีม ได้ทันที
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/40 transition-all hover:-translate-y-1 hover:bg-blue-400 hover:shadow-xl"
              >
                ลองใช้งานฟรี
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-8 py-4 text-base font-bold text-slate-300 transition-all hover:border-slate-400 hover:text-white"
              >
                📅 นัด Demo
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              ไม่ต้องใช้บัตรเครดิต • ตั้งค่าเสร็จใน 1 วัน • ทีม Support พร้อมช่วยเหลือ
            </p>
          </Section>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-10 text-slate-400">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <span className="font-bold text-white">AMMAP</span>
              <span className="text-xs text-slate-600">Advanced Map Management Platform</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">เข้าสู่ระบบ</Link>
              <Link href="/register" className="hover:text-white transition-colors">สมัครใช้งาน</Link>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} AMMAP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
