import { GameEvent, ScheduleItem } from "./types";

export const events: GameEvent[] = [
  {
    slug: "into-the-wild-2026", title: "Into the Wild", eyebrow: "평일 준비 이벤트",
    start: "2026-11-09T10:00:00+09:00", end: "2026-11-13T20:00:00+09:00",
    summary: "강철·드래곤 테마의 레이드와 맥스배틀이 매일 이어집니다.",
    highlights: ["원격 레이드 일일 한도 30회", "다이맥스 레지드래고 첫 등장", "5성 레이드·맥스배틀 포켓몬의 특별 배경 기회", "이벤트 포켓몬 포획 시 특별 기술 보유"],
    checklist: ["월·화 레이드패스 사용 계획 세우기", "수~금 맥스파티클 1회분 이상 확보", "주말용 다이맥스 몰드류·괴력몬 회복"],
    bossSlugs: ["zacian-crowned-sword", "zamazenta-crowned-shield", "registeel-dynamax", "regidrago-dynamax", "latias-dynamax", "latios-dynamax"],
    sourceIds: ["official-into-wild", "gohub-november"], color: "violet", eventHero: "/images/events/into-the-wild-2026.jpg"
  },
  {
    slug: "go-wild-area-global-2026", title: "GO Wild Area: 글로벌", eyebrow: "이번 주 최우선",
    start: "2026-11-14T10:00:00+09:00", end: "2026-11-15T18:00:00+09:00",
    summary: "토요일 디아루가, 일요일 펄기아, 양일 거다이맥스 두랄루돈이 등장합니다.",
    highlights: ["토: 다이맥스 디아루가 첫 등장", "일: 다이맥스 펄기아 첫 등장", "양일: 거다이맥스 두랄루돈 첫 등장", "원격 레이드 횟수 제한 없음"],
    checklist: ["토·일 10시 전 맥스파티클 확인", "가족별 목표 보스 1순위 정하기", "보조 포켓몬에 맥스가드·맥스회복 준비", "충전기·물·간식 챙기기"],
    bossSlugs: ["dialga-dynamax", "palkia-dynamax", "duraludon-gigantamax", "machamp-jacket"],
    sourceIds: ["official-wild-area", "gohub-november"], color: "orange", eventHero: "/images/events/key-art.jpg"
  }
];

export const schedule: ScheduleItem[] = [
  { id: "into", title: "Into the Wild", kind: "event", start: "2026-11-09T10:00:00+09:00", end: "2026-11-13T20:00:00+09:00", summary: "레이드·맥스배틀 준비 주간", eventSlug: "into-the-wild-2026", priority: "good" },
  { id: "weekday-five-star", title: "검왕 자시안 · 방패왕 자마젠타", label: "5성 레이드", kind: "raid", start: "2026-11-09T10:00:00+09:00", end: "2026-11-13T20:00:00+09:00", summary: "평일 이벤트 기간 내내 등장", bossSlugs: ["zacian-crowned-sword", "zamazenta-crowned-shield"], priority: "good" },
  { id: "weekday-three-star", title: "크리만 · 꿈트렁", label: "3성 레이드", kind: "raid", start: "2026-11-09T10:00:00+09:00", end: "2026-11-13T20:00:00+09:00", summary: "평일 이벤트 기간 내내 등장", bossSlugs: ["druddigon-raid", "orthworm-raid"], priority: "info" },
  { id: "weekday-low-max", title: "다이맥스 랄토스 · 알통몬", label: "상시 맥스배틀", kind: "max", start: "2026-11-09T10:00:00+09:00", end: "2026-11-13T20:00:00+09:00", summary: "1성 랄토스 · 2성 알통몬", bossSlugs: ["ralts-dynamax", "machop-dynamax"], priority: "info" },
  { id: "zacian", title: "검왕 자시안 레이드아워", kind: "raid", start: "2026-11-09T18:00:00+09:00", end: "2026-11-09T19:00:00+09:00", summary: "불꽃·땅 타입으로 공략", bossSlugs: ["zacian-crowned-sword"], priority: "good" },
  { id: "zamazenta", title: "방패왕 자마젠타 레이드아워", kind: "raid", start: "2026-11-10T18:00:00+09:00", end: "2026-11-10T19:00:00+09:00", summary: "불꽃·격투·땅 타입으로 공략", bossSlugs: ["zamazenta-crowned-shield"], priority: "good" },
  { id: "registeel", title: "다이맥스 레지스틸 집중 시간", kind: "max", start: "2026-11-11T18:00:00+09:00", end: "2026-11-11T19:00:00+09:00", summary: "불꽃·격투·땅 맥스기술 추천", bossSlugs: ["registeel-dynamax"], priority: "info" },
  { id: "regidrago", title: "다이맥스 레지드래고 집중 시간", kind: "max", start: "2026-11-12T18:00:00+09:00", end: "2026-11-12T19:00:00+09:00", summary: "얼음·드래곤·페어리 약점", bossSlugs: ["regidrago-dynamax"], priority: "good" },
  { id: "latis", title: "다이맥스 라티아스·라티오스", kind: "max", start: "2026-11-13T18:00:00+09:00", end: "2026-11-13T19:00:00+09:00", summary: "두 보스가 함께 등장", bossSlugs: ["latias-dynamax", "latios-dynamax"], priority: "good" },
  { id: "wild-sat-raids", title: "제크로무 · 화이트큐레무", label: "주말 5성 레이드", kind: "raid", start: "2026-11-14T10:00:00+09:00", end: "2026-11-14T18:00:00+09:00", summary: "토요일에만 등장", bossSlugs: ["zekrom-raid", "white-kyurem-raid"], eventSlug: "go-wild-area-global-2026", priority: "must" },
  { id: "wild-sat", title: "GO Wild Area — 디아루가", kind: "max", start: "2026-11-14T10:00:00+09:00", end: "2026-11-14T18:00:00+09:00", summary: "다이맥스 디아루가 + 거다이맥스 두랄루돈", bossSlugs: ["dialga-dynamax", "duraludon-gigantamax"], eventSlug: "go-wild-area-global-2026", priority: "must" },
  { id: "wild-sun-raids", title: "레시라무 · 블랙큐레무", label: "주말 5성 레이드", kind: "raid", start: "2026-11-15T10:00:00+09:00", end: "2026-11-15T18:00:00+09:00", summary: "일요일에만 등장", bossSlugs: ["reshiram-raid", "black-kyurem-raid"], eventSlug: "go-wild-area-global-2026", priority: "must" },
  { id: "wild-sun", title: "GO Wild Area — 펄기아", kind: "max", start: "2026-11-15T10:00:00+09:00", end: "2026-11-15T18:00:00+09:00", summary: "다이맥스 펄기아 + 거다이맥스 두랄루돈", bossSlugs: ["palkia-dynamax", "duraludon-gigantamax"], eventSlug: "go-wild-area-global-2026", priority: "must" }
];

export const getEvent = (slug: string) => events.find((event) => event.slug === slug);
