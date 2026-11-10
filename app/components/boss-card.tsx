import Link from "next/link";
import { Boss } from "../data/types";
import { ChevronIcon } from "./icons";
import { PokemonThumbnail } from "./pokemon-thumbnail";

export function BossCard({ boss, compact = false }: { boss: Boss; compact?: boolean }) {
  const href = `/bosses/${boss.slug}`;
  return (
    <article className={`boss-card ${compact ? "compact" : ""}`}>
      <PokemonThumbnail
        className="boss-art"
        image={boss.sprite}
        name={boss.form ? `${boss.form} ${boss.name}` : boss.name}
        types={boss.types}
        href={href}
      />
      <Link className="boss-copy" href={href}>
        <div className="boss-topline"><span>{boss.battleType}</span><span>·</span><span>{boss.difficulty.split("·")[0]}</span></div>
        <strong>{boss.form ? `${boss.form} ` : ""}{boss.name}</strong>
        {!compact && <p>약점 {boss.weaknesses.slice(0, 3).join(" · ")}</p>}
      </Link>
      <Link className="boss-card-chevron" href={href} aria-label={`${boss.name} 공략 보기`}><ChevronIcon className="card-chevron" /></Link>
    </article>
  );
}
