import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const root = process.cwd();
const monthly = JSON.parse(await readFile(join(root, "app/data/generated/monthly-events.json"), "utf8"));
const bossesSource = await readFile(join(root, "app/data/bosses.ts"), "utf8");
const pokemonSource = await readFile(join(root, "app/lib/pokemon.ts"), "utf8");

const pokemonDir = join(root, "public/images/pokemon");
const eventDir = join(root, "public/images/events");
const typeDir = join(root, "public/images/types");
await Promise.all([pokemonDir, eventDir, typeDir].map((directory) => mkdir(directory, { recursive: true })));

const pokemonUrls = new Set(monthly.events.flatMap((event) => event.pokemon.map((pokemon) => pokemon.image)).filter(Boolean));
[
  "https://cdn.leekduck.com/assets/img/pokemon_icons/pm888.fCROWNED_SWORD.icon.png",
  "https://cdn.leekduck.com/assets/img/pokemon_icons/pm889.fCROWNED_SHIELD.icon.png",
  "https://cdn.leekduck.com/assets/img/pokemon_icons/pm646.fWHITE.icon.png",
  "https://cdn.leekduck.com/assets/img/pokemon_icons/pm646.fBLACK.icon.png",
].forEach((url) => pokemonUrls.add(url));
for (const match of bossesSource.matchAll(/https:\/\/cdn\.leekduck\.com\/assets\/img\/pokemon_icons\/[^"\s]+/g)) {
  if (!match[0].includes("${")) pokemonUrls.add(match[0]);
}
for (const match of bossesSource.matchAll(/dex:\s*(\d+)/g)) {
  if (match[1] !== "646") pokemonUrls.add(`https://cdn.leekduck.com/assets/img/pokemon_icons/pm${match[1]}.icon.png`);
}

const eventUrls = new Set(monthly.events.map((event) => event.image).filter(Boolean));
const counterIds = new Set([...pokemonSource.matchAll(/:\s*(\d+),?$/gm)].map((match) => match[1]).filter((value) => Number(value) > 18));

const typeNames = ["노말", "격투", "비행", "독", "땅", "바위", "벌레", "고스트", "강철", "불꽃", "물", "풀", "전기", "에스퍼", "얼음", "드래곤", "악", "페어리"];

async function download(url, target) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}

let complete = 0;
const failures = [];
const tasks = [
  ...[...pokemonUrls].map((url) => ({ url, target: join(pokemonDir, basename(new URL(url).pathname)) })),
  ...[...eventUrls].map((url) => ({ url, target: join(eventDir, basename(new URL(url).pathname)) })),
  ...typeNames.map((type, index) => ({
    url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/small/${index + 1}.png`,
    target: join(typeDir, `${type}.png`),
  })),
  ...[...counterIds].map((dex) => ({
    url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`,
    target: join(pokemonDir, `counter-${dex}.png`),
  })),
];

async function worker() {
  while (tasks.length) {
    const task = tasks.shift();
    if (!task) return;
    try {
      await download(task.url, task.target);
      complete += 1;
    } catch (error) {
      failures.push(String(error));
    }
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));

process.stdout.write(`Downloaded ${complete} curated assets.\n`);
if (failures.length) {
  process.stderr.write(`Failed ${failures.length} assets:\n${failures.join("\n")}\n`);
  process.exitCode = 1;
}
