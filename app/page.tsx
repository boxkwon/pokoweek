"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./_components/app-header";
import { BottomNavigation } from "./_components/bottom-nav";
import { CategoryBadge, CountdownBadge, EventMeta, EventTime, PrimaryCTA, RatingStars, SectionHeader, TypeBadge } from "./_components/design-system";
import { BagIcon, CalendarIcon, ChevronIcon, ClockIcon, StarOutlineIcon } from "./_components/icons";
import { PokemonArtwork } from "./_components/pokemon-artwork";
import { PreparationChecklist } from "./_components/preparation-checklist";
import { APP_SUBTITLE } from "./_config/app";
import { typeColors } from "./_data/guide-data";
import { formatTodayLabel, getCurrentWeek, getDaysUntil, getFeaturedEvent, getTodayEvents, getUpcomingEvents, getWeekEventActionHref, getWeekEventActionLabel } from "./_data/queries";
import { getAppNow } from "./_lib/time";

export default function HomePage() {
  const [dateOverride, setDateOverride] = useState<string>();
  const [now, setNow] = useState(() => getAppNow());
  useEffect(() => {
    const override = process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search).get("date") ?? undefined : undefined;
    setDateOverride(override);
    setNow(getAppNow(override));
    const timer = window.setInterval(() => setNow(getAppNow(override)), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const week = useMemo(() => getCurrentWeek(now), [now]);
  const featuredEvent = getFeaturedEvent(week);
  const todayEvents = useMemo(() => getTodayEvents(week, now), [week, now]);
  const upcomingEvents = useMemo(() => getUpcomingEvents(week, now), [week, now]);
  const countdown = featuredEvent ? getDaysUntil(featuredEvent.startDate, now) : 0;
  const titleParts = featuredEvent?.title.split(" ") ?? [];
  const titleYear = titleParts.pop();

  return <main className="fresh-screen boss-screen home-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    {featuredEvent ? <Link className="home-weekly-card" href={featuredEvent.href} aria-label={`${featuredEvent.title} 상세 보기`}>
      <div className="home-weekly-hero">
        <Image className="wild-bg" src={featuredEvent.heroImage} alt="" fill sizes="430px" priority />
        <span className="wild-shade" />
        <PokemonArtwork className="home-hero-dialga" image={featuredEvent.heroPokemon.dialga} alt="" size="hero" />
        <PokemonArtwork className="home-hero-palkia" image={featuredEvent.heroPokemon.palkia} alt="" size="hero" />
        <PokemonArtwork className="home-hero-duraludon" image={featuredEvent.heroPokemon.duraludon} alt="" size="hero" />
        <CountdownBadge days={countdown} />
        <div className="home-hero-title">
          <small>{featuredEvent.eyebrow}</small>
          <h1>{titleParts.join(" ")} <em>{titleYear}</em></h1>
          <div><RatingStars value={featuredEvent.rating} /><strong>{featuredEvent.ratingLabel}</strong></div>
        </div>
      </div>
      <EventMeta className="home-hero-meta" dateLabel={featuredEvent.dateLabel} timeLabel={featuredEvent.timeLabel} compact />
    </Link> : <section className="home-board home-featured-empty"><CalendarIcon /><h1>이번 주 대표 이벤트</h1><p>아직 공식 발표된 중요 이벤트가 없어요.</p></section>}

    <section className="home-board home-priority-board">
      <SectionHeader icon={<StarOutlineIcon />} title="이번 주 꼭 할 것 TOP 3" />
      <div className="home-priority-list">
        {week.priorities.slice(0, 3).map((item) => <Link href={item.pokemon.href} key={item.rank}>
          <b className="priority-rank">{item.rank}</b>
          <PokemonArtwork image={item.pokemon.image} alt={item.pokemon.name} size="sm" />
          <div className="priority-copy"><h3>{item.pokemon.name}</h3><RatingStars value={item.rating} /><p>{item.reason}</p></div>
          <ChevronIcon />
        </Link>)}
        {week.priorities.length === 0 ? <p className="home-empty">공식 발표된 추천 공략이 없어요.</p> : null}
      </div>
    </section>

    <section className="home-board home-today-board">
      <SectionHeader icon={<ClockIcon />} title={`오늘 · ${formatTodayLabel(now)}`} />
      {todayEvents.length > 0 ? <div className="home-today-list">{todayEvents.map((event) => <article className="home-today-event" key={event.id}>
        <div className="today-event-copy">
          <CategoryBadge className={`schedule-category category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
          <EventTime className="today-time-lines" availabilityTime={event.availabilityTime} featuredHour={event.featuredHour} availabilityLabel="오늘 출현" featuredLabel={event.category === "max" ? "맥스배틀 시간" : event.category === "legendary" ? "레이드아워" : "집중 시간"} />
          <h3>{event.title}</h3>
          <div className="today-rating"><RatingStars value={event.rating} /><strong>{event.reason}</strong></div>
          {event.weaknesses ? <div className="today-weakness"><b>약점</b>{event.weaknesses.map((type) => <TypeBadge type={type} color={typeColors[type]} key={type} />)}</div> : null}
        </div>
        {event.pokemon[0] ? <PokemonArtwork className="today-pokemon-art" image={event.pokemon[0].image} alt={event.pokemon[0].name} size="md" /> : null}
        <PrimaryCTA className="home-small-cta" href={getWeekEventActionHref(event)}>{getWeekEventActionLabel(event)}</PrimaryCTA>
      </article>)}</div> : <p className="home-empty">오늘은 중요한 이벤트가 없어요.<br />이번 주 준비를 해두세요.</p>}
    </section>

    {featuredEvent && week.preparations.length > 0 ? <section className="home-board home-preparation-board">
      <SectionHeader icon={<BagIcon />} title="다음 이벤트 준비" />
      <div className="preparation-title"><b>{featuredEvent.title}</b><CountdownBadge days={countdown} /></div>
      <PreparationChecklist storageKey={`pokoweek:${week.id}:preparations`} items={week.preparations.slice(0, 4)} />
    </section> : null}

    <section className="home-board home-schedule-board">
      <SectionHeader icon={<CalendarIcon />} title="이번 주 일정 미리보기" />
      <div className="home-schedule-list">
        {upcomingEvents.map((event) => <Link href={getWeekEventActionHref(event)} key={event.id}>
          <time>{event.dayLabel}</time>
          <CategoryBadge className={`schedule-dot category-${event.category}`}>{event.categoryLabel}</CategoryBadge>
          <div><b>{event.title}</b>{event.availabilityTime ? <small>{event.availabilityTime}</small> : null}</div>
          <ChevronIcon />
        </Link>)}
      </div>
      <PrimaryCTA className="home-schedule-cta" href={`/schedule?week=${week.startDate}&category=all${dateOverride ? `&date=${dateOverride}` : ""}`} trailing={false}>이번 주 전체 일정 보기 <span aria-hidden="true">→</span></PrimaryCTA>
    </section>

    <BottomNavigation active="home" />
  </main>;
}
