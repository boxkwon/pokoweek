import { notFound } from "next/navigation";
import Link from "next/link";
import { bosses, getBoss } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { ArrowLeftIcon, ShieldIcon } from "../../components/icons";
import { SourceList } from "../../components/source-list";
import { TypeIcons } from "../../components/type-icons";
import { PokemonArtwork } from "../../components/image-assets";
import { PokemonCounterCard } from "../../components/pokemon-counter-card";
import { PreparationChecklist, RatingStars, SectionHeader, ValueRating } from "../../components/ui";

export function generateStaticParams() { return bosses.map((boss) => ({ slug: boss.slug })); }

export default async function BossDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boss = getBoss(slug);
  if (!boss) notFound();
  return (
    <div className="page-shell detail-page boss-detail">
      <Link href="/raids" className="back-link boss-back-link"><ArrowLeftIcon/>레이드로 돌아가기</Link>

      <section className="boss-guide-hero">
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
          <RatingStars value={boss.battleType === "레이드" ? 4 : 5} />
          <div className="boss-type-line">
            <span>보스 타입</span>
            <TypeIcons types={boss.types} size="large" label="보스 타입" />
          </div>
          <div className="boss-difficulty"><b>난이도</b><span>{boss.difficulty}</span></div>
        </div>
      </section>

      <section className="boss-matchup-card">
        <div>
          <span className="section-kicker">공략 핵심</span>
          <h2>이 타입으로 공격해요</h2>
          <p>아이콘과 같은 타입의 기술을 가진 포켓몬을 골라보세요.</p>
        </div>
        <TypeIcons types={boss.weaknesses} size="large" label="약점 타입" />
      </section>

      <section className="detail-section counter-section">
        <SectionHeader eyebrow="TOP COUNTERS" title="추천 공격수 TOP 3" />
        <div className="counter-grid">
          {boss.counters.map((counter, index) => <PokemonCounterCard name={counter.name} note={counter.note} rank={index + 1} key={counter.name} />)}
        </div>
      </section>

      <section className="detail-section boss-value-section">
        <SectionHeader eyebrow="VALUE" title="어디에 쓸까요?" />
        <div className="value-rating-list">
          <ValueRating label="맥스배틀" value={boss.battleType === "맥스배틀" || boss.battleType === "거다이맥스" ? 5 : 2} />
          <ValueRating label="일반 레이드" value={boss.battleType === "레이드" ? 5 : 3} />
          <ValueRating label="PvP" value={3} />
        </div>
      </section>

      <section className="detail-section boss-recommendation-section">
        <SectionHeader eyebrow="GUIDE" title="이렇게 준비해요" />
        <PreparationChecklist items={["좋은 개체를 최소 1마리 확보해요.", "공격 15 개체를 우선해요.", boss.tip]} />
      </section>

      <div className="strategy-note boss-strategy-note"><ShieldIcon/><div><strong>작전 메모</strong><p>{boss.tip}</p></div></div>

      <section className="detail-section sources-section boss-sources"><h2>정보 출처</h2><SourceList sources={getSources(boss.sourceIds)}/></section>
    </div>
  );
}
