# SAMPL-1-150 Discovery — 의존성 21개 업그레이드 검증

- 티켓: SAMPL-1-150 (P1) / 작성일 2026-08-11
- 방향 확정: 사용자 "유지 및 검증해줘" (2026-08-11) — 되돌리기 대신 (b) 검증 선택
- 선행: SAMPL-2-25 코드 리뷰 MAJOR-1

## 배경

lock 크로스플랫폼 재생성(a965add)의 부작용으로 직접 의존성 **21개**가 올라가 이미 배포됐다.
작성자는 커밋·PR·리뷰 문서에 "3건(vitest/vite/jsdom)"으로 기록했다 — **보고 오류**다.

배포 증거: `docs/assets/firestore-db-NiGNGICL.js`에 `"12.17.1"` 포함(구 파일 `Bn0rOZ0g` = 12.7.0).

## 검증이 필요한 고위험 3종

| 패키지 | 변경 | 왜 위험한가 | 기존 검증이 못 잡는 이유 |
|---|---|---|---|
| `firebase` | 12.7.0 → 12.17.1 (Firestore 4.9.3 → 4.17.0, 8마이너) | IndexedDB 오프라인 쓰기 + 연도별 컬렉션 싱크에 의존 | 단위는 jsdom 목, E2E는 정적 `docs/` 대상 |
| `electron-updater` | 6.6.2 → 6.8.9 | 깨지면 배포된 클라이언트를 새 릴리스로 고칠 수 없다(회복 불가) | 어느 테스트도 실행하지 않음 |
| `@electron-forge/*` | 7.10.2 → 7.11.2 (8패키지) | Squirrel 설치본·ASAR 무결성·fuses | `npm run make` 미실행 |

`forge.config.js:76-84`가 설정하는 fuses 6종이 산출물에 그대로 적용돼야 한다:
`RunAsNode:false` · `EnableCookieEncryption:true` · `EnableNodeOptionsEnvironmentVariable:false` ·
`EnableNodeCliInspectArguments:false` · `EnableEmbeddedAsarIntegrityValidation:true` · `OnlyLoadAppFromAsar:true`

## 검증 계획

1. **`npm run make`** — macOS에서는 zip maker가 돈다(Squirrel은 Windows 전용 → CI 확인 필요).
   산출물이 나오는지, 빌드가 깨지지 않는지 확인.
2. **fuses 실측** — `npx @electron/fuses read`로 패키징된 앱의 실제 fuse 값을 읽어 6종 대조.
   설정 파일이 아니라 **산출물**을 본다.
3. **Electron 앱 실행** — Firestore·electron-updater 초기화 경로가 예외 없이 지나가는지 콘솔로 확인.
4. **배포된 웹 버전** — Playwright로 열어 firebase 12.17.1 번들이 초기화되고 콘솔 오류가 없는지 확인.

## 한계 (미리 명시)

- **Firestore 실계정 쓰기/읽기는 하지 않는다.** 운영 자격이 필요하고 실데이터에 영향을 준다.
  대신 SDK 초기화·오프라인 지속성 활성화 경로가 예외 없이 통과하는지까지 확인한다.
  실계정 스모크는 사용자가 직접 수행할 항목으로 남긴다.
- **Windows Squirrel 설치본은 macOS에서 만들 수 없다.** 다음 태그 푸시 시 GitHub Actions에서 확인된다.
- `electron-updater`의 실제 업데이트 흐름은 새 릴리스가 있어야 검증된다 — 초기화까지만 확인한다.

## 어느 쪽이든 필요한 조치

`typescript`·`@playwright/test`에 적용한 "게이트 도구는 부동 버전이면 안 된다" 근거는
CI가 검증할 수 없는 `firebase`·`electron`·`electron-updater`·`@electron-forge/*`에 **더 강하게** 적용된다.
검증 통과 후에도 이 4종을 정확 버전으로 고정한다.
