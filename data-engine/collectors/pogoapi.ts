import path from "node:path";
import { mkdir } from "node:fs/promises";
import { sha256 } from "../lib/hash";
import { paths } from "../lib/paths";
import { writeJsonAtomic } from "../lib/files";

const ENDPOINTS = [
  "pokemon_stats.json",
  "pokemon_types.json",
  "current_pokemon_moves.json",
  "fast_moves.json",
  "charged_moves.json",
  "pvp_fast_moves.json",
  "pvp_charged_moves.json",
  "cp_multiplier.json",
  "pokemon_powerup_requirements.json",
  "type_effectiveness.json",
  "pokemon_max_cp.json",
  "mega_pokemon.json",
  "mega_evolution_settings.json",
] as const;

type ApiHashEntry = {
  full_path: string;
  hash_sha256: string;
};

export type PogoApiCollectionManifest = {
  schemaVersion: 1;
  sourceId: "pogoapi";
  baseUrl: string;
  runId: string;
  retrievedAt: string;
  endpoints: Array<{
    file: string;
    url: string;
    apiSha256?: string;
    contentSha256: string;
  }>;
  snapshotHash: string;
};

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "POKOWEEK-Data-Engine/1.0 (+https://pokoweek.vercel.app)" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`PoGo API request failed (${response.status}): ${url}`);
  return response.json() as Promise<unknown>;
}

export async function collectPogoApi() {
  const baseUrl = (process.env.POGOAPI_BASE_URL ?? "https://pogoapi.net/api/v1").replace(/\/$/, "");
  const retrievedAt = new Date().toISOString();
  const runId = retrievedAt.replace(/[:.]/g, "-");
  const runDirectory = path.join(paths.rawPogoApi, runId);
  await mkdir(runDirectory, { recursive: true });

  const hashesUrl = `${baseUrl}/api_hashes.json`;
  const apiHashes = await fetchJson(hashesUrl) as Record<string, ApiHashEntry>;
  await writeJsonAtomic(path.join(runDirectory, "api_hashes.json"), apiHashes);

  const endpointRecords: PogoApiCollectionManifest["endpoints"] = [];
  for (const file of ENDPOINTS) {
    const url = `${baseUrl}/${file}`;
    const value = await fetchJson(url);
    await writeJsonAtomic(path.join(runDirectory, file), value);
    endpointRecords.push({
      file,
      url,
      apiSha256: apiHashes[file]?.hash_sha256,
      contentSha256: sha256(value),
    });
  }

  const manifestWithoutHash = {
    schemaVersion: 1 as const,
    sourceId: "pogoapi" as const,
    baseUrl,
    runId,
    retrievedAt,
    endpoints: endpointRecords,
  };
  const manifest: PogoApiCollectionManifest = {
    ...manifestWithoutHash,
    snapshotHash: sha256(manifestWithoutHash),
  };
  await writeJsonAtomic(path.join(runDirectory, "manifest.json"), manifest);
  await writeJsonAtomic(path.join(paths.rawPogoApi, "latest.json"), { runId, snapshotHash: manifest.snapshotHash });
  return manifest;
}
