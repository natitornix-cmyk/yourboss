import { db, schema } from "@/db";
import { and, desc, eq, lte, sql } from "drizzle-orm";

export async function getCoursesForUser(userId: string) {
  const courses = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      description: schema.courses.description,
      color: schema.courses.color,
      createdAt: schema.courses.createdAt,
      deckCount: sql<number>`count(${schema.decks.id})::int`.as("deck_count"),
    })
    .from(schema.courses)
    .leftJoin(schema.decks, eq(schema.decks.courseId, schema.courses.id))
    .where(eq(schema.courses.userId, userId))
    .groupBy(schema.courses.id)
    .orderBy(desc(schema.courses.createdAt));
  return courses;
}

export async function getCourse(userId: string, courseId: string) {
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(and(eq(schema.courses.id, courseId), eq(schema.courses.userId, userId)));
  return course ?? null;
}

export async function getDecksForCourse(courseId: string, userId: string) {
  return db
    .select()
    .from(schema.decks)
    .where(and(eq(schema.decks.courseId, courseId), eq(schema.decks.userId, userId)))
    .orderBy(desc(schema.decks.createdAt));
}

export async function getDeck(userId: string, deckId: string) {
  const [deck] = await db
    .select()
    .from(schema.decks)
    .where(and(eq(schema.decks.id, deckId), eq(schema.decks.userId, userId)));
  return deck ?? null;
}

export async function getDueFlashcards(userId: string, limit = 50) {
  const now = new Date();
  return db
    .select()
    .from(schema.flashcards)
    .where(and(eq(schema.flashcards.userId, userId), lte(schema.flashcards.due, now)))
    .orderBy(schema.flashcards.due)
    .limit(limit);
}

export async function getRecentDecks(userId: string, limit = 5) {
  return db
    .select()
    .from(schema.decks)
    .where(eq(schema.decks.userId, userId))
    .orderBy(desc(schema.decks.updatedAt))
    .limit(limit);
}

export async function getQuestionsForDeck(deckId: string) {
  return db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.deckId, deckId));
}

export async function getFlashcardsForDeck(deckId: string, userId: string) {
  return db
    .select()
    .from(schema.flashcards)
    .where(and(eq(schema.flashcards.deckId, deckId), eq(schema.flashcards.userId, userId)));
}

export async function getCoverage(userId: string) {
  return db
    .select()
    .from(schema.topicCoverage)
    .where(eq(schema.topicCoverage.userId, userId));
}
