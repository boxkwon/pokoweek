"use client";

import type { GuideLeagueTarget, InvestmentLevel } from "../_data/guide-data";
import { RatingStars, SectionHeader } from "./design-system";
import { ChartIcon } from "./icons";

const decisionLabels = {
  recommended: "추천",
  conditional: "조건부",
  hold: "보류",
} as const;

const investmentLabels: Record<InvestmentLevel, string> = {
  high: "적극 투자",
  recommended: "투자 추천",
  conditional: "조건부",
  hold: "보류",
  low: "우선순위 낮음",
};

function MovesetSummary({ target }: { target: GuideLeagueTarget }) {
  const moves = [
    ["노말", target.moveset?.fastMove?.name],
    ["스페셜", target.moveset?.chargedMove?.name],
    ["스페셜 2", target.moveset?.chargedMove2?.name],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  if (moves.length === 0) return <p className="league-unverified">검증된 리그 전용 기술 조합이 없어 임의로 추천하지 않아요.</p>;
  return <dl className="league-moveset">{moves.map(([label, move]) => <div key={label}><dt>{label}</dt><dd>{move}</dd></div>)}</dl>;
}

export function PokemonLeagueGuide({
  targets,
  selectedLeague,
  onSelect,
}: {
  targets: readonly GuideLeagueTarget[];
  selectedLeague: GuideLeagueTarget["league"];
  onSelect: (league: GuideLeagueTarget["league"]) => void;
}) {
  const selected = targets.find((target) => target.league === selectedLeague) ?? targets[0];
  if (!selected) return null;

  return <section className="decision-guide-board guide-league-board">
    <SectionHeader icon={<ChartIcon />} title="리그별 육성 목표" />
    <div className="guide-league-tabs" role="tablist" aria-label="PvP 리그 선택">
      {targets.map((target) => <button
        key={target.league}
        type="button"
        role="tab"
        aria-selected={selected.league === target.league}
        className={selected.league === target.league ? "selected" : ""}
        onClick={() => onSelect(target.league)}
      >{target.label}</button>)}
    </div>
    <article className="guide-league-selected" role="tabpanel">
      <header>
        <div><b>{selected.label}</b><strong>{selected.cpLimit ? `CP ${selected.cpLimit.toLocaleString("ko-KR")} 이하` : "CP 상한 없음"}</strong></div>
        <span className={`league-${selected.decision}`}>{decisionLabels[selected.decision]}</span>
      </header>
      <p>{selected.reason}</p>
      <div className="league-target-grid">
        <section><b>개체 선택 방향</b><p>{selected.ivDirection}</p></section>
        <section><b>강화 목표</b><p>{selected.powerUpTarget}</p></section>
      </div>
      <MovesetSummary target={selected} />
      {selected.moveset?.conditions?.length ? <ul className="league-conditions">{selected.moveset.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul> : null}
      <div className="league-investment-grid">
        <section><b>기술 해방</b><strong>{investmentLabels[selected.secondMove.decision]}</strong><p>{selected.secondMove.reason}</p></section>
        <section><b>XL 사탕</b><strong>{investmentLabels[selected.xlCandy.decision]}</strong><p>{selected.xlCandy.reason}</p></section>
      </div>
      <div className="league-usecase"><b>이 리그 활용도</b>{selected.useCase.rating === null ? <strong>성능 미평가</strong> : <RatingStars value={selected.useCase.rating} />}<p>{selected.useCase.reason}</p></div>
      <small>{selected.checkBeforePowerUp}</small>
    </article>
  </section>;
}
