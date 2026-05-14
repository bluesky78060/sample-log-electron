# 대시보드 (홈 화면 통합 현황판) 기획서

## 1. 개요

### 1.1 배경

현재 홈 화면은 5개 시료 타입 카드 + 동기화 버튼만 있는 단순 런처입니다. 사용자는 각 시료 페이지에 들어가야 접수 건수, 미완료 현황을 확인할 수 있어 **전체 업무 파악에 시간이 소요**됩니다.

### 1.2 목적

홈 화면에 **5개 시료 타입의 통합 현황**을 한눈에 보여주는 대시보드를 추가하여:
- 오늘/이번 주/이번 달 접수 현황 즉시 파악
- 시료 타입별 미완료 건수 한눈에 확인
- 월별 추이 파악
- 업무 우선순위 판단 지원

### 1.3 사용자

- 봉화군 농업기술센터 안전성분석센터 직원
- 일일 업무 시작 시 현황 확인 용도
- 관리자의 업무량 파악 용도

---

## 2. 현재 홈 화면 분석

### 2.1 현재 구조

```
┌────────────────────────────────────────────────────────────┐
│  상단 바: [동기화] [설정] [릴리즈노트] [매뉴얼] [다크모드]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              시료 접수 대장                                  │
│         분석할 시료 종류를 선택해주세요                       │
│                                                            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────────┐ ┌────────┐              │
│  │토양│ │수질│ │농약│ │퇴액비  │ │중금속  │              │
│  │    │ │분석│ │    │ │        │ │        │              │
│  └────┘ └────┘ └────┘ └────────┘ └────────┘              │
│                                                            │
│         봉화군농업기술센터 안전성분석센터  v1.8.1             │
└────────────────────────────────────────────────────────────┘
```

### 2.2 현재 홈 화면 요소

| 요소 | DOM ID | 데이터 소스 |
|------|--------|-----------|
| 동기화 버튼 | `syncBtn` | 클릭 시 Firestore 전체 동기화 |
| 기관명 | `orgNameDisplay` | `localStorage('app_org_name')` |
| 버전 | `appVersion` | `electronAPI.getVersion()` 또는 constants.js |
| 시료 카드 5개 | 클래스 `.sample-type-card` | 정적 HTML (데이터 없음) |
| 동기화 상태 | `syncStatus` | 온/오프라인 감지 |
| 테마 토글 | `themeToggleBtn` | `localStorage('theme-preference')` |

### 2.3 현재 없는 것

- ❌ 시료 타입별 접수 건수
- ❌ 미완료/완료 비율
- ❌ 오늘/주간/월간 접수 현황
- ❌ 최근 접수 활동
- ❌ 월별 추이 차트
- ❌ 시료 타입 간 비교

---

## 3. 데이터 소스 설계

### 3.1 데이터 접근 방식

모든 데이터는 **localStorage에 이미 존재**합니다. 서버 API 호출 없이 클라이언트에서 직접 집계합니다.

```javascript
// 각 시료 타입의 데이터 키 패턴
const STORAGE_KEYS = {
    soil:       'soilSampleLogs',
    water:      'waterSampleLogs',
    compost:    'compostSampleLogs',
    heavyMetal: 'heavyMetalSampleLogs',
    pesticide:  'pesticideSampleLogs'
};

// 연도별 키: `${prefix}_${year}`
// 예: soilSampleLogs_2026, waterSampleLogs_2025
```

### 3.2 집계 대상 데이터

| 지표 | 계산 방법 | 필드 |
|------|----------|------|
| 총 접수 | `logs.length` | - |
| 완료 | `logs.filter(l => l.isComplete).length` | `isComplete` |
| 미완료 | `logs.filter(l => !l.isComplete).length` | `isComplete` |
| 오늘 접수 | `logs.filter(l => l.date === today).length` | `date` |
| 이번 주 | `logs.filter(l => isThisWeek(l.date)).length` | `date` |
| 이번 달 | `logs.filter(l => l.date?.startsWith(thisMonth)).length` | `date` |
| 월별 추이 | 월별 그룹핑 | `date` → `substring(5,7)` |

### 3.3 데이터 로드 함수 설계

