"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!open) return null;

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/payment/checkout", { method: "POST" });
            const data = await res.json();
            if (data.checkout_url) {
                router.push(data.checkout_url); // redirect to Chargily payment page
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🚀</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Upgrade to Pro
                    </h2>
                    <p className="text-muted-foreground">
                        You've used all 10 free quizzes this month. Upgrade for unlimited AI quiz generation.
                    </p>
                </div>

                <div className="bg-primary/10 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">Pro Plan</span>
                        <span className="text-2xl font-bold text-primary">500 DZD/mo</span>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {[
                            "✅ Unlimited quiz generation",
                            "✅ PDF uploads up to 10MB",
                            "✅ All question types",
                            "✅ Pay with EDAHABIA or CIB",
                        ].map((f) => (
                            <li key={f}>{f}</li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? "Redirecting…" : "Pay with Chargily →"}
                </button>

                <button
                    onClick={onClose}
                    className="w-full mt-3 text-muted-foreground text-sm hover:text-foreground transition"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}