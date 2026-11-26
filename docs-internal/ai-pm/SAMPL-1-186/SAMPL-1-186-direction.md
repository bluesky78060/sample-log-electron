# SAMPL-1-186 방향 — 흙토람 내보내기 xlsx 업로드 거부 수정

- 분류: 버그 수정(외부 연동). 운영 영향 큼 — 흙토람 내보내기가 현재 업로드 불가
- 규모: `heuktoram-script.js`에 후처리 메서드 1개 + 호출부 2곳

## 목표 (Why)
앱이 내보낸 흙토람 xlsx를 흙토람에 올리면 「변조된 확장자 또는 허용되지 않은 확장자 입니다」로 거부된다.

## 사용자 (Who)
흙토람에 시료 검정 정보를 올리는 농업기술센터 담당자.

## 근거 (실측)
- 소유자가 실제 흙토람 업로드로 확인했다: 통과 — 흙토람 원본 구조에 값만 채운 D0, 앱 파일을 엑셀식 포장으로 고친 V7, 그리고 V11(앱 파일에서 `[Content_Types].xml`을 ZIP 맨 앞으로 + xlsb `Default Extension="bin"` 한 줄 삭제). 실패 — 앱 원본 출력, 그 줄만 지운 파일.
- 값·파일명·시료번호는 원인이 아니다.
- V11이 최소 수정이라 **소유자가 채택**했다(V10 순서+CT 전체 정리도 통과했으나 V11이 더 작다).
- 조사 보고서(다른 작업 공간 heuktoram-xlsx-diff): `/private/tmp/claude-501/-Users-leechanhee-orca-workspaces-sample-log-electron-heuktoram-xlsx-diff/c0090462-ce42-41fc-b4b9-27518069de26/scratchpad/heuktoram-bisect-report.md`, `/private/tmp/claude-501/-Users-leechanhee-orca-workspaces-sample-log-electron-heuktoram-xlsx-diff/c0090462-ce42-41fc-b4b9-27518069de26/scratchpad/heuktoram-xlsx-diff-report.md` (`/tmp` 하위라 휘발성)

## 범위 (What)
SheetJS(xlsx-js-style) 출력 후처리에서 위 두 가지를 항상 적용. 흙토람·공익직불제 내보내기가 같은 경로를 쓴다.

## 범위 밖
`src/`의 다른 `XLSX.write`/`writeFile` 21곳 — 같은 문제가 있을 수 있으나 이 티켓에서 건드리지 않는다.

## 제약·리스크
- 두 조건은 함께 필요하다(하나만 고치면 거부). 하나라도 어긋나면 조용히 통과시키지 않고 내보내기를 멈춘다.
- 실제 흙토람 통과는 소유자가 새로 내보낸 파일로만 확인할 수 있다 — 단위 테스트는 포장 구조까지만 증명한다.

## 방향 확정
위 두 사실을 인용해 확정한다: (1) 소유자의 업로드 시험으로 V11 통과 확인·최소 수정 채택, (2) 소유자가 「계획·검토 산출물을 간단히 만들어 통과」를 승인했다. 이 외의 승인은 받지 않았다. 플랜 리뷰는 작성자가 할 수 없어 리뷰 봇 검토 결과를 `SAMPL-1-186-plan-review.md`에 그대로 옮긴다(현재 대기).
