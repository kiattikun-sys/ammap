"use client";

import { useState, useTransition } from "react";
import {
  addOrgMemberByEmail,
  updateOrgMemberRole,
  removeOrgMember,
} from "@/domains/org/actions/manage-org-member";
import type { OrgMember, OrgRole } from "@/domains/org/actions/get-org-members";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_BADGE: Record<OrgRole, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-green-100 text-green-700",
  viewer: "bg-slate-100 text-slate-600",
};

const ASSIGNABLE_ROLES: OrgRole[] = ["admin", "member", "viewer"];

function Avatar({ name, email }: { name: string | null; email: string }) {
  const initials = (name ?? email).slice(0, 2).toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
      {initials}
    </div>
  );
}

interface Props {
  members: OrgMember[];
  currentUserId: string;
  currentUserRole: OrgRole;
  orgName: string;
}

export function MembersClient({ members: initialMembers, currentUserId, currentUserRole, orgName }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [isPending, startTransition] = useTransition();
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<OrgRole>("member");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(false);
    startTransition(async () => {
      try {
        await addOrgMemberByEmail(addEmail, addRole);
        setAddEmail("");
        setAddSuccess(true);
        // Reload page data via full reload
        window.location.reload();
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleRoleChange(member: OrgMember, newRole: OrgRole) {
    setActionError(null);
    startTransition(async () => {
      try {
        await updateOrgMemberRole(member.userId, newRole);
        setMembers((prev) =>
          prev.map((m) => (m.userId === member.userId ? { ...m, role: newRole } : m))
        );
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleRemove(member: OrgMember) {
    if (!confirm(`ต้องการลบ ${member.displayName ?? member.email} ออกจากองค์กร?`)) return;
    setActionError(null);
    startTransition(async () => {
      try {
        await removeOrgMember(member.userId);
        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">จัดการสมาชิก</h1>
        <p className="mt-1 text-sm text-slate-500">{orgName} · {members.length} สมาชิก</p>
      </div>

      {/* Add member form */}
      {canManage && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">เพิ่มสมาชิกใหม่</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              placeholder="อีเมลผู้ใช้งานในระบบ"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as OrgRole)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "กำลังเพิ่ม…" : "+ เพิ่มสมาชิก"}
            </button>
          </form>
          {addError && (
            <p className="mt-2 text-sm text-red-600">{addError}</p>
          )}
          {addSuccess && (
            <p className="mt-2 text-sm text-green-600">เพิ่มสมาชิกสำเร็จ</p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            ผู้ใช้งานต้องมีบัญชีในระบบก่อน หากยังไม่มีให้ขอให้ไปสมัครที่หน้า Register
          </p>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Members table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">สมาชิก</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">บทบาท</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">เข้าร่วม</th>
              {canManage && (
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => {
              const isMe = m.userId === currentUserId;
              const isOwner = m.role === "owner";
              const canEdit = canManage && !isMe && !isOwner && !(m.role === "admin" && currentUserRole !== "owner");
              return (
                <tr key={m.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.displayName} email={m.email} />
                      <div>
                        <p className="font-medium text-slate-900">
                          {m.displayName ?? "—"}
                          {isMe && <span className="ml-2 text-xs text-slate-400">(คุณ)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {canEdit ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value as OrgRole)}
                        disabled={isPending}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[m.role]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(m.joinedAt).toLocaleDateString("th-TH")}
                  </td>
                  {canManage && (
                    <td className="px-5 py-4 text-right">
                      {canEdit && (
                        <button
                          onClick={() => handleRemove(m)}
                          disabled={isPending}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
                        >
                          ลบออก
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role legend */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-slate-600">คำอธิบายบทบาท</p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {(["owner", "admin", "member", "viewer"] as OrgRole[]).map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[r]}`}>
                {ROLE_LABELS[r]}
              </span>
              <span className="text-xs text-slate-500">
                {r === "owner" && "สิทธิ์สูงสุด"}
                {r === "admin" && "จัดการได้"}
                {r === "member" && "ใช้งานทั่วไป"}
                {r === "viewer" && "ดูได้อย่างเดียว"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
