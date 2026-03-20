"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  ShieldCheck,
  ScrollText,
  Activity,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const PRIMARY_NAV: AdminNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Requests",
    href: "/admin/requests",
    icon: <ClipboardList size={16} />,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users size={16} />,
  },
  {
    label: "Organizations",
    href: "/admin/organizations",
    icon: <Building2 size={16} />,
  },
  {
    label: "Platform Admins",
    href: "/admin/platform-admins",
    icon: <ShieldCheck size={16} />,
  },
];

const SECONDARY_NAV: AdminNavItem[] = [
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: <ScrollText size={16} />,
    disabled: true,
  },
  {
    label: "System Health",
    href: "/admin/system-health",
    icon: <Activity size={16} />,
    disabled: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-full w-56 flex-col bg-slate-900 text-slate-300 flex-shrink-0">
      {/* Wordmark */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-700/60 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-xs font-bold text-white select-none">
          A
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-none">Admin Console</p>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Platform Governance</p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Operations
        </p>
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <span className={cn(active ? "text-white" : "text-slate-500")}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={13} className="text-slate-400" />}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            System
          </p>
          {SECONDARY_NAV.map((item) => (
            <span
              key={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 cursor-not-allowed select-none"
              title="Coming soon"
            >
              <span className="text-slate-700">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-[10px] text-slate-700 bg-slate-800 px-1.5 py-0.5 rounded">
                soon
              </span>
            </span>
          ))}
        </div>
      </nav>

      {/* Back to product */}
      <div className="border-t border-slate-700/60 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <ExternalLink size={13} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
