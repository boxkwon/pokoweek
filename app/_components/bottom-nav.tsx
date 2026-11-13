"use client";

import { useEffect, useState } from "react";
import { getCurrentWeek } from "../_data/queries";
import { withCurrentDateContext } from "../_lib/internal-url";
import { isScheduleWeek, normalizeScheduleFilter, SCHEDULE_CATEGORY_KEY, SCHEDULE_WEEK_KEY } from "../_lib/schedule-preferences";
import { getAppNow, isValidDateOverride } from "../_lib/time";
import { BagIcon, CalendarIcon, HomeIcon, SwordsIcon } from "./icons";
import { ContextLink } from "./context-link";

export function BottomNavigation({ active }: { active: "home" | "schedule" | "guide" | "prep" }) {
  const [scheduleHref, setScheduleHref] = useState("/schedule");
  const [dateOverride, setDateOverride] = useState<string>();
  useEffect(() => {
    const category = normalizeScheduleFilter(localStorage.getItem(SCHEDULE_CATEGORY_KEY));
    const requestedDate = new URLSearchParams(window.location.search).get("date") ?? undefined;
    const enabledDate = isValidDateOverride(requestedDate) ? requestedDate : undefined;
    const storedWeek = localStorage.getItem(SCHEDULE_WEEK_KEY);
    const week = enabledDate ? getCurrentWeek(getAppNow(enabledDate)).startDate : storedWeek;
    const query = new URLSearchParams();
    if (isScheduleWeek(week)) query.set("week", week);
    if (category) query.set("category", category);
    setDateOverride(enabledDate);
    if (query.size) setScheduleHref(withCurrentDateContext(`/schedule?${query.toString()}`, enabledDate));
  }, []);

  const items = [
    { key: "home", href: withCurrentDateContext("/", dateOverride), label: "홈", icon: <HomeIcon /> },
    { key: "schedule", href: scheduleHref, label: "일정", icon: <CalendarIcon /> },
    { key: "guide", href: withCurrentDateContext("/guide", dateOverride), label: "공략", icon: <SwordsIcon /> },
    { key: "prep", href: withCurrentDateContext("/prepare", dateOverride), label: "준비", icon: <BagIcon /> },
  ] as const;
  return <nav className="fresh-bottom-nav" aria-label="주요 메뉴">{items.map((item) => <ContextLink aria-current={active === item.key ? "page" : undefined} className={active === item.key ? "active" : ""} href={item.href} key={item.key}>{item.icon}<span>{item.label}</span></ContextLink>)}</nav>;
}
