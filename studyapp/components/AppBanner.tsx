"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Smartphone, Download } from "lucide-react";

export function AppBanner() {
    const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Suppress native install prompt
        const suppress = (e: Event) => e.preventDefault();
        window.addEventListener("beforeinstallprompt", suppress);

        // Clear any old dismissed keys so banner always shows fresh
        // Remove this line after confirming banner works
        localStorage.removeItem("app-banner-v3");

        const ua = navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(ua);
        const android = /android/.test(ua);
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (navigator as any).standalone === true;

        if (standalone) return; // already installed, don't show

        if (ios) setPlatform("ios");
        else if (android) setPlatform("android");

        const t = setTimeout(() => setExpanded(false), 6000);
        const onInstalled = () => { setDismissed(true); };
        window.addEventListener("appinstalled", onInstalled);

        return () => {
            clearTimeout(t);
            window.removeEventListener("appinstalled", onInstalled);
            window.removeEventListener("beforeinstallprompt", suppress);
        };
    }, []);

    useEffect(() => {
        const h = (!dismissed && platform) ? (expanded ? "60px" : "28px") : "0px";
        document.documentElement.style.setProperty("--banner-height", h);
        return () => document.documentElement.style.setProperty("--banner-height", "0px");
    }, [dismissed, platform, expanded]);

    const dismissForever = () => setDismissed(true);

    if (!platform || dismissed) return null;

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-[9999]">
                {expanded && (
                    <div className="bg-background/95 backdrop-blur border-b border-border">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-primary">
                                <img src="/icon-192x192.png" alt="Nahda" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-bold leading-tight">Nahda.Edu</p>
                                <p className="text-muted-foreground text-xs leading-tight">
                                    {platform === "ios" ? "Add to your Home Screen" : "Get the Android app — free"}
                                </p>
                            </div>
                            {platform === "ios" ? (
                                <button
                                    onClick={() => setShowIOSGuide(true)}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
                                >
                                    <Smartphone className="w-3.5 h-3.5" />
                                    Install
                                </button>
                            ) : (
                                <a
                                    href="/nahda.apk"
                                    download="nahda.apk"
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </a>
                            )}
                            <button
                                onClick={() => setExpanded(false)}
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {!expanded && (
                    <div className="relative flex justify-center">
                        <button
                            onClick={() => setExpanded(true)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-b-lg text-xs font-semibold bg-primary text-primary-foreground"
                        >
                            <Smartphone className="w-3 h-3" />
                            Get the app
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                            onClick={dismissForever}
                            className="absolute right-3 top-1 w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            <div style={{ height: expanded ? 60 : 28 }} />

            {showIOSGuide && (
                <div
                    className="fixed inset-0 z-[99999] flex items-end justify-center px-4 pb-8 bg-black/70"
                    onClick={() => setShowIOSGuide(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-foreground font-bold text-base">Add to Home Screen</p>
                            <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { step: "1", text: "Tap the Share button", sub: "↑ at the bottom of Safari" },
                                { step: "2", text: 'Tap "Add to Home Screen"', sub: "Scroll down to find it" },
                                { step: "3", text: 'Tap "Add"', sub: "Top right corner" },
                            ].map((s) => (
                                <div key={s.step} className="flex items-start gap-3">
                                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-primary">
                                        <span className="text-xs font-bold text-primary-foreground">{s.step}</span>
                                    </div>
                                    <div>
                                        <p className="text-foreground text-sm font-medium">{s.text}</p>
                                        <p className="text-muted-foreground text-xs">{s.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setShowIOSGuide(false); setExpanded(false); }}
                            className="w-full py-3 rounded-lg font-bold text-sm bg-primary text-primary-foreground"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}