```javascript
/**
 * 대시보드용 전체 시료 통계 집계
 * @param {number} year - 대상 연도 (기본: 현재 연도)
 * @returns {object} 5개 시료 타입별 통계 + 합계
 */
function loadDashboardStats(year = new Date().getFullYear()) {
    const types = [
        { key: 'soil',       prefix: 'soilSampleLogs',       label: '토양',       icon: '🌱' },
        { key: 'water',      prefix: 'waterSampleLogs',      label: '수질분석',    icon: '🚰' },
        { key: 'pesticide',  prefix: 'pesticideSampleLogs',  label: '잔류농약',    icon: '🧪' },
        { key: 'compost',    prefix: 'compostSampleLogs',    label: '퇴·액비',    icon: '🌾' },
        { key: 'heavyMetal', prefix: 'heavyMetalSampleLogs', label: '중금속',      icon: '🔬' },
    ];

    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    const stats = {};
    let grandTotal = 0, grandCompleted = 0, grandPending = 0, grandToday = 0;

    for (const type of types) {
        const raw = localStorage.getItem(`${type.prefix}_${year}`);
        const logs = raw ? JSON.parse(raw) : [];
        
        const total = logs.length;
        const completed = logs.filter(l => l.isComplete).length;
        const pending = total - completed;
        const todayCount = logs.filter(l => l.date === today).length;
        const thisMonthCount = logs.filter(l => (l.date || '').startsWith(thisMonth)).length;

        // 월별 집계
        const byMonth = {};
        for (let m = 1; m <= 12; m++) {
            const mk = String(m).padStart(2, '0');
            byMonth[mk] = { count: 0, completed: 0, pending: 0 };
        }
        logs.forEach(l => {
            if (l.date) {
                const mk = l.date.substring(5, 7);
                if (byMonth[mk]) {
                    byMonth[mk].count++;
                    if (l.isComplete) byMonth[mk].completed++;
                    else byMonth[mk].pending++;
                }
            }
        });

        stats[type.key] = {
            ...type,
            total, completed, pending,
            todayCount, thisMonthCount,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
            byMonth
        };

        grandTotal += total;
        grandCompleted += completed;
        grandPending += pending;
        grandToday += todayCount;
    }

    return {
        year,
        types: stats,
        grand: {
            total: grandTotal,
            completed: grandCompleted,
            pending: grandPending,
            today: grandToday,
            completionRate: grandTotal > 0 
                ? ((grandCompleted / grandTotal) * 100).toFixed(1) 
                : '0.0'
        }
    };
}
```

### 3.4 성능 고려

| 항목 | 예상 | 대응 |
|------|------|------|
| localStorage 읽기 | 5개 타입 × 1~7개 연도 = ~35회 | 홈 로드 시 1회만, 캐싱 |
| JSON 파싱 | 최대 ~3000건/타입 | 수 ms, 무시 가능 |
| 렌더링 | DOM 요소 ~50개 | 가벼움 |
| 전체 로드 시간 | < 100ms | 사용자 체감 없음 |

---

## 4. UI 레이아웃 설계

### 4.1 전체 구조 (개선안)

```
┌────────────────────────────────────────────────────────────┐
│  상단 바: [동기화] [설정] [릴리즈노트] [매뉴얼] [다크모드]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  시료 접수 대장  ──────────────────── 2026년 ▾  기관명      │
│                                                            │
│  ┌──────── 요약 카드 4개 ──────────────────────────────┐   │
│  │ 📊 전체 접수    │ ✅ 완료        │ ⏳ 미완료      │   │
│  │    1,245       │    1,180       │    65          │   │
│  │                │   (94.8%)      │                │   │
│  ├────────────────┼────────────────┼────────────────┤   │
│  │ 📅 오늘 접수    │                │                │   │
│  │    12          │                │                │   │
│  └────────────────┴────────────────┴────────────────┘   │
│                                                            │
│  ┌──────── 시료 타입별 현황 (5개 카드) ────────────────┐   │
│  │ 🌱 토양     🚰 수질    🧪 잔류농약  🌾 퇴액비  🔬 중금속│
│  │  688건       89건      65건       28건     3건    │
│  │ 미완료 59    미완료 5   미완료 0    미완료 1  미완료 0│
│  │ ████████    █████     ████       ██       █     │
│  │ [바로가기]   [바로가기]  [바로가기]   [바로가기]  [바로가기]│
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────── 월별 접수 추이 (전 시료 합산) ──────────────┐   │
│  │  ██                                                │   │
│  │  ██  ██                                            │   │
│  │  ██  ██  ██  ██                                    │   │
│  │  39  148 293 223  0   0   0   0   0   0   0   6   │   │
│  │  1월 2월 3월 4월 5월 6월 7월 8월 9월 10  11  12     │   │
│  │      ■ 토양  ■ 수질  ■ 잔류농약  ■ 퇴액비  ■ 중금속  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│         봉화군농업기술센터 안전성분석센터  v1.8.1             │
└────────────────────────────────────────────────────────────┘
```

