import type { NormalizedDataset, NormalizedMove } from "../schemas";

const STAB_MULTIPLIER = 1.2;

function effectiveness(dataset: NormalizedDataset, attackType: string, defenderTypes: readonly string[]) {
  if (defenderTypes.length === 0) return 1;
  const row = dataset.typeEffectiveness.values[attackType];
  if (!row) throw new Error(`Type effectiveness row not found: ${attackType}`);
  return defenderTypes.reduce((value, defenderType) => {
    const multiplier = row[defenderType];
    if (!multiplier) throw new Error(`Type effectiveness is missing ${attackType} -> ${defenderType}`);
    return value * multiplier;
  }, 1);
}

function findMove(moves: readonly NormalizedMove[], name: string) {
  const move = moves.find((item) => item.name === name);
  if (!move?.pve || move.pve.durationMs === undefined) throw new Error(`PvE move metrics missing: ${name}`);
  return move;
}

export function calculateRelativeCycleProfile(
  dataset: NormalizedDataset,
  pokemonId: string,
  fastMoveName: string,
  chargedMoveName: string,
  label: string,
  defenderTypes: readonly string[],
) {
  const pokemon = dataset.pokemon.find((item) => item.id === pokemonId);
  const benchmark = dataset.decisionBenchmarks.find((item) => item.id === pokemonId);
  if (!pokemon && !benchmark) throw new Error(`Pokemon not found: ${pokemonId}`);
  const fast = pokemon ? findMove(pokemon.moves.fast, fastMoveName) : findMove([benchmark!.fastMove], fastMoveName);
  const charged = pokemon ? findMove(pokemon.moves.charged, chargedMoveName) : findMove([benchmark!.chargedMove], chargedMoveName);
  const fastEnergy = fast.pve!.energyDelta;
  const chargedEnergy = Math.abs(charged.pve!.energyDelta);
  if (fastEnergy <= 0 || chargedEnergy <= 0) throw new Error(`Invalid PvE energy values: ${fastMoveName}/${chargedMoveName}`);
  const fastUsesPerCharged = Math.ceil(chargedEnergy / fastEnergy);
  const types = pokemon?.types.values ?? benchmark!.types;
  const baseAttack = pokemon?.baseStats.attack ?? benchmark!.baseAttack;
  const fastStab = types.includes(fast.pve!.type) ? STAB_MULTIPLIER : 1;
  const chargedStab = types.includes(charged.pve!.type) ? STAB_MULTIPLIER : 1;
  const fastEffectiveness = effectiveness(dataset, fast.pve!.type, defenderTypes);
  const chargedEffectiveness = effectiveness(dataset, charged.pve!.type, defenderTypes);
  const cycleDamage = fastUsesPerCharged * fast.pve!.power * fastStab * fastEffectiveness
    + charged.pve!.power * chargedStab * chargedEffectiveness;
  const cycleSeconds = (fastUsesPerCharged * fast.pve!.durationMs! + charged.pve!.durationMs!) / 1_000;
  const relativeCycleIndex = baseAttack * cycleDamage / cycleSeconds;
  return {
    subjectId: pokemonId,
    label,
    fastMove: fastMoveName,
    chargedMove: chargedMoveName,
    targetProfile: defenderTypes.length ? defenderTypes.join("/") : "neutral",
    defenderTypes: [...defenderTypes],
    fastEffectiveness,
    chargedEffectiveness,
    fastUsesPerCharged,
    cycleSeconds: Number(cycleSeconds.toFixed(3)),
    relativeCycleIndex: Number(relativeCycleIndex.toFixed(3)),
  };
}

export function buildKyuremRaidComparison(dataset: NormalizedDataset) {
  const combinations = [
    { pokemonId: "kyurem" as const, fast: "Dragon Breath", charged: "Glaciate" },
    { pokemonId: "white-kyurem" as const, fast: "Ice Fang", charged: "Ice Burn" },
    { pokemonId: "black-kyurem" as const, fast: "Dragon Tail", charged: "Freeze Shock" },
    { pokemonId: "black-kyurem" as const, fast: "Shadow Claw", charged: "Freeze Shock" },
  ];
  const profiles = combinations.flatMap((combination) => [
    calculateRelativeCycleProfile(dataset, combination.pokemonId, combination.fast, combination.charged, `${combination.pokemonId} neutral`, []),
    calculateRelativeCycleProfile(dataset, combination.pokemonId, combination.fast, combination.charged, `${combination.pokemonId} vs Dragon/Flying`, ["Dragon", "Flying"]),
  ]);
  const benchmarkProfiles = dataset.decisionBenchmarks.flatMap((benchmark) => [
    calculateRelativeCycleProfile(dataset, benchmark.id, benchmark.fastMove.name, benchmark.chargedMove.name, `${benchmark.id} neutral`, []),
    calculateRelativeCycleProfile(dataset, benchmark.id, benchmark.fastMove.name, benchmark.chargedMove.name, `${benchmark.id} vs Dragon/Flying`, ["Dragon", "Flying"]),
  ]);
  return {
    method: "relative_cycle_index_v1" as const,
    profiles: [...profiles, ...benchmarkProfiles],
    assumptions: [
      "PoGo API의 기본 공격, PvE 기술 위력·에너지·시전 시간과 타입 상성만 사용한다.",
      "자속 보정은 1.2배로 적용하고 이중 약점은 타입 상성 배율을 곱한다.",
      "스페셜 기술에 필요한 에너지는 노말 기술을 올림 횟수만큼 사용해 충전한다고 가정한다.",
    ],
    limitations: [
      "실제 Pokémon GO 피해량 반올림, 보스 방어, 기술 지연, 회피, 재입장, 날씨·우정·메가 보너스를 반영하지 않은 상대 비교 지표다.",
      "실제 레이드 시뮬레이션이나 타입별 공격수 순위가 아니며 DPS/TDO로 표현하면 안 된다.",
      "상대 기술과 생존 시간을 반영하지 않으므로 TDO 및 클리어 시간 판단에는 사용할 수 없다.",
    ],
    evidenceIds: [
      ...new Set([
        ...dataset.typeEffectiveness.evidenceIds,
        ...combinations.flatMap((combination) => {
          const pokemon = dataset.pokemon.find((item) => item.id === combination.pokemonId)!;
          return [
            ...pokemon.baseStats.evidenceIds,
            ...(pokemon.moves.fast.find((item) => item.name === combination.fast)?.evidenceIds ?? []),
            ...(pokemon.moves.charged.find((item) => item.name === combination.charged)?.evidenceIds ?? []),
          ];
        }),
        ...dataset.decisionBenchmarks.flatMap((benchmark) => [
          ...benchmark.evidenceIds,
          ...benchmark.fastMove.evidenceIds,
          ...benchmark.chargedMove.evidenceIds,
        ]),
      ]),
    ],
  };
}
