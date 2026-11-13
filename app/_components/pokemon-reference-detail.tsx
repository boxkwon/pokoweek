import Image from "next/image";
import type { GuideMoveset, InvestmentLevel, PokemonGuide } from "../_data/guide-data";
import { typeColors } from "../_data/guide-data";
import { APP_SUBTITLE } from "../_config/app";
import { AppHeader } from "./app-header";
import { BottomNavigation } from "./bottom-nav";
import { CategoryBadge, RatingStars, SectionHeader, TypeBadge } from "./design-system";
import { DetailBackButton } from "./detail-back-button";
import { BagIcon, ChartIcon, CheckIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";
import { PokemonCounterSection, PokemonRecommendationSection, PokemonWeaknessSection } from "./pokemon-guide-shared-sections";
import { PokemonWeekSchedule } from "./pokemon-week-schedule";

const modeDefinitions = [
  { key: "raid", label: "레이드" },
  { key: "max", label: "맥스배틀" },
  { key: "pvp", label: "PvP" },
] as const;

const investmentDefinitions = [
  { key: "powerUp", label: "강화" },
  { key: "stardust", label: "별의모래" },
  { key: "candy", label: "일반 사탕" },
  { key: "xlCandy", label: "XL 사탕" },
  { key: "secondMove", label: "기술 해방" },
  { key: "maxMove", label: "맥스기술" },
  { key: "rareCandy", label: "이상한사탕" },
] as const;

const investmentLabels: Record<InvestmentLevel, string> = {
  high: "적극 투자",
  recommended: "투자 추천",
  conditional: "조건부",
  hold: "보류",
  low: "우선순위 낮음",
};

const eliteTmLabels = {
  required: "필수",
  recommended: "추천",
  conditional: "조건부",
  not_needed: "필요 없음",
} as const;

const moveTagLabels = {
  fast_tm: "일반 기술머신",
  charged_tm: "스페셜 기술머신",
  elite_tm: "대단한 기술머신 필요",
  event_limited: "이벤트 한정 기술",
} as const;

function ratingLabel(value: number) {
  if (value === 5) return "매우 좋음";
  if (value === 4) return "좋음";
  if (value === 3) return "조건부";
  if (value === 2) return "낮음";
  return "매우 낮음";
}

export function GuideUseCases({ guide }: { guide: PokemonGuide }) {
  const items = modeDefinitions.flatMap((mode) => {
    const value = guide.useCases?.[mode.key];
    return value ? [{ ...mode, ...value }] : [];
  });
  return <section className="dialga-guide-board guide-use-board">
    <SectionHeader icon={<ChartIcon />} title="어디에 쓰나요?" />
    {items.length > 0 ? <div className="guide-use-list">{items.map((item) => <article key={item.key}>
      <b>{item.label}</b>
      <div><RatingStars value={item.rating} /><strong>{ratingLabel(item.rating)}</strong></div>
      <p>{item.reason}</p>
    </article>)}</div> : <p className="guide-data-missing">검증된 활용도 정보를 준비 중이에요.</p>}
  </section>;
}

function MovesetRows({ moveset }: { moveset: GuideMoveset }) {
  const rows = [
    ["일반 기술", moveset.fastMove],
    ["스페셜 기술", moveset.chargedMove],
    ["스페셜 기술 2", moveset.chargedMove2],
    ["맥스 기술", moveset.maxMove],
  ] as const;
  return <div className="moveset-rows">{rows.flatMap(([label, move]) => move ? [<div key={label}>
    <span>{label}</span>
    <div><b>{move.name}</b>{move.tags?.length ? <small>{move.tags.map((tag) => <em key={tag}>{moveTagLabels[tag]}</em>)}</small> : null}</div>
  </div>] : [])}</div>;
}

export function GuideMovesets({ guide }: { guide: PokemonGuide }) {
  const items = modeDefinitions.flatMap((mode) => {
    const value = guide.movesets?.[mode.key];
    return value ? [{ ...mode, value }] : [];
  });
  return <section className="dialga-guide-board guide-moves-board">
    <SectionHeader icon={<SwordsIcon />} title="추천 기술" />
    {items.length > 0 ? <div className="moveset-mode-list">{items.map((item) => <article key={item.key}><h3>{item.label}</h3><MovesetRows moveset={item.value} /></article>)}</div> : <p className="guide-data-missing">검증된 추천 기술 정보를 준비 중이에요.</p>}
  </section>;
}

function GuideQuickDecisions({ guide }: { guide: PokemonGuide }) {
  const investment = guide.investment;
  const items = [
    ["강화", investment?.powerUp],
    ["기술 해방", investment?.secondMove],
    ["맥스기술", investment?.maxMove],
    ["XL 사탕", investment?.xlCandy],
  ] as const;
  const available = items.flatMap(([label, level]) => level ? [{ label, level }] : []);
  if (available.length === 0) return null;
  return <div className="guide-quick-decisions" aria-label="빠른 판단">{available.map(({ label, level }) => <div key={label}>
    <b>{label}</b><strong className={`investment-${level}`}>{investmentLabels[level]}</strong>
  </div>)}</div>;
}

export function GuideTrainingOrder({ guide }: { guide: PokemonGuide }) {
  const order = guide.investment?.order ?? [];
  return <section className="dialga-guide-board guide-order-board">
    <SectionHeader icon={<TargetIcon />} title="뭘 먼저 해야 하나요?" />
    {order.length > 0 ? <ol className="guide-order-list">{order.map((step, index) => <li key={step.id}>
      <b>{index + 1}</b><div><strong>{step.label}</strong>{step.reason ? <p>{step.reason}</p> : null}</div>
    </li>)}</ol> : <p className="guide-data-missing">검증된 육성 순서를 준비 중이에요.</p>}
    <GuideQuickDecisions guide={guide} />
  </section>;
}

export function GuideInvestment({ guide }: { guide: PokemonGuide }) {
  const investment = guide.investment;
  const rows = investmentDefinitions.flatMap((item) => {
    const level = investment?.[item.key];
    return level ? [{ ...item, level }] : [];
  });
  const eliteTm = investment?.eliteTm;
  return <section className="dialga-guide-board guide-investment-board">
    <SectionHeader icon={<BagIcon />} title="자원 투자" />
    {rows.length > 0 || eliteTm ? <div className="investment-list">
      {rows.map((item) => <div key={item.key}><b>{item.label}</b><strong className={`investment-${item.level}`}>{investmentLabels[item.level]}</strong></div>)}
      {eliteTm ? <div><b>대단한 기술머신</b><strong>{eliteTmLabels[eliteTm]}</strong></div> : null}
    </div> : <p className="guide-data-missing">검증된 자원 투자 우선순위를 준비 중이에요.</p>}
  </section>;
}

export function GuideIvAdvice({ guide }: { guide: PokemonGuide }) {
  const advice = guide.ivAdvice;
  const rows = [
    ["공통", advice?.general],
    ["레이드용", advice?.raid],
    ["맥스배틀용", advice?.max],
    ["PvP용", advice?.pvp],
  ].filter((item): item is string[] => Boolean(item[1]));
  return <section className="dialga-guide-board guide-iv-board">
    <SectionHeader icon={<StarOutlineIcon />} title="어떤 개체를 키울까요?" />
    {rows.length > 0 ? <div className="iv-advice-list">{rows.map(([label, value]) => <div key={label}><b>{label}</b><p>{value}</p></div>)}</div> : <p className="guide-data-missing">검증된 개체 선택 기준을 준비 중이에요.</p>}
  </section>;
}

export function PokemonReferenceDetail({ guide }: { guide: PokemonGuide }) {
  const useCases = modeDefinitions.flatMap((mode) => {
    const value = guide.useCases?.[mode.key];
    return value ? [{ ...mode, ...value }] : [];
  });

  return <main className="fresh-screen boss-screen generic-guide-screen dialga-reference-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    <section className="reference-raid-hero generic-guide-hero dialga-reference-hero">
      <Image className="raid-hero-backdrop" src="/images/events/dialgaraids.jpg" alt="" fill sizes="430px" priority />
      <span className="raid-hero-shade" />
      <DetailBackButton />
      <PokemonArtwork className="dialga-hero-art" image={guide.image} alt={guide.image.alt} size="hero" priority />
      <div className="raid-hero-copy">
        <CategoryBadge className="max-label" icon={<SwordsIcon />}>{guide.formName ?? guide.categoryLabel}</CategoryBadge>
        <h1>{guide.name}</h1>
        <div className="hero-types">{guide.types.map((type, index) => <span className="type-with-divider" key={type}>{index > 0 ? <em>/</em> : null}<TypeBadge type={type} color={typeColors[type]} /></span>)}</div>
        {guide.summary ? <p className="hero-decision-summary">{guide.summary}</p> : null}
        <div className="must-catch"><RatingStars value={guide.overallRating ?? guide.rating} /><strong>{guide.verdictLabel ?? guide.reason}</strong></div>
      </div>
    </section>

    {useCases.length > 0 ? <section className="guide-mode-summary" aria-label="활용도 요약">{useCases.map((item) => <div key={item.key}><b>{item.label}</b><RatingStars value={item.rating} /></div>)}</section> : null}

    <GuideUseCases guide={guide} />
    <GuideMovesets guide={guide} />
    <GuideTrainingOrder guide={guide} />
    <GuideInvestment guide={guide} />
    <PokemonWeaknessSection guide={guide} />
    <PokemonCounterSection guide={guide} />
    <GuideIvAdvice guide={guide} />
    <PokemonWeekSchedule pokemonId={guide.id} />
    <PokemonRecommendationSection guide={guide} showSummary={false} />

    <BottomNavigation active="guide" />
  </main>;
}
