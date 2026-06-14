"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, RefreshCw, BookOpen } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Module = {
    id: string;
    name: string;
    coef: number;
    grade: string;
};

const i18n = {
    ar: {
        addModule: "إضافة مقياس",
        moduleName: "اسم المقياس",
        coef: "المعامل",
        note: "النقطة /20",
        moduleAvg: "معدل المقياس",
        overall: "المعدل الإجمالي",
        totalCoef: "مجموع المعاملات",
        reset: "إعادة تعيين",
        placeholder: "مثال: رياضيات 1",
        mentions: { excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد", passable: "مقبول", fail: "راسب" },
        noModules: "لم تضف أي مقياس بعد",
        noModulesHint: "اضغط على «إضافة مقياس» للبدء",
        semester: "الفصل الدراسي",
        addSemester: "إضافة فصل آخر",
    },
    fr: {
        addModule: "Ajouter un module",
        moduleName: "Nom du module",
        coef: "Coef.",
        note: "Note /20",
        moduleAvg: "Moy. module",
        overall: "Moyenne générale",
        totalCoef: "Total coefficients",
        reset: "Réinitialiser",
        placeholder: "Ex : Mathématiques 1",
        mentions: { excellent: "Excellent", veryGood: "Très Bien", good: "Bien", passable: "Passable", fail: "Échec" },
        noModules: "Aucun module ajouté",
        noModulesHint: "Cliquez sur « Ajouter un module » pour commencer",
        semester: "Semestre",
        addSemester: "Ajouter un semestre",
    },
    en: {
        addModule: "Add Module",
        moduleName: "Module name",
        coef: "Coef.",
        note: "Grade /20",
        moduleAvg: "Module avg.",
        overall: "Overall average",
        totalCoef: "Total coefs",
        reset: "Reset",
        placeholder: "e.g. Mathematics 1",
        mentions: { excellent: "Excellent", veryGood: "Very Good", good: "Good", passable: "Passable", fail: "Fail" },
        noModules: "No modules added yet",
        noModulesHint: "Click « Add Module » to get started",
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
    const n = parseFloat(m.grade);
    if (isNaN(n) || n < 0 || n > 20) return null;
    return n;
}

let idCounter = 1;
function newModule(): Module {
    return { id: `mod_${idCounter++}`, name: "", coef: 3, grade: "" };
}

type Semester = { id: string; modules: Module[] };

export default function UniversityCalculator({
    lang,
    isRTL,
}: {
    lang: "ar" | "fr" | "en";
    isRTL: boolean;
}) {
    const t = i18n[lang];
    const [semesters, setSemesters] = useState<Semester[]>([{ id: "s1", modules: [] }]);
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

    const addModule = () => updateModules(activeSemester, (m) => [...m, newModule()]);
    const removeModule = (id: string) => updateModules(activeSemester, (m) => m.filter((x) => x.id !== id));
    const updateModule = (id: string, patch: Partial<Module>) =>
        updateModules(activeSemester, (modules) => modules.map((m) => m.id !== id ? m : { ...m, ...patch }));

    const addSemester = () => {
        const id = `s${semesters.length + 1}`;
        setSemesters((prev) => [...prev, { id, modules: [] }]);
        setActiveSemester(id);
    };

    const resetAll = () => setSemesters((prev) => prev.map((s) => ({ ...s, modules: [] })));

    let totalWeighted = 0;
    let totalCoef = 0;
    const computed = current.modules.map((m) => ({ ...m, avg: calcModuleAvg(m) }));
    computed.forEach(({ avg, coef }) => {
        if (avg !== null) { totalWeighted += avg * coef; totalCoef += coef; }
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
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${activeSemester === s.id ? "bg-[#00b7ff] text-black border-transparent shadow-lg shadow-[#00b7ff]/20" : "border-white/10 text-white/50 hover:text-white bg-white/[0.03]"}`}
                    >
                        {t.semester} {i + 1}
                    </button>
                ))}
                {semesters.length < 4 && (
                    <button onClick={addSemester} className="px-4 py-1.5 rounded-full text-sm border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all">
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
                    {computed.map((m) => (
                        <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
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
                                        type="number" min={1} max={10}
                                        value={m.coef}
                                        onChange={(e) => updateModule(m.id, { coef: parseInt(e.target.value) || 1 })}
                                        className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-[#00b7ff]/40"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-white/30">{t.note}</span>
                                    <input
                                        type="number" min={0} max={20} step={0.25}
                                        value={m.grade}
                                        onChange={(e) => updateModule(m.id, { grade: e.target.value })}
                                        placeholder="—"
                                        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00b7ff]/40"
                                    />
                                </div>
                                <button onClick={() => removeModule(m.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex justify-end pt-1 border-t border-white/5">
                                {m.avg !== null ? (
                                    <span className="text-sm font-bold tabular-nums" style={{ color: getMention(m.avg, t).color }}>
                                        {m.avg.toFixed(2)} / 20
                                    </span>
                                ) : (
                                    <span className="text-xs text-white/20">{t.moduleAvg}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={addModule} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#00b7ff]/30 text-[#00b7ff]/70 hover:text-[#00b7ff] hover:border-[#00b7ff]/60 hover:bg-[#00b7ff]/5 transition-all text-sm font-medium">
                <Plus className="w-4 h-4" />
                {t.addModule}
            </button>

            {current.modules.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-wrap items-center justify-between gap-6">
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
                        <button onClick={resetAll} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all">
                            <RefreshCw className="w-3.5 h-3.5" />
                            {t.reset}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}