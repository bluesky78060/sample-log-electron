#!/usr/bin/env node
/**
 * docs/ 자산 참조 정합성 검사 (SAMPL-2-22)
 *
 * docs/**\/*.html이 참조하는 로컬 자산(.js/.css/이미지/폰트)이 실제로 존재하는지 확인한다.
 * GitHub Pages는 main 브랜치의 /docs를 직접 서빙하므로(gh api .../pages 확인),
 * 참조가 어긋난 채 main에 push되면 웹 앱 스크립트가 404가 된다.
 * 실제로 v1.17.7(36acadb)이 이 상태로 배포됐고 아무도 알아채지 못했다.
 *
 * 사용:
 *   node scripts/check-docs-assets.js                     # 워킹트리 docs/ 검사
 *   node scripts/check-docs-assets.js --dir=/tmp/x/docs   # 임의 디렉터리(커밋 트리 추출본) 검사
 *
 * 종료 코드:
 *   0 = 누락 없음 / 1 = 참조 누락 발견 / 2 = 환경·사용법 오류(대상 없음, 인자 오류 등)
 *   훅은 1만 차단 근거로 삼는다 — 2를 "자산 깨짐"으로 번역하면 오해 메시지가 나온다.
 *
 * 한계 (의도된 비범위):
 *   - HTML에서 참조되지 않는 동적 import() 청크는 검출하지 않는다.
 *     Vite가 엔트리의 정적 청크 그래프 전체에 modulepreload를 찍는다는 전제에 의존한다.
 *   - CSS url() 내부 자산은 검사하지 않는다 (현재 로컬 대상 1건, 폰트 열화 수준).
 *   - JS 파일 내부는 스캔하지 않는다. 번들에 실행되지 않는 UMD 폴백
 *     require("./mrl-name-canon.js")가 남아 있어 즉시 오탐이 난다.
 *   - 참조되지 않는 고아 자산(낡은 번들)은 검사하지 않는다 — 런타임 영향이 0이고 소음만 늘린다.
 *   - 완전히 낡은 docs/(자기 일관적이지만 구 src/로 빌드됨)는 잡지 못한다. 의도된 절제다 —
 *     빌드를 강제하면 오탐이 폭발해 훅이 무력화된다.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 선행 경계 필수 — 없으면 data-src=, data-href=, xlink:href= 까지 걸려 오탐이 난다.
const REF_PATTERN = /(?:^|[\s"'`])(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const EXTERNAL_PREFIXES = ['http://', 'https://', '//', 'data:', '#', 'mailto:', 'javascript:', 'tel:'];
// Vite 해시 산출물은 확장자와 무관하게 부분 갱신 시 같은 방식으로 깨진다.
const ASSET_EXT = /\.(?:js|mjs|css|png|jpe?g|svg|ico|webp|woff2?)$/i;

const EXIT_MISSING = 1;
const EXIT_USAGE = 2;

function parseArgs(argv) {
    let dir = 'docs';
    for (const arg of argv) {
        if (arg.startsWith('--dir=')) {
            dir = arg.slice('--dir='.length);
            if (!dir) return { error: '--dir= 뒤에 경로가 없습니다.' };
        } else {
            // 조용히 무시하면 --dir /tmp/x (등호 누락) 같은 오타에서 워킹트리를 검사해 통과한다.
            return { error: `알 수 없는 인자: ${arg} (사용법: --dir=<경로>)` };
        }
    }
    return { dir };
}

function collectHtmlFiles(dir, acc = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        // isDirectory()는 심볼릭 링크를 따라가지 않으므로 순환 위험이 없다.
        if (entry.isDirectory()) collectHtmlFiles(full, acc);
        else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
    }
    return acc;
}

/** HTML 1개에서 검사 대상 로컬 자산 참조를 추출 */
function extractLocalAssetRefs(html) {
    const refs = new Set();
    for (const match of html.matchAll(REF_PATTERN)) {
        const raw = (match[1] ?? match[2] ?? '').trim();
        if (!raw || EXTERNAL_PREFIXES.some(p => raw.startsWith(p))) continue;
        // 쿼리스트링·프래그먼트 제거 후 확장자를 본다 (assets/x.js?v=2 형태 대응)
        const url = raw.replace(/[?#].*$/, '');
        if (!url || !ASSET_EXT.test(url)) continue;
        refs.add(url);
    }
    return [...refs];
}

/**
 * 대소문자를 구분해 존재를 확인한다.
 * macOS 기본 파일시스템은 대소문자를 무시하므로 fs.existsSync만으로는
 * 배포 대상(Linux)에서 404가 되는 참조를 통과시킨다.
 */
function existsCaseSensitive(absPath) {
    const dir = path.dirname(absPath);
    const base = path.basename(absPath);
    try {
        return fs.readdirSync(dir).includes(base);
    } catch {
        return false;
    }
}

function main() {
    const { dir: targetDir, error } = parseArgs(process.argv.slice(2));
    if (error) {
        console.error(`[!] ${error}`);
        process.exitCode = EXIT_USAGE;
        return;
    }

    if (!fs.existsSync(targetDir)) {
        console.error(`[!] 검사 대상 디렉터리가 없습니다: ${targetDir}`);
        process.exitCode = EXIT_USAGE;
        return;
    }

    const rootPrefix = path.resolve(targetDir) + path.sep;
    let htmlFiles;
    try {
        htmlFiles = collectHtmlFiles(targetDir);
    } catch (e) {
        console.error(`[!] 디렉터리를 읽을 수 없습니다: ${targetDir} (${e.message})`);
        process.exitCode = EXIT_USAGE;
        return;
    }

    const missing = [];
    const outside = [];
    let totalRefs = 0;

    for (const htmlFile of htmlFiles) {
        const html = fs.readFileSync(htmlFile, 'utf8');
        const relHtml = path.relative(targetDir, htmlFile);
        for (const ref of extractLocalAssetRefs(html)) {
            totalRefs++;
            const resolved = path.resolve(path.dirname(htmlFile), ref);
            // 배포 루트를 벗어난 참조는 파일이 로컬에 있어도 Pages에서는 404다.
            if (!resolved.startsWith(rootPrefix)) {
                outside.push({ html: relHtml, ref });
                continue;
            }
            if (!existsCaseSensitive(resolved)) missing.push({ html: relHtml, ref });
        }
    }

    // ── DOMPurify 커버리지 (SAMPL-2-34) ──
    // `sanitizeHTML`은 DOMPurify가 없으면 마크업을 통째로 이스케이프해 화면에 태그가
    // 글자로 나온다. 예전에 13페이지 중 6곳에 `import DOMPurify`가 없었고, 그 페이지들이
    // 마침 `sanitizeHTML`을 호출하지 않아 **드러나지 않았을 뿐**이었다.
    //
    // E2E에도 검사가 있지만(`tests/e2e/dompurify-coverage.spec.js`) 그쪽은 페이지 목록이
    // 하드코딩이라 **새 페이지가 늘면 조용히 빠진다.** 여기는 `docs/`의 HTML을 전부 훑으므로
    // 새 페이지가 자동으로 들어오고, 필수 CI라서 브라우저 없이 100ms 안에 막는다.
    const purifyGaps = [];
    for (const htmlFile of htmlFiles) {
        const html = fs.readFileSync(htmlFile, 'utf8');
        const relHtml = path.relative(targetDir, htmlFile);
        const refs = [...extractLocalAssetRefs(html)].filter((r) => r.endsWith('.js'));
        if (refs.length === 0) continue;   // manual·release는 JS를 싣지 않는다

        let usesSanitize = false;
        let exposesGlobal = false;
        for (const ref of refs) {
            const resolved = path.resolve(path.dirname(htmlFile), ref);
            if (!existsCaseSensitive(resolved)) continue;
            const code = fs.readFileSync(resolved, 'utf8');
            // `sanitizeHTML`을 전역에 노출하는 청크가 실려 있는가
            if (code.includes('window.sanitizeHTML')) usesSanitize = true;
            // DOMPurify가 **전역에 노출**되는가.
            // ⚠️ 라이브러리가 번들에 있는지만 보면 안 된다 — `import`는 남기고
            //    `window.DOMPurify = ...` 대입만 지우는 변이가 그 검사를 통과했다(실측).
            //    `sanitizeHTML`은 전역을 읽으므로 **대입**이 있어야 동작한다.
            //    minify 후에도 `window.DOMPurify=` 형태는 유지된다(실측: `window.DOMPurify=x`).
            if (/window\.DOMPurify\s*=/.test(code)) exposesGlobal = true;
        }
        if (usesSanitize && !exposesGlobal) purifyGaps.push(relHtml);
    }

    // 참조 총계는 빌드마다 달라지므로 참고 출력일 뿐 — 합격 조건은 "누락 0건"이다.
    console.log(`docs 자산 참조 검사: HTML ${htmlFiles.length}개, 참조 ${totalRefs}건 (대상: ${targetDir})`);

    if (purifyGaps.length > 0) {
        console.error(`\n[X] sanitizeHTML을 싣고도 DOMPurify가 없는 페이지: ${purifyGaps.length}건\n`);
        for (const h of purifyGaps) console.error(`  ${h}`);
        console.error('\n원인: 그 페이지의 entry에 `import DOMPurify`가 없습니다.');
        console.error("해결: entry에 `import DOMPurify from 'dompurify';` + `window.DOMPurify = DOMPurify;` (SAMPL-2-34)\n");
        process.exitCode = EXIT_MISSING;
        return;
    }

    if (missing.length === 0 && outside.length === 0) {
        console.log('[OK] 누락 0건');
        return;
    }

    if (missing.length > 0) {
        console.error(`\n[X] 존재하지 않는 자산을 참조합니다: ${missing.length}건\n`);
        for (const { html, ref } of missing) console.error(`  ${html} → ${ref}`);
    }
    if (outside.length > 0) {
        console.error(`\n[X] 배포 루트(${targetDir}) 밖을 참조합니다 — Pages에서 404가 됩니다: ${outside.length}건\n`);
        for (const { html, ref } of outside) console.error(`  ${html} → ${ref}`);
    }

    console.error('\n원인: docs/가 부분적으로만 갱신되었습니다 (빌드 산출물 일부만 커밋 등).');
    console.error('해결: npm run build 후 docs/ 전체를 한 커밋에 포함하세요.');
    console.error('      git add -A docs/ && git status --short docs/   # D/?? 가 0건이어야 합니다\n');
    process.exitCode = EXIT_MISSING;
}

main();
