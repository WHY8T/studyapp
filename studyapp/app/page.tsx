"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageContext";
import {
  Timer, Brain, Trophy, Users, CheckSquare, Calendar,
  Zap, ArrowRight, Star, Flame, Code2,
} from "lucide-react";

export default function LandingPage() {
  const { t } = useLanguage();

  const features = [
    { icon: Timer, title: t("feat_pomodoro_title"), description: t("feat_pomodoro_desc"), color: "#00b7ff" },
    { icon: Brain, title: t("feat_quiz_title"), description: t("feat_quiz_desc"), color: "#4ECDC4" },
    { icon: Trophy, title: t("feat_gamify_title"), description: t("feat_gamify_desc"), color: "#FF6B6B" },
    { icon: Users, title: t("feat_social_title"), description: t("feat_social_desc"), color: "#FF9F43" },
    { icon: CheckSquare, title: t("feat_tasks_title"), description: t("feat_tasks_desc"), color: "#BB8FCE" },
    { icon: Calendar, title: t("feat_calendar_title"), description: t("feat_calendar_desc"), color: "#45B7D1" },
  ];

  return (
    <div className="min-h-screen bg-[#08080F] text-white overflow-hidden">
      {/* Nav */}
      <nav className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
            <span className="font-display font-black text-[#0D0D18] text-base">N</span>
          </div>
          <span className="font-display font-bold text-xl">Nahda.Edu</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dark" />
          <Link href="/login">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              {t("sign_in")}
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-lime text-[#0D0D18] hover:bg-lime-300">
              {t("get_started")}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-24 max-w-7xl mx-auto text-center">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[500px] lg:h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #00b7ff 0%, transparent 70%)" }}
        />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lime/30 bg-lime/10 text-lime text-xs sm:text-sm font-semibold">
            <Zap className="w-4 h-4" />
            {t("hero_badge")}
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-8xl leading-tight tracking-tight">
            {t("hero_title_1")}
            <br />
            <span className="text-gradient-lime">{t("hero_title_2")}</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-2">
            {t("hero_desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="xl" className="text-base shadow-xl shadow-lime/20 w-full sm:w-auto">
                {t("hero_cta")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-base w-full sm:w-auto">
                {t("sign_in")}
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4">
            <div className="flex -space-x-2">
              {["#00b7ff", "#FF6B6B", "#4ECDC4", "#FF9F43", "#BB8FCE"].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#08080F]" style={{ background: color }} />
              ))}
            </div>
            <p className="text-white/50 text-sm text-center">
              <span className="text-white font-semibold">2,400+</span> {t("hero_students")}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-lime text-lime" />)}
              <span className="text-white/50 text-sm ml-1">4.9/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 py-8 bg-white/3">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8 text-center">
          {[
            { value: "94%", label: t("stat_pass") },
            { value: "3.2h", label: t("stat_daily") },
            { value: "12K+", label: t("stat_quizzes") },
            { value: "50K+", label: t("stat_sessions") },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-lime">{s.value}</p>
              <p className="text-white/50 text-xs sm:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <p className="text-lime font-semibold text-sm uppercase tracking-widest">{t("features_label")}</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl">{t("features_title")}</h2>
          <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto">{t("features_desc")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 p-6 bg-white/3 hover:bg-white/5 transition-all group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${feature.color}15` }}>
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 max-w-3xl mx-auto text-center">
        <div className="rounded-3xl border border-lime/20 bg-lime/5 p-6 sm:p-10 lg:p-12 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-6 h-6 text-lime" />
            <span className="text-lime font-semibold">{t("cta_streak")}</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl">{t("cta_title")}</h2>
          <p className="text-white/60 leading-relaxed text-sm sm:text-base">{t("cta_desc")}</p>
          <Link href="/register">
            <Button size="xl" className="text-lg shadow-2xl shadow-lime/30">
              {t("cta_button")}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-white/40 text-sm">{t("cta_xp")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 sm:px-6 lg:px-8 py-10 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-lime flex items-center justify-center">
            <span className="font-display font-black text-[#0D0D18] text-sm">N</span>
          </div>
          <span className="font-display font-bold">Nahda.Edu</span>
        </div>
        <p className="text-white/30 text-sm">{t("footer_copy")}</p>
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
          <Code2 className="w-3.5 h-3.5 text-lime" />
          <span className="text-white/50 text-xs text-center">
            {t("footer_credit")} <span className="text-lime font-semibold">Ghoubali Abdelwaheb</span> — {t("footer_tagline")}
          </span>
        </div>
      </footer>
    </div>
  );
}