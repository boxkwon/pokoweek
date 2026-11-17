import type { FusionRecipe } from "../schemas";

export function aggregateFusionRecipes(recipes: readonly FusionRecipe[]) {
  const materialTotals = new Map<string, { type: string; id: string; amount: number }>();
  const checklist = recipes.flatMap((recipe) => recipe.preFusionChecks.map((item) => ({
    goalId: recipe.id,
    itemId: item.id,
    storageKey: `${recipe.id}:${item.id}`,
    label: item.label,
  })));

  for (const recipe of recipes) {
    for (const material of recipe.materials) {
      const id = material.type === "energy" ? material.energyId : material.pokemonId;
      const key = `${material.type}:${id}`;
      const previous = materialTotals.get(key);
      materialTotals.set(key, {
        type: material.type,
        id,
        amount: (previous?.amount ?? 0) + material.amount,
      });
    }
  }

  return { materials: [...materialTotals.values()], checklist };
}
