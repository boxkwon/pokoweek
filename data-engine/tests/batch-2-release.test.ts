import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { approveBatchTwo, publishBatchTwo } from "../batch-2/release";
import { BatchTwoCandidateBundleSchema } from "../batch-2/schemas";
import { BATCH_TWO_TARGETS, getBatchTwoPaths, validateBatchTwo } from "../batch-2/validate";
import { readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";

const QA_COMMIT = "908d9d9d2a12080e0d842bfe6a1b603e4e90b269";
const APPROVED_AT = "2026-11-26T21:00:00+09:00";

async function isolatedRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "pokoweek-batch2-release-"));
  for (const dir of ["normalized", "candidates", "evidence", "preview", "approved", "manifests"]) await cp(path.join(process.cwd(), "data", dir), path.join(root, dir), { recursive: true });
  await rm(getBatchTwoPaths(root).approval, { force: true });
  const approved = await readJson<{ id: string }[]>(getBatchTwoPaths(root).approved);
  await writeJsonAtomic(getBatchTwoPaths(root).approved, approved.filter((item) => !BATCH_TWO_TARGETS.includes(item.id as typeof BATCH_TWO_TARGETS[number])));
  return root;
}

async function options(root: string) {
  const { report } = await validateBatchTwo(root);
  return { reviewer: "boxkwon", qaCommitSha: QA_COMMIT, expectedCandidateHash: report.candidateHash, targets: BATCH_TWO_TARGETS, dataRoot: root, approvedAt: APPROVED_AT } as const;
}

test("Batch 2 guards exact allowlist, independent Deoxys forms, Shadow costs, and conditional Hydro Cannon", async () => {
  const root = await isolatedRoot();
  const { bundle, normalized, report } = await validateBatchTwo(root);
  assert.equal(report.structuralComplete, true);
  assert.deepEqual(report.issues, []);
  assert.equal(new Set(normalized.pokemon.filter((item) => item.id.startsWith("deoxys-")).map((item) => JSON.stringify(item.baseStats))).size, 3);
  for (const id of ["shadow-piloswine", "shadow-mudkip"] as const) assert.ok(normalized.pokemon.find((item) => item.id === id)!.progression.every((stage) => stage.cumulativeCost === null));
  assert.match(JSON.stringify(bundle.candidates.find((item) => item.pokemonId === "shadow-mudkip")), /현재 대단한 기술머신스페셜 사용 가능 여부는 게임에서 확인/);
  const opts = await options(root);
  await assert.rejects(() => approveBatchTwo({ ...opts, targets: BATCH_TWO_TARGETS.slice(0, 4), dryRun: true }), /Targets must be exactly/);
});

test("Batch 2 dry-run preserves 16 guides and projects exactly five standalone guides", async () => {
  const root = await isolatedRoot();
  const before = await readFile(getBatchTwoPaths(root).approved, "utf8");
  const opts = await options(root);
  const approval = await approveBatchTwo({ ...opts, dryRun: true });
  const publication = await publishBatchTwo({ targets: BATCH_TWO_TARGETS, dataRoot: root, dryRun: true, virtualApproval: opts });
  assert.equal(approval.existingApprovedCount, 16);
  assert.equal(approval.newApprovedCount, 5);
  assert.equal(approval.expectedTotalApprovedCount, 21);
  assert.deepEqual(publication.changedIds, [...BATCH_TWO_TARGETS]);
  assert.deepEqual(publication.deletedIds, []);
  assert.equal(publication.overlays.length, 21);
  assert.equal(new Set(publication.overlays.map((item) => item.id)).size, 21);
  assert.equal(await readFile(getBatchTwoPaths(root).approved, "utf8"), before);
});

test("Batch 2 approval and publication are idempotent and stale-safe", async () => {
  const root = await isolatedRoot();
  const opts = await options(root);
  assert.equal((await approveBatchTwo({ ...opts, dryRun: false })).noOp, false);
  assert.equal((await approveBatchTwo({ ...opts, dryRun: false })).noOp, true);
  assert.equal((await publishBatchTwo({ targets: BATCH_TWO_TARGETS, dataRoot: root, dryRun: false })).noOp, false);
  const bytes = await readFile(getBatchTwoPaths(root).approved, "utf8");
  assert.equal((await publishBatchTwo({ targets: BATCH_TWO_TARGETS, dataRoot: root, dryRun: false })).noOp, true);
  assert.equal(await readFile(getBatchTwoPaths(root).approved, "utf8"), bytes);
  const bundle = BatchTwoCandidateBundleSchema.parse(await readJson(getBatchTwoPaths(root).candidates));
  bundle.candidates[0].guide.summary += " stale";
  await writeJsonAtomic(getBatchTwoPaths(root).candidates, bundle);
  await assert.rejects(() => publishBatchTwo({ targets: BATCH_TWO_TARGETS, dataRoot: root, dryRun: false }), /stale/);
  assert.equal(await readFile(getBatchTwoPaths(root).approved, "utf8"), bytes);
});

test("Batch 2 publication preserves all existing 16 approved guide objects", async () => {
  const root = await isolatedRoot();
  const current = await readJson<{ id: string }[]>(getBatchTwoPaths(root).approved);
  const hashes = new Map(current.map((item) => [item.id, sha256(item)]));
  const opts = await options(root);
  const publication = await publishBatchTwo({ targets: BATCH_TWO_TARGETS, dataRoot: root, dryRun: true, virtualApproval: opts });
  for (const [id, hash] of hashes) assert.equal(sha256(publication.overlays.find((item) => item.id === id)), hash);
  const defenseBefore = current.find((item) => item.id === "deoxys-defense");
  const defenseAfter = publication.overlays.find((item) => item.id === "deoxys-defense");
  assert.equal(sha256(defenseAfter), sha256(defenseBefore));
});
