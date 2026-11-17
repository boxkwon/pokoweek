import type { EvidenceRegistry, NormalizedDataset, PokemonId } from "../schemas";
import { buildKyuremRaidComparison } from "../analysis/raid";
import { buildPokemonProgression } from "../analysis/progression";

function collectEvidenceIds(value: unknown, output = new Set<string>()) {
  if (Array.isArray(value)) value.forEach((item) => collectEvidenceIds(item, output));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === "evidenceIds" && Array.isArray(item)) {
        item.forEach((id) => typeof id === "string" && output.add(id));
      } else collectEvidenceIds(item, output);
    }
  }
  return output;
}

export function buildGuideModelInput(
  pokemonId: PokemonId,
  facts: NormalizedDataset,
  registry: EvidenceRegistry,
) {
  const target = facts.pokemon.find((pokemon) => pokemon.id === pokemonId);
  if (!target) throw new Error(`Normalized target not found: ${pokemonId}`);

  const recipes = pokemonId === "kyurem"
    ? facts.fusionRecipes
    : facts.fusionRecipes.filter((recipe) => recipe.resultPokemonId === pokemonId);
  const referenceIds = new Set<PokemonId>(["kyurem"]);
  for (const recipe of recipes) {
    referenceIds.add(recipe.partnerPokemonId);
    referenceIds.add(recipe.resultPokemonId);
  }
  referenceIds.delete(pokemonId);
  const references = facts.pokemon
    .filter((pokemon) => referenceIds.has(pokemon.id))
    .map((pokemon) => ({
      id: pokemon.id,
      form: pokemon.form,
      types: pokemon.types,
      baseStats: pokemon.baseStats,
    }));

  const evidenceIds = collectEvidenceIds({ target, recipes, references });
  const raidComparison = buildKyuremRaidComparison(facts);
  raidComparison.evidenceIds.forEach((id) => evidenceIds.add(id));
  const progression = buildPokemonProgression(facts, pokemonId);
  collectEvidenceIds(progression).forEach((id) => evidenceIds.add(id));
  const evidence = registry.records
    .filter((record) => evidenceIds.has(record.id))
    .map((record) => ({
      id: record.id,
      publisher: record.publisher,
      url: record.url,
      reviewStatus: record.reviewStatus,
      claim: record.claim,
      paths: record.paths,
    }));

  return {
    pokemonId,
    sourceSnapshotHash: facts.sourceSnapshotHash,
    target,
    referencePokemon: references,
    fusionRecipes: recipes,
    raidComparison,
    progression,
    evidence,
    evidencePolicy: {
      reviewedMeans: "The evidence was manually reviewed; it does not turn AI analysis into a verified fact.",
      needsReviewMeans: "Use cautiously and state uncertainty. Never promote it to reviewed or verified.",
    },
  };
}

export type GuideModelInput = ReturnType<typeof buildGuideModelInput>;
