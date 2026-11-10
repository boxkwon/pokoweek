const pokemonTypes: Record<string, string[]> = {
  Cresselia: ["에스퍼"],
  Darkrai: ["악"],
  "Mega Banette": ["고스트"],
  Banette: ["고스트"],
  "Tornadus (Incarnate)": ["비행"],
  Grookey: ["풀"],
  Scorbunny: ["불꽃"],
  Sobble: ["물"],
  Pawniard: ["악", "강철"],
  Bisharp: ["악", "강철"],
  Kingambit: ["악", "강철"],
  "Zacian (Crowned Sword)": ["페어리", "강철"],
  "Zamazenta (Crowned Shield)": ["격투", "강철"],
  "Mega Gengar": ["고스트", "독"],
  "Thundurus (Incarnate)": ["전기", "비행"],
};

export function getPokemonTypes(name: string) {
  return pokemonTypes[name] ?? ["노말"];
}
