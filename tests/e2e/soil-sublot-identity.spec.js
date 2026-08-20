// @ts-check
// SAMPL-1-159: 하위필지 선택 — [object Object] 표시와 선택 복원 실패
//
// `getSubLotOptions`가 `<option value>`에 하위필지 **원소를 통째로** 넣었다.
// 신규 데이터에서 원소는 `{lotAddress, crops}` 객체이므로 `value="[object Object]"`가 됐고,
// 선택하면 DOM에서 온 **문자열**이 저장되는데 비교는 문자열 vs 객체라 영원히 거짓이었다.
// → 화면에 `[object Object]`가 보이고, 고른 선택이 다시 열 때 풀렸다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

const SELECT = '#cropAreaList select[id^="sublot-select-"]';

async function openSoil(page) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto('/soil/');
    expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    await page.waitForFunction(
        () => !!window.soilManager && !!window.SubLotIdentity,
        { timeout: 15000 }
    );
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        'docs/의 APP_VERSION이 package.json과 다르다 — ' +
        '(1) `npm run build`를 잊었거나 (2) 다른 프로젝트의 docs/를 검증하고 있다'
    ).toBe(EXPECTED_VERSION);
}

/** 하위필지를 가진 필지를 세우고 작물 모달을 연다 */
async function openCropModal(page, subLots, crops) {
    return page.evaluate(([lots, cs]) => {
        const mgr = /** @type {any} */ (window).soilManager;
        mgr.parcels = [{ id: 'p1', lotAddress: '문단리 224', subLots: lots, crops: cs }];
        mgr.currentSubLotParcelId = null;
        mgr.currentSubLotIndex = null;
        mgr.openCropAreaModal('p1');
        const sel = /** @type {HTMLSelectElement|null} */ (
            document.querySelector('#cropAreaList select[id^="sublot-select-"]')
        );
        return {
            hasSelect: !!sel,
            options: sel ? [...sel.options].map((o) => ({ value: o.value, text: o.textContent.trim() })) : [],
            selected: sel ? sel.value : null,
            targets: mgr.tempCropAreas.map((c) => c.subLotTarget),
        };
    }, [subLots, crops]);
}

