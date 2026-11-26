import { readFile } from "node:fs/promises";
import path from "node:path";
import { readJson } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot } from "../lib/paths";
import { EvidenceRegistrySchema } from "../schemas";
import { BatchTwoCandidateBundleSchema, BatchTwoEvidenceSchema, BatchTwoNormalizedDatasetSchema, type BatchTwoCandidate, type BatchTwoPokemonId } from "./schemas";

export const BATCH_TWO_TARGETS = ["deoxys-normal", "deoxys-attack", "deoxys-speed", "shadow-piloswine", "shadow-mudkip"] as const;

export function getBatchTwoPaths(root = dataRoot) {
  return {
    normalized: path.join(root, "normalized", "pokemon-guide-coverage-batch-2.json"),
    candidates: path.join(root, "candidates", "pokemon-guide-coverage-batch-2.json"),
    evidence: path.join(root, "evidence", "manual", "pokemon-guide-coverage-batch-2.json"),
    registry: path.join(root, "evidence", "registry.json"),
    validation: path.join(root, "validation", "pokemon-guide-coverage-batch-2.json"),
    editorial: path.join(root, "validation", "pokemon-guide-coverage-batch-2.md"),
    priority: path.join(root, "validation", "pokemon-guide-coverage-batch-2-priority.md"),
    preview: path.join(root, "preview", "pokemon-guide-coverage-batch-2-overlays.json"),
    approved: path.join(root, "approved", "app-guide-overlays.json"),
    approval: path.join(root, "manifests", "pokemon-guide-coverage-batch-2-approved.json"),
  } as const;
}

type Issue = { pokemonId?: BatchTwoPokemonId; code: string; message: string; severity: "error" | "review" | "info" };

function editorialBlockers(candidate: BatchTwoCandidate) {
  const guide = candidate.guide;
  const blockers: string[] = [];
  if (!guide.summary || !guide.reason || !guide.verdictLabel) blockers.push("핵심 육성 결론");
  if (Object.keys(guide.useCases).length === 0) blockers.push("활용도");
  if (Object.keys(guide.movesets).length === 0) blockers.push("추천 기술");
  if (!Array.isArray(guide.investment.order) || guide.investment.order.length === 0) blockers.push("육성 순서");
  for (const key of ["powerUp", "stardust", "candy", "secondMove", "xlCandy"]) if (!(key in guide.investment)) blockers.push(`${key} 판단`);
  const progression = guide.progression as { stages?: { level: number }[] } | undefined;
  if (progression?.stages?.map((stage) => stage.level).join(",") !== "30,35,40,50") blockers.push("단계별 CP");
  if (!guide.ivAdvice || !guide.recommendations.length) blockers.push("개체·실행 안내");
  if (candidate.editorialStatus !== "ready") blockers.push("editorialStatus");
  return blockers;
}

function validateMoves(candidate: BatchTwoCandidate, pokemon: ReturnType<typeof BatchTwoNormalizedDatasetSchema.parse>["pokemon"][number], issues: Issue[]) {
  const evolutionGuide = candidate.pokemonId.startsWith("shadow-");
  const fast = new Set([...pokemon.moves.fast, ...pokemon.moves.eliteFast, ...(evolutionGuide ? [...pokemon.moves.evolutionFast, ...pokemon.moves.evolutionEliteFast] : [])]);
  const charged = new Set([...pokemon.moves.charged, ...pokemon.moves.eliteCharged, ...(evolutionGuide ? [...pokemon.moves.evolutionCharged, ...pokemon.moves.evolutionEliteCharged] : [])]);
  for (const [mode, moveset] of Object.entries(candidate.guide.movesets)) {
    if (!moveset) continue;
    if (moveset.fastMove && !fast.has(moveset.fastMove.name)) issues.push({ pokemonId: candidate.pokemonId, code: "invalid_fast_move", message: `${mode}: ${moveset.fastMove.name}`, severity: "error" });
    for (const move of [moveset.chargedMove, moveset.chargedMove2]) if (move && !charged.has(move.name)) issues.push({ pokemonId: candidate.pokemonId, code: "invalid_charged_move", message: `${mode}: ${move.name}`, severity: "error" });
    const limited = [moveset.fastMove, moveset.chargedMove, moveset.chargedMove2].some((move) => move?.tags?.some((tag) => tag === "elite_tm" || tag === "elite_tm_check" || tag === "event_limited"));
    if (limited && !moveset.conditions?.length) issues.push({ pokemonId: candidate.pokemonId, code: "missing_move_condition", message: `${mode}: 한정 기술 조건 누락`, severity: "error" });
  }
}

