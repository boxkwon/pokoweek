import { redirect } from "next/navigation";
import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, EventTime, PrimaryCTA, RatingStars, SectionHeader } from "../_components/design-system";
import { CalendarIcon, ChevronIcon, ClockIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import { PokemonGuideLink } from "../_components/pokemon-guide-link";
import { SchedulePreferenceSync } from "../_components/schedule-preference-sync";
import { ContextLink } from "../_components/context-link";
import { APP_SUBTITLE } from "../_config/app";
import type { ScheduleFilter, WeekEvent } from "../_data/guide-data";
import {
  formatCompactDate,
  formatRangeEventPeriod,
  formatWeekRange,
  getAdjacentWeekKey,
  getAvailableScheduleFilters,
  getCurrentWeek,
  getEventsByCategory,
  getEventsByDate,
  getEventsByWeek,
  getImportantMilestones,
  hasEventsForCategory,
  isRangeContinuation,
  getWeekByStartDate,
  getWeekDays,
  normalizeScheduleCategoryForEvents,
  resolveWeekEventAction,
} from "../_data/queries";
import { getAppNow, isDateKey, isValidDateOverride } from "../_lib/time";
import { getDateContextForWeek, withDateContext } from "../_lib/internal-url";
import { hasRealPokemonArtwork } from "../_lib/pokemon-artwork";
import { normalizeScheduleFilter } from "../_lib/schedule-preferences";

const tierFilters = [
  { key: "all", label: "전체 레이드" },
  { key: "tier5", label: "5성" },
  { key: "tier4", label: "4성" },
  { key: "tier3", label: "3성" },
  { key: "tier1", label: "1성" },
] as const;

const kindFilters = [
  { key: "normal", label: "일반" },
  { key: "mega", label: "메가" },
  { key: "shadow", label: "그림자" },
  { key: "special", label: "특별" },
  { key: "max", label: "맥스" },
  { key: "event", label: "이벤트" },
] as const;

const filters = [...tierFilters, ...kindFilters] as const;

type ScheduleCategory = (typeof filters)[number]["key"];
type SearchParams = Promise<{ week?: string | string[]; category?: string | string[]; date?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function scheduleHref(week: string, category: ScheduleCategory, dateContext?: string) {
  const query = new URLSearchParams({ week, category });
  return withDateContext(`/schedule?${query.toString()}`, getDateContextForWeek(week, dateContext));
}

function hasUsableArtwork(event: WeekEvent) {
  return event.pokemon.slice(0, 3).every((item) => hasRealPokemonArtwork(item.image));
}

function ScheduleEventRow({ event, dateKey }: { event: WeekEvent; dateKey: string }) {
  const action = resolveWeekEventAction(event, dateKey);
  const continuation = isRangeContinuation(event, dateKey);
  const showArtworkTrio = event.pokemon.length >= 3 && hasUsableArtwork(event);
  const artworkClass = event.pokemon.length === 2 ? "has-art-pair" : showArtworkTrio ? "has-art-trio" : event.pokemon.length >= 3 ? "has-art-group" : "has-single-art";

  if (continuation) return <article className="schedule-event-row range-continuation">
    <div className="schedule-event-copy">
      <CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
      <h3>{event.title}</h3>
      <p className="range-continuation-time">{formatRangeEventPeriod(event, dateKey, true)}</p>
    </div>
    {action.href
      ? <PokemonGuideLink className="range-continuation-link" href={action.href} aria-label={`${event.title} ${action.label}`}><ChevronIcon /></PokemonGuideLink>
      : <span className="schedule-guide-unavailable compact">{action.label}</span>}
  </article>;

  return <article className={`schedule-event-row ${event.priority === 5 ? "priority-five" : ""} ${artworkClass}`}>
    <div className="schedule-event-copy">
      <CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
      <h3>{event.title}</h3>
      {event.scheduleType === "range"
        ? <p className="range-event-time">{formatRangeEventPeriod(event, dateKey)}</p>
        : <EventTime className="schedule-event-times" availabilityTime={event.availabilityTime} featuredHour={event.featuredHour} featuredLabel={event.category === "legendary" ? "레이드아워" : event.category === "max" ? "맥스배틀 시간" : "집중 시간"} />}
      {event.rating ? <div className="schedule-rating"><RatingStars value={event.rating} /><strong>{event.reason}</strong></div> : <p className="schedule-rotation-note">{event.reason}</p>}
      {event.pokemon.length > 1 ? <ul className="schedule-pokemon-list">{event.pokemon.map((item) => <li key={item.id}>{item.name}</li>)}</ul> : null}
    </div>
    {event.pokemon.length === 1 ? <PokemonArtwork className="schedule-event-art" image={event.pokemon[0].image} alt={event.pokemon[0].name} size="sm" /> : null}
    {event.pokemon.length === 2 ? <div className="schedule-event-art-pair" aria-label={event.pokemon.map((item) => item.name).join(", ")}>{event.pokemon.map((item) => <PokemonArtwork image={item.image} alt="" size="sm" key={item.id} />)}</div> : null}
    {showArtworkTrio ? <div className="schedule-event-art-trio" aria-label={event.pokemon.slice(0, 3).map((item) => item.name).join(", ")}>{event.pokemon.slice(0, 3).map((item) => <PokemonArtwork image={item.image} alt="" size="sm" key={item.id} />)}</div> : null}
    {event.pokemon.length >= 3 && !showArtworkTrio ? <span className="schedule-event-art-count" aria-label={`${event.pokemon.length}마리의 포켓몬`}>+{event.pokemon.length}</span> : null}
    {action.href
      ? <PrimaryCTA className="schedule-row-cta" href={action.href}>{action.label}</PrimaryCTA>
      : <p className="schedule-guide-unavailable">{action.label}</p>}
  </article>;
}

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const requestedDate = firstValue(query.date);
  const routeDateContext = isDateKey(requestedDate) ? requestedDate : undefined;
  const dateOverride = isValidDateOverride(requestedDate) ? requestedDate : undefined;
  const now = getAppNow(dateOverride);
  const currentWeek = getCurrentWeek(now);
  const requestedWeek = firstValue(query.week);
  const week = getWeekByStartDate(isDateKey(requestedWeek) ? requestedWeek : currentWeek.startDate);
  const requestedCategory = firstValue(query.category);
  const allEvents = getEventsByWeek(week);
  const category = normalizeScheduleCategoryForEvents(allEvents, normalizeScheduleFilter(requestedCategory)) as ScheduleCategory;
  if (requestedCategory && requestedCategory !== category) {
    redirect(scheduleHref(week.startDate, category, routeDateContext));
  }
  const visibleEvents = getEventsByCategory(allEvents, category as ScheduleFilter);
  const availableCategories = getAvailableScheduleFilters(allEvents);
  const days = getWeekDays(week, now);
  const importantMilestones = getImportantMilestones(allEvents, week)
    .slice(0, 5)
    .sort((a, b) => `${a.dateKey}T${a.time}`.localeCompare(`${b.dateKey}T${b.time}`));
  const isCurrentWeek = week.startDate === currentWeek.startDate;
  const previousWeekKey = getAdjacentWeekKey(week.startDate, -1);
  const nextWeekKey = getAdjacentWeekKey(week.startDate, 1);
  const previousCategory = normalizeScheduleCategoryForEvents(getEventsByWeek(getWeekByStartDate(previousWeekKey)), category) as ScheduleCategory;
  const nextCategory = normalizeScheduleCategoryForEvents(getEventsByWeek(getWeekByStartDate(nextWeekKey)), category) as ScheduleCategory;
  const currentCategory = normalizeScheduleCategoryForEvents(getEventsByWeek(currentWeek), category) as ScheduleCategory;

  return <main className="fresh-screen boss-screen schedule-screen">
    <AppHeader subtitle={APP_SUBTITLE} />
    <SchedulePreferenceSync availableCategories={availableCategories} selectedCategory={category} selectedWeek={week.startDate} hasCategoryQuery={requestedCategory === category} hasWeekQuery={isDateKey(requestedWeek)} dateContext={routeDateContext} />

    <section className="schedule-week-nav" aria-label="주차 이동">
      <ContextLink href={scheduleHref(previousWeekKey, previousCategory, routeDateContext)} aria-label="이전 주"><ChevronIcon /></ContextLink>
      <div>
        <b>{formatWeekRange(week)}</b>
        {isCurrentWeek
          ? <span>이번 주</span>
          : <ContextLink href={scheduleHref(currentWeek.startDate, currentCategory, routeDateContext)}>이번 주로 돌아가기</ContextLink>}
      </div>
      <ContextLink href={scheduleHref(nextWeekKey, nextCategory, routeDateContext)} aria-label="다음 주"><ChevronIcon /></ContextLink>
    </section>

    <div className="schedule-filter-groups">
      <nav className="schedule-filters" aria-label="레이드 등급">
        {tierFilters.filter((filter) => filter.key === "all" || hasEventsForCategory(allEvents, filter.key)).map((filter) => <ContextLink aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={scheduleHref(week.startDate, filter.key, routeDateContext)} key={filter.key}>
          <CategoryBadge className={`schedule-filter-badge filter-${filter.key}`}>{filter.label}</CategoryBadge>
        </ContextLink>)}
      </nav>
      <nav className="schedule-filters schedule-kind-filters" aria-label="레이드 종류와 기타 일정">
        {kindFilters.filter((filter) => hasEventsForCategory(allEvents, filter.key)).map((filter) => <ContextLink aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={scheduleHref(week.startDate, filter.key, routeDateContext)} key={filter.key}>
          <CategoryBadge className={`schedule-filter-badge filter-${filter.key}`}>{filter.label}</CategoryBadge>
        </ContextLink>)}
      </nav>
    </div>

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
              {events.length > 0 ? events.map((event) => <ScheduleEventRow event={event} dateKey={day.dateKey} key={event.id} />) : <p className="schedule-empty">중요 일정 없음</p>}
            </div>
          </section>;
        })}
      </div>
    </section>

    <section className="schedule-important-board">
      <SectionHeader icon={<ClockIcon />} title="이번 주 놓치지 말 것" />
      {importantMilestones.length > 0 ? <div className="important-time-list">{importantMilestones.map((milestone) => {
        const action = resolveWeekEventAction(milestone.event, milestone.dateKey);
        const content = <><time><b>{formatCompactDate(milestone.dateKey)}</b><span>{milestone.time} · {milestone.meaning}</span></time>
        <p>{milestone.event.title}</p>
        {action.href ? <ChevronIcon /> : <span className="schedule-guide-unavailable compact">{action.label}</span>}</>;
        return action.href ? <PokemonGuideLink href={action.href} key={`${milestone.event.id}-${milestone.kind}`}>
        {content}
      </PokemonGuideLink> : <article key={`${milestone.event.id}-${milestone.kind}`}>
        {content}
      </article>;
      })}</div> : <p className="schedule-empty">공식 발표된 중요 일정이 없어요.</p>}
    </section>

    <BottomNavigation active="schedule" />
  </main>;
}
