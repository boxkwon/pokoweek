import Image from "next/image";
import { APP_SUBTITLE } from "../_config/app";
import type { PokemonGuide } from "../_data/guide-data";
import { typeColors } from "../_data/guide-data";
import { AppHeader } from "./app-header";
import { BottomNavigation } from "./bottom-nav";
import { DetailBackButton } from "./detail-back-button";
import { CategoryBadge, RatingStars, SectionHeader, TypeBadge } from "./design-system";
import { ChartIcon, SwordsIcon } from "./icons";
import { PokemonArtwork } from "./pokemon-artwork";
import { PokemonCounterSection, PokemonRecommendationSection, PokemonWeaknessSection } from "./pokemon-guide-shared-sections";

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
      <DetailBackButton />
      <PokemonArtwork className="dialga-hero-art" image={guide.image} alt={guide.image.alt} size="hero" priority />
      <div className="raid-hero-copy">
        <CategoryBadge className="max-label" icon={<SwordsIcon />}>{guide.formName ?? guide.categoryLabel}</CategoryBadge>
        <h1>{guide.name}</h1>
        <div className="hero-types">{guide.types.map((type, index) => <span className="type-with-divider" key={type}>{index > 0 ? <em>/</em> : null}<TypeBadge type={type} color={typeColors[type]} /></span>)}</div>
        <div className="must-catch"><RatingStars value={guide.rating} /><strong>{guide.reason}</strong></div>
      </div>
    </section>

    <PokemonWeaknessSection guide={guide} />

    <PokemonCounterSection guide={guide} />

    <section className="value-board">
      <SectionHeader icon={<ChartIcon />} title="가치 평가" description="이 포켓몬을 잡고 키울 가치가 있을까?" />
      {guide.dataStatus.values === "ready" ? <div className="value-table">
        {visibleValues.map((item, index) => <div className="value-row" key={item.key}>
          <strong className={`value-label value-${index}`}><SwordsIcon />{item.label}</strong>
          <RatingStars value={item.score} />
          {item.reason ? <p>{item.reason}</p> : <span />}
        </div>)}
      </div> : <p className="guide-data-missing" data-status="missing">검증된 활용 가치 평가 데이터를 준비 중이에요.</p>}
    </section>

    <PokemonRecommendationSection guide={guide} />

    <BottomNavigation active="guide" />
  </main>;
}
