"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageContext";
import { cn } from "@/lib/utils";
import { Loader2, Mail, Lock, ArrowRight, AlertCircle, Zap } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "confirmation_failed") {
      toast({
        title: t("auth_confirmation_failed"),
        description: t("auth_confirmation_failed_desc"),
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setPasswordError(t("auth_error_credentials"));
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("auth_login_title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth_login_sub")}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
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
              onChange={(e) => {
                setEmail(e.target.value);
                setPasswordError("");
              }}
              className="ps-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              {t("auth_password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("auth_forgot")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              className={cn(
                "ps-10",
                passwordError && "border-destructive focus-visible:ring-destructive"
              )}
              required
            />
          </div>
          {passwordError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {passwordError}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {t("sign_in")}
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth_no_account")}{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {t("auth_create_btn")}
        </Link>
      </p>

      <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t("auth_xp_login")}</span>{" "}
          {t("auth_xp_login_desc")}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
