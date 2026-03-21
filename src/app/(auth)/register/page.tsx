"use client";

import { useState } from "react";
import Link from "next/link";
import { submitRegistrationRequest } from "@/domains/platform/actions/submit-registration-request";

type FormState = "idle" | "submitting" | "success" | "error" | "rejected";

function validatePhoneClient(phone: string): string | null {
  if (!phone.trim()) return null;
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (!/^0\d{8,9}$/.test(digits)) {
    return "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081-234-5678)";
  }
  return null;
}

export default function RegisterPage() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestedOrgName, setRequestedOrgName] = useState("");

  function handlePhoneChange(value: string) {
    setPhone(value);
    setPhoneError(validatePhoneClient(value));
  }

  async function handleSubmit(e: React.FormEvent, allowResubmit = false) {
    e.preventDefault();

    const pErr = validatePhoneClient(phone);
    if (pErr) {
      setPhoneError(pErr);
      return;
    }

    setState("submitting");
    setErrorMsg(null);
    try {
      await submitRegistrationRequest({
        email,
        fullName,
        companyName,
        phone,
        requestedOrgName,
        allowResubmit,
      });
      setState("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
      if (msg.startsWith("REJECTED:")) {
        setRejectionReason(msg.slice("REJECTED:".length) || null);
        setState("rejected");
      } else {
        setErrorMsg(msg);
        setState("error");
      }
    }
  }

  // ── Success ────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">ส่งคำขอสำเร็จ</h1>
          <p className="mt-2 text-sm text-slate-500">
            ทีมงานจะตรวจสอบคำขอของคุณและแจ้งผลทางอีเมล{" "}
            <span className="font-medium text-slate-700">{email}</span>
          </p>
          <p className="mt-4 text-xs text-slate-400">
            โดยปกติการพิจารณาใช้เวลา 1–2 วันทำการ
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  // ── Rejected — previous request was rejected ───────────────────────
  if (state === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">คำขอก่อนหน้าของคุณถูกปฏิเสธ</p>
            {rejectionReason ? (
              <p className="mt-1 text-sm text-amber-700">{rejectionReason}</p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">ไม่มีเหตุผลระบุไว้</p>
            )}
          </div>
          <p className="mb-5 text-sm text-slate-600">
            คุณสามารถส่งคำขอใหม่ได้ ทีมงานจะพิจารณาอีกครั้ง
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setState("idle")}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={(e) => handleSubmit(e as any, true)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ส่งคำขอใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ขอใช้งานระบบ</h1>
          <p className="mt-1 text-sm text-slate-500">
            กรอกข้อมูลเพื่อยื่นคำขอเข้าใช้งาน ทีมงานจะติดต่อกลับทางอีเมล
          </p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="fullName">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="สมชาย ใจดี"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              อีเมล <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="requestedOrgName">
              ชื่อบริษัท / องค์กร <span className="text-red-500">*</span>
            </label>
            <input
              id="requestedOrgName"
              type="text"
              required
              value={requestedOrgName}
              onChange={(e) => setRequestedOrgName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="บริษัท ก่อสร้าง จำกัด"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="companyName">
              ชื่อโครงการ / หน่วยงาน
              <span className="ml-1 text-xs text-slate-400">(ถ้ามี)</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="โครงการ ABC"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">
              เบอร์โทรศัพท์
              <span className="ml-1 text-xs text-slate-400">(ถ้ามี)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${
                phoneError
                  ? "border-red-400 focus:border-red-400"
                  : "border-slate-300 focus:border-blue-500"
              }`}
              placeholder="081-234-5678"
            />
            {phoneError && (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            )}
          </div>

          {state === "error" && errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={state === "submitting" || !!phoneError}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {state === "submitting" ? "กำลังส่งคำขอ…" : "ส่งคำขอใช้งาน"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
