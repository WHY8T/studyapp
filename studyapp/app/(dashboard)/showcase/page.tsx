"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FolderPlus, Search, Grid3X3, List, FileText,
  Folder, MoreVertical, Trash2, Edit3,
  ChevronRight, Home, Eye, ZoomIn, ZoomOut,
  X, Star, ArrowLeft,
  Share2, Lock, Globe, Copy, Check, Link, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PDFFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  folderId: string | null;
  starred: boolean;
  url: string;
  base64?: string;
  shareId?: string;
  shareVisibility?: "public" | "private" | null;
}

interface PDFFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  parentId: string | null;
}

type ViewMode = "grid" | "list";
type SortKey = "name" | "date" | "size";

const FOLDER_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Storage helpers (IndexedDB via idb-keyval-like pattern) ──────────────────
// We use IndexedDB so large base64 PDFs don't blow up localStorage's 5 MB cap.

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open("pdf-showcase", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("kv");
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function dbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => res(req.result as T);
    req.onerror = () => rej(req.error);
  });
}

async function dbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function dbDel(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

type FileMeta = Omit<PDFFile, "url" | "base64">;

async function persistSave(files: PDFFile[], folders: PDFFolder[]) {
  const meta: FileMeta[] = files.map(({ url: _u, base64: _b, ...rest }) => rest);
  await dbSet("files-meta", meta);
  await dbSet("folders", folders);
  for (const f of files) {
    if (f.base64) {
      await dbSet("file-data-" + f.id, f.base64);
    }
  }
}

async function persistLoad(): Promise<{ files: PDFFile[]; folders: PDFFolder[] }> {
  const meta = (await dbGet<FileMeta[]>("files-meta")) ?? [];
  const folders = (await dbGet<PDFFolder[]>("folders")) ?? [];
  const files: PDFFile[] = [];
  for (const m of meta) {
    let base64: string | undefined;
    let url = "";
    try {
      base64 = await dbGet<string>("file-data-" + m.id);
      if (base64) url = "data:application/pdf;base64," + base64;
    } catch { /* no data */ }
    files.push({ ...m, base64, url });
  }
  return { files, folders };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Context menu ──────────────────────────────────────────────────────────────

interface CtxMenuProps {
  x: number; y: number;
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[];
  onClose: () => void;
}

function CtxMenu({ x, y, items, onClose }: CtxMenuProps) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 w-48 rounded-xl border border-white/10 bg-[#0e0e1a]/98 backdrop-blur-xl shadow-2xl py-1 overflow-hidden"
      style={{ left: x, top: y, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
            item.danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────

interface ShareModalProps {
  file: PDFFile;
  onSave: (shareId: string, visibility: "public" | "private") => void;
  onClose: () => void;
}

function ShareModal({ file, onSave, onClose }: ShareModalProps) {
  const [visibility, setVisibility] = useState<"public" | "private">(
    file.shareVisibility ?? "public"
  );
  const [shareId] = useState(
    () => file.shareId ?? crypto.randomUUID().slice(0, 12)
  );
  const [copied, setCopied] = useState(false);

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/showcase/share/${shareId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,8,15,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-[420px] bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00b7ff]/15 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#00b7ff]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Share PDF</h3>
              <p className="text-xs text-white/30 truncate max-w-[220px]">{file.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Access</p>
            <div className="grid grid-cols-2 gap-2">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left",
                    visibility === v
                      ? v === "public"
                        ? "border-[#00b7ff]/50 bg-[#00b7ff]/10"
                        : "border-amber-400/50 bg-amber-400/8"
                      : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    visibility === v ? v === "public" ? "bg-[#00b7ff]/20" : "bg-amber-400/20" : "bg-white/8"
                  )}>
                    {v === "public"
                      ? <Globe className={cn("w-4 h-4", visibility === v ? "text-[#00b7ff]" : "text-white/40")} />
                      : <Lock className={cn("w-4 h-4", visibility === v ? "text-amber-400" : "text-white/40")} />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold capitalize", visibility === v ? "text-white" : "text-white/50")}>{v}</p>
                    <p className="text-[10px] text-white/25 leading-tight mt-0.5">
                      {v === "public" ? "Anyone with the link" : "Only you can access"}
                    </p>
                  </div>
                  {visibility === v && (
                    <div className={cn(
                      "absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center",
                      v === "public" ? "bg-[#00b7ff]" : "bg-amber-400"
                    )}>
                      <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Share link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/4">
                <Link className="w-3.5 h-3.5 text-white/25 shrink-0" />
                <span className="text-xs text-white/40 font-mono truncate flex-1">{shareLink}</span>
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0",
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-[#00b7ff] text-black hover:bg-[#00b7ff]/90"
                )}
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button
            onClick={() => { onSave(shareId, visibility); onClose(); }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#00b7ff] text-black hover:bg-[#00b7ff]/90 transition-all"
            style={{ boxShadow: "0 0 20px rgba(0,183,255,0.25)" }}
          >
            <Share2 className="w-3.5 h-3.5" /> Save & Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PDF Viewer ────────────────────────────────────────────────────────────────
//
// ✅ We avoid requestFullscreen() — it creates a new stacking context that hides
//    any fixed elements rendered outside the fullscreen target (e.g. a Pomodoro
//    widget). Instead we toggle a CSS-only "expanded" mode via fixed+inset-0.

interface ViewerProps {
  file: PDFFile;
  onClose: () => void;
}

function PDFViewer({ file, onClose }: ViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Escape") { if (isExpanded) setIsExpanded(false); else onClose(); }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(200, z + 10));
      if (e.key === "-") setZoom((z) => Math.max(50, z - 10));
      if (e.key === "f" || e.key === "F") setIsExpanded((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isExpanded]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: isExpanded ? 150 : 100, background: "#08080F" }}
    >
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-[#0e0e1a]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00b7ff]/20 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-[#00b7ff]" />
            </div>
            <span className="font-semibold text-white text-sm truncate max-w-xs">{file.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-white/60 w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[#06060d]">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease",
          }}
        >
          {file.url ? (
            <iframe
              src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="rounded-xl shadow-2xl"
              style={{ width: "816px", height: "80vh", border: "none", background: "white" }}
              title={file.name}
            />
          ) : (
            <div className="w-[816px] h-[80vh] rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4">
              <FileText className="w-16 h-16 text-white/20" />
              <p className="text-white/40 text-sm">Preview not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur pointer-events-none">
        <span className="text-xs text-white/30 font-mono">ESC</span>
        <span className="text-xs text-white/20">close</span>
        <span className="w-px h-3 bg-white/10" />
        <span className="text-xs text-white/30 font-mono">+ / -</span>
        <span className="text-xs text-white/20">zoom</span>
      </div>
    </div>
  );
}

// ── Rename modal ──────────────────────────────────────────────────────────────

function RenameModal({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(current);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,8,15,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-80 bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-white mb-4">Rename</h3>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(val); onClose(); }
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b7ff]/40"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={() => { onSave(val); onClose(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#00b7ff] text-black hover:bg-[#00b7ff]/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New folder modal ──────────────────────────────────────────────────────────

function NewFolderModal({
  onSave,
  onClose,
}: {
  onSave: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("New Folder");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,8,15,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-80 bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-white">New Folder</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(name, color); onClose(); }
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b7ff]/40"
        />
        <div>
          <p className="text-xs text-white/40 mb-2 font-medium">Colour</p>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-lg transition-all"
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px #0e0e1a, 0 0 0 4px ${c}` : "none",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={() => { onSave(name, color); onClose(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#00b7ff] text-black hover:bg-[#00b7ff]/90"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [folders, setFolders] = useState<PDFFolder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [viewerFile, setViewerFile] = useState<PDFFile | null>(null);
  const [sharingFile, setSharingFile] = useState<PDFFile | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number; y: number; type: "file" | "folder"; id: string;
  } | null>(null);
  const [renaming, setRenaming] = useState<{
    type: "file" | "folder"; id: string; current: string;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentFolderIdRef = useRef(currentFolderId);

  useEffect(() => { currentFolderIdRef.current = currentFolderId; }, [currentFolderId]);

  // ── Load from IndexedDB on mount ──────────────────────────────────────────
  useEffect(() => {
    persistLoad().then(({ files: f, folders: fo }) => {
      setFiles(f);
      setFolders(fo);
      setLoaded(true);
    });
  }, []);

  // ── Persist whenever data changes (after initial load) ────────────────────
  useEffect(() => {
    if (!loaded) return;
    persistSave(files, folders);
  }, [files, folders, loaded]);

  const breadcrumbs = (() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "My PDFs" }];
    if (currentFolderId) {
      const folder = folders.find((f) => f.id === currentFolderId);
      if (folder) crumbs.push({ id: folder.id, name: folder.name });
    }
    return crumbs;
  })();

  const visibleFolders = folders
    .filter((f) => f.parentId === currentFolderId)
    .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  const visibleFiles = files
    .filter((f) => f.folderId === currentFolderId)
    .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "size") return b.size - a.size;
      return b.uploadedAt - a.uploadedAt;
    });

  const starredFiles = files.filter((f) => f.starred);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const targetFolderId = currentFolderIdRef.current;
    const newFiles: PDFFile[] = [];
    for (const f of Array.from(fileList)) {
      if (f.type !== "application/pdf") continue;
      const base64 = await fileToBase64(f);
      newFiles.push({
        id: crypto.randomUUID(),
        name: f.name.replace(/\.pdf$/i, ""),
        size: f.size,
        uploadedAt: Date.now(),
        folderId: targetFolderId,
        starred: false,
        base64,
        url: `data:application/pdf;base64,${base64}`,
        shareVisibility: null,
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const createFolder = (name: string, color: string) => {
    setFolders((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, color, createdAt: Date.now(), parentId: currentFolderId },
    ]);
  };

  const deleteFile = async (id: string) => {
    setFiles((p) => p.filter((f) => f.id !== id));
    await dbDel("file-data-" + id);
  };

  const deleteFolder = (id: string) => {
    setFolders((p) => p.filter((f) => f.id !== id));
    setFiles((p) =>
      p.map((f) => (f.folderId === id ? { ...f, folderId: currentFolderIdRef.current } : f))
    );
  };

  const renameFile = (id: string, name: string) =>
    setFiles((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
  const renameFolder = (id: string, name: string) =>
    setFolders((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
  const toggleStar = (id: string) =>
    setFiles((p) => p.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)));
  const saveShare = (fileId: string, shareId: string, visibility: "public" | "private") =>
    setFiles((p) =>
      p.map((f) => (f.id === fileId ? { ...f, shareId, shareVisibility: visibility } : f))
    );

  const openCtxMenu = (e: React.MouseEvent, type: "file" | "folder", id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30 text-sm">
        Loading…
      </div>
    );
  }

  const isEmpty = visibleFolders.length === 0 && visibleFiles.length === 0;

  return (
    <div
      className="flex flex-col h-full min-h-0"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {dragging && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,183,255,0.07)", border: "2px dashed #00b7ff" }}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 text-[#00b7ff] mx-auto mb-3" />
            <p className="text-[#00b7ff] font-bold text-xl">Drop PDFs here</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl">PDF Showcase</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {files.length} files · {folders.length} folders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#00b7ff] text-black hover:bg-[#00b7ff]/90 transition-all shadow-lg"
            style={{ boxShadow: "0 0 20px rgba(0,183,255,0.3)" }}
          >
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id ?? "root"} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={cn(
                  "px-2 py-1 rounded-lg transition-colors font-medium",
                  i === breadcrumbs.length - 1
                    ? "text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {i === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-44 pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b7ff]/30"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white/60 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="date">By date</option>
          <option value="name">By name</option>
          <option value="size">By size</option>
        </select>
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("px-2.5 py-1.5 transition-colors", viewMode === "grid" ? "bg-[#00b7ff]/20 text-[#00b7ff]" : "text-white/30 hover:text-white hover:bg-white/5")}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("px-2.5 py-1.5 transition-colors", viewMode === "list" ? "bg-[#00b7ff]/20 text-[#00b7ff]" : "text-white/30 hover:text-white hover:bg-white/5")}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Starred strip */}
      {!currentFolderId && !search && starredFiles.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Star className="w-3 h-3 text-amber-400" /> Starred
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {starredFiles.map((f) => (
              <button
                key={f.id}
                onClick={() => setViewerFile(f)}
                className="flex-none flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-white/70 max-w-[100px] truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {isEmpty && !search ? (
          <div
            className="flex flex-col items-center justify-center h-80 rounded-2xl border-2 border-dashed border-white/10 cursor-pointer hover:border-[#00b7ff]/40 hover:bg-[#00b7ff]/5 transition-all group"
            onClick={() => inputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#00b7ff]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-[#00b7ff]" />
            </div>
            <p className="font-bold text-white/60 mb-1">Drop PDFs or click to upload</p>
            <p className="text-sm text-white/30">Supports multiple files</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/30">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No results for &ldquo;{search}&rdquo;</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {visibleFolders.map((folder) => (
              <div
                key={folder.id}
                className="group relative rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 transition-all cursor-pointer p-4 flex flex-col items-center gap-2 hover:border-white/15"
                onDoubleClick={() => setCurrentFolderId(folder.id)}
                onContextMenu={(e) => openCtxMenu(e, "folder", folder.id)}
              >
                <Folder
                  className="w-12 h-12 transition-transform group-hover:scale-105"
                  style={{ color: folder.color, fill: `${folder.color}30` }}
                />
                <p className="text-xs font-semibold text-white/70 text-center truncate w-full">{folder.name}</p>
                <p className="text-[10px] text-white/25">
                  {files.filter((f) => f.folderId === folder.id).length} files
                </p>
              </div>
            ))}

            {visibleFiles.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 transition-all cursor-pointer overflow-hidden"
                onContextMenu={(e) => openCtxMenu(e, "file", file.id)}
              >
                <div
                  className="h-28 flex items-center justify-center relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(0,183,255,0.06), rgba(0,183,255,0.02))" }}
                >
                  <FileText className="w-10 h-10 text-[#00b7ff]/60 group-hover:scale-110 transition-transform" />
                  {file.starred && <Star className="absolute top-2 right-2 w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  {file.shareVisibility && (
                    <span className={cn(
                      "absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold",
                      file.shareVisibility === "public" ? "bg-[#00b7ff]/20 text-[#00b7ff]" : "bg-amber-400/20 text-amber-400"
                    )}>
                      {file.shareVisibility === "public"
                        ? <><Globe className="w-2 h-2" /> Public</>
                        : <><Lock className="w-2 h-2" /> Private</>}
                    </span>
                  )}
                  <div
                    className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.7)" }}
                  >
                    <button
                      onClick={() => setViewerFile(file)}
                      className="w-9 h-9 rounded-xl bg-[#00b7ff] text-black flex items-center justify-center hover:scale-110 transition-transform"
                      title="Open"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSharingFile(file); }}
                      className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:scale-110 hover:bg-white/20 transition-all"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5 space-y-0.5">
                  <p className="text-xs font-semibold text-white/80 truncate">{file.name}</p>
                  <p className="text-[10px] text-white/30">{fmtSize(file.size)} · {fmtDate(file.uploadedAt)}</p>
                </div>
              </div>
            ))}

            {/* Add tile */}
            {!search && (
              <div
                onClick={() => inputRef.current?.click()}
                className="group rounded-2xl border-2 border-dashed border-white/8 hover:border-[#00b7ff]/50 hover:bg-[#00b7ff]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                style={{ minHeight: "140px" }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/4 group-hover:bg-[#00b7ff]/15 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-white/20 group-hover:text-[#00b7ff] transition-colors" />
                </div>
                <p className="text-[10px] font-semibold text-white/20 group-hover:text-[#00b7ff]/70 transition-colors">Add PDFs</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Uploaded</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Visibility</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleFolders.map((folder) => (
                  <tr
                    key={folder.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer group"
                    onDoubleClick={() => setCurrentFolderId(folder.id)}
                    onContextMenu={(e) => openCtxMenu(e, "folder", folder.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 shrink-0" style={{ color: folder.color, fill: `${folder.color}30` }} />
                        <span className="font-medium text-white/80">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden sm:table-cell">
                      {files.filter((f) => f.folderId === folder.id).length} files
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">{fmtDate(folder.createdAt)}</td>
                    <td className="px-4 py-3 hidden md:table-cell" />
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => openCtxMenu(e, "folder", folder.id)}
                        className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer group"
                    onDoubleClick={() => setViewerFile(file)}
                    onContextMenu={(e) => openCtxMenu(e, "file", file.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 shrink-0 text-[#00b7ff]/60" />
                        <span className="font-medium text-white/80">{file.name}</span>
                        {file.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden sm:table-cell">{fmtSize(file.size)}</td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">{fmtDate(file.uploadedAt)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {file.shareVisibility ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          file.shareVisibility === "public" ? "bg-[#00b7ff]/15 text-[#00b7ff]" : "bg-amber-400/15 text-amber-400"
                        )}>
                          {file.shareVisibility === "public"
                            ? <><Globe className="w-2.5 h-2.5" /> Public</>
                            : <><Lock className="w-2.5 h-2.5" /> Private</>}
                        </span>
                      ) : (
                        <span className="text-white/15 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => setViewerFile(file)} className="p-1.5 rounded hover:bg-[#00b7ff]/20 text-white/30 hover:text-[#00b7ff]"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setSharingFile(file); }} className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white"><Share2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => openCtxMenu(e, "file", file.id)} className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white"><MoreVertical className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Add more row */}
                {!search && (
                  <tr
                    className="hover:bg-[#00b7ff]/5 transition-colors cursor-pointer group"
                    onClick={() => inputRef.current?.click()}
                  >
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="flex items-center gap-3 text-white/20 group-hover:text-[#00b7ff]/60 transition-colors">
                        <div className="w-5 h-5 rounded border border-dashed border-white/15 group-hover:border-[#00b7ff]/40 flex items-center justify-center transition-colors shrink-0">
                          <Plus className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium">Add more PDFs…</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Context menus */}
      {ctxMenu?.type === "file" && (
        <CtxMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: "Open", icon: <Eye className="w-3.5 h-3.5" />, onClick: () => { const f = files.find((f) => f.id === ctxMenu.id); if (f) setViewerFile(f); } },
            { label: "Share", icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => { const f = files.find((f) => f.id === ctxMenu.id); if (f) setSharingFile(f); } },
            { label: files.find((f) => f.id === ctxMenu.id)?.starred ? "Unstar" : "Star", icon: <Star className="w-3.5 h-3.5" />, onClick: () => toggleStar(ctxMenu.id) },
            { label: "Rename", icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => { const f = files.find((f) => f.id === ctxMenu.id); if (f) setRenaming({ type: "file", id: f.id, current: f.name }); } },
            { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => deleteFile(ctxMenu.id), danger: true },
          ]}
        />
      )}
      {ctxMenu?.type === "folder" && (
        <CtxMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: "Open", icon: <Folder className="w-3.5 h-3.5" />, onClick: () => setCurrentFolderId(ctxMenu.id) },
            { label: "Rename", icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => { const f = folders.find((f) => f.id === ctxMenu.id); if (f) setRenaming({ type: "folder", id: f.id, current: f.name }); } },
            { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => deleteFolder(ctxMenu.id), danger: true },
          ]}
        />
      )}

      {/* Modals */}
      {showNewFolder && <NewFolderModal onSave={createFolder} onClose={() => setShowNewFolder(false)} />}
      {renaming && (
        <RenameModal
          current={renaming.current}
          onSave={(v) => renaming.type === "file" ? renameFile(renaming.id, v) : renameFolder(renaming.id, v)}
          onClose={() => setRenaming(null)}
        />
      )}
      {sharingFile && (
        <ShareModal
          file={sharingFile}
          onSave={(shareId, visibility) => saveShare(sharingFile.id, shareId, visibility)}
          onClose={() => setSharingFile(null)}
        />
      )}

      {viewerFile && <PDFViewer file={viewerFile} onClose={() => setViewerFile(null)} />}
    </div>
  );
}