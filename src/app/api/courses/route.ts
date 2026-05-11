import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

const Body = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  color: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    // Make sure the app-level user row exists before inserting a course
    // that FKs into it. The layout upsert can fail silently in some flows.
    await db
      .insert(schema.users)
      .values({
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.full_name ?? null,
      })
      .onConflictDoNothing();

    const { description, ...rest } = parsed.data;
    const [course] = await db
      .insert(schema.courses)
      .values({
        userId: user.id,
        ...rest,
        description: description && description.length > 0 ? description : null,
      })
      .returning();
    return NextResponse.json({ course });
  } catch (e) {
    console.error("Failed to create course:", e);
    const message = e instanceof Error ? e.message : "Failed to create course";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
