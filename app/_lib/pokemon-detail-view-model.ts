import type {
  ActionEventPhase,
  ActionOwnershipOption,
  GuideContextView,
  PokemonGuide,
} from "../_data/guide-data";

export type ActionEventWindow = {
  id: string;
  label: string;
  startAt: string;
  endAt: string;
  claimEndAt?: string;
};

export function getActionEventPhase(now: Date, eventWindow?: ActionEventWindow): ActionEventPhase {
  if (!eventWindow) return "active";
  const time = now.getTime();
  const start = new Date(eventWindow.startAt).getTime();
  const rankEnd = new Date(eventWindow.endAt).getTime();
  const claimEnd = eventWindow.claimEndAt ? new Date(eventWindow.claimEndAt).getTime() : rankEnd;
  if (time < start) return "upcoming";
  if (time < rankEnd) return "active";
  if (time < claimEnd) return "claim_only";
  return "ended";
}

export function getOwnershipPresentation(option: ActionOwnershipOption | undefined, phase: ActionEventPhase) {
  if (!option) return undefined;
  const phaseGuidance = phase === "claim_only" || phase === "ended" ? option.phaseGuidance?.[phase] : undefined;
  return phaseGuidance ?? option;
}

function applyContextView(guide: PokemonGuide, view?: GuideContextView): PokemonGuide {
  if (!view) return guide;
  const investment = view.investment || view.order
    ? { ...guide.investment, ...view.investment, ...(view.order ? { order: view.order } : {}) }
    : guide.investment;
  return {
    ...guide,
    overallRating: Object.prototype.hasOwnProperty.call(view, "overallRating") ? view.overallRating : guide.overallRating,
    verdictLabel: view.verdictLabel ?? guide.verdictLabel,
    reason: view.verdictLabel ?? guide.reason,
    summary: view.summary ?? guide.summary,
    presentationMode: view.presentationMode ?? guide.presentationMode,
    investment,
    investmentReasons: view.investmentReasons ? { ...guide.investmentReasons, ...view.investmentReasons } : guide.investmentReasons,
    recommendations: view.recommendations ?? guide.recommendations,
  };
}

export function derivePokemonGuideView({
  guide,
  selectedLeague,
  ownershipId,
  eventPhase,
}: {
  guide: PokemonGuide;
  selectedLeague?: string;
  ownershipId?: string;
  eventPhase: ActionEventPhase;
}) {
  let derived = guide;
  const leagueTarget = guide.pvpLeagueTargets?.find((target) => target.league === selectedLeague) ?? guide.pvpLeagueTargets?.[0];
  if (leagueTarget) derived = applyContextView(derived, leagueTarget.contextView);

  const actionGuide = guide.actionGuide;
  if (!actionGuide) return derived;
  derived = applyContextView(derived, actionGuide.phaseGuidance?.[eventPhase]?.view);
  const ownership = actionGuide.ownershipCondition?.options.find((option) => option.id === ownershipId);
  const ownershipPresentation = getOwnershipPresentation(ownership, eventPhase);
  return applyContextView(derived, ownershipPresentation?.view);
}
