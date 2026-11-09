import Link from "next/link";
import { Boss } from "../data/types";
import { ChevronIcon } from "./icons";

export function BossCard({ boss, compact = false }: { boss: Boss; compact?: boolean }) {
  return (
    <Link href={`/bosses/${boss.slug}`} className={`boss-card ${compact ? "compact" : ""}`}>
      <div className="boss-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={boss.sprite} alt="" />
      </div>
      <div className="boss-copy">
        <div className="boss-topline"><span>{boss.battleType}</span><span>·</span><span>{boss.difficulty.split("·")[0]}</span></div>
        <strong>{boss.form ? `${boss.form} ` : ""}{boss.name}</strong>
        <div className="type-row">{boss.types.map((type) => <span className={`type type-${type}`} key={type}>{type}</span>)}</div>
        {!compact && <p>약점 {boss.weaknesses.slice(0, 3).join(" · ")}</p>}
      </div>
      <ChevronIcon className="card-chevron" />
    </Link>
  );
}