function validateGuards(candidate: BatchTwoCandidate, issues: Issue[]) {
  const text = JSON.stringify(candidate.guide);
  if (candidate.pokemonId.startsWith("shadow-")) {
    const progression = candidate.guide.progression as { costStatus?: string; stages?: { cumulativeCost?: unknown }[] } | undefined;
    if (progression?.costStatus !== "check_in_game" || progression.stages?.some((stage) => stage.cumulativeCost !== null)) issues.push({ pokemonId: candidate.pokemonId, code: "shadow_cost", message: "Shadow 비용을 일반 비용으로 확정할 수 없습니다.", severity: "error" });
    if (!/(게임에서|게임 내).*확인/.test(text) || !/정화.*(?:일괄|자동).*권장하지/.test(text)) issues.push({ pokemonId: candidate.pokemonId, code: "shadow_decision", message: "Shadow 비용·정화 조건부 안내가 필요합니다.", severity: "error" });
  }
  if (candidate.pokemonId === "shadow-mudkip" && (!text.includes("과거 커뮤니티 데이 진화 한정") || !text.includes("현재 대단한 기술머신스페셜 사용 가능 여부는 게임에서 확인"))) issues.push({ pokemonId: candidate.pokemonId, code: "hydro_cannon_condition", message: "하이드로캐논의 현재 습득 가능성을 확정하면 안 됩니다.", severity: "error" });
  if (candidate.pokemonId.startsWith("deoxys-")) {
    if (!/최적 IV.*생성하지 않았/.test(text) || /\b\d+(?:\.\d+)?%\b|(?:레이드|PvP)\s*\d+위/.test(text)) issues.push({ pokemonId: candidate.pokemonId, code: "unsupported_rank", message: "미검증 IV·승률·순위를 생성할 수 없습니다.", severity: "error" });
    if (candidate.guide.overallRating !== null || candidate.guide.rating !== null) issues.push({ pokemonId: candidate.pokemonId, code: "unsupported_rating", message: "근거 없는 성능 점수를 생성할 수 없습니다.", severity: "error" });
  }
}

export async function validateBatchTwo(root = dataRoot) {
  const paths = getBatchTwoPaths(root);
  const [normalizedRaw, candidatesRaw, evidenceRaw, registryRaw, approvedBytes] = await Promise.all([readJson<unknown>(paths.normalized), readJson<unknown>(paths.candidates), readJson<unknown>(paths.evidence), readJson<unknown>(paths.registry), readFile(paths.approved)]);
  const normalized = BatchTwoNormalizedDatasetSchema.parse(normalizedRaw);
  const bundle = BatchTwoCandidateBundleSchema.parse(candidatesRaw);
  const evidence = BatchTwoEvidenceSchema.parse(evidenceRaw);
  const registry = EvidenceRegistrySchema.parse(registryRaw);
  const issues: Issue[] = [];
  const ids = bundle.candidates.map((item) => item.pokemonId);
  if (new Set(ids).size !== 5 || BATCH_TWO_TARGETS.some((id) => !ids.includes(id))) issues.push({ code: "target_mismatch", message: "Batch 2는 고정된 5종만 포함해야 합니다.", severity: "error" });
  if (bundle.sourceSnapshotHash !== normalized.sourceSnapshotHash) issues.push({ code: "snapshot_mismatch", message: "스냅샷 해시 불일치", severity: "error" });
  const packageHash = sha256(normalized);
  const knownEvidence = new Set([...registry.records, ...evidence.records].map((record) => record.id));
  const readiness = bundle.candidates.map((candidate) => {
    const pokemon = normalized.pokemon.find((item) => item.id === candidate.pokemonId);
    if (!pokemon) issues.push({ pokemonId: candidate.pokemonId, code: "missing_normalized", message: "정규화 데이터 누락", severity: "error" });
    else validateMoves(candidate, pokemon, issues);
    validateGuards(candidate, issues);
    if (candidate.generatedBy.sourcePackageHash !== packageHash) issues.push({ pokemonId: candidate.pokemonId, code: "package_hash_mismatch", message: "입력 패키지 해시 불일치", severity: "error" });
    for (const evidenceId of candidate.evidenceIds) if (!knownEvidence.has(evidenceId)) issues.push({ pokemonId: candidate.pokemonId, code: "missing_evidence", message: evidenceId, severity: "error" });
    const blockers = editorialBlockers(candidate);
    return { pokemonId: candidate.pokemonId, structuralComplete: true, editorialReady: blockers.length === 0, blockers };
  });
  const reportBase = { schemaVersion: 1, generatedAt: bundle.generatedAt, normalizedHash: packageHash, candidateHash: sha256(bundle), approvedOverlayHashBefore: sha256(approvedBytes), targets: [...BATCH_TWO_TARGETS], selectedFifth: "shadow-mudkip", structuralComplete: issues.every((issue) => issue.severity !== "error"), editorialReadiness: readiness, issues, approvalPerformed: false, publicationPerformed: false };
  return { normalized, bundle, evidence, report: { ...reportBase, validationHash: sha256(reportBase) } };
}
