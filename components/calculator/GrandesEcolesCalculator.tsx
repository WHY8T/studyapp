
"use client";

import { useState, useCallback } from "react";
import {
    RefreshCw,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Plus,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────

type Subject = {
    id: string;
    nameAr: string;
    nameFr: string;
    nameEn: string;
    coef: number;
    hasTD: boolean;
    tdWeight?: number;
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

type Grades = Record<string, { exam: string; td: string }>;

// ─── Data ─────────────────────────────────────────────────────

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
                nameAr: "السنة الأولى",
                nameFr: "1ère année",
                nameEn: "1st Year",
                subjects: [
                    {
                        id: "math1",
                        nameAr: "رياضيات",
                        nameFr: "Mathématiques",
                        nameEn: "Mathematics",
                        coef: 4,
                        hasTD: true,
                    },
                ],
            },
        ],
    },

    {
        id: "other",
        nameAr: "مدرسة أخرى",
        nameFr: "Autre école",
        nameEn: "Other School",
        acronym: "OTHER",
        color: "#6366f1",
        years: [],
    },
];

// ─── i18n ─────────────────────────────────────────────────────

const i18n = {
    ar: {
        chooseSchool: "اختر المدرسة",
        chooseYear: "اختر السنة",
        exam: "امتحان /20",
        td: "TD /20",
        overall: "المعدل العام",
        totalCoef: "مجموع المعاملات",
        reset: "إعادة تعيين",
        hasTD: "يحتوي TD",
        noTD: "بدون TD",
    },
    fr: {
        chooseSchool: "Choisir l'école",
        chooseYear: "Choisir l'année",
        exam: "Examen /20",
        td: "TD /20",
        overall: "Moyenne générale",
        totalCoef: "Total coefficients",
        reset: "Réinitialiser",
        hasTD: "Avec TD",
        noTD: "Sans TD",
    },
    en: {
        chooseSchool: "Choose school",
        chooseYear: "Choose year",
        exam: "Exam /20",
        td: "TD /20",
        overall: "Overall average",
        totalCoef: "Total coefficients",
        reset: "Reset",
        hasTD: "Has TD",
        noTD: "No TD",
    },
};

// ─── Helpers ─────────────────────────────────────────────────────

function getMention(avg: number) {
    if (avg >= 16) return { label: "Excellent", color: "#10b981" };
    if (avg >= 14) return { label: "Very Good", color: "#3b82f6" };
    if (avg >= 12) return { label: "Good", color: "#f59e0b" };
    if (avg >= 10) return { label: "Passable", color: "#f97316" };
    return { label: "Fail", color: "#ef4444" };
}

function calcSubjectAvg(
    exam: string,
    td: string,
    hasTD: boolean,
    tdWeight = 40
): number | null {
    const e = parseFloat(exam);

    if (isNaN(e) || e < 0 || e > 20) return null;

    if (hasTD) {
        const td_ = parseFloat(td);

        if (isNaN(td_) || td_ < 0 || td_ > 20) return null;

        return td_ * (tdWeight / 100) + e * (1 - tdWeight / 100);
    }

    return e;
}

// ─── Component ─────────────────────────────────────────────────────

