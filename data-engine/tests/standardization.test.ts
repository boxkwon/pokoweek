import assert from "node:assert/strict";
import { cp, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuideProgression } from "../../app/_components/pokemon-reference-detail";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { pokemonGuides, type PokemonGuide } from "../../app/_data/guide-data";
import { derivePokemonGuideView, getActionEventPhase, getOwnershipPresentation } from "../../app/_lib/pokemon-detail-view-model";
import { StandardGuideCandidateBundleSchema, StandardizedGuideDatasetSchema } from "../standardization/schemas";
import { approveStandardGuides, planStandardGuideApproval, publishStandardGuides, STANDARD_GUIDE_TARGETS, standardValidationFingerprint } from "../standardization/release";
import { validatePokemonDetailStandardization } from "../standardization/validate";
import { sha256 } from "../lib/hash";
import { writeJsonAtomic } from "../lib/files";

async function readFixture(file: string) {
  return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8"));
}

const QA_COMMIT = "6357fc35735f1784e529e9e2fc9690eeb04bec73";

async function createIsolatedDataRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "pokoweek-standard-release-"));
  for (const directory of ["normalized", "candidates", "evidence", "preview", "approved"]) {
    await cp(path.join(process.cwd(), "data", directory), path.join(root, directory), { recursive: true });
  }
  return root;
}

async function approvalOptions(dataRoot: string) {
  const { report } = await validatePokemonDetailStandardization({ dataRoot });
  return {
    reviewer: "boxkwon",
    qaCommitSha: QA_COMMIT,
    expectedCandidateHash: report.candidateHash,
    targets: STANDARD_GUIDE_TARGETS,
    dataRoot,
    approvedAt: "2026-11-19T01:00:00.000Z",
  } as const;
}

test("standardization candidates remain pending and cover exactly the three requested Pokemon", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  assert.deepEqual(bundle.candidates.map((candidate) => candidate.pokemonId).sort(), ["cresselia", "eternamax-eternatus", "mega-banette"]);
  assert.ok(bundle.candidates.every((candidate) => candidate.review.status === "pending"));
  assert.equal(bundle.usage, null);
});

test("standardization validator accepts evidence, moves, and editorial answerability", async () => {
  const { report } = await validatePokemonDetailStandardization();
  assert.equal(report.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(report.editorialReadiness.every((item) => item.ready));
  assert.equal(report.approvalPerformed, false);
  assert.equal(report.publicationPerformed, false);
});

test("standardization approval accepts only the explicit three-Pokemon allowlist and final QA hashes", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const plan = await planStandardGuideApproval(options);
  assert.deepEqual([...plan.manifest.targets].sort(), [...STANDARD_GUIDE_TARGETS].sort());
  assert.equal(plan.manifest.candidateHash, options.expectedCandidateHash);
  assert.equal(plan.manifest.validationHash, standardValidationFingerprint(plan.report));
  assert.equal(plan.manifest.qaCommitSha, QA_COMMIT);
  assert.ok(plan.manifest.guides.every((guide) => guide.candidateGuideHash === guide.publicationGuideHash));
  await assert.rejects(
    () => planStandardGuideApproval({ ...options, targets: ["cresselia", "mega-banette"] }),
    /Targets must be exactly/,
  );
  await assert.rejects(
    () => planStandardGuideApproval({ ...options, targets: [...STANDARD_GUIDE_TARGETS, "kyurem"] }),
    /Targets must be exactly/,
  );
});

test("standardization approval and publication are idempotent and preserve Kyurem overlays", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  const approvedPath = path.join(dataRoot, "approved", "app-guide-overlays.json");
  const before = await readFixtureFromPath(approvedPath) as { id: string; guide: Record<string, unknown> }[];
  const kyuremBefore = new Map(before.map((overlay) => [overlay.id, sha256(overlay)]));

  const firstApproval = await approveStandardGuides({ ...options, dryRun: false });
  const secondApproval = await approveStandardGuides({ ...options, dryRun: false });
  assert.equal(firstApproval.noOp, false);
  assert.equal(secondApproval.noOp, true);
  assert.equal(sha256(firstApproval.manifest), sha256(secondApproval.manifest));

  const firstPublish = await publishStandardGuides({ targets: STANDARD_GUIDE_TARGETS, dataRoot, dryRun: false });
  const secondPublish = await publishStandardGuides({ targets: STANDARD_GUIDE_TARGETS, dataRoot, dryRun: false });
  assert.equal(firstPublish.noOp, false);
  assert.equal(secondPublish.noOp, true);
  assert.equal(firstPublish.resultHash, secondPublish.resultHash);
  assert.equal(new Set(firstPublish.overlays.map((overlay) => overlay.id)).size, firstPublish.overlays.length);
  assert.deepEqual(firstPublish.overlays.map((overlay) => overlay.id), [
    "kyurem", "white-kyurem", "black-kyurem", ...STANDARD_GUIDE_TARGETS,
  ]);
  for (const id of ["kyurem", "white-kyurem", "black-kyurem"]) {
    assert.equal(sha256(firstPublish.overlays.find((overlay) => overlay.id === id)), kyuremBefore.get(id));
  }
  for (const entry of firstPublish.manifest.guides) {
    const overlay = firstPublish.overlays.find((item) => item.id === entry.pokemonId)!;
    assert.equal(sha256(overlay.guide), entry.candidateGuideHash);
    assert.equal(sha256(overlay.guide), entry.publicationGuideHash);
  }
});

