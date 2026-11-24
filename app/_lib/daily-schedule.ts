import { addDaysToDateKey, getWeekStartKey } from "../_data/queries";
import { getDateAtSeoulNoon, isDateKey } from "./time";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getWeekStartForDate(dateKey: string) {
  return getWeekStartKey(getDateAtSeoulNoon(dateKey));
}

export function getWeekdayOffset(dateKey: string, weekStart: string) {
  const date = Date.parse(`${dateKey}T00:00:00Z`);
  const start = Date.parse(`${weekStart}T00:00:00Z`);
  if (Number.isNaN(date) || Number.isNaN(start)) return 0;
  return Math.min(6, Math.max(0, Math.round((date - start) / DAY_IN_MS)));
}

export function moveDateToWeek(dateKey: string, currentWeekStart: string, targetWeekStart: string) {
  return addDaysToDateKey(targetWeekStart, getWeekdayOffset(dateKey, currentWeekStart));
}

export function resolveSelectedScheduleDate({
  requestedDate,
  requestedWeek,
  todayDate,
}: {
  requestedDate?: string;
  requestedWeek?: string;
  todayDate: string;
}) {
  if (isDateKey(requestedDate)) return requestedDate;
  if (isDateKey(requestedWeek)) {
    const weekEnd = addDaysToDateKey(requestedWeek, 6);
    return requestedWeek <= todayDate && todayDate <= weekEnd ? todayDate : requestedWeek;
  }
  return todayDate;
}
