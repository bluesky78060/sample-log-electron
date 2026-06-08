# L2 듀얼 스토리지 데이터 유실 방지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Firebase 활성화 환경에서 미업로드 로컬 항목이 무병합 덮어쓰기로 유실되는 P0 경로를 차단하고, 클라우드 동기화 실패를 사용자에게 알리고 자동 재시도한다.

**Architecture:** 순수 병합 함수 `mergeCloudData`를 `sync-utils.js`에 추가(단위 테스트 가능)하고, `BaseSampleManager.loadYearData()`의 덮어쓰기를 병합으로 교체한다. `saveLogs()`/`deleteSample()`의 fire-and-forget 경로에 실패 감지(`batchSave`는 throw가 아닌 `false` 반환) + 토스트 알림 + `online` 이벤트 1회 자동 재시도를 추가한다.

**Tech Stack:** Vanilla JS (window.* 전역 모듈), Firebase compat SDK, node:test (신규 단위 테스트), Playwright (기존 E2E 회귀)

---

## 배경: 확정된 결함 (2026-06-08 코드 추적)

| ID | 위치 | 결함 | 심각도 |
|----|------|------|--------|
| D1 | `src/shared/BaseSampleManager.js:302-316` | `loadYearData()`가 Firebase 데이터 존재 시 smartMerge 없이 `this.sampleLogs = firebaseLogs` + localStorage 통째 덮어쓰기 → **오프라인 작성분 유실** | 🔴 P0 |
| D2 | `src/shared/BaseSampleManager.js:242-247` | `batchSave()`는 실패 시 `false` 반환(throw 안 함)인데 `.then()`이 성공으로 간주 → `.catch()`는 dead code, 실패해도 "동기화 완료" 로그 | 🟠 P1 |
| D3 | `src/shared/BaseSampleManager.js:274-278` | `deleteSample()`의 Firebase 삭제도 D2와 동일 패턴 — 실패 시 클라우드 잔존 → 다음 병합에서 항목 부활 | 🟠 P1 |

**안전 확인된 경로 (수정 불필요):**
- `syncWithCloud()` (`BaseSampleManager.js:383-432`): 이미 smartMerge 사용 + 빈 배열 가드(`:402`)
- `sync-utils.js:126`의 syncedAt 기반 삭제: `syncedAt`은 Firestore 서버에서만 기록(`firestore-db.js:106,304`)되므로 업로드 실패 항목엔 절대 없음 → 의도대로 동작
- `storage-manager.js`의 `save/load/subscribe`: 5개 시료 스크립트에서 직접 호출 0건 (grep 확인) → 이번 범위 제외, 후속 정리 과제

**범위 제외 (후속 과제로 기록):**
- 삭제 실패 대기 큐 (pendingDeletes): 삭제 실패 → 항목 부활은 유실이 아닌 중복 표시라 위험도 낮음. 토스트 알림으로 충분
- `storage-manager.js` dead code 정리
- isElectron 직접 분기 40+곳의 file-api 일원화 (L2 트레이스의 별도 항목)

---

## File Structure

| 파일 | 작업 | 책임 |
|------|------|------|
| `src/shared/sync-utils.js` | Modify | 순수 병합 함수 `mergeCloudData` 추가 + Node 듀얼 export (단위 테스트 가능하게) |
| `src/shared/BaseSampleManager.js` | Modify | `loadYearData` 병합 적용, `saveLogs`/`deleteSample` 실패 감지, `_handleCloudSyncFailure` 신설 |
| `tests/unit/sync-utils.test.js` | Create | node:test 단위 테스트 (3 케이스) |
| `package.json` | Modify | `test:unit` 스크립트 추가 |

---

### Task 0: AI PM 티켓 발행

- [ ] **Step 1: 티켓 생성 및 작업 시작**

```text
mcp__ai-pm__create_task(
  epic_id="b0b0e282-9c1d-41ad-986d-3d347077e6a5",  # General
  title="L2 듀얼 스토리지 데이터 유실 방지 — loadYearData 병합 + 동기화 실패 처리"
)
mcp__ai-pm__smart_workflow(task_id, 'start_work')
```

---

### Task 1: `mergeCloudData` 순수 함수 (TDD)

**Files:**
- Test: `tests/unit/sync-utils.test.js` (Create)
- Modify: `src/shared/sync-utils.js:149-158` (export 블록), 함수 추가
- Modify: `package.json` (scripts)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/sync-utils.test.js` 생성:

```javascript
/**
 * sync-utils.js 단위 테스트 (node:test)
 * 실행: npm run test:unit
 */
