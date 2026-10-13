"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, RefreshCw, BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type GradeMode = "note20" | "td8exam12" | "td20exam20";

type Module = {
    id: string;
    name: string;
    coef: number;
    mode: GradeMode;
    note: string;
    td: string;
    exam: string;
};

const i18n = {
    ar: {
        addModule: "إضافة مقياس", moduleName: "اسم المقياس", coef: "المعامل",
        note20: "نقطة /20", td8exam12: "TD /8 + امتحان /12", td20exam20: "TD /20 + امتحان /20",
        note: "النقطة /20", td: "TD", exam: "امتحان",
        moduleAvg: "معدل المقياس", overall: "المعدل الإجمالي", totalCoef: "مجموع المعاملات",
        reset: "إعادة تعيين", placeholder: "مثال: رياضيات 1",
        mentions: { excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد", passable: "مقبول", fail: "راسب" },
        noModules: "لم تضف أي مقياس بعد", noModulesHint: "اضغط على «إضافة مقياس» للبدء",
        semester: "الفصل الدراسي", addSemester: "إضافة فصل آخر", inputMode: "طريقة الإدخال",
    },
    fr: {
        addModule: "Ajouter un module", moduleName: "Nom du module", coef: "Coef.",
        note20: "Note /20", td8exam12: "TD /8 + Examen /12", td20exam20: "TD /20 + Examen /20",
        note: "Note /20", td: "TD", exam: "Examen",
        moduleAvg: "Moy. module", overall: "Moyenne générale", totalCoef: "Total coefficients",
        reset: "Réinitialiser", placeholder: "Ex : Mathématiques 1",
        mentions: { excellent: "Excellent", veryGood: "Très Bien", good: "Bien", passable: "Passable", fail: "Échec" },
        noModules: "Aucun module ajouté", noModulesHint: "Cliquez sur « Ajouter un module » pour commencer",
        semester: "Semestre", addSemester: "Ajouter un semestre", inputMode: "Mode de saisie",
    },
    en: {
        addModule: "Add Module", moduleName: "Module name", coef: "Coef.",
        note20: "Grade /20", td8exam12: "TD /8 + Exam /12", td20exam20: "TD /20 + Exam /20",
        note: "Grade /20", td: "TD", exam: "Exam",
        moduleAvg: "Module avg.", overall: "Overall average", totalCoef: "Total coefs",
        reset: "Reset", placeholder: "e.g. Mathematics 1",
        mentions: { excellent: "Excellent", veryGood: "Very Good", good: "Good", passable: "Passable", fail: "Fail" },
        noModules: "No modules added yet", noModulesHint: "Click « Add Module » to get started",
        semester: "Semester", addSemester: "Add another semester", inputMode: "Input mode",
    },
};

function getMention(avg: number, t: typeof i18n.ar) {
    if (avg >= 16) return { label: t.mentions.excellent, color: "hsl(var(--success))" };
    if (avg >= 14) return { label: t.mentions.veryGood, color: "hsl(var(--primary))" };
    if (avg >= 12) return { label: t.mentions.good, color: "hsl(var(--muted-foreground))" };
    if (avg >= 10) return { label: t.mentions.passable, color: "hsl(var(--warning))" };
    return { label: t.mentions.fail, color: "hsl(var(--destructive))" };
}

function calcModuleAvg(m: Module): number | null {
    if (m.mode === "note20") {
        const n = parseFloat(m.note);
        if (isNaN(n) || n < 0 || n > 20) return null;
        return n;
    }
    if (m.mode === "td8exam12") {
        const td = parseFloat(m.td);
        const exam = parseFloat(m.exam);
        if (isNaN(td) || td < 0 || td > 8) return null;
        if (isNaN(exam) || exam < 0 || exam > 12) return null;
        return td + exam;
    }
    if (m.mode === "td20exam20") {
        const td = parseFloat(m.td);
        const exam = parseFloat(m.exam);
        if (isNaN(td) || td < 0 || td > 20) return null;
        if (isNaN(exam) || exam < 0 || exam > 20) return null;
        return td * 0.4 + exam * 0.6;
    }
    return null;
}

let idCounter = 1;
function newModule(): Module {
    return { id: `mod_${idCounter++}`, name: "", coef: 3, mode: "note20", note: "", td: "", exam: "" };
}

type Semester = { id: string; modules: Module[] };

export default function UniversityCalculator({ lang, isRTL }: { lang: "ar" | "fr" | "en"; isRTL: boolean }) {
    const t = i18n[lang];
    const [semesters, setSemesters] = useState<Semester[]>([{ id: "s1", modules: [] }]);
    const [activeSemester, setActiveSemester] = useState("s1");

    const current = semesters.find((s) => s.id === activeSemester)!;

    const updateModules = useCallback((semId: string, updater: (modules: Module[]) => Module[]) => {
        setSemesters((prev) => prev.map((s) => s.id === semId ? { ...s, modules: updater(s.modules) } : s));
    }, []);

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

    let totalWeighted = 0, totalCoef = 0;
    const computed = current.modules.map((m) => ({ ...m, avg: calcModuleAvg(m) }));
    computed.forEach(({ avg, coef }) => { if (avg !== null) { totalWeighted += avg * coef; totalCoef += coef; } });
    const overall = totalCoef > 0 ? totalWeighted / totalCoef : null;
    const mention = overall !== null ? getMention(overall, t) : null;

    const modes: { value: GradeMode; label: string }[] = [
        { value: "note20", label: t.note20 },
        { value: "td8exam12", label: t.td8exam12 },
        { value: "td20exam20", label: t.td20exam20 },
    ];

    return (
        <div className="space-y-5">
            {/* Semester tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {semesters.map((s, i) => (
                    <button key={s.id} onClick={() => setActiveSemester(s.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeSemester === s.id ? "bg-primary text-primary-foreground border-transparent" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        {t.semester} {i + 1}
                    </button>
                ))}
                {semesters.length < 4 && (
                    <button onClick={addSemester} className="px-4 py-1.5 rounded-full text-sm border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        + {t.addSemester}
                    </button>
                )}
            </div>

            {/* Empty state */}
            {current.modules.length === 0 && (
                <EmptyState icon={BookOpen} title={t.noModules} description={t.noModulesHint} className="py-12" />
            )}

            {/* Module list */}
            {current.modules.length > 0 && (
                <div className="space-y-3">
                    {computed.map((m) => (
                        <div key={m.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                            {/* Row 1: name + coef + delete */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <input type="text" value={m.name}
                                    onChange={(e) => updateModule(m.id, { name: e.target.value })}
                                    placeholder={t.placeholder}
                                    className="flex-1 min-w-[140px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                />
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">{t.coef}</span>
                                    <input type="number" min={1} max={10} value={m.coef}
                                        onChange={(e) => updateModule(m.id, { coef: parseInt(e.target.value) || 1 })}
                                        className="w-12 rounded-lg border border-input bg-transparent px-2 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                    />
                                </div>
                                <button onClick={() => removeModule(m.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Row 2: mode switcher */}
                            <div className="flex flex-wrap gap-1">
                                {modes.map((mode) => (
                                    <button key={mode.value}
                                        onClick={() => updateModule(m.id, { mode: mode.value, note: "", td: "", exam: "" })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${m.mode === mode.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {/* Row 3: grade inputs */}
                            {m.mode === "note20" && (
                                <input type="number" min={0} max={20} step={0.25} value={m.note}
                                    onChange={(e) => updateModule(m.id, { note: e.target.value })}
                                    placeholder="— /20"
                                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                />
                            )}
                            {m.mode === "td8exam12" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">{t.td} /8</label>
                                        <input type="number" min={0} max={8} step={0.25} value={m.td}
                                            onChange={(e) => updateModule(m.id, { td: e.target.value })}
                                            placeholder="—"
                                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">{t.exam} /12</label>
                                        <input type="number" min={0} max={12} step={0.25} value={m.exam}
                                            onChange={(e) => updateModule(m.id, { exam: e.target.value })}
                                            placeholder="—"
                                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                            {m.mode === "td20exam20" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">{t.td} /20 <span className="text-muted-foreground">(40%)</span></label>
                                        <input type="number" min={0} max={20} step={0.25} value={m.td}
                                            onChange={(e) => updateModule(m.id, { td: e.target.value })}
                                            placeholder="—"
                                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">{t.exam} /20 <span className="text-muted-foreground">(60%)</span></label>
                                        <input type="number" min={0} max={20} step={0.25} value={m.exam}
                                            onChange={(e) => updateModule(m.id, { exam: e.target.value })}
                                            placeholder="—"
                                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Row 4: result */}
                            <div className="flex justify-end pt-1 border-t border-border">
                                {m.avg !== null ? (
                                    <span className="text-sm font-semibold tabular-nums" style={{ color: getMention(m.avg, t).color }}>{m.avg.toFixed(2)} / 20</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">{t.moduleAvg}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={addModule} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-dashed border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />{t.addModule}
            </button>

            {current.modules.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-6 flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t.overall}</p>
                        <p className="font-display text-4xl font-semibold tracking-tight tabular-nums" style={{ color: mention?.color ?? "hsl(var(--foreground))" }}>{overall !== null ? overall.toFixed(2) : "—"}</p>
                        <p className="text-sm mt-1 font-medium" style={{ color: mention?.color ?? "hsl(var(--muted-foreground))" }}>{mention?.label ?? ""}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t.totalCoef}</p>
                        <p className="text-2xl font-semibold text-foreground">{totalCoef}</p>
                        <button onClick={resetAll} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-medium transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />{t.reset}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}