import { redirect } from "next/navigation";
import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, EventTime, PrimaryCTA, RatingStars, SectionHeader } from "../_components/design-system";
import { CalendarIcon, ChevronIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import { PokemonGuideLink } from "../_components/pokemon-guide-link";
import { ScheduleRaidAction } from "../_components/schedule-raid-action";
import { SchedulePreferenceSync } from "../_components/schedule-preference-sync";
import { ContextLink } from "../_components/context-link";
import { APP_SUBTITLE } from "../_config/app";
import type { ScheduleFilter, WeekEvent } from "../_data/guide-data";
import {
  formatRangeEventPeriod,
  formatWeekRange,
  getAdjacentWeekKey,
  getCurrentWeek,
  getEventEndDateKey,
  getEventStartDateKey,
  getEventsByCategory,
  getEventsByDate,
  getEventsByWeek,
  getSeoulDateKey,
  hasEventsForCategory,
  isTimeLimitedEvent,
  isRangeContinuation,
  getWeekByStartDate,
  getWeekDays,
  normalizeScheduleCategoryForEvents,
  resolveWeekEventAction,
} from "../_data/queries";
import { getAppNow, isDateKey, isValidDateOverride } from "../_lib/time";
import { withDateContext } from "../_lib/internal-url";
import { getWeekStartForDate, moveDateToWeek, resolveSelectedScheduleDate } from "../_lib/daily-schedule";
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

function scheduleHref(week: string, category: ScheduleCategory, date: string) {
  const query = new URLSearchParams({ week, category });
  return withDateContext(`/schedule?${query.toString()}`, date);
}

function hasUsableArtwork(event: WeekEvent) {
  return event.pokemon.slice(0, 3).every((item) => hasRealPokemonArtwork(item.image));
}

function EventDateCue({ event, dateKey, isToday }: { event: WeekEvent; dateKey: string; isToday: boolean }) {
  if (isTimeLimitedEvent(event)) return <span className="schedule-date-cue time-limited">시간 한정</span>;
  if (event.scheduleType !== "range") return null;
  if (getEventEndDateKey(event) === dateKey) return <span className="schedule-date-cue ending">{isToday ? "오늘 종료" : "이날 종료"}</span>;
  if (getEventStartDateKey(event) === dateKey) return <span className="schedule-date-cue starting">{isToday ? "오늘 시작" : "이날 시작"}</span>;
  return null;
}

function RaidArtworkGroup({ event }: { event: WeekEvent }) {
  return <span className={`schedule-raid-artworks count-${Math.min(event.pokemon.length, 4)}`} aria-label={event.pokemon.map((item) => item.name).join(", ")}>
    {event.pokemon.map((item) => <PokemonArtwork image={item.image} alt={item.name} size="sm" key={item.id} />)}
  </span>;
}

function ScheduleRaidEventRow({ event, dateKey, isToday }: { event: WeekEvent; dateKey: string; isToday: boolean }) {
  const action = resolveWeekEventAction(event, dateKey);
  const continuation = isRangeContinuation(event, dateKey);
  const pokemonNames = event.pokemon.map((item) => item.name).join(" · ");

  return <article className={`schedule-event-row schedule-raid-row ${event.priority === 5 ? "priority-five" : ""} ${continuation ? "range-continuation" : ""}`}>
    <ScheduleRaidAction action={action} pokemonNames={pokemonNames}>
      <RaidArtworkGroup event={event} />
      <div className="schedule-event-copy">
        <div className="schedule-event-labels"><CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge><EventDateCue event={event} dateKey={dateKey} isToday={isToday} /></div>
        <h3>{event.title}</h3>
        {continuation
          ? <p className="range-continuation-time">{formatRangeEventPeriod(event, dateKey, true)}</p>
          : event.scheduleType === "range"
            ? <p className="range-event-time">{formatRangeEventPeriod(event, dateKey)}</p>
            : <EventTime className="schedule-event-times" availabilityTime={event.availabilityTime} featuredHour={event.featuredHour} featuredLabel={event.category === "legendary" ? "레이드아워" : "집중 시간"} />}
        {!continuation && (event.rating
          ? <div className="schedule-rating"><RatingStars value={event.rating} /><strong>{event.reason}</strong></div>
          : <p className="schedule-rotation-note">{event.reason}</p>)}
        {event.pokemon.length > 1 ? <ul className="schedule-pokemon-list">{event.pokemon.map((item) => <li key={item.id}>{item.name}</li>)}</ul> : null}
      </div>
    </ScheduleRaidAction>
  </article>;
}

function ScheduleEventRow({ event, dateKey, isToday }: { event: WeekEvent; dateKey: string; isToday: boolean }) {
  const action = resolveWeekEventAction(event, dateKey);
  const continuation = isRangeContinuation(event, dateKey);
  const showArtworkTrio = event.pokemon.length >= 3 && hasUsableArtwork(event);
  const artworkClass = event.pokemon.length === 2 ? "has-art-pair" : showArtworkTrio ? "has-art-trio" : event.pokemon.length >= 3 ? "has-art-group" : "has-single-art";

  if (typeof event.raidTier !== "undefined") {
    return <ScheduleRaidEventRow event={event} dateKey={dateKey} isToday={isToday} />;
  }

  if (continuation) return <article className="schedule-event-row range-continuation">
    <div className="schedule-event-copy">
      <div className="schedule-event-labels"><CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge><EventDateCue event={event} dateKey={dateKey} isToday={isToday} /></div>
      <h3>{event.title}</h3>
      <p className="range-continuation-time">{formatRangeEventPeriod(event, dateKey, true)}</p>
    </div>
    {action.href
      ? <PokemonGuideLink className="range-continuation-link" href={action.href} aria-label={`${event.title} ${action.label}`}><ChevronIcon /></PokemonGuideLink>
      : <span className="schedule-guide-unavailable compact">{action.label}</span>}
  </article>;

  return <article className={`schedule-event-row ${event.priority === 5 ? "priority-five" : ""} ${artworkClass}`}>
    <div className="schedule-event-copy">
      <div className="schedule-event-labels"><CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge><EventDateCue event={event} dateKey={dateKey} isToday={isToday} /></div>
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
  const dateOverride = isValidDateOverride(requestedDate) ? requestedDate : undefined;
  const now = getAppNow(dateOverride);
  const todayDate = getSeoulDateKey(now);
  const requestedWeek = firstValue(query.week);
  const selectedDate = resolveSelectedScheduleDate({ requestedDate, requestedWeek, todayDate });
  const selectedWeekStart = getWeekStartForDate(selectedDate);
  const week = getWeekByStartDate(selectedWeekStart);
  const currentWeek = getCurrentWeek(now);
  const requestedCategory = firstValue(query.category);
  const allEvents = getEventsByWeek(week);
  const category = normalizeScheduleCategoryForEvents(allEvents, normalizeScheduleFilter(requestedCategory)) as ScheduleCategory;

  if (requestedWeek !== selectedWeekStart || requestedCategory !== category || requestedDate !== selectedDate) {
    redirect(scheduleHref(selectedWeekStart, category, selectedDate));
  }

  const visibleEvents = getEventsByCategory(allEvents, category as ScheduleFilter);
  const selectedEvents = getEventsByDate(visibleEvents, selectedDate);
  const days = getWeekDays(week, now);
  const selectedDay = days.find((day) => day.dateKey === selectedDate) ?? days[0];
  const isCurrentWeek = week.startDate === currentWeek.startDate;
  const previousWeekKey = getAdjacentWeekKey(week.startDate, -1);
  const nextWeekKey = getAdjacentWeekKey(week.startDate, 1);
  const previousDate = moveDateToWeek(selectedDate, week.startDate, previousWeekKey);
  const nextDate = moveDateToWeek(selectedDate, week.startDate, nextWeekKey);
  const previousCategory = normalizeScheduleCategoryForEvents(getEventsByWeek(getWeekByStartDate(previousWeekKey)), category) as ScheduleCategory;
  const nextCategory = normalizeScheduleCategoryForEvents(getEventsByWeek(getWeekByStartDate(nextWeekKey)), category) as ScheduleCategory;
  const currentDate = moveDateToWeek(selectedDate, week.startDate, currentWeek.startDate);
  const currentCategory = normalizeScheduleCategoryForEvents(getEventsByWeek(currentWeek), category) as ScheduleCategory;

  return <main className="fresh-screen boss-screen schedule-screen daily-schedule-screen">
    <AppHeader subtitle={APP_SUBTITLE} />
    <SchedulePreferenceSync selectedCategory={category} selectedWeek={week.startDate} />

    <section className="schedule-week-nav" aria-label="주차 이동">
      <ContextLink href={scheduleHref(previousWeekKey, previousCategory, previousDate)} aria-label="이전 주"><ChevronIcon /></ContextLink>
      <div>
        <b>{formatWeekRange(week)}</b>
        {isCurrentWeek
          ? <span>이번 주</span>
          : <ContextLink href={scheduleHref(currentWeek.startDate, currentCategory, currentDate)}>이번 주로 돌아가기</ContextLink>}
      </div>
      <ContextLink href={scheduleHref(nextWeekKey, nextCategory, nextDate)} aria-label="다음 주"><ChevronIcon /></ContextLink>
    </section>

    <div className="schedule-filter-groups">
      <nav className="schedule-filters" aria-label="레이드 등급">
        {tierFilters.filter((filter) => filter.key === "all" || hasEventsForCategory(allEvents, filter.key)).map((filter) => <ContextLink aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={scheduleHref(week.startDate, filter.key, selectedDate)} key={filter.key}>
          <CategoryBadge className={`schedule-filter-badge filter-${filter.key}`}>{filter.label}</CategoryBadge>
        </ContextLink>)}
      </nav>
      <nav className="schedule-filters schedule-kind-filters" aria-label="레이드 종류와 기타 일정">
        {kindFilters.filter((filter) => hasEventsForCategory(allEvents, filter.key)).map((filter) => <ContextLink aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={scheduleHref(week.startDate, filter.key, selectedDate)} key={filter.key}>
          <CategoryBadge className={`schedule-filter-badge filter-${filter.key}`}>{filter.label}</CategoryBadge>
        </ContextLink>)}
      </nav>
    </div>

    <nav className="schedule-day-tabs" aria-label="요일 선택">
      {days.map((day) => <ContextLink
        key={day.dateKey}
        href={scheduleHref(week.startDate, category, day.dateKey)}
        aria-current={day.dateKey === selectedDate ? "date" : undefined}
        className={`${day.dateKey === selectedDate ? "selected" : ""} ${day.isToday ? "today" : ""} ${day.isSaturday ? "saturday" : ""} ${day.isSunday ? "sunday" : ""}`}
      ><span>{day.weekday.replace("요일", "")}</span><b>{day.day}</b>{day.isToday ? <small>오늘</small> : null}</ContextLink>)}
    </nav>

    <section className="schedule-list-section schedule-daily-list">
      <SectionHeader icon={<CalendarIcon />} title={`${selectedDay.day}일 ${selectedDay.weekday} 일정`} />
      <p className="schedule-selected-date-summary">선택한 날짜에 할 수 있는 레이드·맥스배틀·이벤트만 보여드려요.</p>
      <div className={`schedule-selected-day ${selectedDay.isToday ? "today" : ""}`}>
        {selectedEvents.length > 0
          ? selectedEvents.map((event) => <ScheduleEventRow event={event} dateKey={selectedDate} isToday={selectedDay.isToday} key={event.id} />)
          : <p className="schedule-empty">{selectedDay.isToday ? "오늘 해당 일정이 없습니다." : "이날 해당 일정이 없습니다."}</p>}
      </div>
    </section>

    <BottomNavigation active="schedule" />
  </main>;
}
