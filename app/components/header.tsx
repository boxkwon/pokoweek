"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, ShieldIcon } from "./icons";

export function Header() {
  const pathname = usePathname();
  const active = (section: "home" | "raids" | "events") => {
    if (section === "home") return pathname === "/";
    if (section === "raids") return pathname.startsWith("/raids") || pathname.startsWith("/bosses");
    return pathname.startsWith("/events") || pathname.startsWith("/calendar-events");
  };
  const links = navigationItems();
  return (
    <>
      <AppHeader links={links} active={active} />
      <BottomNavigation links={links} active={active} />
    </>
  );
}

type NavigationItem = ReturnType<typeof navigationItems>[number];

function navigationItems() {
  return [
    { href: "/", label: "홈", icon: <HomeIcon />, section: "home" as const },
    { href: "/raids", label: "레이드", icon: <ShieldIcon />, section: "raids" as const },
    { href: "/events", label: "이벤트", icon: <CalendarIcon />, section: "events" as const },
  ];
}

export function AppHeader({ links, active }: { links: NavigationItem[]; active: (section: NavigationItem["section"]) => boolean }) {
  return (
      <header className="topbar app-header">
        <Link href="/" className="brand" aria-label="GO WEEK 홈">
          <span className="brand-ball"><span /></span>
          <span>GO WEEK</span>
        </Link>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {links.map((item) => <Link className={active(item.section) ? "active" : ""} href={item.href} key={item.href}>{item.icon}<span>{item.label}</span></Link>)}
        </nav>
        <span className="korea-pill">한국시간</span>
      </header>
  );
}

export function BottomNavigation({ links, active }: { links: NavigationItem[]; active: (section: NavigationItem["section"]) => boolean }) {
  return (
      <nav className="bottom-nav" aria-label="주요 메뉴">
        {links.map((item) => <Link className={active(item.section) ? "active" : ""} href={item.href} key={item.href}>{item.icon}<span>{item.label}</span></Link>)}
      </nav>
  );
}
