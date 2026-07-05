"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LaptopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function getScrollbarWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      const scrollbarWidth = getScrollbarWidth();
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
  }, [dropdownOpen]);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 12;

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={"sm"} className="
          text-foreground hover:bg-background hover:border hover:border-foreground 
          dark:text-secondary-foreground  
          p-4
        ">
          {theme === "light" ? (
            <div className="flex gap-2 items-center">
              <p className="sm:text-p/5 xs:text-sm/4 text-xs/3 font-medium ">Theme: </p>
              <SunIcon
                key="light"
                size={ICON_SIZE}
                // className={" size-50"}
                // weight="fill"
                />
              <p className="sm:text-p/5 xs:text-sm/4 text-xs/3 font-medium ">Light</p>
            </div>
          ) : theme === "dark" ? (
            <div className="flex gap-2 items-center ">
              <p className="sm:text-p/5 xs:text-sm/4 text-xs/3 font-medium ">Theme: </p>
              <MoonIcon
                key="dark"
                size={ICON_SIZE}
                className={""}
                // weight="fill"
              />
              <p className="sm:text-p/5 xs:text-sm/4 text-xs/3 font-medium ">Dark</p>
            </div>
          ) : (
            <div className="flex gap-2 items-center ">
              <p className="sm:text-p/5 xs:text-sm/4 text-xs/3 font-medium ">Theme: </p>
              <LaptopIcon
                key="system"
                size={ICON_SIZE}
                className={""}
                // weight="fill"
                />
              <p className="sm:text-p/5 xs:text-sm/4 text-xs/3 font-medium ">System</p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <SunIcon size={ICON_SIZE} className="" />{" "}
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <MoonIcon size={ICON_SIZE} className="" />{" "}
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <LaptopIcon size={ICON_SIZE} className="" />{" "}
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
