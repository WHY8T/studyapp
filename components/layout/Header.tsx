"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell, Menu } from "lucide-react";
import { getGreeting } from "@/lib/utils";
import type { Profile } from "@/types";

interface HeaderProps {
  profile: Profile | null;
  onMenuToggle?: () => void;
}

export function Header({ profile, onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div>
          <p className="font-display font-bold text-sm">
            {getGreeting()}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            {" "}👋
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-lime" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
