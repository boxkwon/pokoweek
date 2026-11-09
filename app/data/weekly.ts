import { WeeklyOverviewGroup } from "./types";

export const weeklyOverview: WeeklyOverviewGroup[] = [
  {
    id: "weekday-five-star",
    title: "5성 레이드",
    period: "월 10:00 – 금 20:00",
    description: "평일 내내 두 보스가 등장하고, 월·화 18시에는 각각 레이드아워가 열려요.",
    bossSlugs: ["zacian-crowned-sword", "zamazenta-crowned-shield"],
    tone: "raid",
  },
  {
    id: "weekly-mega",
    title: "메가 레이드",
    period: "이번 주",
    description: "Into the Wild와 GO Wild Area 공식 공지에 일반 메가 레이드 보스가 따로 안내되지 않았어요.",
    bossSlugs: [],
    tone: "mega",
    empty: true,
  },
  {
    id: "three-star-raids",
    title: "3성 레이드",
    period: "월–금 · 주말",
    description: "평일은 크리만·꿈트렁, 주말은 모던 재킷 괴력몬이 등장해요.",
    bossSlugs: ["druddigon-raid", "orthworm-raid", "machamp-jacket"],
    tone: "raid",
  },
  {
    id: "daily-max",
    title: "상시 맥스배틀",
    period: "월 10:00 – 금 20:00",
    description: "집중 시간 외에도 1성 랄토스와 2성 알통몬을 만날 수 있어요.",
    bossSlugs: ["ralts-dynamax", "machop-dynamax"],
    tone: "max",
  },
  {
    id: "weekend-five-star",
    title: "주말 5성 레이드",
    period: "토·일 10:00–18:00",
    description: "토요일 제크로무·화이트큐레무, 일요일 레시라무·블랙큐레무가 등장해요.",
    bossSlugs: ["zekrom-raid", "white-kyurem-raid", "reshiram-raid", "black-kyurem-raid"],
    tone: "weekend",
  },
  {
    id: "weekend-max",
    title: "주말 맥스배틀",
    period: "토·일 10:00–18:00",
    description: "토요일 디아루가, 일요일 펄기아, 양일 거다이맥스 두랄루돈이 등장해요.",
    bossSlugs: ["dialga-dynamax", "palkia-dynamax", "duraludon-gigantamax"],
    tone: "weekend",
  },
];