test("stale approval and failed publication leave existing approved overlays unchanged", async () => {
  const dataRoot = await createIsolatedDataRoot();
  const options = await approvalOptions(dataRoot);
  await approveStandardGuides({ ...options, dryRun: false });
  const approvedPath = path.join(dataRoot, "approved", "app-guide-overlays.json");
  const before = await readFile(approvedPath, "utf8");
  const candidatePath = path.join(dataRoot, "candidates", "pokemon-detail-standard-v1.json");
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixtureFromPath(candidatePath));
  bundle.candidates[0].guide.summary = `${bundle.candidates[0].guide.summary} changed-after-qa`;
  await writeJsonAtomic(candidatePath, bundle);
  await assert.rejects(
    () => publishStandardGuides({ targets: STANDARD_GUIDE_TARGETS, dataRoot, dryRun: false }),
    /Approval is stale/,
  );
  assert.equal(await readFile(approvedPath, "utf8"), before);
});

async function readFixtureFromPath(file: string) {
  return JSON.parse(await readFile(file, "utf8"));
}

test("Cresselia preserves PvP league decisions and limited move conditions", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const guide = bundle.candidates.find((candidate) => candidate.pokemonId === "cresselia")!.guide;
  assert.ok(guide.pvpLeagueTargets);
  assert.deepEqual(guide.pvpLeagueTargets.map((target) => target.league), ["great", "ultra", "master"]);
  assert.equal(guide.pvpLeagueTargets.find((target) => target.league === "master")?.cpLimit, undefined);
  assert.ok(guide.pvpLeagueTargets.every((target) => target.ivDirection && target.powerUpTarget && target.secondMove && target.xlCandy && target.useCase));
  assert.equal(guide.pvpLeagueTargets.find((target) => target.league === "master")?.moveset, undefined);
  assert.equal(guide.pvpLeagueTargets.find((target) => target.league === "master")?.contextView.investment?.secondMove, "hold");
  assert.ok(guide.movesets.pvp?.conditions?.some((condition) => condition.includes("대단한 기술머신")));
  assert.equal(guide.useCases.raid, undefined);
});

test("Cresselia league selection derives one coherent hero, order, and investment view", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const projection = bundle.candidates.find((candidate) => candidate.pokemonId === "cresselia")!.guide;
  const base = pokemonGuides.find((guide) => guide.id === "cresselia")!;
  const guide = { ...base, ...projection } as unknown as PokemonGuide;
  const great = derivePokemonGuideView({ guide, selectedLeague: "great", eventPhase: "active" });
  const ultra = derivePokemonGuideView({ guide, selectedLeague: "ultra", eventPhase: "active" });
  const master = derivePokemonGuideView({ guide, selectedLeague: "master", eventPhase: "active" });
  const greatAgain = derivePokemonGuideView({ guide, selectedLeague: "great", eventPhase: "active" });
  assert.match(great.verdictLabel ?? "", /슈퍼리그/);
  assert.equal(great.investment?.secondMove, "recommended");
  assert.match(`${great.ivAdvice?.general} ${great.ivAdvice?.pvp}`, /1,500/);
  assert.match(great.ivAdvice?.pvp ?? "", /낮은 공격 IV/);
  assert.match(ultra.verdictLabel ?? "", /하이퍼리그/);
  assert.equal(ultra.investment?.secondMove, "high");
  assert.match(`${ultra.ivAdvice?.general} ${ultra.ivAdvice?.pvp}`, /2,500/);
  assert.match(ultra.ivAdvice?.pvp ?? "", /하이퍼리그 기준/);
  assert.match(master.verdictLabel ?? "", /마스터리그/);
  assert.equal(master.investment?.secondMove, "hold");
  assert.equal(master.investment?.xlCandy, "hold");
  assert.equal(master.investment?.stardust, "hold");
  assert.doesNotMatch((master.investment?.order ?? []).map((item) => item.label).join(" "), /CP 상한 직전/);
  assert.match(`${master.ivAdvice?.general} ${master.ivAdvice?.pvp}`, /CP 상한이 없|CP 상한 없음/);
  assert.match(`${master.ivAdvice?.general} ${master.ivAdvice?.pvp}`, /높은 개체값/);
  assert.doesNotMatch(master.ivAdvice?.pvp ?? "", /낮은 공격 IV가 유리/);
  assert.deepEqual(greatAgain.ivAdvice, great.ivAdvice);
});

