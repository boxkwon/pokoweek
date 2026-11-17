import path from "node:path";

export const projectRoot = process.cwd();
export const dataRoot = process.env.POKOWEEK_DATA_DIR
  ? path.resolve(projectRoot, process.env.POKOWEEK_DATA_DIR)
  : path.join(projectRoot, "data");

export const paths = {
  rawPogoApi: path.join(dataRoot, "raw", "pogoapi"),
  manualEvidence: path.join(dataRoot, "evidence", "manual", "kyurem-fusion-2026.json"),
  mechanicsEvidence: path.join(dataRoot, "evidence", "manual", "pokemon-go-mechanics-2026.json"),
  factReview: path.join(dataRoot, "evidence", "manual", "kyurem-fact-review-2026.json"),
  evidenceRegistry: path.join(dataRoot, "evidence", "registry.json"),
  normalizedDataset: path.join(dataRoot, "normalized", "kyurem-family.json"),
  candidates: path.join(dataRoot, "candidates"),
  candidateBundle: path.join(dataRoot, "candidates", "kyurem-family.json"),
  candidateHistory: path.join(dataRoot, "candidates", "history"),
  manualPackages: path.join(dataRoot, "manual", "packages"),
  manualDrafts: path.join(dataRoot, "manual", "drafts"),
  manualImportReport: path.join(dataRoot, "validation", "manual-import.json"),
  generationLogs: path.join(dataRoot, "logs", "generation"),
  reviewSummary: path.join(dataRoot, "validation", "kyurem-family-review.json"),
  validationReport: path.join(dataRoot, "validation", "kyurem-family.json"),
  approvalManifest: path.join(dataRoot, "manifests", "approved.json"),
  previewOverlays: path.join(dataRoot, "preview", "app-guide-overlays.json"),
};
