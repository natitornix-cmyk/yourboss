import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  real,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const deckStatusEnum = pgEnum("deck_status", [
  "uploading",
  "processing",
  "ready",
  "failed",
]);

export const highlightColorEnum = pgEnum("highlight_color", [
  "yellow",
  "green",
  "red",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant", "system"]);

export const reviewRatingEnum = pgEnum("review_rating", [
  "again",
  "hard",
  "good",
  "easy",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  geminiApiKey: text("gemini_api_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    color: text("color").default("#0E7C7B"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("courses_user_idx").on(t.userId),
  }),
);

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    storagePath: text("storage_path").notNull(),
    pageCount: integer("page_count").default(0).notNull(),
    status: deckStatusEnum("status").default("uploading").notNull(),
    summary: text("summary"),
    outline: jsonb("outline").$type<{ heading: string; page: number }[]>(),
    topicTags: jsonb("topic_tags").$type<string[]>().default([]),
    highYieldConcepts: jsonb("high_yield_concepts").$type<string[]>().default([]),
    processingError: text("processing_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    courseIdx: index("decks_course_idx").on(t.courseId),
    userIdx: index("decks_user_idx").on(t.userId),
  }),
);

export const slides = pgTable(
  "slides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    title: text("title"),
    content: text("content"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    deckPageIdx: index("slides_deck_page_idx").on(t.deckId, t.pageNumber),
  }),
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    stem: text("stem").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation").notNull(),
    distractorRationales: jsonb("distractor_rationales").$type<string[]>().default([]),
    slideRefs: jsonb("slide_refs").$type<number[]>().default([]),
    topicTags: jsonb("topic_tags").$type<string[]>().default([]),
    difficulty: text("difficulty").default("medium"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    deckIdx: index("questions_deck_idx").on(t.deckId),
  }),
);

export const questionAttempts = pgTable(
  "question_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    selectedIndex: integer("selected_index"),
    isCorrect: boolean("is_correct").notNull(),
    flagged: boolean("flagged").default(false).notNull(),
    timeMs: integer("time_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("attempts_user_idx").on(t.userId),
    qIdx: index("attempts_question_idx").on(t.questionId),
  }),
);

export const flashcards = pgTable(
  "flashcards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    slideRefs: jsonb("slide_refs").$type<number[]>().default([]),
    topicTags: jsonb("topic_tags").$type<string[]>().default([]),
    // FSRS scheduling state
    due: timestamp("due", { withTimezone: true }).defaultNow().notNull(),
    stability: real("stability").default(0).notNull(),
    difficulty: real("difficulty").default(0).notNull(),
    elapsedDays: integer("elapsed_days").default(0).notNull(),
    scheduledDays: integer("scheduled_days").default(0).notNull(),
    reps: integer("reps").default(0).notNull(),
    lapses: integer("lapses").default(0).notNull(),
    state: integer("state").default(0).notNull(), // 0 New, 1 Learning, 2 Review, 3 Relearning
    lastReview: timestamp("last_review", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    deckIdx: index("flashcards_deck_idx").on(t.deckId),
    userDueIdx: index("flashcards_user_due_idx").on(t.userId, t.due),
  }),
);

export const flashcardReviews = pgTable(
  "flashcard_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flashcardId: uuid("flashcard_id").notNull().references(() => flashcards.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: reviewRatingEnum("rating").notNull(),
    timeMs: integer("time_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    cardIdx: index("reviews_card_idx").on(t.flashcardId),
  }),
);

export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").default("New chat").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<number[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    threadIdx: index("chat_msg_thread_idx").on(t.threadId),
  }),
);

export const highlights = pgTable(
  "highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    color: highlightColorEnum("color").notNull(),
    text: text("text").notNull(),
    rects: jsonb("rects")
      .$type<{ x: number; y: number; w: number; h: number }[]>()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    deckIdx: index("hl_deck_idx").on(t.deckId),
  }),
);

export const topicCoverage = pgTable(
  "topic_coverage",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    topicCode: text("topic_code").notNull(), // G1..G9, S1..S11
    deckCount: integer("deck_count").default(0).notNull(),
    questionsAttempted: integer("questions_attempted").default(0).notNull(),
    questionsCorrect: integer("questions_correct").default(0).notNull(),
    coverage: real("coverage").default(0).notNull(), // 0..1
    accuracy: real("accuracy").default(0).notNull(), // 0..1
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.topicCode] }),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  decks: many(decks),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, { fields: [courses.userId], references: [users.id] }),
  decks: many(decks),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  course: one(courses, { fields: [decks.courseId], references: [courses.id] }),
  user: one(users, { fields: [decks.userId], references: [users.id] }),
  slides: many(slides),
  questions: many(questions),
  flashcards: many(flashcards),
  highlights: many(highlights),
  threads: many(chatThreads),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  deck: one(decks, { fields: [flashcards.deckId], references: [decks.id] }),
  reviews: many(flashcardReviews),
}));
