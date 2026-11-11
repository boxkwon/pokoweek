import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "../../_components/app-header";
import { BottomNavigation } from "../../_components/bottom-nav";
import { CategoryBadge, PrimaryCTA, RatingStars, SectionHeader, TypeBadge } from "../../_components/design-system";
import { BackIcon, ChartIcon, CheckIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "../../_components/icons";
import { PokemonArtwork } from "../../_components/pokemon-artwork";
import { dialgaGuide, typeColors } from "../../_data/guide-data";
import { APP_SUBTITLE } from "../../_config/app";

export default function DialgaGuidePage() {
  return (
    <main className="fresh-screen boss-screen">
      <AppHeader subtitle={APP_SUBTITLE} />

      <section className="reference-raid-hero">
        <Image className="raid-hero-backdrop" src={dialgaGuide.backdrop} alt="" fill sizes="430px" priority />
        <span className="raid-hero-shade" />
        <Link className="floating-back" href="/guide" aria-label="공략 목록으로 돌아가기"><BackIcon /></Link>
        <PokemonArtwork className="dialga-hero-art" image={dialgaGuide.image} alt={dialgaGuide.title} size="hero" priority />
        <div className="raid-hero-copy">
          <CategoryBadge className="max-label" icon={<SwordsIcon />}>{dialgaGuide.category}</CategoryBadge>
          <h1>{dialgaGuide.title}</h1>
          <div className="hero-types">{dialgaGuide.types.map((type, index) => <span className="type-with-divider" key={type}>{index > 0 ? <em>/</em> : null}<TypeBadge type={type} color={typeColors[type]} /></span>)}</div>
          <div className="must-catch"><RatingStars value={dialgaGuide.rating} /><strong>{dialgaGuide.ratingLabel}</strong></div>
        </div>
      </section>

      <section className="weakness-board">
        <h2><TargetIcon />약점 <small>(더 큰 피해를 줌)</small></h2>
        <div>{dialgaGuide.weaknesses.map((type) => <TypeBadge type={type} color={typeColors[type]} key={type} />)}</div>
      </section>

      <section className="counter-board">
        <SectionHeader icon={<SwordsIcon />} title="추천 공격수" description="레이드·맥스배틀에서 효과적인 포켓몬" />
        <div className="reference-counter-grid">
          {dialgaGuide.counters.map((counter) => <article className={counter.tone} key={counter.rank}>
            <b>{counter.rank}</b>
            <PokemonArtwork className="counter-artwork" image={counter.image} alt={counter.name.replace("\n", " ")} size="lg" />
            <h3>{counter.name.split("\n").map((line) => <span key={line}>{line}</span>)}</h3>
          </article>)}
        </div>
        <PrimaryCTA className="owned-pokemon-button" leading={<span className="mini-ball" />}>내가 가진 포켓몬으로 보기</PrimaryCTA>
      </section>

      <section className="value-board">
        <SectionHeader icon={<ChartIcon />} title="가치 평가" description="이 포켓몬을 잡고 키울 가치가 있을까?" />
        <div className="value-table">
          {dialgaGuide.values.map((item, index) => <div className="value-row" key={item.label}>
            <strong className={`value-label value-${index}`}><SwordsIcon />{item.label}</strong>
            <RatingStars value={item.score} />
            <p>{item.reason}</p>
          </div>)}
        </div>
      </section>

      <section className="recommend-board">
        <SectionHeader icon={<StarOutlineIcon />} title="추천 가이드" />
        <div className="recommend-content">
          <ul>
            {dialgaGuide.recommendations.map((item) => <li key={item}><CheckIcon /><b>{item}</b></li>)}
          </ul>
          <aside><strong>ⓘ 한 줄 요약</strong><p>{dialgaGuide.summary}</p></aside>
        </div>
      </section>

      <BottomNavigation active="guide" />
    </main>
  );
}
