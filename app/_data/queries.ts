import { eventsById, weekGuides, wildAreaEvent, type WeekGuide } from "./guide-data";

const SEOUL_TIME_ZONE = "Asia/Seoul";

export function getSeoulDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getCurrentWeek(date = new Date()): WeekGuide {
  const key = getSeoulDateKey(date);
  return weekGuides.find((week) => week.startDate <= key && key <= week.endDate) ?? weekGuides[0];
}

export function getTodayEvents(week: WeekGuide, date = new Date()) {
  const key = getSeoulDateKey(date);
  return week.events.filter((event) => event.date === key);
}

export function getUpcomingEvents(week: WeekGuide, date = new Date(), limit = 5) {
  const key = getSeoulDateKey(date);
  return week.events.filter((event) => event.date >= key).slice(0, limit);
}

export function getFeaturedEvent(week: WeekGuide) {
  return eventsById[week.featuredEventId as keyof typeof eventsById] ?? wildAreaEvent;
}

export function getDaysUntil(dateKey: string, date = new Date()) {
  const [todayYear, todayMonth, todayDay] = getSeoulDateKey(date).split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = dateKey.split("-").map(Number);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

export function formatTodayLabel(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: SEOUL_TIME_ZONE, month: "long", day: "numeric" }).format(date);
}
