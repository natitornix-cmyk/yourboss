import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getDeck, getQuestionsForDeck } from "@/lib/data/queries";
import { QuizClient } from "./quiz-client";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getUser())!;
  const deck = await getDeck(user.id, id);
  if (!deck) notFound();
  const questions = await getQuestionsForDeck(deck.id);

  return (
    <QuizClient
      deckId={deck.id}
      deckTitle={deck.title}
      questions={questions.map((q) => ({
        id: q.id,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        distractorRationales: q.distractorRationales ?? [],
        slideRefs: q.slideRefs ?? [],
      }))}
    />
  );
}
