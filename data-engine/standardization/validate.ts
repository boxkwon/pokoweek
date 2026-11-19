import path from "node:path";
import { readJson } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot } from "../lib/paths";
import { EvidenceRegistrySchema, type EvidenceRegistry } from "../schemas";
import {
  StandardGuideCandidateBundleSchema,
  StandardGuidePokemonIdSchema,
  StandardGuideValidationReportSchema,
  StandardizedGuideDatasetSchema,
  type StandardGuideCandidate,
  type StandardGuidePokemonId,
} from "./schemas";

const TARGETS = ["cresselia", "mega-banette", "eternamax-eternatus"] as const satisfies readonly StandardGuidePokemonId[];

export function getStandardizationPaths(root = dataRoot) {
  return {
    dataset: path.join(root, "normalized", "pokemon-detail-standard-v1.json"),
    candidates: path.join(root, "candidates", "pokemon-detail-standard-v1.json"),
    evidence: path.join(root, "evidence", "registry.json"),
    validation: path.join(root, "validation", "pokemon-detail-standard-v1.json"),
    preview: path.join(root, "preview", "pokemon-detail-standard-overlays.json"),
    approval: path.join(root, "manifests", "pokemon-detail-standard-v1-approved.json"),
    approvedOverlays: path.join(root, "approved", "app-guide-overlays.json"),
  } as const;
}

export const standardizationPaths = getStandardizationPaths();

type Issue = {
  pokemonId?: StandardGuidePokemonId;
  code: string;
  message: string;
  severity: "error" | "review" | "info";
};

function collectEvidenceIds(value: unknown, output = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidenceIds(item, output));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if ((key === "evidenceIds" || key === "sourceEvidenceIds") && Array.isArray(item)) {
        item.forEach((id) => typeof id === "string" && output.add(id));
      } else {
        collectEvidenceIds(item, output);
      }
    }
  }
  return output;
}

function checkEvidence(candidate: StandardGuideCandidate, registry: EvidenceRegistry, issues: Issue[]) {
  const known = new Set(registry.records.map((record) => record.id));
  for (const evidenceId of collectEvidenceIds(candidate)) {
    if (!known.has(evidenceId)) {
      issues.push({
        pokemonId: candidate.pokemonId,
        code: "missing_evidence_reference",
        message: `등록되지 않은 Evidence ID: ${evidenceId}`,
        severity: "error",
      });
    }
  }
}

function checkMoves(candidate: StandardGuideCandidate, dataset: ReturnType<typeof StandardizedGuideDatasetSchema.parse>, issues: Issue[]) {
  const pokemon = dataset.pokemon.find((item) => item.id === candidate.pokemonId);
  if (!pokemon) return;
  const fastMoves = new Set(pokemon.moves.fast.flatMap((move) => [move.name, move.name.toLowerCase()]));
  const chargedMoves = new Set(pokemon.moves.charged.flatMap((move) => [move.name, move.name.toLowerCase()]));
  const localizedNames: Record<string, string> = {
    사이코커터: "Psycho Cut",
    풀묶기: "Grass Knot",
    문포스: "Moonblast",
    섀도클로: "Shadow Claw",
    섀도볼: "Shadow Ball",
    드래곤테일: "Dragon Tail",
    다이맥스포: "Dynamax Cannon",
  };
  const resolve = (name: string) => localizedNames[name] ?? name;

  const candidateMovesets = [
    ...Object.entries(candidate.guide.movesets),
    ...(candidate.guide.pvpLeagueTargets ?? []).flatMap((target) => target.moveset ? [[`pvp:${target.league}`, target.moveset] as const] : []),
  ];
  for (const [mode, moveset] of candidateMovesets) {
    if (!moveset) continue;
    if (moveset.fastMove && !fastMoves.has(resolve(moveset.fastMove.name))) {
      issues.push({ pokemonId: candidate.pokemonId, code: "invalid_fast_move", message: `${mode}: ${moveset.fastMove.name}은(는) 정규화 기술 목록에 없습니다.`, severity: "error" });
    }
    for (const move of [moveset.chargedMove, moveset.chargedMove2]) {
      if (move && !chargedMoves.has(resolve(move.name))) {
        issues.push({ pokemonId: candidate.pokemonId, code: "invalid_charged_move", message: `${mode}: ${move.name}은(는) 정규화 기술 목록에 없습니다.`, severity: "error" });
      }
    }
    const hasLimitedMove = [moveset.fastMove, moveset.chargedMove, moveset.chargedMove2]
      .some((move) => move?.tags?.some((tag) => tag === "elite_tm" || tag === "event_limited"));
    if (hasLimitedMove && (!moveset.conditions || moveset.conditions.length === 0)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "missing_acquisition_condition", message: `${mode}: 한정 기술의 습득 조건 안내가 없습니다.`, severity: "error" });
    }
  }
}

