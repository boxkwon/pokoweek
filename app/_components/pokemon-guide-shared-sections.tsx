import type { PokemonGuide } from "../_data/guide-data";
import { typeColors } from "../_data/guide-data";
import { CategoryBadge, PrimaryCTA, SectionHeader, TypeBadge } from "./design-system";
import { CheckIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";

export function PokemonWeaknessSection({ guide }: { guide: PokemonGuide }) {
  if (guide.weaknesses.length === 0) return null;
  return <section className="weakness-board">
    <h2><TargetIcon />약점 <small>(더 큰 피해를 줌)</small></h2>
    <div>{guide.weaknesses.map((weakness) => <TypeBadge type={weakness.type} color={typeColors[weakness.type]} key={weakness.type} />)}</div>
  </section>;
}

export function PokemonCounterSection({ guide }: { guide: PokemonGuide }) {
  return <section className="counter-board">
    <SectionHeader icon={<SwordsIcon />} title="추천 공격수" description="레이드·맥스배틀에서 효과적인 포켓몬" />
    {guide.dataStatus.counters === "ready" ? <>
      <div className="reference-counter-grid">
      {guide.counters.slice(0, 5).map((counter, index) => <article className={["gold", "silver", "bronze"][index] ?? "silver"} key={`${counter.pokemonId}-${index}`}>
        <b>{index + 1}</b>
        {counter.image ? <PokemonArtwork className="counter-artwork" image={counter.image} alt={counter.name} size="lg" /> : <span className="counter-artwork counter-artwork-placeholder" aria-hidden="true" />}
        <h3>{counter.name.split(" ").map((line) => <span key={line}>{line}</span>)}</h3>
        {counter.recommendedMove ? <p>{counter.recommendedMove}</p> : null}
      </article>)}
      </div>
      <PrimaryCTA className="owned-pokemon-button" leading={<span className="mini-ball" />}>내가 가진 포켓몬으로 보기</PrimaryCTA>
    </> : <p className="guide-data-missing" data-status="missing">검증된 추천 공격수 데이터를 준비 중이에요.</p>}
  </section>;
}

export function PokemonRecommendationSection({ guide, showSummary = true }: { guide: PokemonGuide; showSummary?: boolean }) {
  if (guide.recommendations.length === 0 && (!showSummary || !guide.summary)) return null;
  return <section className="recommend-board">
    <SectionHeader icon={<StarOutlineIcon />} title="추천 가이드" />
    <div className={`recommend-content ${showSummary ? "" : "recommend-only"}`.trim()}>
      {guide.recommendations.length > 0 ? <ul>{guide.recommendations.map((item) => <li key={item}><CheckIcon /><b>{item}</b></li>)}</ul> : null}
      {showSummary && guide.summary ? <aside><strong>ⓘ 한 줄 요약</strong><p>{guide.summary}</p></aside> : null}
      {guide.source ? <a className="guide-source-link" href={guide.source.url} target="_blank" rel="noreferrer">출처 · {guide.source.name}</a> : null}
    </div>
  </section>;
}
