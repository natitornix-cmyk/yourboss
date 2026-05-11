import { GoogleGenAI } from "@google/genai";

export const SYSTEM_INSTRUCTION = `You are a tutor for a Thai medical student preparing for the Thai NLE Step 1.
Cite slides as [Slide N]. Never invent content not in the provided materials.
Reply in the user's preferred language. Be precise and high-yield.`;

export const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

export type ThinkingLevel = "off" | "low" | "medium" | "high";

let _client: GoogleGenAI | null = null;
function client(apiKey?: string) {
  const key = apiKey ?? process.env.GOOGLE_GENAI_API_KEY;
  if (!key) throw new Error("GOOGLE_GENAI_API_KEY is not set");
  if (apiKey) return new GoogleGenAI({ apiKey });
  _client ??= new GoogleGenAI({ apiKey: key });
  return _client;
}

export type GenerateInput =
  | { kind: "text"; text: string }
  | { kind: "pdf"; bytes: Uint8Array; mimeType?: string; prompt: string };

export type GenerateOptions = {
  task: string;
  input: GenerateInput;
  schema?: Record<string, unknown>;
  thinkingLevel?: ThinkingLevel;
  systemInstruction?: string;
  apiKey?: string;
  maxOutputTokens?: number;
  language?: string;
};

export async function generate<T = unknown>(opts: GenerateOptions): Promise<T> {
  const ai = client(opts.apiKey);
  const sys = `${opts.systemInstruction ?? SYSTEM_INSTRUCTION}
Preferred language: ${opts.language ?? "en"}.
Task: ${opts.task}`;

  const contents =
    opts.input.kind === "text"
      ? [{ role: "user", parts: [{ text: opts.input.text }] }]
      : [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: opts.input.mimeType ?? "application/pdf",
                  data: Buffer.from(opts.input.bytes).toString("base64"),
                },
              },
              { text: opts.input.prompt },
            ],
          },
        ];

  const config: Record<string, unknown> = {
    systemInstruction: sys,
    maxOutputTokens: opts.maxOutputTokens ?? 8192,
    thinkingConfig: { thinkingLevel: opts.thinkingLevel ?? "high" },
  };
  if (opts.schema) {
    config.responseMimeType = "application/json";
    config.responseSchema = opts.schema;
  }

  const res = await ai.models.generateContent({
    model: MODEL,
    contents,
    config,
  });

  const text = (res as { text?: string }).text ?? "";
  if (opts.schema) {
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new Error(
        `Gemini returned invalid JSON: ${(e as Error).message}\n${text.slice(0, 400)}`,
      );
    }
  }
  return text as T;
}

export async function* streamChat(opts: {
  apiKey?: string;
  history: { role: "user" | "model"; text: string }[];
  pdfBytes?: Uint8Array;
  language?: string;
}) {
  const ai = client(opts.apiKey);
  const sys = `${SYSTEM_INSTRUCTION}
Preferred language: ${opts.language ?? "en"}.
Always cite the slide for any factual claim using [Slide N].`;

  const contents = opts.history.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  })) as Array<{
    role: string;
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }>;

  if (opts.pdfBytes && contents[0]) {
    contents[0].parts.unshift({
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(opts.pdfBytes).toString("base64"),
      },
    });
  }

  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: {
      systemInstruction: sys,
      thinkingConfig: { thinkingLevel: "medium" },
    },
  });

  for await (const chunk of stream) {
    const t = (chunk as { text?: string }).text;
    if (t) yield t;
  }
}
