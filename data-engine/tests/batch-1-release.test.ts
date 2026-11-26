import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { approveBatchOne, publishBatchOne } from "../batch-1/release";
import { BATCH_ONE_TARGETS, getBatchOnePaths, validateBatchOne } from "../batch-1/validate";
import { BatchOneCandidateBundleSchema } from "../batch-1/schemas";
import { readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";

const QA_COMMIT = "538e4598f08db6e10e351dbae49972184fb8b225";
const APPROVED_AT = "2026-11-26T12:00:00.000Z";

async function isolatedRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "pokoweek-batch1-release-"));
  for (const dir of ["normalized", "candidates", "evidence", "preview", "approved", "manifests"]) await cp(path.join(process.cwd(), "data", dir), path.join(root, dir), { recursive: true });
  await rm(getBatchOnePaths(root).approval, { force: true });
  const approved = await readJson<{ id: string }[]>(getBatchOnePaths(root).approved);
  await writeJsonAtomic(getBatchOnePaths(root).approved, approved.filter((item) => !BATCH_ONE_TARGETS.includes(item.id as typeof BATCH_ONE_TARGETS[number])));
  return root;
}

async function options(root: string) {
  const { report } = await validateBatchOne(root);
  return { reviewer: "boxkwon", qaCommitSha: QA_COMMIT, expectedCandidateHash: report.candidateHash, targets: BATCH_ONE_TARGETS, dataRoot: root, approvedAt: APPROVED_AT } as const;
}

test("Batch 1 final guards and exact allowlist pass only for the five reviewed guides", async () => {
  const root = await isolatedRoot();
  const { report } = await validateBatchOne(root);
  assert.equal(report.structuralComplete, true);
  assert.deepEqual(report.issues, []);
  const opts = await options(root);
  await assert.rejects(() => approveBatchOne({ ...opts, targets: BATCH_ONE_TARGETS.slice(0, 4), dryRun: true }), /Targets must be exactly/);
});

test("Batch 1 dry-run preserves the other 16 guides and projects exactly five standalone guides", async () => {
  const root = await isolatedRoot();
  const before = await readFile(getBatchOnePaths(root).approved, "utf8");
  const opts = await options(root);
  const approval = await approveBatchOne({ ...opts, dryRun: true });
  const publication = await publishBatchOne({ targets: BATCH_ONE_TARGETS, dataRoot: root, dryRun: true, virtualApproval: opts });
  assert.equal(approval.existingApprovedCount, 16);
  assert.equal(approval.newApprovedCount, 5);
  assert.equal(approval.expectedTotalApprovedCount, 21);
  assert.deepEqual(publication.changedIds, [...BATCH_ONE_TARGETS]);
  assert.deepEqual(publication.deletedIds, []);
  assert.equal(publication.overlays.length, 21);
  assert.ok(publication.overlays.filter((item) => BATCH_ONE_TARGETS.includes(item.id as typeof BATCH_ONE_TARGETS[number])).every((item) => item.standalone === true));
  assert.equal(await readFile(getBatchOnePaths(root).approved, "utf8"), before);
});

test("Batch 1 approve and publish are idempotent and reject stale candidates atomically", async () => {
  const root = await isolatedRoot();
  const opts = await options(root);
  const firstApproval = await approveBatchOne({ ...opts, dryRun: false });
  const secondApproval = await approveBatchOne({ ...opts, dryRun: false });
  assert.equal(firstApproval.noOp, false);
  assert.equal(secondApproval.noOp, true);
  const first = await publishBatchOne({ targets: BATCH_ONE_TARGETS, dataRoot: root, dryRun: false });
  const bytes = await readFile(getBatchOnePaths(root).approved, "utf8");
  const second = await publishBatchOne({ targets: BATCH_ONE_TARGETS, dataRoot: root, dryRun: false });
  assert.equal(first.noOp, false);
  assert.equal(second.noOp, true);
  assert.equal(await readFile(getBatchOnePaths(root).approved, "utf8"), bytes);
  const bundle = BatchOneCandidateBundleSchema.parse(await readJson(getBatchOnePaths(root).candidates));
  bundle.candidates[0].guide.summary += " stale";
  await writeJsonAtomic(getBatchOnePaths(root).candidates, bundle);
  await assert.rejects(() => publishBatchOne({ targets: BATCH_ONE_TARGETS, dataRoot: root, dryRun: false }), /stale/);
  assert.equal(await readFile(getBatchOnePaths(root).approved, "utf8"), bytes);
});

test("Batch 1 publication preserves every existing approved guide byte-semantically", async () => {
  const root = await isolatedRoot();
  const current = await readJson<{ id: string }[]>(getBatchOnePaths(root).approved);
  const hashes = new Map(current.map((item) => [item.id, sha256(item)]));
  const opts = await options(root);
  const publication = await publishBatchOne({ targets: BATCH_ONE_TARGETS, dataRoot: root, dryRun: true, virtualApproval: opts });
  for (const [id, hash] of hashes) assert.equal(sha256(publication.overlays.find((item) => item.id === id)), hash);
});
