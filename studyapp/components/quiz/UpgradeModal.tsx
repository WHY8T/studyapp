"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
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
            <div className="bg-card border border-border rounded-md p-8 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                    <div className="mb-3 flex justify-center"><Zap className="w-8 h-8 text-muted-foreground" /></div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        Upgrade to Pro
                    </h2>
                    <p className="text-muted-foreground">
                        You've used all 10 free quizzes this month. Upgrade for unlimited AI quiz generation.
                    </p>
                </div>

                <div className="bg-primary/10 rounded-md p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">Pro Plan</span>
                        <span className="text-2xl font-semibold text-primary">500 DZD/mo</span>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {[
                            "Unlimited quiz generation",
                            "PDF uploads up to 10MB",
                            "All question types",
                            "Pay with EDAHABIA or CIB",
                        ].map((f) => (
                            <li key={f}>{f}</li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {loading ? "Redirecting…" : "Pay with Chargily →"}
                </button>

                <button
                    onClick={onClose}
                    className="w-full mt-3 text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}