import type { Boss, PokemonGuideMeta } from "./types";

const guideMeta: Record<string, PokemonGuideMeta> = {
  "dialga-dynamax": {
    rating: 5,
    reason: "꼭 잡기",
    values: {
      max: { score: 5, reason: "향후 맥스배틀 핵심 전력" },
      raid: { score: 4, reason: "강력한 드래곤/강철 딜러" },
      pvp: { score: 4, reason: "마스터리그에서 우수한 성능" },
    },
    summary: "맥스배틀·레이드·PvP 모두 활약 가능한 최상급 포켓몬!",
  },
  "palkia-dynamax": {
    rating: 5,
    reason: "일요일 필수",
    values: {
      max: { score: 5, reason: "드래곤 맥스배틀 핵심 전력" },
      raid: { score: 4, reason: "물/드래곤 타입 공격수" },
      pvp: { score: 4, reason: "마스터리그 활용도가 높음" },
    },
    summary: "약점이 적고 활용처가 넓은 주말 핵심 보스!",
  },
};

export function getPokemonGuideMeta(boss: Boss): PokemonGuideMeta {
  return guideMeta[boss.slug] ?? {
    rating: boss.difficulty.startsWith("5성") || boss.difficulty.startsWith("6성") ? 5 : 4,
    reason: boss.difficulty.startsWith("5성") || boss.difficulty.startsWith("6성") ? "적극 추천" : "좋은 개체 확보",
    values: {
      max: { score: boss.battleType === "맥스배틀" || boss.battleType === "거다이맥스" ? 5 : 2, reason: boss.battleType === "레이드" ? "맥스 참가 불가" : "맥스배틀 전력" },
      raid: { score: boss.battleType === "레이드" ? 5 : 3, reason: "유리한 타입에서 활용" },
      pvp: { score: 3, reason: "개체값과 기술에 따라 활용" },
    },
    summary: boss.tip,
  };
}
