import type { PokemonImage } from "../_components/pokemon-artwork";

export type CategoryColor = "legendary" | "mega" | "max" | "shadow" | "event" | "community";
export type RaidTier = 1 | 3 | 5 | "mega" | "shadow" | "superMega";
export type ScheduleFilter = "all" | "tier5" | "tier3" | "mega" | "max" | "shadow" | "event";
export type GuideCategory = "raid" | "mega" | "max" | "shadow";
export type ScheduleType = "single" | "range" | "featuredHour";
export type BattleType = "raid" | "mega" | "max" | "gigantamax" | "shadow";
export type PokemonType = "강철" | "드래곤" | "격투" | "땅" | "불꽃" | "물" | "얼음" | "전기" | "악" | "페어리" | "에스퍼" | "비행" | "독" | "고스트" | "벌레" | "바위" | "풀" | "노말";

export type PokemonEntry = {
  id: string;
  name: string;
  image: PokemonImage;
  types: readonly string[];
  href: string;
};

export type PokemonGuide = {
  id: string;
  name: string;
  formName?: string;
  image: PokemonImage & { alt: string };
  battleTypes: readonly BattleType[];
  types: readonly PokemonType[];
  category: GuideCategory;
  categoryLabel: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reason: string;
  weaknesses: readonly { type: PokemonType; multiplier?: number }[];
  counters: readonly {
    pokemonId: string;
    name: string;
    image?: PokemonImage;
    reason?: string;
    recommendedMove?: string;
  }[];
  values: {
    raid?: number | null;
    max?: number | null;
    pvp?: number | null;
  };
  valueReasons?: {
    raid?: string;
    max?: string;
    pvp?: string;
  };
  recommendations: readonly string[];
  summary: string;
  source?: { name: string; url: string };
};

export type PreparationTask = {
  id: string;
  title: string;
  type: "pokemon" | "resource" | "inventory";
  reason: string;
  targetPokemonId?: string;
  href?: string;
  priority: number;
  defaultDone?: boolean;
};

export type PreparationPokemon = {
  rank: number;
  pokemon: PokemonEntry;
  use: string;
  rating: number;
  status: string;
  reason: string;
};

export type PreparationResource = {
  id: string;
  title: string;
  goal: string;
};

export type PreparationPlan = {
  id: string;
  eventId: string;
  pokemon: readonly PreparationPokemon[];
  resources: readonly PreparationResource[];
  tasks: readonly PreparationTask[];
};

export type WeekEvent = {
  id: string;
  scheduleType: ScheduleType;
  date: string;
  dayLabel: string;
  startAt?: string;
  endAt?: string;
  availabilityTime?: string;
  featuredHour?: string;
  summaryTimeMode?: "start" | "end";
  title: string;
  category: CategoryColor;
  categoryLabel: string;
  raidTier?: RaidTier;
  rating: number;
  priority: number;
  reason: string;
  pokemon: readonly PokemonEntry[];
  guidePokemonIds: readonly string[];
  eventHref?: string;
  preparationPlanId?: string;
  weaknesses?: readonly string[];
};

export type WeekPriority = {
  rank: number;
  pokemon: PokemonEntry;
  rating: number;
  reason: string;
};

export type WeekGuide = {
  id: string;
  startDate: string;
  endDate: string;
  featuredEventId?: string;
  priorities: readonly WeekPriority[];
  preparations: readonly PreparationTask[];
  events: readonly WeekEvent[];
};

export const typeColors: Record<string, string> = {
  강철: "#3c91ac",
  드래곤: "#1765d5",
  격투: "#ef334f",
  땅: "#c97725",
  불꽃: "#ed713a",
  물: "#3697d9",
  얼음: "#61c9bc",
  전기: "#e2ba16",
  악: "#5b5863",
  페어리: "#d264b6",
  에스퍼: "#e95f80",
  비행: "#7299c6",
  독: "#9b55a5",
  고스트: "#5969a1",
  벌레: "#91a119",
  바위: "#a38c21",
  풀: "#49a05a",
  노말: "#92959a",
};

const guideHref = (id: string) => `/pokemon/${id}`;

