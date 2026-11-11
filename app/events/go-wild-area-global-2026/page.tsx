import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "../../_components/app-header";
import { BagIcon, CalendarIcon, CheckIcon, ChevronIcon, ClockIcon, SwordsIcon, TargetIcon } from "../../_components/icons";
import { PokemonArtwork } from "../../_components/pokemon-artwork";

const dayOne = [
  { name: "제크로무", image: { src: "/images/pokemon/pm644.icon.png", scale: 1.06, objectPosition: "50% 58%" }, type: "전기", tone: "electric" },
  { name: "화이트큐레무", image: { src: "/images/pokemon/pm646.fWHITE.icon.png", scale: .94, objectPosition: "50% 56%" }, type: "얼음", tone: "ice" },
  { name: "다이맥스\n디아루가", image: { src: "/images/pokemon/pm483.icon.png", scale: 1.02, objectPosition: "50% 56%" }, type: "강철", tone: "steel", href: "/bosses/dialga-dynamax" },
  { name: "거다이맥스\n두랄루돈", image: { src: "/images/pokemon/pm884.icon.png", scale: .92, objectPosition: "50% 57%" }, type: "드래곤", tone: "max" },
] as const;

const dayTwo = [
  { name: "레시라무", image: { src: "/images/pokemon/pm643.icon.png", scale: .96, objectPosition: "50% 57%" }, type: "불꽃", tone: "fire" },
  { name: "블랙큐레무", image: { src: "/images/pokemon/pm646.fBLACK.icon.png", scale: .94, objectPosition: "50% 56%" }, type: "악", tone: "dark" },
  { name: "다이맥스\n펄기아", image: { src: "/images/pokemon/pm484.icon.png", scale: 1.02, objectPosition: "50% 57%" }, type: "물", tone: "water" },
  { name: "거다이맥스\n두랄루돈", image: { src: "/images/pokemon/pm884.icon.png", scale: .92, objectPosition: "50% 57%" }, type: "드래곤", tone: "max" },
] as const;

type EventPokemon = (typeof dayOne)[number] | (typeof dayTwo)[number];

function EventPokemonTile({ pokemon }: { pokemon: EventPokemon }) {
  const content = <>
    <PokemonArtwork className="event-pokemon-art" image={pokemon.image} alt={pokemon.name.replace("\n", " ")} size="md" />
    <Image className="event-type-icon" src={`/images/types/${pokemon.type}.png`} alt="" width={28} height={28} />
    <strong>{pokemon.name.split("\n").map((line) => <span key={line}>{line}</span>)}</strong>
  </>;
  return "href" in pokemon ? <Link className={`event-pokemon-tile ${pokemon.tone}`} href={pokemon.href}>{content}</Link> : <article className={`event-pokemon-tile ${pokemon.tone}`}>{content}</article>;
}

function DayBoard({ day, label, pokemon }: { day: 1 | 2; label: string; pokemon: readonly EventPokemon[] }) {
  return <section className={`event-day-board day-${day}`}>
    <header><CalendarIcon /><b>DAY {day}</b><span>| {label}</span></header>
    <div>{pokemon.map((item) => <EventPokemonTile pokemon={item} key={item.name} />)}</div>
  </section>;
}

export default function WildAreaPage() {
  return (
    <main className="fresh-screen event-screen">
      <AppHeader backHref="/bosses/dialga-dynamax" />

      <section className="wild-hero">
        <Image className="wild-bg" src="/images/events/key-art.jpg" alt="" fill sizes="430px" priority />
        <span className="wild-shade" />
        <PokemonArtwork className="wild-dialga" image={{ src: "/images/pokemon/pm483.icon.png", scale: 1.04 }} alt="" size="hero" />
        <PokemonArtwork className="wild-palkia" image={{ src: "/images/pokemon/pm484.icon.png", scale: 1.02 }} alt="" size="hero" />
        <PokemonArtwork className="wild-duraludon" image={{ src: "/images/pokemon/pm884.icon.png", scale: .92 }} alt="" size="hero" />
        <div className="wild-title"><small>POKÉMON GO</small><h1>GO WILD AREA <em>2026</em></h1><p>+ 월드 에리어 : 글로벌 이벤트</p></div>
      </section>

      <section className="event-time-board">
        <div><span><CalendarIcon />기간</span><b>11/14 토 ~ 11/15 일</b></div>
        <i />
        <div><span><ClockIcon />시간</span><b>10:00 ~ 18:00</b></div>
      </section>

      <section className="event-priority-board"><span>★★★★★</span><strong>♛ 이번 달 최우선 이벤트</strong></section>

      <DayBoard day={1} label="토요일 (11/14)" pokemon={dayOne} />
      <DayBoard day={2} label="일요일 (11/15)" pokemon={dayTwo} />

      <section className="event-reason-board">
        <header><TargetIcon /><h2>왜 해야 하나?</h2></header>
        <div className="reason-content">
          <div className="reason-art"><PokemonArtwork image={{ src: "/images/pokemon/pm646.fWHITE.icon.png", scale: .94 }} alt="큐레무" size="md" /></div>
          <ul>
            <li><CheckIcon /><b>큐레무 융합 에너지</b></li>
            <li><CheckIcon /><b>다이맥스 디아루가/펄기아 첫 등장</b></li>
            <li><CheckIcon /><b>거다이맥스 두랄루돈</b></li>
            <li><CheckIcon /><b>강력한 레이드 전력 확보</b></li>
          </ul>
        </div>
      </section>

      <section className="event-prep-board" id="prep">
        <header><BagIcon /><h2>준비 체크</h2></header>
        <div className="prep-content">
          <div className="prep-art"><PokemonArtwork image={{ src: "/images/pokemon/pm483.icon.png", scale: 1.04 }} alt="다이맥스 디아루가" size="md" /></div>
          <ul>
            <li><i /><b>맥스파티클 저장</b></li>
            <li><i /><b>다이맥스 전투팀 3마리 준비</b></li>
            <li><i /><b>포켓몬 박스 정리</b></li>
            <li><i /><b>회복약 확보</b></li>
          </ul>
        </div>
      </section>

      <Link className="boss-guide-link" href="/bosses/dialga-dynamax"><SwordsIcon />보스별 공략 보기<ChevronIcon /></Link>
    </main>
  );
}
