import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { generate } from "./gemini";
import { deckProcessingSchema, type DeckProcessingResult } from "./schemas";
import { TOPIC_CODES } from "@/lib/nle1";

export async function processDeck({
  deckId,
  userId,
  bytes,
}: {
  deckId: string;
  userId: string;
  bytes: Uint8Array;
}) {
  await db
    .update(schema.decks)
    .set({ status: "processing" })
    .where(eq(schema.decks.id, deckId));

  const prompt = `Analyze the attached lecture PDF for a Thai medical student preparing the NLE Step 1.
Return ONLY JSON matching the schema. Cite slide numbers (1-indexed by PDF page).
Generate a 4-6 sentence summary, an outline of major sections with their starting page,
NLE1 topic codes (subset of: ${TOPIC_CODES.join(", ")}), 5-12 high-yield concepts,
30 USMLE-style 5-option MCQs (with explanations and per-distractor rationales),
and 50 atomic flashcards. Anchor every question and flashcard to a slide.`;

  const result = await generate<DeckProcessingResult>({
    task: "deck-process",
    input: { kind: "pdf", bytes, prompt },
    schema: deckProcessingSchema as unknown as Record<string, unknown>,
    thinkingLevel: "high",
    maxOutputTokens: 32000,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(schema.decks)
      .set({
        status: "ready",
        summary: result.summary,
        outline: result.outline,
        topicTags: result.topic_tags,
        highYieldConcepts: result.high_yield_concepts,
        updatedAt: new Date(),
      })
      .where(eq(schema.decks.id, deckId));

    if (result.questions.length > 0) {
      await tx.insert(schema.questions).values(
        result.questions.map((q) => ({
          deckId,
          stem: q.stem,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation,
          distractorRationales: q.distractor_rationales ?? [],
          slideRefs: q.slide_refs ?? [],
          topicTags: q.topic_tags ?? [],
          difficulty: q.difficulty ?? "medium",
        })),
      );
    }

    if (result.flashcards.length > 0) {
      await tx.insert(schema.flashcards).values(
        result.flashcards.map((c) => ({
          deckId,
          userId,
          front: c.front,
          back: c.back,
          slideRefs: c.slide_refs ?? [],
          topicTags: c.topic_tags ?? [],
          due: new Date(),
        })),
      );
    }

    // Update topic_coverage rows.
    for (const code of result.topic_tags) {
      await tx
        .insert(schema.topicCoverage)
        .values({
          userId,
          topicCode: code,
          deckCount: 1,
          coverage: Math.min(1, 0.1),
        })
        .onConflictDoUpdate({
          target: [schema.topicCoverage.userId, schema.topicCoverage.topicCode],
          set: {
            deckCount: sql`${schema.topicCoverage.deckCount} + 1`,
            coverage: sql`LEAST(1, ${schema.topicCoverage.coverage} + 0.1)`,
            updatedAt: new Date(),
          },
        });
    }
  });
}
