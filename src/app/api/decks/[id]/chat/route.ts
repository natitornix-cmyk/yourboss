import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { createAdminClient, DECK_BUCKET } from "@/lib/supabase/admin";
import { streamChat } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; text: string }[];
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const [deck] = await db
    .select()
    .from(schema.decks)
    .where(and(eq(schema.decks.id, id), eq(schema.decks.userId, user.id)));
  if (!deck) return NextResponse.json({ error: "deck not found" }, { status: 404 });

  const [userRow] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, user.id));

  const admin = createAdminClient();
  const { data: file, error: dlErr } = await admin.storage
    .from(DECK_BUCKET)
    .download(deck.storagePath);
  if (dlErr || !file) {
    return NextResponse.json({ error: "could not load PDF" }, { status: 500 });
  }
  const pdfBytes = new Uint8Array(await file.arrayBuffer());

  const history = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    text: m.text,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat({
          apiKey: userRow?.geminiApiKey ?? undefined,
          history,
          pdfBytes,
          language: userRow?.preferredLanguage ?? "en",
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(`\n\n[error: ${(e as Error).message}]`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
