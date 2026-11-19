export type PokemonImage = {
  src: string;
  scale?: number;
  objectPosition?: string;
  placeholder?: boolean;
};

export function hasRealPokemonArtwork(image: PokemonImage) {
  return image.placeholder !== true && !image.src.includes("pokemon-placeholder");
}
