"use client";

import { useState } from "react";
import { CalendarIcon, ShieldIcon } from "./icons";
import { ScheduleList } from "./schedule-list";
import { WeeklyOverview } from "./weekly-overview";

type ViewMode = "calendar" | "events";

export function ScheduleExplorer() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  return (
    <>
      <div className="schedule-view-switcher" aria-label="일정 보기 방식">
        <button
          type="button"
          className={viewMode === "calendar" ? "active" : ""}
          aria-pressed={viewMode === "calendar"}
          onClick={() => setViewMode("calendar")}
        >
          <CalendarIcon />
          <span><b>날짜별 일정</b><small>날짜를 눌러 하루만 봐요</small></span>
        </button>
        <button
          type="button"
          className={viewMode === "events" ? "active" : ""}
          aria-pressed={viewMode === "events"}
          onClick={() => setViewMode("events")}
        >
          <ShieldIcon />
          <span><b>종류별 모아보기</b><small>레이드 종류끼리 비교해요</small></span>
        </button>
      </div>
      <p className="pokemon-link-guide">포켓몬을 누르면 약점과 추천 공략을 볼 수 있어요.</p>
      {viewMode === "calendar" ? (
        <ScheduleList initialDay="2026-11-09" />
      ) : (
        <WeeklyOverview />
      )}
    </>
  );
}
