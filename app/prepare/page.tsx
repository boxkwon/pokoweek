"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, CountdownBadge, RatingStars, SectionHeader } from "../_components/design-system";
import { BagIcon, ChevronIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import { PokemonGuideLink } from "../_components/pokemon-guide-link";
import { PreparationActionChecklist, PreparationProgress } from "../_components/preparation-checklist";
import { APP_SUBTITLE } from "../_config/app";
import {
  getCurrentWeek,
  getDaysUntil,
  getEventById,
  getNextImportantEvent,
  getPreparationPlan,
  getUpcomingPreparationEvent,
  getWeekEventActionHref,
} from "../_data/queries";
import { getAppNow } from "../_lib/time";

export default function PreparePage() {
  const [now, setNow] = useState(() => getAppNow());
  useEffect(() => {
    const override = process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search).get("date") ?? undefined : undefined;
    setNow(getAppNow(override));
    const timer = window.setInterval(() => setNow(getAppNow(override)), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const week = useMemo(() => getCurrentWeek(now), [now]);
  const scheduleEvent = useMemo(() => getUpcomingPreparationEvent(week, now), [week, now]);
  const plan = getPreparationPlan(scheduleEvent?.preparationPlanId);
  const event = plan ? getEventById(plan.eventId) : undefined;
  const nextEvent = scheduleEvent ? getNextImportantEvent(week, scheduleEvent) : undefined;

  if (!scheduleEvent || !plan || !event) return <main className="fresh-screen boss-screen prepare-screen">
    <AppHeader subtitle={APP_SUBTITLE} />
    <section className="prepare-empty"><BagIcon /><h1>준비할 중요 이벤트가 없어요</h1><p>확정된 이벤트가 생기면 준비 목록을 알려드릴게요.</p></section>
    <BottomNavigation active="prep" />
  </main>;

  const storageKey = `pokoweek:${week.id}:preparations`;
  const countdown = getDaysUntil(scheduleEvent.date, now);
  const titleParts = event.title.split(" ");
  const titleYear = titleParts.pop();

  return <main className="fresh-screen boss-screen prepare-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    <Link className="home-weekly-card prepare-event-card" href={event.href} aria-label={`${event.title} 상세 보기`}>
      <div className="home-weekly-hero">
        <Image className="wild-bg" src={event.heroImage} alt="" fill sizes="430px" priority />
        <span className="wild-shade" />
        <PokemonArtwork className="home-hero-dialga" image={event.heroPokemon.dialga} alt="" size="hero" />
        <PokemonArtwork className="home-hero-palkia" image={event.heroPokemon.palkia} alt="" size="hero" />
        <PokemonArtwork className="home-hero-duraludon" image={event.heroPokemon.duraludon} alt="" size="hero" />
        <CountdownBadge days={countdown} />
        <div className="home-hero-title">
          <small>가장 가까운 중요 이벤트</small>
          <h1>{titleParts.join(" ")} <em>{titleYear}</em></h1>
          <div><RatingStars value={event.rating} /><strong>{event.ratingLabel}</strong></div>
        </div>
      </div>
      <div className="prepare-hero-meta"><b>{event.dateLabel}</b><span>이 이벤트를 위해 지금 준비하세요</span></div>
    </Link>

    <section className="home-board prepare-progress-board">
      <SectionHeader icon={<TargetIcon />} title="준비도" />
      <PreparationProgress storageKey={storageKey} items={plan.tasks} />
    </section>

    <section className="home-board prepare-pokemon-board">
      <SectionHeader icon={<SwordsIcon />} title="준비할 포켓몬" />
      <div className="prepare-pokemon-list">
        {plan.pokemon.map((item) => <PokemonGuideLink href={item.pokemon.href} key={item.pokemon.id}>
          <b className="priority-rank">{item.rank}</b>
          <PokemonArtwork image={item.pokemon.image} alt={item.pokemon.name} size="sm" />
          <div>
            <h3>{item.pokemon.name}</h3>
            <p><b>용도</b>{item.use}</p>
            <RatingStars value={item.rating} /><strong>{item.status}</strong>
            <small>{item.reason}</small>
          </div>
          <ChevronIcon />
        </PokemonGuideLink>)}
      </div>
    </section>

    <section className="home-board prepare-resource-board">
      <SectionHeader icon={<BagIcon />} title="준비할 자원" />
      <ul>{plan.resources.map((resource) => <li key={resource.id}><b>{resource.title}</b><span>{resource.goal}</span></li>)}</ul>
    </section>

    <section className="home-board prepare-action-board">
      <SectionHeader icon={<StarOutlineIcon />} title="지금 할 일" description="체크 상태는 홈과 함께 저장돼요" />
      <PreparationActionChecklist storageKey={storageKey} items={plan.tasks} />
    </section>

    {nextEvent ? <section className="prepare-next-section">
      <SectionHeader icon={<ChevronIcon />} title="그 다음 이벤트" />
      <PokemonGuideLink href={getWeekEventActionHref(nextEvent)}>
        <CategoryBadge className={`schedule-category-badge category-${nextEvent.category}`}>{nextEvent.categoryLabel}</CategoryBadge>
        <div><b>{nextEvent.title}</b><span>{nextEvent.dayLabel} · D-{Math.max(0, getDaysUntil(nextEvent.date, now))}</span></div>
        <RatingStars value={nextEvent.rating} />
        <ChevronIcon />
      </PokemonGuideLink>
    </section> : null}

    <BottomNavigation active="prep" />
  </main>;
}
