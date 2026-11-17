import { writeJsonAtomic } from "../lib/files";
import { paths } from "../lib/paths";
import type { GuideCandidateBundle, ValidationReport } from "../schemas";

function collectEvidenceIds(value: unknown, output = new Set<string>()) {
  if (Array.isArray(value)) value.forEach((item) => collectEvidenceIds(item, output));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === "evidenceIds" && Array.isArray(item)) {
        item.forEach((id) => typeof id === "string" && output.add(id));
      } else collectEvidenceIds(item, output);
    }
  }
  return output;
}

export async function writeReviewSummary(bundle: GuideCandidateBundle, validation: ValidationReport) {
  const guides = bundle.candidates.map((candidate) => {
    const structuralCompleteness = validation.structuralCompleteness.find((item) => item.pokemonId === candidate.pokemonId);
    const editorialReadiness = validation.editorialReadiness.find((item) => item.pokemonId === candidate.pokemonId);
    const issues = validation.issues.filter((issue) => issue.path.includes(candidate.pokemonId) || issue.path === "candidates");
    const candidateValidationReady = structuralCompleteness?.status === "complete"
      && editorialReadiness?.ready === true
      && !issues.some((issue) => issue.severity === "error");
    return {
      pokemonId: candidate.pokemonId,
      reviewStatus: candidate.review.status,
      candidateValidationReady,
      validationReady: candidateValidationReady && validation.factsStatus === "verified" && validation.fusionStatus === "verified",
      publishable: false,
      verdict: candidate.verdict,
      useCases: candidate.useCases,
      movesets: candidate.movesets,
      investment: candidate.investment,
      actions: candidate.actions,
      warnings: candidate.warnings,
      structuralCompleteness,
      editorialReadiness,
      issues,
      evidenceIds: [...collectEvidenceIds(candidate)],
    };
  });
  const summary = {
    generatedAt: new Date().toISOString(),
    runId: bundle.runId,
    sourceSnapshotHash: bundle.sourceSnapshotHash,
    usage: bundle.usage,
    factsStatus: validation.factsStatus,
    fusionStatus: validation.fusionStatus,
    approvalRequired: true,
    publicationPerformed: false,
    guides,
  };
  await writeJsonAtomic(paths.reviewSummary, summary);
  return summary;
}
