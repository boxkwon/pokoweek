import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ClockIcon, ExternalIcon } from "../../components/icons";
import { monthlyEvents } from "../../data/monthly";
import { getPokemonTypes } from "../../data/pokemon-types";
import { PokemonThumbnail } from "../../components/pokemon-thumbnail";
import { EventHeroImage } from "../../components/image-assets";

export function generateStaticParams() {
  return monthlyEvents.map((event) => ({ slug: event.slug }));
}

function periodLabel(startDate: string, endDate: string, startTime: string, endTime: string) {
  const start = startDate.replaceAll("-", ".");
  const end = endDate.replaceAll("-", ".");
  if (startDate === endDate) return `${start} ${startTime}–${endTime}`;
  return `${start} ${startTime} ~ ${end} ${endTime}`;
}

export default async function CalendarEventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = monthlyEvents.find((item) => item.slug === slug);
  if (!event) notFound();
  const isRaid = event.category === "Raid Battles"
    || event.category === "Raid Hour"
    || event.category === "Raid Day"
    || event.category === "Max Battles";

  return (
    <div className="page-shell detail-page calendar-event-detail">
      <Link href={isRaid ? "/raids" : "/events"} className="back-link"><ArrowLeftIcon />{isRaid ? "레이드" : "이벤트"}로 돌아가기</Link>

      <section className="calendar-event-hero">
        <div className="calendar-event-art">
          {event.pokemon.length > 0 ? (
            <div className={`calendar-event-pokemon count-${Math.min(event.pokemon.length, 3)}`}>
              {event.pokemon.slice(0, 3).map((pokemon) => (
                <PokemonThumbnail
                  image={pokemon.image}
                  name={pokemon.name}
                  types={getPokemonTypes(pokemon.name)}
                  key={pokemon.name}
                />
              ))}
            </div>
          ) : event.image ? (
            <EventHeroImage src={event.image} alt={event.title} priority className="calendar-event-banner" />
          ) : <span className="calendar-event-no-art">일정</span>}
        </div>
        <div className="calendar-event-copy">
          <span className="battle-pill">{event.categoryLabel}</span>
          <h1>{event.title}</h1>
          <div className="calendar-event-period"><ClockIcon />{periodLabel(event.startDate, event.endDate, event.startTime, event.endTime)}</div>
          <p className={event.announced ? "" : "announcement-pending"}>
            {event.announced ? "공개된 Pokémon GO 일정입니다." : "상세 포켓몬은 아직 공식 발표 전입니다."}
          </p>
        </div>
      </section>

      <section className="detail-section calendar-event-info">
        <h2>일정 정보</h2>
        <div className="calendar-event-info-card">
          <div><span>종류</span><strong>{event.categoryLabel}</strong></div>
          <div><span>시간</span><strong>한국시간 기준</strong></div>
          <div><span>발표 상태</span><strong>{event.announced ? "공개됨" : "상세 발표 전"}</strong></div>
        </div>
      </section>

      {event.pokemon.length > 0 && (
        <section className="detail-section">
          <h2>등장 포켓몬</h2>
          <div className="calendar-pokemon-list">
            {event.pokemon.map((pokemon) => (
              <PokemonThumbnail
                image={pokemon.image}
                name={pokemon.name}
                types={getPokemonTypes(pokemon.name)}
                key={pokemon.name}
              />
            ))}
          </div>
        </section>
      )}

      <section className="detail-section sources-section">
        <h2>일정 출처</h2>
        <a className="calendar-source-link" href={event.sourceUrl} target="_blank" rel="noreferrer">
          <span><b>{event.sourceKind === "official" ? "공식" : "일정 피드"}</b>원문에서 변경사항 확인</span>
          <ExternalIcon />
        </a>
      </section>
    </div>
  );
}
