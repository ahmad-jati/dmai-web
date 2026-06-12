import { SpinnerIcon} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

// ─── Base Spinner ─────────────────────────────────────────────────────────────
// Thin wrapper around the shadcn Spinner (which itself uses @phosphor-icons).
// Re-exported here so the rest of the app imports from one place.

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <SpinnerIcon
      role="status"
      aria-label="Loading"
      className={cn("text-background size-5 animate-spin", className)}
      {...props}
    />
  )
}

// ─── Sized variant ────────────────────────────────────────────────────────────

type SpinnerSizedProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
}

function SpinnerSized({ size = "md", className }: SpinnerSizedProps) {
  return (
    <Spinner className={cn("text-muted-foreground", sizeMap[size], className)} />
  )
}

// ─── Section-level spinner ────────────────────────────────────────────────────

function PageSpinner({ text = "Memuat..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-60">
      <SpinnerSized size="lg" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

// ─── Full-page spinner (auth checks, hard redirects) ─────────────────────────

function FullPageSpinner({ text }: { text?: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-background">
      <SpinnerSized size="lg" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export { Spinner, SpinnerSized, PageSpinner, FullPageSpinner }