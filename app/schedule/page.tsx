import Link from "next/link";
import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, PrimaryCTA, RatingStars, SectionHeader } from "../_components/design-system";
import { CalendarIcon, ChevronIcon, ClockIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import type { CategoryColor, WeekEvent } from "../_data/guide-data";
import {
  formatCompactDate,
  formatWeekRange,
  getAdjacentWeekKey,
  getCurrentWeek,
  getEventStartTime,
  getEventsByCategory,
  getEventsByDate,
  getEventsByWeek,
  getImportantEvents,
  getWeekByStartDate,
  getWeekDays,
} from "../_data/queries";

const filters = [
  { key: "all", label: "전체" },
  { key: "legendary", label: "5성" },
  { key: "mega", label: "메가" },
  { key: "max", label: "맥스" },
  { key: "shadow", label: "그림자" },
  { key: "event", label: "이벤트" },
] as const;

type ScheduleCategory = (typeof filters)[number]["key"];
type SearchParams = Promise<{ week?: string | string[]; category?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isDateKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function scheduleHref(week: string, category: ScheduleCategory) {
  const query = new URLSearchParams({ week });
  if (category !== "all") query.set("category", category);
  return `/schedule?${query.toString()}`;
}

function ScheduleEventRow({ event }: { event: WeekEvent }) {
  const artwork = event.pokemon ?? event.pokemonList?.[0];
  const pokemonList = event.pokemonList ?? (event.pokemon ? [event.pokemon] : []);
  const ctaLabel = event.category === "event" ? "이벤트 상세" : "공략 보기";

  return <article className={`schedule-event-row ${event.priority === 5 ? "priority-five" : ""}`}>
    <div className="schedule-event-copy">
      <CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
      <h3>{event.title}</h3>
      <div className="schedule-event-times">
        {event.availabilityTime ? <p><b>출현</b><span>{event.availabilityTime}</span></p> : null}
        {event.featuredHour ? <p className="featured"><b>{event.category === "legendary" ? "레이드아워" : "맥스배틀 시간"}</b><span>{event.featuredHour}</span></p> : null}
      </div>
      <div className="schedule-rating"><RatingStars value={event.rating} /><strong>{event.reason}</strong></div>
      {pokemonList.length > 1 ? <ul className="schedule-pokemon-list">{pokemonList.map((item) => <li key={item.id}>{item.name}</li>)}</ul> : null}
    </div>
    {artwork ? <PokemonArtwork className="schedule-event-art" image={artwork.image} alt={artwork.name} size="sm" /> : null}
    <PrimaryCTA className="schedule-row-cta" href={event.href}>{ctaLabel}</PrimaryCTA>
  </article>;
}

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const currentWeek = getCurrentWeek();
  const requestedWeek = firstValue(query.week);
  const week = getWeekByStartDate(isDateKey(requestedWeek) ? requestedWeek : currentWeek.startDate);
  const requestedCategory = firstValue(query.category);
  const category: ScheduleCategory = filters.some((filter) => filter.key === requestedCategory) ? requestedCategory as ScheduleCategory : "all";
  const allEvents = getEventsByWeek(week);
  const visibleEvents = getEventsByCategory(allEvents, category as CategoryColor | "all");
  const days = getWeekDays(week);
  const importantEvents = getImportantEvents(allEvents)
    .sort((a, b) => b.priority - a.priority || (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date))
    .slice(0, 5)
    .sort((a, b) => (a.startAt ?? a.date).localeCompare(b.startAt ?? b.date));
  const isCurrentWeek = week.startDate === currentWeek.startDate;

  return <main className="fresh-screen boss-screen schedule-screen">
    <AppHeader subtitle="포켓몬 GO 주간 가이드" />

    <section className="schedule-week-nav" aria-label="주차 이동">
      <Link href={scheduleHref(getAdjacentWeekKey(week.startDate, -1), category)} aria-label="이전 주"><ChevronIcon /></Link>
      <div>
        <b>{formatWeekRange(week)}</b>
        {isCurrentWeek
          ? <span>이번 주</span>
          : <Link href={scheduleHref(currentWeek.startDate, category)}>이번 주로 돌아가기</Link>}
      </div>
      <Link href={scheduleHref(getAdjacentWeekKey(week.startDate, 1), category)} aria-label="다음 주"><ChevronIcon /></Link>
    </section>

    <nav className="schedule-filters" aria-label="일정 카테고리">
      {filters.map((filter) => <Link aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={scheduleHref(week.startDate, filter.key)} key={filter.key}>
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
      {importantEvents.length > 0 ? <div className="important-time-list">{importantEvents.map((event) => <Link href={event.href} key={event.id}>
        <time><b>{formatCompactDate(event.date)}</b><span>{getEventStartTime(event)}</span></time>
        <p>{event.title}</p>
        <ChevronIcon />
      </Link>)}</div> : <p className="schedule-empty">공식 발표된 중요 일정이 없어요.</p>}
    </section>

    <BottomNavigation active="schedule" />
  </main>;
}
