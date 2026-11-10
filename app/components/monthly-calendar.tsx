"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MonthlyEvent } from "../data/monthly";
import { ChevronIcon, ExternalIcon } from "./icons";
import { EventHeroImage, PokemonArtwork } from "./image-assets";

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

function monthNumber(month: string) {
  const [year, value] = month.split("-").map(Number);
  return year * 12 + value - 1;
}

function monthKey(value: number) {
  const year = Math.floor(value / 12);
  const month = value % 12 + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function dateKey(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
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
            <PokemonArtwork src={pokemon.image} alt={pokemon.name} size="medium" />
          </span>
        ))}
      </div>
    );
  }
  return event.image ? (
    <EventHeroImage src={event.image} alt="" className="month-agenda-banner" />
  ) : <span className="month-agenda-placeholder">일정</span>;
}

export function MonthlyCalendar({
  events,
  initialMonth,
  initialDate,
  rangeStart,
  rangeEnd,
}: {
  events: MonthlyEvent[];
  initialMonth: string;
  initialDate: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOffset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const monthTitle = `${year}년 ${month}월`;
  const minMonth = monthNumber(rangeStart);
  const maxMonth = monthNumber(rangeEnd);
  const currentMonth = monthNumber(selectedMonth);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, MonthlyEvent[]>();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = dateKey(selectedMonth, day);
      map.set(key, events.filter((event) => event.startDate <= key && event.endDate >= key));
    }
    return map;
  }, [daysInMonth, events, selectedMonth]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  function moveMonth(step: number) {
    const next = monthKey(currentMonth + step);
    setSelectedMonth(next);
    setSelectedDate(`${next}-01`);
  }

  return (
    <section className="month-calendar-section" aria-label="월간 Pokémon GO 일정">
      <div className="month-calendar-toolbar">
        <button type="button" onClick={() => moveMonth(-1)} disabled={currentMonth <= minMonth} aria-label="이전 달">
          <span className="month-prev"><ChevronIcon /></span>
        </button>
        <div><span>자동 업데이트 달력</span><h2>{monthTitle}</h2></div>
        <button type="button" onClick={() => moveMonth(1)} disabled={currentMonth >= maxMonth} aria-label="다음 달">
          <ChevronIcon />
        </button>
      </div>

      <div className="month-calendar">
        <div className="month-weekdays" aria-hidden="true">
          {weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="month-grid">
          {Array.from({ length: firstDayOffset }, (_, index) => <span className="month-day-spacer" key={`space-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const key = dateKey(selectedMonth, day);
            const dayEvents = eventsByDate.get(key) ?? [];
            return (
              <button
                type="button"
                className={`month-day ${selectedDate === key ? "selected" : ""} ${key === initialDate ? "today" : ""}`}
                aria-pressed={selectedDate === key}
                aria-label={`${month}월 ${day}일, ${dayEvents.length ? `일정 ${dayEvents.length}개` : "발표된 일정 없음"}`}
                onClick={() => setSelectedDate(key)}
                key={key}
              >
                <span className="month-day-number">{day}</span>
                <span className="month-day-events">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span className={`month-event-chip ${categoryTone(event.category)}`} key={event.id}>
                      <b>{event.categoryLabel}</b><em>{event.title}</em>
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="month-more-events">+{dayEvents.length - 3}</span>}
                  {dayEvents.length === 0 && <span className="month-no-event">발표 없음</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="month-agenda">
        <div className="month-agenda-heading">
          <div><span>{selectedDate.replaceAll("-", ".")}</span><h2>이날의 일정</h2></div>
          <b>{selectedEvents.length}개</b>
        </div>
        {selectedEvents.length === 0 ? (
          <div className="month-empty-announcement">
            <strong>공식 발표 없음</strong>
            <p>아직 공개된 일정이 없어요. 새 소식이 확인되면 다음 자동 업데이트에 표시됩니다.</p>
          </div>
        ) : (
          <div className="month-agenda-list">
            {selectedEvents.map((event) => {
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
                    <p>{event.announced ? "공개된 일정" : "상세 포켓몬 공식 발표 전"}</p>
                  </div>
                  <span className="month-agenda-action">{event.internalHref ? "자세히" : "출처"}{event.internalHref ? <ChevronIcon /> : <ExternalIcon />}</span>
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
      </div>
    </section>
  );
}
