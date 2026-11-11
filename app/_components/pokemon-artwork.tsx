import Image from "next/image";
import type { CSSProperties } from "react";

export type PokemonImage = {
  src: string;
  scale?: number;
  objectPosition?: string;
};

type ArtworkSize = "sm" | "md" | "lg" | "hero";
type ArtworkStyle = CSSProperties & { "--art-scale": number; "--art-position": string };

export function PokemonArtwork({
  image,
  alt,
  size,
  className = "",
  priority = false,
}: {
  image: PokemonImage;
  alt: string;
  size: ArtworkSize;
  className?: string;
  priority?: boolean;
}) {
  const style: ArtworkStyle = {
    "--art-scale": image.scale ?? 1,
    "--art-position": image.objectPosition ?? "50% 50%",
  };
  return (
    <span className={`pokemon-artwork artwork-${size} ${className}`} style={style}>
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes={size === "hero" ? "280px" : size === "lg" ? "150px" : size === "md" ? "112px" : "72px"}
        priority={priority}
      />
    </span>
  );
}
