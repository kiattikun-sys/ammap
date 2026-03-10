import { Bell, Search, User } from "lucide-react";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-header-border bg-header-bg px-6">
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
          aria-label="Search"
        >
          <Search size={16} />
        </button>
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
