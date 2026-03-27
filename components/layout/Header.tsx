"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageContext";
import type { Profile } from "@/types";

interface HeaderProps {
  profile: Profile | null;
  onMenuToggle?: () => void;
}

export function Header({ profile, onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greeting_morning");
    if (hour < 18) return t("greeting_afternoon");
    return t("greeting_evening");
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
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
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(
              language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US",
              { weekday: "long", month: "long", day: "numeric" }
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <LanguageSwitcher />
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