# 큐레무 3종 게시 준비 최종 검토

검토일: 2026-11-17 (Asia/Seoul)

대상 스냅샷: `38cf9e8b80dc06a3f9b1558bccfe61ff23ce72124a99195106d1e6e7735db9a3`

후보 상태: 3종 모두 `pending` — 승인·게시·Production 반영 안 함

## 1. 검증 완료된 주요 Fact

아래의 `검토 완료`는 PoGo API 엔드포인트 전체를 일괄 승인했다는 뜻이 아니다. 큐레무·화이트큐레무·블랙큐레무 가이드에서 실제로 사용하는 레코드와 필드만 원본 스냅샷 및 비교 자료에 대조했다.

| 항목 | PoGo API 원본 값 | 대조 자료 | 조회일 | 비교 결과 | 상태 |
|---|---|---|---|---|---|
| 타입·기본 능력치 | 큐레무 Dragon/Ice, 246/170/245; 화이트·블랙 Dragon/Ice, 310/183/245 | Bulbapedia `Kyurem (GO)` | API 2026-11-17 00:49:59Z / 비교 2026-11-17 KST | 폼별 값 일치 | 검토 완료 |
| 큐레무 기술 목록 | Dragon Breath, Steel Wing / Dragon Claw, Blizzard, Draco Meteor, Glaciate(elite) | Bulbapedia 폼별 기술 표 | 동일 | 기술명·폼·elite 구분 일치 | 검토 완료 |
| 화이트 기술 목록 | Dragon Breath, Steel Wing, Ice Fang / Dragon Pulse, Blizzard, Ancient Power, Focus Blast, Fusion Flare + Ice Burn(special) | Bulbapedia 및 공식 융합 공지 | 동일 | 일반 기술 목록과 융합 전용 기술을 구분해 일치 | 검토 완료 |
| 블랙 기술 목록 | Dragon Tail, Shadow Claw / Iron Head, Blizzard, Stone Edge, Outrage, Fusion Bolt + Freeze Shock(special) | Bulbapedia 및 공식 융합 공지 | 동일 | 일반 기술 목록과 융합 전용 기술을 구분해 일치 | 검토 완료 |
| Ice Burn PvE | 위력 90 / 에너지 -50 / 2,000ms | PoGo API 원본, Bulbapedia 현재 기술 표 | 동일 | 일치 | 검토 완료 |
| Ice Burn PvP | 위력 120 / 에너지 -60 / 30% 상대 방어 -1 | PoGo API 원본, Bulbapedia 현재 기술 표 | 동일 | 수치·발동 확률·효과 일치 | 검토 완료 |
| Freeze Shock PvE | 위력 160 / 에너지 -100 / 1,500ms | PoGo API 원본, Bulbapedia 현재 기술 표 | 동일 | 일치 | 검토 완료 |
| Freeze Shock PvP | 위력 120 / 에너지 -60 / 30% 상대 공격 -1 | PoGo API 원본, Bulbapedia 현재 기술 표 | 동일 | 수치·발동 확률·효과 일치 | 검토 완료 |
| 특별 기술 조건 | Glaciate 보유 개체 융합 시 Ice Burn/Freeze Shock으로 변환; TM/Elite TM 습득 불가; 분리 시 Glaciate 복귀 | Pokémon GO 공식 큐레무 합체 공지 | 2026-11-17 KST | 일치 | 검토 완료 |
| 융합·보관 규칙 | 파트너 결합 상태, 분리 비용 0, 융합 중 교환·박사 전송·HOME 전송 불가 | Pokémon GO 공식 큐레무 합체 공지 | 동일 | 일치 | 검토 완료 |
| CP | 큐레무 max_cp 4,090; 화이트·블랙 5,268 | Serebii Lv.50/Lv.51 표, GO Hub CP 공식/CPM | 2026-11-17 KST | API 값은 Lv.51 Best Buddy 상한과 일치 | 검토 완료 |
| 강화 비용 | Lv.20→30: 75,000/66, →35: 137,000/130, →40: 225,000/248, →50: 475,000/248/296 XL | GO Hub 강화 계산기, Pokémon GO Help Center | 2026-11-17 KST | 0.5레벨 단위 합계 일치 | 검토 완료 |