test("Mega Banette uses verified mega energy and staged investment data", async () => {
  const dataset = StandardizedGuideDatasetSchema.parse(await readFixture("data/normalized/pokemon-detail-standard-v1.json"));
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const guide = bundle.candidates.find((candidate) => candidate.pokemonId === "mega-banette")!.guide;
  const action = guide.actionGuide as { type: string; megaRestGuide: { gameCheck: string; superMaxNote: string }; goals: { requirements: { amount: number }[] }[] };
  assert.equal(action.type, "mega");
  assert.equal(dataset.mechanics.mega.firstEvolutionEnergy, 100);
  assert.ok(action.goals[0].requirements.some((requirement) => requirement.amount === 100));
  assert.match(action.megaRestGuide.gameCheck, /상세 화면/);
  assert.match(action.megaRestGuide.superMaxNote, /24시간/);
  assert.match(action.megaRestGuide.superMaxNote, /확인되지/);
  assert.equal(dataset.mechanics.mega.restPolicy.decreasesWithMegaLevel, true);
  assert.equal((guide.progression as { stages: unknown[] }).stages.length, 4);
});

test("Eternatus separates the obtainable Pokemon from the uncatchable Eternamax boss", async () => {
  const dataset = StandardizedGuideDatasetSchema.parse(await readFixture("data/normalized/pokemon-detail-standard-v1.json"));
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const guide = bundle.candidates.find((candidate) => candidate.pokemonId === "eternamax-eternatus")!.guide;
  assert.equal(dataset.mechanics.eternatus.eternamaxCatchable, false);
  assert.equal(dataset.mechanics.eternatus.formChangeSupported, false);
  assert.match(guide.summary, /소유·육성하는 것은 일반 무한다이노/);
  assert.equal((guide.progression as { costStatus: string }).costStatus, "check_in_game");
  assert.equal(guide.counters.length, 0);
  const action = guide.actionGuide as {
    eventId: string;
    ownershipCondition: { options: { id: string; summary: string; steps: { title: string; description?: string }[] }[] };
    conditionalCost: { baseCost: { label: string; amount: number }[]; activeCost: { label: string; amount: number }[]; note: string; facts: string[] };
    relatedFormArtwork: { label: string; image: { src: string; placeholder?: boolean }; note: string };
  };
  assert.equal((guide.image as { src: string }).src, "/images/pokemon/pokemon-official-artwork-890.png");
  assert.equal(action.relatedFormArtwork.image.src, "/images/pokemon/pokemon-official-artwork-10190.png");
  assert.notEqual(action.relatedFormArtwork.image.src, (guide.image as { src: string }).src);
  assert.equal(action.relatedFormArtwork.label, "무한다이맥스 무한다이노");
  assert.match(action.relatedFormArtwork.note, /포획할 수 없음/);
  assert.ok((await readFile(path.join(process.cwd(), "public/images/pokemon/pokemon-official-artwork-890.png"))).byteLength > 0);
  assert.ok((await readFile(path.join(process.cwd(), "public/images/pokemon/pokemon-official-artwork-10190.png"))).byteLength > 0);
  assert.equal(action.eventId, dataset.mechanics.eternatus.event.id);
  assert.deepEqual(action.ownershipCondition.options.map((option) => option.id), ["never-caught", "caught-before"]);
  const caughtBefore = action.ownershipCondition.options.find((option) => option.id === "caught-before")!;
  assert.match(JSON.stringify(caughtBefore), /사탕 100개/);
  assert.doesNotMatch(caughtBefore.summary, /조우/);
  assert.deepEqual(action.conditionalCost.baseCost.map((cost) => cost.amount), [5000, 30]);
  assert.deepEqual(action.conditionalCost.activeCost.map((cost) => cost.amount), [2500, 15]);
  assert.match(action.conditionalCost.note, /CP 강화 비용/);
  assert.match(action.conditionalCost.facts.join(" "), /10분/);
  assert.match(action.conditionalCost.facts.join(" "), /2시간/);
  assert.match(action.conditionalCost.facts.join(" "), /24시간/);
  assert.match(action.conditionalCost.facts.join(" "), /동시에 사용 불가/);
});

