"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export function PdfPane({
  url,
  deckId,
  onAskAi,
}: {
  url: string;
  deckId: string;
  onAskAi: (text: string) => void;
}) {
  const [pages, setPages] = React.useState(0);
  const [scale, setScale] = React.useState(1.1);
  const page = useUiStore((s) => s.pdfPage);
  const setPage = useUiStore((s) => s.setPdfPage);
  const pulsePage = useUiStore((s) => s.pulsePage);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selection, setSelection] = React.useState<{ text: string; x: number; y: number } | null>(null);

  React.useEffect(() => {
    function onUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const cRect = containerRef.current?.getBoundingClientRect();
      if (!cRect) return;
      setSelection({
        text,
        x: rect.right - cRect.left,
        y: rect.top - cRect.top,
      });
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  const pageRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  React.useEffect(() => {
    const el = pageRefs.current[page];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

  return (
    <div ref={containerRef} className="relative bg-secondary/30 min-h-0 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-1 bg-background/95 backdrop-blur border-b border-border px-3 py-2">
        <Button size="icon" variant="ghost" onClick={() => setPage(Math.max(1, page - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {pages || "–"}
        </span>
        <Button size="icon" variant="ghost" onClick={() => setPage(Math.min(pages || page, page + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.min(2.4, s + 0.15))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {!url ? (
        <div className="p-10 text-center text-muted-foreground text-sm">PDF unavailable</div>
      ) : (
        <Document
          file={url}
          onLoadSuccess={(d) => setPages(d.numPages)}
          loading={<div className="p-10 text-center text-sm text-muted-foreground">Loading PDF…</div>}
          error={<div className="p-10 text-center text-sm text-red-400">Failed to load PDF</div>}
        >
          <div className="flex flex-col items-center gap-3 p-3">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                ref={(el) => {
                  pageRefs.current[n] = el;
                }}
                className={cn(
                  "shadow-lg rounded-md overflow-hidden bg-white",
                  pulsePage === n && "pdf-page-pulse",
                )}
              >
                <Page pageNumber={n} scale={scale} renderTextLayer renderAnnotationLayer={false} />
                <div className="bg-secondary text-xs text-muted-foreground px-2 py-1 text-center">
                  Slide {n}
                </div>
              </div>
            ))}
          </div>
        </Document>
      )}

      {selection && (
        <div
          style={{ left: selection.x, top: selection.y - 36 }}
          className="absolute z-20"
        >
          <button
            className="px-2.5 py-1.5 rounded-md bg-teal-500 text-white text-xs shadow-lg hover:bg-teal-600"
            onClick={() => {
              onAskAi(selection.text);
              window.getSelection()?.removeAllRanges();
              setSelection(null);
            }}
          >
            Ask AI about this
          </button>
        </div>
      )}
    </div>
  );
}
