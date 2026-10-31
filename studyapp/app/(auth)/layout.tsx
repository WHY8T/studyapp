"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Timer, Brain, Users } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageContext";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
        N
      </span>
      <span className="font-display text-base font-semibold tracking-tight">
        Nahda.Edu
      </span>
    </Link>
  );
}

const FEATURES = [
  { icon: Timer, title: "feat_pomodoro_title", desc: "feat_pomodoro_desc" },
  { icon: Brain, title: "feat_quiz_title", desc: "feat_quiz_desc" },
  { icon: Users, title: "feat_social_title", desc: "feat_social_desc" },
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, isRTL } = useLanguage();
  const [isApp, setIsApp] = useState<boolean | null>(null);
  useEffect(() => {
    setIsApp(navigator.userAgent.includes("NahdaApp"));
  }, []);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Branding panel */}
        <aside className="hidden flex-col justify-between border-e border-border/60 bg-muted/30 p-10 lg:flex">
          <Logo />

          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-primary">
                {t("sidebar_tagline")}
              </p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
                {t("hero_title_1")}{" "}
                <span className="text-primary">{t("hero_title_2")}</span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t("hero_desc")}
              </p>
            </div>

            <div className="space-y-5">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <feature.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t(feature.title)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t(feature.desc)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground/70">{t("footer_copy")}</p>
        </aside>

        {/* Form column */}
        <main className="flex min-h-screen flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border/60 px-4 sm:px-6 lg:justify-end lg:border-b-0 lg:px-10">
            <div className="lg:hidden">
              <Logo />
            </div>
            {isApp === false && <LanguageSwitcher variant="dark" />}
          </header>

          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <footer className="flex items-center justify-center border-t border-border/60 px-4 py-4">
            <Link
              href="/"
              className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {t("auth_back_home")}
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
