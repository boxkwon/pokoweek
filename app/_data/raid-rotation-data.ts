import type { PokemonImage } from "../_lib/pokemon-artwork";
import {
  pokemon,
  type PokemonEntry,
  type PokemonType,
  type RaidKind,
  type RaidTier,
  type WeekEvent,
} from "./guide-data";

const PLACEHOLDER: PokemonImage = {
  src: "/images/backgrounds/pokemon-placeholder.svg",
  scale: .82,
  objectPosition: "50% 50%",
  placeholder: true,
};

function raidPokemon(
  id: string,
  name: string,
  types: readonly PokemonType[],
  image: PokemonImage = PLACEHOLDER,
): PokemonEntry {
  return { id, name, types, image, href: `/pokemon/${id}` };
}

export const raidRotationPokemon = {
  shadowTornadus: raidPokemon("shadow-tornadus-incarnate", "그림자 토네로스 화신폼", ["비행"], { src: "/images/pokemon/pokemon_icon_641_11.png", scale: 1, objectPosition: "50% 54%" }),
  alolanMarowak: raidPokemon("alolan-marowak", "알로라 텅구리", ["불꽃", "고스트"]),
  liepard: raidPokemon("liepard", "레파르다스", ["악"]),
  golurk: raidPokemon("golurk", "골루그", ["땅", "고스트"]),
  alolanMeowth: raidPokemon("alolan-meowth", "알로라 나옹", ["악"]),
  misdreavus: raidPokemon("misdreavus", "무우마", ["고스트"]),
  galarianYamask: raidPokemon("galarian-yamask", "가라르 데스마스", ["땅", "고스트"]),
  sandygast: raidPokemon("sandygast", "모래꿍", ["고스트", "땅"]),
  shadowPrinplup: raidPokemon("shadow-prinplup", "그림자 팽도리", ["물"]),
  shadowPiloswine: raidPokemon("shadow-piloswine", "그림자 메꾸리", ["얼음", "땅"]),
  shadowPoliwhirl: raidPokemon("shadow-poliwhirl", "그림자 슈륙챙이", ["물"]),
  shadowLarvitar: raidPokemon("shadow-larvitar", "그림자 애버라스", ["바위", "땅"]),
  shadowMudkip: raidPokemon("shadow-mudkip", "그림자 물짱이", ["물"]),
  shadowMakuhita: raidPokemon("shadow-makuhita", "그림자 마크탕", ["격투"]),
  shadowCranidos: raidPokemon("shadow-cranidos", "그림자 두개도스", ["바위"]),
  deoxysNormal: raidPokemon("deoxys-normal", "테오키스 노말폼", ["에스퍼"]),
  deoxysAttack: raidPokemon("deoxys-attack", "테오키스 어택폼", ["에스퍼"], { src: "/images/pokemon/pokemon_icon_386_11.png", scale: 1, objectPosition: "50% 54%" }),
  deoxysDefense: raidPokemon("deoxys-defense", "테오키스 디펜스폼", ["에스퍼"], { src: "/images/pokemon/pokemon_icon_386_12.png", scale: 1, objectPosition: "50% 54%" }),
  deoxysSpeed: raidPokemon("deoxys-speed", "테오키스 스피드폼", ["에스퍼"], { src: "/images/pokemon/pokemon_icon_386_13.png", scale: 1, objectPosition: "50% 54%" }),
  megaMetagross: raidPokemon("mega-metagross", "메가메타그로스", ["강철", "에스퍼"], { src: "/images/pokemon/pm376.fMEGA.icon.png", scale: 1, objectPosition: "50% 54%" }),
  sunCrownPikachu: raidPokemon("pikachu-sun-crown", "태양 왕관 피카츄", ["전기"]),
  moonCrownPikachu: raidPokemon("pikachu-moon-crown", "달 왕관 피카츄", ["전기"]),
  sunScarfEspeon: raidPokemon("espeon-sun-scarf", "태양 스카프 에브이", ["에스퍼"]),
  moonScarfUmbreon: raidPokemon("umbreon-moon-scarf", "달 스카프 블래키", ["악"]),
  megaBeedrill: raidPokemon("mega-beedrill", "메가독침붕", ["벌레", "독"]),
  megaHoundoom: raidPokemon("mega-houndoom", "메가헬가", ["악", "불꽃"]),
  megaSableye: raidPokemon("mega-sableye", "메가깜까미", ["악", "고스트"], { src: "/images/pokemon/pokemon_icon_302_51.png", scale: 1, objectPosition: "50% 54%" }),
  megaManectric: raidPokemon("mega-manectric", "메가썬더볼트", ["전기"], { src: "/images/pokemon/pokemon_icon_310_51.png", scale: 1, objectPosition: "50% 54%" }),
  superMegaClefable: raidPokemon("super-mega-clefable", "슈퍼 메가픽시", ["페어리"]),
} satisfies Record<string, PokemonEntry>;

