"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { awardXP } from "@/lib/gamification";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/types";
import type { Todo, TodoPriority, Subject } from "@/types";
import {
  Plus, X, CheckCircle2, Circle, Calendar,
  Filter, Trash2, Loader2, Star,
} from "lucide-react";
import { format } from "date-fns";

type FilterType = "all" | "pending" | "completed" | TodoPriority;

// Priority label translations (PRIORITY_CONFIG.label is hardcoded English)
const PRIORITY_LABELS: Record<string, Record<TodoPriority, string>> = {
  en: { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" },
  ar: { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" },
  fr: { low: "Faible", medium: "Moyen", high: "Élevée", urgent: "Urgent" },
};

const FILTER_LABELS: Record<string, Record<string, string>> = {
  en: { all: "all", pending: "pending", completed: "completed", urgent: "urgent", high: "high", medium: "medium", low: "low" },
  ar: { all: "الكل", pending: "معلقة", completed: "مكتملة", urgent: "عاجلة", high: "عالية", medium: "متوسطة", low: "منخفضة" },
  fr: { all: "tout", pending: "en attente", completed: "complétées", urgent: "urgent", high: "élevée", medium: "moyen", low: "faible" },
};

export default function TodosPage() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();
  const priorityLabels = PRIORITY_LABELS[language] ?? PRIORITY_LABELS.en;
  const filterLabels = FILTER_LABELS[language] ?? FILTER_LABELS.en;

  const fetchTodos = async (uid: string) => {
    const { data } = await supabase
      .from("todos")
      .select("*, subject:subjects(*)")
      .eq("user_id", uid)
      .order("completed", { ascending: true })
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true });
    setTodos((data as Todo[]) ?? []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await Promise.all([
        fetchTodos(user.id),
        supabase.from("subjects").select("*").eq("user_id", user.id)
          .then(({ data }) => setSubjects(data ?? [])),
      ]);
      setLoading(false);
    });
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    setSubmitting(true);

    const xpMap: Record<TodoPriority, number> = { low: 5, medium: 10, high: 15, urgent: 25 };
    const { error } = await supabase.from("todos").insert({
      user_id: userId,
      title: title.trim(),
      description: description || null,
      priority,
      due_date: dueDate || null,
      subject_id: selectedSubject || null,
      xp_reward: xpMap[priority],
    });

    if (!error) {
      setTitle(""); setDescription(""); setPriority("medium");
      setDueDate(""); setSelectedSubject(""); setShowForm(false);
      await fetchTodos(userId);
      toast({ title: "Task added!", description: "Get it done and earn XP 💪" });
    }
    setSubmitting(false);
  };

  const toggleTodo = async (todo: Todo) => {
    if (!userId) return;
    const completed = !todo.completed;
    await supabase.from("todos").update({
      completed, completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", todo.id);
    if (completed) {
      await awardXP(userId, todo.xp_reward, `Completed task: ${todo.title}`, "todo", todo.id);
      toast({ title: "Task complete! ✅", description: `+${todo.xp_reward} XP earned` });
    }
    await fetchTodos(userId);
  };

  const deleteTodo = async (id: string) => {
    if (!userId) return;
    await supabase.from("todos").delete().eq("id", id);
    await fetchTodos(userId);
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return todo.priority === filter;
  });

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    pending: todos.filter((t) => !t.completed).length,
    urgent: todos.filter((t) => t.priority === "urgent" && !t.completed).length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl">{t("todos_title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.completed}/{stats.total} {t("todos_completed")} •{" "}
            <span className="text-lime font-medium">{stats.pending} {t("todos_remaining")}</span>
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> {t("todos_add")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t("todos_total"), value: stats.total, color: "text-foreground" },
          { label: t("todos_done"), value: stats.completed, color: "text-emerald-400" },
          { label: t("todos_pending"), value: stats.pending, color: "text-yellow-400" },
          { label: t("todos_urgent"), value: stats.urgent, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="card-hover">
            <CardContent className="p-4 text-center">
              <p className={`font-display font-black text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add task form */}
      {showForm && (
        <Card className="border-lime/30">
          <CardContent className="p-5">
            <form onSubmit={handleAddTodo} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold">{t("todos_new_task")}</h3>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Input
                placeholder={t("todos_task_title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-medium"
                autoFocus required
              />

              <Input
                placeholder={t("todos_description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-3 gap-3">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t("todos_priority")}</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50">
                    {(Object.keys(PRIORITY_CONFIG) as TodoPriority[]).map((key) => (
                      <option key={key} value={key}>{priorityLabels[key]}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t("todos_subject")}</label>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50">
                    <option value="">{t("todos_none")}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Due date */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t("todos_due_date")}</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t("todos_cancel")}
                </Button>
                <Button type="submit" disabled={submitting || !title.trim()}>
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : t("todos_add_btn")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {(["all", "pending", "completed", "urgent", "high", "medium", "low"] as FilterType[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all",
              filter === f ? "bg-lime text-[#0D0D18]" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}>
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Todo list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : filteredTodos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">{t("todos_no_tasks")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "all" ? t("todos_add_first") : t("todos_no_filter")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => {
            const pConfig = PRIORITY_CONFIG[todo.priority];
            const isOverdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date();

            return (
              <div key={todo.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 group",
                  todo.completed
                    ? "border-border bg-muted/30 opacity-60"
                    : "border-border bg-card hover:border-lime/30 hover:bg-lime/2"
                )}>
                {/* Checkbox */}
                <button onClick={() => toggleTodo(todo)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                  {todo.completed
                    ? <CheckCircle2 className="w-5 h-5 text-lime" />
                    : <Circle className="w-5 h-5 text-muted-foreground hover:text-lime transition-colors" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium", todo.completed && "line-through text-muted-foreground")}>
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{todo.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Priority badge — translated */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pConfig.bgColor} ${pConfig.color}`}>
                      {priorityLabels[todo.priority]}
                    </span>

                    {/* Subject */}
                    {todo.subject && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ background: todo.subject.color }} />
                        {todo.subject.name}
                      </span>
                    )}

                    {/* Due date */}
                    {todo.due_date && (
                      <span className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(todo.due_date), "MMM d")}
                        {isOverdue && ` ${t("todos_overdue")}`}
                      </span>
                    )}

                    {/* XP reward */}
                    {!todo.completed && (
                      <span className="flex items-center gap-1 text-xs text-lime ml-auto">
                        <Star className="w-3 h-3" />+{todo.xp_reward} XP
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}