import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "./components/header";

export const metadata: Metadata = {
  title: { default: "pokoweek — 우리 가족 Pokémon GO 일정", template: "%s | pokoweek" },
  description: "한국시간 기준 Pokémon GO 주간 일정과 레이드·맥스배틀 공략을 가족과 함께 확인하세요.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f6f2" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <strong>pokoweek</strong>
          <p>비공식 팬 서비스 · 게임 내 일정은 변경될 수 있어요.</p>
          <p>Pokémon 및 Pokémon 캐릭터는 Nintendo / Creatures / GAME FREAK의 상표입니다.</p>
        </footer>
      </body>
    </html>
  );
}
