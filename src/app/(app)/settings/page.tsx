import { getUser } from "@/lib/supabase/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = (await getUser())!;
  let row: typeof schema.users.$inferSelect | null = null;
  try {
    const [r] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id));
    row = r ?? null;
  } catch {}

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Profile, API keys, language.</p>
      </div>
      <SettingsForm
        email={user.email ?? ""}
        displayName={row?.displayName ?? ""}
        preferredLanguage={row?.preferredLanguage ?? "en"}
        hasGeminiKey={Boolean(row?.geminiApiKey)}
      />
    </div>
  );
}
