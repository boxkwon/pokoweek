import approvedOverlays from "../../data/approved/app-guide-overlays.json";
import previewOverlays from "../../data/preview/app-guide-overlays.json";
import standardizationPreviewOverlays from "../../data/preview/pokemon-detail-standard-overlays.json";
import coveragePreviewOverlays from "../../data/preview/pokemon-guide-coverage-overlays.json";
import batchOnePreviewOverlays from "../../data/preview/pokemon-guide-coverage-batch-1-overlays.json";

type GuideRecord = { id: string } & Record<string, unknown>;

type ApprovedGuideOverlay = {
  id: string;
  validationHash: string;
  approvedAt?: string;
  previewOnly?: boolean;
  standalone?: boolean;
  guide: Record<string, unknown>;
};

const overlays = approvedOverlays as unknown as readonly ApprovedGuideOverlay[];
const previews = previewOverlays as unknown as readonly ApprovedGuideOverlay[];
const standardizationPreviews = standardizationPreviewOverlays as unknown as readonly ApprovedGuideOverlay[];
const coveragePreviews = coveragePreviewOverlays as unknown as readonly ApprovedGuideOverlay[];
const batchOnePreviews = batchOnePreviewOverlays as unknown as readonly ApprovedGuideOverlay[];

function mergeGuide<T extends GuideRecord>(base: T, overlay: ApprovedGuideOverlay): T {
  return {
    ...base,
    ...overlay.guide,
    id: base.id,
  } as T;
}

export function applyGuideOverlayRecords<T extends GuideRecord>(
  guides: readonly T[],
  selectedOverlays: readonly ApprovedGuideOverlay[],
): T[] {
  const byId = new Map(selectedOverlays.map((overlay) => [overlay.id, overlay]));
  return guides.map((guide) => {
    const overlay = byId.get(guide.id);
    return overlay ? mergeGuide(guide, overlay) : guide;
  });
}

function appendPreviewGuides<T extends GuideRecord>(guides: readonly T[], selectedOverlays: readonly ApprovedGuideOverlay[]) {
  const existing = new Set(guides.map((guide) => guide.id));
  return [
    ...guides,
    ...selectedOverlays
      .filter((overlay) => !existing.has(overlay.id) && typeof overlay.guide.name === "string")
      .map((overlay) => ({ ...overlay.guide, id: overlay.id } as T)),
  ];
}

function appendStandaloneGuides<T extends GuideRecord>(guides: readonly T[], selectedOverlays: readonly ApprovedGuideOverlay[]) {
  return appendPreviewGuides(guides, selectedOverlays.filter((overlay) => overlay.standalone === true));
}

/**
 * Applies only explicitly published guide projections. An empty approved file
 * is intentionally a no-op so the current production data remains intact.
 */
export function applyApprovedGuideOverlays<T extends GuideRecord>(guides: readonly T[]): T[] {
  const previewEnabled = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES === "true"
    && process.env.VERCEL_ENV !== "production";
  const activeOverlays = previewEnabled ? [...overlays, ...previews, ...standardizationPreviews, ...coveragePreviews, ...batchOnePreviews] : overlays;
  const merged = applyGuideOverlayRecords(guides, activeOverlays);
  const withPublishedStandalone = appendStandaloneGuides(merged, overlays);
  return previewEnabled ? appendPreviewGuides(withPublishedStandalone, batchOnePreviews) : withPublishedStandalone;
}
