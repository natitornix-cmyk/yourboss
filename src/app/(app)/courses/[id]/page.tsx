import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getCourse, getDecksForCourse } from "@/lib/data/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeckUploader } from "./deck-uploader";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getUser())!;
  const course = await getCourse(user.id, id);
  if (!course) notFound();
  const decks = await getDecksForCourse(course.id, user.id);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <Link href="/courses" className="text-xs text-muted-foreground hover:text-foreground">
          ← Courses
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-2">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-muted-foreground mt-1">{course.description}</p>
        )}
      </div>

      <DeckUploader courseId={course.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {decks.length === 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No decks yet</CardTitle>
              <CardDescription>Drop a PDF above to get started.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {decks.map((d) => (
          <Link key={d.id} href={`/decks/${d.id}`}>
            <Card className="hover:border-teal-500/50 transition-colors h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  <StatusBadge status={d.status} />
                </div>
                <CardDescription className="line-clamp-2">
                  {d.summary ?? (d.status === "processing" ? "Processing…" : "—")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>{d.pageCount} pages</span>
                {(d.topicTags ?? []).slice(0, 4).map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { v: "default" | "secondary" | "warning" | "danger" | "success"; t: string }> = {
    uploading: { v: "secondary", t: "Uploading" },
    processing: { v: "warning", t: "Processing" },
    ready: { v: "success", t: "Ready" },
    failed: { v: "danger", t: "Failed" },
  };
  const c = map[status] ?? map.ready;
  return <Badge variant={c.v}>{c.t}</Badge>;
}
