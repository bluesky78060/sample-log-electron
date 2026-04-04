/**
 * 토양분석 의뢰목록 일괄 가져오기 스크립트
 * 사용법: 메인 프로젝트 Electron 앱의 토양 페이지에서 DevTools 콘솔에 붙여넣기
 *
 * 의뢰인: 이중용 / 봉화군 소천면 분천리 / 49건
 */
(async function importSoilData() {
    'use strict';

    const YEAR = '2026';
    const STORAGE_KEY = `soilSampleLogs_${YEAR}`;
    const FIRESTORE_COLLECTION = `soilSamples_${YEAR}`;
    const now = new Date().toISOString();
    const groupId = crypto.randomUUID();

    // 의뢰인 공통 정보
    const commonData = {
        date: '2026-02-11',
        name: '이중용',
        phoneNumber: '010-4517-4195',
        address: '충청남도 당진시 무수동1길 25-22',
        receptionMethod: '직접방문',
        note: '',
        createdAt: now,
        updatedAt: now
    };

    // PDF 데이터 (접수번호 순)
    const pdfData = [
        { no: '79',    lot: '279-2',  area: 3035.0,   crop: '작약',   cat: '밭' },
        { no: '79-1',  lot: '279-3',  area: 6036.0,   crop: '작약',   cat: '밭' },
        { no: '80',    lot: '264-1',  area: 7680.5,   crop: '참깨',   cat: '밭' },
        { no: '81',    lot: '273-3',  area: 1056.1,   crop: '고추',   cat: '밭' },
        { no: '82',    lot: '263',    area: 2512.0,   crop: '고추',   cat: '밭' },
        { no: '83',    lot: '266-4',  area: 572.7,    crop: '콩',     cat: '밭' },
        { no: '84',    lot: '266-2',  area: 499.4,    crop: '들깨',   cat: '밭' },
        { no: '85',    lot: '273-2',  area: 6728.3,   crop: '감자',   cat: '밭' },
        { no: '86',    lot: '273-1',  area: 14195.5,  crop: '고추',   cat: '밭' },
        { no: '87',    lot: '269',    area: 1724.8,   crop: '고추',   cat: '밭' },
        { no: '88',    lot: '272-3',  area: 6879.8,   crop: '단호박', cat: '밭' },
        { no: '89',    lot: '254-2',  area: 2359.0,   crop: '고추',   cat: '밭' },
        { no: '90',    lot: '511-5',  area: 986.7,    crop: '옥수수', cat: '밭' },
        { no: '91',    lot: '511',    area: 1518.0,   crop: '들깨',   cat: '밭' },
        { no: '91-1',  lot: '511-1',  area: 394.0,    crop: '들깨',   cat: '밭' },
        { no: '92',    lot: '511-3',  area: 2104.6,   crop: '수수',   cat: '밭' },
        { no: '93',    lot: '511-4',  area: 1989.7,   crop: '수수',   cat: '밭' },
        { no: '94',    lot: '510',    area: 2247.0,   crop: '고추',   cat: '밭' },
        { no: '94-1',  lot: '510-1',  area: 1170.0,   crop: '고추',   cat: '밭' },
        { no: '95',    lot: '521-1',  area: 452.5,    crop: '고추',   cat: '밭' },
        { no: '96',    lot: '510-2',  area: 1626.4,   crop: '벼',     cat: '논' },
        { no: '97',    lot: '512-3',  area: 1200.1,   crop: '고추',   cat: '밭' },
        { no: '98',    lot: '489-1',  area: 580.0,    crop: '고추',   cat: '밭' },
        { no: '99',    lot: '492',    area: 2806.1,   crop: '옥수수', cat: '밭' },
        { no: '100',   lot: '466-4',  area: 1579.8,   crop: '옥수수', cat: '밭' },
        { no: '101',   lot: '466-3',  area: 1491.5,   crop: '고추',   cat: '밭' },
        { no: '102',   lot: '472',    area: 477.2,    crop: '벼',     cat: '논' },
        { no: '103',   lot: '473-4',  area: 143.0,    crop: '고사리', cat: '밭' },
        { no: '104',   lot: '519-3',  area: 454.5,    crop: '마늘',   cat: '밭' },
        { no: '105',   lot: '557',    area: 888.2,    crop: '벼',     cat: '논' },
        { no: '106',   lot: '557-1',  area: 1653.3,   crop: '벼',     cat: '논' },
        { no: '107',   lot: '530',    area: 2835.8,   crop: '생강',   cat: '밭' },
        { no: '108',   lot: '556-14', area: 490.0,    crop: '고추',   cat: '밭' },
        { no: '109',   lot: '557-4',  area: 1059.3,   crop: '벼',     cat: '논' },
        { no: '110',   lot: '557-5',  area: 832.8,    crop: '벼',     cat: '논' },
        { no: '111',   lot: '557-7',  area: 761.0,    crop: '벼',     cat: '논' },
        { no: '112',   lot: '557-6',  area: 950.9,    crop: '벼',     cat: '논' },
        { no: '113',   lot: '557-8',  area: 872.3,    crop: '벼',     cat: '논' },
        { no: '114',   lot: '557-10', area: 470.0,    crop: '벼',     cat: '논' },
        { no: '115',   lot: '475-1',  area: 2794.1,   crop: '수수',   cat: '밭' },
        { no: '116',   lot: '475',    area: 3824.0,   crop: '벼',     cat: '논' },
        { no: '117',   lot: '496-1',  area: 978.7,    crop: '고추',   cat: '밭' },
        { no: '118',   lot: '500-4',  area: 6098.6,   crop: '고추',   cat: '밭' },
        { no: '118-1', lot: '500-5',  area: 6098.6,   crop: '고추',   cat: '밭' },
        { no: '119',   lot: '500-3',  area: 3156.0,   crop: '고추',   cat: '밭' },
        { no: '120',   lot: '500-2',  area: 3986.0,   crop: '고추',   cat: '밭' },
        { no: '121',   lot: '500-1',  area: 1872.0,   crop: '벼',     cat: '논' },
        { no: '122',   lot: '500',    area: 635.8,    crop: '벼',     cat: '논' },
        { no: '123',   lot: '850-3',  area: 1975.8,   crop: '벼',     cat: '논' }
    ];

    const totalParcels = pdfData.length;

    // ── 1단계: 기존 데이터 완전 삭제 ──────────────────

    // localStorage 삭제
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ localStorage 기존 데이터 삭제');

    // Firestore 오프라인 캐시의 기존 문서 삭제
    if (window.firebaseConfig?.isEnabled()) {
        try {
            const db = window.firebaseConfig.getDb();
            if (db) {
                console.log('🗑️ Firestore 캐시 기존 문서 삭제 중...');
                const snapshot = await db.collection(FIRESTORE_COLLECTION).get();
                if (!snapshot.empty) {
                    const BATCH_SIZE = 450;
                    let deletedCount = 0;
                    let batch = db.batch();
                    let batchCount = 0;

                    for (const doc of snapshot.docs) {
                        batch.delete(doc.ref);
                        batchCount++;
                        deletedCount++;

                        if (batchCount >= BATCH_SIZE) {
                            await batch.commit();
                            batch = db.batch();
                            batchCount = 0;
                        }
                    }

                    if (batchCount > 0) {
                        await batch.commit();
                    }
                    console.log(`🗑️ Firestore 캐시 ${deletedCount}건 삭제 완료`);
                } else {
                    console.log('ℹ️ Firestore 캐시에 기존 문서 없음');
                }
            }
        } catch (err) {
            console.warn('⚠️ Firestore 캐시 삭제 실패 (무시):', err.message);
        }
    }

    // ── 2단계: 새 데이터 생성 ──────────────────

    const newLogs = pdfData.map((item, index) => ({
        id: crypto.randomUUID(),
        receptionNumber: item.no,
        ...commonData,
        subCategory: item.cat,
        purpose: '일반재배',
        groupId,
        parcelIndex: index + 1,
        totalParcels,
        parcels: [{
            id: crypto.randomUUID(),
            lotAddress: `봉화군 소천면 분천리 ${item.lot}`,
            isMountain: false,
            subLots: [],
            crops: [{ name: item.crop, area: String(item.area), unit: 'm2' }],
            category: item.cat,
            purpose: '일반재배',
            note: ''
        }],
        lotAddress: `봉화군 소천면 분천리 ${item.lot}`,
        area: String(item.area),
        cropsDisplay: item.crop
    }));

    // 접수번호 순으로 정렬
    newLogs.sort((a, b) => {
        const numA = parseInt(a.receptionNumber) || 0;
        const numB = parseInt(b.receptionNumber) || 0;
        if (numA !== numB) return numA - numB;
        return (a.receptionNumber || '').localeCompare(b.receptionNumber || '');
    });

    // ── 3단계: 저장 ──────────────────

    // localStorage에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
    console.log(`💾 localStorage 저장 완료: ${newLogs.length}건`);

    // Firebase에도 저장
    if (window.firestoreDb?.isEnabled()) {
        try {
            console.log('☁️ Firebase에 새 데이터 저장 중...');
            await window.firestoreDb.batchSave('soil', parseInt(YEAR), newLogs);
            console.log('☁️ Firebase 저장 완료!');
        } catch (err) {
            console.warn('⚠️ Firebase 저장 실패 (오프라인?):', err.message);
        }
    }

    console.log(`✅ 완료! ${YEAR}년 토양 데이터: ${newLogs.length}건`);
    console.log('📌 주소 형식: 봉화군 소천면 분천리 xxx');
    alert(`저장 완료! ${newLogs.length}건\n페이지를 새로고침(F5)하세요.`);
})();
