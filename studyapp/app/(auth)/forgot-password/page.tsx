"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Loader2, Mail, KeyRound, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";

const COPY = {
    en: {
        title: "Forgot password?",
        sub: "Enter your email and we'll send you a verification code.",
        email: "Email",
        emailPh: "you@student.edu",
        send: "Send code",
        codeTitle: "Enter the code",
        codeSub: "We sent a code to",
        code: "Code",
        newPassword: "New password",
        update: "Update password",
        resend: "Send a new code",
        changeEmail: "Use a different email",
        back: "Back to sign in",
        badCode: "Invalid or expired code. Please try again.",
        short: "Password must be at least 6 characters.",
        sent: "Code sent. Check your inbox and spam folder.",
    },
    ar: {
        title: "نسيت كلمة المرور؟",
        sub: "أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق.",
        email: "البريد الإلكتروني",
        emailPh: "you@student.edu",
        send: "إرسال الرمز",
        codeTitle: "أدخل الرمز",
        codeSub: "أرسلنا رمزاً إلى",
        code: "الرمز",
        newPassword: "كلمة المرور الجديدة",
        update: "تحديث كلمة المرور",
        resend: "إرسال رمز جديد",
        changeEmail: "استخدام بريد إلكتروني آخر",
        back: "العودة لتسجيل الدخول",
        badCode: "الرمز غير صحيح أو منتهي الصلاحية. حاول مجدداً.",
        short: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
        sent: "تم إرسال الرمز. تحقق من بريدك الوارد والبريد غير المرغوب فيه.",
    },
    fr: {
        title: "Mot de passe oublié ?",
        sub: "Saisissez votre e-mail et nous vous enverrons un code de vérification.",
        email: "E-mail",
        emailPh: "you@student.edu",
        send: "Envoyer le code",
        codeTitle: "Saisissez le code",
        codeSub: "Nous avons envoyé un code à",
        code: "Code",
        newPassword: "Nouveau mot de passe",
        update: "Mettre à jour le mot de passe",
        resend: "Envoyer un nouveau code",
        changeEmail: "Utiliser une autre adresse e-mail",
        back: "Retour à la connexion",
        badCode: "Code invalide ou expiré. Veuillez réessayer.",
        short: "Le mot de passe doit contenir au moins 6 caractères.",
        sent: "Code envoyé. Vérifiez votre boîte de réception et vos spams.",
    },
};

export default function ForgotPasswordPage() {
    const { language, isRTL } = useLanguage();
    const c = COPY[language];

    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const sendEmail = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError("");
        setInfo("");
        const supabase = createClient();
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        setLoading(false);
        if (err) {
            setError(err.message);
            return;
        }
        setStep("code");
        setInfo(c.sent);
    };

    const confirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) {
            setError(c.short);
            return;
        }
        setLoading(true);
        const supabase = createClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code.trim(),
            type: "recovery",
        });
        if (verifyError) {
            setLoading(false);
            setError(c.badCode);
            return;
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setLoading(false);
            setError(updateError.message);
            return;
        }
        window.location.href = "/dashboard";
    };

    const errorBox = error ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
        </p>
    ) : null;

    return (
        <div dir={isRTL ? "rtl" : "ltr"} className="space-y-8">
            {step === "email" ? (
                <>
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-semibold tracking-tight">{c.title}</h1>
                        <p className="text-sm text-muted-foreground">{c.sub}</p>
                    </div>

                    <form onSubmit={sendEmail} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">{c.email}</label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={c.emailPh}
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    className="ps-10"
                                    required
                                />
                            </div>
                            {errorBox}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight />{c.send}</>}
                        </Button>
                    </form>
                </>
            ) : (
                <>
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-semibold tracking-tight">{c.codeTitle}</h1>
                        <p className="text-sm text-muted-foreground">
                            {c.codeSub} <span className="font-medium text-foreground">{email}</span>
                        </p>
                        {info && <p className="text-xs text-muted-foreground/80">{info}</p>}
                    </div>

                    <form onSubmit={confirm} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="code" className="text-sm font-medium">{c.code}</label>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="••••••"
                                    value={code}
                                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                                    className="ps-10 font-mono tracking-widest"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="new-password" className="text-sm font-medium">{c.newPassword}</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="new-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    className="ps-10"
                                    required
                                />
                            </div>
                            {errorBox}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
                            {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight />{c.update}</>}
                        </Button>
                    </form>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => sendEmail()}
                            disabled={loading}
                            className="text-start text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {c.resend}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setStep("email"); setCode(""); setError(""); setInfo(""); }}
                            className="text-start text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {c.changeEmail}
                        </button>
                    </div>
                </>
            )}

            <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {c.back}
            </Link>
        </div>
    );
}