test("Eternatus event phase boundaries distinguish rank progress, claims, and expiration", () => {
  const window = {
    id: "dynamax-trails-2026",
    label: "11/16 ~ 11/23",
    startAt: "2026-11-16T10:00:00+09:00",
    endAt: "2026-11-23T20:00:00+09:00",
    claimEndAt: "2026-11-25T20:00:00+09:00",
  };
  assert.equal(getActionEventPhase(new Date("2026-11-18T12:00:00+09:00"), window), "active");
  assert.equal(getActionEventPhase(new Date("2026-11-23T19:59:00+09:00"), window), "active");
  assert.equal(getActionEventPhase(new Date("2026-11-23T20:00:00+09:00"), window), "claim_only");
  assert.equal(getActionEventPhase(new Date("2026-11-24T12:00:00+09:00"), window), "claim_only");
  assert.equal(getActionEventPhase(new Date("2026-11-25T20:00:00+09:00"), window), "ended");
  assert.equal(getActionEventPhase(new Date("2026-11-26T12:00:00+09:00"), window), "ended");
});

test("Eternatus ownership and event phase matrix never revives unavailable GO Pass actions", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const projection = bundle.candidates.find((candidate) => candidate.pokemonId === "eternamax-eternatus")!.guide;
  const base = pokemonGuides.find((guide) => guide.id === "eternamax-eternatus")!;
  const guide = { ...base, ...projection } as unknown as PokemonGuide;
  const actionGuide = guide.actionGuide!;
  const neverCaught = actionGuide.ownershipCondition!.options.find((option) => option.id === "never-caught")!;
  const caughtBefore = actionGuide.ownershipCondition!.options.find((option) => option.id === "caught-before")!;
  for (const ownershipId of [undefined, "never-caught", "caught-before"] as const) {
    const active = derivePokemonGuideView({ guide, ownershipId, eventPhase: "active" });
    const claimOnly = derivePokemonGuideView({ guide, ownershipId, eventPhase: "claim_only" });
    const ended = derivePokemonGuideView({ guide, ownershipId, eventPhase: "ended" });
    assert.match(active.summary ?? "", /GO Pass|랭크/);
    assert.doesNotMatch((claimOnly.investment?.order ?? []).map((item) => item.label).join(" "), /랭크 진행/);
    assert.equal(ended.presentationMode, ownershipId === "caught-before" ? "training-first" : "action-first");
    assert.doesNotMatch((ended.investment?.order ?? []).map((item) => item.label).join(" "), /GO Pass 랭크 진행|조우 보상 수령|사탕 100개 수령/);
  }
  for (const phase of ["active", "claim_only", "ended"] as const) {
    for (const option of [neverCaught, caughtBefore]) {
      const presentation = getOwnershipPresentation(option, phase)!;
      assert.ok(presentation.summary.length > 0);
      assert.ok(presentation.steps.length > 0);
      assert.ok(presentation.checklist.length > 0);
    }
  }
  const neverCaughtEndedAction = getOwnershipPresentation(neverCaught, "ended")!;
  const neverCaughtEndedActionText = JSON.stringify(neverCaughtEndedAction);
  assert.doesNotMatch(neverCaughtEndedActionText, /보유한 무한다이노 선택|현재 보유 개체 확인|보유 개체의 다이맥스포|Lv\.30|조우 보상 받기|GO Pass 랭크 (?:진행|올리기)/);
  assert.match(neverCaughtEndedActionText, /다음 공식/);
  const caughtEndedAction = getOwnershipPresentation(caughtBefore, "ended")!;
  assert.match(JSON.stringify(caughtEndedAction), /기존 무한다이노/);
  const neverCaughtEnded = derivePokemonGuideView({ guide, ownershipId: "never-caught", eventPhase: "ended" });
  const neverCaughtEndedText = `${neverCaughtEnded.summary} ${(neverCaughtEnded.investment?.order ?? []).map((item) => `${item.label} ${item.reason ?? ""}`).join(" ")} ${neverCaughtEnded.recommendations?.join(" ")}`;
  assert.match(neverCaughtEndedText, /수령 기간이 종료|조우 보상 종료/);
  assert.match(neverCaughtEndedText, /다음 공식/);
  assert.doesNotMatch(neverCaughtEndedText, /보유한 무한다이노 선택|보유 개체의|Lv\.30|조우 보상 받기|GO Pass 랭크 (?:진행|올리기)/);
  assert.equal(neverCaughtEnded.investment?.powerUp, "hold");
  assert.equal(neverCaughtEnded.investment?.secondMove, "hold");
  assert.equal(neverCaughtEnded.investment?.xlCandy, "hold");
  assert.equal(neverCaughtEnded.progressionContext?.mode, "reference");
  assert.equal(neverCaughtEnded.progressionContext?.title, "획득 후 강화 참고");
  const ownedEnded = derivePokemonGuideView({ guide, ownershipId: "caught-before", eventPhase: "ended" });
  assert.match((ownedEnded.investment?.order ?? []).map((item) => item.label).join(" "), /기존 무한다이노 선택/);
  assert.doesNotMatch(`${ownedEnded.summary} ${(ownedEnded.investment?.order ?? []).map((item) => item.label).join(" ")}`, /GO Pass 랭크 진행|조우 보상/);
  assert.equal(ownedEnded.progressionContext?.mode, "default");
  const ownedActive = derivePokemonGuideView({ guide, ownershipId: "caught-before", eventPhase: "active" });
  assert.match(ownedActive.verdictLabel ?? "", /사탕 100개/);
  assert.doesNotMatch(ownedActive.verdictLabel ?? "", /본체 확보|조우/);
});

