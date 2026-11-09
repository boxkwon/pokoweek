import type { CSSProperties } from "react";
import Link from "next/link";
import { bosses } from "../data/bosses";
import { weeklyOverview } from "../data/weekly";

const typePalette: Record<string, { color: string; deep: string }> = {
  노말: { color: "#A8A77A", deep: "#77774F" },
  불꽃: { color: "#EE8130", deep: "#B94C16" },
  물: { color: "#6390F0", deep: "#315FBE" },
  전기: { color: "#F7D02C", deep: "#C59B05" },
  풀: { color: "#7AC74C", deep: "#478E25" },
  얼음: { color: "#96D9D6", deep: "#4FA5A2" },
  격투: { color: "#C22E28", deep: "#7F1915" },
  독: { color: "#A33EA1", deep: "#692268" },
  땅: { color: "#E2BF65", deep: "#A77D2A" },
  비행: { color: "#A98FF3", deep: "#6D50C0" },
  에스퍼: { color: "#F95587", deep: "#BA2050" },
  벌레: { color: "#A6B91A", deep: "#69780A" },
  바위: { color: "#B6A136", deep: "#78671A" },
  고스트: { color: "#735797", deep: "#45315F" },
  드래곤: { color: "#6F35FC", deep: "#3F18A9" },
  악: { color: "#705746", deep: "#443128" },
  강철: { color: "#A8A8C0", deep: "#66677F" },
  페어리: { color: "#D685AD", deep: "#9B4E76" },
};

type RosterStyle = CSSProperties & {
  "--roster-color": string;
  "--roster-color-deep": string;
};

function rosterStyle(type: string): RosterStyle {
  const palette = typePalette[type] ?? { color: "#8B83C5", deep: "#555083" };
  return { "--roster-color": palette.color, "--roster-color-deep": palette.deep };
}

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
                      style={rosterStyle(boss.types[0])}
                      key={boss.slug}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={boss.sprite} alt="" />
                      <span>{boss.form ? `${boss.form} ` : ""}{boss.name}</span>
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
