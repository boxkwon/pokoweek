"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MonthlyEvent } from "../data/monthly";
import { ChevronIcon, ExternalIcon } from "./icons";

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function nextMonday(value: string) {
  const date = parseDateKey(value);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return addDays(value, 7 - daysSinceMonday);
}

function shortDate(value: string) {
  const [, month, day] = value.split("-").map(Number);
  return `${month}월 ${day}일`;
}

function categoryTone(category: string) {
  if (category.includes("Raid")) return "raid";
  if (category.includes("Max")) return "max";
  if (category.includes("Community")) return "community";
  if (category.includes("Spotlight")) return "spotlight";
  if (category.includes("Research") || category.includes("Pass")) return "research";
  return "event";
}

function timeLabel(event: MonthlyEvent, selectedDate: string) {
  if (selectedDate === "all") {
    if (event.startDate === event.endDate) return `${shortDate(event.startDate)} ${event.startTime}–${event.endTime}`;
    return `${shortDate(event.startDate)}–${shortDate(event.endDate)}`;
  }
  if (event.startDate === event.endDate) return `${event.startTime}–${event.endTime}`;
  if (event.startDate === selectedDate) return `${event.startTime} 시작`;
  if (event.endDate === selectedDate) return `${event.endTime} 종료`;
  return "진행 중";
}

function EventArtwork({ event }: { event: MonthlyEvent }) {
  if (event.pokemon.length > 0) {
    return (
      <div className={`month-agenda-pokemon count-${Math.min(event.pokemon.length, 3)}`}>
        {event.pokemon.slice(0, 3).map((pokemon) => (
          <span key={`${event.id}-${pokemon.name}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pokemon.image} alt={pokemon.name} />
          </span>
        ))}
      </div>
    );
  }
  return event.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="month-agenda-banner" src={event.image} alt="" />
  ) : <span className="month-agenda-placeholder">일정</span>;
}

export function NextWeekPreview({ events, initialDate }: { events: MonthlyEvent[]; initialDate: string }) {
  const [selectedDate, setSelectedDate] = useState("all");
  const weekStart = useMemo(() => nextMonday(initialDate), [initialDate]);
  const dates = useMemo(
    () => weekDays.map((day, index) => {
      const key = addDays(weekStart, index);
      return { key, day, date: Number(key.slice(8, 10)) };
    }),
    [weekStart],
  );
  const weekEnd = dates[6].key;
  const weekEvents = useMemo(
    () => events.filter((event) => event.startDate <= weekEnd && event.endDate >= weekStart),
    [events, weekEnd, weekStart],
  );
  const visibleEvents = selectedDate === "all"
    ? weekEvents
    : weekEvents.filter((event) => event.startDate <= selectedDate && event.endDate >= selectedDate);

  return (
    <section className="next-week-preview" aria-label="다음 주 Pokémon GO 일정 미리보기">
      <div className="next-week-preview-heading">
        <div>
          <span>자동 수집 미리보기</span>
          <h2>{shortDate(weekStart)}–{shortDate(weekEnd)}</h2>
          <p>공개된 다음 주 일정을 요일별로 먼저 확인해요.</p>
        </div>
        <b>{weekEvents.length}개 일정</b>
      </div>

      <div className="date-strip" role="tablist" aria-label="다음 주 날짜 선택">
        <button
          type="button"
          className={`all-dates ${selectedDate === "all" ? "active" : ""}`}
          role="tab"
          aria-selected={selectedDate === "all"}
          onClick={() => setSelectedDate("all")}
        >
          <span>전체 일정</span>
        </button>
        {dates.map((date) => (
          <button
            type="button"
            key={date.key}
            className={selectedDate === date.key ? "active" : ""}
            role="tab"
            aria-selected={selectedDate === date.key}
            onClick={() => setSelectedDate(date.key)}
          >
            <span>{date.day}요일</span><b>{date.date}</b>
          </button>
        ))}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="month-empty-announcement next-week-empty">
          <strong>공식 발표 없음</strong>
          <p>아직 공개된 일정이 없어요. 새 소식이 확인되면 자동 업데이트에 표시됩니다.</p>
        </div>
      ) : (
        <div className="month-agenda-list next-week-event-list">
          {visibleEvents.map((event) => {
            const href = event.internalHref || event.sourceUrl;
            const content = (
              <>
                <div className="month-agenda-art"><EventArtwork event={event} /></div>
                <div className="month-agenda-copy">
                  <div className="month-agenda-meta">
                    <span className={categoryTone(event.category)}>{event.categoryLabel}</span>
                    <time>{timeLabel(event, selectedDate)}</time>
                  </div>
                  <h3>{event.title}</h3>
                  <p className={event.announced ? "" : "announcement-pending"}>
                    {event.announced ? "공개된 일정" : "상세 포켓몬 공식 발표 전"}
                  </p>
                </div>
                <span className="month-agenda-action">
                  {event.internalHref ? "공략 보기" : "일정 출처"}
                  {event.internalHref ? <ChevronIcon /> : <ExternalIcon />}
                </span>
              </>
            );
            return event.internalHref ? (
              <Link className="month-agenda-card" href={href} key={event.id}>{content}</Link>
            ) : (
              <a className="month-agenda-card" href={href} target="_blank" rel="noreferrer" key={event.id}>{content}</a>
            );
          })}
        </div>
      )}
    </section>
  );
}
