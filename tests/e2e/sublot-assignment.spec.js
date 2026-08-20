// @ts-check
// SAMPL-1-161: 하위필지 배정이 엑셀에도 반영된다
//
// 예전에는 작물·면적 모달에서 "하위 2"를 골라도 꼬리표(`subLotTarget`)만 붙었고,
// 작물은 `parcel.crops`에 그대로 남았다. 그런데 **엑셀·목록·흙토람은 `subLot.crops`만
// 읽어서**(`soil-script.js:4667`) 배정이 반영되지 않았다:
//
//   화면: 고추 [문단리 226]   ← 배정된 것처럼 보임
//   엑셀: 고추가 상위 필지 행  ← 반영 안 됨
//
// 이제 배정은 **실제 이동**이다. 화면·저장·내보내기가 같은 것을 말한다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

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
        'docs/의 APP_VERSION이 package.json과 다르다 — 빌드 누락이거나 다른 프로젝트다'
    ).toBe(EXPECTED_VERSION);
}

/** 필지 하나 + 하위필지 둘을 세운다 */
async function setup(page) {
    await page.evaluate(() => {
        const mgr = /** @type {any} */ (window).soilManager;
        mgr.parcels = [{
            id: 'p1', lotAddress: '문단리 224',
            subLots: [
                { lotAddress: '문단리 225', crops: [] },
                { lotAddress: '문단리 226', crops: [] },
            ],
            crops: [{ name: '고추', area: '100', unit: 'm2' }],
        }];
        mgr.currentSubLotParcelId = null;
        mgr.currentSubLotIndex = null;
    });
}

