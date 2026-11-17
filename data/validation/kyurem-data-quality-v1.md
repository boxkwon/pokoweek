# POKOWEEK Data Engine — Kyurem Data Quality v1

> 이 중간 보고서의 `needs_review` 판정과 23개 테스트 결과는 당시 상태를 기록한 것이다. 최신 의사결정 가이드와 최종 판정은 `kyurem-final-guide-review.md` 및 `kyurem-family.json`을 기준으로 한다.

작성일: 2026-11-17 (Asia/Seoul)

상태: **후보 검토 중 / 승인·게시 안 함**

## 1. 정규화 누락 원인과 수정

기존 `buildMoves()`는 `current_pokemon_moves.json`의 현재 기술과 elite 기술 이름만 순회했다. `Ice Burn`과 `Freeze Shock`은 PoGo API의 PvE/PvP 기술 수치 테이블에는 존재하지만 현재 기술 목록에는 없고, 공식 `FusionRecipe.moveTransformation.targetMove`로만 연결돼 있었다. 따라서 수치 테이블 조회 대상에서 빠졌다.

수정 후 정규화기는 현재·elite·검증된 특수 기술 이름을 하나의 경로에서 처리한다. 특수 기술은 FusionRecipe의 Evidence ID와 PvE/PvP 수치 Evidence ID를 함께 기록하며, 한쪽 수치가 없으면 정규화를 실패시킨다.

### 연결된 수치

| 기술 | PvE | PvP | PvP 효과 |
|---|---|---|---|
| Ice Burn | 얼음 / 위력 90 / 에너지 -50 / 2,000ms | 위력 120 / 에너지 -60 | 30% 확률, 상대 방어 -1단계 |
| Freeze Shock | 얼음 / 위력 160 / 에너지 -100 / 1,500ms | 위력 120 / 에너지 -60 | 30% 확률, 상대 공격 -1단계 |

효과 확률은 `activationChance`, 대상·능력치·단계 변화는 `target/stat/stages`로 분리했다. PvE와 PvP는 서로 다른 필드로 유지한다.

## 2. 성능 비교 근거

PoGo API의 기본 공격, PvE 위력·에너지·시전 시간, 타입 상성으로 `relative_cycle_index_v1`을 계산했다.

계산 개요:

1. `ceil(스페셜 에너지 / 노말 기술 에너지 수급)`으로 한 주기의 노말 기술 횟수를 구한다.
2. 노말·스페셜 피해에 자속 1.2와 대상 타입 상성을 적용한다.
3. `(기본 공격 × 한 주기 가중 위력) / 한 주기 시간`으로 상대 지표를 만든다.

이 값은 실제 DPS/TDO나 레이드 시뮬레이션이 아니다. 보스 방어, 피해량 반올림, 생존, 상대 기술, 회피, 재입장, 날씨·우정·메가 보너스를 반영하지 않는다.

| 조합 | 중립 지표 | Dragon/Flying 상대 지표 |
|---|---:|---:|
| 큐레무 — Dragon Breath + Glaciate | 6,100.800 | 12,784.128 |
| 화이트큐레무 — Ice Fang + Ice Burn | 7,211.077 | 18,460.357 |
| 블랙큐레무 — Dragon Tail + Freeze Shock | 8,774.069 | 17,979.145 |
| 블랙큐레무 — Shadow Claw + Freeze Shock | 7,572.857 | 14,205.086 |

해석 가능한 범위:

- 화이트는 Ice Fang과 Ice Burn이 모두 얼음 타입이어서 얼음 약점 상대에서 역할이 일관된다.
- 블랙의 Dragon Tail + Freeze Shock은 드래곤·얼음이 모두 유효한 상대에서 비교할 수 있지만, 단일 약점 상대의 최적 조합으로 일반화할 수 없다.
- 전체 공격수 순위가 없으므로 세 포켓몬의 성능 별점은 확정하지 않는다.

## 3. 후보 v2 육성 판단

### 큐레무

- 결론: 화이트·블랙용 개체와 Glaciate 상태를 각각 먼저 확정한다. 남는 개체만 본체 육성을 검토한다.
- 레이드: Dragon Breath + Glaciate. 실제 공격수 순위가 없어 성능 미평가.
- PvP: Dragon Breath + Glaciate + Dragon Claw를 검토 조합으로만 제시. 매치업 시뮬레이션 없음.
- 강화: 즉시 본체가 필요할 때만 Lv.30을 조건부 검토. Lv.35/40은 보류, Lv.50은 미평가.
- 해방: PvP 사용을 확정할 때만 조건부.
- XL: 레이드 순위와 PvP 목표 레벨이 없어 보류.
- 우선 자원: 두 융합의 큐레무 사탕과 개체를 먼저 보존.