const { test } = require('node:test');
const assert = require('node:assert');
const SyncUtils = require('../../src/shared/sync-utils.js');

test('미업로드 로컬 항목(syncedAt 없음)은 병합 후 보존되고 localOnly로 보고된다', () => {
    const local = [
        { id: 'a', receptionNumber: '1', syncedAt: '2026-06-01T00:00:00Z' },
        { id: 'b', receptionNumber: '2' }  // 오프라인 작성분 — syncedAt 없음
    ];
    const cloud = [
        { id: 'a', receptionNumber: '1', syncedAt: { seconds: 1780000000 } }
    ];
    const result = SyncUtils.mergeCloudData(local, cloud);
    assert.strictEqual(result.data.length, 2, '미업로드 항목이 보존되어야 함');
    assert.strictEqual(result.localOnly.length, 1);
    assert.strictEqual(result.localOnly[0].id, 'b');
});

test('동기화된 적 있는 로컬 항목이 클라우드에 없으면 삭제된다 (기존 의도 회귀 확인)', () => {
    const local = [
        { id: 'a', receptionNumber: '1', syncedAt: '2026-06-01T00:00:00Z' },
        { id: 'b', receptionNumber: '2', syncedAt: '2026-06-01T00:00:00Z' }  // 다른 기기에서 삭제됨
    ];
    const cloud = [{ id: 'a', receptionNumber: '1' }];
    const result = SyncUtils.mergeCloudData(local, cloud);
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.deleted, 1);
    assert.strictEqual(result.localOnly.length, 0);
});

test('updatedAt이 더 최신인 쪽이 이긴다', () => {
    const local = [{ id: 'a', receptionNumber: '1', name: '로컬수정', updatedAt: 2000 }];
    const cloud = [{ id: 'a', receptionNumber: '1', name: '클라우드구버전', updatedAt: 1000 }];
    const result = SyncUtils.mergeCloudData(local, cloud);
    assert.strictEqual(result.data[0].name, '로컬수정');

    const result2 = SyncUtils.mergeCloudData(
        [{ id: 'a', receptionNumber: '1', name: '로컬구버전', updatedAt: 1000 }],
        [{ id: 'a', receptionNumber: '1', name: '클라우드수정', updatedAt: 2000 }]
    );
    assert.strictEqual(result2.data[0].name, '클라우드수정');
});
```

`package.json`의 `"scripts"`에 추가 (기존 `"test"` 항목 바로 아래):

```json
"test:unit": "node --test tests/unit/",
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:unit`
Expected: FAIL — `window is not defined` (sync-utils.js가 Node에서 로드 불가) 또는 `mergeCloudData is not a function`

- [ ] **Step 3: sync-utils.js에 함수 추가 + 듀얼 export**

`src/shared/sync-utils.js`의 `smartMerge` 함수 정의 끝(146행 `}` 다음)에 추가:

```javascript
/**
 * 클라우드 로드 시 안전 병합 — smartMerge 결과에 로컬 전용(미업로드) 항목 목록을 추가로 반환
 * loadYearData의 무병합 덮어쓰기(데이터 유실)를 대체하기 위한 함수
 * @param {Array} localData - 로컬 데이터 배열
 * @param {Array} cloudData - 클라우드 데이터 배열
 * @returns {Object} { data, hasChanges, updated, added, deleted, localOnly }
 *   localOnly: 클라우드에 없어서 재업로드가 필요한 로컬 항목 배열
 */
function mergeCloudData(localData, cloudData) {
    const result = smartMerge(localData, cloudData);

    const cloudIds = new Set();
    (cloudData || []).forEach(item => {
        const id = getItemId(item);
        if (id) cloudIds.add(id);
    });

    const localOnly = result.data.filter(item => {
        const id = getItemId(item);
        return id && !cloudIds.has(id);
    });

    return { ...result, localOnly };
}
```

기존 export 블록(153-158행)을 다음으로 교체:

```javascript
const SyncUtilsAPI = {
    smartMerge,
    mergeCloudData,
    getTimestamp,
    normalizeId,
    getItemId
};

