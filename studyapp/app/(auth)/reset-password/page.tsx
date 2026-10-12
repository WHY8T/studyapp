"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useLanguage } from "@/components/providers/LanguageContext";
import { cn } from "@/lib/utils";
import { Loader2, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError(t("auth_password_mismatch"));
            return;
        }
        if (password.length < 6) {
            setError(t("auth_password_short"));
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setDone(true);
        setLoading(false);
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
    };

    if (done) {
        return (
            <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{t("auth_reset_done_title")}</p>
                        <p className="text-sm text-muted-foreground">{t("auth_reset_redirect")}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                    {t("auth_reset_title")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("auth_reset_sub")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("auth_new_password")}</label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <PasswordInput
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                            className="ps-10"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("auth_confirm_password")}</label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <PasswordInput
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                            className={cn(
                                "ps-10",
                                error && "border-destructive focus-visible:ring-destructive"
                            )}
                            required
                        />
                    </div>
                    {error && (
                        <p className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                        ? <Loader2 className="animate-spin" />
                        : <><ArrowRight />{t("auth_reset_update")}</>
                    }
                </Button>
            </form>
        </div>
    );
}
