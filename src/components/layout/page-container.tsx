import { cn } from "@/lib/cn";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function PageContainer({ children, className, padded = true }: PageContainerProps) {
  return (
    <main
      className={cn(
        "flex-1 bg-slate-50",
        padded ? "overflow-y-auto p-6" : "overflow-hidden h-full",
        className
      )}
    >
      {children}
    </main>
  );
}
