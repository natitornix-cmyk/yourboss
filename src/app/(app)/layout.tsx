import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { db, schema } from "@/db";
import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  // Ensure the user row exists in our app table on every sign-in path.
  try {
    await db
      .insert(schema.users)
      .values({
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.full_name ?? null,
      })
      .onConflictDoNothing();
  } catch (e) {
    console.error("Failed to upsert user row:", e);
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar email={user.email ?? ""} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar email={user.email ?? ""} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
}
