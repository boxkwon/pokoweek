"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ActionChecklistItem,
  ActionEventPhase,
  ActionGoal,
  ActionRequirement,
  ActionWarning,
  PokemonActionGuide as PokemonActionGuideData,
} from "../_data/guide-data";
import { pokemon } from "../_data/guide-data";
import { getOwnershipPresentation, type ActionEventWindow } from "../_lib/pokemon-detail-view-model";
import { PrimaryCTA, SectionHeader } from "./design-system";
import { BagIcon, CheckIcon, ChevronIcon, SwordsIcon, TargetIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";

const COMBINED_GOAL_ID = "all-goals";

const actionGuideCopy = {
  fusion: { requirements: "융합 자체에 필요한 것", warnings: "특별 기술과 융합 후 주의사항", flow: "완성 순서", checklist: "융합 조건과 특별 기술을 확인하세요", selector: "융합 목표 선택" },
  mega: { requirements: "첫 메가진화에 필요한 것", warnings: "메가진화 전 확인사항", flow: "메가진화 준비 순서", checklist: "메가진화 준비를 확인하세요", selector: "메가진화 목표 선택" },
  max_upgrade: { requirements: "이벤트와 육성에 필요한 것", warnings: "특수 콘텐츠 주의사항", flow: "획득·육성 순서", checklist: "획득과 육성 조건을 확인하세요", selector: "행동 목표 선택" },
  evolution: { requirements: "진화에 필요한 것", warnings: "진화 전 확인사항", flow: "진화 순서", checklist: "진화 조건을 확인하세요", selector: "진화 목표 선택" },
  form_change: { requirements: "폼체인지에 필요한 것", warnings: "폼체인지 전 확인사항", flow: "폼체인지 순서", checklist: "폼체인지 조건을 확인하세요", selector: "폼체인지 목표 선택" },
} as const;

function getPokemonEntry(pokemonId: string) {
  return Object.values(pokemon).find((entry) => entry.id === pokemonId);
}

function requirementKey(requirement: ActionRequirement) {
  if (requirement.type === "pokemon" || requirement.type === "candy") {
    return `${requirement.type}:${requirement.pokemonId}`;
  }
  if (requirement.type === "energy") return `energy:${requirement.energyId}`;
  return `item:${requirement.itemId}`;
}

function combineRequirements(goals: readonly ActionGoal[]) {
  const combined = new Map<string, ActionRequirement>();
  for (const requirement of goals.flatMap((goal) => goal.requirements)) {
    const key = requirementKey(requirement);
    const current = combined.get(key);
    combined.set(key, current ? { ...current, amount: current.amount + requirement.amount } : { ...requirement });
  }
  return [...combined.values()];
}

function getRequirementLabel(requirement: ActionRequirement) {
  if (requirement.type === "pokemon") return requirement.label ?? getPokemonEntry(requirement.pokemonId)?.name ?? "포켓몬";
  if (requirement.type === "candy") return `${getPokemonEntry(requirement.pokemonId)?.name ?? "포켓몬"} 사탕`;
  return requirement.label;
}

function getRaidEstimate(requirement: Extract<ActionRequirement, { type: "energy" }>) {
  if (!requirement.rewardPerRaid) return null;
  const remaining = Math.max(0, requirement.amount - (requirement.currentAssumedAmount ?? 0));
  const minimum = Math.ceil(remaining / requirement.rewardPerRaid.max);
  const maximum = Math.ceil(remaining / requirement.rewardPerRaid.min);
  return minimum === maximum ? `약 ${minimum}회` : `약 ${minimum}~${maximum}회`;
}

function RequirementRow({ requirement }: { requirement: ActionRequirement }) {
  const pokemonEntry = requirement.type === "pokemon" ? getPokemonEntry(requirement.pokemonId) : undefined;
  return <li className={`action-requirement requirement-${requirement.type}`}>
    {pokemonEntry ? <PokemonArtwork image={pokemonEntry.image} alt={pokemonEntry.name} size="sm" /> : <span className="requirement-symbol" aria-hidden="true">{requirement.type === "energy" ? "E" : requirement.type === "candy" ? "C" : "I"}</span>}
    <div>
      <strong>{getRequirementLabel(requirement)}</strong>
      {requirement.note ? <small>{requirement.note}</small> : null}
    </div>
    <b>×{requirement.amount.toLocaleString("ko-KR")}</b>
  </li>;
}

type ChecklistEntry = {
  goalId: string;
  item: ActionChecklistItem;
};

function collectChecklist(goals: readonly ActionGoal[]) {
  const seen = new Set<string>();
  const items: ChecklistEntry[] = [];
  for (const goal of goals) {
    for (const item of goal.checklist ?? []) {
      const key = `${goal.id}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ goalId: goal.id, item });
    }
  }
  return items;
}

function collectWarnings(goals: readonly ActionGoal[]) {
  const seen = new Set<string>();
  const warnings: ActionWarning[] = [];
  for (const warning of goals.flatMap((goal) => goal.warnings ?? [])) {
    if (seen.has(warning.description)) continue;
    seen.add(warning.description);
    warnings.push(warning);
  }
  return warnings;
}

export function PokemonActionGuide({
  guideId,
  actionGuide,
  eventWindow,
  eventPhase,
  ownershipId,
  onOwnershipChange,
}: {
  guideId: string;
  actionGuide: PokemonActionGuideData;
  eventWindow?: ActionEventWindow;
  eventPhase: ActionEventPhase;
  ownershipId?: string;
  onOwnershipChange: (ownershipId: string) => void;
}) {
  const initialGoalId = actionGuide.defaultGoalId ?? actionGuide.goals[0]?.id ?? "";
  const copy = actionGuideCopy[actionGuide.type];
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoalId);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [conditionalCostActive, setConditionalCostActive] = useState(false);
  const storageKey = `pokoweek:action-guide:${actionGuide.id}`;
  const conditionalCostStorageKey = `${storageKey}:conditional-cost:${actionGuide.conditionalCost?.id ?? "none"}`;

  useEffect(() => {
    setSelectedGoalId(initialGoalId);
  }, [initialGoalId]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setChecked(stored ? JSON.parse(stored) as Record<string, boolean> : {});
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  useEffect(() => {
    if (!actionGuide.conditionalCost) return;
    try {
      setConditionalCostActive(window.localStorage.getItem(conditionalCostStorageKey) === "true");
    } catch {
      setConditionalCostActive(false);
    }
  }, [actionGuide.conditionalCost, conditionalCostStorageKey]);

  const selectedGoals = useMemo(() => {
    if (selectedGoalId === COMBINED_GOAL_ID) return actionGuide.goals;
    return actionGuide.goals.filter((goal) => goal.id === selectedGoalId);
  }, [actionGuide.goals, selectedGoalId]);

  const selectedOwnership = actionGuide.ownershipCondition?.options.find((option) => option.id === ownershipId);
  const ownershipPresentation = getOwnershipPresentation(selectedOwnership, eventPhase);
  const displayedGoals = useMemo(() => {
    if (!actionGuide.ownershipCondition) return selectedGoals;
    return selectedGoals.map((goal) => ({
      ...goal,
      steps: ownershipPresentation?.steps ?? [],
      checklist: ownershipPresentation?.checklist ?? [],
    }));
  }, [actionGuide.ownershipCondition, selectedGoals, ownershipPresentation]);

  const requirements = useMemo(() => combineRequirements(selectedGoals), [selectedGoals]);
  const checklist = useMemo(() => collectChecklist(displayedGoals), [displayedGoals]);
  const warnings = useMemo(() => collectWarnings(selectedGoals), [selectedGoals]);
  const energyRequirements = requirements.filter((item): item is Extract<ActionRequirement, { type: "energy" }> => item.type === "energy");
  const pokemonRequirements = requirements.filter((item): item is Extract<ActionRequirement, { type: "pokemon" }> => item.type === "pokemon");

  function toggleChecklist(key: string) {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The checklist still works for this session when storage is unavailable.
    }
  }

  function toggleConditionalCost() {
    if (eventPhase !== "active") return;
    const next = !conditionalCostActive;
    setConditionalCostActive(next);
    try {
      window.localStorage.setItem(conditionalCostStorageKey, String(next));
    } catch {
      // The selection still works for this session when storage is unavailable.
    }
  }

  return <section className="decision-guide-board action-guide-board">
    <SectionHeader icon={<TargetIcon />} title={actionGuide.title} />
    {(actionGuide.phaseGuidance?.[eventPhase]?.summary ?? actionGuide.summary) ? <p className="action-guide-summary">{actionGuide.phaseGuidance?.[eventPhase]?.summary ?? actionGuide.summary}</p> : null}
    {eventWindow ? <p className={`action-event-status status-${eventPhase}`}>
      <b>{actionGuide.phaseGuidance?.[eventPhase]?.statusLabel ?? (eventPhase === "active" ? "진행 중" : eventPhase === "upcoming" ? "예정" : eventPhase === "claim_only" ? "보상 수령 기간" : eventPhase === "ended" ? "종료됨" : "기간 확인 중")}</b>
      <span>{eventWindow.label}{eventPhase === "claim_only" ? " · 랭크 진행은 끝났고 해금한 보상만 수령할 수 있어요." : eventPhase === "ended" ? " · 보상 수령까지 종료된 지난 이벤트입니다." : ""}</span>
    </p> : null}

    {actionGuide.ownershipCondition ? <div className="action-guide-block action-ownership-block">
      <h3><TargetIcon />{actionGuide.ownershipCondition.question}</h3>
      <div className="action-ownership-selector" role="group" aria-label={actionGuide.ownershipCondition.question}>
        {actionGuide.ownershipCondition.options.map((option) => <button
          key={option.id}
          type="button"
          className={ownershipId === option.id ? "selected" : ""}
          aria-pressed={ownershipId === option.id}
          onClick={() => onOwnershipChange(option.id)}
        >{option.label}</button>)}
      </div>
      {ownershipPresentation ? <p className="action-ownership-summary"><b>선택한 안내</b>{ownershipPresentation.summary}</p> : <div className="action-ownership-options"><p>{actionGuide.ownershipCondition.unselectedDescription}</p>{actionGuide.ownershipCondition.options.map((option) => <p key={option.id}><b>{option.label}</b>{getOwnershipPresentation(option, eventPhase)?.summary ?? option.summary}</p>)}</div>}
    </div> : null}

    {actionGuide.goals.length > 1 || actionGuide.allowCombinedGoals ? <div className="action-goal-selector" role="group" aria-label={copy.selector}>
      {actionGuide.goals.map((goal) => <button
        className={selectedGoalId === goal.id ? "selected" : ""}
        type="button"
        onClick={() => setSelectedGoalId(goal.id)}
        aria-pressed={selectedGoalId === goal.id}
        key={goal.id}
      >{goal.label}</button>)}
      {actionGuide.allowCombinedGoals && actionGuide.goals.length > 1 ? <button
        className={selectedGoalId === COMBINED_GOAL_ID ? "selected" : ""}
        type="button"
        onClick={() => setSelectedGoalId(COMBINED_GOAL_ID)}
        aria-pressed={selectedGoalId === COMBINED_GOAL_ID}
      >둘 다</button> : null}
    </div> : null}

    {!eventWindow || eventPhase === "active" || eventPhase === "upcoming" || eventPhase === "unknown" ? <div className="action-guide-block action-requirements-block">
      <h3><BagIcon />{copy.requirements}</h3>
      {actionGuide.type === "fusion" ? <p className="action-fusion-requirement-note"><b>중요</b> 얼어붙은세계가 없어도 융합 자체는 가능해요. 아래 준비물과 특별 기술 확인을 구분해 주세요.</p> : null}
      <ul>{requirements.map((requirement) => <RequirementRow requirement={requirement} key={requirementKey(requirement)} />)}</ul>
      {pokemonRequirements.length > 0 ? <div className="action-keep-summary">
        <b>몇 마리를 남겨야 하나요?</b>
        {pokemonRequirements.map((requirement) => <p key={requirementKey(requirement)}>
          <strong>{getRequirementLabel(requirement)}</strong>
          <span>{actionGuide.type === "fusion" ? "융합용" : actionGuide.type === "form_change" ? "폼 변경용" : "준비용"} {requirement.amount}마리 보관</span>
        </p>)}
      </div> : null}
    </div> : null}

    {energyRequirements.length > 0 ? <div className="action-guide-block action-raid-estimate">
      <h3><SwordsIcon />예상 레이드 횟수</h3>
      {energyRequirements.map((requirement) => {
        const estimate = getRaidEstimate(requirement);
        return <div key={requirement.id}>
          <b>{requirement.label}</b>
          <strong>{estimate ?? "현재 이벤트 획득량 확인 필요"}</strong>
          {!estimate ? <p>공식 안내에 레이드 1회당 지급량이 없어 임의 계산하지 않았어요.</p> : null}
        </div>;
      })}
    </div> : null}

    {warnings.length > 0 ? <div className="action-guide-block action-warning-block">
      <h3><TargetIcon />{copy.warnings}</h3>
      {actionGuide.relatedFormArtwork ? <figure className="action-related-form-artwork">
        <PokemonArtwork image={actionGuide.relatedFormArtwork.image} alt={actionGuide.relatedFormArtwork.label} size="md" />
        <figcaption>
          <strong>{actionGuide.relatedFormArtwork.label}</strong>
          {actionGuide.relatedFormArtwork.note ? <span>{actionGuide.relatedFormArtwork.note}</span> : null}
        </figcaption>
      </figure> : null}
      {warnings.map((warning) => <article className={`warning-${warning.importance}`} key={warning.id}>
        <strong>{warning.title}</strong>
        <p>{warning.description}</p>
      </article>)}
    </div> : null}

    {actionGuide.megaRestGuide ? <div className="action-guide-block action-mega-rest-block">
      <h3><TargetIcon />{actionGuide.megaRestGuide.title}</h3>
      <p>{actionGuide.megaRestGuide.summary}</p>
      <p>{actionGuide.megaRestGuide.levelNote}</p>
      <strong>{actionGuide.megaRestGuide.gameCheck}</strong>
      <ul>{actionGuide.megaRestGuide.decisionGuide.map((item) => <li key={item}>{item}</li>)}</ul>
      <small>{actionGuide.megaRestGuide.superMaxNote}</small>
    </div> : null}

    {actionGuide.conditionalCost ? <div className="action-guide-block action-conditional-cost-block">
      <h3><BagIcon />{actionGuide.conditionalCost.title}</h3>
      <p>{actionGuide.conditionalCost.description}</p>
      <button type="button" className={conditionalCostActive && eventPhase === "active" ? "selected" : ""} aria-pressed={conditionalCostActive && eventPhase === "active"} disabled={eventPhase !== "active"} onClick={toggleConditionalCost}>
        <i>{conditionalCostActive && eventPhase === "active" ? <CheckIcon /> : null}</i><span>{actionGuide.conditionalCost.selectionLabel}</span>
      </button>
      <div className="conditional-cost-options">
        <section className={!conditionalCostActive || eventPhase !== "active" ? "selected" : ""}><b>{actionGuide.conditionalCost.baseLabel}</b>{actionGuide.conditionalCost.baseCost.map((cost) => <p key={cost.label}><span>{cost.label}</span><strong>{cost.amount.toLocaleString("ko-KR")}</strong></p>)}</section>
        <section className={conditionalCostActive && eventPhase === "active" ? "selected" : ""}><b>{actionGuide.conditionalCost.activeLabel}</b>{actionGuide.conditionalCost.activeCost.map((cost) => <p key={cost.label}><span>{cost.label}</span><strong>{cost.amount.toLocaleString("ko-KR")}</strong></p>)}</section>
      </div>
      <ul className="conditional-cost-facts">{actionGuide.conditionalCost.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      <small>{eventPhase === "claim_only" || eventPhase === "ended" ? "랭크 35 이벤트 할인은 현재 적용되지 않아요. " : ""}{actionGuide.conditionalCost.note}</small>
    </div> : null}

    {displayedGoals.some((goal) => goal.steps.length > 0) ? <div className="action-guide-block action-flow-block">
      <h3><TargetIcon />{copy.flow}</h3>
      {displayedGoals.map((goal) => <div className="action-goal-flow" key={goal.id}>
        {displayedGoals.length > 1 ? <h4>{goal.label}</h4> : null}
        <ol>{goal.steps.map((step, index) => <li key={step.id}>
          <b>{index + 1}</b>
          <div><strong>{step.title}</strong>{step.description ? <p>{step.description}</p> : null}</div>
        </li>)}</ol>
      </div>)}
    </div> : actionGuide.ownershipCondition ? <p className="action-selection-prompt">보유 이력을 선택하면 맞춤 행동 순서와 체크리스트가 표시돼요.</p> : null}

    {checklist.length > 0 ? <div className="action-guide-block action-checklist-block">
      <h3><CheckIcon />{copy.checklist}</h3>
      <ul>{checklist.map(({ goalId, item }) => {
        const itemKey = `${goalId}:${item.id}`;
        return <li key={itemKey}>
          <button type="button" onClick={() => toggleChecklist(itemKey)} aria-pressed={Boolean(checked[itemKey])}>
            <i className={checked[itemKey] ? "checked" : ""}>{checked[itemKey] ? <CheckIcon /> : null}</i>
            <span><strong>{item.label}</strong>{item.reason ? <small>{item.reason}</small> : null}</span>
          </button>
        </li>;
      })}</ul>
    </div> : null}

    <div className="action-post-guides">
      {selectedGoals.flatMap((goal) => {
        const target = goal.postActionGuidePokemonId ? getPokemonEntry(goal.postActionGuidePokemonId) : undefined;
        if (!target || target.id === guideId) return [];
        return [<PrimaryCTA className="action-post-guide-link" href={target.href} leading={<SwordsIcon />} key={target.id}>{target.name} 육성 가이드 보기</PrimaryCTA>];
      })}
    </div>

    {actionGuide.source ? <a className="action-guide-source" href={actionGuide.source.url} target="_blank" rel="noreferrer">
      공식 정보 확인 · {actionGuide.source.name}<ChevronIcon />
    </a> : null}
  </section>;
}