test.describe('하위필지 배정 (SAMPL-1-161)', () => {
    // 🚨 이 티켓의 이유.
    test('배정하면 작물이 실제로 하위필지로 옮겨간다', async ({ page }) => {
        await openSoil(page);
        await setup(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.openCropAreaModal('p1');
            // 모달에서 "문단리 226"으로 배정하고 확정
            mgr.tempCropAreas[0].subLotTarget = '문단리 226';
            mgr.confirmCropArea();
            const p = mgr.parcels[0];
            return {
                own: p.crops.map((c) => c.name),
                lot225: p.subLots[0].crops.map((c) => c.name),
                lot226: p.subLots[1].crops.map((c) => c.name),
            };
        });

        expect(out.own, '상위에 남으면 엑셀이 상위 필지 행에 넣는다').toEqual([]);
        expect(out.lot226, '배정한 하위필지로 옮겨가지 않았다').toEqual(['고추']);
        expect(out.lot225).toEqual([]);
    });

    // 🚨 핵심 검증 — **실제** `exportToExcel()`을 부른다.
    //
    //    처음 이 테스트는 내보내기가 만드는 행 구조를 테스트 안에서 손으로 재현했다.
    //    그러면 프로덕션 코드와 아무 결합이 없어, 내보내기가 바뀌어도 조용히 통과한다.
    //    게다가 재현한 값이 바로 위 테스트가 이미 단언한 `parcel.crops`에서 파생돼
    //    **구조적으로 항상 참**이었다 (코드리뷰·독립모델이 각각 지적).
    //    이제 `json_to_sheet` 인자를 가로채 진짜 시트 데이터를 본다.
    test('엑셀 내보내기에서 그 작물이 하위필지 행에 실린다 (진짜 exportToExcel)', async ({ page }) => {
        await openSoil(page);
        await setup(page);

        const rows = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const W = /** @type {any} */ (window);

            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '문단리 226';
            mgr.confirmCropArea();

            // 폼의 필지를 저장 레코드로 만들어 목록에 넣는다 (내보내기는 sampleLogs를 읽는다)
            const parcel = mgr.parcels[0];
            mgr.sampleLogs = [{
                id: 'x1', receptionNumber: '1', date: '2026-08-20',
                name: '홍길동', phoneNumber: '010-0000-0000',
                lotAddress: parcel.lotAddress, address: parcel.lotAddress,
                // 실제 `getTabFilteredLogs()`를 통과해야 한다 — 필터를 스텁하면 내보내기 경로가 반쯤 가짜가 된다
                landClass1: mgr.currentSearchFilter?.landClass1 || '논', isComplete: false,
                parcels: [parcel],
                cropsDisplay: parcel.crops.map((c) => c.name).join(', ') || '-',
                area: parcel.crops.reduce((s, c) => s + (parseFloat(c.area) || 0), 0).toString(),
            }];

            // 진짜 내보내기를 부르되 파일 저장만 가로챈다
            let captured = /** @type {any} */ (null);
            const realJson = W.XLSX.utils.json_to_sheet;
            const realWrite = W.XLSX.writeFile;
            W.XLSX.utils.json_to_sheet = function (data) { captured = data; return realJson.apply(this, arguments); };
            W.XLSX.writeFile = function () { /* 파일로 쓰지 않는다 */ };
            try {
                mgr.exportToExcel();
            } finally {
                W.XLSX.utils.json_to_sheet = realJson;
                W.XLSX.writeFile = realWrite;
            }
            return captured;
        });

        expect(rows, 'exportToExcel이 시트를 만들지 않았다 — 필터에 걸렸을 수 있다').toBeTruthy();
        const sheet = /** @type {Array<any>} */ (rows);
        const parent = sheet.find((r) => r['필지 주소'] === '문단리 224');
        const target = sheet.find((r) => r['필지 주소'] === '문단리 226');
        const other = sheet.find((r) => r['필지 주소'] === '문단리 225');

        expect(parent, '상위 필지 행이 없다').toBeTruthy();
        expect(target, '하위필지 행이 없다').toBeTruthy();
        expect(parent['작물'], '배정했는데 상위 필지 행에 그대로 남았다').toBe('-');
        expect(target['작물'], '하위필지 행에 실리지 않았다').toBe('고추');
        // 면적도 함께 옮겨가야 한다 — 이름만 옮기고 면적이 상위에 남으면 집계가 어긋난다
        expect(parent['면적(m²)'], '면적이 상위 행에 남았다').toBe('-');
        expect(target['면적(m²)'], '면적이 하위필지 행으로 오지 않았다').toBe(100);
        expect(other['작물'], '엉뚱한 하위필지에 들어갔다').toBe('-');
        // 접수번호 접미가 하위필지 순서를 따른다
        expect(target['접수번호']).toBe('1-2');
    });

    test("'전체'로 되돌리면 상위 필지로 돌아온다", async ({ page }) => {
        await openSoil(page);
        await setup(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            // 먼저 배정
            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '문단리 226';
            mgr.confirmCropArea();
            // 다시 열어 되돌린다
            mgr.openCropAreaModal('p1');
            const seen = mgr.tempCropAreas.map((c) => `${c.name}/${c.subLotTarget}`);
            mgr.tempCropAreas[0].subLotTarget = 'all';
            mgr.confirmCropArea();
            const p = mgr.parcels[0];
            return { seen, own: p.crops.map((c) => c.name), lot226: p.subLots[1].crops.map((c) => c.name) };
        });

        // 다시 열었을 때 하위필지 작물이 보여야 되돌릴 수 있다
        expect(out.seen, '모달이 하위필지 작물을 보여주지 않아 되돌릴 방법이 없다')
            .toEqual(['고추/문단리 226']);
        expect(out.own).toEqual(['고추']);
        expect(out.lot226).toEqual([]);
    });

    test('여러 작물을 각각 다른 하위필지로 나눈다', async ({ page }) => {
        await openSoil(page);
        await setup(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels[0].crops = [
                { name: '고추', area: '100', unit: 'm2' },
                { name: '배추', area: '50', unit: 'm2' },
                { name: '무', area: '30', unit: 'm2' },
            ];
            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '문단리 225';
            mgr.tempCropAreas[1].subLotTarget = '문단리 226';
            // 세 번째는 'all' 유지
            mgr.confirmCropArea();
            const p = mgr.parcels[0];
            return {
                own: p.crops.map((c) => c.name),
                lot225: p.subLots[0].crops.map((c) => c.name),
                lot226: p.subLots[1].crops.map((c) => c.name),
            };
        });

        expect(out.lot225).toEqual(['고추']);
        expect(out.lot226).toEqual(['배추']);
        expect(out.own).toEqual(['무']);
    });

    // ⚠️ 배정이 잘못됐다고 작물을 없애면 담당자가 입력한 자료가 조용히 사라진다
    test('가리킬 하위필지가 없어도 작물을 잃지 않는다', async ({ page }) => {
        await openSoil(page);
        await setup(page);

        const own = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '없어진주소';
            mgr.confirmCropArea();
            return mgr.parcels[0].crops.map((c) => c.name);
        });
        expect(own, '작물이 사라졌다').toEqual(['고추']);
    });

    // 하위필지 카드에서 직접 넣은 작물이 상위 모달 확정으로 지워지면 안 된다
    test('하위필지 카드로 넣은 작물이 상위 모달 확정에서 살아남는다', async ({ page }) => {
        await openSoil(page);
        await setup(page);

        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            // 하위필지 1에 직접 작물을 넣은 상태
            mgr.parcels[0].subLots[0].crops = [{ name: '마늘', area: '20', unit: 'm2' }];
            // 상위 모달에서 다른 작업만 하고 확정
            mgr.openCropAreaModal('p1');
            mgr.confirmCropArea();
            const p = mgr.parcels[0];
            return { lot225: p.subLots[0].crops.map((c) => c.name), own: p.crops.map((c) => c.name) };
        });
        expect(out.lot225, '하위필지에 직접 넣은 작물이 사라졌다').toEqual(['마늘']);
        expect(out.own).toEqual(['고추']);
    });
});

// ============================================================================
// 리뷰가 실측으로 찾은 데이터 유실 경로 (코드리뷰 + 적대적 검증)
//
// ⚠️ 위 테스트들은 `tempCropAreas`를 직접 조작해 **DOM을 거치지 않는다.**
//    그래서 아래 결함을 하나도 잡지 못했다. 여기서는 진짜 렌더·진짜 입력칸을 쓴다.
// ============================================================================

