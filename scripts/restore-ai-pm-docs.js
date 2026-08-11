#!/usr/bin/env node
/**
 * AI PM 워크플로우 문서 복원 (SAMPL-2-23)
 *
 * docs/는 Vite emptyOutDir 산출물이라 빌드마다 비워진다. 그런데 AI PM 워크플로우 훅이
 * docs/ 경로에 산출물이 있는지 검사한다:
 *   ~/.claude/hooks/plan-review-guard.sh  → docs/00-discovery, docs/01-plan, docs/02-review
 *   ~/.claude/hooks/codex-review-guard.sh → docs/03-code-review
 * 그래서 빌드 후 매번 손으로 복원해 왔다. 이 스크립트가 그 일을 대신한다.
 *
 * 원본은 docs-internal/ai-pm/{티켓}/ 이며 git이 추적한다(빌드 영향 없음).
 * docs/ 사본은 훅 통과용 파생물이다.
 *
 * 매핑:
 *   {티켓}-direction.md   → docs/00-discovery/
 *   {티켓}-plan.md        → docs/01-plan/
 *   {티켓}-plan-review.md → docs/02-review/
 *   {티켓}-review.md      → docs/03-code-review/
 *
 * 사용: node scripts/restore-ai-pm-docs.js   (npm run build 마지막 단계에서 자동 실행)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_ROOT = path.join(ROOT, 'docs-internal', 'ai-pm');

// 접미사 → 대상 디렉터리. 긴 접미사를 먼저 검사해야 한다 —
// '-review.md'가 '-plan-review.md'의 부분 문자열이라 순서가 뒤바뀌면 플랜 리뷰가 03으로 간다.
const ROUTES = [
    { suffix: '-direction.md', dir: 'docs/00-discovery' },
    { suffix: '-plan-review.md', dir: 'docs/02-review' },
    { suffix: '-plan.md', dir: 'docs/01-plan' },
    { suffix: '-review.md', dir: 'docs/03-code-review' },
];

function main() {
    if (!fs.existsSync(SOURCE_ROOT)) {
        // 원본이 없으면 복원할 것도 없다 (신규 클론 등) — 빌드를 막지 않는다.
        console.log('[restore-ai-pm-docs] docs-internal/ai-pm 없음, 건너뜁니다');
        return;
    }

    let copied = 0;
    const perDir = {};

    for (const ticketDir of fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })) {
        if (!ticketDir.isDirectory()) continue;
        const ticketPath = path.join(SOURCE_ROOT, ticketDir.name);

        for (const entry of fs.readdirSync(ticketPath, { withFileTypes: true })) {
            if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

            const route = ROUTES.find(r => entry.name.endsWith(r.suffix));
            if (!route) {
                // 조용히 건너뛰면 며칠 뒤 훅이 "산출물 없음"으로 차단할 때 원인을 못 찾는다
                console.warn(`  ⚠️  라우팅 규칙 없음, 건너뜀: ${ticketDir.name}/${entry.name}`);
                continue;
            }

            const targetDir = path.join(ROOT, route.dir);
            fs.mkdirSync(targetDir, { recursive: true });
            fs.copyFileSync(path.join(ticketPath, entry.name), path.join(targetDir, entry.name));
            copied++;
            perDir[route.dir] = (perDir[route.dir] || 0) + 1;
        }
    }

    const summary = Object.entries(perDir).map(([d, n]) => `${d}: ${n}`).join(', ');
    console.log(`[restore-ai-pm-docs] ${copied}개 복원${summary ? ` (${summary})` : ''}`);
}

main();
