"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ClipboardList } from "lucide-react";
import type { RegistrationRequest } from "@/domains/platform/actions/list-registration-requests";
import {
  approveRegistrationRequest,
  rejectRegistrationRequest,
  resendInvite,
} from "@/domains/platform/actions/review-registration-request";

// ── Config ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  approved:  "Approved",
  invited:   "Invited",
  activated: "Activated",
  rejected:  "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-800 border-yellow-200",
  approved:  "bg-blue-50 text-blue-800 border-blue-200",
  invited:   "bg-indigo-50 text-indigo-800 border-indigo-200",
  activated: "bg-green-50 text-green-800 border-green-200",
  rejected:  "bg-red-50 text-red-800 border-red-200",
};

const FILTER_TABS = [
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "invited",   label: "Invited" },
  { value: "activated", label: "Activated" },
  { value: "rejected",  label: "Rejected" },
  { value: "all",       label: "All" },
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
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
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
  const [isConfirmPending, startConfirmTransition] = useTransition();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [modal, setModal] = useState<ReviewModalState | null>(null);
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  // Client-side search: email, name, org
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.requestedOrgName.toLowerCase().includes(q) ||
        (r.companyName ?? "").toLowerCase().includes(q)
    );
  }, [requests, search]);

  function handleFilterChange(value: string) {
    setSearch("");
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
    startConfirmTransition(async () => {
      try {
        if (modal.action === "approve") {
          await approveRegistrationRequest(modal.request.id, notes);
        } else {
          await rejectRegistrationRequest(modal.request.id, notes);
        }
        closeModal();
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  }

  async function handleResend(requestId: string) {
    setResendingId(requestId);
    setResendError((prev) => ({ ...prev, [requestId]: "" }));
    try {
      await resendInvite(requestId);
      router.refresh();
    } catch (err) {
      setResendError((prev) => ({
        ...prev,
        [requestId]: err instanceof Error ? err.message : "An error occurred",
      }));
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Registration Requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and process onboarding requests from new users.
        </p>
      </div>

      {/* Toolbar: filters + search */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                currentFilter === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or org…"
            className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 w-64"
          />
        </div>
      </div>

      {/* Result count */}
      <p className="mb-3 text-xs text-slate-400">
        {filtered.length} of {requests.length} request{requests.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
          <ClipboardList size={28} className="mb-2 text-slate-300" />
          <p className="text-sm font-medium">
            {search ? "No requests match your search" : "No requests in this category"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Name / Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors align-top">

                  {/* Name / email / phone */}
                  <td className="px-4 py-3 min-w-[200px]">
                    <p className="font-medium text-slate-900">{req.fullName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{req.email}</p>
                    {req.phone && (
                      <p className="text-xs text-slate-400 mt-0.5">{req.phone}</p>
                    )}
                  </td>

                  {/* Org */}
                  <td className="px-4 py-3 min-w-[160px]">
                    <p className="text-slate-800 font-medium">{req.requestedOrgName}</p>
                    {req.companyName && (
                      <p className="text-xs text-slate-400 mt-0.5">{req.companyName}</p>
                    )}
                  </td>

                  {/* Status + invite details */}
                  <td className="px-4 py-3 min-w-[180px]">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[req.status] ?? ""}`}>
                      {STATUS_LABELS[req.status] ?? req.status}
                    </span>

                    {req.inviteAttempts > 0 && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        {req.inviteAttempts} invite attempt{req.inviteAttempts !== 1 ? "s" : ""}
                        {req.invitedAt && <span> · last {formatDate(req.invitedAt)}</span>}
                      </p>
                    )}

                    {req.lastInviteError && (
                      <p
                        className="mt-1 text-xs text-red-500 max-w-[220px] truncate"
                        title={req.lastInviteError}
                      >
                        ⚠ {req.lastInviteError}
                      </p>
                    )}

                    {req.notes && (
                      <p
                        className="mt-1 text-xs text-slate-400 max-w-[220px] truncate"
                        title={req.notes}
                      >
                        Note: {req.notes}
                      </p>
                    )}

                    {resendError[req.id] && (
                      <p className="mt-1 text-xs text-red-500">{resendError[req.id]}</p>
                    )}
                  </td>

                  {/* Timeline dates */}
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="space-y-1 text-xs text-slate-400">
                      <p><span className="text-slate-500 font-medium">Submitted:</span> {formatDate(req.createdAt)}</p>
                      {req.reviewedAt && (
                        <p><span className="text-slate-500 font-medium">Reviewed:</span> {formatDate(req.reviewedAt)}</p>
                      )}
                      {req.invitedAt && (
                        <p><span className="text-slate-500 font-medium">Invited:</span> {formatDate(req.invitedAt)}</p>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(req, "approve")}
                          disabled={isConfirmPending}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openModal(req, "reject")}
                          disabled={isConfirmPending}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {(req.status === "invited" || req.status === "approved") && (
                      <button
                        onClick={() => handleResend(req.id)}
                        disabled={resendingId === req.id}
                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                      >
                        {resendingId === req.id ? "Sending…" : "Resend Invite"}
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
                    {modal.action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {modal.action === "approve"
                      ? "An invite email will be sent to the user."
                      : "This action cannot be undone."}
                  </p>
                </div>
              </div>

              {/* Request summary */}
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Request</p>
                <p className="text-sm font-semibold text-slate-900">{modal.request.fullName}</p>
                <p className="text-xs text-slate-500">{modal.request.email}</p>
                <p className="text-xs text-slate-500">Org: {modal.request.requestedOrgName}</p>
                {modal.request.companyName && (
                  <p className="text-xs text-slate-500">Company: {modal.request.companyName}</p>
                )}
                {modal.request.phone && (
                  <p className="text-xs text-slate-500">Phone: {modal.request.phone}</p>
                )}
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={
                    modal.action === "approve"
                      ? "e.g. Additional info for the user"
                      : "e.g. Reason for rejection"
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
                  disabled={isConfirmPending}
                  onClick={handleConfirm}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                    modal.action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isConfirmPending
                    ? "Processing…"
                    : modal.action === "approve"
                    ? "Confirm Approval + Send Invite"
                    : "Confirm Rejection"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isConfirmPending}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
