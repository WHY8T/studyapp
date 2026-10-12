"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/providers/LanguageContext";
import { cn } from "@/lib/utils";
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setSent(true);
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            {!sent ? (
                <>
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-semibold tracking-tight">
                            {t("auth_forgot")}
                        </h1>
                        <p className="text-sm text-muted-foreground">{t("auth_forgot_sub")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("auth_email")}</label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder={t("auth_email_ph")}
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
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
                                : <><ArrowRight />{t("auth_forgot_send")}</>
                            }
                        </Button>
                    </form>

                    <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        {t("auth_back_login")}
                    </Link>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-semibold tracking-tight">
                            {t("auth_check_inbox")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t("auth_reset_sent_to")}{" "}
                            <span className="font-medium text-foreground">{email}</span>
                        </p>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{t("auth_reset_email_sent")}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("auth_reset_email_note")}
                            </p>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                        {t("auth_forgot_try_other")}
                    </Button>

                    <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        {t("auth_back_login")}
                    </Link>
                </div>
            )}
        </div>
    );
}
