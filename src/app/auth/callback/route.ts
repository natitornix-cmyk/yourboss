import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Upsert user row in our application table.
      try {
        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, data.user.id))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(schema.users).values({
            id: data.user.id,
            email: data.user.email!,
            displayName: data.user.user_metadata?.full_name ?? null,
          });
        }
      } catch (e) {
        console.error("Failed to upsert user:", e);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
