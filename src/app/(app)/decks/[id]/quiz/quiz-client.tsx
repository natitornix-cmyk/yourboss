"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Flag, ChevronRight, Timer, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Q = {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  distractorRationales: string[];
  slideRefs: number[];
};

type Mode = "tutor" | "timed" | "practice";

export function QuizClient({
  deckId,
  deckTitle,
  questions,
}: {
  deckId: string;
  deckTitle: string;
  questions: Q[];
}) {
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [pool, setPool] = React.useState<Q[]>([]);
  const [i, setI] = React.useState(0);
  const [chosen, setChosen] = React.useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = React.useState<boolean[]>([]);
  const [strike, setStrike] = React.useState<Record<string, boolean[]>>({});
  const [flagged, setFlagged] = React.useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = React.useState(45 * 60);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "timed" || finished) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [mode, finished]);

  React.useEffect(() => {
    if (mode === "timed" && secondsLeft <= 0) setFinished(true);
  }, [mode, secondsLeft]);

  function start(m: Mode) {
    const count = m === "timed" ? Math.min(30, questions.length) : questions.length;
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, count);
    setPool(shuffled);
    setChosen(new Array(shuffled.length).fill(null));
    setSubmitted(new Array(shuffled.length).fill(false));
    setStrike({});
    setFlagged({});
    setI(0);
    setMode(m);
    setSecondsLeft(45 * 60);
    setFinished(false);
  }

  if (!mode) {
    return (
      <div className="container max-w-2xl py-12 space-y-6">
        <div>
          <Link href={`/decks/${deckId}`} className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to deck
          </Link>
          <h1 className="text-2xl font-semibold mt-2">{deckTitle} — Quiz</h1>
          <p className="text-muted-foreground mt-1">{questions.length} questions available</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <ModeCard title="Tutor" desc="Instant feedback per question." onClick={() => start("tutor")} />
          <ModeCard title="Timed exam" desc="30 questions in 45 min." onClick={() => start("timed")} />
          <ModeCard title="Practice" desc="Untimed, review at the end." onClick={() => start("practice")} />
        </div>
      </div>
    );
  }

  if (finished) {
    const score = pool.reduce((acc, q, idx) => acc + (chosen[idx] === q.correctIndex ? 1 : 0), 0);
    return (
      <div className="container max-w-3xl py-12 space-y-6">
        <h1 className="text-2xl font-semibold">Session complete</h1>
        <p className="text-muted-foreground">
          You scored <span className="text-foreground font-medium">{score} / {pool.length}</span>{" "}
          ({Math.round((score / pool.length) * 100)}%).
        </p>
        <div className="space-y-3">
          {pool.map((q, idx) => {
            const c = chosen[idx];
            const correct = c === q.correctIndex;
            return (
              <Review key={q.id} q={q} chosen={c} correct={correct} idx={idx} />
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/decks/${deckId}`}>Back to deck</Link>
          </Button>
          <Button onClick={() => setMode(null)}>New session</Button>
        </div>
      </div>
    );
  }

  const q = pool[i];
  const isTutor = mode === "tutor";
  const sub = submitted[i];

  function toggleStrike(idx: number) {
    setStrike((s) => {
      const arr = s[q.id] ?? new Array(q.options.length).fill(false);
      const copy = [...arr];
      copy[idx] = !copy[idx];
      return { ...s, [q.id]: copy };
    });
  }

  function choose(idx: number) {
    if (sub) return;
    setChosen((c) => {
      const cp = [...c];
      cp[i] = idx;
      return cp;
    });
  }

  function submit() {
    if (chosen[i] == null) return;
    setSubmitted((s) => {
      const cp = [...s];
      cp[i] = true;
      return cp;
    });
    if (!isTutor) next();
  }

  function next() {
    if (i + 1 >= pool.length) {
      setFinished(true);
    } else {
      setI(i + 1);
    }
  }

  const timeStr = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={`/decks/${deckId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 text-sm">
          <div className="text-muted-foreground">{deckTitle}</div>
          <div>Question {i + 1} of {pool.length}</div>
        </div>
        {mode === "timed" && (
          <Badge variant="outline" className="text-sm">
            <Timer className="h-3 w-3 mr-1" /> {timeStr}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}
          title="Flag for review"
        >
          <Flag className={cn("h-4 w-4", flagged[q.id] && "fill-amber-400 text-amber-400")} />
        </Button>
      </header>

      <div className="flex-1 container max-w-3xl py-8 space-y-4">
        <div className="text-base md:text-lg leading-relaxed">{q.stem}</div>

        <div className="space-y-2">
          {q.options.map((o, idx) => {
            const strikeOn = strike[q.id]?.[idx];
            const isChosen = chosen[i] === idx;
            const isCorrect = idx === q.correctIndex;
            const showResult = sub;
            return (
              <div key={idx} className="flex items-stretch gap-2">
                <button
                  onClick={() => choose(idx)}
                  disabled={sub}
                  className={cn(
                    "flex-1 text-left px-4 py-3 rounded-md border text-sm transition-colors",
                    !showResult && isChosen && "border-teal-500 bg-teal-500/10",
                    !showResult && !isChosen && "border-border hover:bg-secondary",
                    showResult && isCorrect && "border-emerald-500/60 bg-emerald-500/10",
                    showResult && !isCorrect && isChosen && "border-red-500/60 bg-red-500/10",
                    strikeOn && "line-through opacity-50",
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {o}
                </button>
                <button
                  onClick={() => toggleStrike(idx)}
                  className="px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Strike out"
                >
                  /
                </button>
              </div>
            );
          })}
        </div>

        {isTutor && sub && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              {chosen[i] === q.correctIndex ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-emerald-300">Correct</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="font-medium text-red-300">Incorrect</span>
                </>
              )}
            </div>
            <p className="text-sm">{q.explanation}</p>
            {q.distractorRationales.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">Why wrong?</summary>
                <ul className="mt-2 space-y-1">
                  {q.distractorRationales.map((r, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      <span className="font-mono mr-1">{String.fromCharCode(65 + idx)}.</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {q.slideRefs.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Slides:{" "}
                {q.slideRefs.map((s, idx) => (
                  <Link key={idx} href={`/decks/${deckId}#slide-${s}`} className="text-teal-400 mr-2">
                    [Slide {s}]
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 pt-4">
          <Button variant="ghost" onClick={() => setFinished(true)}>End session</Button>
          {sub && isTutor ? (
            <Button onClick={next}>
              {i + 1 >= pool.length ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={chosen[i] == null}>
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left border border-border rounded-xl p-5 hover:border-teal-500/50 transition-colors"
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}

function Review({ q, chosen, correct, idx }: { q: Q; chosen: number | null; correct: boolean; idx: number }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {correct ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
        <span className="text-sm font-medium">Q{idx + 1}</span>
      </div>
      <div className="text-sm">{q.stem}</div>
      <div className="text-xs text-muted-foreground mt-1">
        Your answer: {chosen != null ? String.fromCharCode(65 + chosen) : "—"} · Correct: {String.fromCharCode(65 + q.correctIndex)}
      </div>
    </div>
  );
}