const sources = {
  intoTheWild: { name: "Pokémon GO · Into the Wild", url: "https://pokemongo.com/news/into-the-wild-2026" },
  wildArea: { name: "Pokémon GO · Wild Area Global", url: "https://pokemongo.com/gowildarea/global" },
  currentHub: { name: "Pokémon GO Hub · Current GO Raids", url: "https://pokemongohub.net/post/guide/current-go-raids/" },
  currentLeekDuck: { name: "Leek Duck · Current Raid Bosses", url: "https://leekduck.com/boss/" },
  twilight: { name: "Pokémon GO · Twilight Wishes", url: "https://pokemongo.com/news/twilight-wishes-2026" },
  deoxys: { name: "Leek Duck · Deoxys Raid Rotation", url: "https://leekduck.com/events/deoxys-normal-defense-attack-speed-formes-in-5-star-raid-battles-november-2026/" },
  megaMetagross: { name: "Leek Duck · Mega Metagross Rotation", url: "https://leekduck.com/events/mega-metagross-in-mega-raids-november-2026/" },
  deoxysHour: { name: "Leek Duck · Deoxys Raid Hour", url: "https://leekduck.com/events/raidhour20261125/" },
  superMegaClefable: { name: "Pokémon GO · Super Mega Clefable Raid Day", url: "https://pokemongo.com/en/news/clefable-super-mega-raid-day-2026" },
} as const;

type RotationInput = {
  id: string;
  title: string;
  pokemon: readonly PokemonEntry[];
  startAt: string;
  endAt: string;
  raidTier: RaidTier;
  raidKind: RaidKind;
  category?: WeekEvent["category"];
  categoryLabel: string;
  eventId?: string;
  status?: NonNullable<WeekEvent["verification"]>["status"];
  sourceList: NonNullable<WeekEvent["verification"]>["sources"];
  note?: string;
  featuredHour?: string;
};

