"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, Users, ShieldCheck, Building2, Clock, ShieldOff, ShieldCheck as ShieldOn, MailCheck } from "lucide-react";
import type { PlatformUser } from "@/domains/platform/queries/list-platform-users";
import { resendInvite } from "@/domains/platform/actions/review-registration-request";
import { suspendUser, reactivateUser } from "@/domains/platform/actions/manage-user-status";
import { useRouter } from "next/navigation";

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

function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const REG_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved:  "bg-blue-50 text-blue-700 border-blue-200",
  invited:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  activated: "bg-green-50 text-green-700 border-green-200",
  rejected:  "bg-red-50 text-red-700 border-red-200",
};

const PLATFORM_ROLE_COLORS: Record<string, string> = {
  platform_owner: "bg-red-50 text-red-700 border-red-200",
  platform_admin: "bg-orange-50 text-orange-700 border-orange-200",
};

// ── Filter options ────────────────────────────────────────────────

const FILTER_TABS = [
  { value: "all",            label: "All" },
  { value: "active",         label: "Active" },
  { value: "suspended",      label: "Suspended" },
  { value: "platform_admin", label: "Platform Admins" },
  { value: "with_org",       label: "Has Org" },
  { value: "no_org",         label: "No Org" },
] as const;

type FilterValue = typeof FILTER_TABS[number]["value"];

// ── Component ────────────────────────────────────────────────────