function answerability(candidate: StandardGuideCandidate) {
  const guide = candidate.guide;
  const investment = guide.investment as Record<string, unknown>;
  const order = Array.isArray(investment.order) ? investment.order : [];
  const blockers: string[] = [];
  if (!guide.reason || !guide.summary) blockers.push("최종 육성 판단");
  if (Object.keys(guide.movesets).length === 0) blockers.push("추천 기술");
  if (order.length === 0) blockers.push("실행 가능한 육성 순서");
  if (!("secondMove" in investment)) blockers.push("기술 해방 판단");
  if (!("xlCandy" in investment)) blockers.push("XL사탕 판단");
  if (!("stardust" in investment)) blockers.push("별의모래 판단");
  return blockers;
}

function checkTargetRules(candidate: StandardGuideCandidate, dataset: ReturnType<typeof StandardizedGuideDatasetSchema.parse>, issues: Issue[]) {
  const guide = candidate.guide;
  if (candidate.pokemonId === "cresselia") {
    const targets = guide.pvpLeagueTargets ?? [];
    if (targets.length !== 3 || new Set(targets.map((target) => target.league)).size !== 3) issues.push({ pokemonId: candidate.pokemonId, code: "missing_league_targets", message: "PvP 기준 포켓몬에는 Great·Ultra·Master 리그별 선택 안내가 필요합니다.", severity: "error" });
    const master = targets.find((target) => target.league === "master");
    if (master?.cpLimit !== undefined) issues.push({ pokemonId: candidate.pokemonId, code: "master_cp_cap_invalid", message: "Master League에는 임의 CP 상한을 지정하면 안 됩니다.", severity: "error" });
    if (targets.some((target) => !target.ivDirection || !target.powerUpTarget || !target.secondMove || !target.xlCandy || !target.useCase)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "league_decision_incomplete", message: "리그별 개체·강화·해방·XL·활용도 판단이 모두 필요합니다.", severity: "error" });
    }
    if (targets.some((target) => !target.contextView.order?.length || !target.contextView.investment?.stardust || !target.contextView.investment?.secondMove || !target.contextView.investment?.xlCandy || !target.contextView.ivAdvice?.general || !target.contextView.ivAdvice?.pvp)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "league_context_incomplete", message: "리그 선택이 Hero·육성 순서·개체 선택·별의모래·해방·XL 판단을 함께 변경해야 합니다.", severity: "error" });
    }
    if (master?.contextView.investment?.secondMove !== "hold" || master.contextView.investment?.xlCandy !== "hold" || master.contextView.investment?.stardust !== "hold") {
      issues.push({ pokemonId: candidate.pokemonId, code: "master_investment_conflict", message: "Master League 보류 판단이 전체 투자 상태와 일치하지 않습니다.", severity: "error" });
    }
    if (!guide.movesets.pvp) issues.push({ pokemonId: candidate.pokemonId, code: "missing_pvp_moveset", message: "PvP 추천 기술이 없습니다.", severity: "error" });
  }
  if (candidate.pokemonId === "mega-banette") {
    const action = guide.actionGuide as { type?: string; megaRestGuide?: { gameCheck?: string; superMaxNote?: string }; goals?: { requirements?: { amount?: number }[] }[] } | undefined;
    if (action?.type !== "mega") issues.push({ pokemonId: candidate.pokemonId, code: "invalid_mega_action", message: "메가진화 Action Guide가 필요합니다.", severity: "error" });
    if (!action?.goals?.[0]?.requirements?.some((item) => item.amount === dataset.mechanics.mega.firstEvolutionEnergy)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "mega_energy_mismatch", message: "첫 메가진화 에너지가 정규화 사실과 일치하지 않습니다.", severity: "error" });
    }
    if (!action?.megaRestGuide?.gameCheck?.includes("상세 화면")) issues.push({ pokemonId: candidate.pokemonId, code: "missing_mega_rest_check", message: "게임 내 남은 대기시간과 에너지 확인 방법이 필요합니다.", severity: "error" });
    if (!action?.megaRestGuide?.superMaxNote?.includes(String(dataset.mechanics.mega.restPolicy.superMaxRestHours)) || !action.megaRestGuide.superMaxNote.includes("확인되지")) {
      issues.push({ pokemonId: candidate.pokemonId, code: "invalid_super_max_guidance", message: "Super Max 대기시간과 메가다크펫 적용 미확인 안내가 필요합니다.", severity: "error" });
    }
  }
  if (candidate.pokemonId === "eternamax-eternatus") {
    const action = guide.actionGuide as {
      type?: string;
      eventId?: string;
      claimEndAt?: string;
      phaseGuidance?: Record<string, { summary?: string; view?: { presentationMode?: string; order?: unknown[]; recommendations?: string[] } }>;
      ownershipCondition?: { options?: { id?: string; summary?: string; steps?: { title?: string; description?: string }[]; checklist?: unknown[]; view?: { progressionContext?: { mode?: string; title?: string; notice?: string } }; phaseGuidance?: Record<string, unknown> }[] };
      conditionalCost?: { baseCost?: { label?: string; amount?: number }[]; activeCost?: { label?: string; amount?: number }[]; facts?: string[]; note?: string };
      goals?: { warnings?: { title?: string; description?: string }[] }[];
      relatedFormArtwork?: { label?: string; image?: { src?: string; placeholder?: boolean }; note?: string };
    } | undefined;
    if (action?.type !== "max_upgrade") issues.push({ pokemonId: candidate.pokemonId, code: "invalid_special_action", message: "특수 콘텐츠 Action Guide가 필요합니다.", severity: "error" });
    const warningText = action?.goals?.[0]?.warnings?.map((warning) => `${warning.title ?? ""} ${warning.description ?? ""}`).join(" ") ?? "";
    if (!warningText.includes("포획할 수 없")) issues.push({ pokemonId: candidate.pokemonId, code: "missing_uncatchable_warning", message: "무한다이맥스 보스가 포획 대상이 아니라는 안내가 없습니다.", severity: "error" });
    if (action?.eventId !== dataset.mechanics.eternatus.event.id) issues.push({ pokemonId: candidate.pokemonId, code: "event_link_mismatch", message: "Action Guide가 정규화된 Event ID와 연결되지 않았습니다.", severity: "error" });
    if (action?.claimEndAt !== dataset.mechanics.eternatus.event.claimEndAt) issues.push({ pokemonId: candidate.pokemonId, code: "claim_deadline_mismatch", message: "보상 수령 종료 시각이 정규화 사실과 일치하지 않습니다.", severity: "error" });
    if (!action?.phaseGuidance?.active || !action.phaseGuidance.claim_only || !action.phaseGuidance.ended || action.phaseGuidance.ended.view?.presentationMode !== "action-first") {
      issues.push({ pokemonId: candidate.pokemonId, code: "event_phase_guidance_incomplete", message: "진행·수령·종료 단계별 행동과 종료 후 포획 이력 선택 안내가 필요합니다.", severity: "error" });
    }
    const ownershipOptions = action?.ownershipCondition?.options ?? [];
    const neverCaught = ownershipOptions.find((option) => option.id === "never-caught");
    const caughtBefore = ownershipOptions.find((option) => option.id === "caught-before");
    if (!neverCaught || !caughtBefore) issues.push({ pokemonId: candidate.pokemonId, code: "ownership_branch_missing", message: "미포획·기존 포획 보상 분기가 모두 필요합니다.", severity: "error" });
    if ([neverCaught, caughtBefore].some((option) => !option?.view || !option?.phaseGuidance?.claim_only || !option?.phaseGuidance?.ended)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "ownership_phase_matrix_incomplete", message: "각 포획 이력에 진행·수령·종료 안내가 모두 필요합니다.", severity: "error" });
    }
    const baseProgressionContext = guide.progressionContext as { mode?: string; title?: string; notice?: string } | undefined;
    if (baseProgressionContext?.mode !== "reference" || !baseProgressionContext.title?.includes("참고") || !baseProgressionContext.notice) {
      issues.push({ pokemonId: candidate.pokemonId, code: "unselected_progression_not_neutral", message: "포획 이력 미선택 상태의 CP 강화 카드는 중립적인 참고 정보로 표시해야 합니다.", severity: "error" });
    }
    if (neverCaught?.view?.progressionContext?.mode !== "reference" || neverCaught.view.progressionContext.title !== "획득 후 강화 참고" || !neverCaught.view.progressionContext.notice?.includes("강화 투자는 진행할 수 없습니다")) {
      issues.push({ pokemonId: candidate.pokemonId, code: "unowned_progression_not_reference", message: "미포획 상태의 CP 강화 카드는 획득 후 참고용이며 추천 상태를 노출하면 안 됩니다.", severity: "error" });
    }
    if (caughtBefore?.view?.progressionContext?.mode !== "default") {
      issues.push({ pokemonId: candidate.pokemonId, code: "owned_progression_not_restored", message: "기존 포획 상태에서는 원래 CP 강화 로드맵을 복원해야 합니다.", severity: "error" });
    }
    const neverCaughtEnded = JSON.stringify(neverCaught?.phaseGuidance?.ended ?? {});
    if (/보유한 무한다이노 선택|현재 보유 개체 확인|보유 개체의 다이맥스포|단계 육성|Lv\.30|조우 보상 받기|GO Pass 랭크 (?:진행|올리기)/.test(neverCaughtEnded)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "expired_never_caught_action_invalid", message: "종료 후 미포획자에게 보유 개체·강화·GO Pass 진행을 현재 행동으로 안내하면 안 됩니다.", severity: "error" });
    }
    const caughtCopy = JSON.stringify(caughtBefore ?? {});
    const promisesEncounterReward = /(?:신규\s*)?조우\s*보상\s*(?:받기|수령|획득)/.test(caughtCopy);
    if (!caughtCopy.includes(String(dataset.mechanics.eternatus.event.alreadyCaughtCandy)) || promisesEncounterReward) {
      issues.push({ pokemonId: candidate.pokemonId, code: "owned_reward_invalid", message: "기존 포획자 분기는 사탕 100개를 안내하고 신규 조우를 약속하지 않아야 합니다.", severity: "error" });
    }
    const baseCost = action?.conditionalCost?.baseCost ?? [];
    const activeCost = action?.conditionalCost?.activeCost ?? [];
    const hasCost = (costs: typeof baseCost, label: string, amount: number) => costs.some((cost) => cost.label === label && cost.amount === amount);
    if (!hasCost(baseCost, "별의모래", dataset.mechanics.eternatus.adventureEffect.stardust) || !hasCost(baseCost, "무한다이노 사탕", dataset.mechanics.eternatus.adventureEffect.candy)
      || !hasCost(activeCost, "별의모래", dataset.mechanics.eternatus.event.rank35AdventureEffectDiscount.stardust) || !hasCost(activeCost, "무한다이노 사탕", dataset.mechanics.eternatus.event.rank35AdventureEffectDiscount.candy)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "rank35_cost_mismatch", message: "기본·랭크 35 필드 효과 비용이 정규화 사실과 일치하지 않습니다.", severity: "error" });
    }
    if (!action?.conditionalCost?.note?.includes("CP 강화 비용")) issues.push({ pokemonId: candidate.pokemonId, code: "discount_scope_missing", message: "필드 효과 할인과 CP 강화 비용을 구분해야 합니다.", severity: "error" });
    const fieldFacts = action?.conditionalCost?.facts?.join(" ") ?? "";
    for (const requiredFact of ["10분", "2시간", "24시간", "동시에 사용 불가"]) {
      if (!fieldFacts.includes(requiredFact)) issues.push({ pokemonId: candidate.pokemonId, code: "field_effect_rule_missing", message: `필드 효과 규칙 누락: ${requiredFact}`, severity: "error" });
    }
    const progression = guide.progression as { costStatus?: string } | undefined;
    if (progression?.costStatus !== "check_in_game") issues.push({ pokemonId: candidate.pokemonId, code: "unverified_cost_exposed", message: "미검증 종별 강화 비용은 게임 내 확인 상태로 남겨야 합니다.", severity: "error" });
    const guideImage = guide.image as { src?: string; placeholder?: boolean } | undefined;
    if (!guideImage?.src?.includes("pokemon-official-artwork-890.png") || guideImage.placeholder === true) {
      issues.push({ pokemonId: candidate.pokemonId, code: "eternatus_artwork_missing", message: "Hero에는 일반 무한다이노 전용 로컬 아트워크가 필요합니다.", severity: "error" });
    }
    if (!action?.relatedFormArtwork?.image?.src?.includes("pokemon-official-artwork-10190.png") || action.relatedFormArtwork.image.placeholder === true || action.relatedFormArtwork.image.src === guideImage?.src) {
      issues.push({ pokemonId: candidate.pokemonId, code: "eternamax_artwork_missing", message: "무한다이맥스 보스는 일반 무한다이노와 다른 전용 로컬 아트워크가 필요합니다.", severity: "error" });
    }
  }
}

