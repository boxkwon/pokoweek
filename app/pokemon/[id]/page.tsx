import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DialgaGuidePage from "../../bosses/dialga-dynamax/page";
import { AppHeader } from "../../_components/app-header";
import { BottomNavigation } from "../../_components/bottom-nav";
import { CategoryBadge, RatingStars, SectionHeader, TypeBadge } from "../../_components/design-system";
import { BackIcon, CheckIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "../../_components/icons";
import { PokemonArtwork } from "../../_components/pokemon-artwork";
import { APP_SUBTITLE } from "../../_config/app";
import { pokemonGuides, typeColors, wildAreaEvent } from "../../_data/guide-data";
import { getPokemonGuide } from "../../_data/queries";

export function generateStaticParams() {
  return pokemonGuides.map((guide) => ({ id: guide.id }));
}

export default async function PokemonGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = getPokemonGuide(id);
  if (!guide) notFound();
  if (guide.id === "dynamax-dialga") return <DialgaGuidePage />;

  return <main className="fresh-screen boss-screen generic-guide-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    <section className="reference-raid-hero generic-guide-hero">
      <Image className="raid-hero-backdrop" src={wildAreaEvent.heroImage} alt="" fill sizes="430px" priority />
      <span className="raid-hero-shade" />
      <Link className="floating-back" href="/guide" aria-label="공략 목록으로 돌아가기"><BackIcon /></Link>
      <PokemonArtwork className="dialga-hero-art" image={guide.pokemon.image} alt={guide.pokemon.name} size="hero" priority />
      <div className="raid-hero-copy">
        <CategoryBadge className="max-label" icon={<SwordsIcon />}>{guide.categoryLabel}</CategoryBadge>
        <h1>{guide.pokemon.name}</h1>
        <div className="hero-types">{guide.pokemon.types.map((type, index) => <span className="type-with-divider" key={type}>{index > 0 ? <em>/</em> : null}<TypeBadge type={type} color={typeColors[type]} /></span>)}</div>
        <div className="must-catch"><RatingStars value={guide.rating} /><strong>{guide.reason}</strong></div>
      </div>
    </section>

    <section className="weakness-board">
      <h2><TargetIcon />약점 <small>(더 큰 피해를 줌)</small></h2>
      <div>{guide.weaknesses.map((type) => <TypeBadge type={type} color={typeColors[type]} key={type} />)}</div>
    </section>

    <section className="value-board generic-guide-value">
      <SectionHeader icon={<SwordsIcon />} title="공략 핵심" description="이번 주 이 포켓몬을 준비하는 이유" />
      <div className="value-table"><div className="value-row"><strong className="value-label value-0"><SwordsIcon />추천도</strong><RatingStars value={guide.rating} /><p>{guide.reason}</p></div></div>
    </section>

    <section className="recommend-board">
      <SectionHeader icon={<StarOutlineIcon />} title="추천 가이드" />
      <div className="recommend-content">
        <ul>{guide.recommendations.map((item) => <li key={item}><CheckIcon /><b>{item}</b></li>)}</ul>
        <aside><strong>ⓘ 한 줄 요약</strong><p>{guide.summary}</p></aside>
      </div>
    </section>

    <BottomNavigation active="guide" />
  </main>;
}
