import Link from "next/link";
import { BoltIcon, CalendarIcon, HomeIcon } from "./icons";

export function Header() {
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="pokoweek 홈">
          <span className="brand-ball"><span /></span>
          <span>pokoweek</span>
        </Link>
        <span className="korea-pill">🇰🇷 한국시간</span>
      </header>
      <nav className="bottom-nav" aria-label="주요 메뉴">
        <Link href="/"><HomeIcon/><span>홈</span></Link>
        <Link href="/schedule"><CalendarIcon/><span>주간 일정</span></Link>
        <Link href="/#priority"><BoltIcon/><span>우선순위</span></Link>
      </nav>
    </>
  );
}