// 브라우저: window 전역 노출 (기존 패턴 유지)
if (typeof window !== 'undefined') {
    window.SyncUtils = SyncUtilsAPI;
}
// Node (단위 테스트): CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncUtilsAPI;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:unit`
Expected: PASS — 3 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/shared/sync-utils.js tests/unit/sync-utils.test.js package.json
git commit -m "feat: sync-utils에 mergeCloudData 추가 — 클라우드 병합 시 로컬 전용 항목 보존·보고 (L2)"
```

---

### Task 2: 동기화 실패 감지 + 자동 재시도 (`saveLogs`/`deleteSample`)

**Files:**
- Modify: `src/shared/BaseSampleManager.js:34-37` (constructor), `:242-247` (saveLogs), `:274-278` (deleteSample), 신규 메서드 1개

> ⚠️ 핵심: `firestoreDb.batchSave`/`.delete`는 실패 시 **throw하지 않고 `false`를 반환**한다 (`firestore-db.js:111-114, 319-322` 내부 catch). 따라서 `.then(ok => ...)`에서 반환값을 검사해야 한다. 현재 코드의 `.catch()`는 도달 불가능한 dead code다.

- [ ] **Step 1: constructor에 상태 필드 추가**

`src/shared/BaseSampleManager.js` 34-35행 부근(`this.isCloudSyncing = false;` 아래)에 추가:

```javascript
        this._cloudSyncFailed = false;       // L2: 클라우드 동기화 실패 상태 (중복 토스트 방지)
        this._retryCloudSyncHandler = null;  // L2: online 복귀 재시도 리스너 참조
```

- [ ] **Step 2: `_handleCloudSyncFailure` 메서드 추가**

`deleteSample` 메서드 정의가 끝나는 지점(279행 `}` 다음)에 추가:

```javascript
    /**
     * L2: 클라우드 동기화 실패 처리 — 사용자 알림 + 온라인 복귀 시 1회 자동 재시도
     * batchSave/delete는 실패 시 false를 반환하므로 호출부에서 이 메서드를 호출한다.
     */
    _handleCloudSyncFailure() {
        if (this._cloudSyncFailed) return;  // 이미 알림/재시도 대기 중이면 중복 방지
        this._cloudSyncFailed = true;
        this.showToast(
            '클라우드 동기화 실패 — 데이터는 이 컴퓨터에 저장되어 있습니다. 온라인 연결 시 자동 재시도합니다.',
            'error'
        );
        if (!this._retryCloudSyncHandler) {
            this._retryCloudSyncHandler = () => {
                this._retryCloudSyncHandler = null;
                this._cloudSyncFailed = false;
                this.log('🔁 온라인 복귀 — 클라우드 동기화 재시도');
                this.saveLogs();  // localStorage 재기록은 멱등, batchSave 재시도가 목적
            };
            window.addEventListener('online', this._retryCloudSyncHandler, { once: true });
        }
    }
```

- [ ] **Step 3: `saveLogs`의 fire-and-forget 블록 교체**

`src/shared/BaseSampleManager.js:242-247`의 기존 코드:

```javascript
        // Firebase 백그라운드 동기화 (fire-and-forget — Quota 초과 시에도 UI 블로킹 없음)
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.batchSave(this.moduleKey, parseInt(this.selectedYear, 10), this.sampleLogs)
                .then(() => this.log('Firebase 동기화 완료:', this.sampleLogs.length, '건'))
                .catch(err => (window.logger?.error || console.error)('Firebase 동기화 실패:', err));
        }
```

다음으로 교체:

```javascript
        // Firebase 백그라운드 동기화 (UI 비블로킹 — 실패 시 토스트 + online 재시도)
        // 주의: batchSave는 실패 시 throw가 아닌 false 반환 → 반환값 검사 필수
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.batchSave(this.moduleKey, parseInt(this.selectedYear, 10), this.sampleLogs)
                .then(ok => {
                    if (ok) {
                        this._cloudSyncFailed = false;
                        this.log('Firebase 동기화 완료:', this.sampleLogs.length, '건');
                    } else {
                        this._handleCloudSyncFailure();
                    }
                })
                .catch(err => {
                    (window.logger?.error || console.error)('Firebase 동기화 실패:', err);
                    this._handleCloudSyncFailure();
                });
        }
```

- [ ] **Step 4: `deleteSample`의 Firebase 삭제 블록 교체**

`src/shared/BaseSampleManager.js:273-278`의 기존 코드:

```javascript
        // Firebase 삭제 (백그라운드)
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.delete(this.moduleKey, parseInt(this.selectedYear, 10), String(id))
                .then(() => this.log('Firebase 삭제 완료:', id))
                .catch(err => (window.logger?.error || console.error)('Firebase 삭제 실패:', err));
        }
