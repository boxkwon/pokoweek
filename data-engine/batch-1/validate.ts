import { readFile } from "node:fs/promises";
import path from "node:path";
import { readJson } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot } from "../lib/paths";
import { EvidenceRegistrySchema } from "../schemas";
import { BatchOneCandidateBundleSchema, BatchOneEvidenceSchema, BatchOneNormalizedDatasetSchema, type BatchOneCandidate, type BatchOnePokemonId } from "./schemas";

export const BATCH_ONE_TARGETS = ["super-mega-clefable", "mega-metagross", "shadow-cranidos", "shadow-tornadus-incarnate", "deoxys-defense"] as const;

export function getBatchOnePaths(root = dataRoot) {
  return {
    normalized: path.join(root, "normalized", "pokemon-guide-coverage-batch-1.json"),
    candidates: path.join(root, "candidates", "pokemon-guide-coverage-batch-1.json"),
    evidence: path.join(root, "evidence", "manual", "pokemon-guide-coverage-batch-1.json"),
    registry: path.join(root, "evidence", "registry.json"),
    validation: path.join(root, "validation", "pokemon-guide-coverage-batch-1.json"),
    editorial: path.join(root, "validation", "pokemon-guide-coverage-batch-1.md"),
    priority: path.join(root, "validation", "pokemon-guide-coverage-batch-1-priority.md"),
    preview: path.join(root, "preview", "pokemon-guide-coverage-batch-1-overlays.json"),
    approved: path.join(root, "approved", "app-guide-overlays.json"),
    approval: path.join(root, "manifests", "pokemon-guide-coverage-batch-1-approved.json"),
  } as const;
}

type Issue = { pokemonId?: BatchOnePokemonId; code: string; message: string; severity: "error" | "review" | "info" };

function editorialBlockers(candidate: BatchOneCandidate) {
  const guide = candidate.guide;
  const blockers: string[] = [];
  if (!guide.summary || !guide.reason || !guide.verdictLabel) blockers.push("핵심 육성 결론");
  if (Object.keys(guide.useCases).length === 0) blockers.push("활용도");
  if (Object.keys(guide.movesets).length === 0) blockers.push("추천 기술·습득 조건");
  if (!Array.isArray(candidate.guide.investment.order) || candidate.guide.investment.order.length === 0) blockers.push("육성 순서");
  for (const key of ["powerUp", "stardust", "candy", "secondMove", "xlCandy"]) {
    if (!(key in guide.investment)) blockers.push(`${key} 투자 판단`);
  }
  const progression = guide.progression as { stages?: { level: number; cumulativeCost?: unknown }[] } | undefined;
  if (!progression?.stages || progression.stages.map((stage) => stage.level).join(",") !== "30,35,40,50") blockers.push("Lv.30·35·40·50 강화 목표");
  if (!guide.ivAdvice || Object.keys(guide.ivAdvice).length === 0) blockers.push("개체 선택");
  if (guide.recommendations.length === 0) blockers.push("실행 행동");
  if (candidate.editorialStatus !== "ready") blockers.push("editorialStatus");
  return blockers;
}

function validateMoves(candidate: BatchOneCandidate, pokemon: ReturnType<typeof BatchOneNormalizedDatasetSchema.parse>["pokemon"][number], issues: Issue[]) {
  const fast = new Set([...pokemon.moves.fast, ...pokemon.moves.eliteFast]);
  const charged = new Set([...pokemon.moves.charged, ...pokemon.moves.eliteCharged, ...pokemon.moves.special]);
  for (const [mode, moveset] of Object.entries(candidate.guide.movesets)) {
    if (!moveset) continue;
    if (moveset.fastMove && !fast.has(moveset.fastMove.name)) issues.push({ pokemonId: candidate.pokemonId, code: "invalid_fast_move", message: `${mode}: ${moveset.fastMove.name}`, severity: "error" });
    for (const move of [moveset.chargedMove, moveset.chargedMove2]) {
      if (move && !charged.has(move.name)) issues.push({ pokemonId: candidate.pokemonId, code: "invalid_charged_move", message: `${mode}: ${move.name}`, severity: "error" });
    }
    const limited = [moveset.fastMove, moveset.chargedMove, moveset.chargedMove2].some((move) => move?.tags?.some((tag) => tag === "elite_tm" || tag === "elite_tm_check" || tag === "event_limited"));
    if (limited && !moveset.conditions?.length) issues.push({ pokemonId: candidate.pokemonId, code: "missing_move_condition", message: `${mode}: 한정 기술 조건 누락`, severity: "error" });
  }
}

