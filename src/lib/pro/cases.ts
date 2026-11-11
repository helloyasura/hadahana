import { z } from "zod";
import { studioBirthSchema, civilDateSchema } from "./input";
import {
  studioSettingsSchema,
  RASHIS,
  positionInfo,
  studioHouse,
} from "./studio";
import { PLANET_REFERENCE, CLASSICAL_PLANETS } from "./references";
import { dashaTree, periodPath } from "./dasha";
import type { CaseDocument } from "./document";
import type { DocumentReading } from "./document-reading";
import type { Client } from "./store";

export const serviceKinds = [
  "reading",
  "marriage",
  "nakath",
  "naming",
  "periods",
] as const;
export const serviceKindSchema = z.enum(serviceKinds);
export const serviceSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(100),
  kind: serviceKindSchema,
});
export type CaseService = z.infer<typeof serviceSchema>;
export const defaultServices: CaseService[] = [
  {
    id: "reading",
    kind: "reading",
    name: "කේන්ද්‍ර විමර්ශනය / Horoscope reading",
  },
  {
    id: "marriage",
    kind: "marriage",
    name: "විවාහ සැසඳීම / Marriage matching",
  },
  { id: "nakath", kind: "nakath", name: "නැකත් / Muhurta shortlist" },
  { id: "naming", kind: "naming", name: "නම් තැබීම / Naming consultation" },
  { id: "periods", kind: "periods", name: "අපල කාල / Difficult periods" },
];
export const caseStatuses = [
  "new",
  "in_progress",
  "waiting",
  "completed",
] as const;
export const statusLabels: Record<(typeof caseStatuses)[number], string> = {
  new: "නව / New",
  in_progress: "විමර්ශනයේ / In progress",
  waiting: "පිළිතුරු අපේක්ෂිත / Waiting for customer",
  completed: "සම්පූර්ණ / Completed",
};
const birth = studioBirthSchema;
export const consultationStateSchema = z.object({
  tab: z.enum(["panchanga", "match", "nakath"]),
  a: birth,
  b: birth,
  from: civilDateSchema,
  to: civilDateSchema,
  event: z.string().max(80),
});
export type ConsultationState = z.infer<typeof consultationStateSchema>;
export const transitStateSchema = z.object({
  instant: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  planet: z.string().max(30),
  target: z.number().int().min(0).max(11),
  days: z.number().int().min(1).max(366),
  natal: birth.optional(),
  active: z.boolean(),
  shownInstant: z.iso.datetime().optional(),
});
export type TransitState = z.infer<typeof transitStateSchema>;
export const caseStudioSchema = z.object({
  input: birth,
  settings: studioSettingsSchema,
  selected: z.string().max(30),
  dasha: z
    .object({
      maha: z.number().int().min(0).max(20),
      bhukti: z.number().int().min(0).max(8),
      date: z.union([civilDateSchema, z.literal("")]),
    })
    .optional(),
  transit: transitStateSchema.optional(),
  consultation: consultationStateSchema.optional(),
  comparisonId: z.union([z.uuid(), z.literal("")]).optional(),
  evidence: z
    .object({
      topic: z.enum(["career", "marriage", "periods"]),
      date: civilDateSchema,
    })
    .optional(),
});
export type CaseStudioState = z.infer<typeof caseStudioSchema>;
export type Finding = {
  id: string;
  title: string;
  text: string;
  at: number;
  state: CaseStudioState;
};
export type CaseReport = {
  id: string;
  version: number;
  stage: "draft" | "final";
  language: "si" | "en";
  title: string;
  body: string;
  findings: Finding[];
  branding: { displayName: string; qualifications: string; contact: string };
  at: number;
  issuedAt?: number;
};
export type CaseFile = {
  document?: CaseDocument;
  documentReading?: DocumentReading;
  timeUnsure?: boolean;
  placeLabel?: string;
  rectification?: {
    at: number;
    reason: string;
    original: CaseStudioState["input"];
    corrected: CaseStudioState["input"];
  };
  revision: number;
  status: (typeof caseStatuses)[number];
  assignedTo: string | null;
  serviceId: string;
  question: string;
  notes: string;
  checked: string[];
  state: CaseStudioState;
  findings: Finding[];
  reports: CaseReport[];
  timeline: { at: number; action: string }[];
};
export function initialCase(
  client: Pick<Client, "input" | "manifest" | "createdAt">,
): CaseFile {
  return {
    revision: 0,
    status: "new",
    assignedTo: null,
    serviceId: "reading",
    question: "",
    notes: "",
    checked: [],
    state: caseStudioSchema.parse({
      input: client.input,
      settings: { calculation: client.manifest.config },
      selected: "Moon",
    }),
    findings: [],
    reports: [],
    timeline: [
      {
        at: client.createdAt,
        action: "Request/chart received · consent pro-v1",
      },
    ],
  };
}
export function recordCaseStep(
  file: CaseFile,
  action: string,
  now = Date.now(),
) {
  file.revision++;
  file.timeline.push({ at: now, action });
  file.timeline = file.timeline.slice(-100);
}
export function canComplete(file: CaseFile) {
  return file.reports.some((r) => r.stage === "final" && !!r.issuedAt);
}
export function checklist(kind: CaseService["kind"]) {
  const common = [
    {
      id: "verify",
      label: "උපන් වේලාව, ස්ථානය, අවසරය තහවුරු කරන්න",
      tool: "studio",
    },
    {
      id: "method",
      label: "අයනාංශ / භාව / node ක්‍රමය සටහන් කරන්න",
      tool: "studio",
    },
  ];
  const specific: Record<
    CaseService["kind"],
    { id: string; label: string; tool: string }[]
  > = {
    reading: [
      { id: "houses", label: "ලග්නය, භාව හා අධිපති සොයන්න", tool: "evidence" },
      {
        id: "yogas",
        label: "යෝග අපේක්ෂකයන් හා සීමාවන් පරීක්ෂා කරන්න",
        tool: "studio",
      },
      { id: "dasha", label: "දශා / ගෝචර සාක්ෂි සසඳන්න", tool: "studio" },
    ],
    marriage: [
      {
        id: "consent-b",
        label: "දෙවන පාර්ශ්වයේ අවසරය හා දත්ත තහවුරු කරන්න",
        tool: "tools",
      },
      { id: "compare", label: "දෙපාර්ශ්වයේ කේන්ද්‍ර සසඳන්න", tool: "compare" },
      {
        id: "matching",
        label: "පොරොන්දම් හා දශා වෙන වෙනම විමර්ශනය කරන්න",
        tool: "tools",
      },
    ],
    nakath: [
      {
        id: "event",
        label: "කාර්යය, ස්ථානය හා දින පරාසය සටහන් කරන්න",
        tool: "tools",
      },
      { id: "pan", label: "පංචාංග / රාහු කාලය පරීක්ෂා කරන්න", tool: "tools" },
      {
        id: "muhurta",
        label: "දින shortlist අතින් සත්‍යාපනය කරන්න (අවසන් මුහුර්තයක් නොවේ)",
        tool: "tools",
      },
    ],
    naming: [
      {
        id: "moon",
        label: "චන්ද්‍ර නැකත, පාදය හා නාම අක්ෂර යොමුව බලන්න",
        tool: "studio",
      },
      {
        id: "culture",
        label: "භාෂාව, පවුල් කැමැත්ත හා නමේ අර්ථය සටහන් කරන්න",
        tool: "evidence",
      },
    ],
    periods: [
      { id: "period", label: "මහා / භුක්ති / අන්තර සොයන්න", tool: "studio" },
      {
        id: "transit",
        label: "ගෝචර / ප්‍රවේශ සහ ජන්මය සසඳන්න",
        tool: "studio",
      },
      {
        id: "support",
        label: "අවිනිශ්චිතතාව හා ප්‍රායෝගික සහාය සටහන් කරන්න",
        tool: "evidence",
      },
    ],
  };
  return [
    ...common,
    ...specific[kind],
    {
      id: "review",
      label: "සාක්ෂි සහ සීමාවන් සමඟ වාර්තාව සමාලෝචනය කරන්න",
      tool: "report",
    },
  ];
}
export function reportDraft(language: "si" | "en", findings: Finding[]) {
  const heading =
    language === "si"
      ? "විමර්ශන සාරාංශය\n\nඔබගේ ප්‍රශ්නය:\n\nනිරීක්ෂණ හා මඟපෙන්වීම:"
      : "Consultation summary\n\nYour question:\n\nObservations and guidance:";
  return `${heading}\n\n${findings.map((f) => `${f.title}`).join("\n\n")}\n\n${language === "si" ? "සීමාවන්: සම්ප්‍රදායික අධ්‍යයනයක් පමණි. නිශ්චිත අනාවැකි නොවේ. වෛද්‍ය, නීති හෝ මූල්‍ය උපදෙස් වෙනුවට භාවිත නොකරන්න." : "Limitations: traditional interpretation, not a certain prediction. Not a substitute for medical, legal or financial advice."}`;
}
/** Evidence, not predictions: D1 whole-sign lordships; configured bhava placement is labelled separately. */
export function questionEvidence(
  result: Client["result"],
  topic: "career" | "marriage" | "periods",
  instant: string,
) {
  const houses =
    topic === "career"
      ? [2, 6, 10, 11]
      : topic === "marriage"
        ? [2, 7, 11]
        : [1, 6, 8, 12];
  const asc = result.lagna.longitudeExact ?? result.lagna.longitude;
  const rows = houses.map((house) => {
    const sign = (positionInfo(asc).sign + house - 1) % 12;
    const lord = CLASSICAL_PLANETS.find((p) =>
      PLANET_REFERENCE[p].own.includes(sign),
    )!;
    const planet = result.navagraha.find((p) => p.graha === lord)!;
    return {
      house,
      sign: RASHIS[sign],
      lord,
      lordHouse: studioHouse(
        planet.longitudeExact ?? planet.longitude,
        asc,
        "whole-sign",
      ),
      occupants: result.navagraha
        .filter(
          (p) =>
            studioHouse(p.longitudeExact ?? p.longitude, asc, "whole-sign") ===
            house,
        )
        .map((p) => p.graha),
    };
  });
  const periods = periodPath(
    dashaTree(
      result.chandra.longitudeExact ?? result.chandra.longitude,
      result.native.utcTime,
      result.vimshottari.convention.yearDays as 360 | 365.25,
    ),
    Date.parse(instant),
  ).map((p) => ({
    lord: p.lord,
    start: new Date(p.start).toISOString(),
    end: new Date(p.end).toISOString(),
  }));
  return { rows, periods };
}

/** Civil clock scrubber, not elapsed zoned time. Round to whole minutes to avoid
 * floating-point steps producing 12:06:59.999 instead of 12:07. The server still
 * validates historical timezone/DST resolution before accepting a calculation. */
export function shiftCivilClock(
  birth: { date: string; time: string },
  hours: number,
) {
  const ms =
    Date.parse(`${birth.date}T${birth.time}:00Z`) +
    Math.round(hours * 60) * 60000;
  if (!Number.isFinite(ms)) throw new Error("Invalid civil clock");
  const iso = new Date(ms).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}
