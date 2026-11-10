"use client";

import { useState } from "react";
import { CalendarIcon, ClockIcon } from "./icons";
import { ScheduleList } from "./schedule-list";
import { NextWeekPreview } from "./next-week-preview";
import { monthlyEvents } from "../data/monthly";
import { RaidTimeline } from "./raid-timeline";

type RaidView = "week" | "next";

export function RaidExplorer({ initialDate }: { initialDate: string }) {
  const [view, setView] = useState<RaidView>("week");
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="raid-explorer">
      <div className="schedule-view-switcher raid-view-switcher" aria-label="레이드 일정 보기 방식">
        <button type="button" className={view === "week" ? "active" : ""} aria-pressed={view === "week"} onClick={() => setView("week")}>
          <ClockIcon />
          <span><b>이번 주 공략</b><small>이번 주 전투를 준비해요</small></span>
        </button>
        <button type="button" className={view === "next" ? "active" : ""} aria-pressed={view === "next"} onClick={() => setView("next")}>
          <CalendarIcon />
          <span><b>다음 주 미리보기</b><small>공개된 보스를 먼저 봐요</small></span>
        </button>
        <button type="button" className="coming-soon" aria-haspopup="dialog" onClick={() => setShowComingSoon(true)}>
          <CalendarIcon />
          <span><b>월간 달력 <em>예정</em></b><small>조금만 기다려 주세요</small></span>
        </button>
      </div>

      <p className="pokemon-link-guide">포켓몬을 누르면 공략 또는 일정 상세를 볼 수 있어요.</p>
      <RaidTimeline initialDate={initialDate} weekOffset={view === "week" ? 0 : 1} />
      <div className="raid-detail-heading"><span>상세 카드</span><h2>이미지를 눌러 공략 보기</h2></div>
      {view === "week" && <ScheduleList allowedKinds={["raid", "max"]} showDateStrip={false} />}
      {view === "next" && <NextWeekPreview events={monthlyEvents} initialDate={initialDate} filter="raid" showDateStrip={false} showHeading={false} />}

      {showComingSoon && (
        <div className="coming-soon-backdrop" role="presentation" onClick={() => setShowComingSoon(false)}>
          <div className="coming-soon-dialog" role="dialog" aria-modal="true" aria-labelledby="coming-soon-title" onClick={(event) => event.stopPropagation()}>
            <span><CalendarIcon /></span>
            <h2 id="coming-soon-title">월간 레이드 달력</h2>
            <p>한 달의 보스를 보기 좋게 정리하고 있어요.<br />조금만 기다려 주세요!</p>
            <button type="button" onClick={() => setShowComingSoon(false)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
