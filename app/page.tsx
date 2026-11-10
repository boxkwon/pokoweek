import Link from "next/link";
import { events, schedule } from "./data/events";
import { currentWeek } from "./data/week";
import { WeeklyHero } from "./components/weekly-hero";
import { PriorityCard } from "./components/priority-card";
import { CategoryBadge, SectionHeader } from "./components/ui";
import { ChevronIcon } from "./components/icons";
import { formatTime } from "./lib/format";
import { WeeklyOverview } from "./components/weekly-overview";
import { FeaturedEventCard } from "./components/featured-event-card";

const todayKey = "2026-11-11";
const todayItems = schedule.filter((item) => item.start.slice(0, 10) <= todayKey && item.end.slice(0, 10) >= todayKey).slice(0, 4);
const featuredEvent = events.find((event) => event.slug === currentWeek.featuredEventSlug);

function toneFor(kind: string) {
  if (kind === "max") return "max" as const;
  if (kind === "raid") return "legendary" as const;
  if (kind === "community") return "community" as const;
  return "event" as const;
}

export default function Home() {
  return (
    <div className="page-shell home-page app-frame">
      <WeeklyHero week={currentWeek} />

      <section className="home-section" id="priority">
        <SectionHeader eyebrow="PLAY FIRST" title="이번 주 꼭 할 것 TOP 3" />
        <div className="priority-card-list">{currentWeek.priorities.map((priority) => <PriorityCard priority={priority} key={priority.rank} />)}</div>
      </section>

      <section className="home-section">
        <SectionHeader eyebrow="TODAY" title="오늘의 일정" action={<Link href="/raids">전체 <ChevronIcon /></Link>} />
        <div className="today-schedule">
          {todayItems.map((item) => (
            <Link href={item.eventSlug ? `/events/${item.eventSlug}` : item.bossSlugs?.[0] ? `/bosses/${item.bossSlugs[0]}` : "/raids"} className="today-schedule-row" key={item.id}>
              <time>{formatTime(item.start)}</time>
              <CategoryBadge tone={toneFor(item.kind)}>{item.label ?? (item.kind === "max" ? "맥스" : item.kind === "raid" ? "레이드" : "이벤트")}</CategoryBadge>
              <strong>{item.title}</strong>
              <ChevronIcon />
            </Link>
          ))}
        </div>
      </section>

      {featuredEvent ? (
        <section className="home-section preparation-section">
          <SectionHeader eyebrow="PREPARE NEXT" title="다음 이벤트 준비" />
          <FeaturedEventCard event={featuredEvent} preparation={currentWeek.preparation} />
        </section>
      ) : null}

      <section className="home-section weekly-preview-section">
        <WeeklyOverview />
      </section>

      <Link className="print-week-link" href="/print/week">이번 주 가이드 A4로 보기 <ChevronIcon /></Link>
    </div>
  );
}
