"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUiStore } from "@/lib/stores/ui-store";

type Msg = { role: "user" | "assistant"; text: string };

export function ChatPanel({ deckId }: { deckId: string }) {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const prefill = useUiStore((s) => s.chatPrefill);
  const setPrefill = useUiStore((s) => s.setChatPrefill);
  const pulse = useUiStore((s) => s.pulse);
  const setPdfPage = useUiStore((s) => s.setPdfPage);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (prefill) {
      setInput((cur) =>
        cur ? cur + "\n\nAbout this passage:\n" + prefill : `About this passage:\n"${prefill}"\n\nMy question: `,
      );
      setPrefill(null);
    }
  }, [prefill, setPrefill]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", text }, { role: "assistant", text: "" }];
    setMessages(next);
    setBusy(true);

    try {
      const res = await fetch(`/api/decks/${deckId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter((m, i) => !(i === next.length - 1 && m.role === "assistant"))
            .map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("chat failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", text: buf };
          return copy;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const copy = prev.slice();
        copy[copy.length - 1] = {
          role: "assistant",
          text: "Sorry — the chat failed. Check your API key and try again.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Ask anything about this deck. Right-click selected text in the PDF to
            pre-fill a question.
          </div>
        )}
        {messages.map((m, i) => (
          <Message
            key={i}
            role={m.role}
            text={m.text}
            onCite={(slide) => {
              setPdfPage(slide);
              pulse(slide);
            }}
          />
        ))}
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this deck…"
          className="min-h-[44px] max-h-40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={busy} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Message({
  role,
  text,
  onCite,
}: {
  role: "user" | "assistant";
  text: string;
  onCite: (slide: number) => void;
}) {
  // Replace [Slide N] citations with buttons.
  const parts: React.ReactNode[] = [];
  let i = 0;
  const re = /\[Slide\s+(\d+)\]/gi;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const slide = parseInt(m[1], 10);
    parts.push(
      <button
        key={i++}
        onClick={() => onCite(slide)}
        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs"
      >
        [Slide {slide}]
      </button>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <div
      className={
        role === "user"
          ? "ml-auto max-w-[85%] bg-primary/15 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
          : "max-w-[90%] bg-secondary rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
      }
    >
      {parts.length > 0 ? parts : text || (role === "assistant" ? "…" : "")}
    </div>
  );
}
