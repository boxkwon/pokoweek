import { buildPokemonProgression } from "../analysis/progression";
import type { GuideCandidate, NormalizedDataset } from "../schemas";

export type AppGuideOverlay = {
  id: string;
  validationHash: string;
  approvedAt?: string;
  previewOnly?: boolean;
  guide: Record<string, unknown>;
};

function decisionValue(value: GuideCandidate["investment"]["stardust"] | null) {
  if (!value || value.decision === "not_applicable") return undefined;
  return value.decision;
}

function verdictValue(rating: number | null) {
  if (rating === null) return undefined;
  if (rating === 5) return "must_build";
  if (rating === 4) return "recommended";
  if (rating === 3) return "conditional";
  if (rating === 2) return "hold";
  return "low_priority";
}

const pokemonNames: Record<string, string> = {
  kyurem: "큐레무",
  reshiram: "레시라무",
  zekrom: "제크로무",
  "white-kyurem": "화이트큐레무",
  "black-kyurem": "블랙큐레무",
};

const moveNames: Record<string, string> = {
  Glaciate: "얼어붙은세계",
  "Ice Burn": "콜드플레어",
  "Freeze Shock": "프리즈볼트",
};

function presentationMode(candidate: GuideCandidate) {
  if (candidate.pokemonId === "kyurem") return "fusion-first" as const;
  if (candidate.pokemonId === "white-kyurem" || candidate.pokemonId === "black-kyurem") return "training-first" as const;
  return "default" as const;
}

function investmentDecision(value: GuideCandidate["investment"]["stardust"] | null) {
  return value ? value.analysis.reason : undefined;
}

function progressionGuide(candidate: GuideCandidate, dataset: NormalizedDataset) {
  const progression = buildPokemonProgression(dataset, candidate.pokemonId);
  const stageDecisions = new Map(candidate.investment.powerUpStages.map((item) => [Number(item.level), item]));
  const targetQuestion = candidate.decisionQuestions.find((item) => item.id === "power_up_target");
  return {
    ivLabel: "15/15/15 개체값 기준 예상 CP",
    costBaselineLabel: "Lv.20에서 시작하는 일반 포켓몬 기준 누적 비용",
    stages: progression.levels.map((stage, index) => {
      const decision = stageDecisions.get(stage.level);
      const nextCondition = targetQuestion?.conditions[index];
      return {
        level: stage.level,
        cp: stage.cp,
        decision: decision?.decision ?? "not_evaluated",
        reason: decision?.reason ?? "이 단계의 투자 판단은 검토되지 않았습니다.",
        stopCondition: nextCondition
          ? `다음 조건이 충족되지 않으면 Lv.${stage.level}에서 멈춰도 됩니다: ${nextCondition}`
          : "장기 주력으로 확정하지 않았다면 이 단계 이상의 추가 투자를 보류하세요.",
        cumulativeCost: stage.cumulativeCostFromLevel20,
        incrementalCost: stage.incrementalCostFromPreviousTarget,
      };
    }),
  };
}

function fusionSummary(candidate: GuideCandidate, dataset: NormalizedDataset) {
  const recipe = dataset.fusionRecipes.find((item) => item.resultPokemonId === candidate.pokemonId);
  if (!recipe) return undefined;
  const fieldEffect = recipe.fieldEffect.effect === "slow_target_ring"
    ? "포켓몬 포획 화면의 타겟 링이 느리게 움직입니다."
    : "등장한 포켓몬이 움직이지 않아 포획하기 쉬워집니다.";
  return {
    resultName: pokemonNames[recipe.resultPokemonId],
    partnerName: pokemonNames[recipe.partnerPokemonId],
    materials: recipe.materials.map((material) => {
      if (material.type === "energy") return { label: material.label, amount: material.amount };
      const name = pokemonNames[material.pokemonId] ?? material.pokemonId;
      return { label: material.type === "candy" ? `${name} 사탕` : name, amount: material.amount };
    }),
    specialMove: {
      sourceMove: moveNames[recipe.moveTransformation.sourceMove] ?? recipe.moveTransformation.sourceMove,
      targetMove: moveNames[recipe.moveTransformation.targetMove] ?? recipe.moveTransformation.targetMove,
      note: `${moveNames[recipe.moveTransformation.sourceMove] ?? recipe.moveTransformation.sourceMove}가 없어도 융합 자체는 가능합니다. 특별 기술을 원한다면 해당 기술을 보유한 다른 큐레무를 선택하거나 습득 가능 여부를 게임·공식 안내에서 확인한 뒤 진행하세요. 융합 후에는 일반·대단한 기술머신스페셜로 ${moveNames[recipe.moveTransformation.targetMove] ?? recipe.moveTransformation.targetMove}를 직접 배울 수 없습니다.`,
    },
    partnerNote: `큐레무가 ${pokemonNames[recipe.partnerPokemonId]}를 흡수합니다. 파트너는 융합 중 결합되어 별도 포켓몬으로 사용할 수 없지만, 영구 소모되지는 않습니다. 분리하면 돌아오며 에너지·사탕 비용은 없습니다. 융합 포켓몬은 교환·박사 전송·Pokémon HOME 전송이 제한됩니다.`,
    fieldEffect: {
      move: moveNames[recipe.fieldEffect.move] ?? recipe.fieldEffect.move,
      effect: fieldEffect,
      cost: `최초 ${recipe.fieldEffect.durationMinutes}분: 별의모래 ${recipe.fieldEffect.stardust.toLocaleString("ko-KR")} + 큐레무 사탕 ${recipe.fieldEffect.kyuremCandy}개`,
      extension: `${recipe.fieldEffect.extensionMinutes}분 단위로 연장하며, 한 번의 사용 동작에서 최대 ${recipe.fieldEffect.maxMinutesPerUse / 60}시간, 반복 사용으로 최대 ${recipe.fieldEffect.maxTotalMinutes / 60}시간까지 연장할 수 있습니다.`,
      exclusivity: "다른 필드 효과와 동시에 사용할 수 없습니다.",
    },
    source: { name: "Pokémon GO · 큐레무 합체 레이드 데이", url: "https://pokemongo.com/ko/news/kyurem-fusion-raid-day-2026" },
  };
}

