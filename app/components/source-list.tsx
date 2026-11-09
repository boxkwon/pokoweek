import { DataSource } from "../data/types";
import { ExternalIcon } from "./icons";

export function SourceList({ sources }: { sources: DataSource[] }) {
  return (
    <div className="source-list">
      {sources.map((source) => (
        <a href={source.url} target="_blank" rel="noreferrer" key={source.id} className="source-row">
          <span className={`source-badge ${source.kind}`}>{source.kind === "official" ? "공식" : "보조"}</span>
          <span>{source.name}</span>
          <ExternalIcon />
        </a>
      ))}
    </div>
  );
}
