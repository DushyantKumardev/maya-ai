"use client";

import * as React from "react";
import { Moon, Sun, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/features/settings/context/SettingsContext";

export function ThemeToggle() {
  const { settings, updateInterface } = useSettings();
  const theme = settings.theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild id="theme-toggle-trigger">
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => updateInterface({ theme: "light" })}
          className="flex items-center justify-between"
        >
          <span>Light</span>
          {theme === "light" && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateInterface({ theme: "dark" })}
          className="flex items-center justify-between"
        >
          <span>Dark</span>
          {theme === "dark" && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateInterface({ theme: "system" })}
          className="flex items-center justify-between"
        >
          <span>System</span>
          {theme === "system" && <Check className="h-4 w-4 ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
