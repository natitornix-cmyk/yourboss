import { fsrs, generatorParameters, Rating, State, type Card } from "ts-fsrs";

const params = generatorParameters({ enable_fuzz: true });
const scheduler = fsrs(params);

export type RatingName = "again" | "hard" | "good" | "easy";

const ratingMap: Record<RatingName, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export type StoredCard = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview?: Date | null;
};

export function toFsrsCard(s: StoredCard): Card {
  return {
    due: s.due,
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsedDays,
    scheduled_days: s.scheduledDays,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.lastReview ?? undefined,
  };
}

export function fromFsrsCard(c: Card): StoredCard {
  return {
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as number,
    lastReview: c.last_review ?? null,
  };
}

export function reviewCard(s: StoredCard, rating: RatingName, now = new Date()) {
  const card = toFsrsCard(s);
  const schedules = scheduler.repeat(card, now);
  const sel = schedules[ratingMap[rating]];
  return fromFsrsCard(sel.card);
}
