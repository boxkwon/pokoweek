import { Boss } from "./types";

const sprite = (dex: number) =>
  `https://cdn.leekduck.com/assets/img/pokemon_icons/pokemon_icon_${String(dex).padStart(3, "0")}_00.png`;

export const bosses: Boss[] = [
  {
    slug: "zacian-crowned-sword", name: "자시안", form: "검왕", dex: 888, sprite: "https://cdn.leekduck.com/assets/img/pokemon_icons/pm888.fCROWNED_SWORD.icon.png",
    types: ["페어리", "강철"], weaknesses: ["불꽃", "땅"], battleType: "레이드", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "원시그란돈", note: "단애의칼" }, { name: "메가리자몽Y", note: "회오리불꽃 · 블라스트번" }, { name: "그란돈", note: "머드샷 · 단애의칼" }],
    tip: "11월 9일 18~19시 레이드아워. 검왕 에너지도 함께 모으세요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "zamazenta-crowned-shield", name: "자마젠타", form: "방패왕", dex: 889, sprite: "https://cdn.leekduck.com/assets/img/pokemon_icons/pm889.fCROWNED_SHIELD.icon.png",
    types: ["격투", "강철"], weaknesses: ["불꽃", "격투", "땅"], battleType: "레이드", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "원시그란돈", note: "머드샷 · 단애의칼" }, { name: "메가루카리오", note: "발경 · 파동탄" }, { name: "메가리자몽Y", note: "회오리불꽃 · 블라스트번" }],
    tip: "11월 10일 18~19시 레이드아워. 방패왕 에너지를 얻을 수 있어요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "registeel-dynamax", name: "레지스틸", form: "다이맥스", dex: 379, sprite: sprite(379),
    types: ["강철"], weaknesses: ["불꽃", "격투", "땅"], battleType: "맥스배틀", difficulty: "5성 · 준비된 팀 필요",
    counters: [{ name: "다이맥스 리자몽", note: "불꽃 타입 맥스기술" }, { name: "다이맥스 괴력몬", note: "격투 타입 맥스기술" }, { name: "다이맥스 몰드류", note: "땅 타입 맥스기술" }],
    tip: "맥스배틀에는 다이맥스 가능한 포켓몬만 참가할 수 있어요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "regidrago-dynamax", name: "레지드래고", form: "다이맥스", dex: 895, sprite: sprite(895),
    types: ["드래곤"], weaknesses: ["얼음", "드래곤", "페어리"], battleType: "맥스배틀", difficulty: "5성 · 준비된 팀 필요",
    counters: [{ name: "다이맥스 메타그로스", note: "방어 역할 + 맥스가드" }, { name: "다이맥스 라프라스", note: "얼음 타입 맥스기술" }, { name: "다이맥스 망나뇽", note: "드래곤 타입 맥스기술" }],
    tip: "드래곤 기술은 서로에게 아파요. 생존용 포켓몬도 한 마리 챙기세요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "latias-dynamax", name: "라티아스", form: "다이맥스", dex: 380, sprite: sprite(380),
    types: ["드래곤", "에스퍼"], weaknesses: ["얼음", "벌레", "고스트", "드래곤", "악", "페어리"], battleType: "맥스배틀", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "다이맥스 팬텀", note: "고스트 타입 맥스기술" }, { name: "다이맥스 라프라스", note: "얼음 타입 맥스기술" }, { name: "다이맥스 망나뇽", note: "드래곤 타입 맥스기술" }],
    tip: "11월 13일 18~19시 라티오스와 함께 등장해요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "latios-dynamax", name: "라티오스", form: "다이맥스", dex: 381, sprite: sprite(381),
    types: ["드래곤", "에스퍼"], weaknesses: ["얼음", "벌레", "고스트", "드래곤", "악", "페어리"], battleType: "맥스배틀", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "다이맥스 팬텀", note: "고스트 타입 맥스기술" }, { name: "다이맥스 라프라스", note: "얼음 타입 맥스기술" }, { name: "다이맥스 망나뇽", note: "드래곤 타입 맥스기술" }],
    tip: "두 보스 중 필요한 개체를 가족끼리 먼저 정하면 파티클을 아낄 수 있어요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "dialga-dynamax", name: "디아루가", form: "다이맥스", dex: 483, sprite: sprite(483),
    types: ["강철", "드래곤"], weaknesses: ["격투", "땅"], battleType: "맥스배틀", difficulty: "5성 · 최우선 준비",
    counters: [{ name: "다이맥스 몰드류", note: "땅 타입 공격 · 상성 우수" }, { name: "다이맥스 괴력몬", note: "격투 타입 맥스기술" }, { name: "다이맥스 메타그로스", note: "튼튼한 버티기 역할" }],
    tip: "토요일에만 등장. 다음 주 무한다이노전 전력으로도 기대돼요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "palkia-dynamax", name: "펄기아", form: "다이맥스", dex: 484, sprite: sprite(484),
    types: ["물", "드래곤"], weaknesses: ["드래곤", "페어리"], battleType: "맥스배틀", difficulty: "5성 · 최우선 준비",
    counters: [{ name: "다이맥스 망나뇽", note: "드래곤 타입 맥스기술" }, { name: "다이맥스 메타그로스", note: "버티면서 맥스게이지 충전" }, { name: "다이맥스 라프라스", note: "생존 보조" }],
    tip: "일요일에만 등장. 약점이 두 개뿐이라 인원과 육성이 중요해요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "duraludon-gigantamax", name: "두랄루돈", form: "거다이맥스", dex: 884, sprite: sprite(884),
    types: ["강철", "드래곤"], weaknesses: ["격투", "땅"], battleType: "거다이맥스", difficulty: "6성 · 큰 그룹 권장",
    counters: [{ name: "다이맥스 몰드류", note: "땅 타입 공격" }, { name: "다이맥스 괴력몬", note: "격투 타입 공격" }, { name: "다이맥스 메타그로스", note: "회복·방어 역할" }],
    tip: "양일 모두 등장. 가족만으로 어렵다면 현장 그룹에 합류하세요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "druddigon-raid", name: "크리만", dex: 621, sprite: sprite(621),
    types: ["드래곤"], weaknesses: ["얼음", "드래곤", "페어리"], battleType: "레이드", difficulty: "3성 · 소수 가능",
    counters: [{ name: "맘모꾸리", note: "눈싸라기 · 눈사태" }, { name: "가디안", note: "애교부리기 · 매지컬샤인" }, { name: "망나뇽", note: "드래곤테일 · 역린" }],
    tip: "Into the Wild 평일 3성 레이드에서 등장해요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "orthworm-raid", name: "꿈트렁", dex: 968, sprite: sprite(968),
    types: ["강철"], weaknesses: ["불꽃", "격투", "땅"], battleType: "레이드", difficulty: "3성 · 소수 가능",
    counters: [{ name: "그란돈", note: "머드샷 · 단애의칼" }, { name: "루카리오", note: "발경 · 파동탄" }, { name: "리자몽", note: "회오리불꽃 · 블라스트번" }],
    tip: "Into the Wild 평일 3성 레이드에서 등장해요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "ralts-dynamax", name: "랄토스", form: "다이맥스", dex: 280, sprite: sprite(280),
    types: ["에스퍼", "페어리"], weaknesses: ["독", "고스트", "강철"], battleType: "맥스배틀", difficulty: "1성 · 혼자 가능",
    counters: [{ name: "다이맥스 메타그로스", note: "강철 타입 맥스기술" }, { name: "다이맥스 팬텀", note: "고스트 타입 맥스기술" }, { name: "다이맥스 두랄루돈", note: "강철 타입 공격" }],
    tip: "평일 내내 등장해요. 가디안 육성용 개체를 준비하기 좋아요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "machop-dynamax", name: "알통몬", form: "다이맥스", dex: 66, sprite: sprite(66),
    types: ["격투"], weaknesses: ["비행", "에스퍼", "페어리"], battleType: "맥스배틀", difficulty: "2성 · 혼자 가능",
    counters: [{ name: "다이맥스 메타그로스", note: "에스퍼 타입 맥스기술" }, { name: "다이맥스 리자몽", note: "비행 타입 맥스기술" }, { name: "다이맥스 가디안", note: "페어리 타입 맥스기술" }],
    tip: "평일 내내 등장해요. 주말 두랄루돈용 괴력몬을 준비할 수 있어요.", sourceIds: ["official-into-wild"]
  },
  {
    slug: "zekrom-raid", name: "제크로무", dex: 644, sprite: sprite(644),
    types: ["드래곤", "전기"], weaknesses: ["땅", "얼음", "드래곤", "페어리"], battleType: "레이드", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "원시그란돈", note: "머드샷 · 단애의칼" }, { name: "맘모꾸리", note: "눈싸라기 · 눈사태" }, { name: "메가가디안", note: "애교부리기 · 매지컬샤인" }],
    tip: "GO Wild Area 토요일 10~18시에 등장해요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "white-kyurem-raid", name: "화이트큐레무", dex: 646, sprite: "https://cdn.leekduck.com/assets/img/pokemon_icons/pm646.fWHITE.icon.png",
    types: ["드래곤", "얼음"], weaknesses: ["격투", "바위", "강철", "드래곤", "페어리"], battleType: "레이드", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "메가루카리오", note: "발경 · 파동탄" }, { name: "메타그로스", note: "불릿펀치 · 코멧펀치" }, { name: "메가가디안", note: "애교부리기 · 매지컬샤인" }],
    tip: "GO Wild Area 토요일 10~18시에 등장하며 융합 에너지를 얻을 수 있어요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "reshiram-raid", name: "레시라무", dex: 643, sprite: sprite(643),
    types: ["드래곤", "불꽃"], weaknesses: ["땅", "바위", "드래곤"], battleType: "레이드", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "원시그란돈", note: "머드샷 · 단애의칼" }, { name: "메가디안시", note: "돌떨구기 · 스톤샤워" }, { name: "펄기아", note: "드래곤테일 · 공간절단" }],
    tip: "GO Wild Area 일요일 10~18시에 등장해요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "black-kyurem-raid", name: "블랙큐레무", dex: 646, sprite: "https://cdn.leekduck.com/assets/img/pokemon_icons/pm646.fBLACK.icon.png",
    types: ["드래곤", "얼음"], weaknesses: ["격투", "바위", "강철", "드래곤", "페어리"], battleType: "레이드", difficulty: "5성 · 여럿이 권장",
    counters: [{ name: "메가루카리오", note: "발경 · 파동탄" }, { name: "메타그로스", note: "불릿펀치 · 코멧펀치" }, { name: "메가가디안", note: "애교부리기 · 매지컬샤인" }],
    tip: "GO Wild Area 일요일 10~18시에 등장하며 융합 에너지를 얻을 수 있어요.", sourceIds: ["official-wild-area"]
  },
  {
    slug: "machamp-jacket", name: "괴력몬", form: "모던 재킷", dex: 68, sprite: sprite(68),
    types: ["격투"], weaknesses: ["비행", "에스퍼", "페어리"], battleType: "레이드", difficulty: "3성 · 소수 가능",
    counters: [{ name: "메가레쿠쟈", note: "에어슬래시 · 화룡점정" }, { name: "뮤츠", note: "염동력 · 사이코브레이크" }, { name: "메가가디안", note: "염동력 · 사이코키네시스" }],
    tip: "주말 한정 의상 포켓몬. 수집이 목표라면 1회는 챙기세요.", sourceIds: ["official-wild-area"]
  }
];

export const getBoss = (slug: string) => bosses.find((boss) => boss.slug === slug);
