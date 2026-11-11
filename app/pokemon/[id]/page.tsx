import { notFound } from "next/navigation";
import { PokemonGuideDetail } from "../../_components/pokemon-guide-detail";
import { pokemonGuides } from "../../_data/guide-data";
import { getPokemonGuide } from "../../_data/queries";

export function generateStaticParams() {
  return pokemonGuides.map((guide) => ({ id: guide.id }));
}

export default async function PokemonGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = getPokemonGuide(id);
  if (!guide) notFound();
  return <PokemonGuideDetail guide={guide} />;
}