test.describe('SAMPL-1-161 회귀 방지', () => {
    /** 필지 카드를 실제로 렌더해 인라인 입력칸이 존재하게 만든다 */
    async function setupRendered(page, crops) {
        await page.evaluate((crops) => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [
                    { lotAddress: '문단리 225', crops: [] },
                    { lotAddress: '문단리 226', crops: [] },
                ],
                crops,
                category: '', purpose: '', note: '',
            }];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            const container = document.getElementById('parcelsContainer');
            if (container) container.innerHTML = '';
            mgr.renderParcelCard(mgr.parcels[0], 1);
        }, crops);
    }

    // 🚨 C-3: 첫 작물을 배정하면 인라인 입력칸이 스테일 값을 들고 남아,
    //    사용자가 그 칸을 건드리는 순간 다른 작물을 덮어쓰거나 작물이 복제된다.
    test('첫 작물을 배정한 뒤 면적칸을 고쳐도 작물이 복제되지 않는다', async ({ page }) => {
        await openSoil(page);
        await setupRendered(page, [{ name: '고추', area: '100', unit: 'm2' }]);

        // 배정 후 화면 입력칸이 실제로 비었는지 (유령 값이 남으면 안 된다)
        const shown = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '문단리 226';
            mgr.confirmCropArea();
            return {
                crop: /** @type {HTMLInputElement} */ (document.querySelector('.crop-direct-input[data-id="p1"]'))?.value,
                area: /** @type {HTMLInputElement} */ (document.querySelector('.area-direct-input[data-id="p1"]'))?.value,
            };
        });
        expect(shown.crop, '옮겨간 작물이 상위 입력칸에 유령으로 남았다').toBe('');
        expect(shown.area, '옮겨간 면적이 상위 입력칸에 유령으로 남았다').toBe('');

        // 진짜로 입력칸을 건드린다 — 여기서 예전에는 고추가 상위에 되살아났다
        await page.fill('.area-direct-input[data-id="p1"]', '120');
        const after = await page.evaluate(() => {
            const p = /** @type {any} */ (window).soilManager.parcels[0];
            return {
                own: p.crops.map((c) => `${c.name}:${c.area}`),
                lot226: p.subLots[1].crops.map((c) => `${c.name}:${c.area}`),
            };
        });
        expect(after.lot226, '하위필지의 작물이 사라졌다').toEqual(['고추:100']);
        expect(after.own, '같은 작물이 상위에도 되살아나 이중계상된다').toEqual([]);
    });

    // 작물 2개 중 첫 번째를 배정하면 두 번째가 0번이 된다 —
    // 입력칸을 안 맞추면 스테일 값이 두 번째 작물을 덮어쓴다
    test('첫 작물 배정 후 두 번째 작물이 덮어써지지 않는다', async ({ page }) => {
        await openSoil(page);
        await setupRendered(page, [
            { name: '고추', area: '100', unit: 'm2' },
            { name: '배추', area: '50', unit: 'm2' },
        ]);

        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '문단리 226';
            mgr.confirmCropArea();
        });
        await page.fill('.area-direct-input[data-id="p1"]', '60');

        const out = await page.evaluate(() => {
            const p = /** @type {any} */ (window).soilManager.parcels[0];
            return {
                own: p.crops.map((c) => `${c.name}:${c.area}`),
                lot226: p.subLots[1].crops.map((c) => c.name),
            };
        });
        expect(out.own, '배추가 스테일 값(고추)으로 덮어써졌다').toEqual(['배추:60']);
        expect(out.lot226).toEqual(['고추']);
    });

    // 🚨 C-1/C-2: 옛 꼬리표 배정이 붙은 레코드를 열어 **확인만** 눌러도 배정이 소멸했다
    test('옛 꼬리표 배정은 확인만 눌러도 실제 이동으로 이관된다', async ({ page }) => {
        await openSoil(page);
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 225', crops: [] }, { lotAddress: '문단리 226', crops: [] }],
                // 이 버전 이전에 저장된 모양 — 배정이 꼬리표에만 있다
                crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 226' }],
            }];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
        });

        const seen = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.openCropAreaModal('p1');
            const inModal = mgr.tempCropAreas.map((c) => c.subLotTarget);
            mgr.confirmCropArea();
            const p = mgr.parcels[0];
            return { inModal, own: p.crops.map((c) => c.name), lot226: p.subLots[1].crops.map((c) => c.name) };
        });
        expect(seen.inModal, '모달이 기존 배정을 보여주지 않는다 — 사용자가 잃은 줄도 모른다').toEqual(['문단리 226']);
        expect(seen.own, '배정이 소멸해 상위로 돌아갔다').toEqual([]);
        expect(seen.lot226, '실제 이동으로 이관되지 않았다').toEqual(['고추']);
    });

    // 로드 시 마이그레이션 — 레코드를 열지 않아도 엑셀이 맞아야 한다
    test('레코드를 열지 않아도 로드 마이그레이션으로 엑셀이 맞는다', async ({ page }) => {
        await openSoil(page);
        const rows = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const W = /** @type {any} */ (window);
            const parcels = [{
                lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 226', crops: [] }],
                crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 226' }],
            }];
            // 로드 훅이 하는 일을 그대로 — 폼을 거치지 않는다
            W.SubLotIdentity.migrateParcels(parcels);
            mgr.sampleLogs = [{
                id: 'x1', receptionNumber: '1', date: '2026-08-20', name: '홍길동',
                phoneNumber: '010-0000-0000', lotAddress: '문단리 224', address: '문단리 224',
                landClass1: mgr.currentSearchFilter?.landClass1 || '논', isComplete: false, parcels,
                cropsDisplay: '-', area: '0',
            }];
            let captured = /** @type {any} */ (null);
            const realJson = W.XLSX.utils.json_to_sheet;
            const realWrite = W.XLSX.writeFile;
            W.XLSX.utils.json_to_sheet = function (d) { captured = d; return realJson.apply(this, arguments); };
            W.XLSX.writeFile = function () {};
            try { mgr.exportToExcel(); } finally {
                W.XLSX.utils.json_to_sheet = realJson;
                W.XLSX.writeFile = realWrite;
            }
            return captured;
        });
        const sheet = /** @type {Array<any>} */ (rows);
        const parent = sheet.find((r) => r['필지 주소'] === '문단리 224');
        const target = sheet.find((r) => r['필지 주소'] === '문단리 226');
        expect(parent['작물'], '레거시 레코드가 여전히 상위 행에 실린다').toBe('-');
        expect(target['작물'], '로드 마이그레이션이 반영되지 않았다').toBe('고추');
    });

    // 🚨 C-4: 면적이 빈 하위필지 작물이 모달 확인만으로 삭제됐다
    test('면적이 빈 하위필지 작물이 확인만으로 사라지지 않는다', async ({ page }) => {
        await openSoil(page);
        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 226', crops: [{ name: '마늘', area: '' }] }],
                crops: [{ name: '고추', area: '100', unit: 'm2' }],
            }];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            mgr.openCropAreaModal('p1');
            mgr.confirmCropArea();   // 아무것도 바꾸지 않고 확인
            return {
                lot226: mgr.parcels[0].subLots[0].crops.map((c) => c.name),
                own: mgr.parcels[0].crops.map((c) => c.name),
            };
        });
        expect(out.lot226, '면적이 빈 하위필지 작물이 삭제됐다').toEqual(['마늘']);
        expect(out.own).toEqual(['고추']);
    });

    // 🚨 M-3(적대적) : 폼이 저장 레코드와 하위필지 객체를 공유해,
    //    수정을 **취소해도** 저장본이 이미 바뀌어 있었다
    test('수정 폼에서 배정해도 저장 레코드는 저장 전까지 그대로다', async ({ page }) => {
        await openSoil(page);
        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const W = /** @type {any} */ (window);
            const savedSubLots = [{ lotAddress: '문단리 226', crops: [{ name: '마늘', area: '20' }] }];
            // populateFormForEdit가 하는 복사 — 여기가 얕으면 저장본이 오염된다
            const formParcel = {
                id: 'p1', lotAddress: '문단리 224',
                subLots: W.SubLotIdentity.cloneSubLots(savedSubLots),
                crops: [{ name: '고추', area: '100', unit: 'm2' }],
            };
            mgr.parcels = [formParcel];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            mgr.openCropAreaModal('p1');
            mgr.tempCropAreas[0].subLotTarget = '문단리 226';
            mgr.confirmCropArea();   // 확인은 눌렀지만 저장은 안 했다
            return {
                saved: savedSubLots[0].crops.map((c) => c.name),
                form: formParcel.subLots[0].crops.map((c) => c.name),
            };
        });
        expect(out.saved, '저장하지 않았는데 저장 레코드가 오염됐다').toEqual(['마늘']);
        expect(out.form.sort()).toEqual(['고추', '마늘']);
    });

    // 🚨 M-1(적대적) : 작물을 전부 배정하면 `parcel.crops`가 빈 배열이 되는데,
    //    흙토람은 `parcel.crops || [...]`로 폴백해 **빈 배열이 truthy라** 대표 지번 행이 사라졌다
    test('흙토람에서 대표 지번 행이 사라지지 않고 번호가 -0이 되지 않는다', async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const res = await page.goto('/heuktoram/');
        expect(res && res.status(), 'docs/heuktoram/ 없음').toBeLessThan(400);
        await page.waitForFunction(() => !!window.heuktoramManager, { timeout: 15000 });

        const rows = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).heuktoramManager;
            mgr.sampleLogs = [{
                id: 'h1', receptionNumber: 'F1-1', date: '2026-08-20', name: '홍길동',
                parcels: [{
                    lotAddress: '문단리 224',
                    crops: [],   // 전부 하위필지로 배정된 상태
                    subLots: [{ lotAddress: '문단리 226', crops: [{ name: '고추', area: '100' }] }],
                }],
            }];
            mgr.buildFlatRows();
            return mgr.flatRows.map((r) => ({ no: r.displayNumber, isSub: r.isSubLot, crop: r.crop?.name ?? '' }));
        });

        // ⚠️ `isSubLot`은 접수번호가 이미 `-N` 꼴이면 대표 행에도 true가 된다(기존 설계).
        //    그래서 그 플래그가 아니라 **행이 몇 개 나오고 번호가 무엇인가**를 본다.
        expect(rows.some((r) => r.no.endsWith('-0')), '접수번호가 -0으로 시작한다').toBe(false);
        expect(rows.map((r) => r.no), '대표 지번 행이 사라졌다').toEqual(['F1-1', 'F1-1-1']);
        expect(rows[0].crop, '대표 행은 작물 없이 지번만 나와야 한다').toBe('');
        expect(rows[1].crop).toBe('고추');
    });

    // ⚠️ 이 계약을 "고치려" 들면 상위 행과 하위 행에 같은 작물이 두 번 뜬다.
    //    `cropsFromDisplay`가 '-'를 빈 배열로 돌려주는 것에 기대고 있다.
    test("전량 배정된 레코드의 cropsDisplay는 '-'여야 한다 (중복 방지)", async ({ page }) => {
        await openSoil(page);
        const out = await page.evaluate(() => {
            const W = /** @type {any} */ (window);
            const parcel = {
                lotAddress: '문단리 224', crops: [],
                subLots: [{ lotAddress: '문단리 226', crops: [{ name: '고추', area: '100' }] }],
            };
            const rec = W.SoilLogRecord.buildSoilLogRecord(parcel, {
                receptionNumber: '1', groupId: 'g1', index: 0, totalParcels: 1,
                commonData: { date: '2026-08-20', name: '홍' },
            });
            return { disp: rec.cropsDisplay, restored: W.SoilLogRecord.cropsFromDisplay(rec).map((c) => c.name) };
        });
        expect(out.disp, "'-'가 아니면 상위 행 폴백이 하위필지 작물을 되살려 중복시킨다").toBe('-');
        expect(out.restored).toEqual([]);
    });
});

