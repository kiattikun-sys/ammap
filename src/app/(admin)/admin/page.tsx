import { requirePlatformAdminPage } from "@/lib/platform/assert-platform-admin";
import { getAdminOverviewStats } from "@/domains/platform/queries/get-admin-overview-stats";
import {
  ClipboardList,
  Users,
  Building2,
  ShieldCheck,
  MailOpen,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: "default" | "yellow" | "blue" | "green" | "red";
  note?: string;
}

function StatCard({ label, value, icon, accent = "default", note }: StatCardProps) {
  const accentMap = {
    default: "bg-slate-100 text-slate-500",
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${accentMap[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const ctx = await requirePlatformAdminPage();
  const stats = await getAdminOverviewStats();

  const isPlatformOwner = ctx.role === "platform_owner";

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            {isPlatformOwner ? "Platform Owner" : "Platform Admin"}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-level summary. All figures are live counts from the database.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-10">
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={<ClipboardList size={18} />}
          accent={stats.pendingRequests > 0 ? "yellow" : "default"}
          note={stats.pendingRequests > 0 ? "Needs review" : "All clear"}
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<Users size={18} />}
          accent="blue"
        />
        <StatCard
          label="Organizations"
          value={stats.totalOrganizations}
          icon={<Building2 size={18} />}
          accent="green"
        />
        <StatCard
          label="Invited / Pending Activation"
          value={stats.invitedNotActivated}
          icon={<MailOpen size={18} />}
          accent={stats.invitedNotActivated > 0 ? "yellow" : "default"}
          note="approved + invited states"
        />
        <StatCard
          label="Platform Admins"
          value={stats.totalPlatformAdmins}
          icon={<ShieldCheck size={18} />}
          accent="default"
        />
      </div>

      {/* Quick links */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/admin/requests?status=pending"
            title="Review Pending Requests"
            description={`${stats.pendingRequests} request${stats.pendingRequests !== 1 ? "s" : ""} awaiting review`}
            urgent={stats.pendingRequests > 0}
          />
          <QuickLink
            href="/admin/users"
            title="Inspect Users"
            description={`${stats.totalUsers} registered user${stats.totalUsers !== 1 ? "s" : ""} on the platform`}
          />
          <QuickLink
            href="/admin/organizations"
            title="Inspect Organizations"
            description={`${stats.totalOrganizations} organization${stats.totalOrganizations !== 1 ? "s" : ""} active`}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickLinkProps {
  href: string;
  title: string;
  description: string;
  urgent?: boolean;
}

function QuickLink({ href, title, description, urgent }: QuickLinkProps) {
  return (
    <a
      href={href}
      className={`block rounded-xl border p-4 transition-colors hover:bg-slate-50 ${
        urgent ? "border-yellow-300 bg-yellow-50 hover:bg-yellow-100" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-sm font-semibold ${urgent ? "text-yellow-800" : "text-slate-800"}`}>
        {title}
      </p>
      <p className={`mt-0.5 text-xs ${urgent ? "text-yellow-600" : "text-slate-400"}`}>
        {description}
      </p>
    </a>
  );
}
