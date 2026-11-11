import type { Metadata, Viewport } from "next";
import { APP_NAME, APP_SUBTITLE } from "./_config/app";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_SUBTITLE,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
