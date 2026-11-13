"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentWeek, getPokemonEventsForWeek, getWeekEventActionHref } from "../_data/queries";
import { getDateContextFromSearch } from "../_lib/internal-url";
import { getAppNow } from "../_lib/time";
import { CategoryBadge, SectionHeader } from "./design-system";
import { CalendarIcon, ChevronIcon } from "./icons";
import { ContextLink } from "./context-link";

export function PokemonWeekSchedule({ pokemonId }: { pokemonId: string }) {
  const [now, setNow] = useState(() => getAppNow());

  useEffect(() => {
    const dateContext = getDateContextFromSearch(window.location.search);
    setNow(getAppNow(dateContext));
  }, []);

  const week = useMemo(() => getCurrentWeek(now), [now]);
  const events = useMemo(() => getPokemonEventsForWeek(week, pokemonId), [pokemonId, week]);

  return <section className="dialga-guide-board pokemon-week-board">
    <SectionHeader icon={<CalendarIcon />} title="이번 주" />
    {events.length > 0 ? <div className="pokemon-week-list">{events.map((event) => <ContextLink href={getWeekEventActionHref(event)} key={event.id}>
      <CategoryBadge className={`schedule-category-badge category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
      <div>
        <h3>{event.title}</h3>
        <time>{event.dayLabel}{event.availabilityTime ? ` · ${event.availabilityTime}` : ""}</time>
        <p><b>추천 행동</b>{event.reason}</p>
      </div>
      <ChevronIcon />
    </ContextLink>)}</div> : <p className="guide-data-missing">이번 주에 확인된 등장 일정이 없어요.</p>}
  </section>;
}
