"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import type { PlatformAdminEntry } from "@/domains/platform/queries/list-platform-admins";
import {
  addPlatformAdmin,
  removePlatformAdmin,
} from "@/domains/platform/actions/manage-platform-admins";

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLE_DISPLAY: Record<string, { label: string; cls: string }> = {
  platform_owner: {
    label: "Platform Owner",
    cls: "bg-red-50 text-red-700 border-red-200",
  },
  platform_admin: {
    label: "Platform Admin",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

// ── Component ────────────────────────────────────────────────────

export function PlatformAdminsClient({
  admins,
  callerRole,
  callerId,
}: {
  admins: PlatformAdminEntry[];
  callerRole: "platform_owner" | "platform_admin";
  callerId: string;
}) {
  const router = useRouter();
  const [isAddPending, startAddTransition] = useTransition();
  const [isRemovePending, startRemoveTransition] = useTransition();

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState<PlatformAdminEntry | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const isPlatformOwner = callerRole === "platform_owner";

  function openAdd() {
    setAddEmail("");
    setAddError(null);
    setShowAdd(true);
  }

  function closeAdd() {
    setShowAdd(false);
    setAddEmail("");
    setAddError(null);
  }

  function openRemove(entry: PlatformAdminEntry) {
    setRemoveTarget(entry);
    setRemoveError(null);
  }

  function closeRemove() {
    setRemoveTarget(null);
    setRemoveError(null);
  }

  function handleAdd() {
    if (!addEmail.trim()) return;
    setAddError(null);
    startAddTransition(async () => {
      try {
        await addPlatformAdmin(addEmail.trim());
        closeAdd();
        router.refresh();
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  }

  function handleRemove() {
    if (!removeTarget) return;
    setRemoveError(null);
    startRemoveTransition(async () => {
      try {
        await removePlatformAdmin(removeTarget.userId);
        closeRemove();
        router.refresh();
      } catch (err) {
        setRemoveError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Admins</h1>
          <p className="mt-1 text-sm text-slate-500">
            Users with platform-level governance access.{" "}
            {admins.length} admin{admins.length !== 1 ? "s" : ""} total.
          </p>
        </div>

        {isPlatformOwner && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <UserPlus size={15} />
            Add Admin
          </button>
        )}
      </div>

      {/* Info banner for non-owners */}
      {!isPlatformOwner && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          You can view platform admins but only the <strong>platform owner</strong> can add or remove them.
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Added</th>
              {isPlatformOwner && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((entry) => {
              const roleConfig = ROLE_DISPLAY[entry.role] ?? ROLE_DISPLAY.platform_admin;
              const isSelf = entry.userId === callerId;
              const isOwnerRow = entry.role === "platform_owner";
              const canRemove = isPlatformOwner && !isSelf && !isOwnerRow;

              return (
                <tr key={entry.userId} className={`transition-colors ${isSelf ? "bg-blue-50/40" : "hover:bg-slate-50"}`}>
                  {/* Admin identity */}
                  <td className="px-4 py-3 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 select-none flex-shrink-0">
                        {(entry.displayName ?? entry.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {entry.displayName ?? <span className="text-slate-400 italic">No display name</span>}
                          </p>
                          {isSelf && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleConfig.cls}`}>
                      <ShieldCheck size={11} />
                      {roleConfig.label}
                    </span>
                  </td>

                  {/* Added date */}
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </td>

                  {/* Actions — owner only */}
                  {isPlatformOwner && (
                    <td className="px-4 py-3">
                      {canRemove ? (
                        <button
                          onClick={() => openRemove(entry)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add admin modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeAdd}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <UserPlus size={18} className="text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add Platform Admin</h2>
                  <p className="text-xs text-slate-400">
                    The user must already have an account on the platform.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>

              {addError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {addError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isAddPending || !addEmail.trim()}
                  onClick={handleAdd}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {isAddPending ? "Adding…" : "Add as Platform Admin"}
                </button>
                <button
                  type="button"
                  onClick={closeAdd}
                  disabled={isAddPending}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation modal */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeRemove}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Remove Platform Admin</h2>
                  <p className="text-xs text-slate-400">
                    This will revoke their platform admin access immediately.
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin to remove</p>
                <p className="text-sm font-semibold text-slate-900">
                  {removeTarget.displayName ?? removeTarget.email}
                </p>
                <p className="text-xs text-slate-500">{removeTarget.email}</p>
              </div>

              {removeError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {removeError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isRemovePending}
                  onClick={handleRemove}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isRemovePending ? "Removing…" : "Confirm Remove"}
                </button>
                <button
                  type="button"
                  onClick={closeRemove}
                  disabled={isRemovePending}
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
