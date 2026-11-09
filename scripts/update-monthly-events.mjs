import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const CURRENT_FEED = "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json";
const ARCHIVE_FEED = (year) =>
  `https://raw.githubusercontent.com/pokelitee/leak-duck/data/archives/archive_${year}.json`;

const allowedCategories = new Set([
  "Community Day",
  "Event",
  "GO Pass",
  "Hatch Day",
  "Max Battles",
  "Max Mondays",
  "Pokémon Spotlight Hour",
  "Raid Battles",
  "Raid Day",
  "Raid Hour",
  "Timed Research",
  "Wild Area",
]);

const regionOnlyMarkers = [
  "City Safari",
  "Mexico City",
  "Sendai",
  "London",
  "India",
  "Singapore",
  "Boston",
  "Brisbane",
  "Night Out",
];

const categoryLabels = {
  "Community Day": "커뮤니티 데이",
  Event: "이벤트",
  "GO Pass": "GO 패스",
  "Hatch Day": "부화 데이",
  "Max Battles": "맥스배틀",
  "Max Mondays": "맥스 먼데이",
  "Pokémon Spotlight Hour": "스포트라이트 아워",
  "Raid Battles": "레이드",
  "Raid Day": "레이드 데이",
  "Raid Hour": "레이드 아워",
  "Timed Research": "시간제한 리서치",
  "Wild Area": "와일드 에리어",
};

const scrapedDuckCategories = {
  "community-day": "Community Day",
  event: "Event",
  "go-pass": "GO Pass",
  "hatch-day": "Hatch Day",
  "max-battles": "Max Battles",
  "max-mondays": "Max Mondays",
  "pokemon-spotlight-hour": "Pokémon Spotlight Hour",
  "raid-battles": "Raid Battles",
  "raid-day": "Raid Day",
  "raid-hour": "Raid Hour",
  "timed-research": "Timed Research",
  "wild-area": "Wild Area",
};

const titleTranslations = {
  "Pokémon GO Halloween 2026 Part I": "Pokémon GO 핼러윈 2026 파트 1",
  "Pokémon GO Halloween 2026 Part II": "Pokémon GO 핼러윈 2026 파트 2",
  "Dynamax Machop during Max Monday": "다이맥스 알통몬 맥스 먼데이",
  "Giratina (Altered Forme) in 5-star Raid Battles": "어나더폼 기라티나 5성 레이드",
  "Shadow Tornadus (Incarnate Forme) in Shadow Raids": "그림자 화신폼 토네로스 레이드",
  "Giratina (Altered Forme) Raid Hour": "어나더폼 기라티나 레이드 아워",
  "Teddiursa wearing a witch hat Spotlight Hour": "마녀 모자 깜지곰 스포트라이트 아워",
  "Into the Wild 2026": "Into the Wild 2026",
  "Zacian (Crowned Sword) and Zamazenta (Crowned Shield) in 5-star Raid Battles": "검왕 자시안·방패왕 자마젠타 5성 레이드",
  "Pokémon GO Wild Area 2026: Global": "Pokémon GO 와일드 에리어 2026: 글로벌",
  "GO Wild Area: Gigantamax Machamp Power Up! Timed Research": "와일드 에리어: 거다이맥스 괴력몬 강화 리서치",
  "Max Monday: Pokémon to be announced": "맥스 먼데이: 포켓몬 발표 전",
  "Cresselia and Darkrai Raid Hour": "크레세리아·다크라이 레이드 아워",
  "Grookey, Scorbunny, and Sobble Spotlight Hour": "흥나숭·염버니·울머기 스포트라이트 아워",
  "Minior Showers: Leonids 2026": "메테노 유성우: 사자자리 2026",
  "Eternamax Eternatus Returns": "무한다이노 맥스배틀",
  "Pawniard Community Day": "자망칼 커뮤니티 데이",
  "Dynamax Trails": "다이맥스 트레일",
  "Dynamax Espurr during Max Monday": "다이맥스 냐스퍼 맥스 먼데이",
  "Cresselia and Darkrai in 5-star Raid Battles": "크레세리아·다크라이 5성 레이드",
  "Mega Banette in Mega Raids": "메가다크펫 메가 레이드",
  "Deoxys (Normal, Defense, Attack, and Speed Formes) Raid Hour": "테오키스 전 폼 레이드 아워",
  "Noibat Spotlight Hour": "음뱃 스포트라이트 아워",
  "Clefable Super Mega Raid Day": "픽시 슈퍼 메가 레이드 데이",
  "Twilight Wishes": "황혼의 소원",
  "Dynamax Cryogonal during Max Monday": "다이맥스 프리지오 맥스 먼데이",
  "GO Pass: November": "GO 패스: 11월",
  "Deoxys (Normal, Defense, Attack, and Speed Formes) in 5-star Raid Battles": "테오키스 전 폼 5성 레이드",
  "Mega Metagross in Mega Raids": "메가메타그로스 메가 레이드",
  "Mega Sableye in Mega Raids": "메가깜까미 메가 레이드",
};

const officialUrls = {
  "into-the-wild-2026": "https://pokemongo.com/news/into-the-wild-2026",
  "pokemon-go-wild-area-2026-global": "https://pokemongo.com/news/save-the-date-go-wild-area-2026",
  "dynamax-trails": "https://pokemongo.com/news/dynamax-trails-2026",
  "twilight-wishes": "https://pokemongo.com/news/twilight-wishes-2026",
};

