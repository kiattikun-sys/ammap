import { Bell, User } from "lucide-react";

interface ProjectHeaderProps {
  projectId: string;
  title?: string;
  children?: React.ReactNode;
}

export function ProjectHeader({ projectId: _projectId, title, children }: ProjectHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
          aria-label="User menu"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
