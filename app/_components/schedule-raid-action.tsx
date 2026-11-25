"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ContextLink } from "./context-link";
import { ChevronIcon } from "./icons";

type RaidAction = {
  label: string;
  href?: string;
};

function ActionCue({ label }: { label: string }) {
  return <span className="schedule-raid-action-cue"><small>{label}</small><ChevronIcon /></span>;
}

export function ScheduleRaidAction({
  action,
  pokemonNames,
  children,
}: {
  action: RaidAction;
  pokemonNames: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    window.setTimeout(() => trigger.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (action.href) {
    return <ContextLink className="schedule-raid-touch-target" href={action.href} aria-label={`${pokemonNames} ${action.label}`}>
      {children}
      <ActionCue label={action.label} />
    </ContextLink>;
  }

  return <>
    <div
      ref={trigger}
      className="schedule-raid-touch-target"
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`${pokemonNames} ${action.label}`}
      onClick={() => setOpen(true)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setOpen(true);
      }}
    >
      {children}
      <ActionCue label={action.label} />
    </div>
    {open ? <div className="schedule-guide-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <section className="schedule-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-guide-dialog-title">
        <b id="schedule-guide-dialog-title">{pokemonNames}</b>
        <p>상세 공략은 아직 준비 중이에요. 레이드 일정과 정확한 폼 정보는 계속 확인할 수 있습니다.</p>
        <button ref={closeButton} type="button" onClick={close}>확인</button>
      </section>
    </div> : null}
  </>;
}
