"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { assetPlaceholders, eventAsset, pokemonAsset, typeAsset } from "../lib/assets";

export type ImagePreset = "small" | "medium" | "large" | "hero";
export type ArtworkPosition = "left" | "center" | "right";

type ArtworkStyle = CSSProperties & {
  "--art-object-position": string;
  "--art-scale": number;
};

export function PokemonArtwork({
  src,
  alt,
  position = "center",
  objectPosition,
  scale = 1,
  size = "medium",
  priority = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  position?: ArtworkPosition;
  objectPosition?: string;
  scale?: number;
  size?: ImagePreset;
  priority?: boolean;
  className?: string;
}) {
  const resolved = pokemonAsset(src);
  const [imageSrc, setImageSrc] = useState(resolved);
  useEffect(() => setImageSrc(resolved), [resolved]);
  const positionValue = objectPosition ?? (position === "left" ? "20% 50%" : position === "right" ? "80% 50%" : "50% 50%");
  const style: ArtworkStyle = { "--art-object-position": positionValue, "--art-scale": scale };

  return (
    <span className={`pokemon-artwork size-${size} position-${position} ${className}`} style={style}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={size === "hero" ? "(max-width: 430px) 72vw, 310px" : size === "large" ? "180px" : size === "medium" ? "112px" : "64px"}
        priority={priority}
        onError={() => setImageSrc(assetPlaceholders.pokemon)}
      />
    </span>
  );
}

export function PokemonAvatar({ src, alt, size = "medium", className = "" }: { src?: string | null; alt: string; size?: Exclude<ImagePreset, "hero">; className?: string }) {
  return <PokemonArtwork src={src} alt={alt} size={size} className={`pokemon-avatar ${className}`} />;
}

export function EventHeroImage({ src, alt = "", priority = false, className = "" }: { src?: string | null; alt?: string; priority?: boolean; className?: string }) {
  const resolved = eventAsset(src);
  const [imageSrc, setImageSrc] = useState(resolved);
  useEffect(() => setImageSrc(resolved), [resolved]);
  return (
    <span className={`event-hero-image ${className}`}>
      <Image src={imageSrc} alt={alt} fill sizes="(max-width: 430px) 100vw, 430px" priority={priority} onError={() => setImageSrc(assetPlaceholders.event)} />
    </span>
  );
}

export function TypeIcon({ type, size = "medium", className = "" }: { type: string; size?: ImagePreset; className?: string }) {
  return <Image className={`type-icon-image size-${size} ${className}`} src={typeAsset(type)} alt="" width={48} height={48} aria-hidden="true" />;
}
