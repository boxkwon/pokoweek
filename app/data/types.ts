export type EventKind = "event" | "raid" | "max" | "community";
export type SourceKind = "official" | "community";

export type DataSource = {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  checkedAt: string;
};

export type Boss = {
  slug: string;
  name: string;
  form?: string;
  dex: number;
  sprite?: string;
  types: string[];
  weaknesses: string[];
  counters: { name: string; note: string }[];
  battleType: "레이드" | "맥스배틀" | "거다이맥스";
  difficulty: string;
  tip: string;
  sourceIds: string[];
};

export type ScheduleItem = {
  id: string;
  title: string;
  kind: EventKind;
  label?: string;
  start: string;
  end: string;
  allDay?: boolean;
  summary: string;
  bossSlugs?: string[];
  eventSlug?: string;
  priority?: "must" | "good" | "info";
};

export type WeeklyOverviewGroup = {
  id: string;
  title: string;
  period: string;
  description: string;
  bossSlugs: string[];
  tone: "raid" | "mega" | "max" | "weekend";
  empty?: boolean;
};

export type GameEvent = {
  slug: string;
  title: string;
  eyebrow: string;
  start: string;
  end: string;
  summary: string;
  highlights: string[];
  checklist: string[];
  bossSlugs: string[];
  sourceIds: string[];
  color: "violet" | "orange" | "blue";
};
