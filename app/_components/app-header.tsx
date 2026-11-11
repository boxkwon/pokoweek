"use client";

import Link from "next/link";
import { useState } from "react";
import { BackIcon, BookmarkIcon, ShareIcon } from "./icons";

export function AppHeader({ event = false }: { event?: boolean }) {
  const [saved, setSaved] = useState(false);
  const share = async () => {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else await navigator.clipboard?.writeText(location.href);
  };

  return (
    <header className={`fresh-app-header ${event ? "event-header" : ""}`}>
      {event ? <Link className="header-back" href="/bosses/dialga-dynamax" aria-label="공략 화면으로 돌아가기"><BackIcon /></Link> : null}
      <Link className="fresh-brand" href="/bosses/dialga-dynamax">
        <span className="fresh-ball"><i /></span>
        <b>GO WEEK</b>
        {!event ? <small>포켓몬 GO 주간 가이드</small> : null}
      </Link>
      <div className="header-actions">
        <button className={saved ? "saved" : ""} type="button" aria-label="저장" onClick={() => setSaved((value) => !value)}><BookmarkIcon /></button>
        <button type="button" aria-label="공유" onClick={share}><ShareIcon /></button>
      </div>
    </header>
  );
}
