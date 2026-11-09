"use client";

import { useState } from "react";
import { CalendarIcon, ClockIcon, ShieldIcon } from "./icons";
import { ScheduleList } from "./schedule-list";
import { WeeklyOverview } from "./weekly-overview";
import { MonthlyCalendar } from "./monthly-calendar";
import { monthlyEvents, monthlyMeta } from "../data/monthly";

type ViewMode = "month" | "week" | "events";

export function ScheduleExplorer({ initialDate }: { initialDate: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const initialMonth = initialDate.slice(0, 7);

  return (
    <>
      <div className="schedule-view-switcher" aria-label="일정 보기 방식">
        <button
          type="button"
          className={viewMode === "month" ? "active" : ""}
          aria-pressed={viewMode === "month"}
          onClick={() => setViewMode("month")}
        >
          <CalendarIcon />
          <span><b>월간 달력</b><small>한 달을 한눈에 봐요</small></span>
        </button>
        <button
          type="button"
          className={viewMode === "week" ? "active" : ""}
          aria-pressed={viewMode === "week"}
          onClick={() => setViewMode("week")}
        >
          <ClockIcon />
          <span><b>이번 주 공략</b><small>포켓몬별 공략을 봐요</small></span>
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
      <p className="pokemon-link-guide">
        {viewMode === "month" ? "날짜를 누르면 공개된 일정을 자세히 볼 수 있어요." : "포켓몬을 누르면 약점과 추천 공략을 볼 수 있어요."}
      </p>
      {viewMode === "month" && (
        <MonthlyCalendar
          events={monthlyEvents}
          initialMonth={initialMonth}
          initialDate={initialDate}
          rangeStart={monthlyMeta.rangeStart}
          rangeEnd={monthlyMeta.rangeEnd}
        />
      )}
      {viewMode === "week" && <ScheduleList initialDay={initialDate} />}
      {viewMode === "events" && (
        <WeeklyOverview />
      )}
    </>
  );
}
