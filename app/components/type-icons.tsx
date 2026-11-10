"use client";

import { useEffect, useId, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { getTypeMatchup, typeIconUrl } from "../lib/pokemon";

type TooltipPosition = { left: number; top: number; below: boolean };

function MatchupTypes({ types }: { types: string[] }) {
  if (types.length === 0) return <span className="type-matchup-empty">없음</span>;
  return (
    <span className="type-matchup-list">
      {types.map((type) => (
        <span className="type-matchup-chip" key={type}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={typeIconUrl(type)} alt="" aria-hidden="true" />
          <b>{type}</b>
        </span>
      ))}
    </span>
  );
}

export function TypeIcons({
  types,
  size = "medium",
  label = "타입",
}: {
  types: string[];
  size?: "small" | "medium" | "large";
  label?: string;
}) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!selectedType) return;
    const close = (event: globalThis.PointerEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-type-button]") && !target.closest("[data-type-tooltip]")) setSelectedType(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedType(null);
    };
    const closeOnMove = () => setSelectedType(null);
    document.addEventListener("pointerdown", close);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnMove);
    window.addEventListener("scroll", closeOnMove, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnMove);
      window.removeEventListener("scroll", closeOnMove, true);
    };
  }, [selectedType]);

  function openTooltip(type: string, event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (selectedType === type) {
      setSelectedType(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12);
    const below = rect.top < 255;
    setPosition({ left, top: below ? rect.bottom + 10 : rect.top - 10, below });
    setSelectedType(type);
  }

  const matchup = selectedType ? getTypeMatchup(selectedType) : null;

  return (
    <>
      <div className={`pokemon-type-icons ${size}`} aria-label={`${label}: ${types.join(", ")}`}>
        {types.map((type) => {
          const icon = typeIconUrl(type);
          return icon ? (
            <button
              type="button"
              className="pokemon-type-icon"
              aria-label={`${type} 타입 상성 보기`}
              aria-expanded={selectedType === type}
              aria-controls={selectedType === type ? tooltipId : undefined}
              data-type-button
              onClick={(event) => openTooltip(type, event)}
              key={type}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt="" aria-hidden="true" />
              <span className="sr-only">{type} 타입</span>
            </button>
          ) : null;
        })}
      </div>

      {selectedType && matchup && position && createPortal(
        <div
          className={`type-tooltip ${position.below ? "below" : "above"}`}
          id={tooltipId}
          role="tooltip"
          data-type-tooltip
          style={{ left: position.left, top: position.top }}
        >
          <div className="type-tooltip-head">
            <span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={typeIconUrl(selectedType)} alt="" />
              <strong>{selectedType} 타입</strong>
            </span>
            <button type="button" aria-label="타입 설명 닫기" onClick={() => setSelectedType(null)}>×</button>
          </div>
          <p>단일 타입 기준 상성이에요.</p>
          <div className="type-matchup-row strong">
            <span><b>강함</b><small>공격할 때</small></span>
            <MatchupTypes types={matchup.strong} />
          </div>
          <div className="type-matchup-row weak">
            <span><b>약함</b><small>공격받을 때</small></span>
            <MatchupTypes types={matchup.weak} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
