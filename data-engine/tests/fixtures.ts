import { GuideCandidateSchema, type GuideCandidate } from "../schemas";

const EVIDENCE_ID = "fixture:evidence";
const analysis = { reason: "테스트 근거", evidenceIds: [EVIDENCE_ID], modes: ["raid" as const] };

export function completeCandidate(overrides: Partial<GuideCandidate> = {}) {
  return GuideCandidateSchema.parse({
    schemaVersion: 1,
    pokemonId: "kyurem",
    origin: "fixture",
    generationMethod: "fixture",
    factsSnapshotHash: "a".repeat(64),
    generatedBy: {
      provider: "fixture",
      model: "fixture-only",
      promptVersion: "fixture-v1",
      generatedAt: "2026-11-16T00:00:00.000Z",
      inputTokens: 0,
      outputTokens: 0,
    },
    review: { status: "pending" },
    performanceRating: 4,
    evidenceConfidence: "high",
    editorialStatus: "ready",
    editorialLimitations: [],
    decisionQuestions: [
      "fusion_or_base", "white_or_black_priority", "required_moves", "missing_special_move", "post_fusion_first_step", "power_up_target", "second_move", "xl_and_stardust",
    ].map((id) => ({ id, conclusion: "테스트에서 실행할 결론", reason: "테스트 근거에 따른 충분한 이유", conditions: ["테스트 조건"], evidenceIds: [EVIDENCE_ID] })),
    applicability: { modes: ["raid"], secondMove: true, xlCandy: true, maxMove: false, specialActionGuide: true },
    verdict: { label: "테스트 결론", summary: "테스트용 한 줄 판단", analysis },
    useCases: [{ mode: "raid", performanceRating: 4, analysis }],
    movesets: [{ mode: "raid", fastMove: "Dragon Breath", chargedMoves: ["Glaciate"], acquisitionConditions: ["Elite TM 또는 이벤트 조건 확인"], analysis }],
    raidAnalysis: {
      method: "relative_cycle_index_v1",
      profiles: [{ subjectId: "kyurem", label: "테스트", fastMove: "Dragon Breath", chargedMove: "Glaciate", targetProfile: "neutral", defenderTypes: [], fastEffectiveness: 1, chargedEffectiveness: 1, fastUsesPerCharged: 1, cycleSeconds: 1, relativeCycleIndex: 1 }],
      assumptions: ["테스트 가정"],
      limitations: ["테스트 한계"],
      evidenceIds: [EVIDENCE_ID],
    },
    pvpAnalysis: null,
    investment: {
      order: [{ id: "step-1", label: "좋은 개체 확보", reason: "테스트", evidenceIds: [EVIDENCE_ID] }],
      stardust: { decision: "conditional", analysis },
      candy: { decision: "recommended", analysis },
      secondMove: { decision: "conditional", analysis },
      xlCandy: { decision: "conditional", analysis },
      eliteTm: { decision: "conditional", analysis },
      maxMove: null,
      powerUpStages: [
        { level: "30", decision: "recommended", reason: "테스트", evidenceIds: [EVIDENCE_ID] },
        { level: "35", decision: "conditional", reason: "테스트", evidenceIds: [EVIDENCE_ID] },
        { level: "40", decision: "conditional", reason: "테스트", evidenceIds: [EVIDENCE_ID] },
        { level: "50", decision: "hold", reason: "테스트", evidenceIds: [EVIDENCE_ID] },
      ],
    },
    actions: [{ id: "action-1", label: "기술 확인", reason: "테스트", evidenceIds: [EVIDENCE_ID] }],
    warnings: [],
    specialActionGuideId: "kyurem-fusion",
    ...overrides,
  });
}
