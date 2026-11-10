export const typeIds: Record<string, number> = {
  노말: 1,
  격투: 2,
  비행: 3,
  독: 4,
  땅: 5,
  바위: 6,
  벌레: 7,
  고스트: 8,
  강철: 9,
  불꽃: 10,
  물: 11,
  풀: 12,
  전기: 13,
  에스퍼: 14,
  얼음: 15,
  드래곤: 16,
  악: 17,
  페어리: 18,
};

export const typeOrder = [
  "노말", "불꽃", "물", "전기", "풀", "얼음", "격투", "독", "땅",
  "비행", "에스퍼", "벌레", "바위", "고스트", "드래곤", "악", "강철", "페어리",
] as const;

export const typeMatchups: Record<string, { strong: string[]; weak: string[] }> = {
  노말: { strong: [], weak: ["격투"] },
  불꽃: { strong: ["풀", "얼음", "벌레", "강철"], weak: ["물", "땅", "바위"] },
  물: { strong: ["불꽃", "땅", "바위"], weak: ["전기", "풀"] },
  전기: { strong: ["물", "비행"], weak: ["땅"] },
  풀: { strong: ["물", "땅", "바위"], weak: ["불꽃", "얼음", "독", "비행", "벌레"] },
  얼음: { strong: ["풀", "땅", "비행", "드래곤"], weak: ["불꽃", "격투", "바위", "강철"] },
  격투: { strong: ["노말", "얼음", "바위", "악", "강철"], weak: ["비행", "에스퍼", "페어리"] },
  독: { strong: ["풀", "페어리"], weak: ["땅", "에스퍼"] },
  땅: { strong: ["불꽃", "전기", "독", "바위", "강철"], weak: ["물", "풀", "얼음"] },
  비행: { strong: ["풀", "격투", "벌레"], weak: ["전기", "얼음", "바위"] },
  에스퍼: { strong: ["격투", "독"], weak: ["벌레", "고스트", "악"] },
  벌레: { strong: ["풀", "에스퍼", "악"], weak: ["불꽃", "비행", "바위"] },
  바위: { strong: ["불꽃", "얼음", "비행", "벌레"], weak: ["물", "풀", "격투", "땅", "강철"] },
  고스트: { strong: ["에스퍼", "고스트"], weak: ["고스트", "악"] },
  드래곤: { strong: ["드래곤"], weak: ["얼음", "드래곤", "페어리"] },
  악: { strong: ["에스퍼", "고스트"], weak: ["격투", "벌레", "페어리"] },
  강철: { strong: ["얼음", "바위", "페어리"], weak: ["불꽃", "격투", "땅"] },
  페어리: { strong: ["격투", "드래곤", "악"], weak: ["독", "강철"] },
};

export function getTypeMatchup(type: string) {
  return typeMatchups[type] ?? { strong: [], weak: [] };
}

export const typePalette: Record<string, { color: string; deep: string }> = {
  노말: { color: "#A8A77A", deep: "#77774F" },
  불꽃: { color: "#EE8130", deep: "#B94C16" },
  물: { color: "#6390F0", deep: "#315FBE" },
  전기: { color: "#F7D02C", deep: "#C59B05" },
  풀: { color: "#7AC74C", deep: "#478E25" },
  얼음: { color: "#96D9D6", deep: "#4FA5A2" },
  격투: { color: "#C22E28", deep: "#7F1915" },
  독: { color: "#A33EA1", deep: "#692268" },
  땅: { color: "#E2BF65", deep: "#A77D2A" },
  비행: { color: "#A98FF3", deep: "#6D50C0" },
  에스퍼: { color: "#F95587", deep: "#BA2050" },
  벌레: { color: "#A6B91A", deep: "#69780A" },
  바위: { color: "#B6A136", deep: "#78671A" },
  고스트: { color: "#735797", deep: "#45315F" },
  드래곤: { color: "#6F35FC", deep: "#3F18A9" },
  악: { color: "#705746", deep: "#443128" },
  강철: { color: "#A8A8C0", deep: "#66677F" },
  페어리: { color: "#D685AD", deep: "#9B4E76" },
};

export function typeIconUrl(type: string) {
  const id = typeIds[type];
  return id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/small/${id}.png`
    : undefined;
}

export function getTypePalette(type: string) {
  return typePalette[type] ?? { color: "#8B83C5", deep: "#555083" };
}

const counterArtworkIds: Record<string, number> = {
  원시그란돈: 10078,
  메가리자몽Y: 10035,
  그란돈: 383,
  메가루카리오: 10059,
  "다이맥스 리자몽": 6,
  "다이맥스 괴력몬": 68,
  "다이맥스 몰드류": 530,
  "다이맥스 메타그로스": 376,
  "다이맥스 라프라스": 131,
  "다이맥스 망나뇽": 149,
  "다이맥스 팬텀": 94,
  맘모꾸리: 473,
  가디안: 282,
  망나뇽: 149,
  루카리오: 448,
  리자몽: 6,
  "다이맥스 두랄루돈": 884,
  메가가디안: 10051,
  메가디안시: 10075,
  펄기아: 484,
  메타그로스: 376,
  메가레쿠쟈: 10079,
  뮤츠: 150,
};

export function counterArtworkUrl(name: string) {
  const dex = counterArtworkIds[name];
  return dex ? `/images/pokemon/counter-${dex}.png` : undefined;
}

const counterTypeMap: Record<string, string[]> = {
  원시그란돈: ["땅", "불꽃"], 메가리자몽Y: ["불꽃", "비행"], 그란돈: ["땅"],
  메가루카리오: ["격투", "강철"], "다이맥스 리자몽": ["불꽃", "비행"],
  "다이맥스 괴력몬": ["격투"], "다이맥스 몰드류": ["땅", "강철"],
  "다이맥스 메타그로스": ["강철", "에스퍼"], "다이맥스 라프라스": ["물", "얼음"],
  "다이맥스 망나뇽": ["드래곤", "비행"], "다이맥스 팬텀": ["고스트", "독"],
  맘모꾸리: ["얼음", "땅"], 가디안: ["에스퍼", "페어리"], 망나뇽: ["드래곤", "비행"],
  루카리오: ["격투", "강철"], 리자몽: ["불꽃", "비행"], "다이맥스 두랄루돈": ["강철", "드래곤"],
  메가가디안: ["에스퍼", "페어리"], 메가디안시: ["바위", "페어리"], 펄기아: ["물", "드래곤"],
  메타그로스: ["강철", "에스퍼"], 메가레쿠쟈: ["드래곤", "비행"], 뮤츠: ["에스퍼"],
};

export function counterTypes(name: string) {
  return counterTypeMap[name] ?? ["노말"];
}
