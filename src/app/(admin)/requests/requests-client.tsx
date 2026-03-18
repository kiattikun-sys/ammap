"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationRequest } from "@/domains/platform/actions/list-registration-requests";
import { approveRegistrationRequest, rejectRegistrationRequest } from "@/domains/platform/actions/review-registration-request";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอพิจารณา",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธแล้ว",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const FILTER_TABS = [
  { value: "pending", label: "รอพิจารณา" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "rejected", label: "ปฏิเสธแล้ว" },
  { value: "all", label: "ทั้งหมด" },
] as const;

interface ReviewModalState {
  request: RegistrationRequest;
  action: "approve" | "reject";
}

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

  function handleFilterChange(value: string) {
    router.push(`/admin/requests?status=${value}` as any);
  }

  function openModal(request: RegistrationRequest, action: "approve" | "reject") {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">คำขอใช้งานระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">
          ตรวจสอบและพิจารณาคำขอจากผู้ใช้ใหม่
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

      {/* Table */}
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">เบอร์โทร</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">วันที่ยื่น</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{req.fullName}</p>
                    <p className="text-xs text-slate-400">{req.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{req.requestedOrgName}</p>
                    {req.companyName && (
                      <p className="text-xs text-slate-400">{req.companyName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {req.phone ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[req.status] ?? ""}`}>
                      {STATUS_LABELS[req.status] ?? req.status}
                    </span>
                    {req.notes && (
                      <p className="mt-1 text-xs text-slate-400 max-w-[160px] truncate" title={req.notes}>
                        หมายเหตุ: {req.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(req, "approve")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => openModal(req, "reject")}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">ดำเนินการแล้ว</span>
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
                  <p className="text-xs text-slate-400">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                </div>
              </div>

              {/* Request info */}
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">คำขอ</p>
                <p className="text-sm font-semibold text-slate-900">{modal.request.fullName}</p>
                <p className="text-xs text-slate-500">{modal.request.email}</p>
                <p className="text-xs text-slate-500">องค์กร: {modal.request.requestedOrgName}</p>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  หมายเหตุ <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                  placeholder={modal.action === "approve"
                    ? "เช่น ข้อมูลเพิ่มเติมสำหรับผู้ใช้"
                    : "เช่น เหตุผลที่ปฏิเสธ"}
                />
              </div>

              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {actionError}
                </div>
              )}

              {/* Actions */}
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
                    ? "ยืนยันอนุมัติ"
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
