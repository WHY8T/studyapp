"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronUp, AlertCircle, Plus, Trash2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type GradeMode = "note20" | "td8exam12" | "td20exam20";

type Subject = {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    coef: number;
    isCustom?: boolean;
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

type GradeEntry = { mode: GradeMode; note: string; td: string; exam: string };
type Grades = Record<string, GradeEntry>;

// ─── Data ──────────────────────────────────────────────────────────────────────

const SCHOOLS: School[] = [
    {
        id: "esc", nameAr: "المدرسة العليا للتجارة", nameFr: "École Supérieure de Commerce", nameEn: "Higher School of Commerce", acronym: "ESC", color: "#3b82f6",
        years: [
            {
                id: "y1", nameAr: "السنة الأولى تحضيري", nameFr: "1ère année prépa", nameEn: "1st Preparatory Year",
                subjects: [
                    { id: "math1", nameAr: "رياضيات 1", nameFr: "Mathématiques 1", nameEn: "Mathematics 1", coef: 4 },
                    { id: "stat1", nameAr: "إحصاء 1", nameFr: "Statistiques 1", nameEn: "Statistics 1", coef: 3 },
                    { id: "compta", nameAr: "محاسبة عامة", nameFr: "Comptabilité générale", nameEn: "General Accounting", coef: 3 },
                    { id: "eco1", nameAr: "اقتصاد كلي", nameFr: "Macroéconomie", nameEn: "Macroeconomics", coef: 3 },
                    { id: "droit", nameAr: "قانون", nameFr: "Droit", nameEn: "Law", coef: 2 },
                    { id: "fr1", nameAr: "لغة فرنسية 1", nameFr: "Français 1", nameEn: "French 1", coef: 2 },
                    { id: "en1", nameAr: "لغة إنجليزية 1", nameFr: "Anglais 1", nameEn: "English 1", coef: 2 },
                    { id: "info1", nameAr: "إعلام آلي 1", nameFr: "Informatique 1", nameEn: "Computer Science 1", coef: 2 },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية تحضيري", nameFr: "2ème année prépa", nameEn: "2nd Preparatory Year",
                subjects: [
                    { id: "math2", nameAr: "رياضيات 2", nameFr: "Mathématiques 2", nameEn: "Mathematics 2", coef: 4 },
                    { id: "stat2", nameAr: "إحصاء 2", nameFr: "Statistiques 2", nameEn: "Statistics 2", coef: 3 },
                    { id: "compta2", nameAr: "محاسبة تحليلية", nameFr: "Comptabilité analytique", nameEn: "Cost Accounting", coef: 3 },
                    { id: "eco2", nameAr: "اقتصاد جزئي", nameFr: "Microéconomie", nameEn: "Microeconomics", coef: 3 },
                    { id: "mgmt", nameAr: "مبادئ التسيير", nameFr: "Principes de management", nameEn: "Management Principles", coef: 3 },
                    { id: "fr2", nameAr: "لغة فرنسية 2", nameFr: "Français 2", nameEn: "French 2", coef: 2 },
                    { id: "en2", nameAr: "لغة إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2 },
                    { id: "info2", nameAr: "إعلام آلي 2", nameFr: "Informatique 2", nameEn: "Computer Science 2", coef: 2 },
                ],
            },
        ],
    },
    {
        id: "ehec", nameAr: "مدرسة الدراسات العليا التجارية", nameFr: "École des Hautes Études Commerciales", nameEn: "School of Higher Commercial Studies", acronym: "EHEC", color: "#10b981",
        years: [
            {
                id: "y1", nameAr: "السنة الأولى تحضيري", nameFr: "1ère année prépa", nameEn: "1st Preparatory Year",
                subjects: [
                    { id: "math1", nameAr: "رياضيات", nameFr: "Mathématiques", nameEn: "Mathematics", coef: 5 },
                    { id: "eco", nameAr: "اقتصاد", nameFr: "Économie", nameEn: "Economics", coef: 4 },
                    { id: "compta", nameAr: "محاسبة", nameFr: "Comptabilité", nameEn: "Accounting", coef: 4 },
                    { id: "droit", nameAr: "قانون", nameFr: "Droit", nameEn: "Law", coef: 3 },
                    { id: "fr", nameAr: "فرنسية", nameFr: "Français", nameEn: "French", coef: 2 },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2 },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية تحضيري", nameFr: "2ème année prépa", nameEn: "2nd Preparatory Year",
                subjects: [
                    { id: "math2", nameAr: "رياضيات متقدمة", nameFr: "Mathématiques avancées", nameEn: "Advanced Mathematics", coef: 5 },
                    { id: "eco2", nameAr: "نظرية اقتصادية", nameFr: "Théorie économique", nameEn: "Economic Theory", coef: 4 },
                    { id: "fin", nameAr: "مالية", nameFr: "Finance", nameEn: "Finance", coef: 4 },
                    { id: "mkting", nameAr: "تسويق", nameFr: "Marketing", nameEn: "Marketing", coef: 3 },
                    { id: "fr2", nameAr: "فرنسية 2", nameFr: "Français 2", nameEn: "French 2", coef: 2 },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2 },
                ],
            },
        ],
    },
    {
        id: "esgen", nameAr: "المدرسة العليا للتسيير والاقتصاد الرقمي", nameFr: "École Supérieure de Gestion et Économie Numérique", nameEn: "Higher School of Management & Digital Economy", acronym: "ESGEN", color: "#f59e0b",
        years: [
            {
                id: "y1", nameAr: "السنة الأولى", nameFr: "1ère année", nameEn: "1st Year",
                subjects: [
                    { id: "algo", nameAr: "خوارزميات وبرمجة", nameFr: "Algorithmique & Prog.", nameEn: "Algorithms & Programming", coef: 5 },
                    { id: "math", nameAr: "رياضيات", nameFr: "Mathématiques", nameEn: "Mathematics", coef: 4 },
                    { id: "sysinfo", nameAr: "نظم المعلومات", nameFr: "Systèmes d'information", nameEn: "Information Systems", coef: 3 },
                    { id: "eco", nameAr: "اقتصاد رقمي", nameFr: "Économie numérique", nameEn: "Digital Economy", coef: 3 },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2 },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية", nameFr: "2ème année", nameEn: "2nd Year",
                subjects: [
                    { id: "bd", nameAr: "قواعد البيانات", nameFr: "Bases de données", nameEn: "Databases", coef: 5 },
                    { id: "reseaux", nameAr: "شبكات", nameFr: "Réseaux", nameEn: "Networks", coef: 4 },
                    { id: "webdev", nameAr: "تطوير ويب", nameFr: "Développement web", nameEn: "Web Development", coef: 4 },
                    { id: "mgmt", nameAr: "تسيير رقمي", nameFr: "Management numérique", nameEn: "Digital Management", coef: 3 },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais tech.", nameEn: "Technical English", coef: 2 },
                ],
            },
        ],
    },
    {
        id: "enssea", nameAr: "المدرسة الوطنية العليا للإحصاء والاقتصاد التطبيقي", nameFr: "École Nationale Supérieure de Statistique et d'Économie Appliquée", nameEn: "National Higher School of Statistics & Applied Economics", acronym: "ENSSEA", color: "#8b5cf6",
        years: [
            {
                id: "y1", nameAr: "السنة الأولى", nameFr: "1ère année", nameEn: "1st Year",
                subjects: [
                    { id: "proba", nameAr: "احتمالات وإحصاء", nameFr: "Probabilités & Stat.", nameEn: "Probability & Statistics", coef: 5 },
                    { id: "analyse", nameAr: "تحليل رياضي", nameFr: "Analyse mathématique", nameEn: "Mathematical Analysis", coef: 4 },
                    { id: "algebra", nameAr: "جبر خطي", nameFr: "Algèbre linéaire", nameEn: "Linear Algebra", coef: 4 },
                    { id: "info", nameAr: "إعلام آلي", nameFr: "Informatique stat.", nameEn: "Statistical Computing", coef: 3 },
                    { id: "eco", nameAr: "اقتصاد تطبيقي", nameFr: "Économie appliquée", nameEn: "Applied Economics", coef: 3 },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2 },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية", nameFr: "2ème année", nameEn: "2nd Year",
                subjects: [
                    { id: "stat2", nameAr: "إحصاء متقدم", nameFr: "Statistiques avancées", nameEn: "Advanced Statistics", coef: 5 },
                    { id: "econometrie", nameAr: "قياس اقتصادي", nameFr: "Économétrie", nameEn: "Econometrics", coef: 5 },
                    { id: "sondage", nameAr: "نظرية المسح", nameFr: "Théorie des sondages", nameEn: "Survey Theory", coef: 4 },
                    { id: "demographie", nameAr: "ديموغرافيا", nameFr: "Démographie", nameEn: "Demography", coef: 3 },
                    { id: "en2", nameAr: "إنجليزية تقنية", nameFr: "Anglais technique", nameEn: "Technical English", coef: 2 },
                ],
            },
        ],
    },
    { id: "other", nameAr: "مدرسة أخرى", nameFr: "Autre école", nameEn: "Other School", acronym: "OTHER", color: "#6366f1", years: [] },
];

// ─── i18n ──────────────────────────────────────────────────────────────────────

const i18n = {
    ar: {
        chooseSchool: "اختر المدرسة", chooseYear: "اختر السنة", subject: "المقياس", coef: "المعامل",
        note20: "نقطة /20", td8exam12: "TD /8 + امتحان /12", td20exam20: "TD /20 + امتحان /20",
        note: "النقطة /20", td: "TD", exam: "امتحان",
        subjectAvg: "معدل المقياس", overall: "المعدل الإجمالي", totalCoef: "مجموع المعاملات",
        mention: "الملاحظة", reset: "إعادة تعيين", addSubject: "إضافة مقياس", subjectName: "اسم المقياس",
        mentions: { excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد", passable: "مقبول", fail: "راسب" },
        addExtra: "إضافة مقياس إضافي", customSchoolHint: "أضف موادك الخاصة بحرية", deleteSubject: "حذف",
        inputMode: "طريقة الإدخال",
    },
    fr: {
        chooseSchool: "Choisir l'école", chooseYear: "Choisir l'année", subject: "Matière", coef: "Coef.",
        note20: "Note /20", td8exam12: "TD /8 + Examen /12", td20exam20: "TD /20 + Examen /20",
        note: "Note /20", td: "TD", exam: "Examen",
        subjectAvg: "Moy. matière", overall: "Moyenne générale", totalCoef: "Total coefficients",
        mention: "Mention", reset: "Réinitialiser", addSubject: "Ajouter une matière", subjectName: "Nom de la matière",
        mentions: { excellent: "Excellent", veryGood: "Très bien", good: "Bien", passable: "Passable", fail: "Échec" },
        addExtra: "Ajouter une matière supplémentaire", customSchoolHint: "Ajoutez librement vos matières", deleteSubject: "Supprimer",
        inputMode: "Mode de saisie",
    },
    en: {
        chooseSchool: "Choose school", chooseYear: "Choose year", subject: "Subject", coef: "Coef.",
        note20: "Grade /20", td8exam12: "TD /8 + Exam /12", td20exam20: "TD /20 + Exam /20",
        note: "Grade /20", td: "TD", exam: "Exam",
        subjectAvg: "Subject avg.", overall: "Overall average", totalCoef: "Total coefficients",
        mention: "Mention", reset: "Reset", addSubject: "Add subject", subjectName: "Subject name",
        mentions: { excellent: "Excellent", veryGood: "Very Good", good: "Good", passable: "Passable", fail: "Fail" },
        addExtra: "Add extra subject", customSchoolHint: "Freely add your own subjects", deleteSubject: "Delete",
        inputMode: "Input mode",
    },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getMention(avg: number, t: typeof i18n.ar) {
    if (avg >= 16) return { label: t.mentions.excellent, color: "#10b981" };
    if (avg >= 14) return { label: t.mentions.veryGood, color: "#3b82f6" };
    if (avg >= 12) return { label: t.mentions.good, color: "#f59e0b" };
    if (avg >= 10) return { label: t.mentions.passable, color: "#f97316" };
    return { label: t.mentions.fail, color: "#ef4444" };
}

function defaultGradeEntry(mode: GradeMode): GradeEntry {
    return { mode, note: "", td: "", exam: "" };
}

function calcAvgFromEntry(g: GradeEntry): number | null {
    if (g.mode === "note20") {
        const n = parseFloat(g.note);
        if (isNaN(n) || n < 0 || n > 20) return null;
        return n;
    }
    if (g.mode === "td8exam12") {
        const td = parseFloat(g.td);
        const exam = parseFloat(g.exam);
        if (isNaN(td) || td < 0 || td > 8) return null;
        if (isNaN(exam) || exam < 0 || exam > 12) return null;
        return td + exam; // already out of 20
    }
    if (g.mode === "td20exam20") {
        const td = parseFloat(g.td);
        const exam = parseFloat(g.exam);
        if (isNaN(td) || td < 0 || td > 20) return null;
        if (isNaN(exam) || exam < 0 || exam > 20) return null;
        return (td * 0.4) + (exam * 0.6); // 40% TD + 60% Exam
    }
    return null;
}

let customIdCounter = 1;
function newCustomSubject(): Subject {
    return { id: `custom_${customIdCounter++}`, nameAr: "", nameFr: "", nameEn: "", coef: 3, isCustom: true };
}

// ─── Mode Switcher ─────────────────────────────────────────────────────────────

function ModeSwitcher({ mode, onChange, t }: { mode: GradeMode; onChange: (m: GradeMode) => void; t: typeof i18n.ar }) {
    const modes: { value: GradeMode; label: string }[] = [
        { value: "note20", label: t.note20 },
        { value: "td8exam12", label: t.td8exam12 },
        { value: "td20exam20", label: t.td20exam20 },
    ];
    return (
        <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {modes.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${mode === m.value ? "bg-[#00b7ff] text-black shadow-sm" : "text-white/40 hover:text-white"}`}
                >
                    {m.label}
                </button>
            ))}
        </div>
    );
}

// ─── Grade Inputs ──────────────────────────────────────────────────────────────

function GradeInputs({ g, onChange, t, color }: { g: GradeEntry; onChange: (patch: Partial<GradeEntry>) => void; t: typeof i18n.ar; color: string }) {
    if (g.mode === "note20") {
        return (
            <div>
                <label className="block text-xs text-white/40 mb-1.5">{t.note}</label>
                <input type="number" min={0} max={20} step={0.25} value={g.note}
                    onChange={(e) => onChange({ note: e.target.value })} placeholder="—"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                    style={{ borderColor: g.note ? color + "50" : undefined }}
                />
            </div>
        );
    }
    if (g.mode === "td8exam12") {
        return (
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-white/40 mb-1.5">{t.td} /8</label>
                    <input type="number" min={0} max={8} step={0.25} value={g.td}
                        onChange={(e) => onChange({ td: e.target.value })} placeholder="—"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/40 mb-1.5">{t.exam} /12</label>
                    <input type="number" min={0} max={12} step={0.25} value={g.exam}
                        onChange={(e) => onChange({ exam: e.target.value })} placeholder="—"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                    />
                </div>
            </div>
        );
    }
    // td20exam20
    return (
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs text-white/40 mb-1.5">{t.td} /20 <span className="text-white/20">(40%)</span></label>
                <input type="number" min={0} max={20} step={0.25} value={g.td}
                    onChange={(e) => onChange({ td: e.target.value })} placeholder="—"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs text-white/40 mb-1.5">{t.exam} /20 <span className="text-white/20">(60%)</span></label>
                <input type="number" min={0} max={20} step={0.25} value={g.exam}
                    onChange={(e) => onChange({ exam: e.target.value })} placeholder="—"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                />
            </div>
        </div>
    );
}

// ─── Custom Subject Row ────────────────────────────────────────────────────────

function CustomSubjectRow({ subject, lang, t, schoolColor, grade, onUpdate, onDelete, onGradeChange, isExpanded, onToggle }:
    { subject: Subject; lang: "ar" | "fr" | "en"; t: typeof i18n.ar; schoolColor: string; grade: GradeEntry; onUpdate: (patch: Partial<Subject>) => void; onDelete: () => void; onGradeChange: (patch: Partial<GradeEntry>) => void; isExpanded: boolean; onToggle: () => void; }) {
    const name = subject.nameEn || subject.nameFr || subject.nameAr;
    const avg = calcAvgFromEntry(grade);

    return (
        <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? "border-[#6366f1]/30 bg-[#6366f1]/5" : "border-white/8 bg-white/[0.02] hover:border-white/15"}`}>
            <button className="w-full flex items-center justify-between px-4 py-3 gap-3" onClick={onToggle}>
                <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: schoolColor + "22", color: schoolColor }}>{subject.coef}</span>
                    <p className="text-sm font-medium text-white/90 truncate">{name || <span className="text-white/20 italic">{t.subjectName}…</span>}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {avg !== null && <span className="text-sm font-bold tabular-nums" style={{ color: getMention(avg, t).color }}>{avg.toFixed(2)}</span>}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </div>
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    <div>
                        <label className="block text-xs text-white/40 mb-1.5">{t.subjectName}</label>
                        <input type="text" value={subject.nameEn}
                            onChange={(e) => onUpdate({ nameEn: e.target.value, nameFr: e.target.value, nameAr: e.target.value })}
                            placeholder={t.subjectName}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#6366f1]/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-white/40 mb-1.5">{t.coef}</label>
                        <input type="number" min={1} max={10} value={subject.coef}
                            onChange={(e) => onUpdate({ coef: parseInt(e.target.value) || 1 })}
                            className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 text-center"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-white/40 mb-1.5">{t.inputMode}</label>
                        <ModeSwitcher mode={grade.mode} onChange={(m) => onGradeChange({ mode: m, note: "", td: "", exam: "" })} t={t} />
                    </div>
                    <GradeInputs g={grade} onChange={onGradeChange} t={t} color={schoolColor} />
                </div>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GrandesEcolesCalculator({ lang, isRTL }: { lang: "ar" | "fr" | "en"; isRTL: boolean }) {
    const t = i18n[lang];
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [grades, setGrades] = useState<Grades>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [extraSubjects, setExtraSubjects] = useState<Subject[]>([]);
    const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);
    const [globalMode, setGlobalMode] = useState<GradeMode>("note20");

    const school = SCHOOLS.find((s) => s.id === selectedSchool);
    const year = school?.years.find((y) => y.id === selectedYear);
    const isOther = selectedSchool === "other";

    const getGrade = (id: string): GradeEntry => grades[id] ?? defaultGradeEntry(globalMode);

    const updateGrade = useCallback((subjectId: string, patch: Partial<GradeEntry>) => {
        setGrades((prev) => ({ ...prev, [subjectId]: { ...defaultGradeEntry(globalMode), ...prev[subjectId], ...patch } }));
    }, [globalMode]);

    const handleGlobalModeChange = (mode: GradeMode) => {
        setGlobalMode(mode);
        setGrades({});
    };

    const reset = () => { setGrades({}); setExtraSubjects([]); setCustomSubjects([]); };

    const addExtraSubject = () => setExtraSubjects((prev) => [...prev, newCustomSubject()]);
    const addCustomSubject = () => setCustomSubjects((prev) => [...prev, newCustomSubject()]);
    const updateExtraSubject = (id: string, patch: Partial<Subject>) => setExtraSubjects((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    const updateCustomSubject = (id: string, patch: Partial<Subject>) => setCustomSubjects((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    const removeExtraSubject = (id: string) => setExtraSubjects((prev) => prev.filter((s) => s.id !== id));
    const removeCustomSubject = (id: string) => setCustomSubjects((prev) => prev.filter((s) => s.id !== id));

    const presetSubjects: Subject[] = year?.subjects ?? [];
    const allSubjects: Subject[] = isOther ? customSubjects : [...presetSubjects, ...extraSubjects];

    let totalWeighted = 0, totalCoef = 0, filledCount = 0;
    const subjectResults = allSubjects.map((s) => {
        const g = getGrade(s.id);
        const avg = calcAvgFromEntry(g);
        if (avg !== null) { totalWeighted += avg * s.coef; totalCoef += s.coef; filledCount++; }
        return { ...s, avg };
    });

    const overall = totalCoef > 0 ? totalWeighted / totalCoef : null;
    const mention = overall !== null ? getMention(overall, t) : null;
    const progress = allSubjects.length > 0 ? (filledCount / allSubjects.length) * 100 : 0;
    const schoolColor = school?.color ?? "#6366f1";

    return (
        <div className="space-y-5">
            {/* School selector */}
            <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{t.chooseSchool}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SCHOOLS.map((s) => (
                        <button key={s.id}
                            onClick={() => { setSelectedSchool(s.id); setSelectedYear(""); setGrades({}); setExtraSubjects([]); setCustomSubjects([]); }}
                            className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 text-left ${selectedSchool === s.id ? "border-transparent text-black" : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 bg-white/[0.03]"}`}
                            style={selectedSchool === s.id ? { background: s.color, boxShadow: `0 0 20px ${s.color}40` } : {}}>
                            <span className="block text-xs opacity-70">{s.acronym}</span>
                            <span className="block text-[11px] leading-tight opacity-90 mt-0.5">{lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Year selector */}
            {school && !isOther && (
                <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{t.chooseYear}</label>
                    <div className="flex flex-col gap-2">
                        {school.years.map((y) => (
                            <button key={y.id}
                                onClick={() => { setSelectedYear(y.id); setGrades({}); setExtraSubjects([]); }}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${selectedYear === y.id ? "border-transparent bg-[#00b7ff] text-black shadow-lg shadow-[#00b7ff]/20" : "border-white/10 text-white/50 hover:border-white/20 hover:text-white bg-white/[0.03]"}`}>
                                {lang === "ar" ? y.nameAr : lang === "fr" ? y.nameFr : y.nameEn}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOther && <p className="text-sm text-white/30 italic">{t.customSchoolHint}</p>}

            {(isOther || year) && (
                <>
                    {/* Global mode switcher */}
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{t.inputMode}</label>
                        <ModeSwitcher mode={globalMode} onChange={handleGlobalModeChange} t={t} />
                    </div>

                    {allSubjects.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-[#00b7ff] transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-white/30 font-mono tabular-nums">{filledCount}/{allSubjects.length}</span>
                        </div>
                    )}

                    {/* Preset subjects */}
                    {!isOther && presetSubjects.length > 0 && (
                        <div className="space-y-2">
                            {subjectResults.filter(s => !s.isCustom).map((s) => {
                                const g = getGrade(s.id);
                                const isOpen = expandedSubject === s.id;
                                return (
                                    <div key={s.id} className={`rounded-xl border transition-all duration-200 overflow-hidden ${isOpen ? "border-[#00b7ff]/30 bg-[#00b7ff]/5" : "border-white/8 bg-white/[0.02] hover:border-white/15"}`}>
                                        <button className="w-full flex items-center justify-between px-4 py-3 gap-3" onClick={() => setExpandedSubject(isOpen ? null : s.id)}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: schoolColor + "22", color: schoolColor }}>{s.coef}</span>
                                                <p className="text-sm font-medium text-white/90 truncate">{lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {s.avg !== null && <span className="text-sm font-bold tabular-nums" style={{ color: getMention(s.avg, t).color }}>{s.avg.toFixed(2)}</span>}
                                                {isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                                            </div>
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 pb-4 border-t border-white/5 pt-3">
                                                <GradeInputs g={g} onChange={(patch) => updateGrade(s.id, patch)} t={t} color={schoolColor} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Extra subjects */}
                    {!isOther && extraSubjects.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <p className="text-xs text-white/20 uppercase tracking-widest font-semibold px-1">{t.addExtra}</p>
                            {extraSubjects.map((s) => (
                                <CustomSubjectRow key={s.id} subject={s} lang={lang} t={t} schoolColor={schoolColor}
                                    grade={getGrade(s.id)}
                                    onUpdate={(patch) => updateExtraSubject(s.id, patch)}
                                    onDelete={() => removeExtraSubject(s.id)}
                                    onGradeChange={(patch) => updateGrade(s.id, patch)}
                                    isExpanded={expandedSubject === s.id}
                                    onToggle={() => setExpandedSubject(expandedSubject === s.id ? null : s.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Custom subjects for "other" */}
                    {isOther && customSubjects.length > 0 && (
                        <div className="space-y-2">
                            {customSubjects.map((s) => (
                                <CustomSubjectRow key={s.id} subject={s} lang={lang} t={t} schoolColor={schoolColor}
                                    grade={getGrade(s.id)}
                                    onUpdate={(patch) => updateCustomSubject(s.id, patch)}
                                    onDelete={() => removeCustomSubject(s.id)}
                                    onGradeChange={(patch) => updateGrade(s.id, patch)}
                                    isExpanded={expandedSubject === s.id}
                                    onToggle={() => setExpandedSubject(expandedSubject === s.id ? null : s.id)}
                                />
                            ))}
                        </div>
                    )}

                    <button onClick={isOther ? addCustomSubject : addExtraSubject}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#00b7ff]/30 text-[#00b7ff]/70 hover:text-[#00b7ff] hover:border-[#00b7ff]/60 hover:bg-[#00b7ff]/5 transition-all text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        {isOther ? t.addSubject : t.addExtra}
                    </button>

                    {allSubjects.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-wrap items-center justify-between gap-6">
                            <div>
                                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">{t.overall}</p>
                                <p className="text-5xl font-black tabular-nums" style={{ color: mention?.color ?? "white" }}>{overall !== null ? overall.toFixed(2) : "—"}</p>
                                <p className="text-sm mt-1 font-medium" style={{ color: mention?.color ?? "#ffffff50" }}>{mention?.label ?? ""}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">{t.totalCoef}</p>
                                <p className="text-2xl font-bold text-white/60">{totalCoef}</p>
                                <button onClick={reset} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all">
                                    <RefreshCw className="w-3.5 h-3.5" />{t.reset}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}