import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot } from "../lib/paths";
import { BatchOneCandidateBundleSchema, BatchOneEvidenceSchema, BatchOneNormalizedDatasetSchema, type BatchOnePokemonId } from "./schemas";

const GENERATED_AT = "2026-11-26T18:30:00+09:00";
const SNAPSHOT = "data/raw/pogoapi/2026-11-17T00-49-59-500Z";
const RAW_ROOT = path.join(process.cwd(), SNAPSHOT);
const TARGET_LEVELS = [30, 35, 40, 50] as const;
const CPM = new Map([[30, 0.7317000031471252], [35, 0.7615638375282288], [40, 0.79030001], [50, 0.84029999]]);
const STANDARD_COST = new Map([
  [30, { stardust: 75000, candy: 66, xlCandy: 0 }],
  [35, { stardust: 137000, candy: 130, xlCandy: 0 }],
  [40, { stardust: 225000, candy: 248, xlCandy: 0 }],
  [50, { stardust: 475000, candy: 248, xlCandy: 296 }],
]);

const ids = ["super-mega-clefable", "mega-metagross", "shadow-cranidos", "shadow-tornadus-incarnate", "deoxys-defense"] as const;
const rawTargets: Record<BatchOnePokemonId, { dex: number; form: string; name: string; special?: string[]; progressionBasis: "owned_base_form" | "current_form" | "shadow_game_check" }> = {
  "super-mega-clefable": { dex: 36, form: "Normal", name: "슈퍼 메가픽시", special: ["문포스+"], progressionBasis: "owned_base_form" },
  "mega-metagross": { dex: 376, form: "Normal", name: "메가메타그로스", progressionBasis: "owned_base_form" },
  "shadow-cranidos": { dex: 408, form: "Normal", name: "그림자 두개도스", progressionBasis: "shadow_game_check" },
  "shadow-tornadus-incarnate": { dex: 641, form: "Incarnate", name: "그림자 토네로스 화신폼", progressionBasis: "shadow_game_check" },
  "deoxys-defense": { dex: 386, form: "Defense", name: "테오키스 디펜스폼", progressionBasis: "current_form" },
};

const typeKo: Record<string, string> = { Fairy: "페어리", Steel: "강철", Psychic: "에스퍼", Rock: "바위", Flying: "비행" };
const moveKo: Record<string, string> = {
  "Dazzling Gleam": "매지컬샤인", Psychic: "사이코키네시스", Moonblast: "문포스", "Meteor Mash": "코멧펌치", Swift: "스피드스타", "Draining Kiss": "드레인키스",
  "Charge Beam": "차지빔", "Zen Headbutt": "사두기", Charm: "애교부리기", "Fairy Wind": "요정의바람", Pound: "막치기",
  "Flash Cannon": "러스터캐논", Earthquake: "지진", "Shadow Claw": "섬도클로", "Bullet Punch": "불릿펌치", "Fury Cutter": "연속자르기",
  "Rock Tomb": "암석봉인", "Ancient Power": "원시의힘", Bulldoze: "불도저", "Take Down": "돌진",
  "Grass Knot": "풀묶기", "Dark Pulse": "악의파동", "Hyper Beam": "파괴광선", Hurricane: "폭풍", Bite: "물기", "Air Slash": "에어슬래시",
  "Psycho Boost": "사이코부스트", Thunderbolt: "10만볼트", "Rock Slide": "스톤샤워", Counter: "카운터",
};

const evidenceIds = {
  stats: "pogoapi:pokemon_stats:ca23e7947d97",
  types: "pogoapi:pokemon_types:d2979fa632e6",
  moves: "pogoapi:current_pokemon_moves:8dff0aa9bb68",
  cpm: "pogoapi:cp_multiplier:61c96ee36079",
  costs: "pogoapi:pokemon_powerup_requirements:d8065e28e35b",
};

function calculateCp(attack: number, defense: number, stamina: number, level: number) {
  const cpm = CPM.get(level);
  if (!cpm) throw new Error(`Missing CPM: ${level}`);
  return Math.max(10, Math.floor((attack + 15) * Math.sqrt(defense + 15) * Math.sqrt(stamina + 15) * cpm ** 2 / 10));
}

function progression(pokemon: { baseStats: { attack: number; defense: number; stamina: number }; progressionBasis: string }) {
  return TARGET_LEVELS.map((level) => ({
    level,
    cp: calculateCp(pokemon.baseStats.attack, pokemon.baseStats.defense, pokemon.baseStats.stamina, level),
    cumulativeCost: pokemon.progressionBasis === "shadow_game_check" ? null : STANDARD_COST.get(level)!,
  }));
}

