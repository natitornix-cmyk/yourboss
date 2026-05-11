"use client";

import * as React from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfPane } from "./pdf-pane";
import { ChatPanel } from "./chat-panel";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";
import { ListChecks, Brain } from "lucide-react";

export type DeckLite = {
  id: string;
  title: string;
  summary: string | null;
  outline: { heading: string; page: number }[];
  topicTags: string[];
  highYieldConcepts: string[];
};

export type QuestionLite = {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  slideRefs: number[];
};

export type FlashcardLite = {
  id: string;
  front: string;
  back: string;
  slideRefs: number[];
};

export function DeckWorkspace({
  deck,
  pdfUrl,
  questions,
  flashcards,
}: {
  deck: DeckLite;
  pdfUrl: string;
  questions: QuestionLite[];
  flashcards: FlashcardLite[];
}) {
  const setChatPrefill = useUiStore((s) => s.setChatPrefill);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="px-4 md:px-6 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-semibold truncate">{deck.title}</h1>
          <div className="flex flex-wrap gap-1 mt-1">
            {deck.topicTags.slice(0, 6).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/decks/${deck.id}/flashcards`}>
              <Brain className="h-4 w-4" /> Flashcards
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/decks/${deck.id}/quiz`}>
              <ListChecks className="h-4 w-4" /> Quiz
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_28rem] min-h-0">
        <PdfPane url={pdfUrl} deckId={deck.id} onAskAi={(t) => setChatPrefill(t)} />

        <div className="border-l border-border flex flex-col min-h-0">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
            <TabsList className="rounded-none border-b border-border bg-background h-12">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 min-h-0 m-0">
              <ChatPanel deckId={deck.id} />
            </TabsContent>

            <TabsContent value="questions" className="flex-1 min-h-0 m-0 overflow-y-auto p-4 space-y-3">
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground">No questions yet.</p>
              )}
              {questions.map((q, i) => (
                <div key={q.id} className="border border-border rounded-lg p-3 text-sm">
                  <div className="font-medium mb-1">Q{i + 1}. {q.stem}</div>
                  <ol className="list-[lower-alpha] pl-5 text-muted-foreground space-y-0.5">
                    {q.options.map((o, idx) => (
                      <li key={idx} className={idx === q.correctIndex ? "text-emerald-400" : ""}>
                        {o}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="flashcards" className="flex-1 min-h-0 m-0 overflow-y-auto p-4 space-y-2">
              {flashcards.length === 0 && (
                <p className="text-sm text-muted-foreground">No flashcards yet.</p>
              )}
              {flashcards.map((f) => (
                <div key={f.id} className="border border-border rounded-lg p-3 text-sm">
                  <div className="font-medium">{f.front}</div>
                  <div className="text-muted-foreground mt-1">{f.back}</div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="notes" className="flex-1 min-h-0 m-0 overflow-y-auto p-4">
              <div className="space-y-3">
                {deck.summary && (
                  <section>
                    <h3 className="font-medium mb-1">Summary</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {deck.summary}
                    </p>
                  </section>
                )}
                {deck.outline.length > 0 && (
                  <section>
                    <h3 className="font-medium mb-1">Outline</h3>
                    <ul className="text-sm space-y-1">
                      {deck.outline.map((o, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>{o.heading}</span>
                          <span className="text-muted-foreground">p. {o.page}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {deck.highYieldConcepts.length > 0 && (
                  <section>
                    <h3 className="font-medium mb-1">High-yield concepts</h3>
                    <ul className="list-disc pl-5 text-sm space-y-0.5">
                      {deck.highYieldConcepts.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
