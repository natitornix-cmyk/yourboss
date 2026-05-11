"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Card = { id: string; front: string; back: string; slideRefs: number[] };
type Rating = "again" | "hard" | "good" | "easy";

export function FlashcardClient({
  deckId,
  deckTitle,
  cards,
}: {
  deckId: string;
  deckTitle: string;
  cards: Card[];
}) {
  const [i, setI] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [done, setDone] = React.useState(cards.length === 0);
  const [chatOpen, setChatOpen] = React.useState(false);
  const startRef = React.useRef<number>(Date.now());
  const cardRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    startRef.current = Date.now();
    setRevealed(false);
  }, [i]);

  async function rate(r: Rating) {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    const card = cards[i];
    await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flashcardId: card.id,
        rating: r,
        timeMs: Date.now() - startRef.current,
      }),
    }).catch(() => {});
    if (i + 1 >= cards.length) {
      setDone(true);
    } else {
      setI(i + 1);
    }
  }

  if (done) {
    return (
      <div className="container max-w-md py-20 text-center space-y-4">
        <h1 className="text-2xl font-semibold">All caught up</h1>
        <p className="text-muted-foreground">
          {cards.length === 0 ? "No cards are due right now." : `Reviewed ${cards.length} cards.`}
        </p>
        <Button asChild>
          <Link href={`/decks/${deckId}`}>Back to deck</Link>
        </Button>
      </div>
    );
  }

  const card = cards[i];

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (!revealed) return;
    if (dx > 80) rate("good");
    else if (dx < -80) rate("again");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={`/decks/${deckId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 text-sm">
          <div className="text-muted-foreground">{deckTitle}</div>
          <div>Card {i + 1} of {cards.length}</div>
        </div>
      </header>

      <div className="flex-1 container max-w-2xl py-6 flex flex-col">
        <div
          ref={cardRef}
          onClick={() => !revealed && setRevealed(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex-1 rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none min-h-[40vh]"
        >
          <div className="text-xl md:text-2xl font-medium max-w-xl">{card.front}</div>
          {revealed && (
            <>
              <div className="my-6 h-px w-full max-w-xs bg-border" />
              <div className="text-base md:text-lg text-muted-foreground max-w-xl whitespace-pre-wrap">
                {card.back}
              </div>
              {card.slideRefs.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground">
                  {card.slideRefs.map((s) => `[Slide ${s}]`).join(" ")}
                </div>
              )}
            </>
          )}
        </div>

        {revealed ? (
          <div className="grid grid-cols-4 gap-2 mt-4">
            <RatingButton color="bg-red-500/20 text-red-300" onClick={() => rate("again")} label="Again" hint="<1m" />
            <RatingButton color="bg-amber-500/20 text-amber-300" onClick={() => rate("hard")} label="Hard" hint="" />
            <RatingButton color="bg-emerald-500/20 text-emerald-300" onClick={() => rate("good")} label="Good" hint="" />
            <RatingButton color="bg-teal-500/20 text-teal-300" onClick={() => rate("easy")} label="Easy" hint="" />
          </div>
        ) : (
          <Button className="mt-4" onClick={() => setRevealed(true)}>Reveal</Button>
        )}

        <Button
          variant="ghost"
          className="mt-3 self-center text-xs"
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="h-3 w-3" /> Chat with this card
        </Button>
      </div>

      <CardChatDialog open={chatOpen} onClose={() => setChatOpen(false)} card={card} deckId={deckId} />
    </div>
  );
}

function RatingButton({ color, onClick, label, hint }: { color: string; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md py-3 text-sm font-medium ${color} hover:opacity-90`}
    >
      <div>{label}</div>
      {hint && <div className="text-[10px] opacity-75">{hint}</div>}
    </button>
  );
}

function CardChatDialog({
  open,
  onClose,
  card,
  deckId,
}: {
  open: boolean;
  onClose: () => void;
  card: Card;
  deckId: string;
}) {
  const [input, setInput] = React.useState("");
  const [out, setOut] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function ask() {
    if (!input.trim() || busy) return;
    setBusy(true);
    setOut("");
    const prompt = `Card front: ${card.front}\nCard back: ${card.back}\n\nUser question: ${input}`;
    const res = await fetch(`/api/decks/${deckId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", text: prompt }] }),
    });
    if (!res.body) {
      setBusy(false);
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      setOut(buf);
    }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat with card</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          {card.front}
        </div>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Why is this the answer? Give an example…" />
        <Button onClick={ask} disabled={busy} className="w-full">
          {busy ? "Thinking…" : "Ask"}
        </Button>
        {out && (
          <div className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto border border-border rounded-md p-3">
            {out}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
