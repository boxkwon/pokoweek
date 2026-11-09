import { notFound } from "next/navigation";
import Link from "next/link";
import { events, getEvent } from "../../data/events";
import { bosses } from "../../data/bosses";
import { getSources } from "../../data/sources";
import { BossCard } from "../../components/boss-card";
import { SourceList } from "../../components/source-list";
import { ArrowLeftIcon, CheckIcon, ClockIcon } from "../../components/icons";
import { formatDateTime } from "../../lib/format";

export function generateStaticParams() { return events.map((event) => ({ slug: event.slug })); }

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  const eventBosses = bosses.filter((boss) => event.bossSlugs.includes(boss.slug));

  return (
    <div className="page-shell detail-page">
      <Link href="/schedule" className="back-link"><ArrowLeftIcon/>주간 일정</Link>
      <section className={`detail-hero ${event.color}`}>
        <span>{event.eyebrow}</span>
        <h1>{event.title}</h1>
        <p>{event.summary}</p>
        <div><ClockIcon/>{formatDateTime(event.start)}<br/>~ {formatDateTime(event.end)}</div>
      </section>

      <section className="detail-section">
        <h2>핵심만 보기</h2>
        <ul className="highlight-list">{event.highlights.map((item) => <li key={item}><CheckIcon/><span>{item}</span></li>)}</ul>
      </section>

      <section className="detail-section">
        <h2>가족 준비 체크리스트</h2>
        <div className="checklist">{event.checklist.map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p></div>)}</div>
      </section>

      <section className="detail-section">
        <h2>등장 보스와 공략</h2>
        <div className="boss-grid">{eventBosses.map((boss) => <BossCard boss={boss} key={boss.slug}/>)}</div>
      </section>

      <section className="detail-section sources-section"><h2>정보 출처</h2><SourceList sources={getSources(event.sourceIds)}/></section>
    </div>
  );
}
