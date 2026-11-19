import { isDateKey, isValidDateOverride } from "./time";

export function getDateContextFromSearch(search: string) {
  const requestedDate = new URLSearchParams(search).get("date") ?? undefined;
  return isValidDateOverride(requestedDate) ? requestedDate : undefined;
}

export function getRouteDateContextFromSearch(search: string) {
  const requestedDate = new URLSearchParams(search).get("date") ?? undefined;
  return isDateKey(requestedDate) ? requestedDate : undefined;
}

export function withDateContext(url: string, dateContext?: string) {
  if (!url.startsWith("/") || url.startsWith("//") || !isDateKey(dateContext)) return url;
  const destination = new URL(url, "https://pokoweek.local");
  destination.searchParams.set("date", dateContext);
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function withInheritedDateContext(url: string, dateContext?: string) {
  if (!url.startsWith("/") || url.startsWith("//") || !isDateKey(dateContext)) return url;
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
