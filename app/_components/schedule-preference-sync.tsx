"use client";

import { useEffect } from "react";
import type { ScheduleFilter } from "../_data/guide-data";
import { SCHEDULE_CATEGORY_KEY, SCHEDULE_WEEK_KEY } from "../_lib/schedule-preferences";

export function SchedulePreferenceSync({
  selectedCategory,
  selectedWeek,
}: {
  selectedCategory: ScheduleFilter;
  selectedWeek: string;
}) {
  useEffect(() => {
    localStorage.setItem(SCHEDULE_CATEGORY_KEY, selectedCategory);
    localStorage.setItem(SCHEDULE_WEEK_KEY, selectedWeek);
  }, [selectedCategory, selectedWeek]);

  return null;
}
