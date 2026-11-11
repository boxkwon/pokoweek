"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleFilter } from "../_data/guide-data";
import { isScheduleWeek, normalizeScheduleFilter, SCHEDULE_CATEGORY_KEY, SCHEDULE_WEEK_KEY } from "../_lib/schedule-preferences";

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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedCategory = normalizeScheduleFilter(localStorage.getItem(SCHEDULE_CATEGORY_KEY));
    const storedWeek = localStorage.getItem(SCHEDULE_WEEK_KEY);
    const category = hasCategoryQuery
      ? selectedCategory
      : storedCategory ?? selectedCategory;
    const week = hasWeekQuery && selectedWeek
      ? selectedWeek
      : dateOverride ? selectedWeek : isScheduleWeek(storedWeek) ? storedWeek : selectedWeek;

    localStorage.setItem(SCHEDULE_CATEGORY_KEY, category);
    localStorage.setItem(SCHEDULE_WEEK_KEY, week);

    if (!hasCategoryQuery || !hasWeekQuery) {
      const query = new URLSearchParams({ week, category });
      if (dateOverride) query.set("date", dateOverride);
      router.replace(`/schedule?${query.toString()}`);
    }
  }, [dateOverride, hasCategoryQuery, hasWeekQuery, router, selectedCategory, selectedWeek]);

  useEffect(() => {
    if (!initialized.current || !hasCategoryQuery || !hasWeekQuery) return;
    localStorage.setItem(SCHEDULE_CATEGORY_KEY, selectedCategory);
    localStorage.setItem(SCHEDULE_WEEK_KEY, selectedWeek);
  }, [dateOverride, hasCategoryQuery, hasWeekQuery, router, selectedCategory, selectedWeek]);

  return null;
}
