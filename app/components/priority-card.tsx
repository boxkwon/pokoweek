import Link from "next/link";
import { bosses } from "../data/bosses";
import type { WeekPriority } from "../data/types";
import { PokemonAvatar } from "./image-assets";

export function PriorityCard({ priority }: { priority: WeekPriority }) {
  const boss = priority.bossSlug ? bosses.find((item) => item.slug === priority.bossSlug) : undefined;
  const content = (
    <>
      <span className="priority-card-rank">{priority.rank}</span>
      <div className="priority-card-copy"><strong>{priority.title}</strong><p>{priority.description}</p><time>{priority.timeLabel}</time></div>
      {boss ? <PokemonAvatar src={boss.sprite} alt={boss.name} size="medium" /> : null}
    </>
  );
  return boss ? <Link className="priority-card" href={`/bosses/${boss.slug}`}>{content}</Link> : <article className="priority-card">{content}</article>;
}
