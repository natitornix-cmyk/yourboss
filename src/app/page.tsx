import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await getUser();
  if (user) redirect("/today");

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-teal-500 flex items-center justify-center font-bold">
            Y
          </div>
          <span className="font-semibold tracking-tight">YourBOSS</span>
        </div>
        <Button asChild variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
          Study smarter for the <span className="text-teal-400">NLE Step 1</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Upload a lecture PDF. Get a tutor that knows it cold — questions,
          flashcards, summaries, and a chat that cites the slide.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in with email</Link>
          </Button>
        </div>
      </section>

      <footer className="px-6 py-6 text-xs text-muted-foreground text-center">
        Built for the NLE Step 1.
      </footer>
    </main>
  );
}
