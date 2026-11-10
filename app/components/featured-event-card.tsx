import Link from "next/link";
import type { GameEvent } from "../data/types";
import { ChevronIcon } from "./icons";
import { EventHeroImage } from "./image-assets";
import { CategoryBadge, PreparationChecklist } from "./ui";

export function FeaturedEventCard({ event, preparation }: { event: GameEvent; preparation: string[] }) {
  return (
    <article className="featured-event-card">
      <EventHeroImage src={event.eventHero} alt="" />
      <span className="featured-event-overlay" />
      <div className="featured-event-content">
        <CategoryBadge tone="event">{event.eyebrow}</CategoryBadge>
        <h3>{event.title}</h3>
        <p>{event.summary}</p>
        <PreparationChecklist items={preparation} />
        <Link href={`/events/${event.slug}`}>이벤트 상세 보기 <ChevronIcon /></Link>
      </div>
    </article>
  );
}
