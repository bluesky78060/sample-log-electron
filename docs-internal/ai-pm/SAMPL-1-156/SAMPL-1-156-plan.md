# SAMPL-1-156 실행 계획

## 0단계 — 메인의 배선 순서 확인 (먼저)
`soil-script.js`에서 모달 배선과 접수 등록 버튼 배선의 순서를 확인한다. soil과 같은 위험(조회 기능 예외가 등록을 죽임)이 있는지 실측하고, 있든 없든 try/catch로 감싼다.

## 1단계 — 순수 모듈 `src/soil/crop-search.js`
soil 원본을 그대로 가져온다. `window.CROP_DATA`를 **읽지 않고** 호출부가 인자로 넘긴다.
- `filterCrops(crops, {keyword, category, limit})` → `{items, total, truncated}`
- `categoriesOf(crops, categories)` — 넘어온 게 없으면 작물에서 뽑는다
- `normalize(s)` — 연속 공백 축약 + trim + 소문자

## 2단계 — 마크업
- 툴바에 `#cropSearchBtn` 추가 (순서: 작물 · 내보내기 · 저장 · 불러오기 · 가져오기 · 흙토람)
- `#cropModal`의 구 선택 UI 제거 → `crop-copy-hint` + 닫기 버튼만

## 3단계 — 배선 (`soil-script.js`)
```
전체를 try/catch로 감싼다
  실패 시 #cropSearchBtn을 숨긴다 (죽은 버튼을 남기지 않는다)
열 때: 분류 옵션 재생성 + ESC 등록 + 첫 렌더
닫을 때: ESC 해제
행 클릭: navigator.clipboard 존재 확인 → 없으면 사유 토스트, 있으면 복사 후 토스트
```

## 4단계 — 스타일
메인 `style.css`에 `[data-theme="dark"] #cropModal` 규칙이 이미 있다. soil이 추가한 라이트 모드 규칙(`crop-copy-hint` 등)만 보강한다.

## 5단계 — 테스트
- `tests/unit/crop-search.test.js` — soil 원본 이식
- `tests/e2e/soil-crop-search.spec.js` — soil 원본을 메인 셀렉터에 맞춰 조정
- **필수 필드 함정 주의**: 메인 soil 폼도 `purpose`·`date`·`phoneNumber`·`receptionMethod`가 required다. 등록 관련 단정을 넣을 때 이를 채우지 않으면 HTML5 검증에 막혀 **테스트가 잘못된 이유로 통과**한다(SLS-1-223에서 실제로 겪었다)

## 6단계 — 검증
| 검증 | 기대 |
| --- | --- |
| 단위·E2E 신규 | 통과 |
| 기존 단위 · E2E | 회귀 0 |
| 변이: 배선 try/catch 제거 + 예외 주입 | 접수 등록 테스트 실패 |
| 변이: 분류 재생성 제거 | 해당 테스트 실패 |
| `npm run typecheck` · `npm run check:docs` | 통과 |
| 빌드 | 성공, `docs/`를 소스와 함께 커밋 |

## 7단계 — 반영
브랜치 → PR → CI(`typecheck`·`check-docs-assets`) → 머지.

## 하지 않을 것
- 폼의 작물 자동완성 변경
- `src/pesticide/index.html`의 같은 잔해 (별 판단)
- `heavy-metal-script.js`의 죽은 코드 제거 (별 티켓)
