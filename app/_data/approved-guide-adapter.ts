import approvedOverlays from "../../data/approved/app-guide-overlays.json";
import previewOverlays from "../../data/preview/app-guide-overlays.json";

type GuideRecord = { id: string } & Record<string, unknown>;

type ApprovedGuideOverlay = {
  id: string;
  validationHash: string;
  approvedAt: string;
  guide: Record<string, unknown>;
};

const overlays = approvedOverlays as unknown as readonly ApprovedGuideOverlay[];
const previews = previewOverlays as unknown as readonly ApprovedGuideOverlay[];

function mergeGuide<T extends GuideRecord>(base: T, overlay: ApprovedGuideOverlay): T {
  return {
    ...base,
    ...overlay.guide,
    id: base.id,
  } as T;
}

/**
 * Applies only explicitly published guide projections. An empty approved file
 * is intentionally a no-op so the current production data remains intact.
 */
export function applyApprovedGuideOverlays<T extends GuideRecord>(guides: readonly T[]): T[] {
  const previewEnabled = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES === "true"
    && process.env.VERCEL_ENV !== "production";
  const activeOverlays = previewEnabled ? [...overlays, ...previews] : overlays;
  const byId = new Map(activeOverlays.map((overlay) => [overlay.id, overlay]));
  return guides.map((guide) => {
    const overlay = byId.get(guide.id);
    return overlay ? mergeGuide(guide, overlay) : guide;
  });
}
