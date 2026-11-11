"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BagIcon, CalendarIcon, HomeIcon, SwordsIcon } from "./icons";

export function BottomNavigation({ active }: { active: "home" | "schedule" | "guide" | "prep" }) {
  const [scheduleHref, setScheduleHref] = useState("/schedule");
  useEffect(() => {
    const category = localStorage.getItem("pokoweek:schedule-category");
    const week = localStorage.getItem("pokoweek:schedule-week");
    const query = new URLSearchParams();
    if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) query.set("week", week);
    if (category && ["all", "five", "three", "mega", "max", "shadow", "event"].includes(category)) query.set("category", category);
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
