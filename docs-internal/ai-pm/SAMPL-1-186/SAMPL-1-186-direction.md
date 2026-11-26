# SAMPL-1-186 방향 — 흙토람 내보내기 xlsx 업로드 거부 수정

- 분류: 버그 수정(외부 연동). 흙토람 내보내기가 업로드 거부된다
- 규모: `heuktoram-script.js`에 후처리 메서드 1개 + 호출부 2곳

## 목표 (Why)
앱이 내보낸 흙토람 xlsx를 흙토람에 올리면 「변조된 확장자 또는 허용되지 않은 확장자 입니다」로 거부된다.

## 사용자 (Who)
흙토람에 시료 검정 정보를 올리는 농업기술센터 담당자.

## 확인된 사실 (소유자의 실제 흙토람 업로드 시험, 코디네이터 전달 — 작성자가 시험을 직접 보지는 못했다)
- 통과: 흙토람 원본 구조에 값만 채운 D0, 앱 파일을 엑셀식 포장으로 고친 V7, V11(앱 파일에서 `[Content_Types].xml`을 ZIP 맨 앞 엔트리로 + `Default Extension="bin"`(xlsb 본문) 한 줄 삭제 — 두 변경을 함께 적용), V10(순서+CT 전체 정리).
- 실패: 앱 원본 출력, 그리고 bin 줄만 지운 파일.
- 값·파일명·시료번호는 원인이 아니다.

## 추론 (시험되지 않은 것)
- **CT만 앞으로 옮긴 파일의 서버 반응은 시험된 적 없다.** 「둘 다 필요하다」는 추정이지 확인이 아니다(조사 보고서도 서버 판별 규칙은 미확인이라 적었다).
- 흙토람의 판별 규칙은 우리가 볼 수 없고, 서버 쪽이 바뀌면 이 수정의 효과도 달라질 수 있다.

## 선택
확인된 통과 사례 중 가장 작은 변경인 V11을 소유자가 최소 수정으로 채택했다. 조사 보고서(다른 작업 공간, `/tmp` 하위라 **휘발성**): `/private/tmp/claude-501/-Users-leechanhee-orca-workspaces-sample-log-electron-heuktoram-xlsx-diff/c0090462-ce42-41fc-b4b9-27518069de26/scratchpad/heuktoram-bisect-report.md`, `/private/tmp/claude-501/-Users-leechanhee-orca-workspaces-sample-log-electron-heuktoram-xlsx-diff/c0090462-ce42-41fc-b4b9-27518069de26/scratchpad/heuktoram-xlsx-diff-report.md`

## 범위 (What)
SheetJS(xlsx-js-style) 출력 후처리에서 위 두 가지를 항상 적용. 흙토람·공익직불제 내보내기가 같은 경로를 쓴다.

## 범위 밖
`src/`의 다른 SheetJS 내보내기(`git grep -I -n -E 'XLSX\.(write|writeFile)[[:space:]]*\(' HEAD -- src` = 전체 16곳, 이 티켓이 다루는 흙토람 2곳 제외 14곳). 그 경로들의 흙토람·타 시스템 업로드 호환성은 **검증되지 않은 별도 위험**이다.

## 방향 확정
근거 둘: (1) 위 업로드 시험으로 V11 통과 확인 및 최소 수정 채택, (2) 소유자의 「계획·검토 산출물을 간단히 만들어 통과」 결정 — 출처: 코디네이터가 전달한 소유자 답변(항목 15의 소유자 답변 이벤트 e287), 원문은 「계획·검토 산출물을 간단히 만들어 통과」. 승인 범위는 **산출물을 간단히 만드는 것**까지이며, 그 이상의 승인은 받지 않았다. 플랜 리뷰는 작성자가 할 수 없어 리뷰 봇 결과를 `SAMPL-1-186-plan-review.md`에 옮긴다(현재 대기).
