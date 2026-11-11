"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "../_config/app";
import { BackIcon, BookmarkIcon, ShareIcon } from "./icons";

export function AppHeader({ backHref, subtitle, context }: { backHref?: string; subtitle?: string; context?: string }) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const share = async () => {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else await navigator.clipboard?.writeText(location.href);
  };

  return (
    <header className="fresh-app-header">
      <div className="header-leading">
        {backHref
          ? <button className="header-back" type="button" aria-label="이전 화면으로 돌아가기" onClick={() => window.history.length > 1 ? router.back() : router.push(backHref)}><BackIcon /></button>
          : <Link className="header-logo" href="/" aria-label={`${APP_NAME} 홈`}><span className="fresh-ball"><i /></span></Link>}
      </div>
      <Link className="fresh-brand" href="/">
        <b>{context ?? APP_NAME}</b>
        {!context && subtitle ? <small>{subtitle}</small> : null}
      </Link>
      <div className="header-actions">
        <button className={saved ? "saved" : ""} type="button" aria-label="저장" onClick={() => setSaved((value) => !value)}><BookmarkIcon /></button>
        <button type="button" aria-label="공유" onClick={share}><ShareIcon /></button>
      </div>
    </header>
  );
}
