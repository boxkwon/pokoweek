import { eventsById, preparationPlans, weekGuides, wildAreaEvent, type CategoryColor, type WeekEvent, type WeekGuide } from "./guide-data";

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

function dateKeyToUtc(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = dateKeyToUtc(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeekStartKey(date = new Date()) {
  const key = getSeoulDateKey(date);
  const day = dateKeyToUtc(key).getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return addDaysToDateKey(key, -daysFromMonday);
}

export function getWeekByStartDate(startDate: string): WeekGuide {
  const existing = weekGuides.find((week) => week.startDate === startDate);
  if (existing) return existing;
  return {
    id: startDate,
    startDate,
    endDate: addDaysToDateKey(startDate, 6),
    featuredEventId: wildAreaEvent.id,
    priorities: [],
    preparations: [],
    events: [],
  };
}

export function getCurrentWeek(date = new Date()): WeekGuide {
  const key = getSeoulDateKey(date);
  return weekGuides.find((week) => week.startDate <= key && key <= week.endDate) ?? getWeekByStartDate(getWeekStartKey(date));
}

export function getTodayEvents(week: WeekGuide, date = new Date()) {
  const key = getSeoulDateKey(date);
  return getEventsByDate(week.events, key);
}

export function getUpcomingEvents(week: WeekGuide, date = new Date(), limit = 5) {
  const key = getSeoulDateKey(date);
  return getEventsByWeek(week).filter((event) => event.date >= key).slice(0, limit);
}

export function getEventsByWeek(week: WeekGuide) {
  return [...week.events].sort((a, b) => (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date));
}

export function getEventsByDate(events: readonly WeekEvent[], dateKey: string) {
  return events.filter((event) => event.date === dateKey).sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""));
}

export function getEventsByCategory(events: readonly WeekEvent[], category: CategoryColor | "all") {
  return category === "all" ? [...events] : events.filter((event) => event.category === category);
}

export function getImportantEvents(events: readonly WeekEvent[]) {
  return events.filter((event) => event.priority >= 4 || Boolean(event.featuredHour));
}

export function getFeaturedHourEvents(events: readonly WeekEvent[]) {
  return events.filter((event) => Boolean(event.featuredHour));
}

export function getWeekDays(week: WeekGuide, date = new Date()) {
  const todayKey = getSeoulDateKey(date);
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDaysToDateKey(week.startDate, index);
    const value = dateKeyToUtc(dateKey);
    return {
      dateKey,
      weekday: new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" }).format(value),
      day: value.getUTCDate(),
      isToday: dateKey === todayKey,
      isSaturday: value.getUTCDay() === 6,
      isSunday: value.getUTCDay() === 0,
    };
  });
}

export function getAdjacentWeekKey(startDate: string, offset: -1 | 1) {
  return addDaysToDateKey(startDate, offset * 7);
}

export function formatWeekRange(week: WeekGuide) {
  const start = dateKeyToUtc(week.startDate);
  const end = dateKeyToUtc(week.endDate);
  return `${start.getUTCMonth() + 1}월 ${start.getUTCDate()}일 ~ ${end.getUTCMonth() + 1}월 ${end.getUTCDate()}일`;
}

export function formatCompactDate(dateKey: string) {
  const value = dateKeyToUtc(dateKey);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" }).format(value);
  return `${value.getUTCMonth() + 1}/${value.getUTCDate()} ${weekday}`;
}

export function getImportantTime(event: WeekEvent) {
  if (event.summaryTimeMode === "end" && event.endAt) return { time: event.endAt.slice(11, 16), meaning: "이벤트 종료" };
  if (event.featuredHour) return {
    time: event.featuredHour.split("~")[0].trim(),
    meaning: event.category === "legendary" ? "레이드아워" : event.category === "max" ? "맥스배틀 시간" : "집중 시간",
  };
  const time = event.startAt?.slice(11, 16) ?? event.availabilityTime?.split("~")[0].trim() ?? "";
  return { time, meaning: event.category === "event" ? "이벤트 시작" : "출현 시작" };
}

export function getFeaturedEvent(week: WeekGuide) {
  return eventsById[week.featuredEventId as keyof typeof eventsById] ?? wildAreaEvent;
}

export function getEventById(eventId: string) {
  return eventsById[eventId as keyof typeof eventsById];
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

export function getPreparationPlan(planId: string | undefined) {
  return preparationPlans.find((plan) => plan.id === planId);
}

export function getUpcomingPreparationEvent(week: WeekGuide, date = new Date()) {
  const key = getSeoulDateKey(date);
  return getEventsByWeek(week).find((event) => event.date >= key && event.priority >= 4 && Boolean(event.preparationPlanId));
}

export function getNextImportantEvent(week: WeekGuide, currentEvent: WeekEvent) {
  const currentKey = currentEvent.startAt ?? currentEvent.date;
  return getEventsByWeek(week).find((event) => event.id !== currentEvent.id && event.priority >= 4 && (event.startAt ?? event.date) > currentKey);
}
