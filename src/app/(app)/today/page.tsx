import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import {
  getDueFlashcards,
  getRecentDecks,
  getCoverage,
} from "@/lib/data/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Layers3, Sparkles } from "lucide-react";
import { topicByCode } from "@/lib/nle1";
import { pct } from "@/lib/utils";

export default async function TodayPage() {
  const user = (await getUser())!;
  const [due, recent, coverage] = await Promise.all([
    safe(() => getDueFlashcards(user.id, 200), []),
    safe(() => getRecentDecks(user.id, 5), []),
    safe(() => getCoverage(user.id), []),
  ]);

  const weakestTopic = [...coverage]
    .filter((c) => c.questionsAttempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Today
        </h1>
        <p className="text-muted-foreground mt-1">
          {due.length === 0
            ? "Nothing due. Quietly impressive."
            : `${due.length} flashcards due. Tea, then tackle.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-teal-400" /> Due flashcards
            </CardTitle>
            <CardDescription>{due.length} cards waiting</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild disabled={due.length === 0} className="w-full">
              <Link href={due[0] ? `/decks/${due[0].deckId}/flashcards` : "#"}>
                Start review <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-teal-400" /> Recent decks
            </CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">No decks yet.</p>
            )}
            {recent.map((d) => (
              <Link
                key={d.id}
                href={`/decks/${d.id}`}
                className="block px-3 py-2 rounded-md hover:bg-secondary text-sm truncate"
              >
                {d.title}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-400" /> Suggested next
            </CardTitle>
            <CardDescription>
              {weakestTopic
                ? `Weakest area: ${topicByCode(weakestTopic.topicCode)?.name}`
                : "Try a quick quiz to calibrate."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weakestTopic ? (
              <div className="space-y-2">
                <Badge variant="secondary">{weakestTopic.topicCode}</Badge>
                <p className="text-sm text-muted-foreground">
                  {pct(weakestTopic.accuracy)} accuracy across{" "}
                  {weakestTopic.questionsAttempted} questions.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/nle1">Open NLE1 map</Link>
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/courses">Upload a deck</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
