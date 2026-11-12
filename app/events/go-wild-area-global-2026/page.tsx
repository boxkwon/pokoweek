import Image from "next/image";
import { AppHeader } from "../../_components/app-header";
import { EventMeta, PrimaryCTA, RatingStars, SectionHeader } from "../../_components/design-system";
import { BagIcon, CalendarIcon, CheckIcon, SwordsIcon, TargetIcon } from "../../_components/icons";
import { PokemonArtwork } from "../../_components/pokemon-artwork";
import { PokemonGuideLink } from "../../_components/pokemon-guide-link";
import { wildAreaEvent, type PokemonEntry } from "../../_data/guide-data";

type EventPokemon = PokemonEntry;

function EventPokemonTile({ pokemon }: { pokemon: EventPokemon }) {
  const displayName = pokemon.name.replace(" ", "\n");
  const content = <>
    <PokemonArtwork className="event-pokemon-art" image={pokemon.image} alt={pokemon.name} size="md" />
    <Image className="event-type-icon" src={`/images/types/${pokemon.types[0]}.png`} alt="" width={28} height={28} />
    <strong>{displayName.split("\n").map((line) => <span key={line}>{line}</span>)}</strong>
  </>;
  return <PokemonGuideLink className="event-pokemon-tile" href={pokemon.href}>{content}</PokemonGuideLink>;
}

function DayBoard({ day, label, pokemon }: { day: 1 | 2; label: string; pokemon: readonly EventPokemon[] }) {
  return <section className={`event-day-board day-${day}`}>
    <header><CalendarIcon /><b>DAY {day}</b><span>| {label}</span></header>
    <div>{pokemon.map((item) => <EventPokemonTile pokemon={item} key={item.name} />)}</div>
  </section>;
}

export default function WildAreaPage() {
  const titleParts = wildAreaEvent.title.split(" ");
  const titleYear = titleParts.pop();
  return (
    <main className="fresh-screen event-screen">
      <AppHeader backHref="/" context="이벤트 상세" />

      <section className="wild-hero">
        <Image className="wild-bg" src={wildAreaEvent.heroImage} alt="" fill sizes="430px" priority />
        <span className="wild-shade" />
        <PokemonArtwork className="wild-dialga" image={wildAreaEvent.heroPokemon.dialga} alt="" size="hero" />
        <PokemonArtwork className="wild-palkia" image={wildAreaEvent.heroPokemon.palkia} alt="" size="hero" />
        <PokemonArtwork className="wild-duraludon" image={wildAreaEvent.heroPokemon.duraludon} alt="" size="hero" />
        <div className="wild-title"><small>{wildAreaEvent.eyebrow}</small><h1>{titleParts.join(" ")} <em>{titleYear}</em></h1><p>{wildAreaEvent.subtitle}</p></div>
      </section>

      <EventMeta dateLabel={wildAreaEvent.dateLabel} timeLabel={wildAreaEvent.timeLabel} />

      <section className="event-priority-board"><RatingStars value={wildAreaEvent.rating} /><strong>♛ {wildAreaEvent.ratingLabel}</strong></section>

      {wildAreaEvent.days.map((day) => <DayBoard day={day.day} label={day.label} pokemon={day.pokemon} key={day.day} />)}

      <section className="event-reason-board">
        <SectionHeader icon={<TargetIcon />} title="왜 해야 하나?" />
        <div className="reason-content">
          <div className="reason-art"><PokemonArtwork image={wildAreaEvent.days[0].pokemon[1].image} alt={wildAreaEvent.days[0].pokemon[1].name} size="md" /></div>
          <ul>
            {wildAreaEvent.reasons.map((reason) => <li key={reason}><CheckIcon /><b>{reason}</b></li>)}
          </ul>
        </div>
      </section>

      <section className="event-prep-board" id="prep">
        <SectionHeader icon={<BagIcon />} title="준비 체크" />
        <div className="prep-content">
          <div className="prep-art"><PokemonArtwork image={wildAreaEvent.days[0].pokemon[2].image} alt={wildAreaEvent.days[0].pokemon[2].name} size="md" /></div>
          <ul>
            {wildAreaEvent.preparations.slice(0, 4).map((item) => <li key={item.id}><i /><b>{item.title}</b></li>)}
          </ul>
        </div>
      </section>

      <PrimaryCTA className="boss-guide-link" href="/guide?event=wild-area-day-1" leading={<SwordsIcon />}>보스별 공략 보기</PrimaryCTA>
    </main>
  );
}
