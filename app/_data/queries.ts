import { getAppNow } from "../_lib/time";
import { crossWeekEvents, eventsById, pokemonGuides, preparationPlans, weekGuides, type GuideCategory, type ScheduleFilter, type WeekEvent, type WeekGuide } from "./guide-data";

const SEOUL_TIME_ZONE = "Asia/Seoul";

export function getSeoulDateKey(date = getAppNow()) {
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

export function getWeekStartKey(date = getAppNow()) {
  const key = getSeoulDateKey(date);
  const day = dateKeyToUtc(key).getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return addDaysToDateKey(key, -daysFromMonday);
}

export function getWeekByStartDate(startDate: string): WeekGuide {
  const existing = weekGuides.find((week) => week.startDate === startDate);
  if (existing) return existing;
  const endDate = addDaysToDateKey(startDate, 6);
  return {
    id: startDate,
    startDate,
    endDate,
    featuredEventId: undefined,
    priorities: [],
    preparations: [],
    events: crossWeekEvents.filter((event) => getEventStartDateKey(event) <= endDate && getEventEndDateKey(event) >= startDate),
  };
}

export function getCurrentWeek(date = getAppNow()): WeekGuide {
  const key = getSeoulDateKey(date);
  return weekGuides.find((week) => week.startDate <= key && key <= week.endDate) ?? getWeekByStartDate(getWeekStartKey(date));
}

export function getTodayEvents(week: WeekGuide, date = getAppNow()) {
  const key = getSeoulDateKey(date);
  return getEventsByDate(week.events, key);
}

export function getUpcomingEvents(week: WeekGuide, date = getAppNow(), limit = 5) {
  const key = getSeoulDateKey(date);
  return getEventsByWeek(week).filter((event) => getEventEndDateKey(event) >= key).slice(0, limit);
}

export function getEventsByWeek(week: WeekGuide) {
  return [...week.events].sort((a, b) => (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date));
}

export function getEventsByDate(events: readonly WeekEvent[], dateKey: string) {
  return events.filter((event) => {
    if (event.scheduleType !== "range") return event.date === dateKey;
    return getEventStartDateKey(event) <= dateKey && dateKey <= getEventEndDateKey(event);
  }).sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""));
}

export function getEventsByCategory(events: readonly WeekEvent[], category: ScheduleFilter) {
  if (category === "all") return [...events];
  if (category === "tier5") return events.filter((event) => event.raidTier === 5);
  if (category === "tier3") return events.filter((event) => event.raidTier === 3);
  if (category === "mega") return events.filter((event) => event.raidTier === "mega" || event.raidTier === "superMega" || event.category === "mega");
  if (category === "shadow") return events.filter((event) => event.raidTier === "shadow" || event.category === "shadow");
  if (category === "event") return events.filter((event) => event.category === "event" || event.category === "community");
  return events.filter((event) => event.category === category);
}

export function getEventStartDateKey(event: WeekEvent) {
  return event.startAt?.slice(0, 10) ?? event.date;
}

export function getEventEndDateKey(event: WeekEvent) {
  return event.endAt?.slice(0, 10) ?? event.date;
}

export function isRangeContinuation(event: WeekEvent, dateKey: string) {
  return event.scheduleType === "range" && getEventStartDateKey(event) < dateKey;
}

export function formatRangeEventPeriod(event: WeekEvent, continuation = false) {
  const start = dateKeyToUtc(getEventStartDateKey(event));
  const end = dateKeyToUtc(getEventEndDateKey(event));
  if (continuation) return `${end.getUTCMonth() + 1}/${end.getUTCDate()}까지 등장 중`;
  return `${start.getUTCMonth() + 1}/${start.getUTCDate()} ~ ${end.getUTCMonth() + 1}/${end.getUTCDate()} 등장`;
}

export function getImportantEvents(events: readonly WeekEvent[]) {
  return events.filter((event) => event.priority >= 4 || Boolean(event.featuredHour));
}

