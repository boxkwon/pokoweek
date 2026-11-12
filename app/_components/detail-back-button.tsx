"use client";

import { useRouter } from "next/navigation";
import { BackIcon } from "./icons";
import { GUIDE_ORIGIN_STORAGE_KEY } from "./pokemon-guide-link";

type GuideOrigin = {
  source: string;
  target: string;
  createdAt: number;
};

function readGuideOrigin(): GuideOrigin | undefined {
  const raw = sessionStorage.getItem(GUIDE_ORIGIN_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<GuideOrigin>;
    if (typeof value.source === "string" && typeof value.target === "string" && typeof value.createdAt === "number") return value as GuideOrigin;
  } catch { /* invalid session data falls back to the guide index */ }
  sessionStorage.removeItem(GUIDE_ORIGIN_STORAGE_KEY);
  return undefined;
}

function isSafeAppOrigin(value: string) {
  const pathname = value.split("?")[0].split("#")[0];
  return pathname === "/" || ["/schedule", "/guide", "/prepare", "/events/"].some((prefix) => pathname.startsWith(prefix));
}

export function DetailBackButton() {
  const router = useRouter();

  return <button
    className="floating-back"
    type="button"
    aria-label="이전 화면으로 돌아가기"
    onClick={() => {
      const origin = readGuideOrigin();
      const isCurrentNavigation = Boolean(
        origin
        && origin.target === location.pathname
        && origin.createdAt >= performance.timeOrigin
        && isSafeAppOrigin(origin.source),
      );

      sessionStorage.removeItem(GUIDE_ORIGIN_STORAGE_KEY);
      if (isCurrentNavigation && history.length > 1) {
        router.back();
        return;
      }
      router.push(isCurrentNavigation && origin ? origin.source : "/guide");
    }}
  ><BackIcon /></button>;
}
