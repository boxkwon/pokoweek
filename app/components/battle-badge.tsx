import { BoltIcon, CalendarIcon, RaidHeadIcon } from "./icons";

export type BattleBadgeTone = "raid" | "max" | "event" | "community" | "spotlight" | "research";

export function BattleBadge({
  tone,
  label,
  tier,
  compact = false,
}: {
  tone: BattleBadgeTone;
  label: string;
  tier?: number;
  compact?: boolean;
}) {
  const icon = tone === "raid"
    ? <RaidHeadIcon />
    : tone === "max"
      ? <BoltIcon />
      : <CalendarIcon />;

  return (
    <span className={`battle-badge ${tone} ${compact ? "compact" : ""}`} aria-label={tier ? `${label}, ${tier}성` : label}>
      <span className="battle-badge-icon" aria-hidden="true">{icon}</span>
      {tier ? (
        <span className="battle-badge-rank" aria-hidden="true">
          {Array.from({ length: tier }, (_, index) => <i key={index} />)}
        </span>
      ) : null}
      {!compact ? <span className="battle-badge-label">{label}</span> : null}
    </span>
  );
}
