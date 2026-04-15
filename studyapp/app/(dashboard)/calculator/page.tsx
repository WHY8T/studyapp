"use client";

import { useState } from "react";
import GrandesEcolesCalculator from "@/components/calculator/GrandesEcolesCalculator";
import UniversityCalculator from "@/components/calculator/UniversityCalculator";

const translations = {
    ar: {
        title: "حاسبة المعدل",
        subtitle: "احسب معدلك بدقة — للمدارس العليا والجامعات",
        modeGrandes: "المدارس العليا",
        modeUniversity: "الجامعة العامة",
        grandesDesc: "معاملات ومواد محددة مسبقاً للمدارس العليا",
        universityDesc: "أضف موادك ومعاملاتك بحرية",
    },
    fr: {
        title: "Calculateur de Moyenne",
        subtitle: "Calculez votre moyenne avec précision",
        modeGrandes: "Grandes Écoles",
        modeUniversity: "Université Générale",
        grandesDesc: "Matières et coefficients officiels des grandes écoles",
        universityDesc: "Ajoutez librement vos modules et coefficients",
    },
    en: {
        title: "GPA Calculator",
        subtitle: "Calculate your average with precision",
        modeGrandes: "Grandes Écoles",
        modeUniversity: "General University",
        grandesDesc: "Pre-set subjects & coefficients for grandes écoles",
        universityDesc: "Freely add your own modules and coefficients",
    },
};

type Lang = "ar" | "fr" | "en";
type Mode = "grandes" | "university";

export default function CalculatorPage() {
    const [lang, setLang] = useState<Lang>("ar");
    const [mode, setMode] = useState<Mode>("grandes");
    const t = translations[lang];
    const isRTL = lang === "ar";

    return (
        <div
            className="min-h-screen bg-[#0a0a0f] text-white"
            dir={isRTL ? "rtl" : "ltr"}
        >
            {/* Background grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(0,183,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,183,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,183,255,0.08),transparent)] pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-[#00b7ff]/10 border border-[#00b7ff]/20 rounded-full px-4 py-1.5 text-[#00b7ff] text-sm font-medium mb-5 font-mono tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00b7ff] animate-pulse" />
                        CALCULATOR
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent mb-3">
                        {t.title}
                    </h1>
                    <p className="text-white/40 text-base">{t.subtitle}</p>
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    {/* Mode switcher */}
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                        {(["grandes", "university"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m
                                    ? "bg-[#00b7ff] text-black shadow-lg shadow-[#00b7ff]/20"
                                    : "text-white/50 hover:text-white"
                                    }`}
                            >
                                {m === "grandes" ? t.modeGrandes : t.modeUniversity}
                            </button>
                        ))}
                    </div>

                    {/* Language switcher */}
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                        {(["ar", "fr", "en"] as Lang[]).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${lang === l
                                    ? "bg-white/15 text-white"
                                    : "text-white/30 hover:text-white/60"
                                    }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode description */}
                <div className="mb-6 flex items-center gap-3 text-white/40 text-sm">
                    <div className="w-8 h-px bg-white/10" />
                    <span>
                        {mode === "grandes" ? t.grandesDesc : t.universityDesc}
                    </span>
                </div>

                {/* Calculator */}
                {mode === "grandes" ? (
                    <GrandesEcolesCalculator lang={lang} isRTL={isRTL} />
                ) : (
                    <UniversityCalculator lang={lang} isRTL={isRTL} />
                )}
            </div>
        </div>
    );
}