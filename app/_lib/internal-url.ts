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

export function withCurrentDateContext(url: string, dateContext?: string) {
  return isValidDateOverride(dateContext) ? withDateContext(url, dateContext) : url;
}