test.describe('하위필지 삭제 — 작물을 잃지 않는다 (SAMPL-1-161)', () => {
    // 🚨 배정이 실제 이동이 된 뒤로, 하위필지를 지우는 것은 곧 **작물을 지우는 것**이다.
    //    배정을 잃는 것과 담당자가 입력한 작물을 잃는 것은 다르다.
    test('하위필지를 지우면 그 작물이 상위 필지로 되돌아온다', async ({ page }) => {
        await openSoil(page);
        const parcelId = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 226', crops: [{ name: '마늘', area: '20', unit: 'm2' }] }],
                crops: [{ name: '고추', area: '100', unit: 'm2' }],
                category: '', purpose: '', note: '',
            }];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            const c = document.getElementById('parcelsContainer');
            if (c) c.innerHTML = '';
            mgr.renderParcelCard(mgr.parcels[0], 1);
            return mgr.parcels[0].id;
        });

        // 진짜 삭제 버튼을 누른다
        await page.locator(`#subLots-${parcelId} .remove-sub-lot`).first().click();

        const out = await page.evaluate(() => {
            const p = /** @type {any} */ (window).soilManager.parcels[0];
            return { own: p.crops.map((c) => c.name), subLots: p.subLots.length };
        });
        expect(out.subLots, '하위필지가 지워지지 않았다').toBe(0);
        expect(out.own.sort(), '하위필지에 있던 작물이 함께 사라졌다').toEqual(['고추', '마늘']);
    });

    test('빈 하위필지를 지우면 상위 작물은 그대로다', async ({ page }) => {
        await openSoil(page);
        const parcelId = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224',
                subLots: [{ lotAddress: '문단리 226', crops: [] }],
                crops: [{ name: '고추', area: '100', unit: 'm2' }],
                category: '', purpose: '', note: '',
            }];
            mgr.currentSubLotParcelId = null;
            mgr.currentSubLotIndex = null;
            const c = document.getElementById('parcelsContainer');
            if (c) c.innerHTML = '';
            mgr.renderParcelCard(mgr.parcels[0], 1);
            return mgr.parcels[0].id;
        });
        await page.locator(`#subLots-${parcelId} .remove-sub-lot`).first().click();
        const own = await page.evaluate(() =>
            /** @type {any} */ (window).soilManager.parcels[0].crops.map((c) => c.name));
        expect(own).toEqual(['고추']);
    });
});

