import { ThemeSwitcher } from "./theme-switcher";

export function Footer() {
  return (
    <footer id="footer-app" className="w-full flex flex-col items-center justify-center text-center gap-2 p-6 bg-white dark:bg-secondary text-foreground md:rounded-t-5xl rounded-t-xl border border-foreground border-b-0 z-30">
      <h2 className="sm:text-h2/7 xs:text-xl/5.5 text-lg/5 font-semibold">DMAI (Digital Mindful Autogenic Intervention)</h2>
      <p className="sm:text-p/5 text-sm/4 font-medium">@2026</p>

      <div className="mt-2 flex gap-1 items-center text-muted-foreground">
        <ThemeSwitcher />
      </div>
    </footer>
  )
}