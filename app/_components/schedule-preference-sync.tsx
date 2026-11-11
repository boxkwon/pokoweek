"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleFilter } from "../_data/guide-data";

const CATEGORY_KEY = "pokoweek:schedule-category";
const WEEK_KEY = "pokoweek:schedule-week";
const validCategories: readonly ScheduleFilter[] = ["all", "five", "three", "mega", "max", "shadow", "event"];

export function SchedulePreferenceSync({
  selectedCategory,
  selectedWeek,
  hasCategoryQuery,
  hasWeekQuery,
  dateOverride,
}: {
  selectedCategory: ScheduleFilter;
  selectedWeek: string;
  hasCategoryQuery: boolean;
  hasWeekQuery: boolean;
  dateOverride?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const storedCategory = localStorage.getItem(CATEGORY_KEY);
    const storedWeek = localStorage.getItem(WEEK_KEY);
    const category = hasCategoryQuery
      ? selectedCategory
      : validCategories.includes(storedCategory as ScheduleFilter) ? storedCategory as ScheduleFilter : selectedCategory;
    const week = hasWeekQuery && selectedWeek
      ? selectedWeek
      : dateOverride ? selectedWeek : storedWeek && /^\d{4}-\d{2}-\d{2}$/.test(storedWeek) ? storedWeek : selectedWeek;

    localStorage.setItem(CATEGORY_KEY, category);
    localStorage.setItem(WEEK_KEY, week);

    if ((!hasCategoryQuery && category !== selectedCategory) || (!hasWeekQuery && week !== selectedWeek)) {
      const query = new URLSearchParams({ week, category });
      if (dateOverride) query.set("date", dateOverride);
      router.replace(`/schedule?${query.toString()}`);
    }
  }, [dateOverride, hasCategoryQuery, hasWeekQuery, router, selectedCategory, selectedWeek]);

  return null;
}
