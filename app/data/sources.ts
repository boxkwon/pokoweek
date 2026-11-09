import { DataSource } from "./types";

export const UPDATED_AT = "2026-11-09T09:30:00+09:00";

export const sources: DataSource[] = [
  {
    id: "official-into-wild",
    name: "Pokémon GO 공식 — Into the Wild",
    kind: "official",
    url: "https://pokemongo.com/news/into-the-wild-2026",
    checkedAt: UPDATED_AT,
  },
  {
    id: "official-wild-area",
    name: "Pokémon GO 공식 — GO Wild Area: 글로벌",
    kind: "official",
    url: "https://pokemongo.com/gowildarea/global",
    checkedAt: UPDATED_AT,
  },
  {
    id: "official-dynamax-trails",
    name: "Pokémon GO 공식 — Dynamax Trails",
    kind: "official",
    url: "https://pokemongo.com/news/dynamax-trails-eternamax-eternatus-2026",
    checkedAt: UPDATED_AT,
  },
  {
    id: "gohub-november",
    name: "Pokémon GO Hub — 2026년 11월 일정",
    kind: "community",
    url: "https://pokemongohub.net/post/event/pokemon-go-november-2026-events/",
    checkedAt: UPDATED_AT,
  },
  {
    id: "leekduck-events",
    name: "Leek Duck — 이벤트 캘린더",
    kind: "community",
    url: "https://leekduck.com/events/",
    checkedAt: UPDATED_AT,
  },
];

export const getSources = (ids: string[]) => sources.filter((source) => ids.includes(source.id));
