import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { db, schema } from "@/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { topicByCode } from "@/lib/nle1";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TopicDrilldown({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const topic = topicByCode(code);
  if (!topic) notFound();
  const user = (await getUser())!;

  let cov: typeof schema.topicCoverage.$inferSelect | null = null;
  try {
    const [row] = await db
      .select()
      .from(schema.topicCoverage)
      .where(
        and(
          eq(schema.topicCoverage.userId, user.id),
          eq(schema.topicCoverage.topicCode, code),
        ),
      );
    cov = row ?? null;
  } catch {}

  // Decks tagged with this topic.
  let decks: { id: string; title: string }[] = [];
  try {
    decks = await db
      .select({ id: schema.decks.id, title: schema.decks.title })
      .from(schema.decks)
      .where(
        and(
          eq(schema.decks.userId, user.id),
          sql`${schema.decks.topicTags} @> ${JSON.stringify([code])}::jsonb`,
        ),
      )
      .orderBy(desc(schema.decks.createdAt))
      .limit(20);
  } catch {}

  const accuracy = cov && cov.questionsAttempted > 0 ? cov.accuracy : null;
  const coverage = Math.round((cov?.coverage ?? 0) * 100);

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <Link href="/dashboard/nle1" className="text-xs text-muted-foreground">
          ← NLE1 map
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{topic.code}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={coverage} />
            <div className="text-sm text-muted-foreground">
              {coverage}% — {cov?.deckCount ?? 0} deck(s) tagged
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {accuracy !== null ? `${Math.round(accuracy * 100)}%` : "—"}
            </div>
            <div className="text-sm text-muted-foreground">
              {cov?.questionsAttempted ?? 0} questions attempted
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-2">Decks covering this</h2>
        <div className="grid gap-2">
          {decks.length === 0 && (
            <p className="text-sm text-muted-foreground">No decks tagged yet.</p>
          )}
          {decks.map((d) => (
            <Link
              key={d.id}
              href={`/decks/${d.id}`}
              className="block px-4 py-3 rounded-md border border-border hover:bg-secondary text-sm"
            >
              {d.title}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-2">Suggested next</h2>
        <p className="text-sm text-muted-foreground">
          {accuracy !== null && accuracy < 0.7
            ? `Your accuracy here is below 70%. Run a quick tutor session on a deck above.`
            : coverage < 50
              ? `Add more deck material on ${topic.name} to grow coverage.`
              : `Looking solid. Keep up daily reviews to retain.`}
        </p>
      </div>
    </div>
  );
}