export default function GrandesEcolesCalculator({
    lang,
}: {
    lang: "ar" | "fr" | "en";
    isRTL: boolean;
}) {
    const t = i18n[lang];

    const [selectedSchool, setSelectedSchool] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [grades, setGrades] = useState<Grades>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);

    const [newSubject, setNewSubject] = useState({
        name: "",
        coef: 1,
        hasTD: true,
        tdWeight: 40,
    });

    const school = SCHOOLS.find((s) => s.id === selectedSchool);

    const year =
        selectedSchool === "other"
            ? { subjects: [] }
            : school?.years.find((y) => y.id === selectedYear);

    const allSubjects = [...(year?.subjects ?? []), ...customSubjects];

    const updateGrade = useCallback(
        (subjectId: string, field: "exam" | "td", value: string) => {
            setGrades((prev) => ({
                ...prev,
                [subjectId]: {
                    ...prev[subjectId],
                    exam: prev[subjectId]?.exam ?? "",
                    td: prev[subjectId]?.td ?? "",
                    [field]: value,
                },
            }));
        },
        []
    );

    const addCustomSubject = () => {
        if (!newSubject.name.trim()) return;

        setCustomSubjects((prev) => [
            ...prev,
            {
                id: `custom-${Date.now()}`,
                nameAr: newSubject.name,
                nameFr: newSubject.name,
                nameEn: newSubject.name,
                coef: newSubject.coef,
                hasTD: newSubject.hasTD,
                tdWeight: newSubject.tdWeight,
            },
        ]);

        setNewSubject({
            name: "",
            coef: 1,
            hasTD: true,
            tdWeight: 40,
        });
    };

    const reset = () => {
        setGrades({});
        setCustomSubjects([]);
    };

    let totalWeighted = 0;
    let totalCoef = 0;

    const subjectResults = allSubjects.map((s) => {
        const g = grades[s.id];

        const avg = g
            ? calcSubjectAvg(g.exam, g.td, s.hasTD, s.tdWeight ?? 40)
            : null;

        if (avg !== null) {
            totalWeighted += avg * s.coef;
            totalCoef += s.coef;
        }

        return { ...s, avg };
    });

    const overall = totalCoef > 0 ? totalWeighted / totalCoef : null;
    const mention = overall !== null ? getMention(overall) : null;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
                {SCHOOLS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => {
                            setSelectedSchool(s.id);
                            setSelectedYear("");
                            setGrades({});
                            setCustomSubjects([]);
                        }}
                        className="px-3 py-3 rounded-xl"
                        style={{ background: s.color }}
                    >
                        {lang === "ar"
                            ? s.nameAr
                            : lang === "fr"
                                ? s.nameFr
                                : s.nameEn}
                    </button>
                ))}
            </div>

            {selectedSchool === "other" && (
                <div className="space-y-3 border p-4 rounded-xl">
                    <input
                        value={newSubject.name}
                        onChange={(e) =>
                            setNewSubject({
                                ...newSubject,
                                name: e.target.value,
                            })
                        }
                        placeholder="Subject name"
                        className="w-full px-3 py-2 rounded"
                    />

                    <input
                        type="number"
                        value={newSubject.coef}
                        onChange={(e) =>
                            setNewSubject({
                                ...newSubject,
                                coef: Number(e.target.value),
                            })
                        }
                        className="w-full px-3 py-2 rounded"
                    />

                    <input
                        type="number"
                        value={newSubject.tdWeight}
                        onChange={(e) =>
                            setNewSubject({
                                ...newSubject,
                                tdWeight: Number(e.target.value),
                            })
                        }
                        className="w-full px-3 py-2 rounded"
                    />

                    <button
                        onClick={addCustomSubject}
                        className="px-4 py-2 rounded bg-indigo-500 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Subject
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {subjectResults.map((s) => {
                    const g = grades[s.id] ?? { exam: "", td: "" };
                    const isOpen = expandedSubject === s.id;

                    return (
                        <div key={s.id} className="border rounded-xl">
                            <button
                                className="w-full flex justify-between px-4 py-3"
                                onClick={() =>
                                    setExpandedSubject(isOpen ? null : s.id)
                                }
                            >
                                <span>{s.nameEn}</span>

                                <div className="flex items-center gap-2">
                                    {s.avg !== null && (
                                        <span>{s.avg.toFixed(2)}</span>
                                    )}
                                    {isOpen ? (
                                        <ChevronUp size={16} />
                                    ) : (
                                        <ChevronDown size={16} />
                                    )}
                                </div>
                            </button>

                            {isOpen && (
                                <div className="grid grid-cols-2 gap-3 p-4">
                                    <input
                                        type="number"
                                        value={g.exam}
                                        onChange={(e) =>
                                            updateGrade(
                                                s.id,
                                                "exam",
                                                e.target.value
                                            )
                                        }
                                        placeholder={t.exam}
                                        className="px-3 py-2 rounded"
                                    />

                                    {s.hasTD && (
                                        <input
                                            type="number"
                                            value={g.td}
                                            onChange={(e) =>
                                                updateGrade(
                                                    s.id,
                                                    "td",
                                                    e.target.value
                                                )
                                            }
                                            placeholder={t.td}
                                            className="px-3 py-2 rounded"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="border rounded-2xl p-6">
                <p>{t.overall}</p>

                <p
                    className="text-4xl font-bold"
                    style={{ color: mention?.color }}
                >
                    {overall?.toFixed(2) ?? "—"}
                </p>

                <p>{mention?.label}</p>

                <p>
                    {t.totalCoef}: {totalCoef}
                </p>

                <button
                    onClick={reset}
                    className="mt-3 flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    {t.reset}
                </button>
            </div>
        </div>
    );
}

