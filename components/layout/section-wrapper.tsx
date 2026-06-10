import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function Section({ children, className }: SectionProps) {
  return (
    <section
      className={cn(
        "w-full md:rounded-5xl rounded-xl border border-foreground md:p-8 xs:p-6 p-4",
        className
      )}
    >
      {children}
    </section>
  );
}