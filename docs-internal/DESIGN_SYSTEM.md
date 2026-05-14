# 시료접수대장 디자인 시스템 문서

## 1. 색상 팔레트

### 1.1 브랜드 Primary

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--primary` | `hsl(148 13% 43%)` → **#7C9082** | 세이지 그린, 앱 전체 주색상 |
| `--primary-hover` | **#6A7D70** | 호버 상태 |
| `--primary-light` | `rgba(124, 144, 130, 0.12)` | 배지/버튼 배경 |
| `--primary-dark` | **#5A6B60** | 강조 |

### 1.2 시맨틱 색상

| 상태 | 메인 | 배경(Light) |
|------|------|-------------|
| Success | `#22c55e` | `#dcfce7` |
| Warning | `#f59e0b` | `#fef3c7` |
| Danger | `#ef4444` | `#fee2e2` |

### 1.3 Warm Stone 뉴트럴 (라이트 모드)

```
--gray-50:  #FAF8F5   ← 페이지 배경
--gray-100: #F5F3EF   ← 카드 헤더, 인풋 배경
--gray-200: #E8E4DF   ← 보더, 디바이더
--gray-300: #D5D0CA
--gray-400: #A8A29E
--gray-500: #78716C   ← 뮤트 텍스트
--gray-600: #57534E
--gray-700: #44403C
--gray-800: #292524   ← 본문 텍스트 (다크모드 서피스)
--gray-900: #1C1917   ← 다크모드 배경
```

다크모드에서 `--gray-50` ↔ `--gray-900`이 **반전**됨.

### 1.4 기타 하드코딩 색상

| 색상 | 용도 |
|------|------|
| `#2D2D2D` | 내비바 브랜드 텍스트, 다크 버튼 |
| `#3C3530` | 메인 페이지 헤딩 텍스트 |
| `#24292f` | 테이블 셀 텍스트 (GitHub 스타일) |
| `#f9fafb` | 테이블 짝수행 배경 |
| `#fff8e1` | 테이블 호버행 배경 |
| `#e8f5e9` | 완료 행 배경 |
| `#eef1f4` | 테이블 헤더 배경 |
| `#d0d7de` | 테이블 보더 |

---

## 2. 시료 타입별 테마 색상

### 2.1 시료별 Primary 색상 (각 `{type}-style.css` 기준)

| 시료 타입 | Primary | Hover | Light | Dark | Gradient (135deg) |
|-----------|---------|-------|-------|------|-------------------|
| **토양** (Soil) | `#22C55E` | `#16A34A` | `#BBF7D0` | `#15803D` | `#22C55E → #16A34A` |
| **수질** (Water) | `#3B82F6` | `#2563EB` | `#BFDBFE` | `#1D4ED8` | `#3B82F6 → #2563EB` |
| **퇴·액비** (Compost) | `#A16207` | `#854D0E` | `#FEF3C7` | `#713F12` | `#A16207 → #854D0E` |
| **중금속** (Heavy Metal) | `#8B5CF6` | `#7C3AED` | `#DDD6FE` | `#6D28D9` | `#8B5CF6 → #7C3AED` |
| **잔류농약** (Pesticide) | `#8B5CF6` | `#7C3AED` | `#DDD6FE` | `#6D28D9` | `#8B5CF6 → #7C3AED` |

> 잔류농약과 중금속은 동일 보라색 계열. 메인 페이지에서는 잔류농약=앰버(`#F59E0B`), 중금속=빨강(`#EF4444`)으로 카드 색이 다름.

### 2.2 테마 스코핑 메커니즘

```css
/* theme-colors.css: data 속성으로 시료별 primary 변수 설정 */
[data-sample-type="soil"] { --color-primary: #22C55E; }
[data-sample-type="water"] { --color-primary: #3B82F6; }

/* {type}-style.css: sibling combinator로 페이지 스코프 */
.soil-navbar ~ .main-content .btn-submit {
    background: var(--soil-primary);
}
```

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

