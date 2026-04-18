"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
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
                <div className="rounded-xl border border-lime/20 bg-lime/5 p-5 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-lime shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold">Password updated!</p>
                        <p className="text-sm text-muted-foreground">Redirecting you to dashboard…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="font-display font-black text-3xl">Set new password</h1>
                <p className="text-muted-foreground">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                            className="pl-10" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" value={confirm}
                            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                            className={`pl-10 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`} required />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight className="w-4 h-4" />Update password</>}
                </Button>
            </form>
        </div>
    );
}