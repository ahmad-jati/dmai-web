import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function Section({ children, className }: SectionProps) {
  return (
    <section
      className={cn(
        "w-full md:rounded-5xl rounded-3xl border border-foreground md:p-8 p-6",
        className
      )}
    >
      {children}
    </section>
  );
}