| 용도 | 폰트 | 가중치 | 로드 방식 |
|------|------|--------|-----------|
| **본문 (Primary)** | Inter | 300, 400, 500, 600, 700 | Google Fonts CDN |
| **한글** | Noto Sans KR | 300, 400, 500, 600, 700 | Google Fonts CDN |
| **디스플레이 (헤딩)** | Fraunces | 300, 400, 500, 600 (opsz 9..144) | Google Fonts CDN |
| **모노스페이스 (숫자)** | Geist Mono, SF Mono, Consolas | — | 시스템 폰트 |

```css
body {
    font-family: 'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
}
.card-header h3, .main-page h1 {
    font-family: 'Fraunces', 'Noto Sans KR', serif;
}
.stat-value {
    font-family: 'Geist Mono', 'SF Mono', 'Consolas', monospace;
}
```

### 3.2 폰트 크기 스케일

| 요소 | 크기 | 가중치 | 비고 |
|------|------|--------|------|
| body 기본 | `14px` (0.875rem) | 400 | — |
| 라벨 | `0.875rem` | 500~600 | — |
| 폼 인풋 | `0.875rem` | 400 | — |
| 테이블 셀 | `0.875rem` | 400 | 모바일: 0.8125rem |
| 테이블 헤더 | `0.8125rem` | 600 | — |
| 카드 헤더 | `1rem` | 600 | Fraunces |
| 목록 제목 | `1.5rem` | 600 | — |
| 뷰 제목 | `1.75rem` | 700 | — |
| 메인 페이지 h1 | `3rem` | 600 | Fraunces |
| 토스트 | `0.875rem` | 500 | — |
| 뱃지/칩 | `0.8125rem` | 600 | — |
| 내비 버튼 라벨 | `0.7rem` | 500 | — |

---

## 4. 아이콘

### Material Icons Outlined

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined">
```

사용법:
```html
<span class="material-icons-outlined" style="font-size:16px;">arrow_back</span>
```

- 내비바, 버튼, 유틸리티에서 사용
- 크기: 보통 `16px` ~ `20px`

### 이모지

카드 헤더, 시료 타입 아이콘, 통계에서 이모지 직접 사용:
- 토양: 🌱, 수질: 🚰, 퇴액비: 🌾, 중금속: 🔬, 잔류농약: 🧪
- 통계: 📋 📊 ✅ ⏳ 🥬 🍎 🏠 🌲 🌾

---

## 5. 컴포넌트 스타일

### 5.1 버튼

| 종류 | 배경 | 텍스트 | 모서리 | 패딩 |
|------|------|--------|--------|------|
| **Primary** (.btn-confirm) | `hsl(--primary)` | white | `--radius-md` (20px) | 0.625rem 1.25rem |
| **Cancel** (.btn-cancel) | transparent | `--gray-700` | `--radius-md` | 0.625rem 1.25rem |
| **Edit** (.btn-edit) | `--primary-light` | `--primary` | — | — |
| **Delete** (.btn-delete) | `--danger-light` | `--danger` | — | — |
| **Label Print** | `#7C9082` | white | `1.5rem` (pill) | — |
| **Bulk Complete** | `#f0fdf4` | `#16a34a` | — | — |
| **Icon Button** | `36×36px` 원형 | — | 50% | — |

### 5.2 카드

```css
.form-card {
    background: white;
    border: 1px solid #E8E4DF;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.card-header {
    background: var(--gray-50);
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--gray-200);
}
```

### 5.3 모달

```css
.modal-overlay {
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
}

.modal-content {
    background: white;
    max-width: 560px;
    border-radius: 24px;  /* --radius-xl */
    /* 애니메이션: scale(0.95)+translateY(10px) → scale(1) */
}

.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px; }
.modal-footer { background: var(--gray-50); padding: 1rem 1.5rem; border-top: 1px; }
.modal-close { 32×32px; background: var(--gray-100); border-radius: 20px; }
```

