import { typeIconUrl } from "../lib/pokemon";

export function TypeIcons({
  types,
  size = "medium",
  label = "타입",
}: {
  types: string[];
  size?: "small" | "medium" | "large";
  label?: string;
}) {
  return (
    <div className={`pokemon-type-icons ${size}`} aria-label={`${label}: ${types.join(", ")}`}>
      {types.map((type) => {
        const icon = typeIconUrl(type);
        return icon ? (
          <span className="pokemon-type-icon" title={`${type} 타입`} key={type}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" aria-hidden="true" />
            <span className="sr-only">{type} 타입</span>
          </span>
        ) : null;
      })}
    </div>
  );
}
