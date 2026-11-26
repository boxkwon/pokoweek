import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { applyGuideOverlayRecords } from "../../app/_data/approved-guide-adapter";
import { pokemonGuides } from "../../app/_data/guide-data";
import {
  approveCoverageGuides,
  coverageFileHash,
  coverageValidationFingerprint,
  planCoverageGuideApproval,
  publishCoverageGuides,
} from "../coverage/release";
import { CoverageGuideCandidateBundleSchema } from "../coverage/schemas";
import { COVERAGE_TARGETS, getCoveragePaths, validatePokemonGuideCoverage } from "../coverage/validate";
import { sha256 } from "../lib/hash";
import { writeJsonAtomic } from "../lib/files";

const QA_COMMIT = "aaf15f44e0507745744d8f52f2f4a3cffdb74597";
const APPROVED_AT = "2026-11-26T00:00:00.000Z";

async function readJson(file: string) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function createIsolatedDataRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "pokoweek-coverage-release-"));
  for (const directory of ["normalized", "candidates", "evidence", "preview", "approved", "manifests"]) {
    await cp(path.join(process.cwd(), "data", directory), path.join(root, directory), { recursive: true });
  }
  const paths = getCoveragePaths(root);
  await rm(paths.approval, { force: true });
  const approved = await readJson(paths.approvedOverlays) as { id: string }[];
  await writeJsonAtomic(
    paths.approvedOverlays,
    approved.filter((overlay) => !COVERAGE_TARGETS.includes(overlay.id as typeof COVERAGE_TARGETS[number])),
  );
  return root;
}

async function approvalOptions(dataRoot: string) {
  const { report } = await validatePokemonGuideCoverage(dataRoot);
  return {
    reviewer: "boxkwon",
    qaCommitSha: QA_COMMIT,
    expectedCandidateHash: report.candidateHash,
    targets: COVERAGE_TARGETS,
    dataRoot,
    approvedAt: APPROVED_AT,
  } as const;
}

test("coverage release recognizes the dataset and exact five-Pokemon allowlist", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const plan = await planCoverageGuideApproval(options);
  assert.equal(plan.manifest.dataset, "pokemon-guide-coverage-v1");
  assert.deepEqual(plan.manifest.targets, [...COVERAGE_TARGETS]);
  assert.equal(plan.manifest.guides.length, 5);
  assert.equal(plan.existingApprovedCount, 16);
  assert.equal(plan.newApprovedCount, 5);
  assert.equal(plan.expectedTotalApprovedCount, 21);
  assert.equal(plan.manifest.validationHash, coverageValidationFingerprint(plan.report));
  await assert.rejects(
    () => planCoverageGuideApproval({ ...options, targets: COVERAGE_TARGETS.slice(0, 4) }),
    /Targets must be exactly/,
  );
  await assert.rejects(
    () => planCoverageGuideApproval({ ...options, targets: [...COVERAGE_TARGETS, "kyurem"] }),
    /Targets must be exactly/,
  );
});

test("coverage approve and publish dry-runs return deterministic hashes without persistent writes", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const paths = getCoveragePaths(dataRoot);
  const approvedBefore = await readFile(paths.approvedOverlays, "utf8");

  const approval = await approveCoverageGuides({ ...options, dryRun: true });
  assert.equal(approval.noOp, false);
  assert.equal(approval.manifestFileHash, coverageFileHash(approval.manifest));
  await assert.rejects(() => readFile(paths.approval, "utf8"), /ENOENT/);

  const publication = await publishCoverageGuides({
    targets: COVERAGE_TARGETS,
    dataRoot,
    dryRun: true,
    virtualApproval: options,
  });
  assert.deepEqual(publication.changedIds, [...COVERAGE_TARGETS]);
  assert.deepEqual(publication.deletedIds, []);
  assert.equal(publication.overlays.length, 21);
  assert.equal(publication.resultFileHash, coverageFileHash(publication.overlays));
  assert.equal(await readFile(paths.approvedOverlays, "utf8"), approvedBefore);
});

test("coverage approval and publication are idempotent and preserve all existing approved guides", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const paths = getCoveragePaths(dataRoot);
  const existing = await readJson(paths.approvedOverlays) as { id: string }[];
  const existingHashes = new Map(existing.map((overlay) => [overlay.id, sha256(overlay)]));

  const firstApproval = await approveCoverageGuides({ ...options, dryRun: false });
  const secondApproval = await approveCoverageGuides({ ...options, dryRun: false });
  assert.equal(firstApproval.noOp, false);
  assert.equal(secondApproval.noOp, true);
  assert.equal(firstApproval.manifestFileHash, secondApproval.manifestFileHash);

  const firstPublish = await publishCoverageGuides({ targets: COVERAGE_TARGETS, dataRoot, dryRun: false });
  const firstPublishedBytes = await readFile(paths.approvedOverlays, "utf8");
  const secondPublish = await publishCoverageGuides({ targets: COVERAGE_TARGETS, dataRoot, dryRun: false });
  const secondPublishedBytes = await readFile(paths.approvedOverlays, "utf8");
  assert.equal(firstPublish.noOp, false);
  assert.equal(secondPublish.noOp, true);
  assert.equal(firstPublish.resultHash, secondPublish.resultHash);
  assert.equal(firstPublish.resultFileHash, secondPublish.resultFileHash);
  assert.equal(firstPublishedBytes, secondPublishedBytes);
  assert.equal(firstPublish.overlays.length, 21);
  assert.equal(new Set(firstPublish.overlays.map((overlay) => overlay.id)).size, 21);
  assert.deepEqual(secondPublish.changedIds, []);
  assert.deepEqual(secondPublish.deletedIds, []);
  for (const [id, hash] of existingHashes) {
    assert.equal(sha256(firstPublish.overlays.find((overlay) => overlay.id === id)), hash, `${id} changed`);
  }
  for (const entry of firstPublish.manifest.guides) {
    const overlay = firstPublish.overlays.find((item) => item.id === entry.pokemonId)!;
    assert.equal(sha256(overlay.guide), entry.candidateGuideHash);
    assert.equal(sha256(overlay.guide), entry.publicationGuideHash);
  }
});

