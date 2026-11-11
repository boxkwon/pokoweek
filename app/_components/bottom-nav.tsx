"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isScheduleWeek, normalizeScheduleFilter, SCHEDULE_CATEGORY_KEY, SCHEDULE_WEEK_KEY } from "../_lib/schedule-preferences";
import { BagIcon, CalendarIcon, HomeIcon, SwordsIcon } from "./icons";

export function BottomNavigation({ active }: { active: "home" | "schedule" | "guide" | "prep" }) {
  const [scheduleHref, setScheduleHref] = useState("/schedule");
  useEffect(() => {
    const category = normalizeScheduleFilter(localStorage.getItem(SCHEDULE_CATEGORY_KEY));
    const week = localStorage.getItem(SCHEDULE_WEEK_KEY);
    const query = new URLSearchParams();
    if (isScheduleWeek(week)) query.set("week", week);
    if (category) query.set("category", category);
    if (query.size) setScheduleHref(`/schedule?${query.toString()}`);
  }, []);

  const items = [
    { key: "home", href: "/", label: "홈", icon: <HomeIcon /> },
    { key: "schedule", href: scheduleHref, label: "일정", icon: <CalendarIcon /> },
    { key: "guide", href: "/guide", label: "공략", icon: <SwordsIcon /> },
    { key: "prep", href: "/prepare", label: "준비", icon: <BagIcon /> },
  ] as const;
  return <nav className="fresh-bottom-nav" aria-label="주요 메뉴">{items.map((item) => <Link aria-current={active === item.key ? "page" : undefined} className={active === item.key ? "active" : ""} href={item.href} key={item.key}>{item.icon}<span>{item.label}</span></Link>)}</nav>;
}
