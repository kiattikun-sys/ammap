"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Hammer,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    title: "Projects",
    items: [
      { label: "All Projects", href: "/projects", icon: <FolderOpen size={16} /> },
    ],
  },
  {
    title: "Executive",
    items: [
      { label: "Dashboard", href: "/executive/dashboard", icon: <BarChart3 size={16} /> },
    ],
  },
  {
    title: "Field",
    items: [
      { label: "Dashboard", href: "/field/dashboard", icon: <Hammer size={16} /> },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: <ShieldCheck size={16} /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar-bg text-sidebar-text">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
          AM
        </div>
        <span className="text-sm font-semibold text-sidebar-text-active">ammap</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/60">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active",
                    isActive
                      ? "bg-sidebar-active text-sidebar-text-active"
                      : "text-sidebar-text"
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
