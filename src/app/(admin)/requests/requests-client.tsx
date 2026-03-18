"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationRequest } from "@/domains/platform/actions/list-registration-requests";
import {
  approveRegistrationRequest,
  rejectRegistrationRequest,
  resendInvite,
} from "@/domains/platform/actions/review-registration-request";

// ── Status display config ────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:   "รอพิจารณา",
  approved:  "อนุมัติ (รอส่งคำเชิญ)",
  invited:   "ส่งคำเชิญแล้ว",
  activated: "เปิดใช้งานแล้ว",
  rejected:  "ปฏิเสธแล้ว",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-800 border-yellow-200",
  approved:  "bg-blue-50 text-blue-800 border-blue-200",
  invited:   "bg-indigo-50 text-indigo-800 border-indigo-200",
  activated: "bg-green-50 text-green-800 border-green-200",
  rejected:  "bg-red-50 text-red-800 border-red-200",
};

const FILTER_TABS = [
  { value: "pending",   label: "รอพิจารณา" },
  { value: "invited",   label: "รอยืนยัน" },
  { value: "activated", label: "เปิดใช้แล้ว" },
  { value: "rejected",  label: "ปฏิเสธ" },
  { value: "all",       label: "ทั้งหมด" },
] as const;

// ── Types ────────────────────────────────────────────────────────

type ReviewAction = "approve" | "reject";

interface ReviewModalState {
  request: RegistrationRequest;
  action: ReviewAction;
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ────────────────────────────────────────────────────

export function RequestsClient({
  requests,
  currentFilter,
}: {
  requests: RegistrationRequest[];
  currentFilter: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ReviewModalState | null>(null);
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<Record<string, string>>({});

  function handleFilterChange(value: string) {
    router.push(`/admin/requests?status=${value}` as any);
  }

  function openModal(request: RegistrationRequest, action: ReviewAction) {
    setModal({ request, action });
    setNotes("");
    setActionError(null);
  }

  function closeModal() {
    setModal(null);
    setNotes("");
    setActionError(null);
  }

  function handleConfirm() {
    if (!modal) return;
    setActionError(null);
    startTransition(async () => {
      try {
        if (modal.action === "approve") {
          await approveRegistrationRequest(modal.request.id, notes);
        } else {
          await rejectRegistrationRequest(modal.request.id, notes);
        }
        closeModal();
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleResend(requestId: string) {
    setResendingId(requestId);
    setResendError((prev) => ({ ...prev, [requestId]: "" }));
    startTransition(async () => {
      try {
        await resendInvite(requestId);
        router.refresh();
      } catch (err) {
        setResendError((prev) => ({
          ...prev,
          [requestId]: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
        }));
      } finally {
        setResendingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">คำขอใช้งานระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">
          ตรวจสอบและพิจารณาคำขอจากผู้ใช้ใหม่ — {requests.length} รายการ
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              currentFilter === tab.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-400">ไม่มีคำขอในหมวดนี้</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">ชื่อ / อีเมล</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">องค์กร</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">สถานะ / คำเชิญ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">วันที่ยื่น</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors align-top">
                  {/* Name / email / phone */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{req.fullName}</p>
                    <p className="text-xs text-slate-400">{req.email}</p>
                    {req.phone && (
                      <p className="text-xs text-slate-400">{req.phone}</p>
                    )}
                  </td>

                  {/* Org */}
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{req.requestedOrgName}</p>
                    {req.companyName && (
                      <p className="text-xs text-slate-400">{req.companyName}</p>
                    )}
                  </td>

                  {/* Status + invite info */}
                  <td className="px-4 py-3 space-y-1.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[req.status] ?? ""}`}>
                      {STATUS_LABELS[req.status] ?? req.status}
                    </span>

                    {req.inviteAttempts > 0 && (
                      <p className="text-xs text-slate-400">
                        ส่งคำเชิญแล้ว {req.inviteAttempts} ครั้ง
                        {req.invitedAt ? ` · ล่าสุด ${formatDate(req.invitedAt)}` : ""}
                      </p>
                    )}

                    {req.lastInviteError && (
                      <p className="text-xs text-red-500 max-w-[200px] truncate" title={req.lastInviteError}>
                        ⚠ {req.lastInviteError}
                      </p>
                    )}

                    {req.notes && (
                      <p className="text-xs text-slate-400 max-w-[200px] truncate" title={req.notes}>
                        หมายเหตุ: {req.notes}
                      </p>
                    )}

                    {resendError[req.id] && (
                      <p className="text-xs text-red-500">{resendError[req.id]}</p>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(req.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(req, "approve")}
                          disabled={isPending}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => openModal(req, "reject")}
                          disabled={isPending}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    )}

                    {(req.status === "invited" || req.status === "approved") && (
                      <button
                        onClick={() => handleResend(req.id)}
                        disabled={isPending && resendingId === req.id}
                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                      >
                        {isPending && resendingId === req.id ? "กำลังส่ง…" : "ส่งคำเชิญอีกครั้ง"}
                      </button>
                    )}

                    {(req.status === "activated" || req.status === "rejected") && (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              {/* Icon + title */}
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  modal.action === "approve" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {modal.action === "approve" ? (
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {modal.action === "approve" ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {modal.action === "approve"
                      ? "ระบบจะส่งคำเชิญไปยังอีเมลของผู้ใช้"
                      : "การดำเนินการนี้ไม่สามารถยกเลิกได้"}
                  </p>
                </div>
              </div>

              {/* Request info */}
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">คำขอ</p>
                <p className="text-sm font-semibold text-slate-900">{modal.request.fullName}</p>
                <p className="text-xs text-slate-500">{modal.request.email}</p>
                <p className="text-xs text-slate-500">องค์กร: {modal.request.requestedOrgName}</p>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  หมายเหตุ <span className="font-normal text-slate-400">(ถ้ามี)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={
                    modal.action === "approve"
                      ? "เช่น ข้อมูลเพิ่มเติมสำหรับผู้ใช้"
                      : "เช่น เหตุผลที่ปฏิเสธ"
                  }
                />
              </div>

              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {actionError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirm}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                    modal.action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isPending
                    ? "กำลังดำเนินการ…"
                    : modal.action === "approve"
                    ? "ยืนยันอนุมัติ + ส่งคำเชิญ"
                    : "ยืนยันปฏิเสธ"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
