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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function ProtectedNavbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(getGreeting());
  const [greetingVisible, setGreetingVisible] = useState(false);
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

  const logout = async () => {
    sessionStorage.removeItem("user_full_name");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    // id="navbar-app" is used by globals.css to hide during exercise fullscreen
    <nav
      id="navbar-app"
      className="fixed top-0 left-0 right-0 z-40 flex justify-center md:px-16 px-6 lg:max-w-7xl mx-auto"
    >
      <div className="w-full flex justify-between items-center bg-white md:rounded-b-5xl rounded-b-xl xs:p-6 p-4 border border-foreground border-t-0">
        <Link
          href={'/homepage'}
          className="text-app-name hover:font-bold font-semibold"
        >
          DMAI
        </Link>

        <div className="flex gap-3 items-center">
          <p
            className="text-md font-medium text-foreground transition-opacity duration-500 sm:block hidden"
            style={{ opacity: greetingVisible && userName ? 1 : 0 }}
          >
            {greeting}, <span>{userName}</span>!
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'ghost'} className="rounded-sm px-2 py-1 [&_svg]:size-5 hover:bg-background transition-all hover:border hover:border-foreground">
                <ListIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="sm:w-44 w-fit bg-background">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="sm:hidden block">
                  <p
                    className="sm:text-p/5 text-sm/4 font-medium text-muted-foreground transition-opacity duration-500 max-w-44 line-clamp-2"
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
                <DropdownMenuItem className="[&_svg]:size-4">
                  <Link href="/history" className="flex gap-2 items-center cursor-pointer">
                    <ClockCounterClockwiseIcon />
                    Riwayat Sesi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="[&_svg]:size-4 flex items-center gap-2 w-full rounded-md text-destructive hover:bg-destructive/70 hover:cursor-pointer hover:text-background"
                >
                  <SignOutIcon />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}