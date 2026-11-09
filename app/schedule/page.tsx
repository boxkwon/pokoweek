import { UPDATED_AT } from "../data/sources";
import { CalendarIcon, InfoIcon } from "../components/icons";
import { formatDateTime } from "../lib/format";
import { ScheduleExplorer } from "../components/schedule-explorer";

export const metadata = { title: "주간 일정" };

export default function SchedulePage() {
  return (
    <div className="page-shell inner-page schedule-page">
      <section className="page-intro">
        <span className="section-kicker"><CalendarIcon/>주간 캘린더</span>
        <h1>11월 9일 – 15일</h1>
        <p>큰 그림을 보고, 오늘 만나고 싶은 포켓몬을 골라보세요.</p>
        <small>전국 공통 일정 · 모든 시간은 한국시간 기준</small>
      </section>
      <ScheduleExplorer />
      <div className="info-card"><InfoIcon/><p>공식 발표 후 일정이 바뀔 수 있어요.<br/><span>마지막 확인 {formatDateTime(UPDATED_AT)}</span></p></div>
    </div>
  );
}
