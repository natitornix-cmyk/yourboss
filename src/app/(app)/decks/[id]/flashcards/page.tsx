import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getDeck } from "@/lib/data/queries";
import { db, schema } from "@/db";
import { and, eq, lte } from "drizzle-orm";
import { FlashcardClient } from "./flashcard-client";

export default async function FlashcardReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getUser())!;
  const deck = await getDeck(user.id, id);
  if (!deck) notFound();

  const due = await db
    .select()
    .from(schema.flashcards)
    .where(
      and(
        eq(schema.flashcards.deckId, deck.id),
        eq(schema.flashcards.userId, user.id),
        lte(schema.flashcards.due, new Date()),
      ),
    );

  return (
    <FlashcardClient
      deckId={deck.id}
      deckTitle={deck.title}
      cards={due.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        slideRefs: c.slideRefs ?? [],
      }))}
    />
  );
}
