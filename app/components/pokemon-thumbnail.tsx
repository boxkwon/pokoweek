import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { getTypePalette } from "../lib/pokemon";
import { TypeIcons } from "./type-icons";

type ThumbnailStyle = CSSProperties & {
  "--thumb-color": string;
  "--thumb-color-deep": string;
};

export function PokemonThumbnail({
  image,
  name,
  types,
  href,
  className = "",
  badge,
}: {
  image?: string;
  name: string;
  types: string[];
  href?: string;
  className?: string;
  badge?: ReactNode;
}) {
  const palette = getTypePalette(types[0]);
  const style: ThumbnailStyle = {
    "--thumb-color": palette.color,
    "--thumb-color-deep": palette.deep,
  };
  const content = (
    <>
      <span className="pokemon-thumbnail-glow" />
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pokemon-thumbnail-image" src={image} alt="" />
      )}
      {badge && <span className="pokemon-thumbnail-top-badge">{badge}</span>}
      <span className="pokemon-thumbnail-name">{name}</span>
      <TypeIcons types={types} size="small" label={`${name} 타입`} />
    </>
  );

  return href ? (
    <Link className={`pokemon-thumbnail ${className}`} href={href} style={style} aria-label={`${name} 자세히 보기`}>
      {content}
    </Link>
  ) : (
    <div className={`pokemon-thumbnail ${className}`} style={style}>
      {content}
    </div>
  );
}