test.describe('분할모드와 하위필지의 충돌 (SAMPL-1-161)', () => {
    // 🚨 한 필지에 작물이 2개 이상이면 저장이 **분할모드**로 들어가 작물별 레코드를 만들고,
    //    그때 `subLots: isSplit ? []`로 **하위필지를 통째로 버린다**(`soil-log-record.js`).
    //    배정이 실제 이동이 된 뒤로는 그 안에 담당자가 입력한 작물이 들어 있다 — 즉 소멸한다.
    //
    //    두 기능이 같은 `-N` 접수번호 공간을 다투는 것이 근본 원인이다:
    //      · 분할모드 = 한 지번에 작물 여럿 → `321`, `321-1`
    //      · 하위필지 = 한 접수에 지번 여럿 → `321-1`, `321-2`
    //    하위필지가 있으면 분할하지 않는 것으로 정리한다(사용자 업무 규칙과도 일치).
    //
    // ⚠️ **진짜 등록 버튼을 누른다.** 처음 이 테스트는 저장 조건을 테스트 안에 다시
    //    구현해서, 수정이 없어도 통과하는 동어반복이었다.
    test('하위필지가 있으면 작물이 여러 개여도 하위필지가 저장에 남는다', async ({ page }) => {
        await openSoil(page);

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

        await page.locator('.lot-address-input').first().fill('문단리 224');
        await page.locator('.crop-direct-input').first().fill('고추');
        await page.locator('.area-direct-input').first().fill('100');

        // 하위필지 하나를 클릭으로 추가하고 그 안에 작물을 넣는다
        const parcelId = await page.evaluate(() => /** @type {any} */ (window).soilManager.parcels[0].id);
        await page.locator(`.sub-lot-input[data-id="${parcelId}"]`).fill('문단리 226');
        await page.locator(`.btn-add-sub-lot-icon[data-id="${parcelId}"]`).click();
        await expect(page.locator(`#subLots-${parcelId} .sub-lot-card`)).toHaveCount(1);

        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels[0].subLots[0].crops = [{ name: '마늘', area: '20', unit: 'm2' }];
            // 상위 필지에 두 번째 작물 — 이것이 분할모드를 켜는 조건이다
            mgr.parcels[0].crops.push({ name: '배추', area: '50', unit: 'm2' });
            mgr.updateParcelsData();
        });

        await page.locator('#navSubmitBtn').click();
        await expect(page.locator('.btn-edit').first()).toBeAttached({ timeout: 15000 });

        const saved = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            return mgr.sampleLogs.map((l) => ({
                rn: l.receptionNumber,
                own: ((l.parcels?.[0]?.crops) || []).map((c) => c.name),
                subLotCrops: ((l.parcels?.[0]?.subLots) || []).flatMap(
                    (sub) => (typeof sub === 'string' ? [] : (sub.crops || [])).map((c) => c.name)),
            }));
        });

        const dump = JSON.stringify(saved);
        expect(saved.flatMap((r) => r.subLotCrops), `하위필지 작물이 저장에서 사라졌다: ${dump}`)
            .toContain('마늘');
        // 분할이 일어나면 `321-1`이 생겨 하위필지 행 번호와 충돌한다
        expect(saved.length, `분할모드가 하위필지와 함께 켜졌다: ${dump}`).toBe(1);
        expect(saved[0].own.sort(), `상위 작물이 유실됐다: ${dump}`).toEqual(['고추', '배추']);
    });
});

