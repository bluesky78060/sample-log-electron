#!/usr/bin/env node
/**
 * 버전 동기화 스크립트
 * package.json의 version을 모든 관련 파일에 반영
 *
 * 동기화 대상:
 * 1. src/shared/constants.js → APP_VERSION
 * 2. src/index.html → #appVersion 텍스트
 * 3. src/manual/index.html → version-badge, footer 버전
 * 4. package-lock.json → version, packages[""].version (SAMPL-2-23)
 */

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.version;
const vPrefix = `v${version}`;

console.log(`[sync-version] 버전 동기화 시작: ${version}`);

let updated = 0;

// 1. src/shared/constants.js — APP_VERSION
const constantsPath = path.join(__dirname, '..', 'src', 'shared', 'constants.js');
if (fs.existsSync(constantsPath)) {
    let content = fs.readFileSync(constantsPath, 'utf8');
    const before = content;
    content = content.replace(/APP_VERSION\s*[:=]\s*'[^']*'/, `APP_VERSION = '${version}'`);
    if (content !== before) {
        fs.writeFileSync(constantsPath, content);
        console.log(`  ✅ constants.js → ${version}`);
        updated++;
    } else {
        console.log(`  ⏭️  constants.js (이미 최신)`);
    }
}

// 2. src/index.html — <p ... id="appVersion">v*.*.*</p>
const indexPath = path.join(__dirname, '..', 'src', 'index.html');
if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    const before = content;
    content = content.replace(
        /(<p[^>]*id="appVersion"[^>]*>)v[\d.]+(<\/p>)/,
        `$1${vPrefix}$2`
    );
    if (content !== before) {
        fs.writeFileSync(indexPath, content);
        console.log(`  ✅ index.html → ${vPrefix}`);
        updated++;
    } else {
        console.log(`  ⏭️  index.html (이미 최신)`);
    }
}

// 3. src/manual/index.html — version-badge + footer
const manualPath = path.join(__dirname, '..', 'src', 'manual', 'index.html');
if (fs.existsSync(manualPath)) {
    let content = fs.readFileSync(manualPath, 'utf8');
    const before = content;

    // version-badge: v*.*.* - YYYY년 M월 업데이트
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    content = content.replace(
        /(<span class="version-badge">)v[\d.]+ - \d{4}년 \d{1,2}월 업데이트(<\/span>)/,
        `$1${vPrefix} - ${year}년 ${month}월 업데이트$2`
    );

    // footer: 시료 접수 대장 v*.*.*
    content = content.replace(
        /(시료 접수 대장 )v[\d.]+/,
        `$1${vPrefix}`
    );

    if (content !== before) {
        fs.writeFileSync(manualPath, content);
        console.log(`  ✅ manual/index.html → ${vPrefix}`);
        updated++;
    } else {
        console.log(`  ⏭️  manual/index.html (이미 최신)`);
    }
}

// 4. package-lock.json — version + packages[""].version (SAMPL-2-23)
//    정규식 대신 JSON 파싱으로 처리한다. lock은 수만 줄이고 의존성마다 "version" 키가
//    있어 정규식 치환은 엉뚱한 패키지를 건드릴 위험이 있다.
//    npm 관례대로 들여쓰기 2칸 + 끝 개행을 보존해 diff를 최소화한다.
const lockPath = path.join(__dirname, '..', 'package-lock.json');
if (fs.existsSync(lockPath)) {
    const raw = fs.readFileSync(lockPath, 'utf8');
    try {
        const lock = JSON.parse(raw);
        let changed = false;

        if (lock.version !== version) {
            lock.version = version;
            changed = true;
        }
        if (lock.packages && lock.packages[''] && lock.packages[''].version !== version) {
            lock.packages[''].version = version;
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
            console.log(`  ✅ package-lock.json → ${version}`);
            updated++;
        } else {
            console.log(`  ⏭️  package-lock.json (이미 최신)`);
        }
    } catch (e) {
        // lock이 깨져 있으면 버전 동기화가 아니라 의존성 문제다 — 빌드를 막지 않고 알린다.
        console.warn(`  ⚠️  package-lock.json 파싱 실패, 건너뜁니다: ${e.message}`);
    }
}

console.log(`[sync-version] 완료: ${updated}개 파일 업데이트, 버전 ${version}`);
