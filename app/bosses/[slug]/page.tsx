import { notFound } from "next/navigation";
import Link from "next/link";
import { bosses, getBoss } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { ArrowLeftIcon, ChartIcon, ChevronIcon, CrossedSwordsIcon, GuideIcon, TargetIcon } from "../../components/icons";
import { SourceList } from "../../components/source-list";
import { TypeIcons } from "../../components/type-icons";
import { EventHeroImage, PokemonArtwork } from "../../components/image-assets";
import { PokemonCounterCard } from "../../components/pokemon-counter-card";
import { PreparationChecklist, RatingStars, ValueRating } from "../../components/ui";
import { getPokemonGuideMeta } from "../../data/guides";

export function generateStaticParams() { return bosses.map((boss) => ({ slug: boss.slug })); }

function heroBackground(slug: string) {
  if (slug.includes("palkia")) return "/images/events/palkiaraid.jpg";
  if (slug.includes("dialga")) return "/images/events/dialgaraids.jpg";
  return "/images/events/events-default-img.jpg";
}

export default async function BossDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boss = getBoss(slug);
  if (!boss) notFound();
  const guide = getPokemonGuideMeta(boss);
  return (
    <div className="page-shell detail-page boss-detail">
      <section className="boss-guide-hero">
        <Link href="/raids" className="hero-back-button" aria-label="레이드로 돌아가기"><ArrowLeftIcon/></Link>
        <EventHeroImage src={heroBackground(boss.slug)} alt="" className="boss-guide-background" priority />
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
          <span className="battle-pill"><CrossedSwordsIcon />{boss.battleType}</span>
          <h1>{boss.form ? `${boss.form} ${boss.name}` : boss.name}</h1>
          <div className="boss-type-line" aria-label={`보스 타입: ${boss.types.join(", ")}`}>
            {boss.types.map((type) => <span key={type}><TypeIcons types={[type]} size="small" label={`${type} 타입`} /><b>{type}</b></span>)}
          </div>
          <div className="boss-catch-rating"><RatingStars value={guide.rating} /><b>{guide.rating === 5 ? "꼭 잡기" : guide.reason}</b></div>
        </div>
      </section>

      <section className="boss-matchup-card">
        <h2><TargetIcon />약점 <small>더 큰 피해를 줘요</small></h2>
        <div className="weakness-type-list">
          {boss.weaknesses.map((type) => <span key={type}><TypeIcons types={[type]} size="small" label={`${type} 약점`} /><b>{type}</b></span>)}
        </div>
      </section>

      <section className="detail-section counter-section detail-panel">
        <header className="guide-section-heading"><CrossedSwordsIcon /><div><h2>추천 공격수</h2><p>레이드·맥스배틀에서 효과적인 포켓몬</p></div></header>
        <div className="counter-grid">
          {boss.counters.map((counter, index) => <PokemonCounterCard name={counter.name} note={counter.note} rank={index + 1} key={counter.name} />)}
        </div>
        <Link className="detail-primary-cta" href="/raids">레이드 일정에서 확인 <ChevronIcon /></Link>
      </section>

      <section className="detail-section boss-value-section detail-panel">
        <header className="guide-section-heading"><ChartIcon /><div><h2>가치 평가</h2><p>잡고 키울 가치가 있을까요?</p></div></header>
        <div className="value-rating-list">
          <ValueRating label="맥스배틀" value={guide.values.max.score} reason={guide.values.max.reason} />
          <ValueRating label="일반 레이드" value={guide.values.raid.score} reason={guide.values.raid.reason} />
          <ValueRating label="PvP" value={guide.values.pvp.score} reason={guide.values.pvp.reason} />
        </div>
      </section>

      <section className="detail-section boss-recommendation-section guide-panel">
        <header className="guide-section-heading"><GuideIcon /><div><h2>추천 가이드</h2></div></header>
        <div className="guide-recommendation-grid">
          <PreparationChecklist items={["좋은 개체를 최소 1마리 확보해요.", "공격 15 개체를 우선해요."]} />
          <aside><b>한 줄 요약</b><p>{guide.summary}</p></aside>
        </div>
      </section>

      <section className="detail-section sources-section boss-sources"><h2>정보 출처</h2><SourceList sources={getSources(boss.sourceIds)}/></section>
    </div>
  );
}
