import { notFound } from "next/navigation";
import Link from "next/link";
import { events, getEvent } from "../../data/events";
import { bosses } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { BossCard } from "../../components/boss-card";
import { SourceList } from "../../components/source-list";
import { ArrowLeftIcon, ChevronIcon } from "../../components/icons";
import { EventHeroImage } from "../../components/image-assets";
import { CategoryBadge, PreparationChecklist, RatingStars, SectionHeader } from "../../components/ui";
import { PokemonThumbnail } from "../../components/pokemon-thumbnail";

export function generateStaticParams() { return events.map((event) => ({ slug: event.slug })); }

function shortPeriod(start: string, end: string) {
  const startDate = start.slice(5, 10).replace("-", "/");
  const endDate = end.slice(5, 10).replace("-", "/");
  return `${startDate} ~ ${endDate}`;
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  const eventBosses = bosses.filter((boss) => event.bossSlugs.includes(boss.slug));

  return (
    <div className="page-shell detail-page event-detail-page">
      <section className={`event-detail-hero ${event.color}`}>
        <Link href="/events" className="hero-back-button" aria-label="이벤트로 돌아가기"><ArrowLeftIcon/></Link>
        <EventHeroImage src={event.eventHero} alt="" priority />
        <span className="event-hero-overlay" />
        <div className="event-detail-hero-copy">
          <CategoryBadge tone="event">{event.eyebrow}</CategoryBadge>
          <h1>{event.title}</h1>
          <p>{event.summary}</p>
        </div>
      </section>

      <div className="event-facts">
        <div><span>기간</span><b>{shortPeriod(event.start, event.end)}</b></div>
        <div><span>시간</span><b>{event.start.slice(11,16)} ~ {event.end.slice(11,16)}</b></div>
      </div>
      <div className="event-priority-rating"><RatingStars value={5} /><strong>이번 달 최우선 이벤트</strong></div>

      {event.days?.map((day, dayIndex) => {
        const dayBosses = day.bossSlugs.map((bossSlug) => bosses.find((boss) => boss.slug === bossSlug)).filter(Boolean) as typeof bosses;
        return (
          <section className={`event-day-section day-${dayIndex + 1}`} key={day.label}>
            <header><b>{day.label}</b><span>{day.dateLabel}</span></header>
            <div className="event-day-grid">
              {dayBosses.map((boss) => (
                <PokemonThumbnail image={boss.sprite} name={boss.form ? `${boss.form} ${boss.name}` : boss.name} types={boss.types} href={`/bosses/${boss.slug}`} key={boss.slug} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="detail-section event-info-panel why-panel">
        <SectionHeader eyebrow="WHY PLAY" title="왜 해야 하나요?" />
        <PreparationChecklist items={event.highlights} />
      </section>

      <section className="detail-section event-info-panel prep-panel">
        <SectionHeader eyebrow="CHECKLIST" title="준비 체크리스트" />
        <PreparationChecklist items={event.checklist} variant="todo" />
      </section>

      <Link className="event-boss-cta" href="#event-boss-guides">보스별 공략 보기 <ChevronIcon /></Link>

      <section className="detail-section" id="event-boss-guides">
        <SectionHeader eyebrow="BOSS GUIDE" title="등장 보스와 공략" />
        <div className="boss-grid">{eventBosses.map((boss) => <BossCard boss={boss} key={boss.slug}/>)}</div>
      </section>

      <section className="detail-section sources-section"><h2>정보 출처</h2><SourceList sources={getSources(event.sourceIds)}/></section>
    </div>
  );
}