test("Eternatus progression card renders CP as reference without a recommendation badge until owned", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const projection = bundle.candidates.find((candidate) => candidate.pokemonId === "eternamax-eternatus")!.guide;
  const base = pokemonGuides.find((guide) => guide.id === "eternamax-eternatus")!;
  const guide = { ...base, ...projection } as unknown as PokemonGuide;
  const unselected = derivePokemonGuideView({ guide, eventPhase: "active" });
  const neverCaught = derivePokemonGuideView({ guide, ownershipId: "never-caught", eventPhase: "ended" });
  const caughtBefore = derivePokemonGuideView({ guide, ownershipId: "caught-before", eventPhase: "ended" });

  const unselectedMarkup = renderToStaticMarkup(createElement(GuideProgression, { guide: unselected }));
  assert.match(unselectedMarkup, /보유한 경우의 육성 참고 정보/);
  assert.doesNotMatch(unselectedMarkup, /progression-recommended/);
  assert.match(unselectedMarkup, /CP 3,796/);

  const neverCaughtMarkup = renderToStaticMarkup(createElement(GuideProgression, { guide: neverCaught }));
  assert.match(neverCaughtMarkup, /획득 후 강화 참고/);
  assert.match(neverCaughtMarkup, /아직 무한다이노를 보유하지 않았다면 강화 투자는 진행할 수 없습니다/);
  assert.doesNotMatch(neverCaughtMarkup, /progression-recommended/);
  assert.match(neverCaughtMarkup, /CP 3,796/);

  const caughtBeforeMarkup = renderToStaticMarkup(createElement(GuideProgression, { guide: caughtBefore }));
  assert.match(caughtBeforeMarkup, /단계별 CP 강화/);
  assert.match(caughtBeforeMarkup, /progression-recommended/);
  assert.doesNotMatch(caughtBeforeMarkup, /획득 후 강화 참고/);
});

test("Production ignores the candidate flag and uses only the approved standard guide", { concurrency: false }, () => {
  const previousFlag = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES;
  const previousVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "true";
    process.env.VERCEL_ENV = "preview";
    const [previewGuide] = applyApprovedGuideOverlays([{ id: "cresselia", reason: "legacy" }]);
    assert.notEqual(previewGuide.reason, "legacy");

    process.env.VERCEL_ENV = "production";
    const [productionWithCandidateFlag] = applyApprovedGuideOverlays([{ id: "cresselia", reason: "legacy" }]);
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "false";
    const [productionWithoutCandidateFlag] = applyApprovedGuideOverlays([{ id: "cresselia", reason: "legacy" }]);
    assert.notEqual(productionWithCandidateFlag.reason, "legacy");
    assert.equal(productionWithCandidateFlag.reason, productionWithoutCandidateFlag.reason);
    assert.equal(productionWithoutCandidateFlag.reason, "PvP 목표가 있으면 육성");
  } finally {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = previousFlag;
    process.env.VERCEL_ENV = previousVercelEnv;
  }
});