### 4.2 컴포넌트 상세

#### A. 요약 카드 (Summary Cards)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📊 전체 접수     │  │ ✅ 완료          │  │ ⏳ 미완료        │
│                 │  │                 │  │                 │
│    1,245        │  │    1,180        │  │      65         │
│                 │  │    (94.8%)      │  │                 │
│ 이번 달 +42     │  │ ████████████░░  │  │ 토양 59 | 수질 5│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

| 카드 | 표시 정보 | 스타일 |
|------|----------|--------|
| **전체 접수** | 총 건수 (큰 숫자), 이번 달 접수 (작은 텍스트) | 연녹색 배경 (#f0fdf4) |
| **완료** | 완료 건수, 완료율 (%), 프로그레스 바 | 연녹색 배경 (#dcfce7) |
| **미완료** | 미완료 건수, 시료별 미완료 수 (소형 텍스트) | 연노랑 배경 (#fef3c7) |

#### B. 시료 타입별 현황 카드 (Type Cards)

기존 5개 카드를 **통계 정보를 포함하도록 확장**합니다.

```
┌─────────────────────────┐
│ 🌱 토양                  │
│ ────────────────────────│
│         688건            │
│  ████████████████░░     │ ← 완료율 프로그레스 바
│  완료 629  미완료 59     │
│                          │
│  이번 달: 42건           │
│  오늘: 3건               │
│                          │
│  [바로가기 →]             │
└─────────────────────────┘
```

**현재 카드** (단순 링크):
```html
<a href="soil/index.html" class="sample-type-card soil">
    <img src="assets/icons/soil.svg">
    <h3>토양</h3>
    <p>논, 밭, 과수, 시설 토양 분석</p>
    <span class="card-status active">● 사용 가능</span>
</a>
```

**개선 카드** (통계 포함):
```html
<a href="soil/index.html" class="sample-type-card soil">
    <div class="card-icon-area">
        <img src="assets/icons/soil.svg">
        <h3>토양</h3>
    </div>
    <div class="card-stats">
        <span class="card-total">688건</span>
        <div class="card-progress-bar">
            <div class="card-progress-fill" style="width: 91.4%"></div>
        </div>
        <div class="card-detail">
            <span class="card-completed">완료 629</span>
            <span class="card-pending">미완료 59</span>
        </div>
    </div>
    <div class="card-recent">
        <span>이번 달: 42건</span>
        <span>오늘: 3건</span>
    </div>
</a>
```

#### C. 월별 접수 추이 차트 (Monthly Trend)

전 시료 합산 또는 시료별 색상 구분 스택 차트.

```
높이: 200px
X축: 1월 ~ 12월
Y축: 접수 건수 (자동 스케일)
막대: 시료별 색상 스택
      토양=#22C55E, 수질=#3B82F6, 잔류농약=#8B5CF6, 
      퇴액비=#A16207, 중금속=#EF4444
범례: 하단에 5개 시료 색상 범례
```

#### D. 연도 선택

```html
<select id="dashboardYear" class="list-year-select">
    <option value="2025">2025년</option>
    <option value="2026" selected>2026년</option>
</select>
```

연도 변경 시 전체 대시보드 데이터를 다시 로드하여 갱신.

---

## 5. 인터랙션 설계

### 5.1 시료 카드 클릭

기존과 동일하게 해당 시료 접수 페이지로 이동합니다.

### 5.2 요약 카드 클릭

| 카드 | 클릭 동작 |
|------|----------|
| 전체 접수 | 없음 (정보 표시만) |
| 완료 | 없음 |
| 미완료 | 미완료 건수가 가장 많은 시료 페이지로 이동 (선택) |

### 5.3 월별 차트 클릭

특정 월 클릭 시 → 해당 월의 접수가 가장 많은 시료 페이지로 이동 (Phase 2).

### 5.4 자동 새로고침

- 홈 화면 진입 시 항상 최신 데이터 로드 (캐시 없음)
- `visibilitychange` 이벤트로 탭 복귀 시 자동 갱신
- Firestore 동기화 완료 후 자동 갱신

### 5.5 반응형

| 화면 크기 | 레이아웃 |
|-----------|---------|
| ≥ 1200px | 요약 3열 + 시료 5열 + 차트 전폭 |
| 768~1199px | 요약 3열 + 시료 3열 + 차트 전폭 |
| < 768px | 요약 1열 + 시료 2열 + 차트 전폭 |

---

## 6. 디자인 토큰

### 6.1 색상 (앱 디자인 시스템 준수)

```css
/* 요약 카드 배경 */
--dash-total-bg: #f0fdf4;         /* 연녹색 */
--dash-completed-bg: #dcfce7;      /* 완료 녹색 */
--dash-pending-bg: #fef3c7;        /* 미완료 노랑 */

/* 시료별 프로그레스 바 */
--dash-soil: #22C55E;
--dash-water: #3B82F6;
--dash-pesticide: #8B5CF6;
--dash-compost: #A16207;
--dash-heavy-metal: #EF4444;

/* 숫자 (통계) */
--dash-number-font: 'Geist Mono', 'SF Mono', monospace;
--dash-number-size: 2rem;
--dash-number-weight: 700;

/* 다크모드 */
[data-theme="dark"] {
    --dash-total-bg: rgba(34, 197, 94, 0.1);
    --dash-completed-bg: rgba(34, 197, 94, 0.15);
    --dash-pending-bg: rgba(245, 158, 11, 0.1);
}
```

### 6.2 컴포넌트 스타일

```css
/* 요약 카드 */
.dash-summary-card {
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
    border: 1px solid #E8E4DF;
    border-left: 4px solid var(--primary);
}

/* 시료 카드 프로그레스 바 */
.card-progress-bar {
    height: 6px;
    background: #f5f5f0;
    border-radius: 3px;
    overflow: hidden;
    margin: 0.5rem 0;
}

.card-progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
}

/* 월별 차트 */
.dash-monthly-chart {
    height: 200px;
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
    border: 1px solid #E8E4DF;
}
```

---

## 7. 구현 계획

### 7.1 Phase 1: 기본 대시보드 (MVP)

**범위**: 요약 카드 3개 + 시료 카드 통계 추가

**수정 파일**:
| 파일 | 변경 |
|------|------|
| `src/index.html` | 요약 카드 HTML 추가, 시료 카드 확장 |
| `src/shared/main-init.js` | `loadDashboardStats()` 함수 추가, DOM 업데이트 |
| `src/style.css` | 대시보드 CSS 추가 (~100줄) |

**예상 작업량**: ~200줄 수정/추가

### 7.2 Phase 2: 월별 차트 + 인터랙션

**범위**: 월별 스택 차트, 연도 선택, 자동 새로고침

**수정 파일**:
| 파일 | 변경 |
|------|------|
| `src/index.html` | 차트 컨테이너 + 연도 드롭다운 |
| `src/shared/main-init.js` | 차트 렌더링 로직, 연도 변경 핸들러 |
| `src/style.css` | 차트 CSS |

**예상 작업량**: ~150줄 추가

### 7.3 Phase 3: 고급 기능

**범위**: 최근 활동 피드, 차트 클릭 연동, 시료별 비교 뷰

**예상 작업량**: ~300줄 추가

### 7.4 총 예상 규모

| Phase | 파일 수 | 코드량 | 우선순위 |
|-------|---------|--------|----------|
| Phase 1 | 3 | ~200줄 | 높음 |
| Phase 2 | 3 | ~150줄 | 중간 |
| Phase 3 | 3+ | ~300줄 | 낮음 |
| **합계** | **3~6** | **~650줄** | |

---

## 8. 데이터 갱신 전략

### 8.1 초기 로드

```
DOMContentLoaded
  → loadDashboardStats(currentYear)
  → renderSummaryCards(stats.grand)
  → renderTypeCards(stats.types)
  → renderMonthlyChart(stats)  // Phase 2
```

### 8.2 탭 복귀 시

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        refreshDashboard();
    }
});
```

### 8.3 동기화 후

```javascript
// syncAllData() 완료 후 콜백
syncBtn.addEventListener('click', async () => {
    await syncAllData();
    refreshDashboard(); // 동기화 후 대시보드 갱신
});
```

---

## 9. 접근성 / UX 고려

| 항목 | 대응 |
|------|------|
| **색맹 대응** | 숫자/텍스트로 항상 정보 표시 (색상만 의존 않음) |
| **다크모드** | 모든 요소에 `[data-theme="dark"]` 대응 |
| **키보드 네비게이션** | 카드는 `<a>` 태그로 Tab 포커스 가능 |
| **로딩 상태** | 데이터 로드 중 스켈레톤 UI (선택) |
| **데이터 없음** | "아직 접수된 시료가 없습니다" 안내 |
| **오프라인** | localStorage 기반이므로 오프라인에서도 동작 |

---

## 10. 기존 기능과의 관계

| 기존 기능 | 대시보드와의 관계 |
|----------|----------------|
| 시료 카드 클릭 | 유지 — 카드에 통계 추가만 (링크 동작 동일) |
| 동기화 버튼 | 유지 — 동기화 후 대시보드 자동 갱신 |
| 개별 시료 통계 모달 | 유지 — 대시보드는 **요약**, 시료별 통계는 **상세** |
| 설정/릴리즈/매뉴얼 링크 | 유지 |

---

## 11. 와이어프레임 비교

### 현재 (Before)

```
[동기화] [설정] [릴리즈] [매뉴얼] [테마]
         시료 접수 대장
      시료 종류를 선택해주세요
  [토양] [수질] [농약] [퇴비] [중금속]
         기관명 v1.8.1
