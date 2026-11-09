import monthlyData from "./generated/monthly-events.json";

export type MonthlyEvent = {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  category: string;
  categoryLabel: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  image: string | null;
  pokemon: { name: string; image: string }[];
  announced: boolean;
  sourceUrl: string;
  sourceKind: "official" | "community";
  internalHref: string | null;
};

export const monthlyEvents = monthlyData.events as MonthlyEvent[];
export const monthlyMeta = {
  fetchedAt: monthlyData.fetchedAt,
  timezone: monthlyData.timezone,
  rangeStart: monthlyData.rangeStart,
  rangeEnd: monthlyData.rangeEnd,
  source: monthlyData.source,
};
