'use client'

import { Button } from "../ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { ListIcon, HouseIcon, SignOutIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

// Hitung lebar scrollbar sekali, reuse terus
function getScrollbarWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

export function ProtectedNavbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(getGreeting());
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();

      const cached = sessionStorage.getItem("user_full_name");
      if (cached) {
        setUserName(cached);
        requestAnimationFrame(() => setGreetingVisible(true));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const name = user?.user_metadata?.full_name ?? null;
      setUserName(name);
      if (name) sessionStorage.setItem("user_full_name", name);
      requestAnimationFrame(() => setGreetingVisible(true));
    };
    getUser();

    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Saat dropdown open/close, kompensasi scrollbar width di navbar
  // supaya tidak ikut geser waktu Radix lock body scroll
  useEffect(() => {
    const scrollbarWidth = getScrollbarWidth();

    if (dropdownOpen && scrollbarWidth > 0) {
      // Radix akan tambah padding-right ke body sebesar scrollbarWidth,
      // navbar fixed tidak kena efek itu jadi kita kompensasi manual
      document.documentElement.style.setProperty(
        "--navbar-scrollbar-offset",
        `${scrollbarWidth}px`
      );
    } else {
      document.documentElement.style.setProperty(
        "--navbar-scrollbar-offset",
        "0px"
      );
    }

    return () => {
      document.documentElement.style.setProperty(
        "--navbar-scrollbar-offset",
        "0px"
      );
    };
  }, [dropdownOpen]);

  const logout = async () => {
    sessionStorage.removeItem("user_full_name");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav
      id="navbar-app"
      className="fixed top-0 left-0 z-40"
      style={{
        width: "calc(100% - var(--navbar-scrollbar-offset, 0px))",
      }}
    >
      <div className="lg:max-w-7xl mx-auto md:px-16 px-6">
        <div className="w-full flex justify-between items-center bg-white dark:bg-secondary dark:text-secondary-foreground text-foreground md:rounded-b-5xl rounded-b-xl xs:p-6 p-4 border border-foreground border-t-0">
          <Link
            href={"/homepage"}
            className="text-app-name hover:font-bold font-semibold"
          >
            DMAI
          </Link>

          <div className="flex gap-3 items-center">
            <p
              className="text-md font-medium text-foreground dark:text-secondary-foreground transition-opacity duration-500 sm:block hidden"
              style={{ opacity: greetingVisible && userName ? 1 : 0 }}
            >
              {greeting}, <span>{userName}</span>!
            </p>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="rounded-sm px-2 py-1 [&_svg]:size-5 hover:bg-background transition-all hover:border hover:border-foreground"
                >
                  <ListIcon className="text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="sm:w-44 w-fit">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="sm:hidden block">
                    <p
                      className="sm:text-p/5 text-sm/4 font-medium text-foreground dark:text-secondary-foreground transition-opacity duration-500 max-w-44 line-clamp-2"
                      style={{ opacity: greetingVisible && userName ? 1 : 0 }}
                    >
                      {greeting}, <span>{userName}</span>!
                    </p>
                  </DropdownMenuLabel>

                  <DropdownMenuItem asChild className="[&_svg]:size-4">
                    <Link href="/homepage" className="flex gap-2 items-center cursor-pointer">
                      <HouseIcon />
                      Homepage
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="[&_svg]:size-4">
                    <Link href="/history" className="flex gap-2 items-center cursor-pointer">
                      <ClockCounterClockwiseIcon />
                      History
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="[&_svg]:size-4 flex items-center gap-2 w-full rounded-md hover:border-2 border-destructive/20 text-destructive hover:bg-destructive/20! hover:text-destructive! hover:dark:bg-destructive/20 shadow-none hover:cursor-pointer"
                  >
                    <SignOutIcon />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}