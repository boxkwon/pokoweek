import { ShieldIcon, InfoIcon } from "../components/icons";
import { RaidExplorer } from "../components/raid-explorer";
import { monthlyMeta } from "../data/monthly";
import { UPDATED_AT } from "../data/sources";
import { formatDateTime } from "../lib/format";

export const metadata = { title: "레이드" };

export default function RaidsPage() {
  const initialDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(monthlyMeta.fetchedAt));

  return (
    <div className="page-shell inner-page schedule-page">
      <section className="page-intro">
        <span className="section-kicker"><ShieldIcon />배틀 준비</span>
        <h1>레이드</h1>
        <p>레이드와 맥스배틀 보스를 한곳에서 준비하세요.</p>
        <small>5성 · 메가 · 그림자 · 레이드 아워 · 맥스배틀</small>
      </section>
      <RaidExplorer initialDate={initialDate} />
      <div className="info-card"><InfoIcon /><p>공식 뉴스와 공개 일정 피드를 함께 확인해요. 일정은 발표 후에도 바뀔 수 있습니다.<br /><span>일정 {formatDateTime(monthlyMeta.fetchedAt)} · 공략 {formatDateTime(UPDATED_AT)}</span></p></div>
    </div>
  );
}
