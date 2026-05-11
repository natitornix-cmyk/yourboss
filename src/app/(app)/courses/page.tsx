import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { getCoursesForUser } from "@/lib/data/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewCourseButton } from "./new-course-button";

export default async function CoursesPage() {
  const user = (await getUser())!;
  let courses: Awaited<ReturnType<typeof getCoursesForUser>> = [];
  try {
    courses = await getCoursesForUser(user.id);
  } catch {}

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Organize your blocks. Drop PDFs into a deck.</p>
        </div>
        <NewCourseButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.length === 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No courses yet</CardTitle>
              <CardDescription>Create one to start uploading deck PDFs.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {courses.map((c) => (
          <Link key={c.id} href={`/courses/${c.id}`}>
            <Card className="hover:border-teal-500/50 transition-colors h-full">
              <CardHeader>
                <div
                  className="h-1.5 w-12 rounded-full mb-2"
                  style={{ background: c.color ?? "#0E7C7B" }}
                />
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.description ?? "—"}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {c.deckCount} deck{c.deckCount === 1 ? "" : "s"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
