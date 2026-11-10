import { notFound } from "next/navigation";
import Link from "next/link";
import { events, getEvent } from "../../data/events";
import { bosses } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { BossCard } from "../../components/boss-card";
import { SourceList } from "../../components/source-list";
import { ArrowLeftIcon, ClockIcon } from "../../components/icons";
import { formatDateTime } from "../../lib/format";
import { EventHeroImage, PokemonArtwork } from "../../components/image-assets";
import { CategoryBadge, PreparationChecklist, RatingStars, SectionHeader } from "../../components/ui";

export function generateStaticParams() { return events.map((event) => ({ slug: event.slug })); }

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  const eventBosses = bosses.filter((boss) => event.bossSlugs.includes(boss.slug));

  return (
    <div className="page-shell detail-page">
      <Link href="/events" className="back-link"><ArrowLeftIcon/>이벤트로 돌아가기</Link>
      <section className={`event-detail-hero ${event.color}`}>
        <EventHeroImage src={event.eventHero} alt="" priority />
        <span className="event-hero-overlay" />
        <div className="event-hero-pokemon" aria-hidden="true">
          {eventBosses.slice(0, 2).map((boss) => <PokemonArtwork src={boss.sprite} alt="" size="hero" position="right" scale={boss.artwork?.scale ?? 1} key={boss.slug} />)}
        </div>
        <div className="event-detail-hero-copy">
          <CategoryBadge tone="event">{event.eyebrow}</CategoryBadge>
          <h1>{event.title}</h1>
          <RatingStars value={5} />
          <p>{event.summary}</p>
          <div><ClockIcon/>{formatDateTime(event.start)} ~ {formatDateTime(event.end)}</div>
        </div>
      </section>

      <section className="detail-section">
        <SectionHeader eyebrow="WHY PLAY" title="왜 해야 하나요?" />
        <PreparationChecklist items={event.highlights} />
      </section>

      <section className="detail-section">
        <SectionHeader eyebrow="CHECKLIST" title="준비 체크리스트" />
        <PreparationChecklist items={event.checklist} />
      </section>

      <section className="detail-section">
        <SectionHeader eyebrow="BOSS GUIDE" title="등장 보스와 공략" />
        <div className="boss-grid">{eventBosses.map((boss) => <BossCard boss={boss} key={boss.slug}/>)}</div>
      </section>

      <section className="detail-section sources-section"><h2>정보 출처</h2><SourceList sources={getSources(event.sourceIds)}/></section>
    </div>
  );
}
