import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { ilike, eq, and, desc } from "drizzle-orm";
import { getUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ decks: [] }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const decks = await db
      .select({
        id: schema.decks.id,
        title: schema.decks.title,
        courseId: schema.decks.courseId,
      })
      .from(schema.decks)
      .where(
        q
          ? and(eq(schema.decks.userId, user.id), ilike(schema.decks.title, `%${q}%`))
          : eq(schema.decks.userId, user.id),
      )
      .orderBy(desc(schema.decks.createdAt))
      .limit(15);
    return NextResponse.json({ decks });
  } catch {
    return NextResponse.json({ decks: [] });
  }
}
