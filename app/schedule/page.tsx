import { UPDATED_AT } from "../data/sources";
import { CalendarIcon, InfoIcon } from "../components/icons";
import { formatDateTime } from "../lib/format";
import { ScheduleExplorer } from "../components/schedule-explorer";
import { monthlyMeta } from "../data/monthly";

export const metadata = { title: "월간 일정" };

export default function SchedulePage() {
  const initialDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(monthlyMeta.fetchedAt));
  const monthTitle = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
  }).format(new Date(monthlyMeta.fetchedAt));

  return (
    <div className="page-shell inner-page schedule-page">
      <section className="page-intro">
        <span className="section-kicker"><CalendarIcon/>월간 캘린더</span>
        <h1>{monthTitle}</h1>
        <p>공개된 Pokémon GO 일정을 한 달 단위로 확인하세요.</p>
        <small>전국 공통 일정 · 한국시간 기준 · 매주 월요일 자동 확인</small>
      </section>
      <ScheduleExplorer initialDate={initialDate} />
      <div className="info-card"><InfoIcon/><p>공식 뉴스와 공개 일정 피드를 함께 확인해요. 일정은 발표 후에도 바뀔 수 있습니다.<br/><span>월간 데이터 마지막 확인 {formatDateTime(monthlyMeta.fetchedAt)} · 공략 데이터 {formatDateTime(UPDATED_AT)}</span></p></div>
    </div>
  );
}