```

다음으로 교체:

```javascript
        // Firebase 삭제 (백그라운드 — 실패 시 다음 병합에서 항목이 부활할 수 있으므로 사용자에게 알림)
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.delete(this.moduleKey, parseInt(this.selectedYear, 10), String(id))
                .then(ok => {
                    if (ok) this.log('Firebase 삭제 완료:', id);
                    else this._handleCloudSyncFailure();
                })
                .catch(err => {
                    (window.logger?.error || console.error)('Firebase 삭제 실패:', err);
                    this._handleCloudSyncFailure();
                });
        }
```

- [ ] **Step 5: 단위 테스트 회귀 확인**

Run: `npm run test:unit`
Expected: PASS — 3 tests passed (Task 1 테스트 영향 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/shared/BaseSampleManager.js
git commit -m "fix: 클라우드 동기화 실패 감지 — batchSave/delete false 반환 검사 + 토스트 + online 재시도 (L2 D2/D3)"
```

---

### Task 3: `loadYearData` 무병합 덮어쓰기 → 안전 병합 (P0)

**Files:**
- Modify: `src/shared/BaseSampleManager.js:302-317`

- [ ] **Step 1: 덮어쓰기 블록을 병합으로 교체**

`src/shared/BaseSampleManager.js:302-317`의 기존 코드:

```javascript
                    if (firebaseLogs && firebaseLogs.length > 0) {
                        this.log(` Firebase 데이터:`, firebaseLogs.length, '건');
                        this.sampleLogs = firebaseLogs;

                        // PER-9: TTL 포함 캐시 저장
                        if (!cacheValid) {
                            // 메모리 누수 방지: 상한 초과 시 가장 오래된 항목 제거(LRU 근사)
                            if (this._firebaseCache.size >= this._firebaseCacheMax && !this._firebaseCache.has(year)) {
                                this._firebaseCache.delete(this._firebaseCache.keys().next().value);
                            }
                            this._firebaseCache.set(year, { data: JSON.parse(JSON.stringify(firebaseLogs)), timestamp: Date.now() });
                        }

                        // Firebase 데이터를 localStorage에 저장 (캐싱)
                        localStorage.setItem(yearStorageKey, JSON.stringify(firebaseLogs));
                        this.log(` Firebase 데이터를 localStorage에 캐싱`);
```

다음으로 교체:

```javascript
                    if (firebaseLogs && firebaseLogs.length > 0) {
                        this.log(` Firebase 데이터:`, firebaseLogs.length, '건');

                        // L2-P0: 무병합 덮어쓰기 금지 — 미업로드 로컬 항목(syncedAt 없음) 보존
                        const localLogs = this.safeParseArray(yearStorageKey);
                        const merged = window.SyncUtils?.mergeCloudData
                            ? window.SyncUtils.mergeCloudData(localLogs, firebaseLogs)
                            : { data: this.smartMerge(localLogs, firebaseLogs), localOnly: [] };
                        this.sampleLogs = merged.data;

                        // PER-9: TTL 포함 캐시 저장 (Firebase 원본 응답 기준 — 병합 결과 아님)
                        if (!cacheValid) {
                            // 메모리 누수 방지: 상한 초과 시 가장 오래된 항목 제거(LRU 근사)
                            if (this._firebaseCache.size >= this._firebaseCacheMax && !this._firebaseCache.has(year)) {
                                this._firebaseCache.delete(this._firebaseCache.keys().next().value);
                            }
                            this._firebaseCache.set(year, { data: JSON.parse(JSON.stringify(firebaseLogs)), timestamp: Date.now() });
                        }

                        // 병합 결과를 localStorage에 저장
                        localStorage.setItem(yearStorageKey, JSON.stringify(merged.data));
                        this.log(` Firebase 데이터를 localStorage에 캐싱 (로컬 전용 ${merged.localOnly.length}건 보존)`);

                        // 보존된 로컬 전용 항목을 클라우드로 재업로드 (전체가 아닌 localOnly만 —
                        // 전체 재업로드 시 모든 문서의 updatedAt이 갱신되어 타 기기 병합을 교란함)
                        if (merged.localOnly.length > 0 && window.firestoreDb?.isEnabled()) {
                            window.firestoreDb.batchSave(this.moduleKey, parseInt(year, 10), merged.localOnly)
                                .then(ok => {
                                    if (ok) this.log(`☁️ 로컬 전용 ${merged.localOnly.length}건 클라우드 업로드 완료`);
                                    else this._handleCloudSyncFailure();
                                })
                                .catch(() => this._handleCloudSyncFailure());
                        }
```

