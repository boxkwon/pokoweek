export function readPokemonArg(argv = process.argv.slice(2)) {
  const index = argv.indexOf("--pokemon");
  const value = index >= 0 ? argv[index + 1] : "kyurem";
  if (value !== "kyurem") {
    throw new Error(`Data Engine v1 supports only --pokemon kyurem (received: ${value ?? "missing"})`);
  }
  return value;
}

export function readOption(name: string, argv = process.argv.slice(2)) {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
}

export function requireOption(name: string, argv = process.argv.slice(2)) {
  const value = readOption(name, argv);
  if (!value || value.startsWith("--")) throw new Error(`--${name} is required.`);
  return value;
}

export function readNumberOption(name: string, argv = process.argv.slice(2)) {
  const raw = requireOption(name, argv);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`--${name} must be a non-negative number.`);
  return value;
}

export function hasFlag(name: string, argv = process.argv.slice(2)) {
  return argv.includes(`--${name}`);
}
