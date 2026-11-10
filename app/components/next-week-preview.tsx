"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MonthlyEvent } from "../data/monthly";
import { getPokemonTypes } from "../data/pokemon-types";
import { ChevronIcon, ExternalIcon } from "./icons";
import { PokemonThumbnail } from "./pokemon-thumbnail";

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

function weekMonday(value: string, weekOffset: number) {
  const date = parseDateKey(value);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return addDays(value, (weekOffset * 7) - daysSinceMonday);
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

function isRaidEvent(event: MonthlyEvent) {
  return event.category === "Raid Battles"
    || event.category === "Raid Hour"
    || event.category === "Raid Day"
    || event.category === "Max Battles";
}

function EventArtwork({ event, href }: { event: MonthlyEvent; href: string }) {
  if (event.pokemon.length > 0) {
    return (
      <div className={`schedule-pokemon count-${Math.min(event.pokemon.length, 3)}`}>
        {event.pokemon.slice(0, 3).map((pokemon) => (
          <PokemonThumbnail
            className="schedule-pokemon-thumbnail"
            href={href}
            image={pokemon.image}
            name={pokemon.name}
            types={getPokemonTypes(pokemon.name)}
            key={`${event.id}-${pokemon.name}`}
          />
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

export function NextWeekPreview({
  events,
  initialDate,
  weekOffset = 1,
  filter = "all",
  eyebrow,
  description,
  showDateStrip = true,
  showHeading = true,
}: {
  events: MonthlyEvent[];
  initialDate: string;
  weekOffset?: 0 | 1;
  filter?: "all" | "raid" | "event";
  eyebrow?: string;
  description?: string;
  showDateStrip?: boolean;
  showHeading?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState("all");
  const weekStart = useMemo(() => weekMonday(initialDate, weekOffset), [initialDate, weekOffset]);
  const dates = useMemo(
    () => weekDays.map((day, index) => {
      const key = addDays(weekStart, index);
      return { key, day, date: Number(key.slice(8, 10)) };
    }),
    [weekStart],
  );
  const weekEnd = dates[6].key;
  const weekEvents = useMemo(
    () => events.filter((event) => {
      const inWeek = event.startDate <= weekEnd && event.endDate >= weekStart;
      if (!inWeek || filter === "all") return inWeek;
      return filter === "raid" ? isRaidEvent(event) : !isRaidEvent(event);
    }),
    [events, filter, weekEnd, weekStart],
  );
  const visibleEvents = selectedDate === "all"
    ? weekEvents
    : weekEvents.filter((event) => event.startDate <= selectedDate && event.endDate >= selectedDate);

  return (
    <section className="next-week-preview" aria-label={`${weekOffset === 0 ? "이번 주" : "다음 주"} Pokémon GO 일정`}>
      {showHeading && <div className="next-week-preview-heading">
        <div>
          <span>{eyebrow ?? (weekOffset === 0 ? "이번 주 일정" : "자동 수집 미리보기")}</span>
          <h2>{shortDate(weekStart)}–{shortDate(weekEnd)}</h2>
          <p>{description ?? `공개된 ${weekOffset === 0 ? "이번 주" : "다음 주"} 일정을 요일별로 확인해요.`}</p>
        </div>
        <b>{weekEvents.length}개 일정</b>
      </div>}

      {showDateStrip && <div className="date-strip" role="tablist" aria-label={`${weekOffset === 0 ? "이번 주" : "다음 주"} 날짜 선택`}>
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
      </div>}

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
                  <EventArtwork event={event} href={detailHref} />
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
