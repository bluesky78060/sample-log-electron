# SAMPL-1-153 실행 계획 — 성토 시퀀스 채번 수정

## 설계 방향

운영 코드이므로 모달을 전면 재구성하지 않는다. 대신 **결함이 있는 계산 로직만 모듈 레벨 순수 함수로 끌어내고** 모달 메서드는 그것에 위임한다. 이유:

1. 결함이 새어나간 근본 원인은 이 로직이 **모달 상태에 묶여 단위 테스트가 불가능**했다는 것이다. 고치기만 하고 테스트를 못 만들면 같은 일이 반복된다.
2. 기존 `soil-result-importer.js`는 이미 자동매핑 로직을 모듈 레벨 순수 함수로 두고 `instance._fns`로 노출해 단위 테스트한다(`tests/unit/soil-result-importer.test.js`). **같은 패턴을 따른다** — 새 구조를 도입하는 것이 아니다.
3. 테스트 프로젝트(`4fbce64`)에서 이미 검증된 설계를 이식한다.

## 1단계 — 매니저 채번 분기 (`src/soil/soil-script.js`)

`addImportedRecord` `:853-856`:

```js
const isFill = src.subCategory === '성토';
const receptionNumber = (src.receptionNumber != null && String(src.receptionNumber).trim() !== '')
    ? String(src.receptionNumber).trim()
    : (isFill
        ? this.generateNextFillReceptionNumber(landClass1)
        : String(this.getNextNumberForClass(this.selectedYear, landClass1)));
```

`generateNextFillReceptionNumber`는 이미 존재하며 `F{n}` 문자열을 반환한다(`:814`).

## 2단계 — 기존 번호 풀에 성토 분기 (`soil-result-importer.js`)

`_existingNumbers(landClass1)`를 모듈 레벨 순수 함수 + 얇은 래퍼로 분리한다.

```js
// 모듈 레벨 (순수, _fns로 노출)
function collectExistingNumbers(logs, landClass1, opts) {
    const fill = !!(opts && opts.fill);
    const set = new Set();
    for (const log of (logs || [])) {
        if (!log || !log.receptionNumber) continue;
        if ((log.landClass1 || LAND_CLASS1_DEFAULT) !== landClass1) continue;
        if (fill !== (log.subCategory === '성토')) continue;   // 두 시퀀스 상호 배제
        const base = String(log.receptionNumber).split('-')[0].trim();
        if (!fill && base.startsWith('F')) continue;
        set.add(fill ? base.replace('F', '') : base);
    }
    return set;
}
```

**`window.ReceptionNumber.computeNextNumber`와 한 줄씩 대응**해야 한다 (성토/일반 분리 · 경지구분 범위 · 본번 추출 · 일반 풀 F 제외 · 성토 풀 F 제거).

메서드는 로그 수집만 담당:
```js
_existingLogs() { /* window.soilManager.sampleLogs 또는 localStorage 폴백 */ }
_existingNumbers(landClass1, opts) { return collectExistingNumbers(this._existingLogs(), landClass1, opts); }
```

## 3단계 — 행별 성토 채번 (`_recompute`)

행 단위 번호 결정 로직을 순수 함수 `assignReceptionNumbers(opts)`로 끌어낸다. 입력은 전부 인자로 받는다(rows, mapping, landClass1, autoNumber, dupPolicy, existing, nextNumber, existingFill, nextFillNumber).

핵심 변경:
- 행별 `isFill = rec.subCategory === '성토'`
- 성토 커서(`nextFill`)와 일반 커서(`nextNum`)를 **독립**으로 둔다
- 배치 내 중복 추적 집합도 **독립**으로 둔다 (일반 5와 성토 F5는 충돌이 아니다)
- 자동부여 시 성토는 `F{n}`, 일반은 `{n}`
- 수동 번호는 해당 시퀀스 풀로 중복 판정하고(성토는 `F` 제거 후 숫자 비교) **저장될 번호만큼 그 시퀀스 커서를 올린다**

`_recompute`는 매니저에서 두 시작 번호를 조회해 넘긴다:
```js
nextNumber     = mgr.getNextNumberForClass(year, landClass1)
nextFillNumber = parseInt(mgr.generateNextFillReceptionNumber(landClass1).replace('F',''), 10)
```

## 4단계 — 단위 테스트 (`tests/unit/soil-result-importer.test.js` 확장)

`instance._fns`에 `collectExistingNumbers`, `assignReceptionNumbers`를 추가 노출하고 테스트한다. 테스트 프로젝트의 55건 중 채번·성토 관련을 이식한다.

| 그룹 | 케이스 |
| --- | --- |
| `collectExistingNumbers` 일반 | 경지구분 범위 / 서브넘버 본번 접기 / 성토·F접두 제외 / 숫자형 |
| `collectExistingNumbers` 성토 | `fill=true`가 성토만 모으고 F 제거 / 두 시퀀스 상호 배제 |
| 성토 채번 | 성토 3행 → `F1,F2,F3` / 일반·성토 혼재 → 각자 시퀀스 / 기존 성토 번호 건너뛰기 / 일반 5와 성토 F5 비충돌 / 성토 수동번호 중복 판정 / 성토 수동번호가 성토 커서만 올림 |
| 회귀 | 빈 칸 자동부여가 `'null'`이 되지 않음(SAMPL-1-151과 겹침) / 수동 번호 저장 시 커서 상향 |

## 5단계 — E2E 회귀 (`tests/e2e/soil-importer.spec.js` 신규)

테스트 프로젝트에서 결함을 실제로 잡은 단정 방식을 이식한다. **메모리 배열만 보면 이 결함을 못 잡는다**:

- `readPersisted()` — `page.reload()` → `localStorage` 파싱
- `expectUniqueReceptionNumbers()` — 빈값·`'null'`·중복 단정
- 정확 일치 단정 (`toEqual(['F1','F2','F3'])`)
- 기존 레코드 시드 케이스 (빈 저장소에서만 통과하는 사각지대 제거)

## 6단계 — 검증 (통과 조건)

| 검증 | 기대 |
| --- | --- |
| 3개 시나리오 미리보기 = 실제 저장 | 일치, 중복 0 |
| 단위 테스트 | 신규 포함 전원 통과 |
| E2E | 신규 포함 전원 통과 |
| **변이 검증** | 매니저 성토 분기 제거 시 테스트 실패 |
| `npm run typecheck` | 통과 (main 필수 CI) |
| `npm run check:docs` | 누락 0건 (main 필수 CI) |
| `npm run build` | 성공, `docs/`를 소스와 함께 커밋 |
| 기존 E2E 210건 | 회귀 없음 |

## 7단계 — 반영
브랜치 → PR → CI(`check-docs-assets`, `typecheck`) 통과 → 머지. main 직접 푸시는 차단돼 있다.

## 하지 않을 것
- 모달 UI/스타일 변경
- 서브넘버 행 중복 판정 문제(SAMPL-1-154) — 별 티켓
- upsert·배치 저장(SAMPL-1-152 상당) — 별 티켓
- 미리보기 `'null'` 결함(SAMPL-1-151) — 이번 리팩터링으로 같은 코드 경로를 건드리므로 **함께 고쳐지면 그 사실을 기록**하고, 아니면 손대지 않는다
