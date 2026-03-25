"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  X,
  BookOpen,
  ExternalLink,
  Trash2,
  Loader2,
  GraduationCap,
  FlaskConical,
  Presentation,
  FileText,
  Globe,
  Lock,
  Upload,
  FileUp,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ShowcaseItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  subject: string | null;
  file_url: string | null;
  external_url: string | null;
  is_public: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  paper: { label: "Research Paper", icon: FileText, color: "#00b7ff" },
  project: { label: "Project", icon: BookOpen, color: "#4ECDC4" },
  research: { label: "Research", icon: FlaskConical, color: "#BB8FCE" },
  presentation: { label: "Presentation", icon: Presentation, color: "#FF9F43" },
  other: { label: "Other", icon: GraduationCap, color: "#96CEB4" },
};

// ── Inline PDF viewer ─────────────────────────────────────────────────────────
function PdfViewer({ url, title }: { url: string; title: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#00b7ff] hover:underline transition"
      >
        <Eye className="w-3.5 h-3.5" />
        {expanded ? "Hide PDF" : "View PDF"}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 rounded-xl overflow-hidden border border-border">
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            title={title}
            className="w-full"
            style={{ height: "480px", background: "#1a1a2e" }}
          />
          <div className="flex justify-end px-3 py-2 bg-muted border-t border-border">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00b7ff] flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Open in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShowcasePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("paper");
  const [subject, setSubject] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const fetchItems = async (uid: string) => {
    const { data } = await supabase
      .from("work_showcases")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems((data as ShowcaseItem[]) ?? []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await fetchItems(user.id);
      setLoading(false);
    });
  }, []);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please select a PDF file", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "PDF must be smaller than 20 MB", variant: "destructive" });
      return;
    }
    setPdfFile(file);
  };

  const uploadPdf = async (uid: string): Promise<string | null> => {
    if (!pdfFile) return null;
    setUploadingPdf(true);
    try {
      const ext = "pdf";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("showcase-pdfs")
        .upload(path, pdfFile, { contentType: "application/pdf", upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("showcase-pdfs")
        .getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast({ title: "PDF upload failed", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setUploadingPdf(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubject("");
    setExternalUrl("");
    setType("paper");
    setIsPublic(true);
    setPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    setSubmitting(true);

    let fileUrl: string | null = null;
    if (pdfFile) {
      fileUrl = await uploadPdf(userId);
      if (!fileUrl) {
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from("work_showcases").insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      type,
      subject: subject.trim() || null,
      file_url: fileUrl,
      external_url: externalUrl.trim() || null,
      is_public: isPublic,
    });

    if (error) {
      toast({ title: "Failed to add work", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Work added to showcase! 🎓" });
      resetForm();
      setShowForm(false);
      await fetchItems(userId);
    }
    setSubmitting(false);
  };

  const handleDelete = async (item: ShowcaseItem) => {
    if (!userId) return;
    setDeleting(item.id);

    // Delete PDF from storage if it exists
    if (item.file_url) {
      try {
        // Extract path from public URL: everything after /showcase-pdfs/
        const url = new URL(item.file_url);
        const pathParts = url.pathname.split("/showcase-pdfs/");
        if (pathParts[1]) {
          await supabase.storage.from("showcase-pdfs").remove([pathParts[1]]);
        }
      } catch (_) { }
    }

    await supabase.from("work_showcases").delete().eq("id", item.id);
    await fetchItems(userId);
    setDeleting(null);
    toast({ title: "Work removed from showcase" });
  };

  const toggleVisibility = async (item: ShowcaseItem) => {
    await supabase
      .from("work_showcases")
      .update({ is_public: !item.is_public })
      .eq("id", item.id);
    await fetchItems(userId!);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl">Work Showcase</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Share your academic work — papers, projects, and research
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Work
        </Button>
      </div>

      {/* ── Add work form ───────────────────────────────────────────────────── */}
      {showForm && (
        <Card className="border-[#00b7ff]/30">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Add to Showcase</h3>
                <Button type="button" variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Title */}
                <div className="col-span-2">
                  <Input
                    placeholder="Title (e.g. Research on Climate Change Impact)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00b7ff]/50"
                  >
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Subject / Course</label>
                  <Input
                    placeholder="e.g. Biology, CS101"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Description</label>
                  <textarea
                    placeholder="Brief description of your work..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#00b7ff]/50"
                  />
                </div>

                {/* External link */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">External Link (optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://docs.google.com/..."
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* PDF upload */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Upload PDF (optional, max 20 MB)</label>
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                      ${pdfFile
                        ? "border-[#00b7ff]/50 bg-[#00b7ff]/5"
                        : "border-border hover:border-[#00b7ff]/40 hover:bg-muted/50"
                      }`}
                  >
                    {pdfFile ? (
                      <>
                        <FileText className="w-5 h-5 text-[#00b7ff] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPdfFile(null); if (pdfInputRef.current) pdfInputRef.current.value = ""; }}
                          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-5 h-5 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload a PDF
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfChange}
                  />
                </div>
              </div>

              {/* Visibility toggle */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setIsPublic(!isPublic)}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${isPublic ? "bg-[#00b7ff]" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <p className="text-sm font-medium">
                  {isPublic ? "Public — visible on your profile" : "Private — only you can see this"}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || uploadingPdf || !title.trim()}>
                  {(submitting || uploadingPdf)
                    ? <><Loader2 className="animate-spin w-4 h-4 mr-1" />{uploadingPdf ? "Uploading PDF…" : "Saving…"}</>
                    : "Add to Showcase"
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Items grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No works yet</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Share your academic work — papers, research, projects — and let it appear on your public profile.
            </p>
            <Button onClick={() => setShowForm(true)} className="mt-2">
              <Plus className="w-4 h-4" /> Add your first work
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;
            const Icon = config.icon;
            return (
              <Card key={item.id} className="card-hover group">
                <CardContent className="p-5 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${config.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold truncate">{item.title}</p>
                        {item.subject && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.subject}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions (hover) */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleVisibility(item)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title={item.is_public ? "Make private" : "Make public"}
                      >
                        {item.is_public
                          ? <Globe className="w-3.5 h-3.5" />
                          : <Lock className="w-3.5 h-3.5" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deleting === item.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        {deleting === item.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className="text-xs"
                        style={{
                          background: `${config.color}15`,
                          color: config.color,
                          border: `1px solid ${config.color}30`,
                        }}
                      >
                        {config.label}
                      </Badge>
                      {item.is_public ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>

                    {/* External link */}
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#00b7ff] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Link
                      </a>
                    )}
                  </div>

                  {/* PDF viewer */}
                  {item.file_url && (
                    <PdfViewer url={item.file_url} title={item.title} />
                  )}

                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}