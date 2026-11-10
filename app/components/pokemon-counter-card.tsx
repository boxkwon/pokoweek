import { counterArtworkUrl, counterTypes } from "../lib/pokemon";
import { PokemonAvatar } from "./image-assets";
import { TypeIcons } from "./type-icons";

export function PokemonCounterCard({ name, note, rank }: { name: string; note: string; rank: number }) {
  const types = counterTypes(name);
  return (
    <article className="pokemon-counter-card">
      <span className="counter-number">{rank}</span>
      <PokemonAvatar src={counterArtworkUrl(name)} alt={name} size="large" />
      <div><h3>{name}</h3><p>{note}</p><TypeIcons types={types} size="small" label={`${name} 타입`} /></div>
    </article>
  );
}
