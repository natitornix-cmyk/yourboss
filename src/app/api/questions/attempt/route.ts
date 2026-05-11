import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().int().nullable(),
  isCorrect: z.boolean(),
  flagged: z.boolean().optional(),
  timeMs: z.number().int().optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const [q] = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, parsed.data.questionId));
  if (!q) return NextResponse.json({ error: "question not found" }, { status: 404 });

  await db.insert(schema.questionAttempts).values({
    userId: user.id,
    questionId: parsed.data.questionId,
    selectedIndex: parsed.data.selectedIndex ?? null,
    isCorrect: parsed.data.isCorrect,
    flagged: parsed.data.flagged ?? false,
    timeMs: parsed.data.timeMs ?? null,
  });

  // Update topic_coverage per tag.
  for (const code of q.topicTags ?? []) {
    await db
      .insert(schema.topicCoverage)
      .values({
        userId: user.id,
        topicCode: code,
        questionsAttempted: 1,
        questionsCorrect: parsed.data.isCorrect ? 1 : 0,
        accuracy: parsed.data.isCorrect ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [schema.topicCoverage.userId, schema.topicCoverage.topicCode],
        set: {
          questionsAttempted: sql`${schema.topicCoverage.questionsAttempted} + 1`,
          questionsCorrect: sql`${schema.topicCoverage.questionsCorrect} + ${parsed.data.isCorrect ? 1 : 0}`,
          accuracy: sql`(${schema.topicCoverage.questionsCorrect}::real + ${parsed.data.isCorrect ? 1 : 0}) / (${schema.topicCoverage.questionsAttempted} + 1)`,
          updatedAt: new Date(),
        },
      });
  }

  return NextResponse.json({ ok: true });
}