### 5.4 테이블 (.data-table)

```css
border-collapse: separate;
border: 1px solid #d0d7de;

/* 헤더 */
thead { background: linear-gradient(to bottom, #f6f8fa, #e9ecef); position: sticky; }
th { padding: 0.35rem 0.75rem; font-size: 0.8125rem; font-weight: 600; }

/* 행 */
td { padding: 0.35rem 0.75rem; color: #24292f; }
tr:nth-child(even) { background: #f6f8fa; }
tr:hover { background: #fff8e1; }
tr.row-completed { background: #e8f5e9; }
```

### 5.5 폼 인풋

```css
input, select, textarea {
    padding: 0.625rem 0.75rem;
    background: #F5F3EF;
    border: 1px solid #E8E4DF;
    border-radius: 12px !important;  /* 전역 오버라이드 */
    transition: all 0.15s;
}

input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 144, 130, 0.12);
    transform: scale(1.01);
}
```

### 5.6 토스트

```css
.toast {
    background: var(--gray-800);
    color: white;
    border-radius: var(--radius-lg);  /* 22px */
    min-width: 280px;
    animation: slideIn 0.3s ease (translateX 100% → 0);
}
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast.warning { background: #f59e0b; color: var(--gray-900); }
```

### 5.7 뱃지/칩

```css
.crop-tag {
    background: hsl(var(--primary));
    color: white;
    border-radius: 999px;
    padding: 0.375rem 0.75rem;
}

.record-count {
    background: rgba(124, 144, 130, 0.12);
    color: #7C9082;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
}
```

---

## 6. 레이아웃

### 6.1 전체 구조 (사이드바 없음, 상단 내비바만)

```
┌────────────────────────────────────────────┐
│          Navbar (44px, fixed)              │
├────────────────────────────────────────────┤
│                                            │
│         Main Content                       │
│     (margin-top: 44px,                     │
│      height: calc(100vh - 44px),           │
│      overflow-y: auto)                     │
│                                            │
│   ┌── formView (등록/수정 폼) ──────┐      │
│   │ max-width: 1400px, centered    │      │
│   └────────────────────────────────┘      │
│                                            │
│   ┌── listView (목록 테이블) ──────┐      │
│   │ width: 100%, full bleed       │      │
│   └────────────────────────────────┘      │
│                                            │
└────────────────────────────────────────────┘
```

### 6.2 메인 페이지 (홈)

```css
.sample-types {
    display: grid;
    grid-template-columns: repeat(5, 1fr);  /* 5개 카드 */
    gap: 1.5rem;
    max-width: 1300px;
}
```

### 6.3 폼 레이아웃

```css
.sample-form { max-width: 1400px; flex-direction: column; gap: 1rem; }
.form-two-column { grid-template-columns: 0.85fr 1.15fr; gap: 1.5rem; }
.form-row { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
```

### 6.4 반응형 브레이크포인트

| 브레이크포인트 | 변경 내용 |
|---------------|-----------|
| `≤ 1024px` | 2열 폼 → 1열, form-row → 1열 |
| `≤ 768px` | 내비바 48px, 유틸 버튼 숨김 |
| `≤ 640px` | 페이지네이션 스택, 분기별 요약 2열 |

---

## 7. 다크모드

### 7.1 구현 방식

```javascript
// src/shared/theme.js — ThemeManager
class ThemeManager {
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme); // 'light' | 'dark'
        localStorage.setItem('theme-preference', theme);
    }
}
```

- `data-theme="light|dark"` 속성을 `<html>`에 설정
- `prefers-color-scheme` 미디어 쿼리로 초기 감지 (localStorage 우선)

### 7.2 CSS 전략

```css
/* 모든 다크모드는 명시적 선택자로 오버라이드 */
[data-theme="dark"] .form-card {
    background: rgba(41,37,36,0.95);
    backdrop-filter: blur(10px);
}
```

