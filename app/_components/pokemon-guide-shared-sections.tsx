import type { PokemonGuide } from "../_data/guide-data";
import { typeColors } from "../_data/guide-data";
import { CategoryBadge, PrimaryCTA, SectionHeader, TypeBadge } from "./design-system";
import { CheckIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";

type CounterMode = "raid" | "mega" | "max" | "shadow";

const counterModeLabels: Record<CounterMode, string> = {
  raid: "레이드",
  mega: "메가 레이드",
  max: "맥스배틀",
  shadow: "그림자 레이드",
};

function getCounterModes(guide: PokemonGuide): CounterMode[] {
  const battleTypes = new Set(guide.battleTypes);

  // Mega and Shadow describe the boss encounter itself. Their regular-form
  // raid use case should not change the counter section's context.
  if (battleTypes.has("mega")) return ["mega"];
  if (battleTypes.has("shadow")) return ["shadow"];

  const modes: CounterMode[] = [];
  if (battleTypes.has("raid") || guide.useCases?.raid) modes.push("raid");
  if (battleTypes.has("max") || battleTypes.has("gigantamax") || guide.useCases?.max) modes.push("max");

  if (modes.length > 0) return modes;
  if (guide.category === "mega") return ["mega"];
  if (guide.category === "shadow") return ["shadow"];
  if (guide.category === "max") return ["max"];
  return ["raid"];
}

export function getCounterSectionDescription(guide: PokemonGuide) {
  return `${getCounterModes(guide).map((mode) => counterModeLabels[mode]).join("·")}에서 효과적인 포켓몬`;
}

export function PokemonWeaknessSection({ guide }: { guide: PokemonGuide }) {
  if (guide.weaknesses.length === 0) return null;
  return <section className="weakness-board">
    <h2><TargetIcon />약점 <small>(더 큰 피해를 줌)</small></h2>
    <div>{guide.weaknesses.map((weakness) => <TypeBadge type={weakness.type} color={typeColors[weakness.type]} key={weakness.type} />)}</div>
  </section>;
}

export function PokemonCounterSection({ guide }: { guide: PokemonGuide }) {
  return <section className="counter-board">
    <SectionHeader icon={<SwordsIcon />} title="추천 공격수" description={getCounterSectionDescription(guide)} />
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
