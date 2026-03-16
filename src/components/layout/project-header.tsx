import { Bell } from "lucide-react";

interface ProjectHeaderProps {
  projectId: string;
  title?: string;
  children?: React.ReactNode;
  username?: string;
  organization?: string | null;
  initial?: string;
}

export function ProjectHeader({
  projectId: _projectId,
  title,
  children,
  username,
  organization,
  initial,
}: ProjectHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {title && (
            <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
          )}
          {username && (
            <>
              <span className="text-slate-300 text-sm">—</span>
              <span className="text-sm text-slate-600">{username}</span>
            </>
          )}
          {organization && (
            <>
              <span className="text-slate-300 text-sm">|</span>
              <span className="text-xs text-slate-400">{organization}</span>
            </>
          )}
        </div>
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
        {username ? (
          <div className="flex items-center gap-2 pl-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white select-none"
              aria-label={`Logged in as ${username}`}
            >
              {initial ?? username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700">{username}</span>
          </div>
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-400"
            aria-label="Not logged in"
          >
            <span className="text-xs">?</span>
          </div>
        )}
      </div>
    </header>
  );
}
