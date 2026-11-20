"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleFilter } from "../_data/guide-data";
import { isScheduleWeek, normalizeScheduleFilter, SCHEDULE_CATEGORY_KEY, SCHEDULE_WEEK_KEY } from "../_lib/schedule-preferences";
import { getDateContextForWeek, withDateContext } from "../_lib/internal-url";

export function SchedulePreferenceSync({
  availableCategories,
  selectedCategory,
  selectedWeek,
  hasCategoryQuery,
  hasWeekQuery,
  dateContext,
}: {
  availableCategories: readonly ScheduleFilter[];
  selectedCategory: ScheduleFilter;
  selectedWeek: string;
  hasCategoryQuery: boolean;
  hasWeekQuery: boolean;
  dateContext?: string;
}) {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedCategoryCandidate = normalizeScheduleFilter(localStorage.getItem(SCHEDULE_CATEGORY_KEY));
    const storedCategory = storedCategoryCandidate && availableCategories.includes(storedCategoryCandidate)
      ? storedCategoryCandidate
      : undefined;
    const storedWeek = localStorage.getItem(SCHEDULE_WEEK_KEY);
    const category = hasCategoryQuery
      ? selectedCategory
      : storedCategory ?? selectedCategory;
    const week = hasWeekQuery && selectedWeek
      ? selectedWeek
      : dateContext ? selectedWeek : isScheduleWeek(storedWeek) ? storedWeek : selectedWeek;
    const normalizedDate = getDateContextForWeek(week, dateContext);

    localStorage.setItem(SCHEDULE_CATEGORY_KEY, category);
    localStorage.setItem(SCHEDULE_WEEK_KEY, week);

    if (!hasCategoryQuery || !hasWeekQuery || normalizedDate !== dateContext) {
      const query = new URLSearchParams({ week, category });
      router.replace(withDateContext(`/schedule?${query.toString()}`, normalizedDate));
    }
  }, [availableCategories, dateContext, hasCategoryQuery, hasWeekQuery, router, selectedCategory, selectedWeek]);

  useEffect(() => {
    if (!initialized.current || !hasCategoryQuery || !hasWeekQuery) return;
    localStorage.setItem(SCHEDULE_CATEGORY_KEY, selectedCategory);
    localStorage.setItem(SCHEDULE_WEEK_KEY, selectedWeek);
  }, [dateContext, hasCategoryQuery, hasWeekQuery, router, selectedCategory, selectedWeek]);

  return null;
}