test.describe('하위필지 선택 (SAMPL-1-159)', () => {
    // 🚨 이 티켓의 증상 그대로.
    test('객체 하위필지가 [object Object]로 보이지 않는다', async ({ page }) => {
        await openSoil(page);
        const out = await openCropModal(
            page,
            [{ lotAddress: '문단리 225', crops: [] }, { lotAddress: '문단리 226', crops: [] }],
            [{ name: '고추', area: '100', unit: 'm2' }]
        );

        expect(out.hasSelect, '하위필지 선택이 렌더되지 않아 검증이 무의미하다').toBe(true);
        const dump = JSON.stringify(out.options);
        expect(dump, `[object Object]가 보인다: ${dump}`).not.toContain('[object Object]');
        expect(out.options.map((o) => o.value)).toEqual(['all', '문단리 225', '문단리 226']);
        expect(out.options[1].text).toBe('하위 1: 문단리 225');
    });

    // 🚨 두 번째 증상. 고르고 저장했는데 다시 열면 풀렸다.
    test('고른 하위필지가 저장 후 다시 열 때 선택돼 있다', async ({ page }) => {
        await openSoil(page);
        await openCropModal(
            page,
            [{ lotAddress: '문단리 225', crops: [] }, { lotAddress: '문단리 226', crops: [] }],
            [{ name: '고추', area: '100', unit: 'm2' }]
        );

        // 두 번째 하위필지를 고르고 확정한다
        await page.locator(SELECT).selectOption('문단리 226');
        // ⚠️ SAMPL-1-161부터 배정은 꼬리표가 아니라 **실제 이동**이다.
        //    선택이 저장됐다는 증거는 `crops[].subLotTarget`이 아니라
        //    그 작물이 해당 하위필지 안에 있다는 것이다 (엑셀·목록·흙토람이 그것을 읽는다).
        const saved = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.confirmCropArea();
            const p = mgr.parcels[0];
            return {
                own: p.crops.map((c) => c.name),
                lot226: p.subLots[1].crops.map((c) => c.name),
            };
        });
        expect(saved.lot226, '선택이 저장되지 않았다').toEqual(['고추']);
        expect(saved.own, '배정했는데 상위 필지에 그대로 남았다').toEqual([]);

        // 다시 열면 그 항목이 선택돼 있어야 한다
        const reopened = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.openCropAreaModal('p1');
            const sel = /** @type {HTMLSelectElement|null} */ (
                document.querySelector('#cropAreaList select[id^="sublot-select-"]')
            );
            return sel ? sel.value : null;
        });
        expect(reopened, '다시 열었을 때 선택이 풀렸다').toBe('문단리 226');
    });

    // 구 데이터(문자열)와 신 데이터(객체)가 한 필지에 섞여 있다
    test('문자열·객체 하위필지가 섞여도 둘 다 고를 수 있다', async ({ page }) => {
        await openSoil(page);
        const out = await openCropModal(
            page,
            ['문단리 225', { lotAddress: '문단리 226', crops: [] }],
            [{ name: '고추', area: '100', unit: 'm2' }]
        );
        expect(out.options.map((o) => o.value)).toEqual(['all', '문단리 225', '문단리 226']);
    });

    // 🚨 마이그레이션. 예전 결함이 남긴 쓰레기 값이 실제 레코드에 있다.
    test('저장된 [object Object]는 전체로 정리된다', async ({ page }) => {
        await openSoil(page);
        const out = await openCropModal(
            page,
            [{ lotAddress: '문단리 225', crops: [] }],
            [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '[object Object]' }]
        );
        expect(out.targets, '쓰레기 값이 그대로 남았다').toEqual(['all']);
        expect(out.selected).toBe('all');
    });

    // 하위필지 삭제로 가리킬 대상이 사라진 경우
    test('가리키던 하위필지가 삭제되면 전체로 정리된다', async ({ page }) => {
        await openSoil(page);
        const out = await openCropModal(
            page,
            [{ lotAddress: '문단리 226', crops: [] }],
            [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 225' }]
        );
        expect(out.targets).toEqual(['all']);
    });

    // 🚨 독립 모델 리뷰가 찾은 구체적 피해를 막는 가드.
    //    주소가 키인데 중복을 허용하면, 둘 중 하나를 지웠을 때 그쪽을 가리켰던 작물이
    //    **조용히 남은 쪽으로** 옮겨간다. 입력 시점에 막는다.
    test('같은 주소의 하위필지를 또 추가할 수 없다', async ({ page }) => {
        await openSoil(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 225', crops: [] }], crops: [],
            }];
            // 실제 입력 경로와 같은 판정을 쓴다
            const dup = /** @type {any} */ (window).SubLotIdentity.canAdd('문단리 225', mgr.parcels[0].subLots);
            const ok = /** @type {any} */ (window).SubLotIdentity.canAdd('문단리 226', mgr.parcels[0].subLots);
            return { dup, ok };
        });

        expect(out.dup.ok, '같은 주소가 또 추가된다 — 삭제 시 조용한 오매핑이 생긴다').toBe(false);
        expect(out.dup.reason).toContain('이미 있는');
        expect(out.ok.ok).toBe(true);
    });

    // 🚨 모달을 열지 않고 저장되는 경로. 예전 결함이 남긴 값이 그대로 재저장됐다.
    test('모달을 열지 않아도 저장 직전에 쓰레기 값이 정리된다', async ({ page }) => {
        await openSoil(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 225', crops: [] }],
                crops: [
                    { name: '고추', area: '100', subLotTarget: '[object Object]' },
                    { name: '배추', area: '50', subLotTarget: '없어진주소' },
                ],
            }];
            // 모달을 거치지 않고 저장 경로만 호출한다
            mgr.updateParcelsData();
            const serialized = mgr.parcelsDataInput ? mgr.parcelsDataInput.value : '';
            return {
                targets: mgr.parcels[0].crops.map((c) => c.subLotTarget),
                serializedHasGarbage: serialized.includes('[object Object]'),
            };
        });

        expect(out.targets, '쓰레기 값이 그대로 재저장된다').toEqual(['all', 'all']);
        expect(out.serializedHasGarbage, '직렬화된 데이터에 [object Object]가 남았다').toBe(false);
    });

    // 🚨 코드 리뷰가 찾은 **내가 만든 회귀**의 재현 경로.
    //    분할모드 저장은 `subLots: []`로 기록하면서 `subLotTarget`은 보존한다
    //    (`soil-log-record.js:89-90`). 그룹수정으로 폼을 열면 마지막에
    //    `updateParcelsData()`가 불리는데, 무조건 정리하면 **수정 버튼만 눌렀는데
    //    배정이 통째로 지워진다.** 사용자 조작도 경고도 없다.
    test('분할모드 레코드를 수정하려고 열어도 하위필지 배정이 남는다', async ({ page }) => {
        await openSoil(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            // 분할모드 저장 결과와 같은 형태: subLots는 비었지만 배정은 남아 있다
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [],
                crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 225' }],
            }];
            const before = mgr.parcels[0].crops[0].subLotTarget;
            // 그룹수정이 폼을 채운 뒤 호출하는 것과 같은 저장 경로
            mgr.updateParcelsData();
            return { before, after: mgr.parcels[0].crops[0].subLotTarget };
        });

        expect(out.before).toBe('문단리 225');
        expect(
            out.after,
            '대조할 하위필지가 없다는 이유로 배정을 지웠다 — 분할모드 레코드가 손상된다'
        ).toBe('문단리 225');
    });

    // 🚨 코드 리뷰가 실측으로 지적한 모순.
    //    하위필지 자신의 작물 모달에서도 하위필지 선택이 떴다. 그 작물은 이미 그
    //    하위필지 것인데 **다른 하위필지를 가리키게** 저장할 수 있었고, 화면은 '전체'로
    //    보이는데 상태는 undefined인 불일치까지 있었다.
    test('하위필지 자신의 작물 모달에는 하위필지 선택이 없다', async ({ page }) => {
        await openSoil(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [
                    { lotAddress: '문단리 225', crops: [{ name: '고추', area: '100' }] },
                    { lotAddress: '문단리 226', crops: [] },
                ],
                crops: [],
            }];

            // 하위필지 1의 작물 모달
            mgr.currentParcelIdForCrop = null;
            mgr.openSubLotCropModal('p1', 0);
            const inSubLot = !!document.querySelector('#cropAreaList select[id^="sublot-select-"]');

            // 상위 필지의 작물 모달에서는 여전히 떠야 한다 (기능을 죽이지 않았는지)
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            mgr.openCropAreaModal('p1');
            const inParcel = !!document.querySelector('#cropAreaList select[id^="sublot-select-"]');

            return { inSubLot, inParcel };
        });

        expect(out.inSubLot, '하위필지 모달에서 다른 하위필지를 가리킬 수 있다').toBe(false);
        expect(out.inParcel, '상위 필지 모달의 하위필지 선택이 사라졌다 — 기능을 죽였다').toBe(true);
    });

    // 🚨 적대적 검증의 핵심 지적: **9개 테스트가 전부 통과하는 상태에서 CRITICAL 두 건이
    //    살아 있었다.** 어느 테스트도 등록 버튼을 실제로 클릭하지 않았기 때문이다.
    //
    //    경로: 필지 → 하위필지 2개(**클릭** 추가) → 작물 모달에서 배정 → **등록** → 저장 확인
    test('실제 클릭 경로 — 하위필지 추가·배정·등록이 저장까지 이어진다', async ({ page }) => {
        await openSoil(page);

        // 필수 필드
        await page.evaluate(() => {
            const set = (id, v) => {
                const el = /** @type {any} */ (document.getElementById(id));
                if (el) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }
            };
            set('receptionMethod', '방문');
            set('name', '홍길동');
            set('phoneNumber', '010-1234-5678');
            set('date', '2026-08-20');
            const purpose = /** @type {any} */ (document.getElementById('purpose'));
            if (purpose && purpose.options.length > 1) {
                purpose.selectedIndex = 1;
                purpose.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // 필지 주소 + 첫 작물
        await page.locator('.lot-address-input').first().fill('문단리 224');
        await page.locator('.crop-direct-input').first().fill('고추');
        await page.locator('.area-direct-input').first().fill('100');

        // 하위필지 2개를 **버튼 클릭으로** 추가한다 (canAdd 실경로도 함께 지난다)
        const parcelId = await page.evaluate(() => /** @type {any} */ (window).soilManager.parcels[0].id);
        for (const addr of ['문단리 225', '문단리 226']) {
            await page.locator(`.sub-lot-input[data-id="${parcelId}"]`).fill(addr);
            await page.locator(`.btn-add-sub-lot-icon[data-id="${parcelId}"]`).click();
        }
        await expect(page.locator(`#subLots-${parcelId} .sub-lot-card`)).toHaveCount(2);

        // 작물 모달을 열어 두 번째 하위필지에 배정한다.
        //
        // ⚠️ 작물을 **1개**로 둔다. 작물 2개는 분할모드 저장이 되고, 그 경로의
        //    그룹수정은 **이 티켓과 무관한 선재 결함으로 crops를 잃는다**
        //    (실측: `parcels:1, cropCounts:[0]`). `populateFormForGroupEdit`·
        //    `soil-log-record.js`는 이 변경에서 건드리지 않았다 → SAMPL-1-160으로 분리.
        //    하위필지가 있으면 작물 1개에서도 드롭다운이 뜨므로 배정 왕복은 검증된다.
        await page.locator('.btn-add-crop-area, .btn-add-crop-compact').first().click();
        await expect(page.locator('#cropAreaList')).toBeVisible();
        const rows = page.locator('#cropAreaList .crop-area-input-row');
        const first = rows.first();
        await first.locator('.crop-search-input').fill('고추');
        await first.locator('input[type="number"]').first().fill('100');
        await first.locator('select[id^="sublot-select-"]').selectOption('문단리 226');
        await page.locator('#confirmCropAreaBtn').click();

        // 등록
        await page.locator('#navSubmitBtn').click();
        await expect(page.locator('.btn-edit').first()).toBeAttached({ timeout: 15000 });

        // ⚠️ SAMPL-1-161부터 배정은 실제 이동이다 — 작물이 **하위필지 안에** 저장돼야
        //    엑셀·목록·흙토람이 그 배정을 반영한다. 꼬리표만 있으면 화면만 맞고 내보내기는 틀렸다.
        const saved = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            return mgr.sampleLogs.map((l) => {
                const p = (l.parcels || [])[0] || {};
                return {
                    rn: l.receptionNumber,
                    own: (p.crops || []).map((c) => c.name),
                    subLots: (p.subLots || []).map((sub) => ({
                        addr: typeof sub === 'string' ? sub : sub.lotAddress,
                        crops: (typeof sub === 'string' ? [] : (sub.crops || [])).map((c) => c.name),
                    })),
                    cropsDisplay: l.cropsDisplay,
                };
            });
        });
        const dump = JSON.stringify(saved);
        const target = saved[0].subLots.find((sub) => sub.addr === '문단리 226');
        expect(target, `하위필지가 저장되지 않았다: ${dump}`).toBeTruthy();
        expect(target.crops, `배정이 저장되지 않았다: ${dump}`).toEqual(['고추']);
        expect(saved[0].own, `배정했는데 상위 필지에 남았다: ${dump}`).toEqual([]);
        // 전량 배정된 필지는 상위 요약이 '-'여야 한다 — '고추'면 상위 행과 하위 행에 두 번 뜬다
        expect(saved[0].cropsDisplay, `상위 요약이 하위필지 작물을 중복 표시한다: ${dump}`).toBe('-');

        // ⚠️ **수정 왕복은 여기서 검증할 수 없다** — 다만 사유가 처음 적었던 것과 다르다.
        //
        //    처음에는 "수정 화면에서 작물이 유실된다"고 적고 SAMPL-1-160을 발행했다.
        //    **그 진단이 틀렸다.** 조사해 보니 `editSample`은 정상이다 —
        //    직접 호출하면 `crops:[1]`, 주소·작물이 모두 복원된다.
        //
        //    진짜 원인은 **테스트가 목록의 수정 버튼을 클릭할 수 없다**는 것이다.
        //    `.btn-edit`이 `x=1414`로 기본 뷰포트(1280) 밖(가로 스크롤 표 안)이라
        //    `force: true` 클릭은 좌표가 빗나가 이벤트 위임에 닿지 않고,
        //    `force` 없이는 안정성 검사 타임아웃이 난다. → **SAMPL-2-35**
        //
        //    ⚠️ `force: true`가 클릭을 **무효로 만들면서도 테스트는 진행시켜**,
        //       나는 그 무효한 결과를 제품 결함으로 오진했다. 우회를 넣을 때는
        //       그것이 무엇을 무효화하는지 먼저 확인해야 한다.
        //
        //    SAMPL-2-35가 풀리면 이 테스트에 수정 왕복을 잇는다.
        //    여기까지로 검증되는 것: 하위필지 추가 실경로(`canAdd` 포함) · 드롭다운 선택 ·
        //    모달 확정 · **등록 저장에 배정이 실제로 담긴다**는 것.
    });

    // 🚨 C-1: 편집 경로(`openCropAreaModal`)도 저장 경로와 **같은 규칙**을 써야 한다.
    //    처음에는 편집 경로만 무조건 정리했고, 그래서 분할모드 레코드를 수정하려고
    //    모달을 여는 순간 배정이 '전체'로 바뀌고 확인만 눌러도 영구 소멸했다.
    //
    //    ⚠️ 이 테스트가 없으면 `resolveForEdit` → `resolveTarget` 변이가 **통과한다**
    //       (실제로 그랬다). 저장 경로만 보는 테스트로는 편집 경로를 지킬 수 없다.
    test('분할모드 레코드의 작물 모달을 열어도 배정이 남는다', async ({ page }) => {
        await openSoil(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [],   // 분할모드 저장이 이렇게 기록한다
                crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 225' }],
            }];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            mgr.openCropAreaModal('p1');
            return {
                inModal: mgr.tempCropAreas.map((c) => c.subLotTarget),
                inParcel: mgr.parcels[0].crops.map((c) => c.subLotTarget),
            };
        });

        expect(
            out.inModal,
            '모달을 여는 것만으로 배정이 사라졌다 — 확인만 눌러도 영구 소멸한다'
        ).toEqual(['문단리 225']);
        expect(out.inParcel, '원본 데이터도 손상됐다').toEqual(['문단리 225']);
    });

    // 🚨 적대적 검증이 클릭으로 재현한 상태 누출.
    //    하위필지 모달을 **취소**하면 상태가 남아, 다음에 상위 필지 작물 모달을 열면
    //    그 작물이 하위필지로 잘못 귀속돼 저장됐다. 하위필지 작물은 엑셀·흙토람이
    //    실제로 읽으므로 조용한 데이터 오귀속이다.
    test('하위필지 모달을 취소해도 상위 필지 작물이 새지 않는다', async ({ page }) => {
        await openSoil(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [
                    { lotAddress: '문단리 225', crops: [] },
                    { lotAddress: '문단리 226', crops: [] },
                ],
                crops: [],
            }];

            // 하위필지 모달을 열었다가 **취소**로 닫는다
            mgr.openSubLotCropModal('p1', 0);
            mgr.closeCropAreaModalFn();
            const leaked = {
                p: mgr.currentSubLotParcelId,
                i: mgr.currentSubLotIndex,
            };

            // 이제 상위 필지 작물 모달을 연다
            mgr.openCropAreaModal('p1');
            const hasSelect = !!document.querySelector('#cropAreaList select[id^="sublot-select-"]');
            mgr.tempCropAreas = [{ name: '배추', area: '50', code: '', subLotTarget: 'all' }];
            mgr.confirmCropArea();

            return {
                leaked,
                hasSelect,
                parcelCrops: mgr.parcels[0].crops.map((c) => c.name),
                subLot0Crops: mgr.parcels[0].subLots[0].crops.map((c) => c.name),
            };
        });

        expect(out.leaked, `모달을 닫아도 상태가 남았다: ${JSON.stringify(out.leaked)}`)
            .toEqual({ p: null, i: null });
        expect(out.hasSelect, '누출된 상태 때문에 상위 필지 모달의 하위필지 선택이 사라졌다').toBe(true);
        expect(out.parcelCrops, '상위 필지 작물이 사라졌다').toEqual(['배추']);
        expect(out.subLot0Crops, '상위 필지 작물이 하위필지로 잘못 귀속됐다').toEqual([]);
    });

    // 목록 화면의 하위필지 라벨. 예전에는 indexOf 비교라 객체면 **항상** 사라졌다.
    test('목록에 하위필지 라벨이 표시된다', async ({ page }) => {
        await openSoil(page);
        const label = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const parcel = { id: 'p1', subLots: [{ lotAddress: '문단리 225', crops: [] }] };
            return mgr.getSubLotLabel('문단리 225', parcel);
        });
        expect(label, '객체 하위필지에서 라벨이 사라졌다').toBe('[문단리 225]');
    });
});