function validateFinalDataGuards(candidate: BatchOneCandidate, issues: Issue[]) {
  const serialized = JSON.stringify(candidate.guide);
  if (candidate.pokemonId === "shadow-cranidos" || candidate.pokemonId === "shadow-tornadus-incarnate") {
    const progression = candidate.guide.progression as { costStatus?: string; stages?: { cumulativeCost?: unknown }[] } | undefined;
    if (progression?.costStatus !== "check_in_game" || progression.stages?.some((stage) => stage.cumulativeCost !== null)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "unverified_shadow_cost", message: "Shadow 강화 비용은 확정 숫자로 게시할 수 없습니다.", severity: "error" });
    }
    if (!/(게임에서|게임 내).*확인/.test(serialized)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "missing_shadow_cost_caveat", message: "Shadow 비용 게임 내 확인 문구가 필요합니다.", severity: "error" });
    }
  }
  if (/문포스트\+/.test(serialized)) {
    issues.push({ pokemonId: candidate.pokemonId, code: "invalid_localized_move", message: "Moonblast+ 한국어 명칭은 문포스+입니다.", severity: "error" });
  }
  if (candidate.pokemonId === "super-mega-clefable" && !serialized.includes("문포스+")) {
    issues.push({ pokemonId: candidate.pokemonId, code: "missing_super_mega_move", message: "문포스+ 규칙이 누락됐습니다.", severity: "error" });
  }
  if (candidate.pokemonId === "mega-metagross") {
    if (!/현재 습득 가능 여부를 게임에서 확인/.test(serialized) || !/일반 메타그로스.*메가 진화 중 전투 CP가 아닙니다/.test(serialized)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "mega_metagross_guard", message: "코멧펀치 조건 또는 기본형 CP 안내가 불충분합니다.", severity: "error" });
    }
  }
  if (candidate.pokemonId === "deoxys-defense") {
    const caps = candidate.guide.pvpLeagueTargets?.map((item) => item.cpLimit);
    if (JSON.stringify(caps) !== JSON.stringify([1500, 2500]) || !serialized.includes("최적 IV 순위를 생성하지 않았") || /\b\d+(?:\.\d+)?%\b/.test(serialized)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "unsupported_pvp_claim", message: "PvP CP 상한 또는 미검증 IV·승률 표현을 확인하세요.", severity: "error" });
    }
  }
}

export async function validateBatchOne(root = dataRoot) {
  const paths = getBatchOnePaths(root);
  const [normalizedRaw, candidatesRaw, evidenceRaw, registryRaw, approvedBytes] = await Promise.all([
    readJson<unknown>(paths.normalized), readJson<unknown>(paths.candidates), readJson<unknown>(paths.evidence), readJson<unknown>(paths.registry), readFile(paths.approved),
  ]);
  const normalized = BatchOneNormalizedDatasetSchema.parse(normalizedRaw);
  const bundle = BatchOneCandidateBundleSchema.parse(candidatesRaw);
  const evidence = BatchOneEvidenceSchema.parse(evidenceRaw);
  const registry = EvidenceRegistrySchema.parse(registryRaw);
  const issues: Issue[] = [];
  const ids = bundle.candidates.map((candidate) => candidate.pokemonId);
  if (new Set(ids).size !== 5 || BATCH_ONE_TARGETS.some((id) => !ids.includes(id))) issues.push({ code: "target_mismatch", message: "Batch 1은 선정된 5종만 포함해야 합니다.", severity: "error" });
  if (bundle.sourceSnapshotHash !== normalized.sourceSnapshotHash) issues.push({ code: "snapshot_mismatch", message: "원본 스냅샷 해시가 다릅니다.", severity: "error" });
  const packageHash = sha256(normalized);
  const knownEvidence = new Set([...registry.records, ...evidence.records].map((record) => record.id));
  const readiness = bundle.candidates.map((candidate) => {
    const pokemon = normalized.pokemon.find((item) => item.id === candidate.pokemonId);
    if (!pokemon) issues.push({ pokemonId: candidate.pokemonId, code: "missing_normalized", message: "정규화 데이터 누락", severity: "error" });
    else validateMoves(candidate, pokemon, issues);
    validateFinalDataGuards(candidate, issues);
    if (candidate.generatedBy.sourcePackageHash !== packageHash) issues.push({ pokemonId: candidate.pokemonId, code: "package_hash_mismatch", message: "입력 패키지 해시 불일치", severity: "error" });
    for (const evidenceId of candidate.evidenceIds) if (!knownEvidence.has(evidenceId)) issues.push({ pokemonId: candidate.pokemonId, code: "missing_evidence", message: evidenceId, severity: "error" });
    const blockers = editorialBlockers(candidate);
    return { pokemonId: candidate.pokemonId, structuralComplete: true, editorialReady: blockers.length === 0, blockers };
  });
  const reportBase = {
    schemaVersion: 1, generatedAt: bundle.generatedAt, normalizedHash: packageHash, candidateHash: sha256(bundle), approvedOverlayHashBefore: sha256(approvedBytes),
    targets: [...BATCH_ONE_TARGETS], structuralComplete: issues.every((issue) => issue.severity !== "error"), editorialReadiness: readiness, issues,
    approvalPerformed: false, publicationPerformed: false,
  };
  return { normalized, bundle, evidence, report: { ...reportBase, validationHash: sha256(reportBase) } };
}

