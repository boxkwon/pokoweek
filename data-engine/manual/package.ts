import path from "node:path";
import { writeJsonAtomic, writeTextAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { paths } from "../lib/paths";
import { buildGuideModelInput } from "../generators/input";
import { getGuideOutputJsonSchema } from "../generators/json-schema";
import { loadGenerationSources, GUIDE_TARGETS } from "../generators/run";
import type { PokemonId } from "../schemas";
import { createManualPrompt, MANUAL_GUIDE_PROMPT_VERSION } from "./prompt-template";
import { MANUAL_PACKAGE_VERSION, ManualGuidePackageBodySchema, ManualGuidePackageSchema } from "./schemas";

export async function createManualGuidePackages(targets: readonly PokemonId[] = GUIDE_TARGETS) {
  const { facts, evidence } = await loadGenerationSources();
  const generatedAt = new Date().toISOString();
  const files: string[] = [];
  const packages = [];
  for (const pokemonId of targets) {
    const body = ManualGuidePackageBodySchema.parse({
      schemaVersion: 1,
      packageVersion: MANUAL_PACKAGE_VERSION,
      generatedAt,
      pokemonId,
      sourceSnapshotHash: facts.sourceSnapshotHash,
      promptVersion: MANUAL_GUIDE_PROMPT_VERSION,
      modelInput: buildGuideModelInput(pokemonId, facts, evidence),
      outputJsonSchema: getGuideOutputJsonSchema(),
    });
    const guidePackage = ManualGuidePackageSchema.parse({ ...body, packageHash: sha256(body) });
    const filePath = path.join(paths.manualPackages, `${pokemonId}.json`);
    await writeJsonAtomic(filePath, guidePackage);
    files.push(path.relative(process.cwd(), filePath));
    packages.push(guidePackage);
  }
  const promptPath = path.join(paths.manualPackages, "guide-candidate-prompt.md");
  await writeTextAtomic(promptPath, createManualPrompt(files));
  return { packages, promptPath };
}
