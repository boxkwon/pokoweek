"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { events, schedule } from "../data/events";
import { bosses } from "../data/bosses";
import { dateKey, formatTime, WEEK_DAYS } from "../lib/format";
import { ChevronIcon } from "./icons";
import { PokemonThumbnail } from "./pokemon-thumbnail";
import { TypeIcons } from "./type-icons";
import { BattleBadge } from "./battle-badge";

const dates = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(`2026-11-${String(9 + index).padStart(2, "0")}T00:00:00+09:00`);
  return { key: dateKey(date.toISOString()), day: WEEK_DAYS[date.getDay()], date: 9 + index };
});

const kindName = { event: "이벤트", raid: "레이드", max: "맥스배틀", community: "커뮤니티" };

function kindLabel(kind: keyof typeof kindName, title: string) {
  if (kind === "raid" && title.includes("레이드아워")) return "레이드아워";
  return kindName[kind];
}

function TypeSymbols({ types }: { types: string[] }) {
  return <TypeIcons types={types} size="medium" label="추천 타입" />;
}

export function ScheduleList({
  initialDay = "all",
  allowedKinds,
  showDateStrip = true,
}: {
  initialDay?: string;
  allowedKinds?: Array<"event" | "raid" | "max" | "community">;
  showDateStrip?: boolean;
}) {
  const [selected, setSelected] = useState(initialDay);
  const items = useMemo(
    () => selected === "all"
      ? schedule.filter((item) => !allowedKinds || allowedKinds.includes(item.kind))
      : schedule.filter((item) => (!allowedKinds || allowedKinds.includes(item.kind)) && dateKey(item.start) <= selected && dateKey(item.end) >= selected),
    [allowedKinds, selected],
  );

  return (
    <>
      {showDateStrip && <div className="date-strip" role="tablist" aria-label="날짜 선택">
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
      </div>}
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
          const href = item.eventSlug ? `/events/${item.eventSlug}` : itemBosses[0] ? `/bosses/${itemBosses[0].slug}` : "/raids";
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
                    <PokemonThumbnail
                      className="schedule-pokemon-thumbnail"
                      href={`/bosses/${boss.slug}`}
                      image={boss.sprite}
                      name={boss.form ? `${boss.form} ${boss.name}` : boss.name}
                      types={boss.types}
                      key={boss.slug}
                    />
                  ))}
                </div>
                <span className="visual-label"><BattleBadge tone={item.kind === "raid" ? "raid" : item.kind === "max" ? "max" : "event"} tier={raidTier} label={label} /></span>
              </div>
              <div className="schedule-content">
                <Link className="schedule-content-main" href={href}>
                  <div className="schedule-meta">
                    <time>{formatTime(item.start)}–{formatTime(item.end)}</time>
                    <BattleBadge tone={item.kind === "raid" ? "raid" : item.kind === "max" ? "max" : "event"} tier={raidTier} label={label} />
                  </div>
                  <strong>{displayTitle}</strong>
                  {weaknesses.length === 0 && <p>{item.summary}</p>}
                </Link>
                {weaknesses.length > 0 ? (
                  <div className="schedule-matchup">
                    <span>추천 공략 타입</span>
                    <TypeSymbols types={weaknesses} />
                  </div>
                ) : null}
              </div>
              <Link className="schedule-action" href={href}>자세히 <ChevronIcon /></Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
