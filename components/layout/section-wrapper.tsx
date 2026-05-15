import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function Section({ children, className }: SectionProps) {
  return (
    <section
      className={cn(
        "w-full rounded-5xl border border-foreground p-8",
        className
      )}
    >
      {children}
    </section>
  );
}