function stages(values: ReturnType<typeof progression>, decisions: ("recommended" | "conditional" | "hold" | "not_evaluated")[], reasons: string[], stops: string[]) {
  return values.map((item, index) => ({
    ...item,
    decision: decisions[index],
    reason: reasons[index],
    stopCondition: stops[index],
    ...(index > 0 && item.cumulativeCost && values[index - 1].cumulativeCost ? {
      incrementalCost: {
        stardust: item.cumulativeCost.stardust - values[index - 1].cumulativeCost!.stardust,
        candy: item.cumulativeCost.candy - values[index - 1].cumulativeCost!.candy,
        xlCandy: item.cumulativeCost.xlCandy - values[index - 1].cumulativeCost!.xlCandy,
      },
    } : {}),
  }));
}

const baseDataStatus = { counters: "missing", values: "ready", useCases: "ready", movesets: "ready", investment: "ready", ivAdvice: "ready" } as const;

function guideFor(id: BatchOnePokemonId, normalized: any) {
  const common = {
    name: normalized.displayName,
    overallRating: null,
    presentationMode: "training-first" as const,
    counters: [],
    counterRankingMode: "examples" as const,
    dataStatus: baseDataStatus,
    rating: null,
  };
  const p = normalized.progression;
  if (id === "super-mega-clefable") return {
    ...common, formName: "슈퍼 메가 · 메가 레벨 특수", category: "mega", categoryLabel: "슈퍼 메가", battleTypes: ["mega"], types: ["페어리"],
    image: { src: "/images/pokemon/pokeapi-36-clefable.png", alt: "슈퍼 메가픽시", scale: 1, objectPosition: "50% 54%" },
    verdict: "conditional", verdictLabel: "페어리 메가 보너스와 슈퍼 맥스를 쓸 때 육성", reason: "일반 픽시 강화와 메가 레벨 투자를 분리해 판단", summary: "먼저 습득한 픽시의 기술과 개체를 확인하세요. 슈퍼 메가 운용이 목표라면 메가 레벨을 먼저 올리고, 일반 CP 강화는 페어리 전력으로 반복 사용할 때만 진행하세요.",
    useCases: { mega: { rating: null, reason: "페어리 타입 메가 보너스와 문포스+ 활용이 핵심이며, 전체 메가 공격수 순위는 미평가입니다." }, raid: { rating: null, reason: "메가진화 중 페어리 약점 레이드에서 사용하되 상대와 팀 구성을 먼저 확인합니다." } },
    movesets: { mega: { fastMove: { name: "요정의바람", tags: ["fast_tm"] }, chargedMove: { name: "문포스+", tags: ["event_limited"] }, conditions: ["문포스+는 메가진화 중인 픽시가 사용하는 추가 스페셜 기술입니다.", "슈퍼 맥스는 지원 포켓몬만 해금할 수 있으며 메가 레벨 3 달성 후 추가 메가에너지 투자가 필요합니다."], reason: "메가 시스템과 전용 추가 기술을 함께 보는 조합입니다." } },
    investment: { order: [{ id: "catch", label: "픽시 획득·기술 확인" }, { id: "mega", label: "메가 레벨을 먼저 올리기" }, { id: "level30", label: "일반 픽시는 Lv.30까지 사용성 확인" }, { id: "level40", label: "반복 사용 시 Lv.40" }, { id: "xl", label: "장기 주력일 때만 XL" }], powerUp: "conditional", stardust: "conditional", candy: "recommended", secondMove: "low", megaEnergy: "high", xlCandy: "conditional", rareCandy: "low", eliteTm: "not_needed" },
    investmentReasons: { powerUp: "메가 보너스가 목표라면 CP 강화보다 메가 레벨을 먼저 확인하세요.", stardust: "페어리 전력으로 직접 반복 사용할 개체에만 쓰세요.", candy: "강화와 기술 해방보다 메가 운용 목표를 먼저 정하세요.", secondMove: "레이드 메가 보너스 목적이면 우선순위가 낮습니다.", megaEnergy: "슈퍼 맥스 진입에 메가에너지가 필요합니다.", xlCandy: "Lv.40에서 사용 빈도를 확인한 한 마리에만 쓰세요." },
    progressionContext: { mode: "reference", title: "획득한 일반 픽시 강화 참고", notice: "아래 CP는 일시적인 메가 전투 CP가 아니라 15/15/15 일반 픽시 기준입니다." },
    progression: { ivLabel: "15/15/15 일반 픽시 기준 예상 CP", costBaselineLabel: "Lv.20 일반 개체 기준 누적 비용", costStatus: "verified", costNote: "메가 레벨 투자 비용과 CP 강화 비용은 별개입니다.", stages: stages(p, ["conditional", "conditional", "conditional", "conditional"], ["CP 강화가 필요한지 먼저 확인합니다.", "반복 사용 시만 추가 투자합니다.", "일반 픽시를 직접 주력으로 쓸 때만 진행합니다.", "한 마리를 장기 주력으로 정한 경우만 진행합니다."], ["메가 보너스만 필요하면 여기서 멈춰도 됩니다.", "사용이 드물면 멈추세요.", "XL 주력으로 확정하지 않았다면 멈추세요.", "메가 레벨만 올릴 목적이면 XL을 쓰지 마세요."]) },
    ivAdvice: { general: "메가 레벨을 올릴 개체를 먼저 정하고, 직접 공격에 쓸 경우 공격 IV가 높은 개체를 우선합니다.", mega: "슈퍼 맥스 투자는 한 개체에 집중하되, 정확한 성능 순위는 미평가입니다." }, weaknesses: [{ type: "독" }, { type: "강철" }], values: { mega: null, raid: null }, valueReasons: { mega: "공식 슈퍼 맥스·문포스+ 규칙은 확인했으나 전체 순위는 미평가입니다.", raid: "시뮬레이션 없이 절대 성능을 단정하지 않습니다." }, recommendations: ["메가 레벨과 일반 CP 강화를 분리", "슈퍼 맥스 전에 지원 여부를 게임에서 확인", "반복 사용할 때만 XL 투자"], source: { name: "Pokémon GO · Clefable Super Mega Raid Day", url: "https://pokemongo.com/en/news/clefable-super-mega-raid-day-2026" }
  };
  if (id === "mega-metagross") return {
    ...common, formName: "메가 · 코멧펌치 확인", category: "mega", categoryLabel: "메가 레이드", battleTypes: ["mega", "raid"], types: ["강철", "에스퍼"], image: { src: "/images/pokemon/pm376.fMEGA.icon.png", alt: "메가메타그로스", scale: 1 },
    verdict: "recommended", verdictLabel: "코멧펌치를 확인한 주력 개체라면 육성", reason: "강철 레이드 역할과 메가 보너스를 함께 사용", summary: "메가진화할 메타그로스 한 마리를 정하고 불릿펌치·코멧펌치를 확인하세요. 코멧펌치 습득 가능 여부가 불분명하면 대단한 기술머신 사용 전 게임 목록을 확인하세요.",
    useCases: { raid: { rating: null, reason: "불릿펌치·코멧펌치로 강철 약점을 공략하는 목적이 분명합니다." }, mega: { rating: null, reason: "메가 보너스와 직접 공격을 함께 운용하되 절대 순위는 미평가입니다." } },
    movesets: { raid: { fastMove: { name: "불릿펌치", tags: ["fast_tm"] }, chargedMove: { name: "코멧펌치", tags: ["elite_tm_check"] }, conditions: ["코멧펌치는 현재 일반 기술 목록이 아닌 엘리트 기술 목록에 있습니다.", "대단한 기술머신스페셜 사용 전 현재 습득 가능 여부를 게임에서 확인하세요."], reason: "강철 타입 역할을 일치시키는 조합입니다." } },
    investment: { order: [{ id: "choose", label: "코멧펌치를 배울 좋은 개체 선택" }, { id: "move", label: "기술 습득 가능 여부 확인" }, { id: "30", label: "Lv.30에서 실전 확인" }, { id: "40", label: "강철 주력이면 Lv.40" }, { id: "50", label: "장기 주력 한 마리만 Lv.50" }], powerUp: "recommended", stardust: "recommended", candy: "recommended", secondMove: "low", megaEnergy: "high", xlCandy: "conditional", rareCandy: "low", eliteTm: "conditional" },
    investmentReasons: { powerUp: "기술과 개체를 확인한 뒤 Lv.30부터 단계적으로 강화하세요.", stardust: "메가진화과 일반 레이드에 반복 사용할 한 마리에 집중하세요.", candy: "Lv.40까지의 일반 사탕을 우선 사용하세요.", secondMove: "레이드 단일 역할이면 필수가 아닙니다.", megaEnergy: "메가 운용을 위해 먼저 필요합니다.", xlCandy: "Lv.40에서 사용 빈도를 확인한 장기 주력에만 사용하세요." },
    progression: { ivLabel: "15/15/15 일반 메타그로스 기준 예상 CP", costBaselineLabel: "Lv.20 일반 개체 기준 누적 비용", costStatus: "verified", costNote: "아래는 보유 중인 일반 메타그로스의 강화 기준이며 메가 진화 중 전투 CP가 아닙니다.", stages: stages(p, ["recommended", "conditional", "recommended", "conditional"], ["첫 실전 목표입니다.", "사용이 확인되면 추가 투자합니다.", "강철 주력으로 쓸 때 목표입니다.", "XL 장기 주력으로 확정한 경우만 진행합니다."], ["사용이 드물면 멈추세요.", "주력으로 확정하지 않았다면 멈추세요.", "XL 투자 계획이 없으면 멈추세요.", "여러 마리에 XL을 분산하지 마세요."]) },
    ivAdvice: { general: "메가진화할 한 마리를 정하고 직접 공격에 쓸 경우 공격 IV가 높은 개체를 우선하세요.", raid: "코멧펌치 보유 여부를 개체값과 함께 보세요.", mega: "메가 레벨을 올릴 개체를 자주 교체하지 않도록 선택하세요." }, weaknesses: [{ type: "불꽃" }, { type: "땅" }, { type: "고스트" }, { type: "악" }], values: { raid: null, mega: null }, valueReasons: { raid: "역할과 기술은 확인했으나 전체 순위는 미평가입니다.", mega: "메가 보너스 운용 가치는 있지만 절대 성능은 미평가입니다." }, recommendations: ["메가진화할 한 마리 선택", "코멧펌치 습득 가능 여부 확인", "Lv.40 이후는 장기 주력일 때만 투자"], source: { name: "PoGo API · Metagross move pool", url: "https://pogoapi.net/" }
  };
  if (id === "shadow-cranidos") return {
    ...common, formName: "그림자 · 진화 전 선택", category: "shadow", categoryLabel: "그림자 1성", battleTypes: ["shadow"], types: ["바위"], image: { src: "/images/pokemon/pokeapi-408-cranidos.png", alt: "그림자 두개도스", scale: 1 },
    verdict: "conditional", verdictLabel: "진화할 좋은 개체만 보관", reason: "두개도스 상태로 강화하지 않고 진화 목적을 먼저 확정", summary: "그림자 두개도스는 즉시 강화 대상이 아닙니다. 좋은 개체를 보관하고, 두개도스로 진화한 뒤 기술과 실전 역할을 확인한 다음 자원을 쓰세요.",
    useCases: { raid: { rating: null, reason: "현재 폼보다 진화 후 바위 공격 역할을 목표로 하되 전체 순위는 미평가입니다." }, special: { rating: null, reason: "그림자 자원 비용과 정화 여부를 분리해 판단합니다." } },
    movesets: { special: { conditions: ["두개도스 상태의 현재 기술은 진화 후 기술이 아닙니다.", "진화 후 실제 기술 목록을 확인하고 기술머신을 사용하세요."], reason: "진화 전에 특정 기술을 추천하면 잘못된 투자가 될 수 있어 기술 설정을 진화 후로 미룹니다." } },
    investment: { order: [{ id: "keep", label: "좋은 그림자 개체 보관" }, { id: "compare", label: "일반형·그림자 목적 비교" }, { id: "evolve", label: "육성할 개체만 진화" }, { id: "moves", label: "진화 후 기술 확인" }, { id: "power", label: "실전 역할 확인 후 강화" }], powerUp: "hold", stardust: "hold", candy: "recommended", secondMove: "low", xlCandy: "hold", rareCandy: "low", eliteTm: "not_needed" },
    investmentReasons: { powerUp: "진화 전 두개도스에는 강화하지 마세요.", stardust: "진화·기술·실전 역할을 확정한 후에만 사용하세요.", candy: "진화에 쓸 사탕을 먼저 보관하세요.", secondMove: "레이드 단일 역할에는 우선순위가 낮습니다.", xlCandy: "진화 후 Lv.40 사용성을 확인하기 전에는 쓰지 마세요." },
    progressionContext: { mode: "reference", title: "진화 전 CP 참고", notice: "강화 추천이 아닙니다. 아래 CP는 15/15/15 그림자 두개도스 자체의 참고값입니다." }, progression: { ivLabel: "15/15/15 두개도스 기준 예상 CP", costBaselineLabel: "그림자 보정 비용은 게임에서 확인", costStatus: "check_in_game", costNote: "일반 포켓몬 누적 비용을 그대로 표시하지 않았습니다.", stages: stages(p, ["hold", "hold", "hold", "hold"], ["진화 전 강화 보류", "진화 전 강화 보류", "진화 전 강화 보류", "진화 전 XL 보류"], ["진화 목적을 먼저 확정하세요.", "진화 전에는 멈추세요.", "진화 후 기술을 확인하세요.", "XL을 쓰지 마세요."]) },
    ivAdvice: { general: "진화해 실전에 쓸 개체라면 공격 IV가 높은 개체를 우선 보관하되, 정화를 일괄 권장하지 않습니다.", raid: "진화 후 바위 레이드 용도라면 공격 IV를 우선합니다." }, weaknesses: [{ type: "격투" }, { type: "땅" }, { type: "강철" }, { type: "물" }, { type: "풀" }], values: { raid: null, special: null }, valueReasons: { raid: "진화 후 비교 시뮬레이션이 없어 절대 순위는 미평가입니다.", special: "그림자 자원 판단만 제공합니다." }, recommendations: ["진화 전 강화 금지", "좋은 개체 보관 후 진화 목적 확정", "진화 후 기술과 사용성을 확인한 뒤 투자"], source: { name: "PoGo API · Cranidos data", url: "https://pogoapi.net/" }
  };
  if (id === "shadow-tornadus-incarnate") return {
    ...common, formName: "그림자 · 화신폼", category: "shadow", categoryLabel: "그림자 5성", battleTypes: ["shadow", "raid"], types: ["비행"], image: { src: "/images/pokemon/pokemon_icon_641_11.png", alt: "그림자 토네로스 화신폼", scale: 1 }, verdict: "conditional", verdictLabel: "비행 전력이 필요할 때만 육성", reason: "그림자 비용과 기존 비행 전력을 비교", summary: "에어슬래시·폭풍을 확인하고, 기존 비행 공격수가 부족할 때만 Lv.30부터 시험하세요. 정화 여부는 자동으로 결정하지 마세요.",
    useCases: { raid: { rating: null, reason: "비행 약점 상대에 쓸 수 있지만 다른 비행 전력과의 실전 순위는 미평가입니다." }, special: { rating: null, reason: "그림자 강화 비용과 정화 여부를 별도로 판단합니다." } }, movesets: { raid: { fastMove: { name: "에어슬래시", tags: ["fast_tm"] }, chargedMove: { name: "폭풍", tags: ["charged_tm"] }, conditions: ["화신폼의 현재 일반 기술 목록에서 확인한 비행 조합입니다."], reason: "비행 타입 역할을 일치시킵니다." } },
    investment: { order: [{ id: "choose", label: "화신폼·그림자 개체 확인" }, { id: "compare", label: "기존 비행 전력과 비교" }, { id: "moves", label: "에어슬래시·폭풍 설정" }, { id: "30", label: "Lv.30에서 사용성 확인" }, { id: "40", label: "반복 사용 시 Lv.40" }, { id: "50", label: "XL은 장기 주력일 때만" }], powerUp: "conditional", stardust: "conditional", candy: "conditional", secondMove: "low", xlCandy: "hold", rareCandy: "conditional", eliteTm: "not_needed" },
    investmentReasons: { powerUp: "기존 비행 전력이 부족할 때만 Lv.30부터 시험하세요.", stardust: "그림자 비용을 게임에서 확인한 한 마리에만 쓰세요.", candy: "전설 사탕과 이상한사탕 투자는 다른 전설과 비교하세요.", secondMove: "레이드 단일 역할에는 필수가 아닙니다.", xlCandy: "절대 순위 근거가 없으므로 Lv.40 후 장기 주력일 때만 검토하세요." }, progressionContext: { mode: "reference", title: "그림자 강화 CP 참고", notice: "CP는 15/15/15 기준이며, 그림자 보정 강화 비용은 보유 개체 화면에서 확인하세요." }, progression: { ivLabel: "15/15/15 화신폼 기준 예상 CP", costBaselineLabel: "그림자 보정 비용은 게임에서 확인", costStatus: "check_in_game", costNote: "일반 포켓몬 누적 비용을 그대로 적용하지 않았습니다.", stages: stages(p, ["conditional", "conditional", "conditional", "hold"], ["첫 실전 확인 구간입니다.", "사용이 확인될 때만 추가 투자합니다.", "비행 주력으로 쓸 때만 진행합니다.", "XL 근거가 충분하지 않으면 보류합니다."], ["사용이 드물면 멈추세요.", "주력이 아니면 멈추세요.", "XL 주력으로 확정하지 않았다면 멈추세요.", "시뮬레이션 근거 없이 XL을 쓰지 마세요."]) },
    ivAdvice: { general: "화신폼과 영물폼을 구분하고 그림자 화신폼 자체를 선택하세요.", raid: "레이드용은 공격 IV가 높은 개체를 우선하되, 정화를 일괄 권장하지 않습니다." }, weaknesses: [{ type: "전기" }, { type: "얼음" }, { type: "바위" }], values: { raid: null, special: null }, valueReasons: { raid: "비행 역할은 확인했지만 실제 순위는 미평가입니다.", special: "그림자 투자를 조건부로 유지합니다." }, recommendations: ["화신폼 ID 확인", "Lv.30에서 사용 빈도 확인", "정화나 XL은 자동 권장하지 않기"], source: { name: "PoGo API · Incarnate Tornadus data", url: "https://pogoapi.net/" }
  };
  return {
    ...common, formName: "디펜스폼 · PvP 전용 판단", category: "raid", categoryLabel: "5성 레이드", battleTypes: ["raid"], types: ["에스퍼"], image: { src: "/images/pokemon/pokemon_icon_386_12.png", alt: "테오키스 디펜스폼", scale: 1 }, verdict: "conditional", verdictLabel: "PvP 리그 목표가 있을 때만 육성", reason: "낮은 공격과 높은 방어를 CP 제한 리그에서 활용", summary: "디펜스폼을 다른 테오키스 폼과 구분하세요. 슈퍼리그는 CP 1,500, 하이퍼리그는 CP 2,500 이하 개체를 별도로 계산하고, 실제 투입할 개체에만 기술 해방하세요.",
    useCases: { pvp: { rating: null, reason: "높은 방어 능력치를 CP 제한 리그에서 활용하되 시뮬레이션 없이 티어를 단정하지 않습니다." }, raid: { rating: null, reason: "낮은 공격 능력치 때문에 레이드 공격수 강화는 권장하지 않습니다." } }, movesets: { pvp: { fastMove: { name: "카운터", tags: ["fast_tm"] }, chargedMove: { name: "스톤샤워", tags: ["charged_tm"] }, chargedMove2: { name: "10만볼트", tags: ["charged_tm"] }, conditions: ["세 기술은 디펜스폼의 현재 일반 기술 목록에 있습니다.", "실전 리그·팀 구성에 따라 조합이 달라질 수 있습니다."], reason: "압박과 커버리지를 함께 검토하는 PvP 조합입니다." } },
    investment: { order: [{ id: "form", label: "디펜스폼 확인" }, { id: "league", label: "슈퍼·하이퍼 중 목표 선택" }, { id: "iv", label: "해당 리그 CP와 IV 계산" }, { id: "moves", label: "카운터·스톤샤워 설정" }, { id: "unlock", label: "투입 확정 후 10만볼트 해방" }, { id: "power", label: "CP 상한 직전까지만 강화" }], powerUp: "conditional", stardust: "conditional", candy: "recommended", secondMove: "recommended", xlCandy: "conditional", rareCandy: "conditional", eliteTm: "not_needed" },
    investmentReasons: { powerUp: "고정 레벨이 아니라 보유 개체의 리그 CP 상한을 기준으로 강화하세요.", stardust: "실제 PvP 투입 개체에만 사용하세요.", candy: "기술 해방과 강화에 필요하므로 목표 리그를 먼저 정하세요.", secondMove: "PvP 투입이 확정되면 커버리지를 위해 추천합니다.", xlCandy: "선택한 리그의 CP 상한에 도달하는 데 실제로 필요한 개체에만 쓰세요." }, progressionContext: { mode: "reference", title: "리그 개체 선택 전 CP 참고", notice: "15/15/15 CP는 PvP 최적 IV 목표가 아닙니다. 보유 개체를 별도로 계산하세요." }, progression: { ivLabel: "15/15/15 디펜스폼 기준 예상 CP", costBaselineLabel: "Lv.20 일반 개체 기준 누적 비용", costStatus: "verified", costNote: "실제 리그 목표 비용은 IV와 포획 레벨에 따라 달라집니다.", stages: stages(p, ["not_evaluated", "not_evaluated", "not_evaluated", "not_evaluated"], ["PvP 최적 목표가 아닌 참고값입니다.", "보유 개체 CP를 우선합니다.", "하이퍼리그 목표에서도 개체별 계산이 필요합니다.", "고정 목표가 아니며 XL 필요 여부를 개체별로 보세요."], ["CP 1,500 또는 2,500을 넘기지 마세요.", "목표 리그에 맞지 않으면 멈추세요.", "CP 2,500 상한을 넘기지 마세요.", "개체별 계산 없이 XL을 쓰지 마세요."]) },
    pvpLeagueTargets: [{ league: "great", label: "슈퍼리그", cpLimit: 1500, decision: "conditional", reason: "디펜스폼의 내구를 CP 제한에서 활용합니다.", checkBeforePowerUp: "강화 후 CP 1,500 초과 여부를 확인하세요.", ivDirection: "최적 IV 순위를 생성하지 않았으므로 개체별 계산이 필요합니다.", powerUpTarget: "CP 1,500 이하", moveset: { fastMove: { name: "카운터" }, chargedMove: { name: "스톤샤워" }, chargedMove2: { name: "10만볼트" } }, secondMove: { decision: "recommended", reason: "실제 투입 시 커버리지에 필요합니다." }, xlCandy: { decision: "conditional", reason: "선택 개체가 상한 도달에 필요할 때만 사용합니다." }, useCase: { rating: null, reason: "매치업 시뮬레이션 없이 티어를 단정하지 않습니다." }, contextView: { verdictLabel: "슈퍼리그 개체로 계산 후 육성", summary: "CP 1,500 이하로 맞출 개체에만 투자하세요." } }, { league: "ultra", label: "하이퍼리그", cpLimit: 2500, decision: "conditional", reason: "더 높은 강화 비용과 XL 필요 여부를 함께 계산합니다.", checkBeforePowerUp: "강화 후 CP 2,500 초과 여부와 XL 비용을 확인하세요.", ivDirection: "슈퍼리그와 같은 IV 기준을 복사하지 마세요.", powerUpTarget: "CP 2,500 이하", moveset: { fastMove: { name: "카운터" }, chargedMove: { name: "스톤샤워" }, chargedMove2: { name: "10만볼트" } }, secondMove: { decision: "recommended", reason: "PvP 투입 시 추천합니다." }, xlCandy: { decision: "conditional", reason: "실제 개체의 CP 목표에 필요할 때만 사용합니다." }, useCase: { rating: null, reason: "시뮬레이션 근거 없이 상위 티어를 단정하지 않습니다." }, contextView: { verdictLabel: "하이퍼리그 자원을 계산한 뒤 육성", summary: "CP 2,500 이하와 필요 XL을 함께 계산하세요." } }],
    ivAdvice: { general: "디펜스폼과 다른 폼을 반드시 구분하세요.", raid: "레이드 공격수로는 강화하지 마세요.", pvp: "슈퍼·하이퍼 각 리그의 CP 상한에 맞는 개체를 별도로 계산하고 최적 IV를 임의로 단정하지 않습니다." }, weaknesses: [{ type: "벌레" }, { type: "고스트" }, { type: "악" }], values: { raid: null, pvp: null }, valueReasons: { raid: "낮은 공격 능력치로 공격수 투자는 보류합니다.", pvp: "역할은 확인했지만 현재 메타 순위는 미평가입니다." }, recommendations: ["디펜스폼 ID 확인", "목표 리그별 CP·IV 계산", "실제 투입 확정 후에만 기술 해방·XL 투자"], source: { name: "PoGo API · Defense Deoxys data", url: "https://pogoapi.net/" }
  };
}

