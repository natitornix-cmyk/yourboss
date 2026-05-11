// JSON schemas passed to Gemini's structured output feature.
// All field names mirror what the application persists.

import { TOPIC_CODES } from "@/lib/nle1";

export const deckProcessingSchema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "A 4-6 sentence overview of the deck." },
    outline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          page: { type: "integer" },
        },
        required: ["heading", "page"],
      },
    },
    topic_tags: {
      type: "array",
      items: { type: "string", enum: TOPIC_CODES },
      description: "NLE1 topic codes that this deck covers.",
    },
    high_yield_concepts: {
      type: "array",
      items: { type: "string" },
    },
    questions: {
      type: "array",
      minItems: 20,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          stem: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
          correct_index: { type: "integer", minimum: 0, maximum: 4 },
          explanation: { type: "string" },
          distractor_rationales: {
            type: "array",
            items: { type: "string" },
            minItems: 5,
            maxItems: 5,
          },
          slide_refs: { type: "array", items: { type: "integer" } },
          topic_tags: { type: "array", items: { type: "string", enum: TOPIC_CODES } },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
        required: [
          "stem",
          "options",
          "correct_index",
          "explanation",
          "distractor_rationales",
          "slide_refs",
        ],
      },
    },
    flashcards: {
      type: "array",
      minItems: 30,
      maxItems: 50,
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
          slide_refs: { type: "array", items: { type: "integer" } },
          topic_tags: { type: "array", items: { type: "string", enum: TOPIC_CODES } },
        },
        required: ["front", "back"],
      },
    },
  },
  required: [
    "summary",
    "outline",
    "topic_tags",
    "high_yield_concepts",
    "questions",
    "flashcards",
  ],
} as const;

export type DeckProcessingResult = {
  summary: string;
  outline: { heading: string; page: number }[];
  topic_tags: string[];
  high_yield_concepts: string[];
  questions: {
    stem: string;
    options: string[];
    correct_index: number;
    explanation: string;
    distractor_rationales: string[];
    slide_refs: number[];
    topic_tags?: string[];
    difficulty?: string;
  }[];
  flashcards: {
    front: string;
    back: string;
    slide_refs?: number[];
    topic_tags?: string[];
  }[];
};
