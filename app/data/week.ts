import type { WeekGuide } from "./types";

export const currentWeek: WeekGuide = {
  id: "2026-11-09",
  startDate: "2026-11-09",
  endDate: "2026-11-15",
  eyebrow: "11월 9일 – 15일",
  title: "이번 주는 강철과 드래곤",
  summary: "평일에는 전력을 준비하고, 주말엔 다이맥스 디아루가·펄기아를 노려요.",
  featuredBossSlugs: ["dialga-dynamax", "palkia-dynamax", "duraludon-gigantamax"],
  featuredEventSlug: "go-wild-area-global-2026",
  priorities: [
    { rank: 1, title: "토요일 디아루가 먼저", description: "다음 주 무한다이노전까지 이어지는 핵심 전력", timeLabel: "토 10–18시", bossSlug: "dialga-dynamax" },
    { rank: 2, title: "일요일 펄기아 확보", description: "일요일에만 등장하니 하루를 놓치지 않기", timeLabel: "일 10–18시", bossSlug: "palkia-dynamax" },
    { rank: 3, title: "두랄루돈은 큰 그룹으로", description: "6성 거다이맥스, 현장 그룹 합류 추천", timeLabel: "주말 양일", bossSlug: "duraludon-gigantamax" },
  ],
  preparation: [
    "토·일 10시 전 맥스파티클 확인",
    "가족별 목표 보스 1순위 정하기",
    "멀티탭과 맥스가드 기술 준비",
    "충전기·물·간식 챙기기",
  ],
};
