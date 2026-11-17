"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ActionChecklistItem,
  ActionGoal,
  ActionRequirement,
  ActionWarning,
  PokemonActionGuide as PokemonActionGuideData,
} from "../_data/guide-data";
import { pokemon } from "../_data/guide-data";
import { PrimaryCTA, SectionHeader } from "./design-system";
import { BagIcon, CheckIcon, ChevronIcon, SwordsIcon, TargetIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";

const COMBINED_GOAL_ID = "all-goals";

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
  if (requirement.type === "pokemon") return getPokemonEntry(requirement.pokemonId)?.name ?? "포켓몬";
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
}: {
  guideId: string;
  actionGuide: PokemonActionGuideData;
}) {
  const initialGoalId = actionGuide.defaultGoalId ?? actionGuide.goals[0]?.id ?? "";
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoalId);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const storageKey = `pokoweek:action-guide:${actionGuide.id}`;

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

  const selectedGoals = useMemo(() => {
    if (selectedGoalId === COMBINED_GOAL_ID) return actionGuide.goals;
    return actionGuide.goals.filter((goal) => goal.id === selectedGoalId);
  }, [actionGuide.goals, selectedGoalId]);

  const requirements = useMemo(() => combineRequirements(selectedGoals), [selectedGoals]);
  const checklist = useMemo(() => collectChecklist(selectedGoals), [selectedGoals]);
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

  return <section className="decision-guide-board action-guide-board">
    <SectionHeader icon={<TargetIcon />} title={actionGuide.title} />
    {actionGuide.summary ? <p className="action-guide-summary">{actionGuide.summary}</p> : null}

    <div className="action-goal-selector" role="group" aria-label="융합 목표 선택">
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
    </div>

    <div className="action-guide-block action-requirements-block">
      <h3><BagIcon />융합 자체에 필요한 것</h3>
      {actionGuide.type === "fusion" ? <p className="action-fusion-requirement-note"><b>중요</b> 얼어붙은세계가 없어도 융합 자체는 가능해요. 아래 준비물과 특별 기술 확인을 구분해 주세요.</p> : null}
      <ul>{requirements.map((requirement) => <RequirementRow requirement={requirement} key={requirementKey(requirement)} />)}</ul>
      <div className="action-keep-summary">
        <b>몇 마리를 남겨야 하나요?</b>
        {pokemonRequirements.map((requirement) => <p key={requirementKey(requirement)}>
          <strong>{getRequirementLabel(requirement)}</strong>
          <span>융합용 {requirement.amount}마리 보관</span>
        </p>)}
      </div>
    </div>

    <div className="action-guide-block action-raid-estimate">
      <h3><SwordsIcon />예상 레이드 횟수</h3>
      {energyRequirements.map((requirement) => {
        const estimate = getRaidEstimate(requirement);
        return <div key={requirement.id}>
          <b>{requirement.label}</b>
          <strong>{estimate ?? "현재 이벤트 획득량 확인 필요"}</strong>
          {!estimate ? <p>공식 안내에 레이드 1회당 지급량이 없어 임의 계산하지 않았어요.</p> : null}
        </div>;
      })}
    </div>

    {warnings.length > 0 ? <div className="action-guide-block action-warning-block">
      <h3><TargetIcon />특별 기술과 융합 후 주의사항</h3>
      {warnings.map((warning) => <article className={`warning-${warning.importance}`} key={warning.id}>
        <strong>{warning.title}</strong>
        <p>{warning.description}</p>
      </article>)}
    </div> : null}

    <div className="action-guide-block action-flow-block">
      <h3><TargetIcon />완성 순서</h3>
      {selectedGoals.map((goal) => <div className="action-goal-flow" key={goal.id}>
        {selectedGoals.length > 1 ? <h4>{goal.label}</h4> : null}
        <ol>{goal.steps.map((step, index) => <li key={step.id}>
          <b>{index + 1}</b>
          <div><strong>{step.title}</strong>{step.description ? <p>{step.description}</p> : null}</div>
        </li>)}</ol>
      </div>)}
    </div>

    {checklist.length > 0 ? <div className="action-guide-block action-checklist-block">
      <h3><CheckIcon />융합 조건과 특별 기술을 확인하세요</h3>
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
