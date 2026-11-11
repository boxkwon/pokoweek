"use client";

import Link from "next/link";
import { useState } from "react";
import { BackIcon, BookmarkIcon, ShareIcon } from "./icons";

export function AppHeader({ backHref, subtitle }: { backHref?: string; subtitle?: string }) {
  const [saved, setSaved] = useState(false);
  const share = async () => {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else await navigator.clipboard?.writeText(location.href);
  };

  return (
    <header className="fresh-app-header">
      <div className="header-leading">
        {backHref
          ? <Link className="header-back" href={backHref} aria-label="이전 화면으로 돌아가기"><BackIcon /></Link>
          : <Link className="header-logo" href="/" aria-label="POKO WEEK 홈"><span className="fresh-ball"><i /></span></Link>}
      </div>
      <Link className="fresh-brand" href="/">
        <b>POKO WEEK</b>
        {subtitle ? <small>{subtitle}</small> : null}
      </Link>
      <div className="header-actions">
        <button className={saved ? "saved" : ""} type="button" aria-label="저장" onClick={() => setSaved((value) => !value)}><BookmarkIcon /></button>
        <button type="button" aria-label="공유" onClick={share}><ShareIcon /></button>
      </div>
    </header>
  );
}
