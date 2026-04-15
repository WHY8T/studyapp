"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatMinutes, generateColor } from "@/lib/utils";
import type { Subject } from "@/types";
import { Plus, X, BookOpen, Loader2, Pencil, Save } from "lucide-react";

const SUBJECT_COLORS = [
  "#00b7ff", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#FF9F43", "#BB8FCE", "#98D8C8", "#F7DC6F",
];

export default function SubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchSubjects = async (uid: string) => {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", uid)
      .order("total_minutes", { ascending: false });
    setSubjects((data as Subject[]) ?? []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await fetchSubjects(user.id);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !name.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("subjects").insert({
      user_id: userId,
      name: name.trim(),
      color,
    });

    if (!error) {
      setName("");
      setColor(SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]);
      setShowForm(false);
      await fetchSubjects(userId);
      toast({ title: "Subject added!" });
    }
    setSubmitting(false);
  };

  const deleteSubject = async (id: string) => {
    if (!userId) return;
    await supabase.from("subjects").delete().eq("id", id);
    await fetchSubjects(userId);
  };

  const totalMinutes = subjects.reduce((sum, s) => sum + s.total_minutes, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {subjects.length} subjects • {formatMinutes(totalMinutes)} total study time
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </div>

      {showForm && (
        <Card className="border-lime/30">
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">New Subject</h3>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                placeholder="Subject name (e.g. Biology, Math)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-medium">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: color === c ? `3px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting || !name.trim()}>
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Add Subject"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No subjects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first subject to organize your study sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {subjects.map((subject) => {
            const pct = totalMinutes > 0 ? (subject.total_minutes / totalMinutes) * 100 : 0;
            return (
              <Card key={subject.id} className="card-hover">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${subject.color}20` }}
                      >
                        <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                      </div>
                      <div>
                        <p className="font-display font-bold">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMinutes(subject.total_minutes)} studied
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>% of total study time</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: subject.color }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
