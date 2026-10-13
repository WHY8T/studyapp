"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, type TranslationKey } from "@/components/providers/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Loader2, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Zap,
} from "lucide-react";

// ─── Password strength logic ───────────────────────────────────────────────
// Score 0–4 plus the list of unmet requirements (first one is shown as a hint).
function getPasswordStrength(password: string): {
  score: number;
  tips: TranslationKey[];
} {
  if (!password) return { score: 0, tips: [] };

  let score = 0;
  const tips: TranslationKey[] = [];

  if (password.length >= 8) score++;
  else tips.push("auth_tip_length");
  if (/[A-Z]/.test(password)) score++;
  else tips.push("auth_tip_upper");
  if (/[0-9]/.test(password)) score++;
  else tips.push("auth_tip_number");
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else tips.push("auth_tip_special");

  return { score, tips };
}

const STRENGTH_LEVELS: { label: TranslationKey; bar: string; text: string }[] = [
  { label: "auth_strength_weak", bar: "bg-red-500", text: "text-red-500" },
  { label: "auth_strength_fair", bar: "bg-orange-400", text: "text-orange-400" },
  { label: "auth_strength_good", bar: "bg-yellow-400", text: "text-yellow-500" },
  { label: "auth_strength_strong", bar: "bg-green-500", text: "text-green-500" },
];

// ─── Password strength bar ─────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useLanguage();
  const { score, tips } = getPasswordStrength(password);
  if (!password) return null;

  const level = STRENGTH_LEVELS[score - 1];

  return (
    <div className="space-y-1.5 pt-1">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div key={bar} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                score >= bar && level.bar
              )}
            />
          </div>
        ))}
      </div>

      {/* Label + first missing requirement */}
      <div className="flex items-center justify-between text-xs">
        {score > 0 && (
          <span className={cn("font-medium", level.text)}>{t(level.label)}</span>
        )}
        {tips.length > 0 && (
          <span className="text-muted-foreground">
            {t("auth_missing")}: {t(tips[0])}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main register form ────────────────────────────────────────────────────
export default function RegisterPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (strength.score < 2) {
      newErrors.password = t("auth_password_weak");
    }
    if (password !== confirmPassword) {
      newErrors.confirm = t("auth_password_mismatch");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: t("auth_register_failed"),
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-muted/50">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("auth_check_inbox")}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("auth_confirm_sent")}{" "}
            <span className="font-medium text-foreground">{email}</span>.{" "}
            {t("auth_confirm_click")}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("auth_back_login")}
        </Link>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("auth_register_title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth_register_sub")}</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {/* Full name */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium">
            {t("auth_full_name")}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder={t("auth_full_name_ph")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="ps-10"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t("auth_email")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={t("auth_email_ph")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ps-10"
              required
            />
          </div>
        </div>

        {/* Password + strength bar */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {t("auth_password")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={cn(
                "ps-10",
                errors.password && "border-destructive focus-visible:ring-destructive"
              )}
              required
            />
          </div>

          <PasswordStrengthBar password={password} />

          {errors.password && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            {t("auth_confirm_password")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              className={cn(
                "ps-10",
                errors.confirm && "border-destructive focus-visible:ring-destructive"
              )}
              required
            />
          </div>
          {errors.confirm && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.confirm}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || strength.score < 1}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {t("auth_create_btn")}
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth_have_account")}{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {t("sign_in")}
        </Link>
      </p>

      <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{t("cta_xp")}</p>
      </div>
    </div>
  );
}