Evidence와 상세 원문은 `data/evidence/manual/kyurem-fact-review-2026.json`에 조회 시각, 비교 결과, 출처 URL과 함께 저장했다. 원본 API Evidence의 `needs_review` 상태는 전체 엔드포인트를 검토한 것처럼 일괄 변경하지 않았다.

## 2. 여전히 검토가 필요한 Fact·분석

- `relative_cycle_index_v1`은 같은 상대 타입과 제한된 기술 주기에서만 비교하는 내부 참고 지표다. 실제 DPS/TDO, 보스 방어, 회피, 사망 시간, 날씨·친구 보너스, 전체 공격수 순위를 포함하지 않는다.
- 큐레무 본체와 융합 폼의 PvP 최적 조합·리그별 순위는 매치업 시뮬레이션을 수행하지 않았다.
- 후보가 안내하는 `Glaciate` 확보 경로는 실제 이벤트 및 현재 게임의 Elite TM 목록에 따라 달라질 수 있으므로 투자 직전 게임 화면 확인이 필요하다.
- 일부 제3자 페이지에 남은 Ice Burn PvE 위력 80 표기는 현재 PoGo API와 Bulbapedia의 90과 충돌해 최신값 검증 근거에서 제외했다.

이 항목들은 성능 별점을 부여하지 않는 이유이며, 검증된 융합 규칙·기술·CP·강화 비용까지 부정하는 오류는 아니다.

## 3. CP 불일치 원인과 정정

기존 기록은 PoGo API의 `pokemon_max_cp`를 레벨 50 값으로 간주해 큐레무 4,090과 계산값 4,041을 충돌로 표시했다. 최종 대조 결과 기준이 달랐다.

| 폼 | 15/15/15 Lv.50 | 15/15/15 Lv.51 Best Buddy | PoGo API `max_cp` | 판정 |
|---|---:|---:|---:|---|
| 큐레무 | 4,041 | 4,090 | 4,090 | Lv.51 문맥에서 일치 |
| 화이트큐레무 | 5,206 | 5,268 | 5,268 | Lv.51 문맥에서 일치 |
| 블랙큐레무 | 5,206 | 5,268 | 5,268 | Lv.51 문맥에서 일치 |

정규화 데이터는 이제 Lv.50과 Lv.51 Best Buddy 값을 별도 객체로 저장한다. 검증기는 계산한 Lv.50을 Lv.50 공개값과 비교하고, API `max_cp`는 Lv.51 Best Buddy 공개값과 비교한다. 레벨·Best Buddy 문맥이 다른 두 값을 자동 오류로 처리하지 않는다.

## 4. 포켓몬별 최종 육성 결론

### 큐레무

화이트·블랙용 개체를 먼저 각각 지정하고, 두 개체의 Glaciate 보유 여부를 따로 확인한다. 융합 재료와 기술 상태를 확정하기 전에는 본체에 큰 자원을 쓰지 않는다. 두 융합용 개체를 확보하고 남는 개체가 있으며, 본체를 실제 레이드 또는 PvP에 쓸 목적이 정해졌을 때만 본체 육성을 검토한다.

- 검토 기술: 레이드 `Dragon Breath + Glaciate`, PvP `Dragon Breath + Glaciate + Dragon Claw`.
- 기술 해방: PvP에서 두 스페셜 기술을 실제 사용할 때만 조건부.
- XL: 융합 두 폼을 준비한 뒤에도 본체를 장기 주력으로 쓸 때만 재검토.
- 근거: 융합별 큐레무 1마리 필요, 개체별 기술 변환, 본체 공격 246과 폼별 기술 원본.

### 화이트큐레무

융합 직후 Ice Burn 변환을 먼저 확인하고, 레이드용이라면 Ice Fang으로 맞춘 뒤 Lv.30부터 사용한다. 얼음 공격수 공백이 실제로 남으면 35, 반복 주력으로 쓰면 40까지 단계적으로 올린다. Lv.50은 화이트를 장기 최우선 얼음 전력으로 확정한 경우에만 진행한다.

