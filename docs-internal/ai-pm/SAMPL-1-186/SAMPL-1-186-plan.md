# SAMPL-1-186 계획 — xlsx 포장 보정

## 목표
내보낸 xlsx의 `[Content_Types].xml`이 ZIP 첫 엔트리이고 `binary.macroEnabled.main` 선언이 없다. 소유자가 새로 내보낸 파일을 흙토람에 올려 거부가 사라지는 것이 최종 확인이다(시험 근거와 미확인 사항은 direction 문서).

## 범위
- `HeuktoramManager.finalizeXlsxPackage(arrayBuffer)`: JSZip으로 읽어 CT를 맨 앞에 두고 bin Default 한 줄을 정규식으로 삭제한 뒤 재생성한다.
- `exportToHeuktoram`, `exportToGongik`: `injectDataValidations` 결과를 `finalizeXlsxPackage`에 통과시킨다.
- 사후 재검증: 결과를 다시 읽어 첫 엔트리가 CT가 아니거나 선언이 남았으면 throw → 기존 catch가 오류 토스트를 낸다. JSZip·CT 부재도 throw. 선언이 원래 없으면 통과.

## 비범위
- `injectDataValidations` 동작 변경, 의존성·스타일 변경.
- 다른 SheetJS 내보내기 14곳(`git grep -I -n -E 'XLSX\.(write|writeFile)[[:space:]]*\(' HEAD -- src` 전체 16곳 − 흙토람 2곳). 같은 문제가 있을 수 있으나 호환성은 미검증 위험으로 남긴다.

## 변경 파일
`src/heuktoram/heuktoram-script.js`, `tests/unit/heuktoram-soil-form.test.js`, `docs/`(빌드 산출물), 이 문서들, `.claude/active-ticket`.

## 보존 계약
CT를 제외한 **비압축(STORE) 엔트리 payload는 그대로 보존**하고, CT에서는 해당 Default 한 줄만 제거한다. ZIP 엔트리 날짜·헤더·압축 메타데이터는 JSZip 재생성으로 바뀌며 보존하지 않는다. 이 계약은 현재 시료(SheetJS가 STORE로 쓰는 출력)에 대해서만 검증한다. 테스트는 엔트리 문자열 내용을 비교하며 V11과의 바이트 일치를 주장하지 않는다(대조 결과는 구조·선언 수준).

## 수락 기준
1. 단위 테스트·`typecheck`·`build`·`check:docs` 통과.
2. **docs 운영 설정 보존(P1)**: 실제 배포 환경의 `src/shared/network-config.js`(gitignore 대상, 소유자 로컬 저장소에 있음)로 빌드한다. 예제(`network-config.example.js`)로 빌드한 공유 번들을 머지하지 않는다. 확인 — 값만 비교하고 키는 출력하지 않는다:
   `git grep -h -o 'ALLOWED_GATEWAY:"[^"]*"' <부모> -- docs/assets` 와 `grep -h -o 'ALLOWED_GATEWAY:"[^"]*"' docs/assets/*.js` 가 같다.
3. **부모 대비 비범위 의미 변경 없음**: 부모 커밋을 같은 설정으로 다시 빌드해 해시를 정규화(`name-HASH.js`)하고 번들·HTML을 비교한다. 차이는 흙토람 번들(`heuktoram`)뿐이어야 하며, 청크 이름 이동(예: `theme`→`logger`)은 부모 산출물과 재빌드의 알려진 차이로 따로 적는다.
4. docs 변경은 이 커밋의 변경 범위와 빌드 산출물로만 한정한다(`manual` 날짜 배지 등 sync-version 부산물은 원복).
5. 변이 확인: 보정 끔·순서 끔·호출부 제거·재검증의 순서/bin 판정을 각각 제거하면 해당 테스트가 실패한다.

## 리스크
- 소유자 업로드로만 최종 확인 가능. 서버 판별 규칙은 미확인이며 CT 단독·bin 단독 변경의 효과는 시험된 적 없다.
- 서버 규칙이나 SheetJS 출력이 바뀌면 효과가 달라질 수 있다(전제 테스트가 SheetJS 쪽 변화는 알린다).
- 재압축은 STORE라 V11과 같다. 압축 방식이 바뀌면 별도 확인이 필요하다.
- 예제 설정으로 빌드하면 웹 배포 사용자의 Firebase 동기화가 막힌다(수락 기준 2가 막는다).
