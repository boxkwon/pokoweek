import type { PokemonImage } from "../_components/pokemon-artwork";

export type CategoryColor = "legendary" | "mega" | "max" | "shadow" | "event" | "community";

export type PokemonEntry = {
  id: string;
  name: string;
  image: PokemonImage;
  types: readonly string[];
  href: string;
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
  rating: number;
  priority: number;
  reason: string;
  href: string;
  pokemon: readonly PokemonEntry[];
  preparationPlanId?: string;
  weaknesses?: readonly string[];
};

export type WeekPriority = {
  rank: number;
  pokemon: PokemonEntry;
  rating: number;
  reason: string;
  href: string;
};

export type WeekGuide = {
  id: string;
  startDate: string;
  endDate: string;
  featuredEventId: string;
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
};

export const pokemon = {
  zacian: { id: "zacian", name: "자시안", image: { src: "/images/pokemon/pm888.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["페어리"], href: "/events/go-wild-area-global-2026" },
  zamazenta: { id: "zamazenta", name: "자마젠타", image: { src: "/images/pokemon/pm889.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["격투"], href: "/events/go-wild-area-global-2026" },
  registeel: { id: "registeel", name: "다이맥스 레지스틸", image: { src: "/images/pokemon/pm379.icon.png", scale: .96, objectPosition: "50% 56%" }, types: ["강철"], href: "/bosses/dialga-dynamax" },
  regidrago: { id: "regidrago", name: "다이맥스 레지드래고", image: { src: "/images/pokemon/pm895.icon.png", scale: .98, objectPosition: "50% 56%" }, types: ["드래곤"], href: "/bosses/dialga-dynamax" },
  latias: { id: "latias", name: "다이맥스 라티아스", image: { src: "/images/pokemon/pm380.icon.png", scale: .98, objectPosition: "50% 56%" }, types: ["드래곤", "에스퍼"], href: "/events/go-wild-area-global-2026" },
  latios: { id: "latios", name: "다이맥스 라티오스", image: { src: "/images/pokemon/pm381.icon.png", scale: .98, objectPosition: "50% 56%" }, types: ["드래곤", "에스퍼"], href: "/events/go-wild-area-global-2026" },
  zekrom: { id: "zekrom", name: "제크로무", image: { src: "/images/pokemon/pm644.icon.png", scale: 1.06, objectPosition: "50% 58%" }, types: ["전기", "드래곤"], href: "/events/go-wild-area-global-2026" },
  whiteKyurem: { id: "white-kyurem", name: "화이트큐레무", image: { src: "/images/pokemon/pm646.fWHITE.icon.png", scale: .94, objectPosition: "50% 56%" }, types: ["얼음", "드래곤"], href: "/events/go-wild-area-global-2026" },
  blackKyurem: { id: "black-kyurem", name: "블랙큐레무", image: { src: "/images/pokemon/pm646.fBLACK.icon.png", scale: .94, objectPosition: "50% 56%" }, types: ["악", "드래곤"], href: "/events/go-wild-area-global-2026" },
  dialga: { id: "dynamax-dialga", name: "다이맥스 디아루가", image: { src: "/images/pokemon/pm483.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["강철", "드래곤"], href: "/bosses/dialga-dynamax" },
  palkia: { id: "dynamax-palkia", name: "다이맥스 펄기아", image: { src: "/images/pokemon/pm484.icon.png", scale: 1.02, objectPosition: "50% 57%" }, types: ["물", "드래곤"], href: "/events/go-wild-area-global-2026" },
  duraludon: { id: "gigantamax-duraludon", name: "거다이맥스 두랄루돈", image: { src: "/images/pokemon/pm884.icon.png", scale: .92, objectPosition: "50% 57%" }, types: ["드래곤", "강철"], href: "/events/go-wild-area-global-2026" },
  reshiram: { id: "reshiram", name: "레시라무", image: { src: "/images/pokemon/pm643.icon.png", scale: .96, objectPosition: "50% 57%" }, types: ["불꽃", "드래곤"], href: "/events/go-wild-area-global-2026" },
  machamp: { id: "dynamax-machamp", name: "다이맥스 괴력몬", image: { src: "/images/pokemon/pm68.icon.png", scale: 1.02, objectPosition: "50% 55%" }, types: ["격투"], href: "/bosses/dialga-dynamax" },
  excadrill: { id: "dynamax-excadrill", name: "다이맥스 몰드류", image: { src: "/images/pokemon/counter-530.png", scale: 1.04, objectPosition: "50% 56%" }, types: ["땅", "강철"], href: "/bosses/dialga-dynamax" },
  gardevoir: { id: "dynamax-gardevoir", name: "다이맥스 가디안", image: { src: "/images/pokemon/counter-282.png", scale: .98, objectPosition: "50% 56%" }, types: ["페어리", "에스퍼"], href: "/events/go-wild-area-global-2026" },
} satisfies Record<string, PokemonEntry>;

export const dialgaGuide = {
  title: pokemon.dialga.name,
  category: "다이맥스",
  image: { src: "/images/pokemon/pm483.icon.png", scale: 1.08, objectPosition: "56% 54%" },
  backdrop: "/images/events/dialgaraids.jpg",
  types: pokemon.dialga.types,
  rating: 5,
  ratingLabel: "꼭 잡기",
  weaknesses: ["격투", "땅"],
  counters: [
    { rank: 1, name: "다이맥스\n몰드류", image: { src: "/images/pokemon/counter-530.png", scale: 1.04, objectPosition: "50% 56%" }, tone: "gold" },
    { rank: 2, name: "다이맥스\n괴력몬", image: { src: "/images/pokemon/counter-68.png", scale: .95, objectPosition: "50% 56%" }, tone: "silver" },
    { rank: 3, name: "거다이맥스\n괴력몬", image: { src: "/images/pokemon/pm68.icon.png", scale: 1.08, objectPosition: "50% 54%" }, tone: "bronze" },
  ],
  values: [
    { label: "맥스배틀 전력", score: 5, reason: "향후 맥스배틀 핵심 전력" },
    { label: "일반 레이드", score: 4, reason: "강력한 드래곤/강철 딜러" },
    { label: "PvP (배틀리그)", score: 4, reason: "마스터리그에서 우수한 성능" },
  ],
  recommendations: ["좋은 개체 최소 1마리 확보", "공격 15 우선"],
  summary: "맥스배틀·레이드·PvP 모두 활약 가능한 최상급 포켓몬!",
} as const;

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
    { rank: 1, pokemon: pokemon.whiteKyurem, rating: 5, reason: "융합 에너지 확보", href: wildAreaEvent.href },
    { rank: 2, pokemon: pokemon.dialga, rating: 5, reason: "맥스배틀 핵심 전력", href: pokemon.dialga.href },
    { rank: 3, pokemon: pokemon.duraludon, rating: 4, reason: "신규 / 최소 1마리 확보", href: wildAreaEvent.href },
  ],
  preparations: wildAreaEvent.preparations,
  events: [
    { id: "zacian-raid-hour", date: "2026-11-09", dayLabel: "월 9", startAt: "2026-11-09T18:00:00+09:00", endAt: "2026-11-09T19:00:00+09:00", availabilityTime: "18:00 ~ 19:00", featuredHour: "18:00 ~ 19:00", title: "자시안 레이드아워", category: "legendary", categoryLabel: "5성 레이드", rating: 5, priority: 5, reason: "적극 추천", href: pokemon.zacian.href, pokemon: [pokemon.zacian], weaknesses: ["불꽃", "땅"] },
    { id: "zamazenta-raid-hour", date: "2026-11-10", dayLabel: "화 10", startAt: "2026-11-10T18:00:00+09:00", endAt: "2026-11-10T19:00:00+09:00", availabilityTime: "18:00 ~ 19:00", featuredHour: "18:00 ~ 19:00", title: "자마젠타 레이드아워", category: "legendary", categoryLabel: "5성 레이드", rating: 5, priority: 5, reason: "적극 추천", href: pokemon.zamazenta.href, pokemon: [pokemon.zamazenta], weaknesses: ["에스퍼", "비행", "페어리"] },
    { id: "legendary-raid-wednesday", date: "2026-11-11", dayLabel: "수 11", startAt: "2026-11-11T10:00:00+09:00", endAt: "2026-11-11T20:00:00+09:00", availabilityTime: "10:00 ~ 20:00", title: "자시안 · 자마젠타", category: "legendary", categoryLabel: "5성 레이드", rating: 4, priority: 4, reason: "전설 레이드 전력 확보", href: pokemon.zacian.href, pokemon: [pokemon.zacian, pokemon.zamazenta] },
    { id: "registeel-max-battle", date: "2026-11-11", dayLabel: "수 11", startAt: "2026-11-11T10:00:00+09:00", endAt: "2026-11-11T21:00:00+09:00", availabilityTime: "10:00 ~ 21:00", featuredHour: "18:00 ~ 19:00", title: "다이맥스 레지스틸", category: "max", categoryLabel: "맥스배틀", rating: 4, priority: 5, reason: "좋은 개체 확보", href: pokemon.registeel.href, pokemon: [pokemon.registeel], weaknesses: ["격투", "불꽃", "땅"] },
    { id: "regidrago-max-battle", date: "2026-11-12", dayLabel: "목 12", startAt: "2026-11-12T10:00:00+09:00", endAt: "2026-11-12T21:00:00+09:00", availabilityTime: "10:00 ~ 21:00", title: "다이맥스 레지드래고", category: "max", categoryLabel: "맥스배틀", rating: 4, priority: 4, reason: "드래곤 전력 보강", href: pokemon.regidrago.href, pokemon: [pokemon.regidrago] },
    { id: "latias-latios-max-battle", date: "2026-11-13", dayLabel: "금 13", startAt: "2026-11-13T18:00:00+09:00", endAt: "2026-11-13T19:00:00+09:00", availabilityTime: "18:00 ~ 19:00", title: "다이맥스 라티아스 / 라티오스", category: "max", categoryLabel: "맥스배틀", rating: 4, priority: 4, reason: "최소 1마리씩 확보", href: pokemon.latias.href, pokemon: [pokemon.latias, pokemon.latios] },
    { id: "wild-area-day-1", date: "2026-11-14", dayLabel: "토 14", startAt: "2026-11-14T10:00:00+09:00", endAt: "2026-11-14T18:00:00+09:00", availabilityTime: wildAreaEvent.timeLabel, title: "GO WILD AREA DAY 1", category: "event", categoryLabel: "글로벌 이벤트", rating: 5, priority: 5, reason: wildAreaEvent.ratingLabel, href: wildAreaEvent.href, pokemon: wildAreaEvent.days[0].pokemon, preparationPlanId: "wild-area-2026" },
    { id: "wild-area-day-2", date: "2026-11-15", dayLabel: "일 15", startAt: "2026-11-15T10:00:00+09:00", endAt: "2026-11-15T18:00:00+09:00", availabilityTime: wildAreaEvent.timeLabel, summaryTimeMode: "end", title: "GO WILD AREA DAY 2", category: "event", categoryLabel: "글로벌 이벤트", rating: 5, priority: 5, reason: wildAreaEvent.ratingLabel, href: wildAreaEvent.href, pokemon: wildAreaEvent.days[1].pokemon },
  ] satisfies readonly WeekEvent[],
}] satisfies readonly WeekGuide[];
