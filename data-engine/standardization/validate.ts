import { readJson } from "../lib/files";
import { sha256 } from "../lib/hash";
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

export const standardizationPaths = {
  dataset: "data/normalized/pokemon-detail-standard-v1.json",
  candidates: "data/candidates/pokemon-detail-standard-v1.json",
  evidence: "data/evidence/registry.json",
  validation: "data/validation/pokemon-detail-standard-v1.json",
  preview: "data/preview/pokemon-detail-standard-overlays.json",
} as const;

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

  for (const [mode, moveset] of Object.entries(candidate.guide.movesets)) {
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
    if (!guide.pvpLeagueTargets) issues.push({ pokemonId: candidate.pokemonId, code: "missing_league_targets", message: "PvP 기준 포켓몬에는 리그 선택 안내가 필요합니다.", severity: "error" });
    if (!guide.movesets.pvp) issues.push({ pokemonId: candidate.pokemonId, code: "missing_pvp_moveset", message: "PvP 추천 기술이 없습니다.", severity: "error" });
  }
  if (candidate.pokemonId === "mega-banette") {
    const action = guide.actionGuide as { type?: string; goals?: { requirements?: { amount?: number }[] }[] } | undefined;
    if (action?.type !== "mega") issues.push({ pokemonId: candidate.pokemonId, code: "invalid_mega_action", message: "메가진화 Action Guide가 필요합니다.", severity: "error" });
    if (!action?.goals?.[0]?.requirements?.some((item) => item.amount === dataset.mechanics.mega.firstEvolutionEnergy)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "mega_energy_mismatch", message: "첫 메가진화 에너지가 정규화 사실과 일치하지 않습니다.", severity: "error" });
    }
  }
  if (candidate.pokemonId === "eternamax-eternatus") {
    const action = guide.actionGuide as { type?: string; goals?: { warnings?: { title?: string; description?: string }[] }[] } | undefined;
    if (action?.type !== "max_upgrade") issues.push({ pokemonId: candidate.pokemonId, code: "invalid_special_action", message: "특수 콘텐츠 Action Guide가 필요합니다.", severity: "error" });
    const warningText = action?.goals?.[0]?.warnings?.map((warning) => `${warning.title ?? ""} ${warning.description ?? ""}`).join(" ") ?? "";
    if (!warningText.includes("포획할 수 없")) issues.push({ pokemonId: candidate.pokemonId, code: "missing_uncatchable_warning", message: "무한다이맥스 보스가 포획 대상이 아니라는 안내가 없습니다.", severity: "error" });
    const progression = guide.progression as { costStatus?: string } | undefined;
    if (progression?.costStatus !== "check_in_game") issues.push({ pokemonId: candidate.pokemonId, code: "unverified_cost_exposed", message: "미검증 종별 강화 비용은 게임 내 확인 상태로 남겨야 합니다.", severity: "error" });
  }
}

export async function validatePokemonDetailStandardization() {
  const issues: Issue[] = [];
  const dataset = StandardizedGuideDatasetSchema.parse(await readJson(standardizationPaths.dataset));
  const bundle = StandardGuideCandidateBundleSchema.parse(await readJson(standardizationPaths.candidates));
  const registry = EvidenceRegistrySchema.parse(await readJson(standardizationPaths.evidence));

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
