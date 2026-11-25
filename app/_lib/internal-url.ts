import { isDateKey, isValidDateOverride } from "./time";

export type ScheduleNavigationContext = {
  week?: string;
  date?: string;
  category?: string;
};

const SCHEDULE_CONTEXT_CATEGORY_PARAM = "scheduleCategory";

function isInternalUrl(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

function isScheduleDestination(pathname: string) {
  return pathname === "/" || pathname === "/schedule";
}

export function getDateContextFromSearch(search: string) {
  const requestedDate = new URLSearchParams(search).get("date") ?? undefined;
  return isValidDateOverride(requestedDate) ? requestedDate : undefined;
}

export function getRouteDateContextFromSearch(search: string) {
  const requestedDate = new URLSearchParams(search).get("date") ?? undefined;
  return isDateKey(requestedDate) ? requestedDate : undefined;
}

export function withDateContext(url: string, dateContext?: string) {
  if (!isInternalUrl(url) || !isDateKey(dateContext)) return url;
  const destination = new URL(url, "https://pokoweek.local");
  destination.searchParams.set("date", dateContext);
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function withInheritedDateContext(url: string, dateContext?: string) {
  if (!isInternalUrl(url) || !isDateKey(dateContext)) return url;
  const destination = new URL(url, "https://pokoweek.local");
  if (destination.searchParams.has("date")) return url;
  return withDateContext(url, dateContext);
}

export function getDateContextForWeek(weekStart: string, dateContext?: string) {
  if (!isDateKey(weekStart)) return isDateKey(dateContext) ? dateContext : undefined;
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const weekEnd = end.toISOString().slice(0, 10);
  return isDateKey(dateContext) && weekStart <= dateContext && dateContext <= weekEnd
    ? dateContext
    : weekStart;
}

export function withCurrentDateContext(url: string, dateContext?: string) {
  return isValidDateOverride(dateContext) ? withDateContext(url, dateContext) : url;
}

export function getScheduleNavigationContext(pathname: string, search: string): ScheduleNavigationContext {
  const query = new URLSearchParams(search);
  const week = query.get("week") ?? undefined;
  const date = query.get("date") ?? undefined;
  const category = query.get(isScheduleDestination(pathname) ? "category" : SCHEDULE_CONTEXT_CATEGORY_PARAM) ?? undefined;

  return {
    week: isDateKey(week) ? week : undefined,
    date: isDateKey(date) ? date : undefined,
    category,
  };
}

export function withScheduleNavigationContext(url: string, context: ScheduleNavigationContext) {
  if (!isInternalUrl(url)) return url;
  const destination = new URL(url, "https://pokoweek.local");
  const scheduleDestination = isScheduleDestination(destination.pathname);

  if (!destination.searchParams.has("week") && isDateKey(context.week)) {
    destination.searchParams.set("week", context.week);
  }
  if (!destination.searchParams.has("date") && isDateKey(context.date)) {
    destination.searchParams.set("date", context.date);
  }

  const categoryParam = scheduleDestination ? "category" : SCHEDULE_CONTEXT_CATEGORY_PARAM;
  if (!destination.searchParams.has(categoryParam) && context.category) {
    destination.searchParams.set(categoryParam, context.category);
  }
  if (scheduleDestination) destination.searchParams.delete(SCHEDULE_CONTEXT_CATEGORY_PARAM);

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function withInheritedNavigationContext(url: string, pathname: string, search: string) {
  const context = getScheduleNavigationContext(pathname, search);
  return withScheduleNavigationContext(withInheritedDateContext(url, context.date), context);
}
