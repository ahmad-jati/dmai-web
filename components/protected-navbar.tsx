'use client'

import { Button } from "./ui/button";
import { Suspense } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HamburgerIcon } from "@phosphor-icons/react";
import { AuthButton } from "@/components/auth-button";


export function ProtectedNavbar(){
  return (
    <nav className="w-full flex justify-between items-center py-4 px-8 bg-white rounded-b-5xl border border-foreground border-t-0">
          <Link
            href={'/protected'}
            className="text-app-name hover:font-bold font-semibold"
          >
            DMAI
          </Link>

          <div className="flex gap-2 items-center">
            <Suspense>
              <AuthButton />
            </Suspense>

            <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={"sm"}>
          <HamburgerIcon className="w-10 h-10"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          // value={theme}
          // onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
          </div>
        </nav>
  )
}