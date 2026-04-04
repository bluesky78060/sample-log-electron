/**
 * 수질/퇴액비/중금속/잔류농약 데이터를 테스트 컬렉션으로 복사
 * 사용법: 메인 프로젝트 Electron 앱에서 DevTools 콘솔에 붙여넣기
 *
 * Source: {type}Samples_{year} (메인 컬렉션)
 * Target: test_{type}Samples_{year} (테스트 컬렉션)
 */
(async function copyAllDataToTest() {
    'use strict';

    const SAMPLE_TYPES = [
        { type: 'water', name: '수질분석', collection: 'waterSamples' },
        { type: 'compost', name: '퇴·액비', collection: 'compostSamples' },
        { type: 'heavyMetal', name: '토양 중금속', collection: 'heavyMetalSamples' },
        { type: 'pesticide', name: '잔류농약', collection: 'pesticideSamples' }
    ];

    const YEARS = [2025, 2026];
    const BATCH_SIZE = 200;

    console.log('📋 전체 데이터 복사 스크립트 시작');
    console.log('━'.repeat(50));

    // Firebase 확인
    if (!window.firebaseConfig?.isEnabled()) {
        console.error('❌ Firebase가 비활성화 상태입니다.');
        alert('❌ Firebase 연결이 필요합니다.');
        return;
    }

    const db = window.firebaseConfig.getDb();
    if (!db) {
        console.error('❌ Firestore DB를 가져올 수 없습니다.');
        alert('❌ Firestore DB를 가져올 수 없습니다.');
        return;
    }

    console.log('✅ Firebase 연결 확인\n');

    const results = [];

    for (const sampleType of SAMPLE_TYPES) {
        for (const year of YEARS) {
            const source = `${sampleType.collection}_${year}`;
            const target = `test_${sampleType.collection}_${year}`;

            console.log(`\n📥 ${sampleType.name} ${year}년: ${source} → ${target}`);

            // 원본 읽기
            let sourceSnapshot;
            try {
                sourceSnapshot = await db.collection(source).get();
            } catch (err) {
                console.warn(`  ⚠️ ${source} 읽기 실패:`, err.message);
                continue;
            }

            if (sourceSnapshot.empty) {
                console.log(`  ℹ️ ${source}: 데이터 없음 - 건너뜀`);
                continue;
            }

            const totalDocs = sourceSnapshot.docs.length;
            console.log(`  📊 ${totalDocs}건 발견`);

            // 대상에 이미 데이터가 있는지 확인
            try {
                const targetSnapshot = await db.collection(target).limit(1).get();
                if (!targetSnapshot.empty) {
                    console.log(`  ⚠️ ${target}: 이미 데이터 존재 - 건너뜀`);
                    results.push({ type: sampleType.name, year, status: '건너뜀 (이미 존재)', count: 0 });
                    continue;
                }
            } catch (err) {
                // 컬렉션이 없으면 계속 진행
            }

            // 배치 쓰기
            const now = new Date().toISOString();
            let batch = db.batch();
            let batchCount = 0;
            let totalWritten = 0;

            try {
                for (const doc of sourceSnapshot.docs) {
                    const originalData = doc.data();
                    const newId = crypto.randomUUID();

                    const { syncedAt, ...restData } = originalData;
                    const newData = {
                        ...restData,
                        id: newId,
                        createdAt: now,
                        updatedAt: now
                    };

                    batch.set(db.collection(target).doc(newId), newData);
                    batchCount++;
                    totalWritten++;

                    if (batchCount >= BATCH_SIZE) {
                        await batch.commit();
                        console.log(`  ✅ Batch 커밋: ${totalWritten}/${totalDocs}`);
                        batch = db.batch();
                        batchCount = 0;
                    }
                }

                if (batchCount > 0) {
                    await batch.commit();
                }

                console.log(`  ✅ 완료: ${totalWritten}건 복사됨`);
                results.push({ type: sampleType.name, year, status: '완료', count: totalWritten });

            } catch (err) {
                console.error(`  ❌ 쓰기 실패:`, err.message);
                results.push({ type: sampleType.name, year, status: '실패', count: totalWritten });
            }
        }
    }

    // 결과 요약
    console.log('\n' + '━'.repeat(50));
    console.log('📊 복사 결과 요약:');
    let totalCopied = 0;
    for (const r of results) {
        console.log(`  ${r.type} ${r.year}년: ${r.status} ${r.count > 0 ? `(${r.count}건)` : ''}`);
        totalCopied += r.count;
    }
    console.log(`\n  📊 총 ${totalCopied}건 복사 완료`);
    console.log('💡 테스트 프로젝트에서 페이지를 새로고침하여 확인하세요.');

    alert(`복사 완료!\n총 ${totalCopied}건이 test_ 컬렉션으로 복사되었습니다.`);
})();