- 레이드 기술: `Ice Fang + Ice Burn`.
- 기술 해방: 레이드 단일 역할에서는 후순위. PvP 사용 모드와 두 번째 기술이 확정될 때만 조건부.
- XL: Lv.40을 충분히 사용한 뒤 장기 주력 확정 시에만 투자.
- 근거: 공격 310, 두 기술의 얼음 타입·PvE 수치·자속과 타입 상성. 전체 공격수 순위를 검증한 것은 아님.

### 블랙큐레무

융합 직후 Freeze Shock을 확인하고, 공략 상대에서 Dragon과 Ice 약점을 각각 확인한 뒤 Dragon Tail을 설정한다. 두 기술이 모두 유효한 명확한 사용처가 있을 때 Lv.30부터 시작하고, 같은 역할을 반복할 때만 35·40으로 올린다. Lv.50은 블랙의 혼합 타입 역할을 장기간 반복할 계획이 있을 때만 진행한다.

- 레이드 검토 기술: `Dragon Tail + Freeze Shock`. 단일 타입 약점 상대의 범용 최적 조합으로 일반화하지 않는다.
- 기술 해방: 레이드에서는 우선순위 낮음. PvP 조합이 검증될 때만 재검토.
- XL: 화이트보다 블랙을 먼저 키울 구체적인 상대·목적이 있을 때만 투자.
- 근거: 공격 310, Freeze Shock 수치와 Dragon Tail/Freeze Shock의 서로 다른 타입. 전체 공격수 순위를 검증한 것은 아님.

`performanceRating`은 세 후보 모두 `null`을 유지한다. 자료 신뢰 부족을 3점 같은 임의 별점으로 바꾸지 않았다. `evidenceConfidence: medium`은 성능 점수가 아니라 근거 범위의 신뢰 수준이다.

## 5. 기술·강화·해방·XL 투자 판단

| 대상 | 먼저 확인 | Lv.30 | Lv.35 | Lv.40 | Lv.50 | 기술 해방 | XL |
|---|---|---|---|---|---|---|---|
| 큐레무 | 융합용 2마리와 각 Glaciate | 본체 즉시 사용 시 조건부 | 융합 배정 전 보류 | 사용 모드 확정 전 보류 | 본체 장기 PvP/레이드 사용 확정 시만 재검토 | PvP 두 기술 운용 시 조건부 | 융합 우선 후 본체 장기 주력 시만 |
| 화이트 | Ice Burn 변환, Ice Fang | 얼음 팀 공백 시 시작 | Lv.30 사용 후 부족할 때 | 반복 주력일 때 | 장기 최우선 얼음 전력일 때 | 레이드 후순위, PvP 목표 확정 시 조건부 | Lv.40 사용 후 장기 주력 확정 시 |
| 블랙 | Freeze Shock, 상대 Dragon/Ice 약점 | 맞는 상대가 있을 때 시작 | 실제 전력 부족 시 | 혼합 역할 반복 시 | 명확한 장기 대상이 있을 때 | 레이드 후순위, PvP 검증 후 재검토 | 화이트보다 우선할 구체적 사용처가 있을 때 |

15/15/15 CP는 큐레무가 Lv.30/35/40/50에서 3,064/3,319/3,575/4,041, 화이트·블랙이 3,947/4,276/4,605/5,206이다. 이 값은 개체값 15/15/15를 가정하며 고정 CP 목표를 모든 개체에 그대로 적용하지 않는다.

## 6. 기존 UI 데이터 호환성