```
→ **정보 없음**, 단순 네비게이션

### 개선 후 (After)

```
[동기화] [설정] [릴리즈] [매뉴얼] [테마]
시료 접수 대장                    2026년 ▾

[📊 1,245건] [✅ 1,180 (94.8%)] [⏳ 65건]

[🌱토양 688] [🚰수질 89] [🧪농약 65] [🌾퇴비 28] [🔬중금속 3]
 미완료 59    미완료 5    미완료 0    미완료 1    미완료 0

[████████ 월별 접수 추이 차트 ████████████]

         기관명 v1.8.1
```
→ **한눈에 파악**, 데이터 중심

---

## 12. 결정 필요 사항

| # | 질문 | 옵션 |
|---|------|------|
| 1 | 요약 카드 개수 | 3개 (전체/완료/미완료) vs 4개 (+오늘 접수) |
| 2 | 시료 카드 배치 | 기존 5열 유지 vs 3+2 또는 리스트형 |
| 3 | 월별 차트 | 합산 막대 vs 시료별 스택 vs 영역 차트 |
| 4 | 최근 활동 피드 | Phase 1에 포함? vs Phase 3으로 연기? |
| 5 | 연도 선택 위치 | 상단 제목 옆 vs 요약 카드 위 |
| 6 | 기존 "시료 종류를 선택해주세요" 텍스트 | 유지 vs 제거 (대시보드로 대체) |
| 7 | 대시보드 토글 | 항상 표시 vs 접기/펼치기 |

---

## 13. 참고

| 자료 | 파일 |
|------|------|
| 현재 홈 HTML | `src/index.html` |
| 홈 초기화 JS | `src/shared/main-init.js` |
| 전역 상수 | `src/shared/constants.js` (STORAGE_KEY_PREFIX) |
| 디자인 시스템 | `docs-internal/DESIGN_SYSTEM.md` |
| 토양 통계 구현 | `docs-internal/STATISTICS_CURRENT_IMPLEMENTATION.md` |
| Stitch 시안 3종 | `docs-internal/stitch-mockups/` |

---

*문서 작성일: 2026-04-25*
*대상 버전: v1.8.1+*
*파일: docs-internal/DASHBOARD_FEATURE_SPEC.md*
