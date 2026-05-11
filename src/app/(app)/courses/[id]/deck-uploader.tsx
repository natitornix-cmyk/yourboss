"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeckUploader({ courseId }: { courseId: string }) {
  const [drag, setDrag] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("PDFs only.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("courseId", courseId);
    const res = await fetch("/api/decks/upload", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) upload(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
        drag ? "border-teal-500 bg-teal-500/5" : "border-border hover:border-teal-500/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <div className="flex flex-col items-center gap-2">
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        ) : (
          <UploadCloud className="h-6 w-6 text-teal-400" />
        )}
        <div className="font-medium">
          {busy ? "Uploading…" : "Drop a PDF here, or click to choose"}
        </div>
        <div className="text-xs text-muted-foreground">
          Up to 50 MB. We&apos;ll generate summary, questions, and flashcards.
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
