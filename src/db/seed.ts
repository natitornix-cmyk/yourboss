import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("DATABASE_URL required");
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase env vars required");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const demoEmail = "demo@yourboss.app";
  let userId: string;

  // Look up or create the auth user.
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === demoEmail);
  if (existing) {
    userId = existing.id;
    console.log("Using existing demo user", userId);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: "yourboss-demo",
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
    console.log("Created demo user", userId);
  }

  // App-side user row.
  await db
    .insert(schema.users)
    .values({
      id: userId,
      email: demoEmail,
      displayName: "Demo Student",
      preferredLanguage: "en",
    })
    .onConflictDoNothing();

  // Course + deck.
  const [course] = await db
    .insert(schema.courses)
    .values({
      userId,
      title: "Cardio Block",
      description: "Sample course for the demo account.",
      color: "#0E7C7B",
    })
    .returning();

  const [deck] = await db
    .insert(schema.decks)
    .values({
      userId,
      courseId: course.id,
      title: "Heart Failure — Pathophysiology",
      storagePath: `${userId}/${course.id}/demo-heart-failure.pdf`,
      pageCount: 24,
      status: "ready",
      summary:
        "Overview of heart failure: definitions, classification (HFrEF vs HFpEF), Frank-Starling and neurohormonal compensations, common etiologies, and management pillars.",
      outline: [
        { heading: "Definitions and classification", page: 1 },
        { heading: "Pathophysiology", page: 6 },
        { heading: "Compensatory mechanisms", page: 12 },
        { heading: "Clinical features", page: 17 },
        { heading: "Management overview", page: 21 },
      ],
      topicTags: ["S1", "G6"],
      highYieldConcepts: [
        "HFrEF vs HFpEF distinction",
        "RAAS activation in HF",
        "Sympathetic upregulation and downregulation of β1 receptors",
        "Frank-Starling curve shifts",
        "Guideline-directed medical therapy (GDMT)",
      ],
    })
    .returning();

  // Sample questions.
  await db.insert(schema.questions).values([
    {
      deckId: deck.id,
      stem:
        "A 72-year-old man with HFrEF (EF 28%) is started on enalapril. Which mechanism best explains its mortality benefit?",
      options: [
        "Direct positive inotropy",
        "Reduced afterload and neurohormonal blockade",
        "Block of β1-adrenergic receptors",
        "Increased sodium reabsorption",
        "Stimulation of natriuretic peptide release",
      ],
      correctIndex: 1,
      explanation:
        "ACE inhibitors lower afterload, reduce angiotensin II–mediated remodeling, and improve mortality in HFrEF.",
      distractorRationales: [
        "ACEi are not direct inotropes.",
        "Correct.",
        "That is the mechanism of β-blockers (e.g., carvedilol).",
        "ACEi reduce sodium retention by lowering aldosterone, not increase it.",
        "ACEi do not stimulate ANP/BNP release.",
      ],
      slideRefs: [12, 21],
      topicTags: ["S1", "G6"],
      difficulty: "medium",
    },
    {
      deckId: deck.id,
      stem:
        "Which clinical feature is most specific for left-sided heart failure?",
      options: [
        "Peripheral edema",
        "Jugular venous distension",
        "Hepatomegaly",
        "Orthopnea and paroxysmal nocturnal dyspnea",
        "Ascites",
      ],
      correctIndex: 3,
      explanation:
        "Pulmonary congestion features (orthopnea, PND) characterize left-sided failure.",
      distractorRationales: [
        "Right-sided sign.",
        "Right-sided sign.",
        "Right-sided sign.",
        "Correct.",
        "Right-sided sign.",
      ],
      slideRefs: [17],
      topicTags: ["S1"],
      difficulty: "easy",
    },
  ]);

  // Sample flashcards (mix due / future).
  const now = new Date();
  await db.insert(schema.flashcards).values([
    {
      deckId: deck.id,
      userId,
      front: "Define HFrEF.",
      back: "Heart failure with reduced ejection fraction; LVEF ≤ 40%.",
      slideRefs: [3],
      topicTags: ["S1"],
      due: now,
    },
    {
      deckId: deck.id,
      userId,
      front: "Two neurohormonal axes activated in heart failure.",
      back: "RAAS and the sympathetic nervous system.",
      slideRefs: [12],
      topicTags: ["S1", "G6"],
      due: now,
    },
    {
      deckId: deck.id,
      userId,
      front: "GDMT pillars for HFrEF.",
      back: "ARNI/ACEi-ARB, β-blocker, MRA, SGLT2 inhibitor.",
      slideRefs: [21],
      topicTags: ["S1", "G6"],
      due: now,
    },
  ]);

  // Seed coverage row.
  await db
    .insert(schema.topicCoverage)
    .values({ userId, topicCode: "S1", deckCount: 1, coverage: 0.1 })
    .onConflictDoNothing();
  await db
    .insert(schema.topicCoverage)
    .values({ userId, topicCode: "G6", deckCount: 1, coverage: 0.1 })
    .onConflictDoNothing();

  console.log("Seed complete. Demo user:", demoEmail, "/ password: yourboss-demo");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
