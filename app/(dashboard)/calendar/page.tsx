"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudyEvent, StudyEventType, Subject } from "@/types";
import { Plus, X, BookOpen, AlertTriangle, FileText, Bell, Loader2 } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";

const EVENT_TYPES: Record<StudyEventType, { label: string; color: string; icon: React.ElementType }> = {
  study: { label: "Study Session", color: "#00b7ff", icon: BookOpen },
  exam: { label: "Exam", color: "#FF6B6B", icon: AlertTriangle },
  assignment: { label: "Assignment", color: "#FF9F43", icon: FileText },
  reminder: { label: "Reminder", color: "#4ECDC4", icon: Bell },
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<StudyEventType>("study");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const supabase = createClient();

  const fetchEvents = async (uid: string) => {
    const { data } = await supabase
      .from("study_events")
      .select("*, subject:subjects(*)")
      .eq("user_id", uid)
      .order("start_time");
    setEvents((data as StudyEvent[]) ?? []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await Promise.all([
        fetchEvents(user.id),
        supabase.from("subjects").select("*").eq("user_id", user.id).then(({ data }) => setSubjects(data ?? [])),
      ]);
      setLoading(false);
    });
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    setSubmitting(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { error } = await supabase.from("study_events").insert({
      user_id: userId,
      title: title.trim(),
      event_type: eventType,
      start_time: `${dateStr}T${startTime}:00`,
      end_time: endTime ? `${dateStr}T${endTime}:00` : null,
      description: description || null,
      subject_id: subjectId || null,
    });

    if (!error) {
      setTitle("");
      setDescription("");
      setShowForm(false);
      await fetchEvents(userId);
    }
    setSubmitting(false);
  };

  const deleteEvent = async (id: string) => {
    if (!userId) return;
    await supabase.from("study_events").delete().eq("id", id);
    await fetchEvents(userId!);
  };

  const selectedDayEvents = events.filter((e) =>
    isSameDay(parseISO(e.start_time), selectedDate)
  );

  // Dates that have events
  const eventDates = events.map((e) => format(parseISO(e.start_time), "yyyy-MM-dd"));

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayEvents = events.filter((e) => format(parseISO(e.start_time), "yyyy-MM-dd") === dateStr);
    if (dayEvents.length === 0) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {dayEvents.slice(0, 3).map((e, i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full"
            style={{ background: EVENT_TYPES[e.event_type].color }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl">Study Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule sessions, track exams, and stay on top of deadlines
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Calendar
                value={selectedDate}
                onChange={(val) => setSelectedDate(val as Date)}
                tileContent={tileContent}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Add event form */}
          {showForm && (
            <Card className="border-lime/30">
              <CardContent className="p-5">
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold">
                      New Event — {format(selectedDate, "MMM d, yyyy")}
                    </h3>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Input
                    placeholder="Event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Type</label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as StudyEventType)}
                        className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none"
                      >
                        {Object.entries(EVENT_TYPES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Subject</label>
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none"
                      >
                        <option value="">None</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Start Time</label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">End Time</label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>

                  <Input
                    placeholder="Notes (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting || !title.trim()}>
                      {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Add Event"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Event list for selected day */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No events this day</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
                    <Plus className="w-3 h-3" /> Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((event) => {
                    const typeConfig = EVENT_TYPES[event.event_type];
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${typeConfig.color}20` }}
                        >
                          <typeConfig.icon className="w-4 h-4" style={{ color: typeConfig.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(event.start_time), "h:mm a")}
                            {event.end_time && ` — ${format(parseISO(event.end_time), "h:mm a")}`}
                          </p>
                          {event.subject && (
                            <div className="flex items-center gap-1 mt-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: event.subject.color }}
                              />
                              <span className="text-xs text-muted-foreground">{event.subject.name}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              {events
                .filter((e) => parseISO(e.start_time) >= new Date())
                .slice(0, 5)
                .map((event) => {
                  const typeConfig = EVENT_TYPES[event.event_type];
                  return (
                    <div key={event.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div
                        className="w-1 self-stretch rounded-full"
                        style={{ background: typeConfig.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.start_time), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
