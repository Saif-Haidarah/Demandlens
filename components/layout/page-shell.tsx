import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn("flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8", className)}>
      <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in">
        {children}
      </div>
    </main>
  );
}
