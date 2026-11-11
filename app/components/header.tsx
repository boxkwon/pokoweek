"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookmarkIcon, CalendarIcon, HomeIcon, ShareIcon, ShieldIcon } from "./icons";

export function Header() {
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const active = (section: "home" | "raids" | "events") => {
    if (section === "home") return pathname === "/";
    if (section === "raids") return pathname.startsWith("/raids") || pathname.startsWith("/bosses");
    return pathname.startsWith("/events") || pathname.startsWith("/calendar-events");
  };
  const links = navigationItems();
  return (
    <>
      <AppHeader links={links} active={active} saved={saved} onSave={() => setSaved((value) => !value)} onShare={async () => {
        if (navigator.share) await navigator.share({ title: document.title, url: window.location.href });
        else await navigator.clipboard?.writeText(window.location.href);
      }} />
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

export function AppHeader({ links, active, saved, onSave, onShare }: { links: NavigationItem[]; active: (section: NavigationItem["section"]) => boolean; saved: boolean; onSave: () => void; onShare: () => void }) {
  return (
      <header className="topbar app-header">
        <Link href="/" className="brand" aria-label="GO WEEK 홈">
          <span className="brand-ball"><span /></span>
          <span>GO WEEK</span>
          <small>포켓몬 GO 주간 가이드</small>
        </Link>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {links.map((item) => <Link className={active(item.section) ? "active" : ""} href={item.href} key={item.href}>{item.icon}<span>{item.label}</span></Link>)}
        </nav>
        <div className="app-header-actions">
          <button className={saved ? "active" : ""} type="button" aria-label={saved ? "저장 취소" : "가이드 저장"} aria-pressed={saved} onClick={onSave}><BookmarkIcon /></button>
          <button type="button" aria-label="가이드 공유" onClick={onShare}><ShareIcon /></button>
        </div>
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
