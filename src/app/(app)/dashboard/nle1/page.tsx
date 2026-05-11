import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { getCoverage } from "@/lib/data/queries";
import { NLE1_TOPICS } from "@/lib/nle1";
import { Progress } from "@/components/ui/progress";

export default async function Nle1Page() {
  const user = (await getUser())!;
  let rows: Awaited<ReturnType<typeof getCoverage>> = [];
  try {
    rows = await getCoverage(user.id);
  } catch {}
  const byCode = new Map(rows.map((r) => [r.topicCode, r]));

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">NLE1 coverage</h1>
        <p className="text-muted-foreground mt-1">
          20 topics. Click a tile to drill in.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {NLE1_TOPICS.map((t) => {
          const r = byCode.get(t.code);
          const coverage = Math.round((r?.coverage ?? 0) * 100);
          const accuracy = r && r.questionsAttempted > 0 ? Math.round(r.accuracy * 100) : null;
          return (
            <Link
              key={t.code}
              href={`/dashboard/nle1/${t.code}`}
              className="rounded-xl border border-border bg-card p-4 hover:border-teal-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{t.code}</div>
                {accuracy !== null && (
                  <div className="text-xs font-mono">{accuracy}%</div>
                )}
              </div>
              <div className="font-medium leading-tight mt-1 text-sm">{t.name}</div>
              <div className="mt-3">
                <Progress value={coverage} />
                <div className="text-[10px] text-muted-foreground mt-1">
                  {coverage}% covered · {r?.questionsAttempted ?? 0} Qs
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
