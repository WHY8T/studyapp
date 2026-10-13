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

function detectLang(): Lang {
    if (typeof navigator === "undefined") return "fr";
    const l = navigator.language?.toLowerCase() ?? "";
    if (l.startsWith("ar")) return "ar";
    if (l.startsWith("fr")) return "fr";
    return "fr";
}

export default function CalculatorPage() {
    const [lang, setLang] = useState<Lang>(detectLang);
    const [mode, setMode] = useState<Mode>("grandes");
    const t = translations[lang];
    const isRTL = lang === "ar";

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-primary text-xs font-medium mb-3 font-mono tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    CALCULATOR
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                    {t.title}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                    {(["grandes", "university"] as Mode[]).map((m) => (
                        <button key={m} onClick={() => setMode(m)}
                            className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${mode === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                            {m === "grandes" ? t.modeGrandes : t.modeUniversity}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {(["ar", "fr", "en"] as Lang[]).map((l) => (
                        <button key={l} onClick={() => setLang(l)}
                            className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition-colors ${lang === l ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-px bg-border" />
                <span>{mode === "grandes" ? t.grandesDesc : t.universityDesc}</span>
            </div>

            {mode === "grandes" ? (
                <GrandesEcolesCalculator lang={lang} isRTL={isRTL} />
            ) : (
                <UniversityCalculator lang={lang} isRTL={isRTL} />
            )}
        </div>
    );
}