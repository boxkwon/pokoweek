import Link from "next/link";
import { bosses } from "../data/bosses";
import { weeklyOverview } from "../data/weekly";
import { PokemonThumbnail } from "./pokemon-thumbnail";

export function WeeklyOverview() {
  return (
    <section className="weekly-overview" aria-labelledby="weekly-overview-title">
      <div className="weekly-overview-heading">
        <div>
          <span>이번 주 한눈에</span>
          <h2 id="weekly-overview-title">어떤 배틀이 열리나요?</h2>
        </div>
        <p>공식 발표 기준 · 한국시간</p>
      </div>
      <div className="weekly-overview-grid">
        {weeklyOverview.map((group) => {
          const groupBosses = group.bossSlugs
            .map((slug) => bosses.find((boss) => boss.slug === slug))
            .filter((boss) => boss !== undefined);

          return (
            <article className={`weekly-overview-card ${group.tone} ${group.empty ? "empty" : ""}`} key={group.id}>
              <div className="weekly-overview-card-head">
                <strong>{group.title}</strong>
                <span>{group.period}</span>
              </div>
              {group.empty ? (
                <div className="weekly-empty-boss">
                  <b>공식 발표 없음</b>
                  <span>새 공지가 나오면 여기에 바로 표시해요.</span>
                </div>
              ) : (
                <div className={`weekly-roster count-${Math.min(groupBosses.length, 4)}`}>
                  {groupBosses.map((boss) => (
                    <Link
                      className="weekly-roster-item"
                      href={`/bosses/${boss.slug}`}
                      aria-label={`${boss.form ? `${boss.form} ` : ""}${boss.name} 공략 보기`}
                      key={boss.slug}
                    >
                      <PokemonThumbnail
                        image={boss.sprite}
                        name={boss.form ? `${boss.form} ${boss.name}` : boss.name}
                        types={boss.types}
                      />
                    </Link>
                  ))}
                </div>
              )}
              <p>{group.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
