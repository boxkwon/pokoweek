import Link from "next/link";
import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, RatingStars, SectionHeader, TypeBadge } from "../_components/design-system";
import { ChevronIcon, StarOutlineIcon, SwordsIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import { APP_SUBTITLE } from "../_config/app";
import { typeColors, type GuideCategory } from "../_data/guide-data";
import { getCurrentWeek, getGuidesByCategory, getGuidesForWeek, getPokemonGuide, getRecommendedGuides, getWeekEventById } from "../_data/queries";
import { getAppNow, isValidDateOverride } from "../_lib/time";

const filters = [
  { key: "all", label: "전체" },
  { key: "raid", label: "레이드" },
  { key: "mega", label: "메가" },
  { key: "max", label: "맥스" },
  { key: "shadow", label: "그림자" },
] as const;

type GuideFilter = (typeof filters)[number]["key"];
type SearchParams = Promise<{ category?: string | string[]; event?: string | string[]; date?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function guideHref(category: GuideFilter, eventId?: string, dateOverride?: string) {
  const query = new URLSearchParams();
  if (category !== "all") query.set("category", category);
  if (eventId) query.set("event", eventId);
  if (dateOverride) query.set("date", dateOverride);
  const value = query.toString();
  return value ? `/guide?${value}` : "/guide";
}

export default async function GuideIndexPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const requestedDate = firstValue(query.date);
  const dateOverride = isValidDateOverride(requestedDate) ? requestedDate : undefined;
  const week = getCurrentWeek(getAppNow(dateOverride));
  const eventId = firstValue(query.event);
  const event = getWeekEventById(week, eventId);
  const requestedCategory = firstValue(query.category);
  const category: GuideFilter = filters.some((filter) => filter.key === requestedCategory) ? requestedCategory as GuideFilter : "all";
  const weeklyGuides = event
    ? event.guidePokemonIds.map((id) => getPokemonGuide(id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
    : getGuidesForWeek(week);
  const guides = getGuidesByCategory(weeklyGuides, category as GuideCategory | "all");
  const recommended = getRecommendedGuides(week);

  return <main className="fresh-screen boss-screen guide-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    <section className="home-board guide-recommended-board">
      <SectionHeader icon={<StarOutlineIcon />} title="이번 주 추천 공략" />
      <div className="guide-recommended-list">
        {recommended.map(({ priority, guide }) => <Link href={`/pokemon/${guide.id}`} key={guide.id}>
          <b className="priority-rank">{priority.rank}</b>
          <PokemonArtwork image={guide.image} alt={guide.name} size="sm" />
          <div><h3>{guide.name}</h3><RatingStars value={priority.rating} /><p>{priority.reason}</p></div>
          <ChevronIcon />
        </Link>)}
      </div>
    </section>

    <nav className="schedule-filters guide-filters" aria-label="공략 카테고리">
      {filters.map((filter) => <Link aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={guideHref(filter.key, event?.id, dateOverride)} key={filter.key}>
        <CategoryBadge className={`schedule-filter-badge filter-${filter.key}`}>{filter.label}</CategoryBadge>
      </Link>)}
    </nav>

    <section className="guide-list-section">
      <SectionHeader icon={<SwordsIcon />} title={event ? `${event.title} 공략 선택` : "포켓몬 공략 목록"} description={event ? "원하는 포켓몬을 선택하세요" : "이번 주 등장 포켓몬"} />
      {guides.length > 0 ? <div className="guide-index-list">{guides.map((guide) => <Link href={`/pokemon/${guide.id}`} key={guide.id}>
        <PokemonArtwork image={guide.image} alt={guide.name} size="sm" />
        <div className="guide-index-copy">
          <CategoryBadge className={`schedule-category-badge guide-category-${guide.category}`}>{guide.categoryLabel}</CategoryBadge>
          <h3>{guide.name}</h3>
          <div className="guide-type-list">{guide.types.map((type) => <TypeBadge type={type} color={typeColors[type]} key={type} />)}</div>
          <div className="guide-index-rating"><RatingStars value={guide.rating} /><strong>{guide.reason}</strong></div>
          <p><b>약점</b>{guide.weaknesses.map((item) => item.type).join(" · ")}</p>
        </div>
        <ChevronIcon />
      </Link>)}</div> : <p className="schedule-empty">이 카테고리에 확정된 공략이 없어요.</p>}
    </section>

    <BottomNavigation active="guide" />
  </main>;
}
