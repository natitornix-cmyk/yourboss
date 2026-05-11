import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

const Body = z.object({
  displayName: z.string().max(80).optional(),
  preferredLanguage: z.enum(["en", "th"]).optional(),
  geminiApiKey: z.string().min(10).max(200).optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  await db
    .insert(schema.users)
    .values({
      id: user.id,
      email: user.email!,
      ...parsed.data,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: { ...parsed.data, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