export function projectCandidateForApp(
  candidate: GuideCandidate,
  metadata: Omit<AppGuideOverlay, "id" | "guide">,
  dataset?: NormalizedDataset,
): AppGuideOverlay {
  const useCases = Object.fromEntries(candidate.useCases.map((item) => [item.mode, {
    rating: item.performanceRating,
    reason: item.analysis.reason,
  }]));
  const movesets = Object.fromEntries(candidate.movesets.map((item) => [item.mode, {
    fastMove: { name: item.fastMove },
    chargedMove: { name: item.chargedMoves[0] },
    ...(item.chargedMoves[1] ? { chargedMove2: { name: item.chargedMoves[1] } } : {}),
    conditions: item.acquisitionConditions,
    reason: item.analysis.reason,
  }]));
  const eliteTmDecision = candidate.investment.eliteTm.decision;
  const eliteTm = eliteTmDecision === "high" ? "required"
    : eliteTmDecision === "recommended" ? "recommended"
      : eliteTmDecision === "conditional" ? "conditional" : "not_needed";
  const ivDecision = candidate.decisionQuestions.find((item) => item.id === "fusion_or_base");
  const verdict = verdictValue(candidate.performanceRating);

  return {
    id: candidate.pokemonId,
    ...metadata,
    guide: {
      overallRating: candidate.performanceRating,
      presentationMode: presentationMode(candidate),
      ...(verdict ? { verdict } : {}),
      verdictLabel: candidate.verdict.label,
      reason: candidate.verdict.label,
      summary: candidate.verdict.summary,
      useCases,
      movesets,
      investment: {
        order: candidate.investment.order.map(({ id, label, reason }) => ({ id, label, reason })),
        stardust: decisionValue(candidate.investment.stardust),
        candy: decisionValue(candidate.investment.candy),
        powerUp: decisionValue(candidate.investment.stardust),
        secondMove: decisionValue(candidate.investment.secondMove),
        xlCandy: decisionValue(candidate.investment.xlCandy),
        maxMove: decisionValue(candidate.investment.maxMove),
        eliteTm,
      },
      investmentReasons: {
        stardust: investmentDecision(candidate.investment.stardust),
        candy: investmentDecision(candidate.investment.candy),
        powerUp: investmentDecision(candidate.investment.stardust),
        secondMove: investmentDecision(candidate.investment.secondMove),
        xlCandy: investmentDecision(candidate.investment.xlCandy),
        maxMove: investmentDecision(candidate.investment.maxMove),
      },
      ...(dataset ? { progression: progressionGuide(candidate, dataset) } : {}),
      ...(dataset ? { fusionSummary: fusionSummary(candidate, dataset) } : {}),
      ...(ivDecision ? { ivAdvice: { general: `${ivDecision.conclusion} ${ivDecision.reason}` } } : {}),
      values: Object.fromEntries(candidate.useCases.map((item) => [item.mode, item.performanceRating])),
      valueReasons: Object.fromEntries(candidate.useCases.map((item) => [item.mode, item.analysis.reason])),
      recommendations: candidate.actions.map((item) => item.label),
    },
  };
}
