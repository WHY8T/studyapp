"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
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
            <div className="flex items-center gap-3 lg:hidden">
                <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center">
                    <span className="font-display font-black text-[#0D0D18] text-base">N</span>
                </div>
                <span className="font-display font-bold text-xl">Nahda.Edu</span>
            </div>

            {!sent ? (
                <>
                    <div className="space-y-2">
                        <h1 className="font-display font-black text-3xl">Forgot password?</h1>
                        <p className="text-muted-foreground">
                            No worries. Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="you@student.edu"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    className={`pl-10 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                    required
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>

                        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                            {loading
                                ? <Loader2 className="animate-spin" />
                                : <><ArrowRight className="w-4 h-4" />Send reset link</>
                            }
                        </Button>
                    </form>

                    <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-lime transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </Link>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="font-display font-black text-3xl">Check your email</h1>
                        <p className="text-muted-foreground">
                            We sent a reset link to <span className="text-foreground font-semibold">{email}</span>
                        </p>
                    </div>

                    <div className="rounded-xl border border-lime/20 bg-lime/5 p-5 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-lime shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Email sent successfully</p>
                            <p className="text-sm text-muted-foreground">
                                Click the link in the email to reset your password. Expires in 1 hour.
                            </p>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-12" onClick={() => setSent(false)}>
                        Try a different email
                    </Button>

                    <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-lime transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </Link>
                </div>
            )}
        </div>
    );
}