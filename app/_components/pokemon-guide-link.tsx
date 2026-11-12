"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

export const GUIDE_ORIGIN_STORAGE_KEY = "pokoweek:pokemon-guide-origin";

type PokemonGuideLinkProps = Omit<ComponentProps<typeof Link>, "onNavigate">;

function getPathname(href: PokemonGuideLinkProps["href"]) {
  const value = typeof href === "string" ? href : href.pathname?.toString() ?? "";
  return value.split("?")[0].split("#")[0];
}

export function PokemonGuideLink({ href, ...props }: PokemonGuideLinkProps) {
  const target = getPathname(href);

  return <Link
    {...props}
    href={href}
    onNavigate={() => {
      if (!target.startsWith("/pokemon/")) return;
      sessionStorage.setItem(GUIDE_ORIGIN_STORAGE_KEY, JSON.stringify({
        source: `${location.pathname}${location.search}${location.hash}`,
        target,
        createdAt: Date.now(),
      }));
    }}
  />;
}
