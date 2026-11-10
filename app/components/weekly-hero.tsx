import Link from "next/link";
import { bosses } from "../data/bosses";
import type { WeekGuide } from "../data/types";
import { ChevronIcon } from "./icons";
import { PokemonArtwork } from "./image-assets";
import { CategoryBadge, CountdownBadge } from "./ui";

export function WeeklyHero({ week }: { week: WeekGuide }) {
  const featured = week.featuredBossSlugs.map((slug) => bosses.find((boss) => boss.slug === slug)).filter(Boolean) as typeof bosses;
  return (
    <section className="weekly-hero">
      <div className="weekly-hero-art" aria-hidden="true">
        {featured.map((boss, index) => (
          <PokemonArtwork
            src={boss.sprite}
            alt=""
            size="hero"
            position="right"
            objectPosition={boss.artwork?.objectPosition}
            scale={boss.artwork?.scale ?? 1}
            priority={index < 2}
            className={`weekly-hero-pokemon pokemon-${index + 1}`}
            key={boss.slug}
          />
        ))}
      </div>
      <div className="weekly-hero-copy">
        <CategoryBadge tone="event">이번 주 가이드</CategoryBadge>
        <CountdownBadge>{week.eyebrow}</CountdownBadge>
        <h1>{week.title}</h1>
        <p>{week.summary}</p>
        <Link href="/raids">주간 레이드 보기 <ChevronIcon /></Link>
      </div>
    </section>
  );
}
