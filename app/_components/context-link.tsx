"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { getRouteDateContextFromSearch, withInheritedDateContext } from "../_lib/internal-url";

type ContextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function ContextLink({ href, ...props }: ContextLinkProps) {
  const [dateContext, setDateContext] = useState<string>();

  useEffect(() => {
    setDateContext(getRouteDateContextFromSearch(window.location.search));
  }, []);

  return <Link {...props} href={withInheritedDateContext(href, dateContext)} />;
}
