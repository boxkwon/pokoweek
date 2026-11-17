import { MANUAL_PACKAGE_VERSION } from "./schemas";

export const MANUAL_GUIDE_PROMPT_VERSION = "pokoweek-manual-guide-v2-data-quality";

export function createManualPrompt(packageFiles: readonly string[]) {
  return `# POKOWEEK 수동 AI 가이드 후보 작성

이 작업은 ${MANUAL_PACKAGE_VERSION} 입력 패키지를 사람이 ChatGPT 또는 Codex에 전달해 후보 JSON을 작성하는 절차다.

## 입력

${packageFiles.map((file) => `- \`${file}\``).join("\n")}

각 파일의 \`modelInput\`과 \`outputJsonSchema\`만 근거로 사용한다. 외부 지식이나 기억으로 기술·비용·성능 수치를 보충하지 않는다.

## 작성 규칙

1. 세 포켓몬 각각에 대해 \`outputJsonSchema\`에 맞는 \`guide\`를 작성한다.
2. 모든 판단·행동·경고에는 실제 입력에 존재하는 Evidence ID를 연결한다.
3. 기술 이름은 대상 포켓몬 기술 목록의 영문 이름을 정확히 사용한다. 융합 전용 기술은 해당 FusionRecipe의 targetMove만 허용한다.
4. API Evidence가 \`needs_review\`이면 이를 확정 사실처럼 과장하지 않는다. 비교 근거가 부족하면 \`conditional\` 또는 \`hold\`로 남긴다.
5. 얼어붙은세계는 융합 자체의 필수 재료가 아니다. 콜드플레어/프리즈볼트 기술 변환을 원하는 큐레무별 사전 확인이다.
6. 화이트용·블랙용 큐레무 선택과 기술 확인을 서로 독립된 행동으로 표현한다.
7. 레시라무·제크로무는 융합 중 결합된 상태이며 분리 시 해제된다는 근거를 주의사항에 연결한다.
8. 화이트/블랙큐레무의 상세는 융합 절차를 반복하지 않고 융합 후 기술·강화·해방·XL 판단을 중심으로 작성한다.
9. 근거가 없는 레벨, 상대 순위, 예상 레이드 횟수는 만들지 않는다.
10. 후보를 승인하거나 게시하지 않는다.
11. performanceRating은 전투 성능 비교 근거가 충분할 때만 1~5로 작성한다. 자료 신뢰도 부족을 3점으로 바꾸지 말고 null로 둔다.
12. evidenceConfidence는 근거 신뢰 수준, editorialStatus는 게시 준비도다. 둘을 성능 점수와 섞지 않는다.
13. raidComparison은 실제 시뮬레이션이나 DPS/TDO가 아니라 명시된 가정의 상대 주기 지표다. 타입별 공격수 순위로 과장하지 않는다.
14. PvP 시뮬레이션이 없으면 최적 조합·상위 티어·매치업 우위를 단정하지 않는다.
15. Lv.30/35/40/50 판단은 progression 근거와 한계를 함께 반영한다. 고정 CP 목표는 개체값·레벨 가정 없이 만들지 않는다.
16. Structural Complete와 Editorial Ready는 별개다. 핵심 성능 비교가 부족하면 구조를 채워도 editorialStatus를 needs_review로 유지한다.
17. 여덟 개 decisionQuestions는 각각 결론·이유·적용 조건을 제공해야 한다. 전체 순위가 없어도 사용자가 안전하게 행동을 결정할 수 있으면 performanceRating은 null인 채 editorialStatus를 ready로 둘 수 있다.
18. 기술 해방은 적용 가능 여부를 숨기지 말고 우선·조건부·후순위·보류 중 하나에 해당하는 투자 판단과 모드를 명시한다.

## 출력 형식

JSON 하나만 작성한다.

\`\`\`json
{
  "schemaVersion": 1,
  "packageVersion": "${MANUAL_PACKAGE_VERSION}",
  "candidates": [
    {
      "inputPackageHash": "각 입력 패키지의 packageHash",
      "guide": { "pokemonId": "kyurem", "...": "해당 outputJsonSchema에 맞는 값" }
    }
  ]
}
\`\`\`

세 후보는 kyurem, white-kyurem, black-kyurem을 각각 정확히 한 번 포함해야 한다.
`;
}
