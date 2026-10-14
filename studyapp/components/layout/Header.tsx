"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Menu } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { FeedbackButton } from "@/components/layout/FeedbackButton";
import { useLanguage } from "@/components/providers/LanguageContext";
import type { Profile } from "@/types";

interface HeaderProps {
  profile: Profile | null;
  onMenuToggle?: () => void;
}

export function Header({ profile, onMenuToggle }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, language, isRTL } = useLanguage();

  // next-themes resolves the theme (from localStorage) only after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greeting_morning");
    if (hour < 18) return t("greeting_afternoon");
    return t("greeting_evening");
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenuToggle}>
          <Menu className="w-4 h-4" />
        </Button>

        <div dir={isRTL ? "rtl" : "ltr"}>
          <p className="text-sm text-muted-foreground">
            {getGreeting()}{profile?.full_name ? `، ${profile.full_name.split(" ")[0]}` : ""}
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
        <FeedbackButton />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => mounted && setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="w-4 h-4 dark:hidden" />
          <Moon className="hidden w-4 h-4 dark:block" />
        </Button>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/nahda_edu_dz?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==&igsi=ZDNlZDc0MzIxNw=="
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="@nahda_edu_dz on Instagram"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="currentColor"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
      </div>
    </header>
  );
}