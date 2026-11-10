"use client";

import { useState } from "react";
import { CalendarIcon, ClockIcon } from "./icons";
import { NextWeekPreview } from "./next-week-preview";
import { monthlyEvents } from "../data/monthly";

type EventView = "week" | "next";

export function EventExplorer({ initialDate }: { initialDate: string }) {
  const [view, setView] = useState<EventView>("week");
  return (
    <>
      <div className="schedule-view-switcher event-view-switcher" aria-label="이벤트 일정 보기 방식">
        <button type="button" className={view === "week" ? "active" : ""} aria-pressed={view === "week"} onClick={() => setView("week")}>
          <ClockIcon />
          <span><b>이번 주 이벤트</b><small>지금 챙길 소식을 봐요</small></span>
        </button>
        <button type="button" className={view === "next" ? "active" : ""} aria-pressed={view === "next"} onClick={() => setView("next")}>
          <CalendarIcon />
          <span><b>다음 주 이벤트</b><small>미리 준비할 소식을 봐요</small></span>
        </button>
      </div>
      <p className="pokemon-link-guide">일정 카드는 상세로, 출처는 원문으로 이동해요.</p>
      <NextWeekPreview
        events={monthlyEvents}
        initialDate={initialDate}
        weekOffset={view === "week" ? 0 : 1}
        filter="event"
        eyebrow={view === "week" ? "이번 주 이벤트" : "다음 주 이벤트"}
        description="GO 패스·일반 이벤트·맥스 먼데이·커뮤니티 데이 등을 모아봐요."
      />
    </>
  );
}
