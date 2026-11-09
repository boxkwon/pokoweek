import Link from "next/link";
import { GameEvent } from "../data/types";
import { formatDateTime } from "../lib/format";
import { ChevronIcon, ClockIcon } from "./icons";

export function EventCard({ event }: { event: GameEvent }) {
  return (
    <Link href={`/events/${event.slug}`} className={`event-card ${event.color}`}>
      <div className="event-card-head">
        <span className="event-eyebrow">{event.eyebrow}</span><ChevronIcon />
      </div>
      <h3>{event.title}</h3>
      <p>{event.summary}</p>
      <div className="event-time"><ClockIcon />{formatDateTime(event.start)} 시작</div>
    </Link>
  );
}
