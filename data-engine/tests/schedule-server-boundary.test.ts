import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { hasRealPokemonArtwork } from "../../app/_lib/pokemon-artwork";

test("Schedule uses a server-safe Pokemon artwork predicate", async () => {
  const scheduleSource = await readFile(path.join(process.cwd(), "app/schedule/page.tsx"), "utf8");
  const sharedSource = await readFile(path.join(process.cwd(), "app/_lib/pokemon-artwork.ts"), "utf8");

  assert.match(scheduleSource, /from "\.\.\/_lib\/pokemon-artwork"/);
  assert.doesNotMatch(scheduleSource, /hasRealPokemonArtwork[^\n]+_components\/pokemon-artwork/);
  assert.doesNotMatch(sharedSource, /["']use client["']|\bwindow\b|\bdocument\b|from ["']react["']|useState|useEffect/);
  assert.equal(hasRealPokemonArtwork({ src: "/images/pokemon/example.png" }), true);
  assert.equal(hasRealPokemonArtwork({ src: "/images/backgrounds/pokemon-placeholder.svg", placeholder: true }), false);
});
