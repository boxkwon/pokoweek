import type { ScheduleFilter } from "../_data/guide-data";

export const SCHEDULE_CATEGORY_KEY = "pokoweek:schedule-category";
export const SCHEDULE_WEEK_KEY = "pokoweek:schedule-week";

export const SCHEDULE_FILTERS: readonly ScheduleFilter[] = [
  "all",
  "tier5",
  "tier3",
  "mega",
  "max",
  "shadow",
  "event",
];

export function normalizeScheduleFilter(value: string | null | undefined): ScheduleFilter | undefined {
  if (value === "five") return "tier5";
  if (value === "three") return "tier3";
  return SCHEDULE_FILTERS.includes(value as ScheduleFilter) ? value as ScheduleFilter : undefined;
}

export function isScheduleWeek(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