### 화이트큐레무

- 결론: Ice Burn 변환을 확인한 뒤 현재 얼음 팀의 공백을 메울 때 단계 투자.
- 레이드: Ice Fang + Ice Burn. 동일 얼음 타입의 자속 조합이며 Ice Burn 수치가 정상 연결됨.
- PvP: Ice Fang + Ice Burn을 검토 조합으로 기록. 30% 방어 감소는 사실 데이터이나 최적성은 미검증.
- 강화: Lv.30 → Lv.35 → Lv.40을 실제 팀 부족이 확인될 때만 단계적으로 검토. 각 레벨은 최적 효율점이라는 뜻이 아님.
- 해방: 현재 레이드 중심 후보에서는 비적용.
- XL: 레벨 50 비교 근거가 없어 보류.
- 우선 자원: 융합 비용과 필드 효과용 큐레무 사탕을 먼저 분리.

### 블랙큐레무

- 결론: Freeze Shock 변환과 공략 상대의 드래곤·얼음 약점을 확인한 뒤 선택 투자.
- 레이드: Dragon Tail + Freeze Shock. 혼합 타입이므로 상대에 따라 역할이 달라짐.
- PvP: Shadow Claw + Freeze Shock을 검토 조합으로 기록. 30% 공격 감소는 사실 데이터이나 최적성은 미검증.
- 강화: 즉시 맞는 공략 상대가 있을 때 Lv.30/35/40을 단계적으로 검토. Lv.50은 미평가.
- 해방: 현재 단일 역할 후보에서는 비적용.
- XL: 외부 순위와 레벨 50 비교가 없어 보류.
- 우선 자원: 융합 비용과 필드 효과용 큐레무 사탕을 먼저 분리.

## 4. 공식 융합 사실 보강

공식 수동 Evidence에 다음을 추가했다.

- 화이트/블랙큐레무는 융합 상태에서 교환, 박사 전송, Pokémon HOME 전송 불가.
- Ice Burn/Freeze Shock 필드 효과는 다른 필드 효과와 동시 사용 불가.
- 각 필드 효과는 별의모래 5,000 + 큐레무 사탕 5개로 10분.
- 분리 비용은 없고 파트너가 풀리며 특수 기술은 Glaciate로 복귀.

공식 원문을 자동 수집한 것으로 표시하지 않았고 `rawCollected: false`, 수동 검토 Evidence로 유지했다.

## 5. 완전성 및 게시 판정

| 포켓몬 | Structural Completeness | Editorial Readiness | performanceRating | evidenceConfidence | 후보 상태 |
|---|---|---|---|---|---|
| 큐레무 | complete | needs_review | null | medium | pending |
| 화이트큐레무 | complete | needs_review | null | medium | pending |
| 블랙큐레무 | complete | needs_review | null | medium | pending |

`complete`는 JSON 구조와 참조가 온전하다는 뜻일 뿐 게시 가능을 뜻하지 않는다. Editorial Ready가 아니면 승인과 게시 양쪽 모두 차단된다.

## 6. 기존 후보와 차이

- 세 포켓몬의 3/5 별점을 제거하고 `performanceRating: null`로 변경했다.
- 데이터 신뢰도는 `evidenceConfidence: medium`, 게시 준비도는 `editorialStatus: needs_review`로 분리했다.
- Ice Burn/Freeze Shock의 실제 PvE/PvP 수치와 효과를 연결했다.
- 레이드와 PvP 기술·판단을 별도 근거로 작성했다.
- Lv.30/35/40/50 단계 판단을 추가했으나, 근거 없는 CP 목표는 만들지 않았다.
- 저장·전송 제한과 필드 효과 동시 사용 제한을 주의사항에 추가했다.
- 이전 후보는 `data/candidates/history/`에 보존했다.

## 7. 여전히 답할 수 없는 질문

- 타입별 전체 공격수 중 정확한 순위
- 실제 보스별 DPS/TDO와 최소 인원
- PvP 리그별 최적 개체값·핵심 매치업·실드 시나리오
- Lv.50의 정량적 효율과 우선순위
- 화이트와 블랙 중 모든 사용자에게 공통인 절대 우선순위

따라서 후보 v2는 승인·게시하지 않는다.

## 8. 검증 결과

- Data Engine 테스트: 23/23 통과
- TypeScript: 통과
- Next.js Production build: 통과
- 승인 실행: 안 함
- 게시 실행: 안 함
- 승인 오버레이: `[]` 유지
- 외부 유료 AI API 비용: $0
