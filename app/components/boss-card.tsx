import Link from "next/link";
import { Boss } from "../data/types";
import { ChevronIcon } from "./icons";
import { PokemonThumbnail } from "./pokemon-thumbnail";

export function BossCard({ boss, compact = false }: { boss: Boss; compact?: boolean }) {
  return (
    <Link href={`/bosses/${boss.slug}`} className={`boss-card ${compact ? "compact" : ""}`}>
      <PokemonThumbnail
        className="boss-art"
        image={boss.sprite}
        name={boss.form ? `${boss.form} ${boss.name}` : boss.name}
        types={boss.types}
      />
      <div className="boss-copy">
        <div className="boss-topline"><span>{boss.battleType}</span><span>·</span><span>{boss.difficulty.split("·")[0]}</span></div>
        <strong>{boss.form ? `${boss.form} ` : ""}{boss.name}</strong>
        {!compact && <p>약점 {boss.weaknesses.slice(0, 3).join(" · ")}</p>}
      </div>
      <ChevronIcon className="card-chevron" />
    </Link>
  );
}
