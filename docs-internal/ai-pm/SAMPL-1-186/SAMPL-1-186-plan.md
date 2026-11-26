# SAMPL-1-186 계획 — xlsx 포장 보정

## 목표
내보낸 xlsx의 `[Content_Types].xml`이 ZIP 첫 엔트리이고 `binary.macroEnabled.main` 선언이 없다. 흙토람이 이 파일을 받는다.

## 범위
- `HeuktoramManager.finalizeXlsxPackage(arrayBuffer)`: JSZip으로 읽어 CT를 맨 앞에 두고 bin Default 한 줄을 정규식으로 삭제한 뒤 재생성한다. 나머지 엔트리는 상대 순서·내용을 유지한다.
- `exportToHeuktoram`, `exportToGongik`: `injectDataValidations` 결과를 `finalizeXlsxPackage`에 통과시킨다.
- 사후 재검증: 결과를 다시 읽어 첫 엔트리가 CT가 아니거나 선언이 남았으면 throw → 기존 catch가 오류 토스트를 낸다.
- JSZip이 없거나 CT가 없으면 throw(조용한 통과 금지). 선언이 원래 없으면 통과.

## 비범위
- `injectDataValidations`의 동작 변경, 다른 `XLSX.write` 21곳, 의존성·스타일 변경.

## 변경 파일
`src/heuktoram/heuktoram-script.js`, `tests/unit/heuktoram-soil-form.test.js`, `docs/`(빌드 산출물), 이 문서들.

## 테스트 전략
- 실제 SheetJS 출력을 만들어 CT 첫 엔트리·bin 선언 부재·bin 한 줄 외 바이트 동일·나머지 순서 유지를 검사.
- 검증 목록이 비어 재압축이 없는 경로, 데이터 검증 주입 경로, JSZip/CT 부재 throw, 두 내보내기가 보정을 거치는지(소스 연결).
- 사후 재검증 throw 분기를 직접 깬다(JSZip 결과를 되돌리는 목). 변이(보정 끔·순서 끔·호출부 제거·throw 제거)로 테스트가 실제로 실패함을 확인.
- `npm run test:unit`, `typecheck`, `build`, `check:docs`.

## 리스크
- 소유자 업로드로만 최종 확인 가능(구조 일치는 V11과 바이트 대조로 갈음).
- SheetJS 업그레이드로 출력이 바뀌면 전제 테스트가 알린다.
- 재압축은 STORE로 V11과 같다. 압축 방식 변경 시 별도 확인 필요.