function dayLabel(dateKey: string) {
  const value = new Date(`${dateKey}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" }).format(value);
  return `${weekday} ${value.getUTCDate()}`;
}

function rotationEvent(input: RotationInput): WeekEvent {
  const date = input.startAt.slice(0, 10);
  const isSingleDate = date === input.endAt.slice(0, 10);
  return {
    id: input.id,
    scheduleType: input.featuredHour ? "featuredHour" : isSingleDate ? "single" : "range",
    date,
    dayLabel: dayLabel(date),
    startAt: input.startAt,
    endAt: input.endAt,
    availabilityTime: `${input.startAt.slice(5, 10).replace("-", "/")} ${input.startAt.slice(11, 16)} ~ ${input.endAt.slice(5, 10).replace("-", "/")} ${input.endAt.slice(11, 16)}`,
    featuredHour: input.featuredHour,
    title: input.title,
    category: input.category ?? (input.raidKind === "mega" ? "mega" : input.raidKind === "shadow" ? "shadow" : "legendary"),
    categoryLabel: input.categoryLabel,
    raidTier: input.raidTier,
    raidKind: input.raidKind,
    raidEventId: input.eventId,
    raidRegion: "global",
    verification: {
      status: input.status ?? "corroborated",
      checkedAt: "2026-11-20T12:00:00+09:00",
      sources: input.sourceList,
      note: input.note,
    },
    priority: input.raidTier === 5 || input.raidTier === "superMega" ? 4 : 3,
    reason: input.status === "needs_review" ? "출처 간 종료 시각 추가 확인 필요" : "확인된 레이드 보스 로테이션",
    pokemon: input.pokemon,
    guidePokemonIds: input.pokemon.map((item) => item.id),
  };
}

const regularLowerRotation = {
  startAt: "2026-11-16T06:00:00+09:00",
  endAt: "2026-11-24T10:00:00+09:00",
  status: "corroborated" as const,
  sourceList: [sources.currentHub, sources.currentLeekDuck],
};

const shadowLowerRotation = {
  startAt: "2026-11-16T06:00:00+09:00",
  endAt: "2026-11-29T23:59:00+09:00",
  status: "corroborated" as const,
  sourceList: [sources.currentHub, sources.currentLeekDuck],
  note: "11월 20일 두 보조 출처에서 현재 보스로 교차 확인. 정확한 월말 교체 시각은 공식 공지에서 별도 제공되지 않음.",
};

export const raidCoverageEvents = [
  rotationEvent({ id: "shadow-tornadus-weekend-2026-11-14", title: "그림자 토네로스 화신폼", pokemon: [raidRotationPokemon.shadowTornadus], startAt: "2026-11-14T00:00:00+09:00", endAt: "2026-11-15T23:59:00+09:00", raidTier: 5, raidKind: "shadow", categoryLabel: "그림자 5성", sourceList: [sources.currentHub, sources.currentLeekDuck] }),
  rotationEvent({ id: "regular-three-star-2026-11-16", title: "알로라 텅구리 · 레파르다스 · 골루그", pokemon: [raidRotationPokemon.alolanMarowak, raidRotationPokemon.liepard, raidRotationPokemon.golurk], raidTier: 3, raidKind: "normal", categoryLabel: "3성 레이드", ...regularLowerRotation }),
  rotationEvent({ id: "regular-one-star-2026-11-16", title: "알로라 나옹 · 무우마 · 가라르 데스마스 · 모래꿍", pokemon: [raidRotationPokemon.alolanMeowth, raidRotationPokemon.misdreavus, raidRotationPokemon.galarianYamask, raidRotationPokemon.sandygast], raidTier: 1, raidKind: "normal", categoryLabel: "1성 레이드", ...regularLowerRotation }),
  rotationEvent({ id: "shadow-three-star-2026-11", title: "그림자 팽도리 · 메꾸리 · 슈륙챙이", pokemon: [raidRotationPokemon.shadowPrinplup, raidRotationPokemon.shadowPiloswine, raidRotationPokemon.shadowPoliwhirl], raidTier: 3, raidKind: "shadow", categoryLabel: "그림자 3성", ...shadowLowerRotation }),
  rotationEvent({ id: "shadow-one-star-2026-11", title: "그림자 애버라스 · 물짱이 · 마크탕 · 두개도스", pokemon: [raidRotationPokemon.shadowLarvitar, raidRotationPokemon.shadowMudkip, raidRotationPokemon.shadowMakuhita, raidRotationPokemon.shadowCranidos], raidTier: 1, raidKind: "shadow", categoryLabel: "그림자 1성", ...shadowLowerRotation }),
  rotationEvent({ id: "shadow-tornadus-weekend-2026-11-21", title: "그림자 토네로스 화신폼", pokemon: [raidRotationPokemon.shadowTornadus], startAt: "2026-11-21T00:00:00+09:00", endAt: "2026-11-22T23:59:00+09:00", raidTier: 5, raidKind: "shadow", categoryLabel: "그림자 5성", sourceList: [sources.currentHub, sources.currentLeekDuck] }),
  rotationEvent({ id: "shadow-tornadus-weekend-2026-11-28", title: "그림자 토네로스 화신폼", pokemon: [raidRotationPokemon.shadowTornadus], startAt: "2026-11-28T00:00:00+09:00", endAt: "2026-11-29T23:59:00+09:00", raidTier: 5, raidKind: "shadow", categoryLabel: "그림자 5성", sourceList: [sources.currentHub, sources.currentLeekDuck] }),
  rotationEvent({ id: "twilight-one-star-2026", title: "태양 왕관 피카츄 · 달 왕관 피카츄", pokemon: [raidRotationPokemon.sunCrownPikachu, raidRotationPokemon.moonCrownPikachu], startAt: "2026-11-24T10:00:00+09:00", endAt: "2026-11-30T20:00:00+09:00", raidTier: 1, raidKind: "special", categoryLabel: "이벤트 1성", eventId: "twilight-wishes-2026", status: "verified", sourceList: [sources.twilight] }),
  rotationEvent({ id: "twilight-three-star-2026", title: "태양 스카프 에브이 · 달 스카프 블래키", pokemon: [raidRotationPokemon.sunScarfEspeon, raidRotationPokemon.moonScarfUmbreon], startAt: "2026-11-24T10:00:00+09:00", endAt: "2026-11-30T20:00:00+09:00", raidTier: 3, raidKind: "special", categoryLabel: "이벤트 3성", eventId: "twilight-wishes-2026", status: "verified", sourceList: [sources.twilight] }),
  rotationEvent({ id: "twilight-mega-rotation-2026", title: "메가독침붕 · 메가헬가 · 메가깜까미 · 메가썬더볼트", pokemon: [raidRotationPokemon.megaBeedrill, raidRotationPokemon.megaHoundoom, raidRotationPokemon.megaSableye, raidRotationPokemon.megaManectric], startAt: "2026-11-24T10:00:00+09:00", endAt: "2026-11-30T20:00:00+09:00", raidTier: "mega", raidKind: "mega", categoryLabel: "이벤트 메가", eventId: "twilight-wishes-2026", status: "verified", sourceList: [sources.twilight] }),
  rotationEvent({ id: "deoxys-five-star-2026-11-25", title: "테오키스 4개 폼", pokemon: [raidRotationPokemon.deoxysNormal, raidRotationPokemon.deoxysAttack, raidRotationPokemon.deoxysDefense, raidRotationPokemon.deoxysSpeed], startAt: "2026-11-25T06:00:00+09:00", endAt: "2026-12-01T22:00:00+09:00", raidTier: 5, raidKind: "normal", categoryLabel: "5성 레이드", sourceList: [sources.deoxys] }),
  rotationEvent({ id: "deoxys-raid-hour-2026-11-25", title: "테오키스 레이드아워", pokemon: [raidRotationPokemon.deoxysNormal, raidRotationPokemon.deoxysAttack, raidRotationPokemon.deoxysDefense, raidRotationPokemon.deoxysSpeed], startAt: "2026-11-25T18:00:00+09:00", endAt: "2026-11-25T19:00:00+09:00", featuredHour: "18:00 ~ 19:00", raidTier: 5, raidKind: "normal", categoryLabel: "5성 레이드", sourceList: [sources.deoxysHour] }),
  rotationEvent({ id: "mega-metagross-rotation-2026-11-25", title: "메가메타그로스", pokemon: [raidRotationPokemon.megaMetagross], startAt: "2026-11-25T06:00:00+09:00", endAt: "2026-12-01T22:00:00+09:00", raidTier: "mega", raidKind: "mega", categoryLabel: "메가 레이드", sourceList: [sources.megaMetagross] }),
  rotationEvent({ id: "super-mega-clefable-raid-day-2026", title: "슈퍼 메가픽시", pokemon: [raidRotationPokemon.superMegaClefable], startAt: "2026-11-28T14:00:00+09:00", endAt: "2026-11-28T17:00:00+09:00", raidTier: "superMega", raidKind: "special", category: "mega", categoryLabel: "슈퍼 메가 레이드", eventId: "super-mega-clefable-raid-day-2026", status: "verified", sourceList: [sources.superMegaClefable] }),
] satisfies readonly WeekEvent[];

const existingRaidMetadata: Record<string, Pick<WeekEvent, "raidKind" | "raidEventId" | "raidRegion" | "verification">> = {
  "weekday-five-star": { raidKind: "normal", raidEventId: "into-the-wild-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.intoTheWild] } },
  "weekday-three-star": { raidKind: "normal", raidEventId: "into-the-wild-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.intoTheWild] } },
  "zacian-raid-hour": { raidKind: "normal", raidEventId: "into-the-wild-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.intoTheWild] } },
  "zamazenta-raid-hour": { raidKind: "normal", raidEventId: "into-the-wild-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.intoTheWild] } },
  "wild-sat-raids": { raidKind: "special", raidEventId: "go-wild-area-global-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.wildArea] } },
  "weekend-three-star": { raidKind: "special", raidEventId: "go-wild-area-global-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.wildArea] } },
  "wild-sun-raids": { raidKind: "special", raidEventId: "go-wild-area-global-2026", raidRegion: "global", verification: { status: "verified", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.wildArea] } },
  "cresselia-darkrai-five-star-2026": { raidKind: "normal", raidRegion: "global", verification: { status: "corroborated", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.currentHub, sources.currentLeekDuck], note: "출처별 종료 시각 표기가 달라 기존 일정의 11/24 22:00을 유지함." } },
  "cresselia-darkrai-raid-hour-2026": { raidKind: "normal", raidRegion: "global", verification: { status: "corroborated", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.currentHub, sources.currentLeekDuck] } },
  "mega-banette-rotation-2026": { raidKind: "mega", raidRegion: "global", verification: { status: "corroborated", checkedAt: "2026-11-20T12:00:00+09:00", sources: [sources.currentHub, sources.currentLeekDuck], note: "출처별 종료 시각 표기가 달라 기존 일정의 11/24 22:00을 유지함." } },
};

export function enrichRaidEvent(event: WeekEvent): WeekEvent {
  const metadata = existingRaidMetadata[event.id];
  if (!metadata) return event;
  if (event.id === "weekend-three-star") {
    return { ...event, ...metadata, pokemon: [pokemon.modernJacketMachamp], guidePokemonIds: [pokemon.modernJacketMachamp.id] };
  }
  return { ...event, ...metadata };
}

export function isRaidRotationEvent(event: WeekEvent) {
  return typeof event.raidTier !== "undefined";
}