> 주의 1: 마지막 줄 다음의 기존 `} else {` (`:318`) 블록은 그대로 유지한다.
> 주의 2: `merged.data`가 빈 배열이어도 정상 — smartMerge가 syncedAt 있는 항목의 클라우드 삭제를 반영한 결과일 수 있다.
> 주의 3: 캐시(`_firebaseCache`)는 "Firebase 응답 캐시"이므로 병합 결과가 아닌 `firebaseLogs` 원본을 저장한다 (기존 의미 유지).

- [ ] **Step 2: 단위 테스트 + 문법 확인**

Run: `npm run test:unit && node --check src/shared/BaseSampleManager.js && node --check src/shared/sync-utils.js`
Expected: PASS + 문법 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/shared/BaseSampleManager.js
git commit -m "fix: loadYearData 무병합 덮어쓰기 제거 — mergeCloudData로 미업로드 로컬 항목 보존 + 재업로드 (L2 D1/P0)"
```

---

### Task 4: 빌드 + 회귀 테스트 + 수동 QA 시나리오

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 빌드**

Run: `npm run build`
Expected: Tailwind → sync-version → vite build 성공, `docs/` 갱신 (sync-utils.js·BaseSampleManager.js 변경 반영 확인)

- [ ] **Step 2: 기존 E2E 회귀**

Run: `npm test`
Expected: 기존 Playwright 테스트 전체 PASS (docs/ 대상)

- [ ] **Step 3: 수동 QA — P0 유실 시나리오 재현 불가 확인**

Electron 앱(`npm run start:dev`) 또는 `npm run dev`에서:

1. Firebase 동기화 활성 상태에서 시료(예: 토양) 1건 등록 → 클라우드 반영 확인
2. DevTools → Network → Offline 전환
3. 시료 1건 추가 등록 (localStorage에만 저장, 동기화 실패 토스트 표시 확인 ← Task 2)
4. Offline 유지한 채 페이지 새로고침 → **오프라인 등록분이 목록에 남아있는지 확인** (수정 전엔 Firebase 캐시/IndexedDB 상태에 따라 소멸)
5. Online 복원 → 자동 재시도 로그 확인 (`🔁 온라인 복귀`) → Firestore 콘솔에서 해당 항목 업로드 확인
6. 다른 브라우저/기기에서 같은 연도 열기 → 항목 보이는지 확인

- [ ] **Step 4: AI PM 테스트 제출**

```text
mcp__ai-pm__smart_workflow(task_id, 'submit_test', test_results=[
  { type: 'build', passed: true, output: '<npm run build 실제 출력>' },
  { type: 'unit',  passed: true, output: '<npm run test:unit 실제 출력>' },
  { type: 'e2e',   passed: true, output: '<npm test 실제 출력>' }
])
```

---

### Task 5: 코드 리뷰 + 마무리

- [ ] **Step 1: 코드 리뷰** — `code-reviewer` 에이전트로 diff 리뷰 (자기 승인 금지). 중점: 병합 경로의 빈 배열/null 처리, online 리스너 누수, 캐시 의미 보존

- [ ] **Step 2: 리뷰 통과 시 승인**

```text
mcp__ai-pm__smart_workflow(task_id, 'approve_review', notes='🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: N건 / 🔵 SUGGESTION: N건 → 판정: APPROVED')
```

- [ ] **Step 3: 테스트 프로젝트 동기화** — `sample-log-electron-test/project`에 `sync-utils.js`·`BaseSampleManager.js` 복사. ⚠️ sync-rule 준수: 암호화 코드(`encryption-manager.js` 등) 덮어쓰기 금지, `STORAGE_KEY`의 `test_` 접두사 보존 (BaseSampleManager/sync-utils는 접두사 무관이므로 단순 복사 가능하나 복사 후 diff로 암호화 관련 패치 유무 확인)

- [ ] **Step 4: 후속 과제 백로그 기록** — 삭제 실패 대기 큐, storage-manager.js dead code 정리, isElectron 분기 일원화를 메모리/티켓에 기록

---

## Self-Review 결과

- ✅ 스펙 커버리지: D1(Task 3), D2(Task 2 Step 3), D3(Task 2 Step 4), 유실 항목 재업로드(Task 3), 사용자 알림+재시도(Task 2) 모두 태스크 존재
- ✅ 플레이스홀더 없음 — 모든 코드 블록 실제 내용 포함
- ✅ 타입/이름 일관성: `mergeCloudData`(Task 1 정의 → Task 3 사용), `_handleCloudSyncFailure`(Task 2 정의 → Task 2·3 사용), `localOnly` 필드 일관
- ✅ 순서 의존성: Task 1(함수 정의) → Task 2(실패 핸들러 정의) → Task 3(둘 다 사용) 순서 보장