- 후보 projection은 `performanceRating: null`을 그대로 유지한다. 기존 기본 가이드의 별점으로 되돌아가지 않도록 명시적 `null`과 `undefined`를 구분했다.
- `RatingStars`는 값이 `null` 또는 `undefined`이면 별을 렌더링하지 않는다.
- Hero는 별점 없이도 `verdictLabel`과 요약을 표시한다.
- 활용도는 각 모드를 유지하면서 별 대신 `성능 미평가`를 표시하고, 상세 이유를 함께 보여준다.
- 추천 기술, 육성 순서, 별의모래·사탕·기술 해방·XL 판단은 후보에서 공통 `PokemonGuideDetail` 구조로 투영된다.
- 개체 선택 영역은 후보의 `fusion_or_base` 결론과 이유를 사용해 불필요한 `준비 중` fallback을 피한다.
- Production은 `data/approved/app-guide-overlays.json`만 읽으며 현재 파일은 빈 배열이다. Preview 후보는 별도 파일·환경변수에서만 적용된다.

## 7. Action Guide 재점검

- 화이트와 블랙은 서로 다른 goal ID를 사용한다.
- 체크 상태 키는 `goalId:itemId`이므로 `둘 다`에서도 선택 개체와 Glaciate 확인 상태가 서로 덮어쓰이지 않는다.
- 각 goal에 독립적인 Glaciate 확인 항목이 있다.
- FusionRecipe의 파트너 상태는 `bound_while_fused`이며 분리 시 파트너가 풀리는 설명이 유지된다.
- 융합 완료 후 CTA는 화이트/블랙 각각의 `postActionGuidePokemonId`로 이동한다. 같은 융합 절차 화면을 반복하지 않고 공통 육성 상세로 연결된다.

## 8. Editorial Ready와 게시 가능 여부

- Schema: 통과
- Structural Completeness: 3종 모두 `complete`
- Editorial Readiness: 3종 모두 `ready`
- 큐레무 핵심 Fact review: 검토 완료
- Fusion evidence: 검토 완료
- Validation error: 0
- 후보 review status: 모두 `pending`

결론: **명시적 사람 승인 후 게시 가능한 상태**다. 현재는 승인되지 않았으므로 서비스 게시 조건을 충족하지 않으며 Production에는 적용되지 않는다. 제한 성능 지표와 PvP 미시뮬레이션은 UI에서 성능 별점을 비우고 조건부 판단으로 표현했기 때문에 게시 차단 오류가 아니라 공개 시 함께 유지해야 할 한계다.

## 9. 승인 시 변경될 파일

승인 단계에서:

- `data/candidates/kyurem-family.json` — 선택한 후보의 review 상태와 검토자·시각
- `data/manifests/approved.json` — 승인 snapshot 및 validation hash
- `data/validation/kyurem-family.json`과 review 보고서 — 최신 검증 결과·시각

게시 단계에서:

- `data/approved/app-guide-overlays.json` — 서비스가 읽는 승인된 공통 상세 overlay

이번 작업에서는 위 승인·게시 변경을 수행하지 않았다.

## 10. Preview 배포 절차와 남은 위험

Preview 전용 후보 파일은 `data/preview/app-guide-overlays.json`에 생성한다. 후보 상태는 계속 `pending`이며 승인 파일과 분리된다.

1. `npm run data:validate`
2. `npm run data:preview:prepare`
3. Vercel의 **Preview 환경에만** `NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES=true` 설정
4. Preview 브랜치를 배포해 `/pokemon/kyurem`, `/pokemon/white-kyurem`, `/pokemon/black-kyurem`을 모바일 크기에서 확인
5. Production 환경에서는 변수를 설정하지 않거나 `false`로 유지

코드도 `VERCEL_ENV === "production"`이면 Preview 후보를 적용하지 않도록 이중으로 차단한다. 이번 작업에서는 Vercel 배포와 Production 배포를 모두 수행하지 않았다.

남은 검수 항목:

- Preview 실제 화면에서 null 별점, 긴 기술 문구, 육성 순서, 하단 내비게이션 겹침을 375/390/430px로 확인.
- 성능 별점이 꼭 필요하다면 실제 레이드/PvP 비교 근거를 추가한 뒤 별도로 검토. 현재 제한 지표를 별점으로 변환하면 안 됨.
- 공개 직전 최신 이벤트에서 Glaciate 획득 가능 여부와 기술 목록을 게임 화면에서 한 번 더 확인.
