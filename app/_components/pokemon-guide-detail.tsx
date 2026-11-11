import Image from "next/image";
import Link from "next/link";
import { APP_SUBTITLE } from "../_config/app";
import type { PokemonGuide } from "../_data/guide-data";
import { typeColors } from "../_data/guide-data";
import { AppHeader } from "./app-header";
import { BottomNavigation } from "./bottom-nav";
import { CategoryBadge, PrimaryCTA, RatingStars, SectionHeader, TypeBadge } from "./design-system";
import { BackIcon, ChartIcon, CheckIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";

const valueRows = [
  { key: "raid", label: "일반 레이드" },
  { key: "max", label: "맥스배틀 전력" },
  { key: "pvp", label: "PvP (배틀리그)" },
] as const;

export function PokemonGuideDetail({ guide }: { guide: PokemonGuide }) {
  const visibleValues = valueRows.flatMap((item) => {
    const score = guide.values[item.key];
    return typeof score === "number" ? [{ ...item, score, reason: guide.valueReasons?.[item.key] }] : [];
  });

  return <main className="fresh-screen boss-screen generic-guide-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    <section className="reference-raid-hero generic-guide-hero">
      <Image className="raid-hero-backdrop" src="/images/events/dialgaraids.jpg" alt="" fill sizes="430px" priority />
      <span className="raid-hero-shade" />
      <Link className="floating-back" href="/guide" aria-label="공략 목록으로 돌아가기"><BackIcon /></Link>
      <PokemonArtwork className="dialga-hero-art" image={guide.image} alt={guide.image.alt} size="hero" priority />
      <div className="raid-hero-copy">
        <CategoryBadge className="max-label" icon={<SwordsIcon />}>{guide.formName ?? guide.categoryLabel}</CategoryBadge>
        <h1>{guide.name}</h1>
        <div className="hero-types">{guide.types.map((type, index) => <span className="type-with-divider" key={type}>{index > 0 ? <em>/</em> : null}<TypeBadge type={type} color={typeColors[type]} /></span>)}</div>
        <div className="must-catch"><RatingStars value={guide.rating} /><strong>{guide.reason}</strong></div>
      </div>
    </section>

    {guide.weaknesses.length > 0 ? <section className="weakness-board">
      <h2><TargetIcon />약점 <small>(더 큰 피해를 줌)</small></h2>
      <div>{guide.weaknesses.map((weakness) => <TypeBadge type={weakness.type} color={typeColors[weakness.type]} key={weakness.type} />)}</div>
    </section> : null}

    {guide.counters.length > 0 ? <section className="counter-board">
      <SectionHeader icon={<SwordsIcon />} title="추천 공격수" description="레이드·맥스배틀에서 효과적인 포켓몬" />
      <div className="reference-counter-grid">
        {guide.counters.map((counter, index) => <article className={["gold", "silver", "bronze"][index] ?? "silver"} key={`${counter.pokemonId}-${index}`}>
          <b>{index + 1}</b>
          {counter.image ? <PokemonArtwork className="counter-artwork" image={counter.image} alt={counter.name} size="lg" /> : <span className="counter-artwork counter-artwork-placeholder" aria-hidden="true" />}
          <h3>{counter.name.split(" ").map((line) => <span key={line}>{line}</span>)}</h3>
          {counter.recommendedMove ? <p>{counter.recommendedMove}</p> : null}
        </article>)}
      </div>
      <PrimaryCTA className="owned-pokemon-button" leading={<span className="mini-ball" />}>내가 가진 포켓몬으로 보기</PrimaryCTA>
    </section> : null}

    {visibleValues.length > 0 ? <section className="value-board">
      <SectionHeader icon={<ChartIcon />} title="가치 평가" description="이 포켓몬을 잡고 키울 가치가 있을까?" />
      <div className="value-table">
        {visibleValues.map((item, index) => <div className="value-row" key={item.key}>
          <strong className={`value-label value-${index}`}><SwordsIcon />{item.label}</strong>
          <RatingStars value={item.score} />
          {item.reason ? <p>{item.reason}</p> : <span />}
        </div>)}
      </div>
    </section> : null}

    {guide.recommendations.length > 0 || guide.summary ? <section className="recommend-board">
      <SectionHeader icon={<StarOutlineIcon />} title="추천 가이드" />
      <div className="recommend-content">
        {guide.recommendations.length > 0 ? <ul>{guide.recommendations.map((item) => <li key={item}><CheckIcon /><b>{item}</b></li>)}</ul> : null}
        {guide.summary ? <aside><strong>ⓘ 한 줄 요약</strong><p>{guide.summary}</p></aside> : null}
        {guide.source ? <a className="guide-source-link" href={guide.source.url} target="_blank" rel="noreferrer">출처 · {guide.source.name}</a> : null}
      </div>
    </section> : null}

    <BottomNavigation active="guide" />
  </main>;
}
