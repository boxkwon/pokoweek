import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "./components/header";

export const metadata: Metadata = {
  title: { default: "GO WEEK — Pokémon GO 주간 가이드", template: "%s | GO WEEK" },
  description: "이번 주 Pokémon GO에서 무엇을 잡고 준비할지 5초 안에 확인하세요.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f6f2" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <strong>GO WEEK</strong>
          <p>비공식 팬 서비스 · 게임 내 일정은 변경될 수 있어요.</p>
          <p>Pokémon 및 Pokémon 캐릭터는 Nintendo / Creatures / GAME FREAK의 상표입니다.</p>
        </footer>
      </body>
    </html>
  );
}
