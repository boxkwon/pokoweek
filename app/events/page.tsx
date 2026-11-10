import { CalendarIcon, InfoIcon } from "../components/icons";
import { EventExplorer } from "../components/event-explorer";
import { monthlyMeta } from "../data/monthly";
import { formatDateTime } from "../lib/format";

export const metadata = { title: "이벤트" };

export default function EventsPage() {
  const initialDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(monthlyMeta.fetchedAt));

  return (
    <div className="page-shell inner-page schedule-page">
      <section className="page-intro">
        <span className="section-kicker"><CalendarIcon />이번 주 소식</span>
        <h1>이벤트</h1>
        <p>레이드를 제외한 Pokémon GO 이벤트를 모아보세요.</p>
        <small>GO 패스 · 일반 이벤트 · 맥스 먼데이 · 스포트라이트 아워 · 커뮤니티 데이</small>
      </section>
      <EventExplorer initialDate={initialDate} />
      <div className="info-card"><InfoIcon /><p>새 일정이 공개되면 매주 자동으로 반영해요.<br /><span>마지막 확인 {formatDateTime(monthlyMeta.fetchedAt)}</span></p></div>
    </div>
  );
}
