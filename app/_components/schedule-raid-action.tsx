"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const dialogRoot = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => trigger.current?.focus(), 0);
  }, []);

  const trapFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => !element.hasAttribute("inert"));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (focusable.length === 1 || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  };

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const root = dialogRoot.current;
    const background = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== root);
    const previous = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    const previousOverflow = document.body.style.overflow;
    for (const item of previous) {
      item.element.inert = true;
      item.element.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      for (const item of previous) {
        item.element.inert = item.inert;
        if (item.ariaHidden === null) item.element.removeAttribute("aria-hidden");
        else item.element.setAttribute("aria-hidden", item.ariaHidden);
      }
    };
  }, [close, open]);

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
    {open && typeof document !== "undefined" ? createPortal(<div ref={dialogRoot} className="schedule-guide-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <section className="schedule-guide-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={trapFocus}>
        <b id={titleId}>{pokemonNames}</b>
        <p id={descriptionId}>상세 공략은 아직 준비 중이에요. 레이드 일정과 정확한 폼 정보는 계속 확인할 수 있습니다.</p>
        <button ref={closeButton} type="button" onClick={close}>확인</button>
      </section>
    </div>, document.body) : null}
  </>;
}
