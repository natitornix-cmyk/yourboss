import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getDeck, getQuestionsForDeck, getFlashcardsForDeck } from "@/lib/data/queries";
import { createAdminClient, DECK_BUCKET } from "@/lib/supabase/admin";
import { DeckWorkspace } from "./deck-workspace";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getUser())!;
  const deck = await getDeck(user.id, id);
  if (!deck) notFound();

  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from(DECK_BUCKET)
    .createSignedUrl(deck.storagePath, 60 * 60);

  const [questions, flashcards] = await Promise.all([
    getQuestionsForDeck(deck.id),
    getFlashcardsForDeck(deck.id, user.id),
  ]);

  if (deck.status !== "ready") {
    return (
      <div className="container max-w-3xl py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold">{deck.title}</h1>
        <p className="text-muted-foreground">
          {deck.status === "processing"
            ? "Gemini is reading the deck and generating questions, flashcards, and a summary. This usually takes 1–2 minutes."
            : deck.status === "failed"
              ? `Processing failed: ${deck.processingError ?? "unknown error"}`
              : "Uploading…"}
        </p>
        <Link href={`/courses/${deck.courseId}`} className="text-teal-400 underline text-sm">
          ← Back to course
        </Link>
      </div>
    );
  }

  return (
    <DeckWorkspace
      deck={{
        id: deck.id,
        title: deck.title,
        summary: deck.summary,
        outline: deck.outline ?? [],
        topicTags: deck.topicTags ?? [],
        highYieldConcepts: deck.highYieldConcepts ?? [],
      }}
      pdfUrl={signed?.signedUrl ?? ""}
      questions={questions.map((q) => ({
        id: q.id,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        slideRefs: q.slideRefs ?? [],
      }))}
      flashcards={flashcards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        slideRefs: c.slideRefs ?? [],
      }))}
    />
  );
}