CSS 변수 상속이 아닌 **명시적 색상 교체** 방식.

### 7.3 다크모드 서피스 색상

| 요소 | 색상 |
|------|------|
| 페이지 배경 | `#1C1917` |
| 내비바 | `#292524`, 보더 `#44403C` |
| 폼 카드 | `rgba(41,37,36,0.95)` + blur(10px) |
| 카드 헤더 | `rgba(28,25,23,0.85)` |
| 인풋 배경 | `rgba(44,40,38,0.9)`, 보더 `#57534E` |
| Select | `#292524` (!important) |

---

## 8. 그림자 스케일

```css
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.03);
--shadow:    0 2px 4px 0 rgb(0 0 0 / 0.04);
--shadow-md: 0 4px 8px -1px rgb(0 0 0 / 0.05);
--shadow-lg: 0 8px 16px -3px rgb(0 0 0 / 0.06);
--shadow-xl: 0 16px 24px -5px rgb(0 0 0 / 0.07);
```

---

## 9. 모서리(Border Radius) 스케일

```css
--radius:    20px;                        /* 기본 */
--radius-sm: calc(var(--radius) - 2px);   /* 18px */
--radius-md: var(--radius);               /* 20px */
--radius-lg: calc(var(--radius) + 2px);   /* 22px */
--radius-xl: calc(var(--radius) + 4px);   /* 24px */

/* 전역 인풋 오버라이드 */
input, select, textarea { border-radius: 12px !important; }

/* pill 형태 */
.crop-tag, .record-count { border-radius: 999px; }
```

---

## 10. 트랜지션

```css
--transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);   /* 기본 */

/* 내비 버튼: 바운스 */
.nav-btn { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

/* 모달 등장 */
.modal-content { animation: modalSlideIn 0.2s ease-out; }
/* scale(0.95) + translateY(10px) → scale(1) + translateY(0) */
```

---

## 11. CSS 아키텍처

### 파일 로드 순서 (각 시료 페이지)

```
1. shared/tailwind-output.css   ← Tailwind v3 base/utilities
2. style.css                    ← 전역 디자인 시스템 (5,700+ 줄)
3. {type}-style.css             ← 시료별 오버라이드 (최고 우선순위)
```

### 스코핑 패턴

```css
/* sibling combinator: 내비바 클래스로 페이지 전체 스코프 */
.soil-navbar ~ .main-content .component { ... }
```

### 네이밍 규칙

- **BEM 아님** — 플랫 클래스명 (`.btn-submit`, `.form-card`, `.modal-header`)
- **CSS 커스텀 프로퍼티** (ShadCN/Radix 패턴, HSL 변수)
- **Tailwind 유틸리티** 클래스는 HTML 인라인에서 마이크로 스페이싱/레이아웃용
- **`!important`** — `select` 브라우저 스타일 재정의 + `border-radius` 전역 리셋에 한정 사용

---

## 12. 디자인 원칙 요약

| 원칙 | 설명 |
|------|------|
| **Warm Stone** | 차가운 블루그레이 대신 따뜻한 스톤 계열 뉴트럴 |
| **Sage Green** | 브랜드 컬러는 은은한 세이지 그린 (#7C9082) |
| **Rounded** | 카드 20px, 인풋 12px, 뱃지 999px (pill) |
| **Subtle Shadows** | 그림자는 최소화 (opacity 3~7%) |
| **No Sidebar** | 상단 내비바(44px)만 사용, 콘텐츠 중심 |
| **Per-Type Theme** | 5개 시료 타입마다 고유 accent 색상 |
| **Dark Mode** | 완전한 다크모드 지원 (gray scale 반전) |
| **Korean First** | Noto Sans KR 폴백, 한글 UI 텍스트 |

---

*문서 작성일: 2026-04-21*
*대상 버전: v1.8.0*
*파일: docs-internal/DESIGN_SYSTEM.md*