test("coverage stale approval and failed publication preserve the previous approved overlay", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const paths = getCoveragePaths(dataRoot);
  await approveCoverageGuides({ ...options, dryRun: false });
  const approvedBefore = await readFile(paths.approvedOverlays, "utf8");
  const bundle = CoverageGuideCandidateBundleSchema.parse(await readJson(paths.candidates));
  bundle.candidates[0].guide.summary = `${bundle.candidates[0].guide.summary} changed-after-approval`;
  await writeJsonAtomic(paths.candidates, bundle);
  await assert.rejects(
    () => publishCoverageGuides({ targets: COVERAGE_TARGETS, dataRoot, dryRun: false }),
    /Approval is stale/,
  );
  assert.equal(await readFile(paths.approvedOverlays, "utf8"), approvedBefore);
});

test("coverage approval rejects stale Preview, missing Evidence, and duplicate approved IDs", async () => {
  const previewRoot = await createIsolatedDataRoot();
  const previewOptions = await approvalOptions(previewRoot);
  const previewPaths = getCoveragePaths(previewRoot);
  const previews = await readJson(previewPaths.preview) as { id: string; guide: Record<string, unknown> }[];
  previews[0].guide.summary = `${String(previews[0].guide.summary)} stale-preview`;
  await writeJsonAtomic(previewPaths.preview, previews);
  await assert.rejects(() => planCoverageGuideApproval(previewOptions), /differs from the final QA Preview/);

  const evidenceRoot = await createIsolatedDataRoot();
  const evidenceOptions = await approvalOptions(evidenceRoot);
  const evidencePaths = getCoveragePaths(evidenceRoot);
  const evidenceBundle = CoverageGuideCandidateBundleSchema.parse(await readJson(evidencePaths.candidates));
  evidenceBundle.candidates[0].evidenceIds.push("missing:evidence-id");
  await writeJsonAtomic(evidencePaths.candidates, evidenceBundle);
  const evidenceReport = await validatePokemonGuideCoverage(evidenceRoot);
  await assert.rejects(
    () => planCoverageGuideApproval({ ...evidenceOptions, expectedCandidateHash: evidenceReport.report.candidateHash }),
    /Structural validation errors/,
  );

  const duplicateRoot = await createIsolatedDataRoot();
  const duplicateOptions = await approvalOptions(duplicateRoot);
  const duplicatePaths = getCoveragePaths(duplicateRoot);
  const approved = await readJson(duplicatePaths.approvedOverlays) as unknown[];
  approved.push(approved[0]);
  await writeJsonAtomic(duplicatePaths.approvedOverlays, approved);
  await assert.rejects(() => planCoverageGuideApproval(duplicateOptions), /duplicate Pokemon IDs/);
});

test("coverage publication projection renders all five guides without the Candidate flag", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const publication = await publishCoverageGuides({
    targets: COVERAGE_TARGETS,
    dataRoot,
    dryRun: true,
    virtualApproval: options,
  });
  const baseGuides = pokemonGuides.filter((guide) => COVERAGE_TARGETS.includes(guide.id as typeof COVERAGE_TARGETS[number]));
  const renderedGuides = applyGuideOverlayRecords(baseGuides, publication.overlays);
  const byId = new Map(publication.overlays.map((overlay) => [overlay.id, overlay]));
  for (const id of COVERAGE_TARGETS) {
    const base = pokemonGuides.find((guide) => guide.id === id);
    const rendered = renderedGuides.find((guide) => guide.id === id);
    const overlay = byId.get(id);
    assert.ok(base, `${id}: missing base guide route`);
    assert.ok(rendered, `${id}: missing Production adapter result`);
    assert.ok(overlay, `${id}: missing approved projection`);
    assert.equal(rendered.id, id);
    assert.ok(rendered.summary);
    assert.ok(rendered.movesets);
    assert.ok(rendered.progression);
    assert.ok(rendered.investment);
  }
});

test("coverage manual Evidence uses the official Shield Energy name only", async () => {
  const evidencePath = path.join(process.cwd(), "data/evidence/manual/pokemon-guide-coverage-v1.json");
  const evidenceText = await readFile(evidencePath, "utf8");
  assert.match(evidenceText, /실드 에너지 1,000/);
  assert.doesNotMatch(evidenceText, /방패왕 에너지/);
});

test("canonical coverage approval and publication are already idempotent", async () => {
  const manifest = await readJson(getCoveragePaths().approval) as {
    approvedBy: string;
    qaCommitSha: string;
    approvedAt: string;
    candidateHash: string;
  };
  const options = {
    reviewer: manifest.approvedBy,
    qaCommitSha: manifest.qaCommitSha,
    approvedAt: manifest.approvedAt,
    expectedCandidateHash: manifest.candidateHash,
    targets: COVERAGE_TARGETS,
  } as const;
  const approval = await approveCoverageGuides({ ...options, dryRun: true });
  const publication = await publishCoverageGuides({ targets: COVERAGE_TARGETS, dryRun: true });
  assert.equal(approval.noOp, true);
  assert.equal(publication.noOp, true);
  assert.deepEqual(publication.changedIds, []);
  assert.deepEqual(publication.deletedIds, []);
  assert.equal(publication.overlays.length, 21);
});
