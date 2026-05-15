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
import { HamburgerIcon, HouseIcon, SignOutIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ProtectedNavbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.full_name ?? null);
    };
    getUser();
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
          <p className="text-sm font-medium text-foreground">
            Good morning, <span className="font-bold">{userName}</span>!
          </p>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <HamburgerIcon className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href="/homepage" className="flex gap-2 items-center cursor-pointer">
                <HouseIcon className="w-4 h-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="flex gap-2 items-center cursor-pointer text-red focus:text-red"
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