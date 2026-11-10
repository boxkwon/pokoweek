import type { ReactNode } from "react";
import { CalendarIcon, CheckIcon, ClockIcon, StarIcon } from "./icons";
import { TypeIcon } from "./image-assets";

export type CategoryTone = "legendary" | "mega" | "max" | "shadow" | "event" | "community" | "raid";

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="ds-section-header">
      <div>{eyebrow ? <span>{eyebrow}</span> : null}<h2>{title}</h2></div>
      {action ? <div className="ds-section-action">{action}</div> : null}
    </div>
  );
}

export function CategoryBadge({ tone, children }: { tone: CategoryTone; children: ReactNode }) {
  const icon = tone === "event" || tone === "community" ? <CalendarIcon /> : tone === "max" ? <StarIcon /> : null;
  return <span className={`category-badge ${tone}`}>{icon}{children}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  return <span className="type-badge"><TypeIcon type={type} size="small" /><b>{type}</b></span>;
}

export function RatingStars({ value, label = "추천도" }: { value: number; label?: string }) {
  return (
    <div className="rating-stars" aria-label={`${label} 5점 만점에 ${value}점`}>
      {Array.from({ length: 5 }, (_, index) => <StarIcon className={index < value ? "filled" : ""} key={index} />)}
    </div>
  );
}

export function CountdownBadge({ children }: { children: ReactNode }) {
  return <span className="countdown-badge"><ClockIcon />{children}</span>;
}

export function PreparationChecklist({ items, variant = "done" }: { items: string[]; variant?: "done" | "todo" }) {
  return <ul className={`preparation-checklist ${variant}`}>{items.map((item) => <li key={item}>{variant === "done" ? <CheckIcon /> : <i aria-hidden="true" />}<span>{item}</span></li>)}</ul>;
}

export function ValueRating({ label, value, reason }: { label: string; value: number; reason?: string }) {
  return <div className="value-rating"><span>{label}</span><div>{Array.from({ length: 5 }, (_, index) => <StarIcon className={index < value ? "active" : ""} key={index} />)}</div><p>{reason}</p></div>;
}
