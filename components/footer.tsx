import { ThemeSwitcher } from "./theme-switcher";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  return (
    <footer id="footer-app" className=" z-40 w-full  bg-white dark:bg-secondary text-foreground md:rounded-t-5xl rounded-t-xl border border-foreground border-b-0">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 px-6 py-6 md:px-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5 max-w-md">
          <h5 className="sm:text-h2/7 xs:text-xl/5.5 text-lg/5 font-semibold">
            Digital Mindful Autogenic Intervention
          </h5>

          <p className="text-sm/5 font-medium text-muted-foreground">
            Platform digital pendamping kesehatan mental siswa SMA yang memadukan
            mindfulness dan relaksasi autogenik untuk membantu kelola stres dan
            optimalkan performa belajar.
          </p>

          <Link
            href="/tentang"
            className="mt-0.5 text-sm font-medium text-foreground hover:underline underline-offset-2 flex gap-1 items-center"
          >
            Selengkapnya tentang DMAI 
            <ArrowRightIcon/>
          </Link>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex-1">
            <ThemeSwitcher />
          </div>

          
        </div>
      </div>

      <div className="border-t border-t-muted-foreground/20 py-4 text-center">
        <p className="sm:text-p/5 text-sm/4 font-medium text-muted-foreground">
         DMAI &copy; 2026
        </p>
      </div>
    </footer>
  )
}