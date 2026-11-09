import { notFound } from "next/navigation";
import Link from "next/link";
import { bosses, getBoss } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { ArrowLeftIcon, ShieldIcon } from "../../components/icons";
import { SourceList } from "../../components/source-list";

export function generateStaticParams() { return bosses.map((boss) => ({ slug: boss.slug })); }

export default async function BossDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boss = getBoss(slug);
  if (!boss) notFound();
  return (
    <div className="page-shell detail-page boss-detail">
      <Link href="/schedule" className="back-link"><ArrowLeftIcon/>일정으로 돌아가기</Link>
      <section className="boss-hero">
        <div className="boss-hero-art">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={boss.sprite} alt={`${boss.form ?? ""} ${boss.name}`}/></div>
        <span className="battle-pill">{boss.battleType}</span>
        <h1>{boss.form && <small>{boss.form}</small>}{boss.name}</h1>
        <div className="type-row large">{boss.types.map((type) => <span className={`type type-${type}`} key={type}>{type}</span>)}</div>
        <p>{boss.difficulty}</p>
      </section>

      <section className="weakness-card">
        <span>공략 약점</span>
        <div>{boss.weaknesses.map((weakness) => <strong className={`weakness type-${weakness}`} key={weakness}>{weakness}</strong>)}</div>
      </section>

      <section className="detail-section">
        <h2>추천 카운터</h2>
        <p className="section-description">가족이 준비하기 쉬운 대표 조합이에요. 보유 기술을 꼭 확인하세요.</p>
        <div className="counter-list">{boss.counters.map((counter, index) => <div key={counter.name}><span className="counter-rank">{index + 1}</span><span className="counter-ball"/><p><strong>{counter.name}</strong><small>{counter.note}</small></p></div>)}</div>
      </section>

      <div className="strategy-note"><ShieldIcon/><div><strong>작전 메모</strong><p>{boss.tip}</p></div></div>

      <section className="detail-section sources-section"><h2>정보 출처</h2><SourceList sources={getSources(boss.sourceIds)}/></section>
    </div>
  );
}
