import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const source = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["week", "category", "date"] as const) {
    const value = source[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) query.set(key, first);
  }
  redirect(query.size ? `/schedule?${query.toString()}` : "/schedule");
}
