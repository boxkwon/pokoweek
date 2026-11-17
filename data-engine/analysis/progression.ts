import type { NormalizedDataset, PokemonId } from "../schemas";

const TARGET_LEVELS = [30, 35, 40, 50] as const;

function calculateCp(attack: number, defense: number, stamina: number, cpm: number) {
  return Math.max(10, Math.floor(attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpm ** 2 / 10));
}

function sumCosts(dataset: NormalizedDataset, startLevel: number, targetLevel: number) {
  return dataset.progression.powerUpRequirements
    .filter((item) => item.currentLevel >= startLevel && item.nextLevel <= targetLevel)
    .reduce((sum, item) => ({
      stardust: sum.stardust + item.stardust,
      candy: sum.candy + item.candy,
      xlCandy: sum.xlCandy + item.xlCandy,
    }), { stardust: 0, candy: 0, xlCandy: 0 });
}

export function buildPokemonProgression(dataset: NormalizedDataset, pokemonId: PokemonId) {
  const pokemon = dataset.pokemon.find((item) => item.id === pokemonId);
  if (!pokemon) throw new Error(`Pokemon not found: ${pokemonId}`);
  const cpmByLevel = new Map(dataset.progression.cpMultipliers.map((item) => [item.level, item]));
  const level50 = cpmByLevel.get(50);
  if (!level50) throw new Error("Level 50 CPM is missing.");
  const attack = pokemon.baseStats.attack + 15;
  const defense = pokemon.baseStats.defense + 15;
  const stamina = pokemon.baseStats.stamina + 15;
  let previousLevel = 20;
  let previousCp = calculateCp(attack, defense, stamina, cpmByLevel.get(20)!.multiplier);
  const levels = TARGET_LEVELS.map((level) => {
    const cpm = cpmByLevel.get(level);
    if (!cpm) throw new Error(`CPM is missing for level ${level}.`);
    const cp = calculateCp(attack, defense, stamina, cpm.multiplier);
    const result = {
      level,
      cpm: cpm.multiplier,
      cp,
      cpGainFromPreviousTarget: cp - previousCp,
      effectiveStatPercentOfLevel50: Number((cpm.multiplier / level50.multiplier * 100).toFixed(2)),
      cumulativeCostFromLevel20: sumCosts(dataset, 20, level),
      incrementalCostFromPreviousTarget: sumCosts(dataset, previousLevel, level),
      evidenceIds: [...new Set([
        ...cpm.evidenceIds,
        ...pokemon.baseStats.evidenceIds,
        ...dataset.progression.powerUpRequirements.flatMap((item) => item.evidenceIds),
        "reference:cp-formula",
      ])],
    };
    previousLevel = level;
    previousCp = cp;
    return result;
  });
  const cpReference = dataset.progression.cpReferences.find((item) => item.pokemonId === pokemonId);
  const calculatedLevel50Cp = levels.find((item) => item.level === 50)?.cp;
  if (cpReference && calculatedLevel50Cp !== cpReference.level50.cp) {
    throw new Error(`Calculated Lv.50 CP does not match the reviewed Lv.50 reference: ${pokemonId}`);
  }
  if (cpReference && cpReference.apiReportedMaxCp !== cpReference.level51.cp) {
    throw new Error(`PoGo API max CP does not match the reviewed Lv.51 Best Buddy reference: ${pokemonId}`);
  }
  return {
    pokemonId,
    ivAssumption: { attack: 15, defense: 15, stamina: 15 },
    costBaselineLevel: 20,
    levels,
    cpCrossCheck: cpReference ? {
      calculatedLevel50Cp,
      reviewedLevel50: cpReference.level50,
      apiReportedMaxCp: cpReference.apiReportedMaxCp,
      reviewedLevel51: cpReference.level51,
      result: "matched_distinct_level_contexts" as const,
      evidenceIds: cpReference.evidenceIds,
    } : null,
    notes: [
      "누적 비용은 일반·럭키·그림자·정화 보정이 없는 레벨 20 포획 개체를 기준으로 한다.",
      "effectiveStatPercentOfLevel50은 CPM 비율이며 실제 레이드 DPS 증가율이 아니다.",
      "각 강화는 0.5레벨 단위이며 레벨 40 초과 구간부터 XL사탕을 사용한다.",
      "PoGo API pokemon_max_cp는 이 데이터셋에서 Best Buddy가 적용된 레벨 51 상한이다. 레벨 50 계산값과 직접 비교하지 않는다.",
    ],
  };
}