const internalHrefs = {
  "into-the-wild-2026": "/events/into-the-wild-2026",
  "pokemon-go-wild-area-2026-global": "/events/go-wild-area-global-2026",
};

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readJsonFrom(file, url) {
  if (file) return JSON.parse(await readFile(file, "utf8"));
  const response = await fetch(url, { headers: { "user-agent": "pokoweek-calendar/1.0" } });
  if (!response.ok) throw new Error(`일정 피드 요청 실패: ${response.status} ${url}`);
  return response.json();
}

function flattenFeed(payload) {
  return Object.entries(payload).flatMap(([group, entries]) =>
    Array.isArray(entries)
      ? entries
          .filter((event) => event && typeof event.start_time === "string" && typeof event.end_time === "string")
          .map((event) => ({ ...event, category: event.category || group }))
      : [],
  );
}

function normalizeCurrentFeed(payload) {
  if (!Array.isArray(payload)) return flattenFeed(payload);
  return payload
    .filter((event) => event?.start && event?.end && scrapedDuckCategories[event.eventType])
    .map((event) => ({
      title: event.name,
      article_url: event.link,
      banner_url: event.image,
      category: scrapedDuckCategories[event.eventType],
      details: event.extraData || {},
      is_local_time: !event.start.endsWith("Z"),
      start_time: event.start,
      end_time: event.end,
    }));
}

function slugFromUrl(url = "") {
  const parts = url.split("/").filter(Boolean);
  return parts.at(-1) || "event";
}

function kstParts(value, isLocalTime) {
  if (isLocalTime || !value.endsWith("Z")) {
    return { date: value.slice(0, 10), time: value.slice(11, 16) };
  }
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

function featuredPokemon(details = {}) {
  const candidates = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item?.name && (item.asset_url || item.image)) candidates.push(item);
        else walk(item);
      }
      return;
    }
    if (value && typeof value === "object") {
      for (const child of Object.values(value)) walk(child);
    }
  };
  walk(details);
  const seen = new Set();
  return candidates
    .filter((pokemon) => {
      const image = pokemon.asset_url || pokemon.image;
      const key = pokemon.name.toLowerCase();
      return image && !seen.has(key) && seen.add(key);
    })
    .slice(0, 3)
    .map((pokemon) => ({ name: pokemon.name, image: pokemon.asset_url || pokemon.image }));
}

function monthNumber(key) {
  const [year, month] = key.split("-").map(Number);
  return year * 12 + month - 1;
}

function overlapsWindow(event, rangeStart, rangeEnd) {
  const start = monthNumber(event.startDate.slice(0, 7));
  const end = monthNumber(event.endDate.slice(0, 7));
  return end >= monthNumber(rangeStart) && start <= monthNumber(rangeEnd);
}

function normalize(event) {
  const slug = slugFromUrl(event.article_url);
  const start = kstParts(event.start_time, event.is_local_time);
  const end = kstParts(event.end_time, event.is_local_time);
  const announced = !/to be announced|TBA/i.test(event.title);
  return {
    id: `${slug}-${start.date}-${start.time}`,
    slug,
    title: titleTranslations[event.title] || event.title,
    originalTitle: event.title,
    category: event.category,
    categoryLabel: categoryLabels[event.category] || event.category,
    startDate: start.date,
    endDate: end.date,
    startTime: start.time,
    endTime: end.time,
    image: event.banner_url || null,
    pokemon: featuredPokemon(event.details),
    announced,
    sourceUrl: officialUrls[slug] || event.article_url,
    sourceKind: officialUrls[slug] ? "official" : "community",
    internalHref: internalHrefs[slug] || null,
  };
}

const now = new Date();
const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
const year = kstNow.getFullYear();
const month = kstNow.getMonth();
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const rangeStart = monthKey(new Date(year, month - 1, 1));
const rangeEnd = monthKey(new Date(year, month + 4, 1));

const currentPayload = await readJsonFrom(argumentValue("--current-file"), CURRENT_FEED);
const archivePayload = await readJsonFrom(argumentValue("--archive-file"), ARCHIVE_FEED(year));

const merged = new Map();
for (const event of [...flattenFeed(archivePayload), ...normalizeCurrentFeed(currentPayload)]) {
  if (!allowedCategories.has(event.category)) continue;
  if (regionOnlyMarkers.some((marker) => event.title.includes(marker))) continue;
  const normalized = normalize(event);
  if (!overlapsWindow(normalized, rangeStart, rangeEnd)) continue;
  merged.set(`${event.article_url}|${event.start_time}`, normalized);
}

const events = [...merged.values()].sort((a, b) =>
  `${a.startDate}T${a.startTime}`.localeCompare(`${b.startDate}T${b.startTime}`),
);

const output = {
  fetchedAt: now.toISOString(),
  timezone: "Asia/Seoul",
  rangeStart,
  rangeEnd,
  source: {
    name: "Leek Duck 공개 일정 피드",
    url: "https://github.com/pokelitee/leak-duck",
    officialNewsUrl: "https://pokemongo.com/news",
  },
  events,
};

const outputPath = path.resolve("app/data/generated/monthly-events.json");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`월간 일정 ${events.length}개 저장: ${outputPath}`);