test.describe('레거시 이관의 표시 정합 (SAMPL-1-161)', () => {
    // 🚨 이관으로 `parcel.crops`가 비었는데 `cropsDisplay`에 옛 작물명이 남아 있으면
    //    단일필지 폴백(`cropsFromDisplay`)이 그 작물을 **상위 행에 되살려** 하위 행과 중복된다.
    test('이관 후 목록에서 같은 작물이 상위·하위에 두 번 뜨지 않는다', async ({ page }) => {
        await openSoil(page);
        const rows = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const log = {
                id: 'x1', receptionNumber: '1', date: '2026-08-20', name: '홍길동',
                phoneNumber: '010-0000-0000', lotAddress: '문단리 224', address: '문단리 224',
                landClass1: mgr.currentSearchFilter?.landClass1 || '논', isComplete: false,
                // 레거시 모양: 배정은 꼬리표에만, 요약에는 작물명이 남아 있다
                cropsDisplay: '고추', area: '100',
                parcels: [{
                    lotAddress: '문단리 224',
                    subLots: [{ lotAddress: '문단리 226', crops: [] }],
                    crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 226' }],
                }],
            };
            // 로드 훅이 하는 일을 그대로 실행한다
            const migrate = mgr.getAdditionalMigrations().slice(-1)[0];
            migrate([log]);
            mgr.sampleLogs = [log];
            return mgr.flattenLogsForTable([log]).map((r) => ({
                lot: r._lotAddress, crops: r._cropsDisplay,
            }));
        });

        const dump = JSON.stringify(rows);
        const withCrop = rows.filter((r) => r.crops === '고추');
        expect(withCrop.length, `같은 작물이 상위·하위에 두 번 뜬다: ${dump}`).toBe(1);
        expect(withCrop[0].lot, `하위필지 행이 아니라 상위 행에 실렸다: ${dump}`).toBe('문단리 226');
    });

    // 🚨 확정 필터를 `name`만으로 완화하면서, 면적 없는 작물이 정상적으로 들어오게 됐다.
    //    `updateFirstCrop`의 옛 기준(`!name || !area`)을 그대로 두면 인라인 칸을
    //    건드리는 순간 그 작물이 사라진다.
    test('이름만 있는 작물이 인라인 칸을 건드려도 사라지지 않는다', async ({ page }) => {
        await openSoil(page);
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.parcels = [{
                id: 'p1', lotAddress: '문단리 224', subLots: [],
                crops: [{ name: '고추', area: '', unit: 'm2' }],
                category: '', purpose: '', note: '',
            }];
            const c = document.getElementById('parcelsContainer');
            if (c) c.innerHTML = '';
            mgr.renderParcelCard(mgr.parcels[0], 1);
        });
        // 면적을 비워 둔 채 작물명을 건드린다
        await page.fill('.crop-direct-input[data-id="p1"]', '고추냉이');
        const own = await page.evaluate(() =>
            /** @type {any} */ (window).soilManager.parcels[0].crops.map((c) => c.name));
        expect(own, '면적이 없다는 이유로 작물이 삭제됐다').toEqual(['고추냉이']);
    });
});

test.describe('이름만 있는 작물의 일관성 (SAMPL-1-161)', () => {
    // 🚨 카드에는 고추가 보이는데 요약은 `작물 수: 0개`였다.
    //    담당자가 "입력이 안 먹었나" 하고 다시 넣으면 중복 입력이 된다.
    test('면적이 없어도 요약의 작물 수에 잡힌다', async ({ page }) => {
        await openSoil(page);
        const summary = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const html = mgr.renderParcelSummary({
                crops: [{ name: '고추', area: '' }],
                subLots: [],
            });
            // 렌더 결과에서 '작물 수' 다음 값을 뽑는다 (문자열 정규식이 아니라 DOM으로)
            const box = document.createElement('div');
            box.innerHTML = String(html);
            const spans = [...box.querySelectorAll('span')].map((el) => el.textContent.trim());
            const i = spans.findIndex((t) => t.includes('작물'));
            return { count: i >= 0 ? spans[i + 1] : null, spans };
        });
        // ⚠️ 예전에는 `not.toMatch(/작물\s*0\s*개/)`도 함께 봤는데, 템플릿이
        //    `<span>작물 수:</span>…<span>0개</span>`라 그 정규식은 **어떤 경우에도
        //    매치되지 않았다** — 구조적으로 항상 참인 단언이었다(적대적 검증 지적).
        //    지금은 렌더된 개수 값을 직접 읽는다.
        expect(summary.count, `요약이 작물을 숨긴다: ${JSON.stringify(summary)}`).toBe('1개');
    });
});

