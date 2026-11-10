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
  const visual = (
    <>
      <span className="pokemon-thumbnail-glow" />
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pokemon-thumbnail-image" src={image} alt="" />
      )}
      {badge && <span className="pokemon-thumbnail-top-badge">{badge}</span>}
      <span className="pokemon-thumbnail-name">{name}</span>
    </>
  );

  return (
    <div className={`pokemon-thumbnail ${className}`} style={style}>
      {href ? (
        <Link className="pokemon-thumbnail-main" href={href} aria-label={`${name} 자세히 보기`}>
          {visual}
        </Link>
      ) : (
        <div className="pokemon-thumbnail-main">{visual}</div>
      )}
      <TypeIcons types={types} size="small" label={`${name} 타입`} />
    </div>
  );
}
