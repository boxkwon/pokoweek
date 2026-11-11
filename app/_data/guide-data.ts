import type { PokemonImage } from "../_components/pokemon-artwork";
import type { PreparationItem } from "../_components/preparation-checklist";

export type CategoryColor = "legendary" | "mega" | "max" | "shadow" | "event" | "community";

export type PokemonEntry = {
  id: string;
  name: string;
  image: PokemonImage;
  types: readonly string[];
  href: string;
};

export type WeekEvent = {
  id: string;
  date: string;
  dayLabel: string;
  availabilityTime?: string;
  featuredHour?: string;
  title: string;
  category: CategoryColor;
  categoryLabel: string;
  rating: number;
  reason: string;
  href: string;
  pokemon?: PokemonEntry;
  weaknesses?: readonly string[];
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
  zekrom: { id: "zekrom", name: "제크로무", image: { src: "/images/pokemon/pm644.icon.png", scale: 1.06, objectPosition: "50% 58%" }, types: ["전기", "드래곤"], href: "/events/go-wild-area-global-2026" },
  whiteKyurem: { id: "white-kyurem", name: "화이트큐레무", image: { src: "/images/pokemon/pm646.fWHITE.icon.png", scale: .94, objectPosition: "50% 56%" }, types: ["얼음", "드래곤"], href: "/events/go-wild-area-global-2026" },
  blackKyurem: { id: "black-kyurem", name: "블랙큐레무", image: { src: "/images/pokemon/pm646.fBLACK.icon.png", scale: .94, objectPosition: "50% 56%" }, types: ["악", "드래곤"], href: "/events/go-wild-area-global-2026" },
  dialga: { id: "dynamax-dialga", name: "다이맥스 디아루가", image: { src: "/images/pokemon/pm483.icon.png", scale: 1.02, objectPosition: "50% 56%" }, types: ["강철", "드래곤"], href: "/bosses/dialga-dynamax" },
  palkia: { id: "dynamax-palkia", name: "다이맥스 펄기아", image: { src: "/images/pokemon/pm484.icon.png", scale: 1.02, objectPosition: "50% 57%" }, types: ["물", "드래곤"], href: "/events/go-wild-area-global-2026" },
  duraludon: { id: "gigantamax-duraludon", name: "거다이맥스 두랄루돈", image: { src: "/images/pokemon/pm884.icon.png", scale: .92, objectPosition: "50% 57%" }, types: ["드래곤", "강철"], href: "/events/go-wild-area-global-2026" },
  reshiram: { id: "reshiram", name: "레시라무", image: { src: "/images/pokemon/pm643.icon.png", scale: .96, objectPosition: "50% 57%" }, types: ["불꽃", "드래곤"], href: "/events/go-wild-area-global-2026" },
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
    { id: "max-particles", label: "맥스파티클 저장", defaultDone: true },
    { id: "max-team", label: "다이맥스 전투팀 3마리 준비", defaultDone: true },
    { id: "pokemon-storage", label: "포켓몬 박스 정리" },
    { id: "healing-items", label: "회복약 확보" },
  ] satisfies readonly PreparationItem[],
} as const;

export const eventsById = { [wildAreaEvent.id]: wildAreaEvent } as const;

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
    { id: "zacian-raid-hour", date: "2026-11-09", dayLabel: "월 9", availabilityTime: "18:00 ~ 19:00", title: "자시안 레이드아워", category: "legendary", categoryLabel: "레이드아워", rating: 5, reason: "적극 추천", href: pokemon.zacian.href, pokemon: pokemon.zacian, weaknesses: ["불꽃", "땅"] },
    { id: "zamazenta-raid-hour", date: "2026-11-10", dayLabel: "화 10", availabilityTime: "18:00 ~ 19:00", title: "자마젠타 레이드아워", category: "legendary", categoryLabel: "레이드아워", rating: 5, reason: "적극 추천", href: pokemon.zamazenta.href, pokemon: pokemon.zamazenta, weaknesses: ["에스퍼", "비행", "페어리"] },
    { id: "registeel-max-battle", date: "2026-11-11", dayLabel: "수 11", availabilityTime: "10:00 ~ 21:00", featuredHour: "18:00 ~ 19:00", title: "다이맥스 레지스틸", category: "max", categoryLabel: "맥스배틀", rating: 4, reason: "좋은 개체 확보", href: pokemon.registeel.href, pokemon: pokemon.registeel, weaknesses: ["격투", "불꽃", "땅"] },
    { id: "wild-area-day-1", date: "2026-11-14", dayLabel: "토 14", availabilityTime: wildAreaEvent.timeLabel, title: "GO Wild Area DAY 1", category: "event", categoryLabel: "글로벌 이벤트", rating: 5, reason: wildAreaEvent.ratingLabel, href: wildAreaEvent.href },
    { id: "wild-area-day-2", date: "2026-11-15", dayLabel: "일 15", availabilityTime: wildAreaEvent.timeLabel, title: "GO Wild Area DAY 2", category: "event", categoryLabel: "글로벌 이벤트", rating: 5, reason: wildAreaEvent.ratingLabel, href: wildAreaEvent.href },
  ] satisfies readonly WeekEvent[],
}] as const;

export type WeekGuide = (typeof weekGuides)[number];
