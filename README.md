# 시료 접수 대장 (Sample Log)

봉화군 농업기술센터 농업 시료 접수·관리 시스템. **Electron 데스크톱 앱**과 **웹 앱**(GitHub Pages) 듀얼 환경으로 제공됩니다.

토양 · 수질 · 잔류농약 · 퇴/액비 · 중금속 5종 시료의 접수, 관리, 조회, 엑셀 가져오기/내보내기, Firebase 동기화, 라벨 인쇄를 지원합니다.

## ⬇️ 다운로드

[![최신 버전 다운로드](https://img.shields.io/badge/⬇️_최신_버전_다운로드-Windows-22c55e?style=for-the-badge)](https://github.com/bluesky78060/sample-log-electron/releases/latest/download/sample-log-setup.exe)

**Windows 데스크톱 설치 파일**

```
https://github.com/bluesky78060/sample-log-electron/releases/latest/download/sample-log-setup.exe
```

> 위 링크는 **고정 주소**입니다. 새 버전이 출시되어도 주소가 바뀌지 않으며, 항상 최신 릴리즈의 설치 파일로 연결됩니다. (안내문·즐겨찾기에 그대로 사용하세요.)

설치 후에는 **자동 업데이트**가 동작하므로, 새 버전이 나오면 앱 실행 중 알림을 통해 업데이트할 수 있습니다.

### 웹 버전 (설치 불필요)

브라우저에서 바로 사용: **https://bluesky78060.github.io/sample-log-electron/**

## 개발

```bash
npm start            # Electron 실행
npm run dev          # Vite 웹 서버 (localhost:3000)
npm run dev:electron # Electron + Vite 동시 실행
npm run build        # Tailwind + Vite 빌드 → docs/
npm test             # Playwright E2E
npm run test:unit    # vitest 단위 테스트
```

자세한 아키텍처·개발 가이드는 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.

## 라이선스

봉화군 농업기술센터 내부용.
