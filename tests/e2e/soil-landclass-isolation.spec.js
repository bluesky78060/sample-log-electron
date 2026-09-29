// @ts-check
// SAMPL-1-178: 접수번호는 경지구분별 독립 시퀀스다 — '농가의뢰 5'와 '공익직불제 5'는 다른 농가 시료다.
// 번호만 보고 묶으면 완료 상태·흙토람 검정결과가 남의 시료로 번진다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;
const YEAR = '2026';

const log = (id, rn, landClass1) => ({
    id, receptionNumber: rn, name: '민원인-' + id, date: '2026-09-01',
    subCategory: '밭', landClass1, parcels: [],
});

async function openSoil(page) {
    page.on('dialog', (d) => d.accept().catch(() => {}));
    const res = await page.goto('/soil/');
    expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    await page.waitForFunction(() => {
        const m = /** @type {any} */ (window).soilManager;
        return !!m && !!m.tableBody && !!m.landClass1Select && m.landClass1Select.options.length > 0;
    }, null, { timeout: 15000 });
    expect(await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        '다른 프로젝트의 docs/를 검증하고 있다').toBe(EXPECTED_VERSION);
    await page.evaluate(() => {
        localStorage.clear();
        /** @type {any} */ (window).firebaseConfig = { isEnabled: () => false };
    });
}

test.describe('경지구분이 다른 같은 번호 시료 분리 (SAMPL-1-178)', () => {
    // 공익직불제 행을 누른다: 호출부가 경지구분을 안 넘기면 누락=농가의뢰로 읽혀 여기서 드러난다
    test('완료 버튼: 공익직불제 5 완료가 농가의뢰 5로 번지지 않는다', async ({ page }) => {
        await openSoil(page);
        const out = await page.evaluate((logs) => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs = logs;
            mgr.currentSearchFilter.landClass1 = '';   // 전체 경지구분 표시
            mgr.filterAndRenderLogs();
            const btn = /** @type {HTMLElement} */ (mgr.tableBody.querySelector('.btn-complete[data-id="b"]'));
            if (!btn) return { error: '공익직불제 5 행의 완료 버튼이 그려지지 않았다' };
            btn.click();
            return Object.fromEntries(mgr.sampleLogs.map((l) => [l.id, !!l.isComplete]));
        }, [log('a', '5', '농가의뢰'), log('a1', '5-1', undefined),
            log('b', '5', '공익직불제'), log('b1', '5-1', '공익직불제')]);
        // b1은 같은 그룹이라 함께 완료돼야 한다 — 연동 자체가 죽었는지 가린다
        expect(out).toEqual({ a: false, a1: false, b: true, b1: true });
    });

    test('연속 신규 등록: 두 번째 등록의 경지구분이 기본값(농가의뢰)이다', async ({ page }) => {
        await openSoil(page);
        const submit = (landClass1) => page.evaluate(async (lc) => {
            const mgr = /** @type {any} */ (window).soilManager;
            const set = (id, v) => {
                const el = /** @type {any} */ (document.getElementById(id));
                if (el) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }
            };
            set('name', '홍길동');
            set('phoneNumber', '010-1234-5678');
            set('subCategory', '밭');
            if (lc !== null) set('landClass1', lc);   // null = 사용자가 건드리지 않음
            mgr.parcels[0].lotAddress = '문단리 224';
            mgr.parcels[0].crops = [{ name: '고추', area: '100' }];
            await mgr.submitForm();
            return mgr.landClass1Select.value;
        }, landClass1);

        const afterFirst = await submit('대표필지');
        const afterSecond = await submit(null);
        const stored = await page.evaluate(() =>
            /** @type {any} */ (window).soilManager.sampleLogs.map((l) => l.landClass1));

        expect.soft(afterFirst, '첫 등록 후 폼 경지구분이 기본값으로 돌아오지 않았다').toBe('농가의뢰');
        expect.soft(stored, '두 번째 등록이 기본값이 아닌 경지구분으로 저장됐다').toEqual(['대표필지', '농가의뢰']);
        expect(afterSecond).toBe('농가의뢰');
    });

    test('흙토람: 검정결과 입력이 다른 경지구분의 같은 번호로 번지지 않는다', async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const logs = [
            log('a', '5', '농가의뢰'),
            log('a1', '5-1', undefined),        // 같은 그룹(양성 대조)
            log('b', '5', '공익직불제'),
            log('f', 'F5', '농가의뢰'),         // 성토 — 번호가 같아도 별개
        ];
        await page.addInitScript(({ year, l }) => {
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify(l));
            localStorage.setItem('heuktoram_year', year);
        }, { year: YEAR, l: logs });
        const res = await page.goto('/heuktoram/');
        expect(res && res.status(), 'docs/heuktoram/ 없음 — `npm run build` 먼저').toBeLessThan(400);
        await page.waitForFunction(() => {
            const m = /** @type {any} */ (window).heuktoramManager;
            return !!m && Array.isArray(m.flatRows) && m.flatRows.length === 4;
        }, null, { timeout: 15000 });
        expect(await page.evaluate(() => /** @type {any} */ (window).APP_VERSION)).toBe(EXPECTED_VERSION);

        const out = await page.evaluate((year) => {
            const mgr = /** @type {any} */ (window).heuktoramManager;
            mgr.handleCellEdit('a_0_0', 'pH', '6.5');
            const ls = JSON.parse(localStorage.getItem(`soilTestResults_${year}`) || '{}');
            return Object.fromEntries(['a', 'a1', 'b', 'f'].map((id) => [id, ls[`${id}_0_0`]?.pH ?? null]));
        }, YEAR);
        expect(out).toEqual({ a: '6.5', a1: '6.5', b: null, f: null });
    });
});