test.describe('흙토람도 옛 배정을 이관한다 (SAMPL-1-161)', () => {
    // 🚨 흙토람은 localStorage를 **직접** 읽는 별도 페이지라
    //    토양 화면의 로드 훅이 닿지 않는다. 여기서도 이관해야 서식이 배정을 반영한다.
    test('localStorage의 옛 꼬리표가 흙토람 행에 반영된다', async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const res = await page.goto('/heuktoram/');
        expect(res && res.status(), 'docs/heuktoram/ 없음').toBeLessThan(400);
        await page.waitForFunction(() => !!window.heuktoramManager, { timeout: 15000 });

        const rows = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).heuktoramManager;
            const year = mgr.selectedYear;
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify([{
                id: 'h1', receptionNumber: '7', date: '2026-08-20', name: '홍길동',
                parcels: [{
                    lotAddress: '문단리 224',
                    subLots: [{ lotAddress: '문단리 226', crops: [] }],
                    // 옛 모양: 배정이 꼬리표에만 있다
                    crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: '문단리 226' }],
                }],
            }]));
            mgr.sampleLogs = mgr.loadSampleLogs();
            mgr.buildFlatRows();
            return mgr.flatRows.map((r) => ({ no: r.displayNumber, crop: r.crop?.name ?? '' }));
        });

        const dump = JSON.stringify(rows);
        const sub = rows.find((r) => r.no === '7-1');
        expect(sub, `하위필지 행이 없다: ${dump}`).toBeTruthy();
        expect(sub.crop, `흙토람이 옛 배정을 이관하지 않았다: ${dump}`).toBe('고추');
        expect(rows[0].crop, `대표 지번 행에 작물이 남아 중복된다: ${dump}`).toBe('');
    });
});

test.describe('분할 금지가 만든 전이 (SAMPL-1-161)', () => {
    // 이미 분할로 저장된 레코드(`321`, `321-1`)에 하위필지를 추가하고 다시 저장하면
    // 레코드가 **1건으로 합쳐진다.** 번호는 줄지만 작물은 하나도 잃지 않아야 한다.
    // (`321-1`은 이제 두 번째 작물이 아니라 하위필지 행이 쓴다 — 그래서 충돌이 없다.)
    test('분할 레코드에 하위필지를 더해도 작물을 하나도 잃지 않는다', async ({ page }) => {
        await openSoil(page);
        const out = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const parcel = {
                lotAddress: '문단리 224', isMountain: false,
                subLots: [{ lotAddress: '문단리 226', crops: [{ name: '마늘', area: '20', unit: 'm2' }] }],
                crops: [
                    { name: '고추', area: '100', unit: 'm2' },
                    { name: '배추', area: '50', unit: 'm2' },
                ],
                category: '', purpose: '', note: '',
            };
            const common = { date: '2026-08-20', name: '홍', phoneNumber: '010-0000-0000' };
            const validCrops = parcel.crops.filter((c) => c.name?.trim());
            // ⚠️ **분기 자체는 여기서 재구현한다** (술어 `hasUsableSubLots`만 프로덕션 것을 쓴다).
            //    그래서 이 테스트만으로는 `submitForm`의 배선이 지워져도 통과한다 —
            //    그 변이는 위 `:556`의 **진짜 등록 버튼** 테스트가 잡는다.
            //    여기서 보는 것은 "합쳐졌을 때 작물이 하나도 없어지지 않는가"다.
            const split = validCrops.length > 1
                && !(/** @type {any} */ (window).SubLotIdentity.hasUsableSubLots(parcel));
            const recs = [];
            if (split) {
                validCrops.forEach((crop, cropIndex) => recs.push(
                    /** @type {any} */ (window).SoilLogRecord.buildSoilLogRecord(parcel, {
                        receptionNumber: cropIndex === 0 ? '321' : `321-${cropIndex}`,
                        commonData: common, groupId: 'g', index: 0, totalParcels: 1, crop, cropIndex,
                    })));
            } else {
                recs.push(/** @type {any} */ (window).SoilLogRecord.buildSoilLogRecord(parcel, {
                    receptionNumber: '321', commonData: common, groupId: 'g', index: 0, totalParcels: 1,
                }));
            }
            // 저장된 것에서 모든 작물을 긁어모은다 — 어디에 있든 하나도 없어지면 안 된다
            const allCrops = recs.flatMap((r) => r.parcels.flatMap((p) => [
                ...(p.crops || []).map((c) => c.name),
                ...(p.subLots || []).flatMap((s) => (typeof s === 'string' ? [] : (s.crops || [])).map((c) => c.name)),
            ]));
            return { numbers: recs.map((r) => r.receptionNumber), allCrops: allCrops.sort() };
        });

        const dump = JSON.stringify(out);
        expect(out.allCrops, `저장에서 작물이 사라졌다: ${dump}`).toEqual(['고추', '마늘', '배추']);
        // 분할이 켜지면 `321-1`이 생겨 하위필지 행 번호와 부딪힌다
        expect(out.numbers, `분할이 하위필지 번호와 충돌한다: ${dump}`).toEqual(['321']);
    });
});

