"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { getDateContextFromSearch, withCurrentDateContext } from "../_lib/internal-url";

type ContextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function ContextLink({ href, ...props }: ContextLinkProps) {
  const [dateContext, setDateContext] = useState<string>();

  useEffect(() => {
    setDateContext(getDateContextFromSearch(window.location.search));
  }, []);

  return <Link {...props} href={withCurrentDateContext(href, dateContext)} />;
}
