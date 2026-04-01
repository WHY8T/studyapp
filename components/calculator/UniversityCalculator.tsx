"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, RefreshCw, BookOpen } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EvalType = "exam_only" | "exam_td" | "exam_tp" | "exam_td_tp";

type Module = {
    id: string;
    name: string;
    coef: number;
    evalType: EvalType;
    examGrade: string;
    tdGrade: string;
    tpGrade: string;
    // weights in % (must sum to 100 if using multiple)
    examWeight: number;
    tdWeight: number;
    tpWeight: number;
};

const i18n = {
    ar: {
        addModule: "إضافة مقياس",
        moduleName: "اسم المقياس",
        coef: "المعامل",
        evalType: "نوع التقييم",
        examOnly: "امتحان فقط",
        examTD: "امتحان + TD",
        examTP: "امتحان + TP",
        examTDTP: "امتحان + TD + TP",
        exam: "امتحان",
        td: "TD",
        tp: "TP",
        weight: "النسبة %",
        moduleAvg: "معدل المقياس",
        overall: "المعدل الإجمالي",
        totalCoef: "مجموع المعاملات",
        reset: "إعادة تعيين",
        placeholder: "مثال: رياضيات 1",
        mentions: { excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد", passable: "مقبول", fail: "راسب" },
        noModules: "لم تضف أي مقياس بعد",
        noModulesHint: "اضغط على «إضافة مقياس» للبدء",
        weightSum: "مجموع النسب يجب أن يساوي 100%",
        invalidGrade: "قيمة غير صحيحة",
        semester: "الفصل الدراسي",
        addSemester: "إضافة فصل آخر",
    },
    fr: {
        addModule: "Ajouter un module",
        moduleName: "Nom du module",
        coef: "Coef.",
        evalType: "Type d'évaluation",
        examOnly: "Examen seul",
        examTD: "Examen + TD",
        examTP: "Examen + TP",
        examTDTP: "Examen + TD + TP",
        exam: "Examen",
        td: "TD",
        tp: "TP",
        weight: "Poids %",
        moduleAvg: "Moy. module",
        overall: "Moyenne générale",
        totalCoef: "Total coefficients",
        reset: "Réinitialiser",
        placeholder: "Ex : Mathématiques 1",
        mentions: { excellent: "Excellent", veryGood: "Très Bien", good: "Bien", passable: "Passable", fail: "Échec" },
        noModules: "Aucun module ajouté",
        noModulesHint: "Cliquez sur « Ajouter un module » pour commencer",
        weightSum: "La somme des poids doit être 100%",
        invalidGrade: "Note invalide",
        semester: "Semestre",
        addSemester: "Ajouter un semestre",
    },
    en: {
        addModule: "Add Module",
        moduleName: "Module name",
        coef: "Coef.",
        evalType: "Evaluation type",
        examOnly: "Exam only",
        examTD: "Exam + Tutorial",
        examTP: "Exam + Lab",
        examTDTP: "Exam + Tutorial + Lab",
        exam: "Exam",
        td: "Tutorial",
        tp: "Lab",
        weight: "Weight %",
        moduleAvg: "Module avg.",
        overall: "Overall average",
        totalCoef: "Total coefs",
        reset: "Reset",
        placeholder: "e.g. Mathematics 1",
        mentions: { excellent: "Excellent", veryGood: "Very Good", good: "Good", passable: "Passable", fail: "Fail" },
        noModules: "No modules added yet",
        noModulesHint: "Click « Add Module » to get started",
        weightSum: "Weights must sum to 100%",
        invalidGrade: "Invalid grade",
        semester: "Semester",
        addSemester: "Add another semester",
    },
};

function getMention(avg: number, t: typeof i18n.ar) {
    if (avg >= 16) return { label: t.mentions.excellent, color: "#10b981" };
    if (avg >= 14) return { label: t.mentions.veryGood, color: "#3b82f6" };
    if (avg >= 12) return { label: t.mentions.good, color: "#f59e0b" };
    if (avg >= 10) return { label: t.mentions.passable, color: "#f97316" };
    return { label: t.mentions.fail, color: "#ef4444" };
}

function calcModuleAvg(m: Module): number | null {
    const exam = parseFloat(m.examGrade);
    if (isNaN(exam) || exam < 0 || exam > 20) return null;

    if (m.evalType === "exam_only") return exam;

    const td = parseFloat(m.tdGrade);
    const tp = parseFloat(m.tpGrade);

    if (m.evalType === "exam_td") {
        if (isNaN(td) || td < 0 || td > 20) return null;
        return (exam * m.examWeight + td * m.tdWeight) / 100;
    }
    if (m.evalType === "exam_tp") {
        if (isNaN(tp) || tp < 0 || tp > 20) return null;
        return (exam * m.examWeight + tp * m.tpWeight) / 100;
    }
    if (m.evalType === "exam_td_tp") {
        if (isNaN(td) || td < 0 || td > 20) return null;
        if (isNaN(tp) || tp < 0 || tp > 20) return null;
        return (exam * m.examWeight + td * m.tdWeight + tp * m.tpWeight) / 100;
    }
    return null;
}

function defaultWeights(evalType: EvalType): { exam: number; td: number; tp: number } {
    switch (evalType) {
        case "exam_only": return { exam: 100, td: 0, tp: 0 };
        case "exam_td": return { exam: 60, td: 40, tp: 0 };
        case "exam_tp": return { exam: 60, td: 0, tp: 40 };
        case "exam_td_tp": return { exam: 60, td: 20, tp: 20 };
    }
}

let idCounter = 1;
function newModule(): Module {
    const id = `mod_${idCounter++}`;
    return {
        id,
        name: "",
        coef: 3,
        evalType: "exam_td",
        examGrade: "",
        tdGrade: "",
        tpGrade: "",
        examWeight: 60,
        tdWeight: 40,
        tpWeight: 0,
    };
}

// ─── Component ─────────────────────────────────────────────────────────────────

type Semester = { id: string; modules: Module[] };

export default function UniversityCalculator({
    lang,
    isRTL,
}: {
    lang: "ar" | "fr" | "en";
    isRTL: boolean;
}) {
    const t = i18n[lang];
    const [semesters, setSemesters] = useState<Semester[]>([
        { id: "s1", modules: [] },
    ]);
    const [activeSemester, setActiveSemester] = useState("s1");

    const current = semesters.find((s) => s.id === activeSemester)!;

    const updateModules = useCallback(
        (semId: string, updater: (modules: Module[]) => Module[]) => {
            setSemesters((prev) =>
                prev.map((s) => (s.id === semId ? { ...s, modules: updater(s.modules) } : s))
            );
        },
        []
    );

    const addModule = () =>
        updateModules(activeSemester, (m) => [...m, newModule()]);

    const removeModule = (id: string) =>
        updateModules(activeSemester, (m) => m.filter((x) => x.id !== id));

    const updateModule = (id: string, patch: Partial<Module>) =>
        updateModules(activeSemester, (modules) =>
            modules.map((m) => {
                if (m.id !== id) return m;
                const updated = { ...m, ...patch };
                if (patch.evalType) {
                    const w = defaultWeights(patch.evalType);
                    updated.examWeight = w.exam;
                    updated.tdWeight = w.td;
                    updated.tpWeight = w.tp;
                }
                return updated;
            })
        );

    const addSemester = () => {
        const id = `s${semesters.length + 1}`;
        setSemesters((prev) => [...prev, { id, modules: [] }]);
        setActiveSemester(id);
    };

    const resetAll = () =>
        setSemesters((prev) => prev.map((s) => ({ ...s, modules: [] })));

    // Compute overall for current semester
    let totalWeighted = 0;
    let totalCoef = 0;
    const computed = current.modules.map((m) => ({ ...m, avg: calcModuleAvg(m) }));
    computed.forEach(({ avg, coef }) => {
        if (avg !== null) {
            totalWeighted += avg * coef;
            totalCoef += coef;
        }
    });
    const overall = totalCoef > 0 ? totalWeighted / totalCoef : null;
    const mention = overall !== null ? getMention(overall, t) : null;

    return (
        <div className="space-y-5">
            {/* Semester tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {semesters.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSemester(s.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${activeSemester === s.id
                                ? "bg-[#00b7ff] text-black border-transparent shadow-lg shadow-[#00b7ff]/20"
                                : "border-white/10 text-white/50 hover:text-white bg-white/[0.03]"
                            }`}
                    >
                        {t.semester} {i + 1}
                    </button>
                ))}
                {semesters.length < 4 && (
                    <button
                        onClick={addSemester}
                        className="px-4 py-1.5 rounded-full text-sm border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
                    >
                        + {t.addSemester}
                    </button>
                )}
            </div>

            {/* Empty state */}
            {current.modules.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                    <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-white/40 font-medium">{t.noModules}</p>
                    <p className="text-white/20 text-sm mt-1">{t.noModulesHint}</p>
                </div>
            )}

            {/* Module list */}
            {current.modules.length > 0 && (
                <div className="space-y-3">
                    {computed.map((m) => {
                        const weightSum =
                            m.evalType === "exam_only"
                                ? 100
                                : m.evalType === "exam_td"
                                    ? m.examWeight + m.tdWeight
                                    : m.evalType === "exam_tp"
                                        ? m.examWeight + m.tpWeight
                                        : m.examWeight + m.tdWeight + m.tpWeight;
                        const weightOk = weightSum === 100;

                        return (
                            <div
                                key={m.id}
                                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
                            >
                                {/* Row 1: Name + coef + type + delete */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="text"
                                        value={m.name}
                                        onChange={(e) => updateModule(m.id, { name: e.target.value })}
                                        placeholder={t.placeholder}
                                        className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/40"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-white/30">{t.coef}</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={m.coef}
                                            onChange={(e) => updateModule(m.id, { coef: parseInt(e.target.value) || 1 })}
                                            className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-[#00b7ff]/40"
                                        />
                                    </div>
                                    <select
                                        value={m.evalType}
                                        onChange={(e) => updateModule(m.id, { evalType: e.target.value as EvalType })}
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/70 focus:outline-none focus:border-[#00b7ff]/40"
                                    >
                                        <option value="exam_only">{t.examOnly}</option>
                                        <option value="exam_td">{t.examTD}</option>
                                        <option value="exam_tp">{t.examTP}</option>
                                        <option value="exam_td_tp">{t.examTDTP}</option>
                                    </select>
                                    <button
                                        onClick={() => removeModule(m.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Row 2: Grades + weights */}
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Exam */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-white/30">{t.exam}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            step={0.25}
                                            value={m.examGrade}
                                            onChange={(e) => updateModule(m.id, { examGrade: e.target.value })}
                                            placeholder="—"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/40"
                                        />
                                        {m.evalType !== "exam_only" && (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={m.examWeight}
                                                    onChange={(e) => updateModule(m.id, { examWeight: parseInt(e.target.value) || 0 })}
                                                    className="w-12 bg-white/5 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white/60 focus:outline-none"
                                                />
                                                <span className="text-[10px] text-white/20">%</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* TD */}
                                    {(m.evalType === "exam_td" || m.evalType === "exam_td_tp") && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-white/30">{t.td}</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={20}
                                                step={0.25}
                                                value={m.tdGrade}
                                                onChange={(e) => updateModule(m.id, { tdGrade: e.target.value })}
                                                placeholder="—"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/40"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={m.tdWeight}
                                                    onChange={(e) => updateModule(m.id, { tdWeight: parseInt(e.target.value) || 0 })}
                                                    className="w-12 bg-white/5 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white/60 focus:outline-none"
                                                />
                                                <span className="text-[10px] text-white/20">%</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* TP */}
                                    {(m.evalType === "exam_tp" || m.evalType === "exam_td_tp") && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-white/30">{t.tp}</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={20}
                                                step={0.25}
                                                value={m.tpGrade}
                                                onChange={(e) => updateModule(m.id, { tpGrade: e.target.value })}
                                                placeholder="—"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/40"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={m.tpWeight}
                                                    onChange={(e) => updateModule(m.id, { tpWeight: parseInt(e.target.value) || 0 })}
                                                    className="w-12 bg-white/5 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white/60 focus:outline-none"
                                                />
                                                <span className="text-[10px] text-white/20">%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Row 3: Result + warnings */}
                                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        {!weightOk && m.evalType !== "exam_only" && (
                                            <span className="text-xs text-orange-400 font-medium">
                                                ⚠ {t.weightSum} ({weightSum}%)
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {m.avg !== null ? (
                                            <span
                                                className="text-sm font-bold tabular-nums"
                                                style={{ color: getMention(m.avg, t).color }}
                                            >
                                                {m.avg.toFixed(2)} / 20
                                            </span>
                                        ) : (
                                            <span className="text-xs text-white/20">{t.moduleAvg}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add button */}
            <button
                onClick={addModule}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#00b7ff]/30 text-[#00b7ff]/70 hover:text-[#00b7ff] hover:border-[#00b7ff]/60 hover:bg-[#00b7ff]/5 transition-all text-sm font-medium"
            >
                <Plus className="w-4 h-4" />
                {t.addModule}
            </button>

            {/* Result card */}
            {current.modules.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">
                            {t.overall}
                        </p>
                        <p className="text-5xl font-black tabular-nums" style={{ color: mention?.color ?? "white" }}>
                            {overall !== null ? overall.toFixed(2) : "—"}
                        </p>
                        <p className="text-sm mt-1 font-medium" style={{ color: mention?.color ?? "#ffffff50" }}>
                            {mention?.label ?? ""}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">
                            {t.totalCoef}
                        </p>
                        <p className="text-2xl font-bold text-white/60">{totalCoef}</p>
                        <button
                            onClick={resetAll}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {t.reset}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}