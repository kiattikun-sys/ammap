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
        "flex-1 overflow-y-auto bg-slate-50",
        padded && "p-6",
        className
      )}
    >
      {children}
    </main>
  );
}
