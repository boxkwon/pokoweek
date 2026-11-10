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

function EventArtwork({ event, href, tone }: { event: MonthlyEvent; href: string; tone: string }) {
  if (event.pokemon.length > 0) {
    return (
      <div className={`schedule-pokemon count-${Math.min(event.pokemon.length, 3)}`}>
        {event.pokemon.slice(0, 3).map((pokemon) => (
          <Link
            className={`pokemon-poster-panel feed-pokemon-panel ${tone}`}
            href={href}
            aria-label={`${pokemon.name} 일정 상세 보기`}
            key={`${event.id}-${pokemon.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pokemon-poster-image" src={pokemon.image} alt="" />
            <span className="pokemon-poster-name">{pokemon.name}</span>
          </Link>
        ))}
      </div>
    );
  }
  return event.image ? (
    <Link className="feed-banner-link" href={href} aria-label={`${event.title} 상세 보기`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="feed-banner-image" src={event.image} alt="" />
    </Link>
  ) : <Link className="feed-schedule-placeholder" href={href}>일정 자세히 보기</Link>;
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
        <div className="schedule-list next-week-event-list">
          {visibleEvents.map((event) => {
            const detailHref = event.internalHref || `/calendar-events/${event.slug}`;
            const tone = categoryTone(event.category);
            return (
              <article className={`schedule-row next-week-schedule-row ${tone}`} key={event.id}>
                <div className="schedule-visual">
                  <EventArtwork event={event} href={detailHref} tone={tone} />
                  <span className="visual-label">{event.categoryLabel}</span>
                </div>
                <Link className="schedule-content" href={detailHref}>
                  <div className="schedule-meta">
                    <time>{timeLabel(event, selectedDate)}</time>
                    <span className={`schedule-kind ${tone}`}>[{event.categoryLabel}]</span>
                  </div>
                  <strong>{event.title}</strong>
                  <p className={event.announced ? "" : "announcement-pending"}>
                    {event.announced ? "일정 상세와 등장 포켓몬을 확인해요." : "상세 포켓몬 공식 발표 전"}
                  </p>
                </Link>
                <div className="next-week-card-actions">
                  <Link className="schedule-action" href={detailHref}>자세히 <ChevronIcon /></Link>
                  <a className="schedule-source-action" href={event.sourceUrl} target="_blank" rel="noreferrer">
                    일정 출처 <ExternalIcon />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
