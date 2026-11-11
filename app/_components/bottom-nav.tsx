import Link from "next/link";
import { BagIcon, CalendarIcon, HomeIcon, SwordsIcon } from "./icons";

export function BottomNav({ active }: { active: "home" | "schedule" | "guide" | "prep" }) {
  const items = [
    { key: "home", href: "/bosses/dialga-dynamax", label: "홈", icon: <HomeIcon /> },
    { key: "schedule", href: "/events/go-wild-area-global-2026", label: "일정", icon: <CalendarIcon /> },
    { key: "guide", href: "/bosses/dialga-dynamax", label: "공략", icon: <SwordsIcon /> },
    { key: "prep", href: "/events/go-wild-area-global-2026#prep", label: "준비", icon: <BagIcon /> },
  ] as const;
  return <nav className="fresh-bottom-nav">{items.map((item) => <Link className={active === item.key ? "active" : ""} href={item.href} key={item.key}>{item.icon}<span>{item.label}</span></Link>)}</nav>;
}
