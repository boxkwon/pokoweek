"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { events, schedule } from "../data/events";
import { bosses } from "../data/bosses";
import { dateKey, formatTime, WEEK_DAYS } from "../lib/format";
import { ChevronIcon, RaidHeadIcon } from "./icons";

const dates = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(`2026-11-${String(9 + index).padStart(2, "0")}T00:00:00+09:00`);
  return { key: dateKey(date.toISOString()), day: WEEK_DAYS[date.getDay()], date: 9 + index };
});

const kindName = { event: "이벤트", raid: "레이드", max: "맥스배틀", community: "커뮤니티" };

const typeIds: Record<string, number> = {
  노말: 1,
  격투: 2,
  비행: 3,
  독: 4,
  땅: 5,
  바위: 6,
  벌레: 7,
  고스트: 8,
  강철: 9,
  불꽃: 10,
  물: 11,
  풀: 12,
  전기: 13,
  에스퍼: 14,
  얼음: 15,
  드래곤: 16,
  악: 17,
  페어리: 18,
};

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

type PokemonPanelStyle = CSSProperties & {
  "--type-color": string;
  "--type-color-deep": string;
};

function pokemonPanelStyle(types: string[]): PokemonPanelStyle {
  const palette = typePalette[types[0]] ?? { color: "#8B83C5", deep: "#555083" };
  return {
    "--type-color": palette.color,
    "--type-color-deep": palette.deep,
  };
}

function kindLabel(kind: keyof typeof kindName, title: string) {
  if (kind === "raid" && title.includes("레이드아워")) return "레이드아워";
  return kindName[kind];
}

function TypeSymbols({ types }: { types: string[] }) {
  return (
    <div className="schedule-type-icons" aria-label={`추천 타입 ${types.join(", ")}`}>
      {types.map((type) => {
        const id = typeIds[type];
        return id ? (
          <span className="schedule-type-icon" title={`${type} 타입`} key={type}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/small/${id}.png`}
              alt=""
              aria-hidden="true"
            />
            <span className="sr-only">{type} 타입</span>
          </span>
        ) : null;
      })}
    </div>
  );
}

function RaidTierFaces({ tier }: { tier?: number }) {
  if (!tier) return null;
  return (
    <span className="raid-tier-faces" aria-label={`${tier}성 난이도`}>
      {Array.from({ length: tier }, (_, index) => <RaidHeadIcon key={index} />)}
    </span>
  );
}

export function ScheduleList({ initialDay = "all" }: { initialDay?: string }) {
  const [selected, setSelected] = useState(initialDay);
  const items = useMemo(
    () => selected === "all"
      ? schedule
      : schedule.filter((item) => dateKey(item.start) <= selected && dateKey(item.end) >= selected),
    [selected],
  );

  return (
    <>
      <div className="date-strip" role="tablist" aria-label="날짜 선택">
        <button
          className={`all-dates ${selected === "all" ? "active" : ""}`}
          role="tab"
          aria-selected={selected === "all"}
          onClick={() => setSelected("all")}
        >
          <span>전체 일정</span>
        </button>
        {dates.map((date) => (
          <button
            key={date.key}
            className={selected === date.key ? "active" : ""}
            role="tab"
            aria-selected={selected === date.key}
            onClick={() => setSelected(date.key)}
          >
            <span>{date.day}요일</span><b>{date.date}</b>
          </button>
        ))}
      </div>
      <div className="schedule-list">
        {items.length === 0 && <div className="empty-state">이날 등록된 주요 일정이 없어요.<small>공식 발표가 추가되면 업데이트됩니다.</small></div>}
        {items.map((item) => {
          const itemBosses = bosses.filter((boss) => item.bossSlugs?.includes(boss.slug));
          const linkedEvent = events.find((event) => event.slug === item.eventSlug);
          const displayTitle = item.kind === "raid" ? item.title.replace(/\s*레이드아워$/, "") : item.title;
          const visualBosses = itemBosses.length > 0
            ? itemBosses
            : bosses.filter((boss) => linkedEvent?.bossSlugs.includes(boss.slug)).slice(0, 3);
          const weaknesses = [...new Set(itemBosses.flatMap((boss) => boss.weaknesses))].slice(0, 4);
          const href = item.eventSlug ? `/events/${item.eventSlug}` : itemBosses[0] ? `/bosses/${itemBosses[0].slug}` : "/schedule";
          const label = item.label ?? kindLabel(item.kind, item.title);
          const raidTier = item.kind === "raid"
            ? itemBosses.some((boss) => boss.difficulty.startsWith("5성")) ? 5
              : itemBosses.some((boss) => boss.difficulty.startsWith("3성")) ? 3
                : undefined
            : undefined;
          return (
            <article className={`schedule-row ${item.kind}`} key={item.id}>
              <div className="schedule-visual">
                <div className={`schedule-pokemon count-${Math.min(visualBosses.length, 3)}`}>
                  {visualBosses.slice(0, 3).map((boss) => (
                    <Link
                      className="pokemon-poster-panel"
                      href={`/bosses/${boss.slug}`}
                      aria-label={`${boss.form ? `${boss.form} ` : ""}${boss.name} 공략 보기`}
                      key={boss.slug}
                      style={pokemonPanelStyle(boss.types)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="pokemon-poster-image" src={boss.sprite} alt="" />
                      <span className="pokemon-poster-name">{boss.name}</span>
                    </Link>
                  ))}
                </div>
                <span className="visual-label"><RaidTierFaces tier={raidTier} />{label}</span>
              </div>
              <Link className="schedule-content" href={href}>
                <div className="schedule-meta">
                  <time>{formatTime(item.start)}–{formatTime(item.end)}</time>
                  <span className={`schedule-kind ${item.kind}`}><RaidTierFaces tier={raidTier} />[{label}]</span>
                </div>
                <strong>{displayTitle}</strong>
                {weaknesses.length > 0 ? (
                  <div className="schedule-matchup">
                    <span>추천 공략 타입</span>
                    <TypeSymbols types={weaknesses} />
                  </div>
                ) : (
                  <p>{item.summary}</p>
                )}
              </Link>
              <Link className="schedule-action" href={href}>자세히 <ChevronIcon /></Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