export async function prepareBatchOne(root = dataRoot) {
  const [statsText, typesText, movesText] = await Promise.all([
    readFile(path.join(RAW_ROOT, "pokemon_stats.json"), "utf8"),
    readFile(path.join(RAW_ROOT, "pokemon_types.json"), "utf8"),
    readFile(path.join(RAW_ROOT, "current_pokemon_moves.json"), "utf8"),
  ]);
  const stats = JSON.parse(statsText) as any[];
  const types = JSON.parse(typesText) as any[];
  const moves = JSON.parse(movesText) as any[];
  const sourceSnapshotHash = sha256(`${statsText}\n${typesText}\n${movesText}`);
  const pokemon = ids.map((id) => {
    const target = rawTargets[id];
    const stat = stats.find((item) => item.pokemon_id === target.dex && item.form === target.form);
    const type = types.find((item) => item.pokemon_id === target.dex && item.form === target.form);
    const move = moves.find((item) => item.pokemon_id === target.dex && item.form === target.form);
    if (!stat || !type || !move) throw new Error(`Raw form missing: ${id}`);
    const item = {
      id, dexNumber: target.dex, displayName: target.name, form: id, sourceForm: target.form,
      types: type.type.map((value: string) => typeKo[value] ?? value),
      baseStats: { attack: stat.base_attack, defense: stat.base_defense, stamina: stat.base_stamina },
      moves: {
        fast: move.fast_moves.map((value: string) => moveKo[value] ?? value),
        charged: move.charged_moves.map((value: string) => moveKo[value] ?? value),
        eliteFast: move.elite_fast_moves.map((value: string) => moveKo[value] ?? value),
        eliteCharged: move.elite_charged_moves.map((value: string) => moveKo[value] ?? value),
        special: target.special ?? [],
      },
      progressionBasis: target.progressionBasis,
      evidenceIds: [evidenceIds.stats, evidenceIds.types, evidenceIds.moves, evidenceIds.cpm, evidenceIds.costs],
    };
    return { ...item, progression: progression(item) };
  });
  const normalized = BatchOneNormalizedDatasetSchema.parse({ schemaVersion: 1, generatedAt: GENERATED_AT, sourceSnapshot: SNAPSHOT, sourceSnapshotHash, pokemon });
  const sourcePackageHash = sha256(normalized);
  const evidence = BatchOneEvidenceSchema.parse({ schemaVersion: 1, generatedAt: GENERATED_AT, records: [
    { id: "official:super-mega-clefable-2026", sourceId: "pokemon-go-clefable-super-mega-raid-day-2026", sourceType: "manual", url: "https://pokemongo.com/en/news/clefable-super-mega-raid-day-2026", publisher: "Pokémon GO", reviewedAt: GENERATED_AT, sourceHash: sha256("Clefable Super Mega Raid Day: Mega Level 1, Super Max eligibility, Moonblast+ and event time"), reviewStatus: "reviewed", rawCollected: false, claim: "슈퍼 메가픽시 레이드데이, 슈퍼 맥스 해금, 문포스+ 규칙을 확인했다.", paths: ["pokemon.super-mega-clefable.mechanics"] },
    { id: "official:shadow-raids-rules", sourceId: "pokemon-go-shadow-raids", sourceType: "manual", url: "https://pokemongo.com/news/shadow-raids", publisher: "Pokémon GO", reviewedAt: GENERATED_AT, sourceHash: sha256("Official Shadow Raids rules and Purified Gem mechanics"), reviewStatus: "reviewed", rawCollected: false, claim: "그림자 레이드의 보스 강화·정화 결정이 일반형과 다른 판단이며 일괄 정화를 권장하지 않는 근거로 사용했다.", paths: ["pokemon.shadow-cranidos", "pokemon.shadow-tornadus-incarnate"] },
    { id: "secondary:mega-metagross-rotation-2026", sourceId: "leekduck-mega-metagross-november-2026", sourceType: "manual", url: "https://leekduck.com/events/mega-metagross-in-mega-raids-november-2026/", publisher: "Leek Duck", reviewedAt: GENERATED_AT, sourceHash: sha256("Mega Metagross November 2026 rotation"), reviewStatus: "reviewed", rawCollected: false, claim: "2026-11-25부터 메가메타그로스 레이드 로테이션을 보조 확인했다.", paths: ["schedule.mega-metagross"] },
    { id: "secondary:deoxys-rotation-2026", sourceId: "leekduck-deoxys-november-2026", sourceType: "manual", url: "https://leekduck.com/events/deoxys-normal-defense-attack-speed-formes-in-5-star-raid-battles-november-2026/", publisher: "Leek Duck", reviewedAt: GENERATED_AT, sourceHash: sha256("Four Deoxys formes November 2026 rotation"), reviewStatus: "reviewed", rawCollected: false, claim: "테오키스 4개 폼 로테이션에서 디펜스폼을 독립 폼으로 확인했다.", paths: ["schedule.deoxys-defense"] },
  ] });
  const evidenceById: Record<BatchOnePokemonId, string[]> = {
    "super-mega-clefable": [evidenceIds.stats, evidenceIds.types, evidenceIds.moves, evidenceIds.cpm, evidenceIds.costs, "official:super-mega-clefable-2026", "official:mega-evolution-rules", "official:mega-evolution-2026"],
    "mega-metagross": [evidenceIds.stats, evidenceIds.types, evidenceIds.moves, evidenceIds.cpm, evidenceIds.costs, "official:mega-evolution-rules", "secondary:mega-metagross-rotation-2026"],
    "shadow-cranidos": [evidenceIds.stats, evidenceIds.types, evidenceIds.moves, evidenceIds.cpm, "official:shadow-raids-rules"],
    "shadow-tornadus-incarnate": [evidenceIds.stats, evidenceIds.types, evidenceIds.moves, evidenceIds.cpm, "official:shadow-raids-rules"],
    "deoxys-defense": [evidenceIds.stats, evidenceIds.types, evidenceIds.moves, evidenceIds.cpm, evidenceIds.costs, "secondary:deoxys-rotation-2026"],
  };
  const candidates = normalized.pokemon.map((item) => ({
    pokemonId: item.id,
    generationMethod: "manual_ai" as const,
    generatedBy: { provider: "codex" as const, model: "gpt-6.2-sol", promptVersion: "pokemon-guide-coverage-batch-1-v1" as const, generatedAt: GENERATED_AT, sourcePackageHash },
    review: { status: "pending" as const },
    evidenceConfidence: item.id === "super-mega-clefable" ? "high" as const : "medium" as const,
    editorialStatus: "ready" as const,
    editorialLimitations: item.progressionBasis === "shadow_game_check"
      ? ["그림자 보정 누적 강화 비용은 게임 내 개체 화면에서 확인한다.", "전체 공격수 순위를 산출하지 않았다."]
      : ["전체 레이드·PvP 순위를 산출하지 않았다.", "보유 개체의 실제 IV·시작 레벨은 게임에서 확인한다."],
    evidenceIds: evidenceById[item.id],
    guide: guideFor(item.id, item),
  }));
  const bundle = BatchOneCandidateBundleSchema.parse({ schemaVersion: 1, runId: "manual-ai-d-grade-batch-1-2026-11-26", generatedAt: GENERATED_AT, sourceSnapshotHash, promptVersion: "pokemon-guide-coverage-batch-1-v1", usage: null, candidates });
  await Promise.all([
    writeJsonAtomic(path.join(root, "normalized", "pokemon-guide-coverage-batch-1.json"), normalized),
    writeJsonAtomic(path.join(root, "candidates", "pokemon-guide-coverage-batch-1.json"), bundle),
    writeJsonAtomic(path.join(root, "evidence", "manual", "pokemon-guide-coverage-batch-1.json"), evidence),
  ]);
  return { normalized, bundle, evidence };
}

