"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getWeekStartForDate } from "../_lib/daily-schedule";
import { getScheduleNavigationContext, withScheduleNavigationContext, type ScheduleNavigationContext } from "../_lib/internal-url";
import { isScheduleWeek, normalizeScheduleFilter, SCHEDULE_CATEGORY_KEY, SCHEDULE_WEEK_KEY } from "../_lib/schedule-preferences";
import { BagIcon, CalendarIcon, SwordsIcon } from "./icons";
import { ContextLink } from "./context-link";

export function BottomNavigation({ active }: { active: "schedule" | "guide" | "prep" }) {
  return <Suspense fallback={<BottomNavigationShell active={active} />}>
    <BottomNavigationContent active={active} />
  </Suspense>;
}

function BottomNavigationContent({ active }: { active: "schedule" | "guide" | "prep" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.size ? `?${searchParams.toString()}` : "";
  const routeContext = getScheduleNavigationContext(pathname, search);
  const [storedContext, setStoredContext] = useState<ScheduleNavigationContext>({});

  useEffect(() => {
    const storedWeek = localStorage.getItem(SCHEDULE_WEEK_KEY);
    setStoredContext({
      week: isScheduleWeek(storedWeek) ? storedWeek : undefined,
      category: normalizeScheduleFilter(localStorage.getItem(SCHEDULE_CATEGORY_KEY)),
    });
  }, []);

  const context = useMemo<ScheduleNavigationContext>(() => {
    const date = routeContext.date;
    return {
      week: date ? getWeekStartForDate(date) : routeContext.week ?? storedContext.week,
      date,
      category: normalizeScheduleFilter(routeContext.category) ?? storedContext.category ?? "all",
    };
  }, [routeContext.category, routeContext.date, routeContext.week, storedContext.category, storedContext.week]);

  const items = [
    { key: "schedule", href: withScheduleNavigationContext("/schedule", context), label: "일정", icon: <CalendarIcon /> },
    { key: "guide", href: withScheduleNavigationContext("/guide", context), label: "공략", icon: <SwordsIcon /> },
    { key: "prep", href: withScheduleNavigationContext("/prepare", context), label: "준비", icon: <BagIcon /> },
  ] as const;
  return <nav className="fresh-bottom-nav" aria-label="주요 메뉴">{items.map((item) => <ContextLink aria-current={active === item.key ? "page" : undefined} className={active === item.key ? "active" : ""} href={item.href} key={item.key}>{item.icon}<span>{item.label}</span></ContextLink>)}</nav>;
}

function BottomNavigationShell({ active }: { active: "schedule" | "guide" | "prep" }) {
  const items = [
    { key: "schedule", href: "/schedule", label: "일정", icon: <CalendarIcon /> },
    { key: "guide", href: "/guide", label: "공략", icon: <SwordsIcon /> },
    { key: "prep", href: "/prepare", label: "준비", icon: <BagIcon /> },
  ] as const;
  return <nav className="fresh-bottom-nav" aria-label="주요 메뉴">{items.map((item) => <ContextLink aria-current={active === item.key ? "page" : undefined} className={active === item.key ? "active" : ""} href={item.href} key={item.key}>{item.icon}<span>{item.label}</span></ContextLink>)}</nav>;
}
