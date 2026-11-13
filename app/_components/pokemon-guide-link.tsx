"use client";

import type { ComponentProps } from "react";
import { ContextLink } from "./context-link";

export const GUIDE_ORIGIN_STORAGE_KEY = "pokoweek:pokemon-guide-origin";

type PokemonGuideLinkProps = Omit<ComponentProps<typeof ContextLink>, "onNavigate">;

function getPathname(href: PokemonGuideLinkProps["href"]) {
  return href.split("?")[0].split("#")[0];
}

export function PokemonGuideLink({ href, ...props }: PokemonGuideLinkProps) {
  const target = getPathname(href);

  return <ContextLink
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
