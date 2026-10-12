"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Subject = {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    coef: number;
    hasTD?: boolean;   // TD worth 40%, exam 60%
    hasTP?: boolean;   // TP worth 33%, exam 67%
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

type GradeMode = "full20" | "td8exam12";
type GradeEntry = { exam: string; td: string; mode: GradeMode };
type Grades = Record<string, GradeEntry>;

// ─── School Data ───────────────────────────────────────────────────────────────

const SCHOOLS: School[] = [
    {
        id: "enssea",
        nameAr: "المدرسة الوطنية العليا للإحصاء والاقتصاد التطبيقي",
        nameFr: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        nameEn: "ENSSEA — Statistics & Applied Economics",
        acronym: "ENSSEA",
        color: "#8b5cf6",
        years: [
            {
                id: "y1", nameAr: "السنة الأولى", nameFr: "1ère Année", nameEn: "1st Year",
                subjects: [
                    { id: "analyse1", nameAr: "تحليل رياضي 1", nameFr: "Analyse mathématique 1", nameEn: "Mathematical Analysis 1", coef: 5, hasTD: true },
                    { id: "algebra1", nameAr: "جبر خطي 1", nameFr: "Algèbre linéaire 1", nameEn: "Linear Algebra 1", coef: 4, hasTD: true },
                    { id: "proba1", nameAr: "احتمالات 1", nameFr: "Probabilités 1", nameEn: "Probability 1", coef: 4, hasTD: true },
                    { id: "info1", nameAr: "إعلام آلي 1", nameFr: "Informatique 1", nameEn: "Computer Science 1", coef: 3, hasTD: true },
                    { id: "eco1", nameAr: "اقتصاد 1", nameFr: "Économie 1", nameEn: "Economics 1", coef: 3, hasTD: false },
                    { id: "fr1", nameAr: "فرنسية 1", nameFr: "Français 1", nameEn: "French 1", coef: 2, hasTD: false },
                    { id: "en1", nameAr: "إنجليزية 1", nameFr: "Anglais 1", nameEn: "English 1", coef: 2, hasTD: false },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية", nameFr: "2ème Année", nameEn: "2nd Year",
                subjects: [
                    { id: "analyse2", nameAr: "تحليل رياضي 2", nameFr: "Analyse mathématique 2", nameEn: "Mathematical Analysis 2", coef: 5, hasTD: true },
                    { id: "proba2", nameAr: "احتمالات 2", nameFr: "Probabilités 2", nameEn: "Probability 2", coef: 5, hasTD: true },
                    { id: "algebra2", nameAr: "جبر خطي 2", nameFr: "Algèbre linéaire 2", nameEn: "Linear Algebra 2", coef: 4, hasTD: true },
                    { id: "stat1", nameAr: "إحصاء 1", nameFr: "Statistiques 1", nameEn: "Statistics 1", coef: 4, hasTD: true },
                    { id: "info2", nameAr: "إعلام آلي 2", nameFr: "Informatique 2", nameEn: "Computer Science 2", coef: 3, hasTD: true },
                    { id: "eco2", nameAr: "اقتصاد 2", nameFr: "Économie 2", nameEn: "Economics 2", coef: 2, hasTD: false },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2, hasTD: false },
                ],
            },
            {
                id: "y3", nameAr: "السنة الثالثة", nameFr: "3ème Année", nameEn: "3rd Year",
                subjects: [
                    { id: "stat2", nameAr: "إحصاء رياضي", nameFr: "Statistique mathématique", nameEn: "Mathematical Statistics", coef: 5, hasTD: true },
                    { id: "econometrie", nameAr: "قياس اقتصادي", nameFr: "Économétrie", nameEn: "Econometrics", coef: 5, hasTD: true },
                    { id: "sondage", nameAr: "نظرية المسح", nameFr: "Théorie des sondages", nameEn: "Survey Theory", coef: 4, hasTD: true },
                    { id: "proba3", nameAr: "احتمالات 3", nameFr: "Probabilités 3", nameEn: "Probability 3", coef: 4, hasTD: true },
                    { id: "info3", nameAr: "إعلام آلي 3", nameFr: "Informatique stat.", nameEn: "Statistical Computing", coef: 3, hasTD: true },
                    { id: "demo", nameAr: "ديموغرافيا", nameFr: "Démographie", nameEn: "Demography", coef: 3, hasTD: false },
                    { id: "en3", nameAr: "إنجليزية تقنية", nameFr: "Anglais technique", nameEn: "Technical English", coef: 2, hasTD: false },
                ],
            },
            {
                id: "y4", nameAr: "السنة الرابعة", nameFr: "4ème Année", nameEn: "4th Year",
                subjects: [
                    { id: "stat3", nameAr: "إحصاء تطبيقي", nameFr: "Statistique appliquée", nameEn: "Applied Statistics", coef: 5, hasTD: true },
                    { id: "econometrie2", nameAr: "قياس اقتصادي 2", nameFr: "Économétrie 2", nameEn: "Econometrics 2", coef: 5, hasTD: true },
                    { id: "sondage2", nameAr: "منهجية المسح", nameFr: "Méthodologie des sondages", nameEn: "Survey Methodology", coef: 4, hasTD: true },
                    { id: "analyse_don", nameAr: "تحليل البيانات", nameFr: "Analyse des données", nameEn: "Data Analysis", coef: 4, hasTD: true },
                    { id: "macro", nameAr: "اقتصاد كلي", nameFr: "Macroéconomie", nameEn: "Macroeconomics", coef: 3, hasTD: false },
                    { id: "recherche", nameAr: "بحث عمليات", nameFr: "Recherche opérationnelle", nameEn: "Operations Research", coef: 3, hasTD: true },
                    { id: "en4", nameAr: "إنجليزية 4", nameFr: "Anglais 4", nameEn: "English 4", coef: 2, hasTD: false },
                ],
            },
            {
                id: "y5", nameAr: "السنة الخامسة", nameFr: "5ème Année", nameEn: "5th Year",
                subjects: [
                    { id: "stat_inf", nameAr: "إحصاء استدلالي", nameFr: "Statistique inférentielle", nameEn: "Inferential Statistics", coef: 5, hasTD: true },
                    { id: "analyse_multi", nameAr: "تحليل متعدد المتغيرات", nameFr: "Analyse multivariée", nameEn: "Multivariate Analysis", coef: 5, hasTD: true },
                    { id: "big_data", nameAr: "البيانات الضخمة", nameFr: "Big Data & Machine Learning", nameEn: "Big Data & Machine Learning", coef: 4, hasTD: true },
                    { id: "memoire", nameAr: "مذكرة التخرج", nameFr: "Mémoire de fin d'études", nameEn: "Final Dissertation", coef: 6, hasTD: false },
                    { id: "stage", nameAr: "تربص ميداني", nameFr: "Stage pratique", nameEn: "Practical Internship", coef: 4, hasTD: false },
                    { id: "en5", nameAr: "إنجليزية علمية", nameFr: "Anglais scientifique", nameEn: "Scientific English", coef: 2, hasTD: false },
                ],
            },
        ],
    },
    {
        id: "esc",
        nameAr: "المدرسة العليا للتجارة",
        nameFr: "École Supérieure de Commerce",
        nameEn: "Higher School of Commerce",
        acronym: "ESC",
        color: "#3b82f6",
        years: [
            {
                id: "y1", nameAr: "السنة الأولى تحضيري", nameFr: "1ère année prépa", nameEn: "1st Preparatory Year",
                subjects: [
                    { id: "math1", nameAr: "رياضيات 1", nameFr: "Mathématiques 1", nameEn: "Mathematics 1", coef: 4, hasTD: true },
                    { id: "stat1", nameAr: "إحصاء 1", nameFr: "Statistiques 1", nameEn: "Statistics 1", coef: 3, hasTD: true },
                    { id: "compta", nameAr: "محاسبة عامة", nameFr: "Comptabilité générale", nameEn: "General Accounting", coef: 3, hasTD: true },
                    { id: "eco1", nameAr: "اقتصاد كلي", nameFr: "Macroéconomie", nameEn: "Macroeconomics", coef: 3, hasTD: false },
                    { id: "droit", nameAr: "قانون", nameFr: "Droit", nameEn: "Law", coef: 2, hasTD: false },
                    { id: "fr1", nameAr: "فرنسية 1", nameFr: "Français 1", nameEn: "French 1", coef: 2, hasTD: true },
                    { id: "en1", nameAr: "إنجليزية 1", nameFr: "Anglais 1", nameEn: "English 1", coef: 2, hasTD: true },
                    { id: "info1", nameAr: "إعلام آلي 1", nameFr: "Informatique 1", nameEn: "CS 1", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية تحضيري", nameFr: "2ème année prépa", nameEn: "2nd Preparatory Year",
                subjects: [
                    { id: "math2", nameAr: "رياضيات 2", nameFr: "Mathématiques 2", nameEn: "Mathematics 2", coef: 4, hasTD: true },
                    { id: "stat2", nameAr: "إحصاء 2", nameFr: "Statistiques 2", nameEn: "Statistics 2", coef: 3, hasTD: true },
                    { id: "compta2", nameAr: "محاسبة تحليلية", nameFr: "Comptabilité analytique", nameEn: "Cost Accounting", coef: 3, hasTD: true },
                    { id: "eco2", nameAr: "اقتصاد جزئي", nameFr: "Microéconomie", nameEn: "Microeconomics", coef: 3, hasTD: false },
                    { id: "mgmt", nameAr: "تسيير", nameFr: "Management", nameEn: "Management", coef: 3, hasTD: false },
                    { id: "fr2", nameAr: "فرنسية 2", nameFr: "Français 2", nameEn: "French 2", coef: 2, hasTD: true },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2, hasTD: true },
                    { id: "info2", nameAr: "إعلام آلي 2", nameFr: "Informatique 2", nameEn: "CS 2", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y3", nameAr: "السنة الثالثة", nameFr: "3ème Année", nameEn: "3rd Year",
                subjects: [
                    { id: "finance", nameAr: "مالية مؤسسة", nameFr: "Finance d'entreprise", nameEn: "Corporate Finance", coef: 4, hasTD: true },
                    { id: "marketing", nameAr: "تسويق", nameFr: "Marketing", nameEn: "Marketing", coef: 4, hasTD: true },
                    { id: "gestion", nameAr: "تسيير", nameFr: "Gestion", nameEn: "Management", coef: 3, hasTD: false },
                    { id: "compta3", nameAr: "محاسبة 3", nameFr: "Comptabilité 3", nameEn: "Accounting 3", coef: 3, hasTD: true },
                    { id: "droit2", nameAr: "قانون أعمال", nameFr: "Droit des affaires", nameEn: "Business Law", coef: 3, hasTD: false },
                    { id: "en3", nameAr: "إنجليزية أعمال", nameFr: "Anglais des affaires", nameEn: "Business English", coef: 2, hasTD: false },
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
                id: "y1", nameAr: "السنة الأولى", nameFr: "1ère Année", nameEn: "1st Year",
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
                id: "y2", nameAr: "السنة الثانية", nameFr: "2ème Année", nameEn: "2nd Year",
                subjects: [
                    { id: "math2", nameAr: "رياضيات 2", nameFr: "Mathématiques 2", nameEn: "Mathematics 2", coef: 5, hasTD: true },
                    { id: "eco2", nameAr: "نظرية اقتصادية", nameFr: "Théorie économique", nameEn: "Economic Theory", coef: 4, hasTD: true },
                    { id: "fin", nameAr: "مالية", nameFr: "Finance", nameEn: "Finance", coef: 4, hasTD: true },
                    { id: "mkting", nameAr: "تسويق", nameFr: "Marketing", nameEn: "Marketing", coef: 3, hasTD: false },
                    { id: "fr2", nameAr: "فرنسية 2", nameFr: "Français 2", nameEn: "French 2", coef: 2, hasTD: true },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais 2", nameEn: "English 2", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y3", nameAr: "السنة الثالثة", nameFr: "3ème Année", nameEn: "3rd Year",
                subjects: [
                    { id: "strat", nameAr: "استراتيجية", nameFr: "Stratégie d'entreprise", nameEn: "Business Strategy", coef: 5, hasTD: false },
                    { id: "fin2", nameAr: "مالية دولية", nameFr: "Finance internationale", nameEn: "International Finance", coef: 4, hasTD: true },
                    { id: "audit", nameAr: "مراجعة حسابات", nameFr: "Audit", nameEn: "Audit", coef: 4, hasTD: true },
                    { id: "mkting2", nameAr: "تسويق استراتيجي", nameFr: "Marketing stratégique", nameEn: "Strategic Marketing", coef: 3, hasTD: false },
                    { id: "en3", nameAr: "إنجليزية 3", nameFr: "Anglais 3", nameEn: "English 3", coef: 2, hasTD: false },
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
                id: "y1", nameAr: "السنة الأولى", nameFr: "1ère Année", nameEn: "1st Year",
                subjects: [
                    { id: "algo", nameAr: "خوارزميات وبرمجة", nameFr: "Algorithmique & Programmation", nameEn: "Algorithms & Programming", coef: 5, hasTD: true },
                    { id: "math", nameAr: "رياضيات", nameFr: "Mathématiques", nameEn: "Mathematics", coef: 4, hasTD: true },
                    { id: "sysinfo", nameAr: "نظم المعلومات", nameFr: "Systèmes d'information", nameEn: "Information Systems", coef: 3, hasTD: true },
                    { id: "eco", nameAr: "اقتصاد رقمي", nameFr: "Économie numérique", nameEn: "Digital Economy", coef: 3, hasTD: false },
                    { id: "en", nameAr: "إنجليزية", nameFr: "Anglais", nameEn: "English", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y2", nameAr: "السنة الثانية", nameFr: "2ème Année", nameEn: "2nd Year",
                subjects: [
                    { id: "bd", nameAr: "قواعد البيانات", nameFr: "Bases de données", nameEn: "Databases", coef: 5, hasTD: true },
                    { id: "reseaux", nameAr: "شبكات", nameFr: "Réseaux informatiques", nameEn: "Networks", coef: 4, hasTD: true },
                    { id: "webdev", nameAr: "تطوير ويب", nameFr: "Développement web", nameEn: "Web Development", coef: 4, hasTD: true },
                    { id: "mgmt", nameAr: "تسيير رقمي", nameFr: "Management numérique", nameEn: "Digital Management", coef: 3, hasTD: false },
                    { id: "en2", nameAr: "إنجليزية 2", nameFr: "Anglais tech.", nameEn: "Technical English", coef: 2, hasTD: true },
                ],
            },
            {
                id: "y3", nameAr: "السنة الثالثة", nameFr: "3ème Année", nameEn: "3rd Year",
                subjects: [
                    { id: "ai", nameAr: "ذكاء اصطناعي", nameFr: "Intelligence artificielle", nameEn: "Artificial Intelligence", coef: 5, hasTD: true },
                    { id: "cloud", nameAr: "حوسبة سحابية", nameFr: "Cloud Computing", nameEn: "Cloud Computing", coef: 4, hasTD: true },
                    { id: "erp", nameAr: "نظم تخطيط الموارد", nameFr: "ERP & SI de gestion", nameEn: "ERP Systems", coef: 4, hasTD: true },
                    { id: "mgmt2", nameAr: "إدارة المشاريع", nameFr: "Gestion de projets", nameEn: "Project Management", coef: 3, hasTD: false },
                    { id: "en3", nameAr: "إنجليزية 3", nameFr: "Anglais 3", nameEn: "English 3", coef: 2, hasTD: false },
                ],
            },
        ],
    },
    {
        id: "other",
        nameAr: "مدرسة أخرى",
        nameFr: "Autre école",
        nameEn: "Other School",
        acronym: "Autre",
        color: "#6366f1",
        years: [],
    },
];

// ─── i18n ──────────────────────────────────────────────────────────────────────

const i18n = {
    ar: {
        chooseSchool: "اختر المدرسة", chooseYear: "اختر السنة",
        exam: "امتحان /20", td: "TD /20",
        subjectAvg: "معدل", overall: "المعدل الإجمالي",
        totalCoef: "مجموع المعاملات", mention: "الملاحظة",
        reset: "إعادة تعيين", addExtra: "+ إضافة مقياس",
        addSubject: "+ إضافة مادة", customSchoolHint: "أضف موادك يدوياً",
        hasTD: "امتحان + TD", noTD: "امتحان فقط", gradeMode: "نظام التنقيط", td8Exam12: "TD /8 + امتحان /12", full20: "العلامة /20",
        coef: "م", name: "اسم المادة",
        mentions: { excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد", passable: "مقبول", fail: "راسب" },
    },
    fr: {
        chooseSchool: "Choisir l'école", chooseYear: "Choisir l'année",
        exam: "Examen /20", td: "TD /20",
        subjectAvg: "Moy.", overall: "Moyenne générale",
        totalCoef: "Total coefficients", mention: "Mention",
        reset: "Réinitialiser", addExtra: "+ Ajouter une matière",
        addSubject: "+ Ajouter une matière", customSchoolHint: "Ajoutez vos matières manuellement",
        hasTD: "Examen + TD", noTD: "Examen seul", gradeMode: "Mode de notation", td8Exam12: "TD /8 + Examen /12", full20: "Note /20",
        coef: "Coef.", name: "Nom de la matière",
        mentions: { excellent: "Excellent", veryGood: "Très Bien", good: "Bien", passable: "Passable", fail: "Échec" },
    },
    en: {
        chooseSchool: "Choose school", chooseYear: "Choose year",
        exam: "Exam /20", td: "TD /20",
        subjectAvg: "Avg.", overall: "Overall average",
        totalCoef: "Total coefficients", mention: "Mention",
        reset: "Reset", addExtra: "+ Add subject",
        addSubject: "+ Add subject", customSchoolHint: "Add your subjects manually",
        hasTD: "Exam + Tutorial", noTD: "Exam only", gradeMode: "Grading mode", td8Exam12: "TD /8 + Exam /12", full20: "Full mark /20",
        coef: "Coef.", name: "Subject name",
        mentions: { excellent: "Excellent", veryGood: "Very Good", good: "Good", passable: "Passable", fail: "Fail" },
    },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getMention(avg: number, t: typeof i18n.ar) {
    if (avg >= 16) return { label: t.mentions.excellent, color: "hsl(var(--success))" };
    if (avg >= 14) return { label: t.mentions.veryGood, color: "hsl(var(--primary))" };
    if (avg >= 12) return { label: t.mentions.good, color: "hsl(var(--muted-foreground))" };
    if (avg >= 10) return { label: t.mentions.passable, color: "hsl(var(--warning))" };
    return { label: t.mentions.fail, color: "hsl(var(--destructive))" };
}

function calcAvg(entry: GradeEntry, hasTD: boolean): number | null {
    const exam = parseFloat(entry.exam);
    if (isNaN(exam) || exam < 0 || exam > 20) return null;

    if (!hasTD) return exam;

    if (entry.mode === "td8exam12") {
        const td = parseFloat(entry.td);
        if (isNaN(td) || td < 0 || td > 8) return null;
        if (isNaN(exam) || exam < 0 || exam > 12) return null;
        return td + exam;
    }

    // full20: TD is /20 and exam is /20, weighted 40% / 60%.
    const td = parseFloat(entry.td);
    if (isNaN(td) || td < 0 || td > 20) return null;
    if (isNaN(exam) || exam < 0 || exam > 20) return null;
    return td * 0.4 + exam * 0.6;
}

let customId = 1;
function newCustomSubject(): Subject {
    return { id: `custom_${customId++}`, nameAr: "", nameFr: "", nameEn: "", coef: 2, hasTD: true, isCustom: true };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GradeInputs({ entry, onChange, hasTD, t, color }: {
    entry: GradeEntry; onChange: (patch: Partial<GradeEntry>) => void;
    hasTD: boolean; t: typeof i18n.ar; color: string;
}) {
    const isTD8Exam12 = entry.mode === "td8exam12";

    return (
        <div className="space-y-3">
            {hasTD && (
                <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">{t.gradeMode}</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onChange({ mode: "td8exam12" })}
                            className={`px-3 py-2 rounded-md border text-xs font-medium transition-colors ${isTD8Exam12
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            {t.td8Exam12}
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange({ mode: "full20" })}
                            className={`px-3 py-2 rounded-md border text-xs font-medium transition-colors ${!isTD8Exam12
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            {t.full20}
                        </button>
                    </div>
                </div>
            )}

            <div className={`grid gap-3 ${hasTD ? "grid-cols-2" : "grid-cols-1 max-w-[160px]"}`}>
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                        {hasTD && isTD8Exam12 ? t.exam.replace("/20", "/12") : t.exam}
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={hasTD && isTD8Exam12 ? 12 : 20}
                        step={0.25}
                        value={entry.exam}
                        onChange={(e) => onChange({ exam: e.target.value })}
                        placeholder="—"
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                        style={{ borderColor: entry.exam ? color + "50" : undefined }}
                    />
                </div>

                {hasTD && (
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                            {isTD8Exam12 ? t.td.replace("/20", "/8") : t.td}
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={isTD8Exam12 ? 8 : 20}
                            step={0.25}
                            value={entry.td}
                            onChange={(e) => onChange({ td: e.target.value })}
                            placeholder="—"
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                            style={{ borderColor: entry.td ? color + "50" : undefined }}
                        />
                    </div>
                )}
            </div>
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

    const school = SCHOOLS.find((s) => s.id === selectedSchool);
    const year = school?.years.find((y) => y.id === selectedYear);
    const isOther = selectedSchool === "other";

    const getEntry = (id: string): GradeEntry => grades[id] ?? { exam: "", td: "", mode: "td8exam12" };

    const updateGrade = useCallback((subjectId: string, patch: Partial<GradeEntry>) => {
        setGrades((prev) => ({ ...prev, [subjectId]: { ...{ exam: "", td: "", mode: "td8exam12" as GradeMode }, ...prev[subjectId], ...patch } }));
    }, []);

    const reset = () => { setGrades({}); setExtraSubjects([]); setCustomSubjects([]); };

    const updateCustomSubject = (list: Subject[], setList: (s: Subject[]) => void, id: string, patch: Partial<Subject>) =>
        setList(list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

    const presetSubjects = year?.subjects ?? [];
    const allSubjects = isOther ? customSubjects : [...presetSubjects, ...extraSubjects];

    let totalWeighted = 0, totalCoef = 0, filledCount = 0;
    const subjectResults = allSubjects.map((s) => {
        const entry = getEntry(s.id);
        const avg = calcAvg(entry, !!s.hasTD);
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
                <label className="block text-xs font-medium text-muted-foreground mb-2">{t.chooseSchool}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SCHOOLS.map((s) => (
                        <button key={s.id}
                            onClick={() => { setSelectedSchool(s.id); setSelectedYear(""); setGrades({}); setExtraSubjects([]); setCustomSubjects([]); }}
                            className={`px-3 py-2.5 rounded-md border text-left transition-colors ${selectedSchool === s.id ? "text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                            style={selectedSchool === s.id ? { background: s.color + "1a", borderColor: s.color + "80" } : {}}
                        >
                            <span className="block text-xs font-semibold" style={{ color: s.color }}>{s.acronym}</span>
                            <span className="block text-[10px] leading-tight mt-0.5 text-muted-foreground">
                                {lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Year selector */}
            {school && !isOther && (
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">{t.chooseYear}</label>
                    <div className="flex flex-wrap gap-2">
                        {school.years.map((y) => (
                            <button key={y.id}
                                onClick={() => { setSelectedYear(y.id); setGrades({}); setExtraSubjects([]); }}
                                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${selectedYear === y.id ? "text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                                style={selectedYear === y.id ? { background: schoolColor + "1a", borderColor: schoolColor + "80" } : {}}
                            >
                                {lang === "ar" ? y.nameAr : lang === "fr" ? y.nameFr : y.nameEn}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOther && <p className="text-sm text-muted-foreground italic">{t.customSchoolHint}</p>}

            {(isOther || year) && (
                <>
                    {/* Progress bar */}
                    {allSubjects.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: schoolColor }} />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">{filledCount}/{allSubjects.length}</span>
                        </div>
                    )}

                    {/* Subjects */}
                    <div className="space-y-2">
                        {subjectResults.map((s) => {
                            const entry = getEntry(s.id);
                            const isOpen = expandedSubject === s.id;
                            return (
                                <div key={s.id} className={`rounded-lg border overflow-hidden transition-colors ${isOpen ? "bg-muted/30" : "border-border bg-card hover:bg-muted/30"}`}
                                    style={{ borderColor: isOpen ? schoolColor + "50" : undefined }}>
                                    <div
                                        className="w-full"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setExpandedSubject(isOpen ? null : s.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setExpandedSubject(isOpen ? null : s.id);
                                            }
                                        }}
                                    >
                                        <div className="w-full flex items-center justify-between px-4 py-3 gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold"
                                                    style={{ background: schoolColor + "22", color: schoolColor }}>{s.coef}</span>
                                                <div className="min-w-0 text-left">
                                                    {s.isCustom ? (
                                                        <input
                                                            value={lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}
                                                            onChange={(e) => {
                                                                const patch = lang === "ar" ? { nameAr: e.target.value } : lang === "fr" ? { nameFr: e.target.value } : { nameEn: e.target.value };
                                                                if (isOther) updateCustomSubject(customSubjects, setCustomSubjects, s.id, patch);
                                                                else updateCustomSubject(extraSubjects, setExtraSubjects, s.id, patch);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            placeholder={t.name}
                                                            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border w-full"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {lang === "ar" ? s.nameAr : lang === "fr" ? s.nameFr : s.nameEn}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground">{s.hasTD ? t.hasTD : t.noTD}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {s.avg !== null && (
                                                    <span className="text-sm font-semibold tabular-nums" style={{ color: getMention(s.avg, t).color }}>
                                                        {s.avg.toFixed(2)}
                                                    </span>
                                                )}
                                                {s.isCustom && (
                                                    <>
                                                        <input type="number" min={1} max={10} value={s.coef}
                                                            onChange={(e) => {
                                                                const patch = { coef: parseInt(e.target.value) || 1 };
                                                                if (isOther) updateCustomSubject(customSubjects, setCustomSubjects, s.id, patch);
                                                                else updateCustomSubject(extraSubjects, setExtraSubjects, s.id, patch);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            className="w-10 rounded-md border border-input bg-transparent text-xs text-foreground text-center focus:outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isOther) setCustomSubjects(p => p.filter(x => x.id !== s.id));
                                                                else setExtraSubjects(p => p.filter(x => x.id !== s.id));
                                                            }}
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div
                                                className="px-4 pb-4 border-t border-border pt-3"
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            >
                                                <GradeInputs entry={entry} onChange={(p) => updateGrade(s.id, p)} hasTD={!!s.hasTD} t={t} color={schoolColor} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add subject */}
                    <button
                        onClick={() => isOther ? setCustomSubjects(p => [...p, newCustomSubject()]) : setExtraSubjects(p => [...p, newCustomSubject()])}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-dashed border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        {isOther ? t.addSubject : t.addExtra}
                    </button>

                    {/* Result */}
                    {allSubjects.length > 0 && (
                        <div className="mt-4 rounded-lg border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-6">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">{t.overall}</p>
                                <p className="font-display text-4xl font-semibold tracking-tight tabular-nums" style={{ color: mention?.color ?? "hsl(var(--foreground))" }}>
                                    {overall !== null ? overall.toFixed(2) : "—"}
                                </p>
                                <p className="text-sm mt-1 font-medium" style={{ color: mention?.color ?? "hsl(var(--muted-foreground))" }}>
                                    {mention?.label ?? ""}
                                </p>
                            </div>
                            <div className="text-right space-y-2">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{t.totalCoef}</p>
                                    <p className="text-2xl font-semibold" style={{ color: schoolColor }}>{totalCoef}</p>
                                </div>
                                <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-medium transition-colors ml-auto">
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