export function getFeaturedHourEvents(events: readonly WeekEvent[]) {
  return events.filter((event) => Boolean(event.featuredHour));
}

export function getWeekDays(week: WeekGuide, date = getAppNow()) {
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

export function getWeekEventActionHref(event: WeekEvent) {
  if (event.eventHref) return event.eventHref;
  if (event.guidePokemonIds.length === 1) return `/pokemon/${event.guidePokemonIds[0]}`;
  return `/guide?event=${encodeURIComponent(event.id)}`;
}

export function getWeekEventActionLabel(event: WeekEvent) {
  return event.eventHref ? "이벤트 상세" : event.guidePokemonIds.length > 1 ? "공략 선택" : "공략 보기";
}

export function getWeekEventById(week: WeekGuide, eventId: string | undefined) {
  return eventId ? week.events.find((event) => event.id === eventId) : undefined;
}

export function getPokemonGuide(guideId: string) {
  return pokemonGuides.find((guide) => guide.id === guideId);
}

export function getPokemonGuideMissingFields(guide: (typeof pokemonGuides)[number]) {
  const missing: string[] = [];
  if (guide.types.length === 0) missing.push("types");
  if (!guide.rating) missing.push("rating");
  if (!guide.reason) missing.push("reason");
  if (guide.weaknesses.length === 0) missing.push("weaknesses");
  if (guide.dataStatus.counters === "missing") missing.push("counters");
  if (guide.dataStatus.values === "missing") missing.push("values");
  if (guide.recommendations.length === 0) missing.push("recommendations");
  return missing;
}

export function getGuidesForWeek(week: WeekGuide) {
  const ids = new Set([
    ...week.priorities.map((item) => item.pokemon.id),
    ...week.events.flatMap((event) => event.guidePokemonIds),
  ]);
  return pokemonGuides.filter((guide) => ids.has(guide.id));
}

export function getRecommendedGuides(week: WeekGuide, limit = 4) {
  return week.priorities
    .map((priority) => ({ priority, guide: getPokemonGuide(priority.pokemon.id) }))
    .filter((item): item is { priority: WeekGuide["priorities"][number]; guide: NonNullable<ReturnType<typeof getPokemonGuide>> } => Boolean(item.guide))
    .slice(0, limit);
}

export function getGuidesByCategory(guides: ReturnType<typeof getGuidesForWeek>, category: GuideCategory | "all") {
  return category === "all" ? guides : guides.filter((guide) => guide.category === category);
}

export function getFeaturedEvent(week: WeekGuide) {
  return week.featuredEventId ? eventsById[week.featuredEventId as keyof typeof eventsById] : undefined;
}

export function getEventById(eventId: string) {
  return eventsById[eventId as keyof typeof eventsById];
}

export function getDaysUntil(dateKey: string, date = getAppNow()) {
  const [todayYear, todayMonth, todayDay] = getSeoulDateKey(date).split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = dateKey.split("-").map(Number);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

export function formatTodayLabel(date = getAppNow()) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: SEOUL_TIME_ZONE, month: "long", day: "numeric" }).format(date);
}

export function getPreparationPlan(planId: string | undefined) {
  return preparationPlans.find((plan) => plan.id === planId);
}

export function getUpcomingPreparationEvent(week: WeekGuide, date = getAppNow()) {
  const key = getSeoulDateKey(date);
  return getEventsByWeek(week).find((event) => getEventEndDateKey(event) >= key && event.priority >= 4 && Boolean(event.preparationPlanId));
}

export function getNextImportantEvent(week: WeekGuide, currentEvent: WeekEvent) {
  const currentKey = currentEvent.startAt ?? currentEvent.date;
  return getEventsByWeek(week).find((event) => event.id !== currentEvent.id && event.priority >= 4 && (event.startAt ?? event.date) > currentKey);
}
