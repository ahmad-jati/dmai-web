'use client'

import { Button } from "../ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListIcon, HouseIcon, SignOutIcon, ClockCounterClockwiseIcon} from "@phosphor-icons/react";
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
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.full_name ?? null);
    };
    getUser();

    // Update greeting every minute in case user keeps tab open across time boundaries
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="w-full flex justify-between items-center py-4 px-8 bg-white rounded-b-5xl border border-foreground border-t-0">
      <Link
        href={'/homepage'}
        className="text-app-name hover:font-bold font-semibold"
      >
        DMAI
      </Link>

      <div className="flex gap-3 items-center">
        {userName && (
          <p className="text-md font-medium text-foreground">
            {greeting}, <span className="">{userName}</span>!
          </p>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-sm p-2">
              <ListIcon className="w-7 h-7" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-background">
            <DropdownMenuItem asChild>
              <Link href="/homepage" className="flex gap-2 items-center cursor-pointer">
                <HouseIcon className="w-4 h-4" />
                Homepage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/history" className="flex gap-2 items-center cursor-pointer">
                <ClockCounterClockwiseIcon className="w-4 h-4" />
                Riwayat Sesi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="[&_svg]:size-4 flex items-center gap-2 w-full rounded-md border-2 border-destructive/20 text-destructive hover:bg-destructive/30 hover:cursor-pointer bg-destructive/20"
            >
              <SignOutIcon className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}