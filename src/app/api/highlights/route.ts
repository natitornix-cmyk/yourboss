import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({
  deckId: z.string().uuid(),
  pageNumber: z.number().int().min(1),
  color: z.enum(["yellow", "green", "red"]),
  text: z.string().min(1),
  rects: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
    )
    .optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const [deck] = await db
    .select()
    .from(schema.decks)
    .where(
      and(
        eq(schema.decks.id, parsed.data.deckId),
        eq(schema.decks.userId, user.id),
      ),
    );
  if (!deck) return NextResponse.json({ error: "deck not found" }, { status: 404 });

  const [row] = await db
    .insert(schema.highlights)
    .values({
      deckId: parsed.data.deckId,
      userId: user.id,
      pageNumber: parsed.data.pageNumber,
      color: parsed.data.color,
      text: parsed.data.text,
      rects: parsed.data.rects ?? [],
    })
    .returning();
  return NextResponse.json({ highlight: row });
}
