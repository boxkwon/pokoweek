import { AppHeader } from "../_components/app-header";
import { BottomNavigation } from "../_components/bottom-nav";
import { CategoryBadge, RatingStars, SectionHeader, TypeBadge } from "../_components/design-system";
import { ChevronIcon, StarOutlineIcon, SwordsIcon } from "../_components/icons";
import { PokemonArtwork } from "../_components/pokemon-artwork";
import { PokemonGuideLink } from "../_components/pokemon-guide-link";
import { ContextLink } from "../_components/context-link";
import { APP_SUBTITLE } from "../_config/app";
import { typeColors, type GuideCategory } from "../_data/guide-data";
import { getCurrentWeek, getGuideSelectionForEvent, getGuidesByCategory, getGuidesForWeek, getRecommendedGuides, getWeekEventById } from "../_data/queries";
import { getAppNow, getDateAtSeoulNoon, isDateKey } from "../_lib/time";
import { withDateContext, withScheduleNavigationContext, type ScheduleNavigationContext } from "../_lib/internal-url";

const filters = [
  { key: "all", label: "전체" },
  { key: "raid", label: "레이드" },
  { key: "mega", label: "메가" },
  { key: "max", label: "맥스" },
  { key: "shadow", label: "그림자" },
] as const;

type GuideFilter = (typeof filters)[number]["key"];
type SearchParams = Promise<{ category?: string | string[]; event?: string | string[]; date?: string | string[]; week?: string | string[]; scheduleCategory?: string | string[] }>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function guideHref(category: GuideFilter, eventId: string | undefined, scheduleContext: ScheduleNavigationContext) {
  const query = new URLSearchParams();
  if (category !== "all") query.set("category", category);
  if (eventId) query.set("event", eventId);
  const value = query.toString();
  return withScheduleNavigationContext(withDateContext(value ? `/guide?${value}` : "/guide", scheduleContext.date), scheduleContext);
}

export default async function GuideIndexPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const requestedDate = firstValue(query.date);
  const selectedDate = isDateKey(requestedDate) ? requestedDate : undefined;
  const scheduleContext: ScheduleNavigationContext = {
    week: firstValue(query.week),
    date: selectedDate,
    category: firstValue(query.scheduleCategory),
  };
  const week = getCurrentWeek(selectedDate ? getDateAtSeoulNoon(selectedDate) : getAppNow());
  const eventId = firstValue(query.event);
  const event = getWeekEventById(week, eventId);
  const requestedCategory = firstValue(query.category);
  const category: GuideFilter = filters.some((filter) => filter.key === requestedCategory) ? requestedCategory as GuideFilter : "all";
  const eventSelections = event ? getGuideSelectionForEvent(event) : undefined;
  const weeklyGuides = eventSelections
    ? eventSelections.flatMap((item) => item.guide ? [item.guide] : [])
    : getGuidesForWeek(week);
  const guides = getGuidesByCategory(weeklyGuides, category as GuideCategory | "all");
  const guideIds = new Set(guides.map((guide) => guide.id));
  const guideEntries = eventSelections
    ? eventSelections.filter((item) => category === "all" ? true : Boolean(item.guide && guideIds.has(item.guide.id)))
    : guides.map((guide) => ({ guide, pokemon: undefined }));
  const recommended = getRecommendedGuides(week);

  return <main className="fresh-screen boss-screen guide-screen">
    <AppHeader subtitle={APP_SUBTITLE} />

    <section className="home-board guide-recommended-board">
      <SectionHeader icon={<StarOutlineIcon />} title="이번 주 추천 공략" />
      <div className="guide-recommended-list">
        {recommended.map(({ priority, guide }) => <PokemonGuideLink href={withScheduleNavigationContext(withDateContext(`/pokemon/${guide.id}`, selectedDate), scheduleContext)} key={guide.id}>
          <b className="priority-rank">{priority.rank}</b>
          <PokemonArtwork image={guide.image} alt={guide.name} size="sm" />
          <div><h3>{guide.name}</h3><RatingStars value={priority.rating} /><p>{priority.reason}</p></div>
          <ChevronIcon />
        </PokemonGuideLink>)}
      </div>
    </section>

    <nav className="schedule-filters guide-filters" aria-label="공략 카테고리">
      {filters.map((filter) => <ContextLink aria-current={category === filter.key ? "page" : undefined} className={category === filter.key ? "selected" : ""} href={guideHref(filter.key, event?.id, scheduleContext)} key={filter.key}>
        <CategoryBadge className={`schedule-filter-badge filter-${filter.key}`}>{filter.label}</CategoryBadge>
      </ContextLink>)}
    </nav>

    <section className="guide-list-section">
      <SectionHeader icon={<SwordsIcon />} title={event ? `${event.title} 공략 선택` : "포켓몬 공략 목록"} description={event ? "원하는 포켓몬을 선택하세요" : "이번 주 등장 포켓몬"} />
      {guideEntries.length > 0 ? <div className="guide-index-list">{guideEntries.map(({ guide, pokemon: entry }) => guide ? <PokemonGuideLink href={withScheduleNavigationContext(withDateContext(`/pokemon/${guide.id}`, selectedDate), scheduleContext)} key={guide.id}>
          <PokemonArtwork image={guide.image} alt={guide.name} size="sm" />
          <div className="guide-index-copy">
            <CategoryBadge className={`schedule-category-badge guide-category-${guide.category}`}>{guide.categoryLabel}</CategoryBadge>
            <h3>{guide.name}</h3>
            <div className="guide-type-list">{guide.types.map((type) => <TypeBadge type={type} color={typeColors[type]} key={type} />)}</div>
            <div className="guide-index-rating"><RatingStars value={guide.rating} /><strong>{guide.reason}</strong></div>
            <p><b>약점</b>{guide.weaknesses.map((item) => item.type).join(" · ")}</p>
          </div>
          <ChevronIcon />
        </PokemonGuideLink> : entry ? <article className="guide-index-unavailable" key={entry.id}>
          <PokemonArtwork image={entry.image} alt={entry.name} size="sm" />
          <div className="guide-index-copy">
            <CategoryBadge className={`schedule-category-badge category-${event?.category}`}>{event?.categoryLabel}</CategoryBadge>
            <h3>{entry.name}</h3>
            <p>일정에는 포함되지만 상세 공략은 아직 준비되지 않았어요.</p>
          </div>
        </article> : null)}</div> : <p className="schedule-empty">이 카테고리에 확정된 공략이 없어요.</p>}
    </section>

    <BottomNavigation active="guide" />
  </main>;
}
