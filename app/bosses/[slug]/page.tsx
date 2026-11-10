import { notFound } from "next/navigation";
import Link from "next/link";
import { bosses, getBoss } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { ArrowLeftIcon, ChevronIcon } from "../../components/icons";
import { SourceList } from "../../components/source-list";
import { TypeIcons } from "../../components/type-icons";
import { PokemonArtwork } from "../../components/image-assets";
import { PokemonCounterCard } from "../../components/pokemon-counter-card";
import { PreparationChecklist, RatingStars, SectionHeader, ValueRating } from "../../components/ui";
import { getPokemonGuideMeta } from "../../data/guides";

export function generateStaticParams() { return bosses.map((boss) => ({ slug: boss.slug })); }

export default async function BossDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boss = getBoss(slug);
  if (!boss) notFound();
  const guide = getPokemonGuideMeta(boss);
  return (
    <div className="page-shell detail-page boss-detail">
      <section className="boss-guide-hero">
        <Link href="/raids" className="hero-back-button" aria-label="레이드로 돌아가기"><ArrowLeftIcon/></Link>
        <div className="boss-guide-visual">
          <PokemonArtwork
            src={boss.sprite}
            alt={boss.form ? `${boss.form} ${boss.name}` : boss.name}
            size="hero"
            position="right"
            objectPosition={boss.artwork?.objectPosition}
            scale={boss.artwork?.scale ?? 1.08}
            priority
          />
        </div>
        <div className="boss-guide-copy">
          <span className="battle-pill">{boss.battleType} 공략</span>
          {boss.form && <p className="boss-form-name">{boss.form}</p>}
          <h1>{boss.name}</h1>
          <div className="boss-type-line">
            <TypeIcons types={boss.types} size="large" label="보스 타입" />
          </div>
          <div className="boss-catch-rating"><RatingStars value={guide.rating} /><b>{guide.reason}</b></div>
          <div className="boss-difficulty"><b>난이도</b><span>{boss.difficulty}</span></div>
        </div>
      </section>

      <section className="boss-matchup-card">
        <div>
          <span className="section-kicker">공략 핵심</span>
          <h2>약점 <small>(더 큰 피해를 줌)</small></h2>
          <p>아이콘과 같은 타입 기술로 공격해요.</p>
        </div>
        <TypeIcons types={boss.weaknesses} size="large" label="약점 타입" />
      </section>

      <section className="detail-section counter-section detail-panel">
        <SectionHeader eyebrow="TOP COUNTERS" title="추천 공격수" />
        <div className="counter-grid">
          {boss.counters.map((counter, index) => <PokemonCounterCard name={counter.name} note={counter.note} rank={index + 1} key={counter.name} />)}
        </div>
        <Link className="detail-primary-cta" href="/raids">레이드 일정에서 확인 <ChevronIcon /></Link>
      </section>

      <section className="detail-section boss-value-section detail-panel">
        <SectionHeader eyebrow="VALUE" title="가치 평가" />
        <div className="value-rating-list">
          <ValueRating label="맥스배틀" value={guide.values.max.score} reason={guide.values.max.reason} />
          <ValueRating label="일반 레이드" value={guide.values.raid.score} reason={guide.values.raid.reason} />
          <ValueRating label="PvP" value={guide.values.pvp.score} reason={guide.values.pvp.reason} />
        </div>
      </section>

      <section className="detail-section boss-recommendation-section guide-panel">
        <SectionHeader eyebrow="GUIDE" title="추천 가이드" />
        <div className="guide-recommendation-grid">
          <PreparationChecklist items={["좋은 개체를 최소 1마리 확보해요.", "공격 15 개체를 우선해요."]} />
          <aside><b>한 줄 요약</b><p>{guide.summary}</p></aside>
        </div>
      </section>

      <section className="detail-section sources-section boss-sources"><h2>정보 출처</h2><SourceList sources={getSources(boss.sourceIds)}/></section>
    </div>
  );
}
