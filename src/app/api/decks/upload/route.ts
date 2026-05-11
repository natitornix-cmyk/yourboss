import { NextResponse, after } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient, DECK_BUCKET } from "@/lib/supabase/admin";
import { processDeck } from "@/lib/ai/process-deck";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const courseId = fd.get("courseId") as string | null;
  if (!file || !courseId) {
    return NextResponse.json({ error: "missing file or courseId" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "PDF required" }, { status: 400 });
  }

  // Verify course ownership.
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, courseId));
  if (!course || course.userId !== user.id) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storagePath = `${user.id}/${course.id}/${Date.now()}-${file.name}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from(DECK_BUCKET)
    .upload(storagePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const [deck] = await db
    .insert(schema.decks)
    .values({
      courseId: course.id,
      userId: user.id,
      title: file.name.replace(/\.pdf$/i, ""),
      storagePath,
      status: "processing",
    })
    .returning();

  // Run after the response is sent so the upload feels instant, but keep
  // the function alive (within maxDuration) so Gemini actually completes.
  after(async () => {
    try {
      await processDeck({ deckId: deck.id, userId: user.id, bytes });
    } catch (e) {
      console.error("processDeck failed", e);
      const message = e instanceof Error ? e.message : String(e);
      await db
        .update(schema.decks)
        .set({ status: "failed", processingError: message })
        .where(eq(schema.decks.id, deck.id));
    }
  });

  return NextResponse.json({ deck });
}
