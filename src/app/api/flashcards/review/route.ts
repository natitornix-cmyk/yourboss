import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { reviewCard, type RatingName } from "@/lib/fsrs";

const Body = z.object({
  flashcardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  timeMs: z.number().int().optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const [card] = await db
    .select()
    .from(schema.flashcards)
    .where(
      and(
        eq(schema.flashcards.id, parsed.data.flashcardId),
        eq(schema.flashcards.userId, user.id),
      ),
    );
  if (!card) return NextResponse.json({ error: "card not found" }, { status: 404 });

  const next = reviewCard(
    {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      lastReview: card.lastReview,
    },
    parsed.data.rating as RatingName,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(schema.flashcards)
      .set({
        due: next.due,
        stability: next.stability,
        difficulty: next.difficulty,
        elapsedDays: next.elapsedDays,
        scheduledDays: next.scheduledDays,
        reps: next.reps,
        lapses: next.lapses,
        state: next.state,
        lastReview: next.lastReview ?? new Date(),
      })
      .where(eq(schema.flashcards.id, card.id));

    await tx.insert(schema.flashcardReviews).values({
      flashcardId: card.id,
      userId: user.id,
      rating: parsed.data.rating,
      timeMs: parsed.data.timeMs ?? null,
    });
  });

  return NextResponse.json({ ok: true, due: next.due });
}
