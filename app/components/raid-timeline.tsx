import Link from "next/link";
import type { CSSProperties } from "react";
import { bosses } from "../data/bosses";
import { schedule } from "../data/events";
import { monthlyEvents, type MonthlyEvent } from "../data/monthly";
import { getPokemonTypes } from "../data/pokemon-types";
import { getTypePalette } from "../lib/pokemon";
import { ClockIcon } from "./icons";
import { BattleBadge } from "./battle-badge";
import { EventHeroImage, PokemonArtwork } from "./image-assets";

const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

type TimelinePokemon = { name: string; image: string; types: string[] };
type TimelineItem = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  kind: "raid" | "max";
  tier?: number;
  pokemon: TimelinePokemon[];
  banner?: string | null;
  href: string;
  lane?: number;
  startIndex?: number;
  endIndex?: number;
};

type TimelineBarStyle = CSSProperties & {
  "--timeline-color": string;
  "--timeline-color-deep": string;
};

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function weekMonday(value: string, weekOffset: 0 | 1) {
  const date = parseDateKey(value);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return addDays(value, (weekOffset * 7) - daysSinceMonday);
}

function dayIndex(weekStart: string, date: string) {
  return Math.round((parseDateKey(date).getTime() - parseDateKey(weekStart).getTime()) / 86400000);
}

function isRaidEvent(event: MonthlyEvent) {
  return event.category === "Raid Battles"
    || event.category === "Raid Hour"
    || event.category === "Raid Day"
    || event.category === "Max Battles";
}

function currentWeekItems(): TimelineItem[] {
  return schedule.filter((item) => item.kind === "raid" || item.kind === "max").map((item) => {
    const itemBosses = bosses.filter((boss) => item.bossSlugs?.includes(boss.slug));
    const tier = itemBosses.some((boss) => boss.difficulty.startsWith("5성")) ? 5
      : itemBosses.some((boss) => boss.difficulty.startsWith("3성")) ? 3
        : undefined;
    const href = item.eventSlug ? `/events/${item.eventSlug}` : itemBosses[0] ? `/bosses/${itemBosses[0].slug}` : "/raids";
    return {
      id: item.id,
      label: item.label ?? item.title,
      startDate: item.start.slice(0, 10),
      endDate: item.end.slice(0, 10),
      kind: item.kind === "max" ? "max" : "raid",
      tier,
      pokemon: itemBosses.map((boss) => ({
        name: boss.form ? `${boss.form} ${boss.name}` : boss.name,
        image: boss.sprite ?? "",
        types: boss.types,
      })),
      href,
    };
  });
}

function nextWeekItems(): TimelineItem[] {
  return monthlyEvents.filter(isRaidEvent).map((event) => ({
    id: event.id,
    label: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    kind: event.category === "Max Battles" ? "max" : "raid",
    tier: event.title.includes("5성") || event.category === "Raid Hour" ? 5 : undefined,
    pokemon: event.pokemon.map((pokemon) => ({ ...pokemon, types: getPokemonTypes(pokemon.name) })),
    banner: event.image,
    href: event.internalHref || `/calendar-events/${event.slug}`,
  }));
}

function placeInLanes(items: TimelineItem[], weekStart: string, weekEnd: string) {
  const visible = items
    .filter((item) => item.startDate <= weekEnd && item.endDate >= weekStart)
    .map((item) => ({
      ...item,
      startIndex: Math.max(0, dayIndex(weekStart, item.startDate)),
      endIndex: Math.min(6, dayIndex(weekStart, item.endDate)),
    }))
    .sort((a, b) => (a.startIndex - b.startIndex) || ((b.endIndex - b.startIndex) - (a.endIndex - a.startIndex)));
  const lanes: boolean[][] = [];
  return visible.map((item) => {
    let lane = lanes.findIndex((occupied) => {
      for (let day = item.startIndex; day <= item.endIndex; day += 1) if (occupied[day]) return false;
      return true;
    });
    if (lane < 0) {
      lane = lanes.length;
      lanes.push(Array(7).fill(false));
    }
    for (let day = item.startIndex; day <= item.endIndex; day += 1) lanes[lane][day] = true;
    return { ...item, lane };
  });
}

export function RaidTimeline({ initialDate, weekOffset }: { initialDate: string; weekOffset: 0 | 1 }) {
  const weekStart = weekMonday(initialDate, weekOffset);
  const weekEnd = addDays(weekStart, 6);
  const dates = weekDays.map((day, index) => {
    const key = addDays(weekStart, index);
    return { day, date: Number(key.slice(8, 10)), key };
  });
  const items = placeInLanes(weekOffset === 0 ? currentWeekItems() : nextWeekItems(), weekStart, weekEnd);
  const laneCount = Math.max(1, ...items.map((item) => (item.lane ?? 0) + 1));

  return (
    <section className="raid-timeline-section" aria-label={`${weekOffset === 0 ? "이번 주" : "다음 주"} 레이드 타임라인`}>
      <div className="raid-timeline-heading">
        <div><span>주간 타임라인</span><h2>{weekStart.slice(5).replace("-", "/")}–{weekEnd.slice(5).replace("-", "/")}</h2></div>
        <p><span>↔</span> 좌우로 밀어보세요</p>
      </div>
      <div className="raid-timeline-scroll">
        <div className="raid-timeline-grid" style={{ gridTemplateRows: `62px repeat(${laneCount}, 76px)` }}>
          {dates.map((date, index) => (
            <div className={`raid-timeline-day ${index > 4 ? "weekend" : ""}`} style={{ gridColumn: index + 1, gridRow: 1 }} key={date.key}>
              <b>{date.date}</b><span>{date.day}</span>
            </div>
          ))}
          {items.map((item) => {
            const palette = getTypePalette(item.pokemon[0]?.types[0] ?? (item.kind === "max" ? "전기" : "불꽃"));
            const style: TimelineBarStyle = { "--timeline-color": palette.color, "--timeline-color-deep": palette.deep };
            const span = (item.endIndex ?? 0) - (item.startIndex ?? 0) + 1;
            return (
              <Link
                className={`raid-timeline-bar ${item.kind}`}
                href={item.href}
                aria-label={`${item.label}, ${item.startDate}부터 ${item.endDate}까지`}
                title={item.label}
                style={{ ...style, gridColumn: `${(item.startIndex ?? 0) + 1} / span ${span}`, gridRow: (item.lane ?? 0) + 2 }}
                key={item.id}
              >
                <span className="raid-timeline-kind">
                  <BattleBadge tone={item.kind} tier={item.tier} label={item.kind === "max" ? "맥스배틀" : "레이드"} compact />
                </span>
                {item.pokemon.length > 0 ? (
                  <span className={`raid-timeline-pokemon count-${Math.min(item.pokemon.length, 4)}`}>
                    {item.pokemon.slice(0, 4).map((pokemon) => (
                      <span key={`${item.id}-${pokemon.name}`}>
                        <PokemonArtwork src={pokemon.image} alt={pokemon.name} size="small" />
                        <span className="sr-only">{pokemon.name}</span>
                      </span>
                    ))}
                  </span>
                ) : item.banner ? (
                  <EventHeroImage src={item.banner} alt="" className="raid-timeline-banner" />
                ) : <ClockIcon className="raid-timeline-placeholder" />}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
