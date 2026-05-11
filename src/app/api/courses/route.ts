import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

const Body = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const [course] = await db
    .insert(schema.courses)
    .values({ userId: user.id, ...parsed.data })
    .returning();
  return NextResponse.json({ course });
}
