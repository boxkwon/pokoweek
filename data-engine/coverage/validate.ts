import { readFile } from "node:fs/promises";
import path from "node:path";
import { readJson } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot } from "../lib/paths";
import { EvidenceRegistrySchema } from "../schemas";
import {
  CoverageGuideCandidateBundleSchema,
  CoverageNormalizedDatasetSchema,
  type CoverageGuideCandidate,
  type CoveragePokemonId,
} from "./schemas";

export const COVERAGE_TARGETS = ["zamazenta-crowned", "druddigon", "orthworm", "zekrom", "reshiram"] as const;

export function getCoveragePaths(root = dataRoot) {
  return {
    normalized: path.join(root, "normalized", "pokemon-guide-coverage-v1.json"),
    candidates: path.join(root, "candidates", "pokemon-guide-coverage-v1.json"),
    evidence: path.join(root, "evidence", "registry.json"),
    validation: path.join(root, "validation", "pokemon-guide-coverage-v1.json"),
    editorial: path.join(root, "validation", "pokemon-guide-coverage-v1.md"),
    preview: path.join(root, "preview", "pokemon-guide-coverage-overlays.json"),
  } as const;
}

export const coveragePaths = getCoveragePaths();

type Issue = { pokemonId?: CoveragePokemonId; code: string; message: string; severity: "error" | "review" | "info" };

function candidateBlockers(candidate: CoverageGuideCandidate) {
  const guide = candidate.guide;
  const investment = guide.investment as Record<string, unknown>;
  const blockers: string[] = [];
  if (!guide.summary || !guide.reason || !guide.verdictLabel) blockers.push("핵심 육성 결론");
  if (Object.keys(guide.useCases).length === 0) blockers.push("활용도");
  if (Object.keys(guide.movesets).length === 0) blockers.push("추천 기술");
  if (!Array.isArray(investment.order) || investment.order.length === 0) blockers.push("강화 우선순위");
  for (const key of ["powerUp", "stardust", "candy", "secondMove", "xlCandy"]) {
    if (!(key in investment)) blockers.push(`${key} 투자 판단`);
  }
  const progression = guide.progression as { stages?: unknown[] } | undefined;
  if (!progression?.stages || progression.stages.length !== 4) blockers.push("Lv.30·35·40·50 강화 목표");
  if (!guide.ivAdvice || Object.keys(guide.ivAdvice).length === 0) blockers.push("개체 선택");
  if (guide.recommendations.length === 0) blockers.push("실행 행동");
  return blockers;
}

function validateMoves(candidate: CoverageGuideCandidate, pokemon: ReturnType<typeof CoverageNormalizedDatasetSchema.parse>["pokemon"][number], issues: Issue[]) {
  const fast = new Set(pokemon.moves.fast);
  const charged = new Set([...pokemon.moves.charged, ...pokemon.moves.special]);
  for (const [mode, moveset] of Object.entries(candidate.guide.movesets)) {
    if (!moveset) continue;
    if (moveset.fastMove && !fast.has(moveset.fastMove.name)) {
      issues.push({ pokemonId: candidate.pokemonId, code: "invalid_fast_move", message: `${mode}: ${moveset.fastMove.name}은 정규화 기술 목록에 없습니다.`, severity: "error" });
    }
    for (const move of [moveset.chargedMove, moveset.chargedMove2]) {
      if (move && !charged.has(move.name)) {
        issues.push({ pokemonId: candidate.pokemonId, code: "invalid_charged_move", message: `${mode}: ${move.name}은 정규화 기술 목록에 없습니다.`, severity: "error" });
      }
    }
    const limited = [moveset.fastMove, moveset.chargedMove, moveset.chargedMove2]
      .some((move) => move?.tags?.some((tag: string) => tag === "elite_tm" || tag === "elite_tm_check" || tag === "event_limited"));
    if (limited && !moveset.conditions?.length) {
      issues.push({ pokemonId: candidate.pokemonId, code: "missing_move_condition", message: `${mode}: 한정 기술 습득 조건이 없습니다.`, severity: "error" });
    }
  }
}

export async function validatePokemonGuideCoverage(root = dataRoot) {
  const paths = getCoveragePaths(root);
  const [normalizedRaw, candidateRaw, evidenceRaw, normalizedText] = await Promise.all([
    readJson<unknown>(paths.normalized),
    readJson<unknown>(paths.candidates),
    readJson<unknown>(paths.evidence),
    readFile(paths.normalized, "utf8"),
  ]);
  const normalized = CoverageNormalizedDatasetSchema.parse(normalizedRaw);
  const bundle = CoverageGuideCandidateBundleSchema.parse(candidateRaw);
  const registry = EvidenceRegistrySchema.parse(evidenceRaw);
  const issues: Issue[] = [];
  const ids = bundle.candidates.map((candidate) => candidate.pokemonId);
  if (new Set(ids).size !== COVERAGE_TARGETS.length || COVERAGE_TARGETS.some((id) => !ids.includes(id))) {
    issues.push({ code: "target_mismatch", message: "전수조사 B등급 5종만 정확히 포함해야 합니다.", severity: "error" });
  }
  if (bundle.sourceSnapshotHash !== normalized.sourceSnapshotHash) {
    issues.push({ code: "snapshot_hash_mismatch", message: "후보와 정규화 데이터의 원본 스냅샷 해시가 다릅니다.", severity: "error" });
  }
  const packageHash = sha256(normalizedText);
  const evidenceIds = new Set(registry.records.map((record) => record.id));
  const editorialReadiness = bundle.candidates.map((candidate) => {
    const pokemon = normalized.pokemon.find((item) => item.id === candidate.pokemonId);
    if (!pokemon) {
      issues.push({ pokemonId: candidate.pokemonId, code: "missing_normalized_pokemon", message: "정규화 포켓몬 데이터가 없습니다.", severity: "error" });
    } else {
      validateMoves(candidate, pokemon, issues);
    }
    if (candidate.generatedBy.sourcePackageHash !== packageHash) {
      issues.push({ pokemonId: candidate.pokemonId, code: "source_package_hash_mismatch", message: "후보가 기록한 입력 패키지 해시가 현재 정규화 파일과 다릅니다.", severity: "error" });
    }
    for (const id of candidate.evidenceIds) {
      if (!evidenceIds.has(id)) issues.push({ pokemonId: candidate.pokemonId, code: "missing_evidence", message: `등록되지 않은 Evidence ID: ${id}`, severity: "error" });
    }
    const blockers = candidateBlockers(candidate);
    if (candidate.editorialStatus !== "ready") blockers.push("editorialStatus가 ready가 아님");
    return { pokemonId: candidate.pokemonId, structuralComplete: true, editorialReady: blockers.length === 0, blockers };
  });
  const reportBase = {
    schemaVersion: 1,
    generatedAt: bundle.generatedAt,
    normalizedHash: packageHash,
    candidateHash: sha256(bundle),
    structuralComplete: issues.every((issue) => issue.severity !== "error"),
    editorialReadiness,
    issues,
    approvalPerformed: false,
    publicationPerformed: false,
  };
  return { normalized, bundle, report: { ...reportBase, validationHash: sha256(reportBase) } };
}
