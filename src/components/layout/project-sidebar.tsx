"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Layers,
  FileText,
  Wrench,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Camera,
  BrainCircuit,
  BarChart2,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface ProjectSidebarProps {
  projectId: string;
}

interface NavItem {
  label: string;
  href: Route;
  icon: React.ReactNode;
}

function buildNavItems(projectId: string): NavItem[] {
  const base = `/projects/${projectId}`;

  return [
    {
      label: "Overview",
      href: `${base}/overview` as Route,
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: "Map",
      href: `${base}/map` as Route,
      icon: <Map size={16} />,
    },
    {
      label: "Spatial",
      href: `${base}/spatial` as Route,
      icon: <Layers size={16} />,
    },
    {
      label: "Documents",
      href: `${base}/documents` as Route,
      icon: <FileText size={16} />,
    },
    {
      label: "Work",
      href: `${base}/work` as Route,
      icon: <Wrench size={16} />,
    },
    {
      label: "Progress",
      href: `${base}/progress` as Route,
      icon: <TrendingUp size={16} />,
    },
    {
      label: "Quality",
      href: `${base}/quality` as Route,
      icon: <ClipboardCheck size={16} />,
    },
    {
      label: "Defects",
      href: `${base}/defects` as Route,
      icon: <AlertTriangle size={16} />,
    },
    {
      label: "Evidence",
      href: `${base}/evidence` as Route,
      icon: <Camera size={16} />,
    },
    {
      label: "AI",
      href: `${base}/ai` as Route,
      icon: <BrainCircuit size={16} />,
    },
    {
      label: "Reports",
      href: `${base}/reports` as Route,
      icon: <BarChart2 size={16} />,
    },
    {
      label: "Settings",
      href: `${base}/settings` as Route,
      icon: <Settings size={16} />,
    },
  ];
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname();
  const navItems = buildNavItems(projectId);

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
        <Link
          href={"/dashboard" as Route}
          className="flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={14} />
          <span className="text-xs text-slate-400">Back</span>
        </Link>
      </div>

      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Project
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
          {projectId}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-slate-50 hover:text-slate-900",
                isActive
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-slate-600"
              )}
            >
              <span className={cn(isActive ? "text-blue-600" : "text-slate-400")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}