export function UsersClient({
  users,
  callerRole,
  callerId,
}: {
  users: PlatformUser[];
  callerRole: "platform_owner" | "platform_admin";
  callerId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  // Resend invite
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendErrors, setResendErrors] = useState<Record<string, string>>({});
  const [resendSuccess, setResendSuccess] = useState<Record<string, boolean>>({});

  // Suspend modal
  const [suspendTarget, setSuspendTarget] = useState<PlatformUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [isSuspendPending, startSuspendTransition] = useTransition();

  // Reactivate modal
  const [reactivateTarget, setReactivateTarget] = useState<PlatformUser | null>(null);
  const [reactivateError, setReactivateError] = useState<string | null>(null);
  const [isReactivatePending, startReactivateTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = users;

    if (filter === "active")         result = result.filter((u) => u.userStatus === "active");
    else if (filter === "suspended") result = result.filter((u) => u.userStatus === "suspended");
    else if (filter === "platform_admin") result = result.filter((u) => u.platformRole !== null);
    else if (filter === "with_org")  result = result.filter((u) => u.organizations.length > 0);
    else if (filter === "no_org")    result = result.filter((u) => u.organizations.length === 0);

    if (q) {
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName ?? "").toLowerCase().includes(q) ||
          u.organizations.some((o) => o.organizationName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [users, search, filter]);

  // ── Resend invite ──────────────────────────────────────────────
  async function handleResend(user: PlatformUser) {
    if (!user.registrationRequestId) return;
    setResendingId(user.id);
    setResendErrors((prev) => ({ ...prev, [user.id]: "" }));
    setResendSuccess((prev) => ({ ...prev, [user.id]: false }));
    try {
      await resendInvite(user.registrationRequestId);
      setResendSuccess((prev) => ({ ...prev, [user.id]: true }));
      router.refresh();
    } catch (err) {
      setResendErrors((prev) => ({
        ...prev,
        [user.id]: err instanceof Error ? err.message : "Error sending invite",
      }));
    } finally {
      setResendingId(null);
    }
  }

  const canResend = (u: PlatformUser) =>
    u.registrationRequestId !== null &&
    (u.registrationStatus === "approved" || u.registrationStatus === "invited");

  // ── Suspend ────────────────────────────────────────────────────
  function canSuspend(u: PlatformUser): boolean {
    if (u.id === callerId) return false;
    if (u.platformRole === "platform_owner") return false;
    if (u.platformRole === "platform_admin" && callerRole !== "platform_owner") return false;
    if (u.userStatus === "suspended") return false;
    return true;
  }

  function openSuspend(u: PlatformUser) {
    setSuspendTarget(u);
    setSuspendReason("");
    setSuspendError(null);
  }

  function closeSuspend() {
    setSuspendTarget(null);
    setSuspendReason("");
    setSuspendError(null);
  }

  function handleSuspendConfirm() {
    if (!suspendTarget) return;
    setSuspendError(null);
    startSuspendTransition(async () => {
      try {
        await suspendUser(suspendTarget.id, suspendReason);
        closeSuspend();
        router.refresh();
      } catch (err) {
        setSuspendError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  }

  // ── Reactivate ─────────────────────────────────────────────────
  function canReactivate(u: PlatformUser): boolean {
    if (u.id === callerId) return false;
    if (u.platformRole === "platform_owner") return false;
    if (u.platformRole === "platform_admin" && callerRole !== "platform_owner") return false;
    if (u.userStatus === "active") return false;
    return true;
  }

  function openReactivate(u: PlatformUser) {
    setReactivateTarget(u);
    setReactivateError(null);
  }

  function closeReactivate() {
    setReactivateTarget(null);
    setReactivateError(null);
  }

  function handleReactivateConfirm() {
    if (!reactivateTarget) return;
    setReactivateError(null);
    startReactivateTransition(async () => {
      try {
        await reactivateUser(reactivateTarget.id);
        closeReactivate();
        router.refresh();
      } catch (err) {
        setReactivateError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  }

  const suspendedCount = users.filter((u) => u.userStatus === "suspended").length;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide user inspection. {users.length} registered user{users.length !== 1 ? "s" : ""}
          {suspendedCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              <ShieldOff size={10} />
              {suspendedCount} suspended
            </span>
          )}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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

      <p className="mb-3 text-xs text-slate-400">
        {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
          <Users size={28} className="mb-2 text-slate-300" />
          <p className="text-sm font-medium">
            {search ? "No users match your search" : "No users in this category"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Platform Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Organizations</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Onboarding</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors align-top ${
                    user.userStatus === "suspended"
                      ? "bg-red-50/40 hover:bg-red-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* User identity */}
                  <td className="px-4 py-3 min-w-[200px]">
                    <p className="font-medium text-slate-900">
                      {user.displayName ?? <span className="text-slate-400 italic">No display name</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.id.slice(0, 8)}…</p>
                  </td>

                  {/* User status badge */}
                  <td className="px-4 py-3 min-w-[110px]">
                    {user.userStatus === "suspended" ? (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          <ShieldOff size={10} />
                          Suspended
                        </span>
                        {user.suspendedAt && (
                          <p className="mt-1 text-xs text-slate-400">{formatDateShort(user.suspendedAt)}</p>
                        )}
                        {user.suspensionReason && (
                          <p
                            className="mt-0.5 text-xs text-slate-400 max-w-[160px] truncate"
                            title={user.suspensionReason}
                          >
                            {user.suspensionReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    )}
                  </td>

                  {/* Platform role */}
                  <td className="px-4 py-3 min-w-[130px]">
                    {user.platformRole ? (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PLATFORM_ROLE_COLORS[user.platformRole]}`}>
                        <ShieldCheck size={11} />
                        {user.platformRole === "platform_owner" ? "Owner" : "Admin"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  {/* Organizations */}
                  <td className="px-4 py-3 min-w-[180px]">
                    {user.organizations.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Building2 size={12} className="text-slate-300" />
                        No organization
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {user.organizations.map((org) => (
                          <div key={org.organizationId}>
                            <p className="text-xs font-medium text-slate-700">{org.organizationName}</p>
                            <p className="text-xs text-slate-400">{org.role}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Onboarding status */}
                  <td className="px-4 py-3 min-w-[130px]">
                    {user.registrationStatus ? (
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${REG_STATUS_COLORS[user.registrationStatus] ?? ""}`}>
                        {user.registrationStatus.charAt(0).toUpperCase() + user.registrationStatus.slice(1)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                        Grandfathered
                      </span>
                    )}
                  </td>

                  {/* Activity */}
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="space-y-1 text-xs text-slate-400">
                      <p>
                        <span className="font-medium text-slate-500">Joined:</span>{" "}
                        {formatDateShort(user.createdAt)}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock size={11} />
                        {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never signed in"}
                      </p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="flex flex-col gap-1.5">
                      {/* Resend invite */}
                      {canResend(user) && user.userStatus === "active" && (
                        <div>
                          <button
                            onClick={() => handleResend(user)}
                            disabled={resendingId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                          >
                            <MailCheck size={11} />
                            {resendingId === user.id ? "Sending…" : "Resend Invite"}
                          </button>
                          {resendErrors[user.id] && (
                            <p className="mt-0.5 text-xs text-red-500">{resendErrors[user.id]}</p>
                          )}
                          {resendSuccess[user.id] && (
                            <p className="mt-0.5 text-xs text-green-600">Sent</p>
                          )}
                        </div>
                      )}

                      {/* Suspend */}
                      {canSuspend(user) && (
                        <button
                          onClick={() => openSuspend(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ShieldOff size={11} />
                          Suspend
                        </button>
                      )}

                      {/* Reactivate */}
                      {canReactivate(user) && (
                        <button
                          onClick={() => openReactivate(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors"
                        >
                          <ShieldOn size={11} />
                          Reactivate
                        </button>
                      )}

                      {!canResend(user) && !canSuspend(user) && !canReactivate(user) && (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Suspend Modal ───────────────────────────────────────── */}
      {suspendTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeSuspend}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <ShieldOff size={18} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Suspend User</h2>
                  <p className="text-xs text-slate-400">
                    The user will be immediately blocked from accessing the platform.
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">User</p>
                <p className="text-sm font-semibold text-slate-900">
                  {suspendTarget.displayName ?? suspendTarget.email}
                </p>
                <p className="text-xs text-slate-500">{suspendTarget.email}</p>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Reason <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="e.g. Violation of terms of service"
                />
              </div>

              {suspendError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {suspendError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSuspendPending}
                  onClick={handleSuspendConfirm}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSuspendPending ? "Suspending…" : "Confirm Suspend"}
                </button>
                <button
                  type="button"
                  onClick={closeSuspend}
                  disabled={isSuspendPending}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reactivate Modal ────────────────────────────────────── */}
      {reactivateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeReactivate}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <ShieldOn size={18} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Reactivate User</h2>
                  <p className="text-xs text-slate-400">
                    The user will regain full access to the platform immediately.
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">User</p>
                <p className="text-sm font-semibold text-slate-900">
                  {reactivateTarget.displayName ?? reactivateTarget.email}
                </p>
                <p className="text-xs text-slate-500">{reactivateTarget.email}</p>
                {reactivateTarget.suspensionReason && (
                  <p className="text-xs text-slate-400">Reason: {reactivateTarget.suspensionReason}</p>
                )}
              </div>

              {reactivateError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {reactivateError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isReactivatePending}
                  onClick={handleReactivateConfirm}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isReactivatePending ? "Reactivating…" : "Confirm Reactivate"}
                </button>
                <button
                  type="button"
                  onClick={closeReactivate}
                  disabled={isReactivatePending}
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
