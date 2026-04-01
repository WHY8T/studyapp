"use client";

import { useState, useCallback } from "react";
import { Download, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

type Subject = {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    coef: number;
    hasTD: boolean;
};

type SchoolYear = {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    subjects: Subject[];
};

type School = {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    acronym: string;
    color: string;
    years: SchoolYear[];
};

const SCHOOLS: School[] = [
    {
        id: "esc",
        nameAr: "المدرسة العليا للتجارة",
        nameFr: "École Supérieure de Commerce",
        nameEn: "Higher School of Commerce",
        acronym: "ESC",
        color: "#3b82f6",
        years: [
            {
                id: "y1",
                nameAr: "السنة الأولى تحضيري",
                nameFr: "1ère année prépa",
                nameEn: "1st Preparatory Year",
                subjects: [
                    { id: "math1", nameAr: "رياضيات 1", nameFr: "Mathématiques 1", nameEn: "Mathematics 1", coef: 4, hasTD: true },
                    { id: "stat1", nameAr: "إحصاء 1", nameFr: "Statistiques 1", nameEn: "Statistics 1", coef: 3, hasTD: true },
                    { id: "compta", nameAr: "محاسبة عامة", nameFr: "Comptabilité générale", nameEn: "General Accounting", coef: 3, hasTD: true },
                    { id: "eco1", nameAr: "اقتصاد كلي", nameFr: "Macroéconomie", nameEn: "Macroeconomics", coef: 3, hasTD: false },
                    { id: "droit", nameAr: "قانون", nameFr: "Droit", nameEn: "Law", coef: 2, hasTD: false },
                    { id: "fr1", nameAr: "لغة فرنسية 1", nameFr: "Français 1", nameEn: "French 1", coef: 2, hasTD: true },
                    { id: "en1", nameAr: "لغة إنجليزية 1", nameFr: "Anglais 1", nameEn: "English 1", coef: 2, hasTD: true },
                    { id: "info1", nameAr: "إعلام آلي 1", nameFr: "Informatique 1", nameEn: "Computer Science 1", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y2",
                nameAr: "السنة الثانية تحضيري",
                nameFr: "2ème année prépa",
                nameEn: "2nd Preparatory Year",
                subjects: [
                    { id: "math2", nameAr: "رياضيات 2", nameFr: "Mathématiques 2", nameEn: "Mathematics 2", coef: 4, hasTD: true },
                    { id: "stat2", nameAr: "إحصاء 2", nameFr: "Statistiques 2", nameEn: "Statistics 2", coef: 3, hasTD: true },
                    { id: "compta2", nameAr: "محاسبة تحليلية", nameFr: "Comptabilité analytique", nameEn: "Cost Accounting", coef: 3, hasTD: true },
                    { id: "eco2", nameAr: "اقتصاد جزئي", nameFr: "Microéconomie", nameEn: "Microeconomics", coef: 3, hasTD: false },
                    { id: "mgmt", nameAr: "مبادئ التسيير", nameFr: "Principes de management", nameEn: "Management Principles", coef: 3, hasTD: false },
                    { id: "fr2", nameAr: "لغة فرنسية 2", nameFr: "Français 2", nameEn: "French 2", coef: 2, hasTD: true },
                    { id: "en2", nameAr: "لغة إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2, hasTD: true },
                    { id: "info2", nameAr: "إعلام آلي 2", nameFr: "Informatique 2", nameEn: "Computer Science 2", coef: 2, hasTD: true },
                ],
            },
        ],
    },
    {
        id: "ehec",
        nameAr: "مدرسة الدراسات العليا التجارية",
        nameFr: "École des Hautes Études Commerciales",
        nameEn: "School of Higher Commercial Studies",
        acronym: "EHEC",
        color: "#10b981",
        years: [
            {
                id: "y1",
                nameAr: "السنة الأولى تحضيري",
                nameFr: "1ère année prépa",
                nameEn: "1st Preparatory Year",
                subjects: [
                    { id: "math1", nameAr: "رياضيات", nameFr: "Mathématiques", nameEn: "Mathematics", coef: 5, hasTD: true },
                    { id: "eco", nameAr: "اقتصاد", nameFr: "Économie", nameEn: "Economics", coef: 4, hasTD: true },
                    { id: "compta", nameAr: "محاسبة", nameFr: "Comptabilité", nameEn: "Accounting", coef: 4, hasTD: true },
                    { id: "droit", nameAr: "قانون", nameFr: "Droit", nameEn: "Law", coef: 3, hasTD: false },
                    { id: "fr", nameAr: "فرنسية", nameFr: "Français", nameEn: "French", coef: 2, hasTD: true },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y2",
                nameAr: "السنة الثانية تحضيري",
                nameFr: "2ème année prépa",
                nameEn: "2nd Preparatory Year",
                subjects: [
                    { id: "math2", nameAr: "رياضيات متقدمة", nameFr: "Mathématiques avancées", nameEn: "Advanced Mathematics", coef: 5, hasTD: true },
                    { id: "eco2", nameAr: "نظرية اقتصادية", nameFr: "Théorie économique", nameEn: "Economic Theory", coef: 4, hasTD: true },
                    { id: "fin", nameAr: "مالية", nameFr: "Finance", nameEn: "Finance", coef: 4, hasTD: true },
                    { id: "mkting", nameAr: "تسويق", nameFr: "Marketing", nameEn: "Marketing", coef: 3, hasTD: false },
                    { id: "fr2", nameAr: "فرنسية 2", nameFr: "Français 2", nameEn: "French 2", coef: 2, hasTD: true },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2, hasTD: true },
                ],
            },
        ],
    },
    {
        id: "esgen",
        nameAr: "المدرسة العليا للتسيير والاقتصاد الرقمي",
        nameFr: "École Supérieure de Gestion et Économie Numérique",
        nameEn: "Higher School of Management & Digital Economy",
        acronym: "ESGEN",
        color: "#f59e0b",
        years: [
            {
                id: "y1",
                nameAr: "السنة الأولى",
                nameFr: "1ère année",
                nameEn: "1st Year",
                subjects: [
                    { id: "algo", nameAr: "خوارزميات وبرمجة", nameFr: "Algorithmique & Prog.", nameEn: "Algorithms & Programming", coef: 5, hasTD: true },
                    { id: "math", nameAr: "رياضيات", nameFr: "Mathématiques", nameEn: "Mathematics", coef: 4, hasTD: true },
                    { id: "sysinfo", nameAr: "نظم المعلومات", nameFr: "Systèmes d'information", nameEn: "Information Systems", coef: 3, hasTD: true },
                    { id: "eco", nameAr: "اقتصاد رقمي", nameFr: "Économie numérique", nameEn: "Digital Economy", coef: 3, hasTD: false },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y2",
                nameAr: "السنة الثانية",
                nameFr: "2ème année",
                nameEn: "2nd Year",
                subjects: [
                    { id: "bd", nameAr: "قواعد البيانات", nameFr: "Bases de données", nameEn: "Databases", coef: 5, hasTD: true },
                    { id: "reseaux", nameAr: "شبكات", nameFr: "Réseaux", nameEn: "Networks", coef: 4, hasTD: true },
                    { id: "webdev", nameAr: "تطوير ويب", nameFr: "Développement web", nameEn: "Web Development", coef: 4, hasTD: true },
                    { id: "mgmt", nameAr: "تسيير رقمي", nameFr: "Management numérique", nameEn: "Digital Management", coef: 3, hasTD: false },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais tech.", nameEn: "Technical English", coef: 2, hasTD: true },
                ],
            },
        ],
    },
    {
        id: "enssea",
        nameAr: "المدرسة الوطنية العليا للإحصاء والاقتصاد التطبيقي",
        nameFr: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        nameEn: "National Higher School of Statistics & Applied Economics",
        acronym: "ENSSEA",
        color: "#8b5cf6",
        years: [
            {
                id: "y1",
                nameAr: "السنة الأولى",
                nameFr: "1ère année",
                nameEn: "1st Year",
                subjects: [
                    { id: "proba", nameAr: "احتمالات وإحصاء", nameFr: "Probabilités & Stat.", nameEn: "Probability & Statistics", coef: 5, hasTD: true },
                    { id: "analyse", nameAr: "تحليل رياضي", nameFr: "Analyse mathématique", nameEn: "Mathematical Analysis", coef: 4, hasTD: true },
                    { id: "algebra", nameAr: "جبر خطي", nameFr: "Algèbre linéaire", nameEn: "Linear Algebra", coef: 4, hasTD: true },
                    { id: "info", nameAr: "إعلام آلي", nameFr: "Informatique stat.", nameEn: "Statistical Computing", coef: 3, hasTD: true },
                    { id: "eco", nameAr: "اقتصاد تطبيقي", nameFr: "Économie appliquée", nameEn: "Applied Economics", coef: 3, hasTD: false },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y2",
                nameAr: "السنة الثانية",
                nameFr: "2ème année",
                nameEn: "2nd Year",
                subjects: [
                    { id: "stat2", nameAr: "إحصاء متقدم", nameFr: "Statistiques avancées", nameEn: "Advanced Statistics", coef: 5, hasTD: true },
                    { id: "econometrie", nameAr: "قياس اقتصادي", nameFr: "Économétrie", nameEn: "Econometrics", coef: 5, hasTD: true },
                    { id: "sondage", nameAr: "نظرية المسح", nameFr: "Théorie des sondages", nameEn: "Survey Theory", coef: 4, hasTD: true },
                    { id: "demographie", nameAr: "ديموغرافيا", nameFr: "Démographie", nameEn: "Demography", coef: 3, hasTD: false },
                    { id: "en2", nameAr: "إنجليزية تقنية", nameFr: "Anglais technique", nameEn: "Technical English", coef: 2, hasTD: true },
                ],
            },
        ],
    },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type Grades = Record<string, { exam: string; td: string }>;

const i18n = {
    ar: {
        chooseSchool: "اختر المدرسة",
        chooseYear: "اختر السنة",
        subject: "المقياس",
        coef: "المعامل",
        exam: "امتحان /20",
        td: "TD /20",
        subjectAvg: "معدل المقياس",
        overall: "المعدل الإجمالي",
        totalCoef: "مجموع المعاملات",
        mention: "الملاحظة",
        reset: "إعادة تعيين",
        export: "تصدير PDF",
        incomplete: "مقياس ناقص",
        hasTD: "يحتوي TD",
        noTD: "بدون TD",
        mentions: { excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد", passable: "مقبول", fail: "راسب" },
    },
    fr: {
        chooseSchool: "Choisir l'école",
        chooseYear: "Choisir l'année",
        subject: "Matière",
        coef: "Coef.",
        exam: "Examen /20",
        td: "TD /20",
        subjectAvg: "Moy. matière",
        overall: "Moyenne générale",
        totalCoef: "Total coefficients",
        mention: "Mention",
        reset: "Réinitialiser",
        export: "Exporter PDF",
        incomplete: "Matière incomplète",
        hasTD: "Avec TD",
        noTD: "Sans TD",
        mentions: { excellent: "Excellent", veryGood: "Très bien", good: "Bien", passable: "Passable", fail: "Échec" },
    },
    en: {
        chooseSchool: "Choose school",
        chooseYear: "Choose year",
        subject: "Subject",
        coef: "Coef.",
        exam: "Exam /20",
        td: "TD /20",
        subjectAvg: "Subject avg.",
        overall: "Overall average",
        totalCoef: "Total coefficients",
        mention: "Mention",
        reset: "Reset",
        export: "Export PDF",
        incomplete: "Incomplete subject",
        hasTD: "Has TD",
        noTD: "No TD",
        mentions: { excellent: "Excellent", veryGood: "Very Good", good: "Good", passable: "Passable", fail: "Fail" },
    },
};

function getMention(avg: number, t: typeof i18n.ar) {
    if (avg >= 16) return { label: t.mentions.excellent, color: "#10b981" };
    if (avg >= 14) return { label: t.mentions.veryGood, color: "#3b82f6" };
    if (avg >= 12) return { label: t.mentions.good, color: "#f59e0b" };
    if (avg >= 10) return { label: t.mentions.passable, color: "#f97316" };
    return { label: t.mentions.fail, color: "#ef4444" };
}

function calcSubjectAvg(exam: string, td: string, hasTD: boolean): number | null {
    const e = parseFloat(exam);
    if (isNaN(e) || e < 0 || e > 20) return null;
    if (hasTD) {
        const td_ = parseFloat(td);
        if (isNaN(td_) || td_ < 0 || td_ > 20) return null;
        return td_ * 0.4 + e * 0.6;
    }
    return e;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GrandesEcolesCalculator({
    lang,
    isRTL,
}: {
    lang: "ar" | "fr" | "en";
    isRTL: boolean;
}) {
    const t = i18n[lang];
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [grades, setGrades] = useState<Grades>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    const school = SCHOOLS.find((s) => s.id === selectedSchool);
    const year = school?.years.find((y) => y.id === selectedYear);

    const updateGrade = useCallback(
        (subjectId: string, field: "exam" | "td", value: string) => {
            setGrades((prev) => ({
                ...prev,
                [subjectId]: { ...prev[subjectId], exam: prev[subjectId]?.exam ?? "", td: prev[subjectId]?.td ?? "", [field]: value },
            }));
        },
        []
    );

    const reset = () => setGrades({});

    // Calculate overall
    let totalWeighted = 0;
    let totalCoef = 0;
    let filledCount = 0;
    const subjectResults = year?.subjects.map((s) => {
        const g = grades[s.id];
        const avg = g ? calcSubjectAvg(g.exam, g.td, s.hasTD) : null;
        if (avg !== null) {
            totalWeighted += avg * s.coef;
            totalCoef += s.coef;
            filledCount++;
        }
        return { ...s, avg };
    }) ?? [];

    const overall = totalCoef > 0 ? totalWeighted / totalCoef : null;
    const mention = overall !== null ? getMention(overall, t) : null;
    const progress = year ? (filledCount / year.subjects.length) * 100 : 0;

    return (
        <div className="space-y-5">
            {/* School + Year selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                        {t.chooseSchool}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {SCHOOLS.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => { setSelectedSchool(s.id); setSelectedYear(""); setGrades({}); }}
                                className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 text-left ${selectedSchool === s.id
                                        ? "border-transparent text-black"
                                        : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 bg-white/[0.03]"
                                    }`}
                                style={selectedSchool === s.id ? { background: s.color, boxShadow: `0 0 20px ${s.color}40` } : {}}
                            >
                                <span className="block text-xs opacity-70">{s.acronym}</span>
                                <span className="block text-[11px] leading-tight opacity-90 mt-0.5">
                                    {lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {school && (
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                            {t.chooseYear}
                        </label>
                        <div className="flex flex-col gap-2">
                            {school.years.map((y) => (
                                <button
                                    key={y.id}
                                    onClick={() => { setSelectedYear(y.id); setGrades({}); }}
                                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${selectedYear === y.id
                                            ? "border-transparent bg-[#00b7ff] text-black shadow-lg shadow-[#00b7ff]/20"
                                            : "border-white/10 text-white/50 hover:border-white/20 hover:text-white bg-white/[0.03]"
                                        }`}
                                >
                                    {lang === "ar" ? y.nameAr : lang === "fr" ? y.nameFr : y.nameEn}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Subjects table */}
            {year && (
                <>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[#00b7ff] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-white/30 font-mono tabular-nums">
                            {filledCount}/{year.subjects.length}
                        </span>
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2">
                        {subjectResults.map((s) => {
                            const g = grades[s.id] ?? { exam: "", td: "" };
                            const isOpen = expandedSubject === s.id;
                            const hasError =
                                g.exam !== "" &&
                                (isNaN(parseFloat(g.exam)) || parseFloat(g.exam) < 0 || parseFloat(g.exam) > 20);

                            return (
                                <div
                                    key={s.id}
                                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${isOpen ? "border-[#00b7ff]/30 bg-[#00b7ff]/5" : "border-white/8 bg-white/[0.02] hover:border-white/15"
                                        }`}
                                >
                                    <button
                                        className="w-full flex items-center justify-between px-4 py-3 gap-3"
                                        onClick={() => setExpandedSubject(isOpen ? null : s.id)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span
                                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                                                style={{ background: school?.color + "22", color: school?.color }}
                                            >
                                                {s.coef}
                                            </span>
                                            <div className="min-w-0 text-left">
                                                <p className="text-sm font-medium text-white/90 truncate">
                                                    {lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}
                                                </p>
                                                <p className="text-[11px] text-white/30">
                                                    {s.hasTD ? t.hasTD : t.noTD}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {hasError && <AlertCircle className="w-4 h-4 text-red-400" />}
                                            {s.avg !== null && (
                                                <span
                                                    className="text-sm font-bold tabular-nums"
                                                    style={{ color: getMention(s.avg, t).color }}
                                                >
                                                    {s.avg.toFixed(2)}
                                                </span>
                                            )}
                                            {isOpen ? (
                                                <ChevronUp className="w-4 h-4 text-white/30" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-white/30" />
                                            )}
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                                            <div>
                                                <label className="block text-xs text-white/40 mb-1.5">{t.exam}</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={20}
                                                    step={0.25}
                                                    value={g.exam}
                                                    onChange={(e) => updateGrade(s.id, "exam", e.target.value)}
                                                    placeholder="—"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/50 transition-colors"
                                                />
                                            </div>
                                            {s.hasTD && (
                                                <div>
                                                    <label className="block text-xs text-white/40 mb-1.5">{t.td}</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={20}
                                                        step={0.25}
                                                        value={g.td}
                                                        onChange={(e) => updateGrade(s.id, "td", e.target.value)}
                                                        placeholder="—"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/50 transition-colors"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Result card */}
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-wrap items-center justify-between gap-6">
                        <div>
                            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">{t.overall}</p>
                            <p className="text-5xl font-black tabular-nums" style={{ color: mention?.color ?? "white" }}>
                                {overall !== null ? overall.toFixed(2) : "—"}
                            </p>
                            <p className="text-sm mt-1 font-medium" style={{ color: mention?.color ?? "#ffffff50" }}>
                                {mention?.label ?? ""}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">{t.totalCoef}</p>
                            <p className="text-2xl font-bold text-white/60">{totalCoef}</p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={reset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t.reset}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}