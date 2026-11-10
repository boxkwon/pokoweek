import { bosses } from "../../data/bosses";
import { schedule } from "../../data/events";
import { currentWeek } from "../../data/week";
import { PokemonAvatar } from "../../components/image-assets";
import { PreparationChecklist, RatingStars } from "../../components/ui";
import { TypeIcons } from "../../components/type-icons";
import { formatTime } from "../../lib/format";

export const metadata = { title: "주간 가이드 인쇄" };

export default function PrintWeekPage() {
  const priorityBosses = currentWeek.featuredBossSlugs.map((slug) => bosses.find((boss) => boss.slug === slug)).filter(Boolean) as typeof bosses;
  return (
    <div className="print-week-page">
      <header className="print-header"><div><b>GO WEEK</b><span>{currentWeek.eyebrow}</span></div><h1>{currentWeek.title}</h1><p>{currentWeek.summary}</p></header>

      <section className="print-priority">
        <h2>이번 주 TOP 추천</h2>
        <div>{currentWeek.priorities.map((item) => <article key={item.rank}><b>{item.rank}</b><strong>{item.title}</strong><span>{item.timeLabel}</span><p>{item.description}</p></article>)}</div>
      </section>

      <section className="print-bosses">
        <h2>주요 레이드</h2>
        <div>{priorityBosses.map((boss) => <article key={boss.slug}><PokemonAvatar src={boss.sprite} alt={boss.name} size="large" /><div><span>{boss.battleType}</span><h3>{boss.form} {boss.name}</h3><RatingStars value={5} /><TypeIcons types={boss.weaknesses.slice(0, 3)} size="small" label="약점" /></div></article>)}</div>
      </section>

      <section className="print-schedule">
        <h2>주간 일정</h2>
        <table><tbody>{schedule.map((item) => <tr key={item.id}><th>{item.start.slice(5, 10).replace("-", "/")}</th><td>{formatTime(item.start)}</td><td>{item.label ?? item.kind}</td><td>{item.title}</td></tr>)}</tbody></table>
      </section>

      <section className="print-preparation"><h2>준비 체크</h2><PreparationChecklist items={currentWeek.preparation} /></section>
      <footer>Pokémon GO 비공식 팬 가이드 · 한국시간 기준 · 게임 내 공지를 함께 확인하세요.</footer>
    </div>
  );
}
