const basename = (source: string) => {
  try {
    return new URL(source).pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    return source.split("/").filter(Boolean).at(-1)?.split("?")[0] ?? "";
  }
};

export const assetPlaceholders = {
  pokemon: "/images/backgrounds/pokemon-placeholder.svg",
  event: "/images/backgrounds/event-placeholder.svg",
  type: "/images/backgrounds/type-placeholder.svg",
} as const;

export function pokemonAsset(source?: string | null) {
  if (!source) return assetPlaceholders.pokemon;
  if (source.startsWith("/")) return source;
  const file = basename(source);
  return file ? `/images/pokemon/${file}` : assetPlaceholders.pokemon;
}

export function eventAsset(source?: string | null) {
  if (!source) return assetPlaceholders.event;
  if (source.startsWith("/")) return source;
  const file = basename(source);
  return file ? `/images/events/${file}` : assetPlaceholders.event;
}

export function typeAsset(type: string) {
  return type ? `/images/types/${type}.png` : assetPlaceholders.type;
}
