"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CaretDownIcon,
  LaptopIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function getScrollbarWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

const ICON_SIZE = 12;

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: SunIcon },
  { value: "dark", label: "Gelap", icon: MoonIcon },
  { value: "system", label: "Sistem", icon: LaptopIcon },
] as const;

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const scrollbarWidth = dropdownOpen ? getScrollbarWidth() : 0;
    document.documentElement.style.setProperty(
      "--navbar-scrollbar-offset",
      `${scrollbarWidth}px`
    );
  }, [dropdownOpen]);

  if (!mounted) {
    return null;
  }

  const activeOption =
    THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[2];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="flex w-32 flex-col gap-0.5 rounded-2xl">
      <p className="text-xs font-medium 2md:text-left text-center">Tema</p>

      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="flex h-auto items-center justify-between gap-2 px-4 py-2 text-foreground transition-colors dark:text-secondary-foreground [&_svg]:size-4 rounded-md border-muted-foreground bg-background hover:bg-background w-full"
          >
            <span className="flex items-center gap-2">
              <ActiveIcon size={ICON_SIZE} weight="fill"/>
              <span className="text-sm font-semibold">{activeOption.label}</span>
            </span>
            <CaretDownIcon size={6} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-content" align="start">
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} className="flex gap-2" value={value}>
                <Icon size={ICON_SIZE} />
                <span>{label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export { ThemeSwitcher };