export const pokemon = {
  zacian: { id: "zacian-crowned", name: "검왕 자시안", image: { src: "/images/pokemon/pm888.fCROWNED_SWORD.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["페어리", "강철"], href: guideHref("zacian-crowned") },
  zamazenta: { id: "zamazenta-crowned", name: "방패왕 자마젠타", image: { src: "/images/pokemon/pm889.fCROWNED_SHIELD.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["격투", "강철"], href: guideHref("zamazenta-crowned") },
  registeel: { id: "dynamax-registeel", name: "다이맥스 레지스틸", image: { src: "/images/pokemon/pm379.icon.png", scale: .96, objectPosition: "50% 56%" }, types: ["강철"], href: guideHref("dynamax-registeel") },
  regidrago: { id: "dynamax-regidrago", name: "다이맥스 레지드래고", image: { src: "/images/pokemon/pm895.icon.png", scale: .98, objectPosition: "50% 56%" }, types: ["드래곤"], href: guideHref("dynamax-regidrago") },
  latias: { id: "dynamax-latias", name: "다이맥스 라티아스", image: { src: "/images/pokemon/pm380.icon.png", scale: .98, objectPosition: "50% 56%" }, types: ["드래곤", "에스퍼"], href: guideHref("dynamax-latias") },
  latios: { id: "dynamax-latios", name: "다이맥스 라티오스", image: { src: "/images/pokemon/pm381.icon.png", scale: .98, objectPosition: "50% 56%" }, types: ["드래곤", "에스퍼"], href: guideHref("dynamax-latios") },
  zekrom: { id: "zekrom", name: "제크로무", image: { src: "/images/pokemon/pm644.icon.png", scale: 1.06, objectPosition: "50% 58%" }, types: ["전기", "드래곤"], href: guideHref("zekrom") },
  whiteKyurem: { id: "white-kyurem", name: "화이트큐레무", image: { src: "/images/pokemon/pm646.fWHITE.icon.png", scale: .94, objectPosition: "50% 56%" }, types: ["얼음", "드래곤"], href: guideHref("white-kyurem") },
  blackKyurem: { id: "black-kyurem", name: "블랙큐레무", image: { src: "/images/pokemon/pm646.fBLACK.icon.png", scale: .94, objectPosition: "50% 56%" }, types: ["얼음", "드래곤"], href: guideHref("black-kyurem") },
  dialga: { id: "dynamax-dialga", name: "다이맥스 디아루가", image: { src: "/images/pokemon/pm483.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["강철", "드래곤"], href: guideHref("dynamax-dialga") },
  palkia: { id: "dynamax-palkia", name: "다이맥스 펄기아", image: { src: "/images/pokemon/pm484.icon.png", scale: 1.02, objectPosition: "50% 57%" }, types: ["물", "드래곤"], href: guideHref("dynamax-palkia") },
  duraludon: { id: "gigantamax-duraludon", name: "거다이맥스 두랄루돈", image: { src: "/images/pokemon/pm884.icon.png", scale: .92, objectPosition: "50% 57%" }, types: ["드래곤", "강철"], href: guideHref("gigantamax-duraludon") },
  reshiram: { id: "reshiram", name: "레시라무", image: { src: "/images/pokemon/pm643.icon.png", scale: .96, objectPosition: "50% 57%" }, types: ["불꽃", "드래곤"], href: guideHref("reshiram") },
  machamp: { id: "dynamax-machamp", name: "다이맥스 괴력몬", image: { src: "/images/pokemon/pm68.icon.png", scale: 1.02, objectPosition: "50% 55%" }, types: ["격투"], href: guideHref("dynamax-machamp") },
  excadrill: { id: "dynamax-excadrill", name: "다이맥스 몰드류", image: { src: "/images/pokemon/counter-530.png", scale: 1.04, objectPosition: "50% 56%" }, types: ["땅", "강철"], href: guideHref("dynamax-excadrill") },
  gardevoir: { id: "dynamax-gardevoir", name: "다이맥스 가디안", image: { src: "/images/pokemon/counter-282.png", scale: .98, objectPosition: "50% 56%" }, types: ["페어리", "에스퍼"], href: guideHref("dynamax-gardevoir") },
  druddigon: { id: "druddigon", name: "크리만", image: { src: "/images/pokemon/pm621.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["드래곤"], href: guideHref("druddigon") },
  orthworm: { id: "orthworm", name: "꿈트렁", image: { src: "/images/pokemon/pm968.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["강철"], href: guideHref("orthworm") },
  ralts: { id: "dynamax-ralts", name: "다이맥스 랄토스", image: { src: "/images/pokemon/pm280.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["에스퍼", "페어리"], href: guideHref("dynamax-ralts") },
  machop: { id: "dynamax-machop", name: "다이맥스 알통몬", image: { src: "/images/pokemon/pm66.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["격투"], href: guideHref("dynamax-machop") },
} satisfies Record<string, PokemonEntry>;

type PokemonGuideDraft = {
  pokemon: PokemonEntry;
  category: GuideCategory;
  categoryLabel: string;
  battleTypes?: readonly BattleType[];
  formName?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reason: string;
  weaknesses: readonly PokemonType[];
  counters?: PokemonGuide["counters"];
  values?: PokemonGuide["values"];
  valueReasons?: PokemonGuide["valueReasons"];
  recommendations: readonly string[];
  summary: string;
  source?: PokemonGuide["source"];
};

function createPokemonGuide(draft: PokemonGuideDraft): PokemonGuide {
  const defaultBattleType: BattleType = draft.category === "max" ? "max" : draft.category;
  return {
    id: draft.pokemon.id,
    name: draft.pokemon.name,
    formName: draft.formName,
    image: { ...draft.pokemon.image, alt: draft.pokemon.name },
    battleTypes: draft.battleTypes ?? [defaultBattleType],
    types: draft.pokemon.types as readonly PokemonType[],
    category: draft.category,
    categoryLabel: draft.categoryLabel,
    rating: draft.rating,
    reason: draft.reason,
    weaknesses: draft.weaknesses.map((type) => ({ type })),
    counters: draft.counters ?? [],
    values: draft.values ?? {},
    valueReasons: draft.valueReasons,
    recommendations: draft.recommendations,
    summary: draft.summary,
    source: draft.source,
  };
}

export const pokemonGuides = ([
  { pokemon: pokemon.zacian, category: "raid", categoryLabel: "5성 레이드", rating: 5, reason: "검왕 에너지와 강철 전력 확보", weaknesses: ["불꽃", "땅"], recommendations: ["불꽃·땅 타입 공격수 준비", "레이드아워에 인원 확보"], summary: "검왕 에너지와 강력한 강철 전력을 함께 준비하세요." },
  { pokemon: pokemon.zamazenta, category: "raid", categoryLabel: "5성 레이드", rating: 5, reason: "방패왕 에너지 확보", weaknesses: ["불꽃", "격투", "땅"], recommendations: ["불꽃·격투·땅 타입 공격수 준비", "레이드아워에 집중 참여"], summary: "방패왕 에너지가 필요하다면 화요일 레이드아워를 우선하세요." },
  { pokemon: pokemon.registeel, category: "max", categoryLabel: "맥스배틀", rating: 4, reason: "좋은 개체 확보", weaknesses: ["불꽃", "격투", "땅"], recommendations: ["다이맥스 괴력몬 또는 몰드류 준비", "집중 시간 전에 파티클 확인"], summary: "불꽃·격투·땅 맥스기술로 공략하세요." },
  { pokemon: pokemon.regidrago, category: "max", categoryLabel: "맥스배틀", rating: 4, reason: "드래곤 전력 보강", weaknesses: ["얼음", "드래곤", "페어리"], recommendations: ["얼음 또는 페어리 맥스기술 준비", "생존용 포켓몬 한 마리 포함"], summary: "드래곤끼리 큰 피해를 주므로 생존도 함께 준비하세요." },
  { pokemon: pokemon.latias, category: "max", categoryLabel: "맥스배틀", rating: 4, reason: "최소 1마리 확보", weaknesses: ["얼음", "벌레", "고스트", "드래곤", "악", "페어리"], recommendations: ["얼음·고스트 공격수 준비", "라티오스와 목표를 나눠 선택"], summary: "라티오스와 함께 등장하므로 필요한 개체를 먼저 정하세요." },
  { pokemon: pokemon.latios, category: "max", categoryLabel: "맥스배틀", rating: 4, reason: "최소 1마리 확보", weaknesses: ["얼음", "벌레", "고스트", "드래곤", "악", "페어리"], recommendations: ["얼음·고스트 공격수 준비", "라티아스와 목표를 나눠 선택"], summary: "두 보스 중 필요한 개체를 먼저 정하면 파티클을 아낄 수 있어요." },
  { pokemon: pokemon.zekrom, category: "raid", categoryLabel: "5성 레이드", rating: 4, reason: "토요일 한정 레이드", weaknesses: ["땅", "얼음", "드래곤", "페어리"], recommendations: ["땅·얼음 공격수 준비", "토요일 10~18시에 참여"], summary: "토요일에만 등장하므로 시간 안에 목표 개체를 확보하세요." },
  { pokemon: pokemon.whiteKyurem, category: "raid", categoryLabel: "5성 레이드", rating: 5, reason: "융합 에너지 확보", weaknesses: ["격투", "바위", "강철", "드래곤", "페어리"], recommendations: ["격투·강철 공격수 준비", "융합 에너지를 목표로 반복 참여"], summary: "이번 주 최우선 레이드 중 하나로 융합 에너지를 챙기세요." },
  { pokemon: pokemon.blackKyurem, category: "raid", categoryLabel: "5성 레이드", rating: 5, reason: "융합 에너지 확보", weaknesses: ["격투", "바위", "강철", "드래곤", "페어리"], recommendations: ["격투·강철 공격수 준비", "일요일 10~18시에 참여"], summary: "일요일에 융합 에너지와 좋은 개체를 함께 노리세요." },
  {
    pokemon: pokemon.dialga,
    category: "max",
    categoryLabel: "다이맥스",
    battleTypes: ["max"],
    rating: 5,
    reason: "맥스배틀 핵심 전력",
    weaknesses: ["격투", "땅"],
    counters: [
      { pokemonId: pokemon.excadrill.id, name: "다이맥스 몰드류", image: { src: "/images/pokemon/counter-530.png", scale: 1.04, objectPosition: "50% 56%" } },
      { pokemonId: pokemon.machamp.id, name: "다이맥스 괴력몬", image: { src: "/images/pokemon/counter-68.png", scale: .95, objectPosition: "50% 56%" } },
      { pokemonId: "gigantamax-machamp", name: "거다이맥스 괴력몬", image: { src: "/images/pokemon/pm68.icon.png", scale: 1.08, objectPosition: "50% 54%" } },
    ],
    values: { max: 5, raid: 4, pvp: 4 },
    valueReasons: { max: "향후 맥스배틀 핵심 전력", raid: "강력한 드래곤/강철 딜러", pvp: "마스터리그에서 우수한 성능" },
    recommendations: ["좋은 개체 최소 1마리 확보", "공격 15 우선"],
    summary: "맥스배틀·레이드·PvP 모두 활약 가능한 최상급 포켓몬!",
  },
  { pokemon: pokemon.palkia, category: "max", categoryLabel: "다이맥스", rating: 4, reason: "일요일 핵심 전력", weaknesses: ["드래곤", "페어리"], recommendations: ["드래곤·페어리 맥스기술 준비", "일요일 목표 보스로 우선 지정"], summary: "약점이 두 개뿐이라 충분한 인원과 육성이 중요해요." },
  { pokemon: pokemon.duraludon, category: "max", categoryLabel: "거다이맥스", rating: 4, reason: "신규·최소 1마리 확보", weaknesses: ["격투", "땅"], recommendations: ["다이맥스 괴력몬·몰드류 준비", "현장 그룹과 함께 도전"], summary: "양일 모두 등장하지만 큰 그룹이 필요한 고난도 보스예요." },
  { pokemon: pokemon.reshiram, category: "raid", categoryLabel: "5성 레이드", rating: 4, reason: "일요일 한정 레이드", weaknesses: ["땅", "바위", "드래곤"], recommendations: ["땅·바위 공격수 준비", "일요일 10~18시에 참여"], summary: "일요일 한정이므로 블랙큐레무와 목표를 나눠 잡으세요." },
  { pokemon: pokemon.druddigon, category: "raid", categoryLabel: "3성 레이드", rating: 3, reason: "평일 소수 인원 공략", weaknesses: ["얼음", "드래곤", "페어리"], recommendations: ["얼음·페어리 공격수 준비", "평일 이벤트 시간에 참여"], summary: "3성 레이드라 준비된 공격수로 소수 인원 공략이 가능해요." },
  { pokemon: pokemon.orthworm, category: "raid", categoryLabel: "3성 레이드", rating: 3, reason: "평일 도감·개체 확보", weaknesses: ["불꽃", "격투", "땅"], recommendations: ["불꽃·격투·땅 공격수 준비", "평일 이벤트 시간에 참여"], summary: "약점 타입이 많아 준비된 팀으로 빠르게 공략할 수 있어요." },
  { pokemon: pokemon.ralts, category: "max", categoryLabel: "1성 맥스배틀", rating: 3, reason: "가디안 육성용 개체", weaknesses: ["독", "고스트", "강철"], recommendations: ["강철·고스트 맥스기술 준비", "좋은 개체를 가디안으로 진화"], summary: "평일 동안 가디안 육성용 개체를 준비하기 좋아요." },
  { pokemon: pokemon.machop, category: "max", categoryLabel: "2성 맥스배틀", rating: 4, reason: "주말 격투 전력 준비", weaknesses: ["비행", "에스퍼", "페어리"], recommendations: ["에스퍼·페어리 맥스기술 준비", "좋은 개체를 괴력몬으로 진화"], summary: "두랄루돈 공략용 다이맥스 괴력몬을 준비할 수 있어요." },
  { pokemon: pokemon.machamp, category: "max", categoryLabel: "다이맥스", rating: 4, reason: "디아루가·두랄루돈 공략", weaknesses: ["비행", "에스퍼", "페어리"], recommendations: ["공격형 맥스기술 강화", "좋은 개체 한 마리 확보"], summary: "이번 주 두 핵심 보스에 모두 사용할 수 있는 격투 전력이에요." },
  { pokemon: pokemon.excadrill, category: "max", categoryLabel: "다이맥스", rating: 5, reason: "디아루가 핵심 카운터", weaknesses: ["불꽃", "물", "격투", "땅"], recommendations: ["땅 타입 맥스기술 우선 강화", "공격 개체를 우선 육성"], summary: "다이맥스 디아루가 공략의 핵심 땅 타입 공격수예요." },
  { pokemon: pokemon.gardevoir, category: "max", categoryLabel: "다이맥스", rating: 4, reason: "펄기아 드래곤 약점 공략", weaknesses: ["독", "고스트", "강철"], recommendations: ["페어리 타입 맥스기술 강화", "펄기아 공략팀에 배치"], summary: "페어리 공격으로 펄기아의 드래곤 약점을 노릴 수 있어요." },
] satisfies readonly PokemonGuideDraft[]).map(createPokemonGuide);

export const wildAreaEvent = {
  id: "go-wild-area-global-2026",
  title: "GO WILD AREA 2026",
  eyebrow: "POKÉMON GO",
  subtitle: "+ 월드 에리어 : 글로벌 이벤트",
  startDate: "2026-11-14",
  endDate: "2026-11-15",
  dateLabel: "11/14 토 ~ 11/15 일",
  timeLabel: "10:00 ~ 18:00",
  heroImage: "/images/events/key-art.jpg",
  heroPokemon: {
    dialga: { src: pokemon.dialga.image.src, scale: 1.04 },
    palkia: { src: pokemon.palkia.image.src, scale: 1.02 },
    duraludon: { src: pokemon.duraludon.image.src, scale: .92 },
  },
  rating: 5,
  ratingLabel: "이번 달 최우선 이벤트",
  href: "/events/go-wild-area-global-2026",
  days: [
    { day: 1 as const, label: "토요일 (11/14)", pokemon: [pokemon.zekrom, pokemon.whiteKyurem, pokemon.dialga, pokemon.duraludon] },
    { day: 2 as const, label: "일요일 (11/15)", pokemon: [pokemon.reshiram, pokemon.blackKyurem, pokemon.palkia, pokemon.duraludon] },
  ],
  reasons: ["큐레무 융합 에너지", "다이맥스 디아루가/펄기아 첫 등장", "거다이맥스 두랄루돈", "강력한 레이드 전력 확보"],
  preparations: [
    { id: "max-team", title: "다이맥스 알통몬 확보", type: "pokemon", reason: "괴력몬으로 진화해 맥스배틀 전력으로 사용", targetPokemonId: pokemon.machamp.id, href: pokemon.machamp.href, priority: 1, defaultDone: true },
    { id: "machamp-evolution", title: "괴력몬으로 진화", type: "pokemon", reason: "디아루가와 두랄루돈의 격투 약점을 공략", targetPokemonId: pokemon.machamp.id, href: pokemon.machamp.href, priority: 2 },
    { id: "max-move", title: "공격형 맥스기술 강화", type: "pokemon", reason: "이벤트 보스에게 줄 피해를 높이기", targetPokemonId: pokemon.machamp.id, href: pokemon.machamp.href, priority: 3 },
    { id: "max-particles", title: "맥스파티클 저장", type: "resource", reason: "이벤트 당일 맥스배틀 참여에 사용", priority: 4, defaultDone: true },
    { id: "pokemon-storage", title: "포켓몬 박스 정리", type: "inventory", reason: "포획 공간을 최소 50칸 확보", priority: 5 },
    { id: "healing-items", title: "회복약 확보", type: "resource", reason: "연속 배틀 뒤 전투팀을 빠르게 회복", priority: 6 },
  ] satisfies readonly PreparationTask[],
} as const;

export const eventsById = { [wildAreaEvent.id]: wildAreaEvent } as const;

export const preparationPlans = [{
  id: "wild-area-2026",
  eventId: wildAreaEvent.id,
  pokemon: [
    { rank: 1, pokemon: pokemon.machamp, use: "디아루가 / 두랄루돈 공략", rating: 4, status: "확보 필요", reason: "두 보스 모두 격투 약점" },
    { rank: 2, pokemon: pokemon.excadrill, use: "디아루가 공략", rating: 5, status: "강화 추천", reason: "땅 공격으로 강철 약점 공략" },
    { rank: 3, pokemon: pokemon.gardevoir, use: "펄기아 공략", rating: 4, status: "1마리 준비", reason: "페어리 공격으로 드래곤 약점 공략" },
  ],
  resources: [
    { id: "max-particles", title: "맥스 파티클", goal: "이벤트 시작 전 최대한 확보" },
    { id: "raid-pass", title: "레이드패스", goal: "3개 이상 준비" },
    { id: "healing-items", title: "회복약", goal: "연속 배틀에 충분한 수량 확보" },
    { id: "pokemon-storage", title: "포켓몬 박스", goal: "최소 50칸 확보" },
  ],
  tasks: wildAreaEvent.preparations,
}] satisfies readonly PreparationPlan[];

export const weekGuides = [{
  id: "2026-11-09",
  startDate: "2026-11-09",
  endDate: "2026-11-15",
  featuredEventId: wildAreaEvent.id,
  priorities: [
    { rank: 1, pokemon: pokemon.whiteKyurem, rating: 5, reason: "융합 에너지 확보" },
    { rank: 2, pokemon: pokemon.dialga, rating: 5, reason: "맥스배틀 핵심 전력" },
    { rank: 3, pokemon: pokemon.duraludon, rating: 4, reason: "신규 / 최소 1마리 확보" },
    { rank: 4, pokemon: pokemon.palkia, rating: 4, reason: "일요일 핵심 전력" },
  ],
  preparations: wildAreaEvent.preparations,
  events: [
    { id: "weekday-five-star", scheduleType: "range", date: "2026-11-09", dayLabel: "월 9", startAt: "2026-11-09T10:00:00+09:00", endAt: "2026-11-13T20:00:00+09:00", availabilityTime: "월 10:00 ~ 금 20:00", title: "검왕 자시안 · 방패왕 자마젠타", category: "legendary", categoryLabel: "5성 레이드", raidTier: 5, rating: 4, priority: 4, reason: "평일 이벤트 기간 내내 등장", pokemon: [pokemon.zacian, pokemon.zamazenta], guidePokemonIds: [pokemon.zacian.id, pokemon.zamazenta.id] },
    { id: "weekday-three-star", scheduleType: "range", date: "2026-11-09", dayLabel: "월 9", startAt: "2026-11-09T10:00:00+09:00", endAt: "2026-11-13T20:00:00+09:00", availabilityTime: "월 10:00 ~ 금 20:00", title: "크리만 · 꿈트렁", category: "legendary", categoryLabel: "3성 레이드", raidTier: 3, rating: 3, priority: 3, reason: "평일 소수 인원 공략", pokemon: [pokemon.druddigon, pokemon.orthworm], guidePokemonIds: [pokemon.druddigon.id, pokemon.orthworm.id] },
    { id: "weekday-low-max", scheduleType: "range", date: "2026-11-09", dayLabel: "월 9", startAt: "2026-11-09T10:00:00+09:00", endAt: "2026-11-13T20:00:00+09:00", availabilityTime: "월 10:00 ~ 금 20:00", title: "다이맥스 랄토스 · 알통몬", category: "max", categoryLabel: "상시 맥스배틀", rating: 3, priority: 3, reason: "1성 랄토스 · 2성 알통몬", pokemon: [pokemon.ralts, pokemon.machop], guidePokemonIds: [pokemon.ralts.id, pokemon.machop.id] },
    { id: "zacian-raid-hour", scheduleType: "featuredHour", date: "2026-11-09", dayLabel: "월 9", startAt: "2026-11-09T18:00:00+09:00", endAt: "2026-11-09T19:00:00+09:00", availabilityTime: "18:00 ~ 19:00", featuredHour: "18:00 ~ 19:00", title: "검왕 자시안 레이드아워", category: "legendary", categoryLabel: "5성 레이드", raidTier: 5, rating: 5, priority: 5, reason: "적극 추천", pokemon: [pokemon.zacian], guidePokemonIds: [pokemon.zacian.id], weaknesses: ["불꽃", "땅"] },
    { id: "zamazenta-raid-hour", scheduleType: "featuredHour", date: "2026-11-10", dayLabel: "화 10", startAt: "2026-11-10T18:00:00+09:00", endAt: "2026-11-10T19:00:00+09:00", availabilityTime: "18:00 ~ 19:00", featuredHour: "18:00 ~ 19:00", title: "방패왕 자마젠타 레이드아워", category: "legendary", categoryLabel: "5성 레이드", raidTier: 5, rating: 5, priority: 5, reason: "적극 추천", pokemon: [pokemon.zamazenta], guidePokemonIds: [pokemon.zamazenta.id], weaknesses: ["불꽃", "격투", "땅"] },
    { id: "registeel-max-battle", scheduleType: "featuredHour", date: "2026-11-11", dayLabel: "수 11", startAt: "2026-11-11T10:00:00+09:00", endAt: "2026-11-11T21:00:00+09:00", availabilityTime: "10:00 ~ 21:00", featuredHour: "18:00 ~ 19:00", title: "다이맥스 레지스틸", category: "max", categoryLabel: "맥스배틀", rating: 4, priority: 5, reason: "좋은 개체 확보", pokemon: [pokemon.registeel], guidePokemonIds: [pokemon.registeel.id], weaknesses: ["격투", "불꽃", "땅"] },
    { id: "regidrago-max-battle", scheduleType: "featuredHour", date: "2026-11-12", dayLabel: "목 12", startAt: "2026-11-12T10:00:00+09:00", endAt: "2026-11-12T21:00:00+09:00", availabilityTime: "10:00 ~ 21:00", featuredHour: "18:00 ~ 19:00", title: "다이맥스 레지드래고", category: "max", categoryLabel: "맥스배틀", rating: 4, priority: 4, reason: "드래곤 전력 보강", pokemon: [pokemon.regidrago], guidePokemonIds: [pokemon.regidrago.id] },
    { id: "latias-latios-max-battle", scheduleType: "single", date: "2026-11-13", dayLabel: "금 13", startAt: "2026-11-13T18:00:00+09:00", endAt: "2026-11-13T19:00:00+09:00", availabilityTime: "18:00 ~ 19:00", title: "다이맥스 라티아스 / 라티오스", category: "max", categoryLabel: "맥스배틀", rating: 4, priority: 4, reason: "최소 1마리씩 확보", pokemon: [pokemon.latias, pokemon.latios], guidePokemonIds: [pokemon.latias.id, pokemon.latios.id] },
    { id: "wild-sat-raids", scheduleType: "single", date: "2026-11-14", dayLabel: "토 14", startAt: "2026-11-14T10:00:00+09:00", endAt: "2026-11-14T18:00:00+09:00", availabilityTime: "10:00 ~ 18:00", title: "제크로무 · 화이트큐레무", category: "legendary", categoryLabel: "5성 레이드", raidTier: 5, rating: 5, priority: 5, reason: "토요일 한정", pokemon: [pokemon.zekrom, pokemon.whiteKyurem], guidePokemonIds: [pokemon.zekrom.id, pokemon.whiteKyurem.id] },
    { id: "wild-sat-max", scheduleType: "single", date: "2026-11-14", dayLabel: "토 14", startAt: "2026-11-14T10:00:00+09:00", endAt: "2026-11-14T18:00:00+09:00", availabilityTime: "10:00 ~ 18:00", title: "다이맥스 디아루가 · 거다이맥스 두랄루돈", category: "max", categoryLabel: "맥스배틀", rating: 5, priority: 5, reason: "주말 핵심 전력", pokemon: [pokemon.dialga, pokemon.duraludon], guidePokemonIds: [pokemon.dialga.id, pokemon.duraludon.id] },
    { id: "wild-area-day-1", scheduleType: "single", date: "2026-11-14", dayLabel: "토 14", startAt: "2026-11-14T10:00:00+09:00", endAt: "2026-11-14T18:00:00+09:00", availabilityTime: wildAreaEvent.timeLabel, title: "GO WILD AREA DAY 1", category: "event", categoryLabel: "글로벌 이벤트", rating: 5, priority: 5, reason: wildAreaEvent.ratingLabel, pokemon: wildAreaEvent.days[0].pokemon, guidePokemonIds: wildAreaEvent.days[0].pokemon.map((item) => item.id), eventHref: wildAreaEvent.href, preparationPlanId: "wild-area-2026" },
    { id: "weekend-three-star", scheduleType: "range", date: "2026-11-14", dayLabel: "토 14", startAt: "2026-11-14T10:00:00+09:00", endAt: "2026-11-15T18:00:00+09:00", availabilityTime: "토 10:00 ~ 일 18:00", title: "모던 재킷 괴력몬", category: "legendary", categoryLabel: "3성 레이드", raidTier: 3, rating: 3, priority: 3, reason: "주말 한정 수집", pokemon: [pokemon.machamp], guidePokemonIds: [pokemon.machamp.id] },
    { id: "wild-sun-raids", scheduleType: "single", date: "2026-11-15", dayLabel: "일 15", startAt: "2026-11-15T10:00:00+09:00", endAt: "2026-11-15T18:00:00+09:00", availabilityTime: "10:00 ~ 18:00", title: "레시라무 · 블랙큐레무", category: "legendary", categoryLabel: "5성 레이드", raidTier: 5, rating: 5, priority: 5, reason: "일요일 한정", pokemon: [pokemon.reshiram, pokemon.blackKyurem], guidePokemonIds: [pokemon.reshiram.id, pokemon.blackKyurem.id] },
    { id: "wild-sun-max", scheduleType: "single", date: "2026-11-15", dayLabel: "일 15", startAt: "2026-11-15T10:00:00+09:00", endAt: "2026-11-15T18:00:00+09:00", availabilityTime: "10:00 ~ 18:00", title: "다이맥스 펄기아 · 거다이맥스 두랄루돈", category: "max", categoryLabel: "맥스배틀", rating: 5, priority: 5, reason: "주말 핵심 전력", pokemon: [pokemon.palkia, pokemon.duraludon], guidePokemonIds: [pokemon.palkia.id, pokemon.duraludon.id] },
    { id: "wild-area-day-2", scheduleType: "single", date: "2026-11-15", dayLabel: "일 15", startAt: "2026-11-15T10:00:00+09:00", endAt: "2026-11-15T18:00:00+09:00", availabilityTime: wildAreaEvent.timeLabel, summaryTimeMode: "end", title: "GO WILD AREA DAY 2", category: "event", categoryLabel: "글로벌 이벤트", rating: 5, priority: 5, reason: wildAreaEvent.ratingLabel, pokemon: wildAreaEvent.days[1].pokemon, guidePokemonIds: wildAreaEvent.days[1].pokemon.map((item) => item.id), eventHref: wildAreaEvent.href },
  ] satisfies readonly WeekEvent[],
}] satisfies readonly WeekGuide[];