export async function validatePokemonDetailStandardization(options: { dataRoot?: string } = {}) {
  const paths = getStandardizationPaths(options.dataRoot);
  const issues: Issue[] = [];
  const dataset = StandardizedGuideDatasetSchema.parse(await readJson(paths.dataset));
  const bundle = StandardGuideCandidateBundleSchema.parse(await readJson(paths.candidates));
  const registry = EvidenceRegistrySchema.parse(await readJson(paths.evidence));

  if (bundle.sourceSnapshotHash !== dataset.sourceSnapshotHash) {
    issues.push({ code: "snapshot_mismatch", message: "후보와 정규화 데이터의 snapshot hash가 다릅니다.", severity: "error" });
  }
  const ids = bundle.candidates.map((candidate) => candidate.pokemonId);
  for (const target of TARGETS) {
    if (ids.filter((id) => id === target).length !== 1) {
      issues.push({ pokemonId: target, code: "target_count_invalid", message: `${target} 후보는 정확히 하나여야 합니다.`, severity: "error" });
    }
  }
  if (new Set(ids).size !== TARGETS.length) {
    issues.push({ code: "duplicate_candidate", message: "후보 ID가 중복되었습니다.", severity: "error" });
  }

  const readiness = bundle.candidates.map((candidate) => {
    checkEvidence(candidate, registry, issues);
    checkMoves(candidate, dataset, issues);
    checkTargetRules(candidate, dataset, issues);
    const blockers = answerability(candidate);
    if (candidate.review.status !== "pending") blockers.push("후보 상태가 pending이 아님");
    if (candidate.editorialStatus !== "ready") blockers.push("Editorial Ready가 아님");
    return { pokemonId: StandardGuidePokemonIdSchema.parse(candidate.pokemonId), ready: blockers.length === 0, blockers };
  });

  const base = {
    schemaVersion: 1 as const,
    generatedAt: new Date().toISOString(),
    datasetHash: sha256(dataset),
    candidateHash: sha256(bundle),
    schemaValid: true,
    issues,
    editorialReadiness: readiness,
    approvalPerformed: false as const,
    publicationPerformed: false as const,
  };
  const report = StandardGuideValidationReportSchema.parse({ ...base, validationHash: sha256(base) });
  return { dataset, bundle, report };
}
