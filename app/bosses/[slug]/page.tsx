import { notFound } from "next/navigation";
import Link from "next/link";
import { bosses, getBoss } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { ArrowLeftIcon, ShieldIcon } from "../../components/icons";
import { SourceList } from "../../components/source-list";
import { TypeIcons } from "../../components/type-icons";
import { counterArtworkUrl, counterTypes } from "../../lib/pokemon";
import { PokemonThumbnail } from "../../components/pokemon-thumbnail";

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
          <PokemonThumbnail
            image={boss.sprite}
            name={boss.form ? `${boss.form} ${boss.name}` : boss.name}
            types={boss.types}
          />
        </div>
        <div className="boss-guide-copy">
          <span className="battle-pill">{boss.battleType} 공략</span>
          {boss.form && <p className="boss-form-name">{boss.form}</p>}
          <h1>{boss.name}</h1>
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
        <div className="boss-section-heading">
          <div>
            <span className="section-kicker">우리 팀 고르기</span>
            <h2>추천 카운터</h2>
          </div>
          <p>보유 기술을 꼭 확인하세요.</p>
        </div>
        <div className="counter-grid">
          {boss.counters.map((counter, index) => {
            const image = counterArtworkUrl(counter.name);
            return (
              <article className="counter-card" key={counter.name}>
                <span className="counter-rank">추천 {index + 1}</span>
                <PokemonThumbnail className="counter-art" image={image} name={counter.name} types={counterTypes(counter.name)} />
                <h3>{counter.name}</h3>
                <p>{counter.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <div className="strategy-note boss-strategy-note"><ShieldIcon/><div><strong>작전 메모</strong><p>{boss.tip}</p></div></div>

      <section className="detail-section sources-section boss-sources"><h2>정보 출처</h2><SourceList sources={getSources(boss.sourceIds)}/></section>
    </div>
  );
}
