// NLE1 Step 1 topic taxonomy used throughout the app.
export type Nle1Topic = {
  code: string;
  name: string;
  group: "G" | "S";
};

export const NLE1_TOPICS: Nle1Topic[] = [
  { code: "G1", name: "Cell & Molecular Biology", group: "G" },
  { code: "G2", name: "Genetics", group: "G" },
  { code: "G3", name: "Microbiology", group: "G" },
  { code: "G4", name: "Immunology", group: "G" },
  { code: "G5", name: "Pathology", group: "G" },
  { code: "G6", name: "Pharmacology", group: "G" },
  { code: "G7", name: "Behavioral Sciences", group: "G" },
  { code: "G8", name: "Biostatistics & Epidemiology", group: "G" },
  { code: "G9", name: "Public Health & Ethics", group: "G" },
  { code: "S1", name: "Cardiovascular", group: "S" },
  { code: "S2", name: "Respiratory", group: "S" },
  { code: "S3", name: "Renal & Urinary", group: "S" },
  { code: "S4", name: "Gastrointestinal", group: "S" },
  { code: "S5", name: "Endocrine", group: "S" },
  { code: "S6", name: "Reproductive", group: "S" },
  { code: "S7", name: "Hematology & Oncology", group: "S" },
  { code: "S8", name: "Musculoskeletal", group: "S" },
  { code: "S9", name: "Nervous System", group: "S" },
  { code: "S10", name: "Skin & Connective Tissue", group: "S" },
  { code: "S11", name: "Special Senses", group: "S" },
];

export const TOPIC_CODES = NLE1_TOPICS.map((t) => t.code);

export function topicByCode(code: string) {
  return NLE1_TOPICS.find((t) => t.code === code);
}
