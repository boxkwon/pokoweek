# pokoweek

가족끼리 공유하는 Pokémon GO 주간 일정 MVP입니다. 전국 공통 일정을 한국시간 기준으로 보여주며, 레이드·맥스배틀·이벤트 일정과 보스별 약점·추천 카운터를 한눈에 확인할 수 있습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

프로덕션 빌드는 다음 명령으로 확인합니다.

```bash
npm run build
npm start
```

## 데이터 구조

- `app/data/events.ts`: 이벤트와 주간 일정
- `app/data/bosses.ts`: 보스 타입, 약점, 추천 카운터
- `app/data/sources.ts`: 공식·커뮤니티 출처와 마지막 확인 시각
- `app/data/types.ts`: 수동 JSON/TS와 향후 자동수집이 함께 사용할 데이터 형식

새 일정을 반영할 때는 출처를 먼저 `sources.ts`에 등록하고, `events.ts`와 `bosses.ts`에서 해당 `sourceIds`를 연결합니다. 이 구조는 나중에 수집 스크립트나 CMS/API 응답으로 바꾸더라도 화면 코드를 유지할 수 있도록 분리되어 있습니다.

## 화면

- `/`: 이번 주 우선순위, 큰 일정, 핵심 보스
- `/schedule`: 날짜별 주간 캘린더와 목록
- `/events/[slug]`: 이벤트 상세와 가족 준비 체크리스트
- `/bosses/[slug]`: 타입, 약점, 추천 카운터, 작전 메모

## Vercel 배포

Vercel 계정에 로그인한 뒤 프로젝트 폴더에서 아래 명령을 실행합니다.

```bash
npx vercel
npx vercel --prod
```

또는 GitHub 저장소에 올린 뒤 Vercel 대시보드에서 저장소를 가져와도 됩니다. 별도의 환경 변수나 데이터베이스는 필요하지 않습니다.

## 주의

이 프로젝트는 비공식 팬 서비스입니다. 공식 발표 후 일정이 변경될 수 있으므로 서비스 화면의 출처 링크와 확인 시각을 함께 갱신하세요.
