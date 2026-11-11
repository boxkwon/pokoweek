import Link from "next/link";
import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, EventTime, PrimaryCTA, RatingStars, SectionHeader } from "../_components/design-system";
import { CalendarIcon, ChevronIcon, ClockIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import { SchedulePreferenceSync } from "../_components/schedule-preference-sync";
import { APP_SUBTITLE } from "../_config/app";
import type { ScheduleFilter, WeekEvent } from "../_data/guide-data";
import {
  formatCompactDate,
  formatWeekRange,
  getAdjacentWeekKey,
  getCurrentWeek,
  getEventsByCategory,
  getEventsByDate,
  getEventsByWeek,
  getImportantTime,
  getImportantEvents,
  getWeekByStartDate,
  getWeekDays,
  getWeekEventActionHref,
  getWeekEventActionLabel,
} from "../_data/queries";
import { getAppNow, isValidDateOverride } from "../_lib/time";

const filters = [
  { key: "all", label: "전체" },
  { key: "five", label: "5성" },
  { key: "three", label: "3성" },
  { key: "mega", label: "메가" },
  { key: "max", label: "맥스" },
  { key: "shadow", label: "그림자" },
  { key: "event", label: "이벤트" },
] as const;

type ScheduleCategory = (typeof filters)[number]["key"];
type SearchParams = Promise<{ week?: string | string[]; category?: string | string[]; date?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isDateKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function scheduleHref(week: string, category: ScheduleCategory, dateOverride?: string) {
  const query = new URLSearchParams({ week });
  if (category !== "all") query.set("category", category);
  if (dateOverride) query.set("date", dateOverride);
  return `/schedule?${query.toString()}`;
}

function ScheduleEventRow({ event }: { event: WeekEvent }) {
  const ctaLabel = getWeekEventActionLabel(event);
  const artworkClass = event.pokemon.length === 2 ? "has-art-pair" : event.pokemon.length >= 3 ? "has-art-group" : "has-single-art";

  return <article className={`schedule-event-row ${event.priority === 5 ? "priority-five" : ""} ${artworkClass}`}>
    <div className="schedule-event-copy">
      <CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
      <h3>{event.title}</h3>
      <EventTime className="schedule-event-times" availabilityTime={event.availabilityTime} featuredHour={event.featuredHour} featuredLabel={event.category === "legendary" ? "레이드아워" : event.category === "max" ? "맥스배틀 시간" : "집중 시간"} />
      <div className="schedule-rating"><RatingStars value={event.rating} /><strong>{event.reason}</strong></div>
      {event.pokemon.length > 1 ? <ul className="schedule-pokemon-list">{event.pokemon.map((item) => <li key={item.id}>{item.name}</li>)}</ul> : null}
    </div>
    {event.pokemon.length === 1 ? <PokemonArtwork className="schedule-event-art" image={event.pokemon[0].image} alt={event.pokemon[0].name} size="sm" /> : null}
    {event.pokemon.length === 2 ? <div className="schedule-event-art-pair" aria-label={event.pokemon.map((item) => item.name).join(", ")}>{event.pokemon.map((item) => <PokemonArtwork image={item.image} alt="" size="sm" key={item.id} />)}</div> : null}
    {event.pokemon.length >= 3 ? <span className="schedule-event-art-count" aria-label={`${event.pokemon.length}마리의 포켓몬`}>+{event.pokemon.length}</span> : null}
    <PrimaryCTA className="schedule-row-cta" href={getWeekEventActionHref(event)}>{ctaLabel}</PrimaryCTA>
  </article>;
}

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const requestedDate = firstValue(query.date);
  const dateOverride = isValidDateOverride(requestedDate) ? requestedDate : undefined;
  const now = getAppNow(dateOverride);
  const currentWeek = getCurrentWeek(now);
  const requestedWeek = firstValue(query.week);
  const week = getWeekByStartDate(isDateKey(requestedWeek) ? requestedWeek : currentWeek.startDate);
  const requestedCategory = firstValue(query.category);
  const category: ScheduleCategory = filters.some((filter) => filter.key === requestedCategory) ? requestedCategory as ScheduleCategory : "all";
  const allEvents = getEventsByWeek(week);
  const visibleEvents = getEventsByCategory(allEvents, category as ScheduleFilter);
  const days = getWeekDays(week, now);
  const importantEvents = getImportantEvents(allEvents)
    .sort((a, b) => b.priority - a.priority || (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date))
    .slice(0, 5)
    .sort((a, b) => (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date));
  const isCurrentWeek = week.startDate === currentWeek.startDate;

  return <main className="fresh-screen boss-screen schedule-screen">
    <AppHeader subtitle={APP_SUBTITLE} />
    <SchedulePreferenceSync selectedCategory={category} selectedWeek={week.startDate} hasCategoryQuery={filters.some((filter) => filter.key === requestedCategory)} hasWeekQuery={isDateKey(requestedWeek)} dateOverride={dateOverride} />

    <section className="schedule-week-nav" aria-label="주차 이동">
      <Link href={scheduleHref(getAdjacentWeekKey(week.startDate, -1), category, dateOverride)} aria-label="이전 주"><ChevronIcon /></Link>
      <div>
        <b>{formatWeekRange(week)}</b>
        {isCurrentWeek
          ? <span>이번 주</span>
          : <Link href={scheduleHref(currentWeek.startDate, category, dateOverride)}>이번 주로 돌아가기</Link>}
      </div>
      <Link href={scheduleHref(getAdjacentWeekKey(week.startDate, 1), category, dateOverride)} aria-label="다음 주"><ChevronIcon /></Link>
    </section>

    <nav className="schedule-filters" aria-label="일정 카테고리">
      {filters.map((filter) => <Link aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={scheduleHref(week.startDate, filter.key, dateOverride)} key={filter.key}>
        <CategoryBadge className={`schedule-filter-badge filter-${filter.key} category-${filter.key}`}>{filter.label}</CategoryBadge>
      </Link>)}
    </nav>

    <section className="schedule-list-section">
      <SectionHeader icon={<CalendarIcon />} title="주간 일정" />
      <div className="schedule-day-list">
        {days.map((day) => {
          const events = getEventsByDate(visibleEvents, day.dateKey);
          return <section className={`schedule-day-group ${day.isToday ? "today" : ""}`} key={day.dateKey}>
            <header className={`${day.isSaturday ? "saturday" : ""} ${day.isSunday ? "sunday" : ""}`}>
              {day.isToday ? <span>오늘</span> : null}
              <b>{day.weekday}</b>
              <strong>{day.day}</strong>
            </header>
            <div className="schedule-day-events">
              {events.length > 0 ? events.map((event) => <ScheduleEventRow event={event} key={event.id} />) : <p className="schedule-empty">중요 일정 없음</p>}
            </div>
          </section>;
        })}
      </div>
    </section>

    <section className="schedule-important-board">
      <SectionHeader icon={<ClockIcon />} title="이번 주 놓치지 말 것" />
      {importantEvents.length > 0 ? <div className="important-time-list">{importantEvents.map((event) => {
        const importantTime = getImportantTime(event);
        return <Link href={getWeekEventActionHref(event)} key={event.id}>
        <time><b>{formatCompactDate(event.date)}</b><span>{importantTime.time} · {importantTime.meaning}</span></time>
        <p>{event.title}</p>
        <ChevronIcon />
      </Link>})}</div> : <p className="schedule-empty">공식 발표된 중요 일정이 없어요.</p>}
    </section>

    <BottomNavigation active="schedule" />
  </main>;
}
