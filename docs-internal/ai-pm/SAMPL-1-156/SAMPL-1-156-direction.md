# SAMPL-1-156 방향 — 작물 검색 모달 이식

- 분류: 기능 이식 (soil → 메인), 우선순위 3
- 원본: `sample-log-soil` 커밋 `c8cf319`(SLS-1-228) + `a1fd708`(SLS-1-229)

## 목표 (Why)
엑셀 서식에 작물명을 적을 때 정확한 이름을 찾는 창구가 없다. `CROP_DATA`에는 `벼(일반답)`·`벼(염해답-숙답)`·`보리(중북부)`·`보리(남부)`처럼 미리 보지 않으면 무엇을 골라야 할지 모르는 이름이 많고, "벼"라고만 적으면 가져오기 매칭이 어긋난다.

## 사용자 (Who)
봉화군 농업기술센터 담당자. 엑셀 서식을 작성해 일괄 가져오기를 하는 경우.

## 범위 (What)

**새로 만드는 것이 아니라 되살리는 것이다.** 메인 `src/soil/index.html`에 `#cropModal` 마크업이 이미 있고 여는 코드만 없다 — soil이 이식 전에 있던 상태와 같다.

다만 메인의 잔해는 **구 다중선택 UI**다(`selected-section`·`#selectedCropCount`·`#selectedCropTags`·`#clearCropSelection`·`#confirmCropSelection`). soil은 이 선택/확정 UI를 제거하고 **행 클릭 → 클립보드 복사**로 바꿨다. 대상이 앱 밖(엑셀)이라 폼에 채우는 것보다 이쪽이 맞다.

| 파일 | 내용 |
| --- | --- |
| `src/soil/crop-search.js` | 신규 순수 모듈 (`window.CropSearch`) |
| `src/soil/index.html` | 툴바 버튼 + 모달 마크업 교체 |
| `src/soil/soil-entry.js` | import |
| `src/soil/soil-script.js` | 배선 |
| `src/style.css` | 라이트 모드 보강 (다크는 이미 있다) |
| 테스트 2종 | 단위 + E2E |

## 제약
- **조회 전용이다.** 폼의 작물 자동완성은 건드리지 않는다
- `crop-data-loader.js`가 런타임에 `CROP_DATA`·`CROP_CATEGORIES`를 **둘 다** 교체한다 → 로드 시점 캡처 금지
- main 필수 CI: `typecheck` · `check-docs-assets`. `docs/`를 소스와 함께 커밋한다
- main 직접 푸시 차단 → 브랜치 + PR

## 리스크 — 원본이 값비싸게 배운 것

원본 커밋이 "이 티켓의 1순위는 기능이 아니라 깨뜨리지 않는 것이었다"고 적었다. 모달 배선이 접수 등록 버튼 배선보다 **먼저** 실행되고 그 사이에 try/catch가 없으면, `BaseSampleManager.init()`의 전체 try/catch가 예외를 삼켜 **조회 기능 하나 때문에 접수 등록이 아무 소리 없이 죽는다.**

메인의 배선 순서가 soil과 같은지 먼저 확인하고, 같든 아니든 **배선 전체를 try/catch로 감싸고 실패 시 버튼을 숨긴다.**

그 밖에 이식할 교훈: ESC 핸들러 열 때 등록·닫을 때 해제 / 분류 옵션은 열 때마다 재생성 / 검색 로직은 목록을 인자로 / `clipboard` 부재는 동기 예외라 먼저 막기 / `total`은 자르기 전 수 / 공백 정규화는 축약이지 제거가 아님.

## 검증
- 단위: 검색·필터·`total` vs `truncated`·공백 정규화·분류 폴백
- E2E: 열기·검색·필터·복사·ESC·오버레이 닫기
- **변이**: 배선 실패가 접수 등록을 죽이지 않음을 실증
- 기존 회귀 0 / `typecheck`·`check:docs` 통과

## 방향 확정
플랜 리뷰는 **생략한다**(사용자 지시, 코드 이식). 코드 리뷰와 적대적 검증은 생략하지 않는다.
