import Link from "next/link";
import { bosses } from "./data/bosses";
import { events } from "./data/events";
import { UPDATED_AT } from "./data/sources";
import { BossCard } from "./components/boss-card";
import { EventCard } from "./components/event-card";
import { BoltIcon, CalendarIcon, CheckIcon, ChevronIcon, InfoIcon } from "./components/icons";
import { formatDateTime } from "./lib/format";

const priorityBosses = ["dialga-dynamax", "palkia-dynamax", "duraludon-gigantamax"]
  .map((slug) => bosses.find((boss) => boss.slug === slug))
  .filter(Boolean) as typeof bosses;

export default function Home() {
  return (
    <div className="page-shell home-page">
      <section className="hero-card">
        <div className="hero-orb one"/><div className="hero-orb two"/>
        <div className="hero-content">
          <span className="hero-kicker">11월 9일 – 15일</span>
          <h1>이번 주엔<br/><em>강철과 드래곤!</em></h1>
          <p>평일엔 준비하고, 주말엔<br/>다이맥스 디아루가·펄기아를 노려요.</p>
          <Link href="/schedule" className="primary-button"><CalendarIcon/>이번 주 일정 보기<ChevronIcon/></Link>
        </div>
        <div className="hero-pokemon">
          {/* eslint-disable-next-line @next/next/no-img-element */}<img className="dialga" src={bosses.find((b) => b.slug === "dialga-dynamax")?.sprite} alt="다이맥스 디아루가"/>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img className="palkia" src={bosses.find((b) => b.slug === "palkia-dynamax")?.sprite} alt="다이맥스 펄기아"/>
        </div>
      </section>

      <div className="freshness"><span className="live-dot"/>전국 공통 · 한국시간 기준 <span>업데이트 {formatDateTime(UPDATED_AT)}</span></div>

      <section className="section-block" id="priority">
        <div className="section-heading">
          <div><span className="section-kicker"><BoltIcon/>가족 작전</span><h2>이번 주 우선순위</h2></div>
          <span className="priority-count">TOP 3</span>
        </div>
        <div className="priority-list">
          <div className="priority-item top"><span className="rank">1</span><div><strong>토요일 디아루가 먼저</strong><p>다음 주 무한다이노전까지 이어지는 핵심 전력</p></div><span className="day-label">토 10–18시</span></div>
          <div className="priority-item"><span className="rank">2</span><div><strong>일요일 펄기아 확보</strong><p>일요일에만 등장하니 하루를 놓치지 않기</p></div><span className="day-label">일 10–18시</span></div>
          <div className="priority-item"><span className="rank">3</span><div><strong>두랄루돈은 큰 그룹으로</strong><p>6성 거다이맥스, 가족끼리보다 현장 합류 추천</p></div><span className="day-label">주말 양일</span></div>
        </div>
        <div className="family-note"><InfoIcon/><p><strong>가족 한마디</strong> 토요일엔 몰드류, 일요일엔 망나뇽을 미리 회복해 두세요.</p></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="section-kicker">이번 주 큰 일정</span><h2>놓치면 아쉬워요</h2></div><Link href="/schedule" className="text-link">전체 보기<ChevronIcon/></Link></div>
        <div className="event-grid">{events.map((event) => <EventCard event={event} key={event.slug}/>)}</div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="section-kicker">미리 보는 공략</span><h2>주말 핵심 보스</h2></div></div>
        <div className="boss-grid">{priorityBosses.map((boss) => <BossCard boss={boss} key={boss.slug}/>)}</div>
      </section>

      <section className="next-week-card">
        <span><CheckIcon/>다음 주 예고</span>
        <h2>무한다이노가 돌아와요</h2>
        <p>11월 21일(토) 11:00–14:00<br/>이번 주 디아루가·펄기아를 준비해 두세요.</p>
        <a href="https://pokemongo.com/news/dynamax-trails-eternamax-eternatus-2026" target="_blank" rel="noreferrer">공식 공지 보기<ChevronIcon/></a>
      </section>
    </div>
  );
}
