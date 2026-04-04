/**
 * 토양 2025년 실제 데이터를 테스트 컬렉션으로 복사
 * 사용법: 메인 프로젝트 Electron 앱의 토양 페이지에서 DevTools 콘솔에 붙여넣기
 *
 * Source: soilSamples_2025
 * Target: test_soilSamples_2026
 */
(async function copySoilDataToTest() {
    'use strict';

    const SOURCE_COLLECTION = 'soilSamples_2025';
    const TARGET_COLLECTION = 'test_soilSamples_2026';
    const BATCH_SIZE = 200;

    console.log('📋 토양 데이터 복사 스크립트 시작');
    console.log(`📥 Source: ${SOURCE_COLLECTION}`);
    console.log(`📤 Target: ${TARGET_COLLECTION}`);

    // ── 1단계: Firebase 활성화 확인 ──────────────────
    if (!window.firebaseConfig?.isEnabled()) {
        const error = '❌ Firebase가 비활성화 상태입니다. Firebase 연결이 필요합니다.';
        console.error(error);
        alert(error);
        return;
    }

    const db = window.firebaseConfig.getDb();
    if (!db) {
        const error = '❌ Firestore DB 인스턴스를 가져올 수 없습니다.';
        console.error(error);
        alert(error);
        return;
    }

    console.log('✅ Firebase 연결 확인');

    // ── 2단계: 원본 데이터 읽기 ──────────────────
    console.log(`📖 ${SOURCE_COLLECTION} 데이터 읽는 중...`);

    let sourceSnapshot;
    try {
        sourceSnapshot = await db.collection(SOURCE_COLLECTION).get();
    } catch (err) {
        const error = `❌ 원본 컬렉션 읽기 실패: ${err.message}`;
        console.error(error, err);
        alert(error);
        return;
    }

    if (sourceSnapshot.empty) {
        const message = `ℹ️ ${SOURCE_COLLECTION}에 데이터가 없습니다.`;
        console.warn(message);
        alert(message);
        return;
    }

    const sourceDocs = sourceSnapshot.docs;
    const totalDocs = sourceDocs.length;
    console.log(`📊 읽기 완료: ${totalDocs}건`);

    // ── 3단계: 사용자 확인 ──────────────────
    const confirmMessage = `${SOURCE_COLLECTION}에서 ${totalDocs}건의 문서를 ${TARGET_COLLECTION}로 복사합니다.\n\n계속하시겠습니까?`;
    if (!confirm(confirmMessage)) {
        console.log('❌ 사용자가 취소했습니다.');
        return;
    }

    // ── 4단계: 대상 컬렉션에 배치 쓰기 ──────────────────
    console.log(`📝 ${TARGET_COLLECTION}에 쓰기 시작...`);

    const now = new Date().toISOString();
    let batch = db.batch();
    let batchCount = 0;
    let totalWritten = 0;
    let batchNumber = 1;

    try {
        for (const doc of sourceDocs) {
            const originalData = doc.data();
            const newId = crypto.randomUUID();

            // 새 문서 데이터: 모든 필드 유지하되 id와 타임스탬프만 업데이트
            // syncedAt은 제거 (새로 동기화될 때 다시 설정됨)
            const { syncedAt, ...restData } = originalData;
            const newData = {
                ...restData,
                id: newId,
                createdAt: now,
                updatedAt: now
            };

            const newDocRef = db.collection(TARGET_COLLECTION).doc(newId);
            batch.set(newDocRef, newData);
            batchCount++;
            totalWritten++;

            // 배치 크기 도달 시 커밋
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                console.log(`✅ Batch ${batchNumber} 완료: ${batchCount}건 (누적: ${totalWritten}/${totalDocs})`);
                batch = db.batch();
                batchCount = 0;
                batchNumber++;
            }
        }

        // 남은 배치 커밋
        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Batch ${batchNumber} 완료: ${batchCount}건 (누적: ${totalWritten}/${totalDocs})`);
        }

    } catch (err) {
        const error = `❌ 배치 쓰기 실패 (${totalWritten}/${totalDocs} 완료): ${err.message}`;
        console.error(error, err);
        alert(error);
        return;
    }

    // ── 5단계: 완료 메시지 ──────────────────
    const summary = `
✅ 복사 완료!

📥 Source: ${SOURCE_COLLECTION}
📤 Target: ${TARGET_COLLECTION}
📊 총 문서 수: ${totalWritten}건
🕐 완료 시각: ${new Date().toLocaleString('ko-KR')}
    `.trim();

    console.log(summary);
    alert(summary);

    console.log('💡 페이지를 새로고침하여 복사된 데이터를 확인할 수 있습니다.');
})();
