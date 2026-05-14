import { ThemeSwitcher } from "./theme-switcher";

export function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center text-center gap-2 py-4  bg-white rounded-t-5xl border border-foreground border-b-0">
      <h3 className="text-h2">DMAI (Digital Mindful Autogenic Intervention)</h3>
      <ThemeSwitcher />
    </footer>
  )
}