test.describe('그룹수정 × 하위필지 (SAMPL-1-161)', () => {
    // 🚨 레코드 개수가 줄면 옛 레코드를 **순서로** 짝지어 신원이 밀렸다.
    //    필지2가 필지1 두 번째 작물의 id·우편발송일자·gongikOrder·businessRegNo를
    //    물려받고, 올바른 레코드는 삭제됐다. 이 필드들은 폼에 입력란이 없어
    //    담당자가 화면에서 틀린 것을 볼 수 없다 — 유실보다 오귀속이 나쁘다.
    //
    // ⚠️ **진짜 그룹수정 경로를 탄다.** 매핑을 테스트 안에서 재구현하면
    //    `submitForm`의 배선이 틀려도 통과한다(이 세션에서 반복한 실패).
    test('레코드 수가 줄어도 각 지번이 제 신원을 유지한다', async ({ page }) => {
        page.on('dialog', (d) => d.accept());
        await page.goto('/soil/');
        await page.evaluate(() => localStorage.clear());

        const year = new Date().getFullYear();
        await page.evaluate((y) => {
            const mk = (o) => Object.assign({
                date: `${y}-03-01`, name: '그룹신원테스트', phoneNumber: '010-0000-3333',
                address: '경북 봉화군 봉화읍 내성리', landClass1: '농가의뢰',
                // ⚠️ 구분·용도가 비면 `submitForm`이 **조용히 중단**된다.
                //    그러면 저장 결과가 시드와 같아 어떤 단언이든 통과한다 — 실측으로 겪었다.
                receptionMethod: '직접', subCategory: '밭', purpose: '무농약',
                note: '', groupId: 'gid-161', totalParcels: 2,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isComplete: false,
            }, o);
            localStorage.setItem(`soilSampleLogs_${y}`, JSON.stringify([
                // 필지1이 분할된 상태 (작물 2개 → 321, 321-1)
                mk({ id: 'ID-321', receptionNumber: '321', parcelIndex: 1, cropIndex: 1,
                    gongikOrder: 'A-1', businessRegNo: '111',
                    parcels: [{ id: 'z1', lotAddress: '내성리 100', isMountain: false, subLots: [], category: '밭', purpose: '무농약',
                        crops: [{ name: '고추', area: '100', unit: 'm2' }], note: '' }],
                    lotAddress: '내성리 100', area: '100', cropsDisplay: '고추' }),
                mk({ id: 'ID-321-1', receptionNumber: '321-1', parcelIndex: 1, cropIndex: 2,
                    gongikOrder: 'A-2', businessRegNo: '222',
                    parcels: [{ id: 'z2', lotAddress: '내성리 100', isMountain: false, subLots: [], category: '밭', purpose: '무농약',
                        crops: [{ name: '배추', area: '50', unit: 'm2' }], note: '' }],
                    lotAddress: '내성리 100', area: '50', cropsDisplay: '배추' }),
                // 필지2는 단건
                mk({ id: 'ID-322', receptionNumber: '322', parcelIndex: 2,
                    gongikOrder: 'B-1', businessRegNo: '333',
                    parcels: [{ id: 'z3', lotAddress: '내성리 200', isMountain: false, subLots: [], category: '밭', purpose: '무농약',
                        crops: [{ name: '마늘', area: '20', unit: 'm2' }], note: '' }],
                    lotAddress: '내성리 200', area: '20', cropsDisplay: '마늘' }),
            ]));
        }, year);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.click('.nav-btn[data-view="list"]');
        await page.waitForSelector('#listView', { state: 'visible' });

        // 그룹수정 진입
        await page.locator('#logTableBody .btn-edit').first().click();
        await page.waitForSelector('.parcel-card', { state: 'visible' });
        await page.waitForTimeout(200);

        // 첫 필지에 하위필지를 **버튼 클릭으로** 추가한다 → 분할이 금지되어 레코드가 준다
        const parcelId = await page.evaluate(() =>
            /** @type {any} */ (window).soilManager.parcels[0].id);
        await page.locator(`.sub-lot-input[data-id="${parcelId}"]`).fill('내성리 100-1');
        await page.locator(`.btn-add-sub-lot-icon[data-id="${parcelId}"]`).click();
        await expect(page.locator(`#subLots-${parcelId} .sub-lot-card`)).toHaveCount(1);

        await page.click('#navSubmitBtn');
        await page.waitForTimeout(600);

        const saved = await page.evaluate(() =>
            /** @type {any} */ (window).soilManager.sampleLogs.map((l) => ({
                lot: l.parcels?.[0]?.lotAddress, id: l.id, rn: l.receptionNumber,
                gongik: l.gongikOrder, biz: l.businessRegNo,
            })));

        const dump = JSON.stringify(saved);
        // 🚨 저장이 실제로 일어났는지 **먼저** 확인한다. `submitForm`이 조용히 중단되면
        //    결과가 시드와 같아 아래 단언이 전부 통과한다 (구조적으로 항상 참).
        expect(saved.length, `저장이 실행되지 않았다 (3건 그대로): ${dump}`).toBe(2);
        const p2 = saved.find((r) => r.lot === '내성리 200');
        const p1 = saved.find((r) => r.lot === '내성리 100');
        expect(p1, `필지1 레코드가 없다: ${dump}`).toBeTruthy();
        expect(p2, `필지2 레코드가 사라졌다: ${dump}`).toBeTruthy();
        // 🚨 핵심: 내성리 200이 남의 신원을 물려받으면 안 된다
        expect(p2 && p2.id, `필지2가 남의 id를 물려받았다: ${dump}`).toBe('ID-322');
        expect(p2 && p2.gongik, `공익직불제 값이 다른 지번에 붙었다: ${dump}`).toBe('B-1');
        expect(p2 && p2.biz, `사업자번호가 다른 지번에 붙었다: ${dump}`).toBe('333');
        expect(p1 && p1.id, `필지1이 첫 작물의 신원을 잇지 않았다: ${dump}`).toBe('ID-321');
        expect(new Set(saved.map((r) => r.id)).size, `id가 중복됐다: ${dump}`).toBe(saved.length);
    });
});
