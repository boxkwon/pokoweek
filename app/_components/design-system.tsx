import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarIcon, ChevronIcon, ClockIcon } from "./icons";
import { PokemonGuideLink } from "./pokemon-guide-link";

export function SectionHeader({
  icon,
  title,
  description,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return <header className={className}>{icon}<h2>{title}</h2>{description ? <p>{description}</p> : null}</header>;
}

export function TypeBadge({ type, color }: { type: string; color: string }) {
  return <span className="hero-type" style={{ backgroundColor: color }}><Image src={`/images/types/${type}.png`} alt="" width={28} height={28} /><b>{type}</b></span>;
}

export function CategoryBadge({ icon, children, className = "" }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return <span className={`category-badge ${className}`.trim()}>{icon}{children}</span>;
}

export function RatingStars({ value = 5, className = "" }: { value?: number; className?: string }) {
  return <span className={`star-line ${className}`.trim()} aria-label={`추천도 ${value}점`}>{[0,1,2,3,4].map((index) => <i className={index < value ? "on" : ""} key={index}>★</i>)}</span>;
}

export function CountdownBadge({ days }: { days: number }) {
  return <span className="countdown-badge">{days > 0 ? `D-${days}` : days === 0 ? "D-DAY" : "진행 중"}</span>;
}

export function EventTime({
  availabilityTime,
  featuredHour,
  availabilityLabel = "출현",
  featuredLabel = "집중 시간",
  className = "",
}: {
  availabilityTime?: string;
  featuredHour?: string;
  availabilityLabel?: string;
  featuredLabel?: string;
  className?: string;
}) {
  const sameTime = Boolean(availabilityTime && featuredHour && availabilityTime.trim() === featuredHour.trim());
  return <div className={className}>
    {!sameTime && availabilityTime ? <p><b>{availabilityLabel}</b><time>{availabilityTime}</time></p> : null}
    {featuredHour ? <p className="featured"><b>{featuredLabel}</b><time>{featuredHour}</time></p> : null}
  </div>;
}

export function EventMeta({
  dateLabel,
  timeLabel,
  className = "",
  compact = false,
}: {
  dateLabel: string;
  timeLabel: string;
  className?: string;
  compact?: boolean;
}) {
  if (compact) return <div className={className}>
    <span><CalendarIcon />{dateLabel}</span>
    <i />
    <span><ClockIcon />{timeLabel}</span>
  </div>;
  return <section className={`event-time-board ${className}`.trim()}>
    <div><span><CalendarIcon />기간</span><b>{dateLabel}</b></div>
    <i />
    <div><span><ClockIcon />시간</span><b>{timeLabel}</b></div>
  </section>;
}

export function PrimaryCTA({
  href,
  className,
  leading,
  children,
  trailing = true,
}: {
  href?: string;
  className: string;
  leading?: ReactNode;
  children: ReactNode;
  trailing?: boolean;
}) {
  const content = <>{leading}{children}{trailing ? <ChevronIcon /> : null}</>;
  if (href?.startsWith("/pokemon/")) return <PokemonGuideLink className={className} href={href}>{content}</PokemonGuideLink>;
  return href
    ? <Link className={className} href={href}>{content}</Link>
    : <button className={className} type="button">{content}</button>;
}
