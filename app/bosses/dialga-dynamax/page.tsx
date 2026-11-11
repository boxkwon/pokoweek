import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "../../_components/app-header";
import { BottomNav } from "../../_components/bottom-nav";
import { BackIcon, ChartIcon, CheckIcon, ChevronIcon, StarOutlineIcon, SwordsIcon, TargetIcon } from "../../_components/icons";
import { PokemonArtwork, type PokemonImage } from "../../_components/pokemon-artwork";

function Stars({ value = 5 }: { value?: number }) {
  return <span className="star-line" aria-label={`추천도 ${value}점`}>{[0,1,2,3,4].map((index) => <i className={index < value ? "on" : ""} key={index}>★</i>)}</span>;
}

function TypeBadge({ type, color }: { type: string; color: string }) {
  return <span className="hero-type" style={{ backgroundColor: color }}><Image src={`/images/types/${type}.png`} alt="" width={28} height={28} /><b>{type}</b></span>;
}

const counters = [
  { rank: 1, name: "다이맥스\n몰드류", image: { src: "/images/pokemon/counter-530.png", scale: 1.04, objectPosition: "50% 56%" }, tone: "gold" },
  { rank: 2, name: "다이맥스\n괴력몬", image: { src: "/images/pokemon/counter-68.png", scale: .95, objectPosition: "50% 56%" }, tone: "silver" },
  { rank: 3, name: "거다이맥스\n괴력몬", image: { src: "/images/pokemon/pm68.icon.png", scale: 1.08, objectPosition: "50% 54%" }, tone: "bronze" },
] satisfies readonly { rank: number; name: string; image: PokemonImage; tone: string }[];

const values = [
  { label: "맥스배틀 전력", score: 5, reason: "향후 맥스배틀 핵심 전력" },
  { label: "일반 레이드", score: 4, reason: "강력한 드래곤/강철 딜러" },
  { label: "PvP (배틀리그)", score: 4, reason: "마스터리그에서 우수한 성능" },
] as const;

export default function DialgaGuidePage() {
  return (
    <main className="fresh-screen boss-screen">
      <AppHeader subtitle="포켓몬 GO 주간 가이드" />

      <section className="reference-raid-hero">
        <Image className="raid-hero-backdrop" src="/images/events/dialgaraids.jpg" alt="" fill sizes="430px" priority />
        <span className="raid-hero-shade" />
        <Link className="floating-back" href="/events/go-wild-area-global-2026" aria-label="이벤트 화면으로 돌아가기"><BackIcon /></Link>
        <PokemonArtwork className="dialga-hero-art" image={{ src: "/images/pokemon/pm483.icon.png", scale: 1.08, objectPosition: "56% 54%" }} alt="다이맥스 디아루가" size="hero" priority />
        <div className="raid-hero-copy">
          <span className="max-label"><SwordsIcon />다이맥스</span>
          <h1>다이맥스 디아루가</h1>
          <div className="hero-types"><TypeBadge type="강철" color="#3c91ac" /><em>/</em><TypeBadge type="드래곤" color="#1765d5" /></div>
          <div className="must-catch"><Stars /><strong>꼭 잡기</strong></div>
        </div>
      </section>

      <section className="weakness-board">
        <h2><TargetIcon />약점 <small>(더 큰 피해를 줌)</small></h2>
        <div><TypeBadge type="격투" color="#ef334f" /><TypeBadge type="땅" color="#c97725" /></div>
      </section>

      <section className="counter-board">
        <header><SwordsIcon /><h2>추천 공격수</h2><p>레이드·맥스배틀에서 효과적인 포켓몬</p></header>
        <div className="reference-counter-grid">
          {counters.map((counter) => <article className={counter.tone} key={counter.rank}>
            <b>{counter.rank}</b>
            <PokemonArtwork className="counter-artwork" image={counter.image} alt={counter.name.replace("\n", " ")} size="lg" />
            <h3>{counter.name.split("\n").map((line) => <span key={line}>{line}</span>)}</h3>
          </article>)}
        </div>
        <button className="owned-pokemon-button" type="button"><span className="mini-ball" />내가 가진 포켓몬으로 보기<ChevronIcon /></button>
      </section>

      <section className="value-board">
        <header><ChartIcon /><h2>가치 평가</h2><p>이 포켓몬을 잡고 키울 가치가 있을까?</p></header>
        <div className="value-table">
          {values.map((item, index) => <div className="value-row" key={item.label}>
            <strong className={`value-label value-${index}`}><SwordsIcon />{item.label}</strong>
            <Stars value={item.score} />
            <p>{item.reason}</p>
          </div>)}
        </div>
      </section>

      <section className="recommend-board">
        <header><StarOutlineIcon /><h2>추천 가이드</h2></header>
        <div className="recommend-content">
          <ul>
            <li><CheckIcon /><b>좋은 개체 최소 1마리 확보</b></li>
            <li><CheckIcon /><b>공격 15 우선</b></li>
          </ul>
          <aside><strong>ⓘ 한 줄 요약</strong><p>맥스배틀·레이드·PvP 모두 활약 가능한 최상급 포켓몬!</p></aside>
        </div>
      </section>

      <BottomNav active="guide" />
    </main>
  );
}
