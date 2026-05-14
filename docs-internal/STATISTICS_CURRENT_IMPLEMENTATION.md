# 토양 접수 통계 모달 - 현재 구현 상세 문서

## 1. 파일 위치 및 구조

### 관련 파일

| 파일 | 역할 | 라인 범위 |
|------|------|-----------|
| `src/soil/index.html` | 모달 HTML 구조 | 638~717 |
| `src/soil/soil-script.js` | 통계 계산 + 렌더링 JS | 2347~2668 |
| `src/style.css` | 통계 CSS (공통) | 2877~3400+ |
| `src/soil/soil-style.css` | 토양 전용 통계 CSS (오버라이드) | 129 |

---

## 2. HTML 구조 (index.html:638~717)

```html
<div id="statisticsModal" class="modal hidden">
  <div class="modal-overlay"></div>
  <div class="modal-content modal-large">
    
    <!-- 헤더 -->
    <div class="modal-header">
      <h3>📊 토양 접수 통계</h3>
      <button id="closeStatisticsModal">&times;</button>
    </div>
    
    <div class="modal-body">
      <div class="stats-container">
        
        <!-- ① 요약 카드 3개 -->
        <div class="stats-summary">
          <div class="stat-card total">         <!-- 총 접수 -->
          <div class="stat-card completed">     <!-- 완료 -->
          <div class="stat-card pending">       <!-- 미완료 -->
        </div>
        
        <!-- ② 상세 통계: 구분별 + 목적별 (2열) -->
        <div class="stats-details">
          <div class="stats-section">
            <h4>구분별 접수</h4>
            <div id="statsByCategory"></div>     <!-- 세로 막대 -->
          </div>
          <div class="stats-section">
            <h4>목적(용도)별</h4>
            <div id="statsByPurpose"></div>      <!-- 가로 막대 -->
          </div>
        </div>
        
        <!-- ③ 하단: 월별 + 수령방법별 (2열) -->
        <div class="stats-bottom-row">
          <div class="stats-section-monthly">
            <h4>월별 접수 현황</h4>
            <div id="statsByMonth"></div>        <!-- 스택 세로 막대 -->
            <div id="statsQuarterly"></div>      <!-- 분기별 프로그레스 -->
          </div>
          <div class="stats-section-method">
            <h4>수령 방법별</h4>
            <div id="statsByReceptionMethod"></div> <!-- 카드 리스트 -->
          </div>
        </div>
        
      </div>
    </div>
    
    <!-- 푸터 -->
    <div class="modal-footer">
      <button id="closeStatisticsBtn">닫기</button>
    </div>
    
  </div>
</div>
```

### DOM ID 매핑

| DOM ID | 용도 | 렌더링 메서드 |
|--------|------|---------------|
| `statTotalCount` | 총 접수 숫자 | `openStatisticsModal` 직접 설정 |
| `statCompletedCount` | 완료 숫자 | `openStatisticsModal` 직접 설정 |
| `statPendingCount` | 미완료 숫자 | `openStatisticsModal` 직접 설정 |
| `statTotalBadge` | 총 건수 뱃지 (예: "709건") | `openStatisticsModal` 직접 설정 |
| `statCompletedRate` | 완료율 (예: "91.4%") | `openStatisticsModal` 직접 설정 |
| `statPendingRate` | 미완료율 (예: "8.6%") | `openStatisticsModal` 직접 설정 |
| `statsByCategory` | 구분별 차트 컨테이너 | `renderVerticalBarChart()` |
| `statsByPurpose` | 목적별 차트 컨테이너 | `renderHorizontalBarChart()` |
| `statsByMonth` | 월별 차트 컨테이너 | `renderMonthlyChart()` |
| `statsQuarterly` | 분기별 요약 컨테이너 | `renderQuarterlySummary()` |
| `statsByReceptionMethod` | 수령방법 컨테이너 | `renderMethodCards()` |
| `statsMonthRange` | 연도 범위 텍스트 | `openStatisticsModal` 직접 설정 |

---

## 3. JavaScript 로직 (soil-script.js)

### 3.1 calculateStatistics() — 라인 2350~2443

전체 `sampleLogs` 배열을 순회하여 6개 통계 객체를 반환합니다.

```javascript
return {
  total,              // 전체 건수 (number)
  completed,          // 완료 건수 (number)
  pending,            // 미완료 건수 (number)
  bySubCategory,      // 구분별 (object)
  byPurpose,          // 목적별 (object)
  byMonth,            // 월별 (object)
  byQuarter,          // 분기별 (object)
  byReceptionMethod   // 수령방법별 (object)
};
```

#### bySubCategory 구조

```javascript
{
  '밭': { count: 408, label: '🥬 밭', class: 'category-field' },
  '과수': { count: 121, label: '🍎 과수', class: 'category-fruit' },
  '시설': { count: 87, label: '🏠 시설', class: 'category-facility' },
  '임야': { count: 47, label: '🌲 임야', class: 'category-forest' },
  '논': { count: 46, label: '🌾 논', class: 'category-rice' },
  '성토': { count: 0, label: '🏗️ 성토', class: 'category-fill' },
  '기타': { count: 0, label: '📦 기타', class: 'category-other' }
}
```

카테고리 매핑 (라인 2356~2364):

| 키 | 이모지 | CSS 클래스 | 색상 (gradient) |
|----|--------|-----------|-----------------|
| 논 | 🌾 | `category-rice` | #84cc16 → #65a30d (라임) |
| 밭 | 🥬 | `category-field` | #f59e0b → #d97706 (앰버) |
| 과수 | 🍎 | `category-fruit` | #ef4444 → #dc2626 (빨강) |
| 시설 | 🏠 | `category-facility` | #06b6d4 → #0891b2 (시안) |
| 임야 | 🌲 | `category-forest` | #22c55e → #15803d (녹색) |
| 성토 | 🏗️ | `category-fill` | #8b5cf6 → #7c3aed (보라) |
| 기타 | 📦 | `category-other` | #6b7280 → #4b5563 (회색) |

#### byPurpose 구조

```javascript
{
  '일반재배': { count: 292, label: '🌾 일반재배', class: 'purpose-general' },
  '유기': { count: 103, label: '♻️ 유기', class: 'purpose-organic' },
  '무농약': { count: 309, label: '🍃 무농약', class: 'purpose-nopesticide' },
  'GAP': { count: 5, label: '✅ GAP', class: 'purpose-gap' },
  '저탄소': { count: 0, label: '🌱 저탄소', class: 'purpose-lowcarbon' }
}
```

목적 매핑 (라인 2374~2379):

| 키 | 이모지 | CSS 클래스 | 색상 |
|----|--------|-----------|------|
| 일반재배 | 🌾 | `purpose-general` | #10b981 → #059669 |
| 유기 | ♻️ | `purpose-organic` | #22c55e → #16a34a |
| 무농약 | 🍃 | `purpose-nopesticide` | #84cc16 → #65a30d |
| GAP | ✅ | `purpose-gap` | #3b82f6 → #2563eb |
| 저탄소 | 🌱 | `purpose-lowcarbon` | #14b8a6 → #0d9488 |

#### byMonth 구조

```javascript
{
  '01': { count: 39, completed: 35, pending: 4, label: '1월', class: 'month' },
  '02': { count: 148, completed: 140, pending: 8, label: '2월', class: 'month' },
  // ... 12개 월
}
```

- 소스 필드: `log.date` → `substring(5,7)`로 월 추출
- 완료/미완료: `log.isComplete` 기준

#### byQuarter 구조

```javascript
{
  Q1: { count: 480, completed: 450, pending: 30, label: '1분기 (1~3월)' },
  Q2: { count: 223, completed: 198, pending: 25, label: '2분기 (4~6월)' },
  Q3: { count: 0, completed: 0, pending: 0, label: '3분기 (7~9월)' },
  Q4: { count: 6, completed: 0, pending: 6, label: '4분기 (10~12월)' }
}
```

- byMonth를 합산하여 생성

#### byReceptionMethod 구조

```javascript
{
  '우편': { count: 0, label: '📮 우편', class: 'method-mail' },
  '이메일': { count: 0, label: '📧 이메일', class: 'method-email' },
  '팩스': { count: 0, label: '📠 팩스', class: 'method-fax' },
  '직접방문': { count: 0, label: '🚶 직접방문', class: 'method-visit' }
}
```

### 3.2 openStatisticsModal() — 라인 2446~2468

모달을 여는 진입점. 통계 계산 후 각 렌더러 호출.

```javascript
openStatisticsModal() {
  const stats = this.calculateStatistics();
  
  // 상단 카드 값 설정 (DOM 직접 조작)
  document.getElementById('statTotalCount').textContent = stats.total;
  document.getElementById('statCompletedCount').textContent = stats.completed;
  document.getElementById('statPendingCount').textContent = stats.pending;
  
  const completedRate = ((stats.completed / stats.total) * 100).toFixed(1);
  document.getElementById('statCompletedRate').textContent = `${completedRate}%`;
  document.getElementById('statPendingRate').textContent = `${pendingRate}%`;
  
  // 차트 렌더링
  this.renderVerticalBarChart('statsByCategory', stats.bySubCategory);
  this.renderHorizontalBarChart('statsByPurpose', stats.byPurpose);
  this.renderMonthlyChart('statsByMonth', stats.byMonth);
  this.renderQuarterlySummary('statsQuarterly', stats.byQuarter);
  this.renderMethodCards('statsByReceptionMethod', stats.byReceptionMethod);
  
  this.statisticsModal.classList.remove('hidden');
}
```

### 3.3 renderVerticalBarChart() — 라인 2470~2500

**구분별 통계**에 사용. 세로 막대 차트를 DOM으로 생성.

```
구조: container > .vertical-bars > .vertical-bar-group × N
  각 group: .vertical-bar-container > .vertical-bar (height=percent%) + .vertical-bar-label
```

- 정렬: 건수 내림차순 (`sort((a,b) => b.count - a.count)`)
- 높이: 최대값 대비 비율 (`value.count / maxCount * 100%`)
- 막대 너비: CSS로 `width: 70%; max-width: 48px`
- 레이블: 이모지 + 카테고리명 (예: "🥬 밭")
- **건수 미표시** (라벨에만 이모지+이름)

### 3.4 renderHorizontalBarChart() — 라인 2502~2533

**목적별 통계**에 사용. 가로 막대 차트를 DOM으로 생성.

```
구조: container > .stat-bar-item × N
  각 item: .stat-bar-label + .stat-bar-wrapper > .stat-bar + .stat-bar-value-outside
```

- 정렬: 건수 내림차순
- 너비: 최대값 대비 비율 (`value.count / maxCount * 100%`)
- 라벨: 이모지 + 용도명 (예: "🍃 무농약")
- 건수: `.stat-bar-value-outside`로 바 우측에 표시
- **비율(%) 미표시**

### 3.5 renderMonthlyChart() — 라인 2584~2638

**월별 접수 현황**에 사용. 스택 세로 막대 차트.

```
구조: container > .monthly-chart
  > .monthly-bars > .monthly-bar-group × 12
    각 group: .monthly-bar-container > .monthly-bar-stack > .monthly-bar-completed + .monthly-bar-pending
              + .monthly-bar-value (건수)
            + .monthly-bar-label (월명)
  > .monthly-legend (완료/미완료 범례)
```

- 12개 월 전부 표시 (데이터 없는 달도 빈 막대)
- 각 막대: 완료(녹색) + 미완료(주황) **스택** (하나의 막대 안에 두 색상)
- 막대 높이: 전체 최대 건수 대비 비율
- 건수 라벨: 막대 위에 숫자만 (0건이면 미표시)
- 범례: 하단에 "■ 완료  ■ 미완료"
- 차트 높이: CSS `.monthly-bars { height: 180px }`, `.monthly-bar-container { height: 140px }`

### 3.6 renderQuarterlySummary() — 라인 2641~2668

**분기별 요약**. 월별 차트 아래에 4개 분기 프로그레스 바.

```
구조: .quarterly-summary > .quarterly-item × 4
  각 item: .quarterly-label + .quarterly-stats (건수, 비율%) + .quarterly-completion (프로그레스 바 + 완료율%)
```

- Q1~Q4 표시
- 각 분기: 건수, 전체 대비 비율(%), 완료율 프로그레스 바
- innerHTML로 sanitizeHTML 적용하여 렌더링

### 3.7 renderMethodCards() — 라인 2535~2557

**수령 방법별**. 카드 리스트.

```
구조: container > .method-card × N
  각 card: .method-card-name (이모지+이름) + .method-card-count (건수)
```

- 건수 내림차순 정렬
- 각 카드: 좌측 이름, 우측 건수 (녹색 폰트)
- 배경: `#f9f9f6`, 테두리: `1px solid #e8e8e4`, 둥근 모서리 12px

### 3.8 renderBarChart() — 라인 2559~2582

**범용 가로 막대** (현재 토양에서는 미사용, 다른 시료에서 사용될 수 있음).

- `sanitizeHTML`로 innerHTML 생성
- 막대 내부에 건수 표시 (바 너비 > 20% 일 때)
- 바 너비 <= 20% 이면 외부에 건수 표시

---

## 4. CSS 스타일 상세 (style.css)

### 4.1 모달 전체

```css
#statisticsModal .modal-content {
  background: #f9f9f6;        /* 따뜻한 회색 배경 */
  max-width: 1080px;          /* 모달 최대 너비 */
}
.modal-body { padding: 1.75rem 2rem; }
```

### 4.2 요약 카드 (.stats-summary)

```css
.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);   /* 3열 균등 */
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  border: 1px solid #e8e8e4;
}

.stat-card.total    { border-left: 4px solid #7C9082; background: linear-gradient(135deg, #f0fdf4 0%, #f9f9f6 100%); }
.stat-card.completed { border-left: 4px solid #43a047; background: linear-gradient(135deg, #dcfce7 0%, #f9f9f6 100%); }
.stat-card.pending  { border-left: 4px solid #e6a817; background: linear-gradient(135deg, #fef9c3 0%, #f9f9f6 100%); }
```

#### 카드 내부 요소

| 요소 | 클래스 | 스타일 |
|------|--------|--------|
| 아이콘 | `.stat-icon` | 36×36px, 원형 배경, 폰트 20px |
| 뱃지 | `.stat-card-badge` | pill 형태, 배경 #e8e8e4, 폰트 0.75rem |
| 숫자 | `.stat-value` | 폰트 2rem bold, Geist Mono |
| 라벨 | `.stat-label` | 폰트 0.875rem, 색상 #777 |

### 4.3 상세 통계 영역 (.stats-details)

```css
.stats-details {
  display: grid;
  grid-template-columns: 1fr 1fr;    /* 2열 (구분별 | 목적별) */
  gap: 1.25rem;
  margin-bottom: 0;
}

.stats-section {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  border: 1px solid #e8e8e4;
}
```

### 4.4 세로 막대 차트 (.vertical-bars)

```css
.vertical-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;               /* 차트 높이 */
  gap: 0.75rem;
}

.vertical-bar {
  width: 70%;
  max-width: 48px;             /* 막대 최대 너비 */
  min-height: 4px;
  border-radius: 6px 6px 0 0;  /* 위쪽만 둥글게 */
  transition: height 0.4s ease;
}
```

### 4.5 가로 막대 차트 (.stat-bar)

```css
.stat-bar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.stat-bar-label { width: 80px; font-size: 0.875rem; }

.stat-bar-wrapper {
  flex: 1;
  height: 28px;                /* 막대 높이 */
  background: #f5f5f0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.stat-bar {
  height: 100%;
  border-radius: 8px;
  transition: width 0.6s ease;
}
```

### 4.6 월별 차트 (.monthly-chart)

```css
.monthly-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 180px;               /* 차트 높이 */
  border-bottom: 2px solid #e8e8e4;
}

.monthly-bar-stack {
  width: 70%;
  max-width: 36px;             /* 막대 너비 */
  display: flex;
  flex-direction: column;
  border-radius: 6px 6px 0 0;
}

.monthly-bar-completed { background: #43a047; }  /* 완료: 녹색 */
.monthly-bar-pending { background: #ffc107; }    /* 미완료: 노랑 */
```

### 4.7 분기별 (.quarterly-summary)

```css
.quarterly-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.quarterly-item { text-align: center; }

.completion-bar {
  height: 6px;
  background: #e8e8e4;
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, #43a047, #66bb6a);
  border-radius: 3px;
}
```

### 4.8 수령방법 카드 (.method-card)

```css
.method-card {
  display: flex;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #f9f9f6;
  border-radius: 12px;
  border: 1px solid #e8e8e4;
}

.method-card-count {
  font-weight: 700;
  color: #43a047;
  font-family: 'Geist Mono', monospace;
}
```

### 4.9 하단 레이아웃 (.stats-bottom-row)

```css
.stats-bottom-row {
  display: flex;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.stats-section-monthly { flex: 1; }          /* 월별: 나머지 공간 */
.stats-section-method { width: 260px; }      /* 수령방법: 고정 260px */
```

---

## 5. 이벤트 바인딩 (soil-script.js:3976~3986)

```javascript
// 통계 버튼 클릭 → 모달 열기
document.getElementById('toggleStatisticsBtn')?.addEventListener('click', () => {
    this.openStatisticsModal();
});

// 닫기 (X 버튼, 닫기 버튼, 오버레이 클릭)
closeStatisticsModal.addEventListener('click', () => modal.classList.add('hidden'));
closeStatisticsBtn.addEventListener('click', () => modal.classList.add('hidden'));
statisticsModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) modal.classList.add('hidden');
});
```

---

## 6. 다크모드 지원

style.css에 `[data-theme="dark"]` 선택자로 다크모드 CSS 정의:

```css
[data-theme="dark"] .stat-card { background: #1e1e1e; border-color: #333; }
[data-theme="dark"] .stat-value { color: #e0e0e0; }
[data-theme="dark"] .stat-bar-wrapper { background: #2a2a2a; }
[data-theme="dark"] .method-card { background: #1e1e1e; border-color: #333; }
/* ... 등 */
```

**알려진 문제**: 차트 막대 색상(그라디언트)은 다크모드에서도 동일 → 배경과의 대비가 부족할 수 있음.

---

## 7. 다른 시료 타입과의 비교

### 통계 기능 현황

| 시료 타입 | 통계 모달 | 구분별 | 목적별 | 월별 | 분기별 | 수령방법 |
|-----------|:---------:|:------:|:------:|:----:|:------:|:--------:|
| **토양** | ✅ | 세로 막대 | 가로 막대 | 스택 세로 | 프로그레스 | 카드 |
| 수질 | ✅ | 가로 막대 | 가로 막대 | 스택 세로 | 프로그레스 | - |
| 퇴액비 | ✅ | 가로 막대 | 가로 막대 | 스택 세로 | 프로그레스 | - |
| 중금속 | ✅ | 가로 막대 | 가로 막대 | 스택 세로 | 프로그레스 | - |
| 잔류농약 | ✅ | 가로 막대 | 가로 막대 | 스택 세로 | 프로그레스 | - |

- **토양만** 세로 막대(구분별) + 수령방법 카드 사용
- **나머지 4종**은 모두 가로 막대 통일

### 각 시료의 카테고리 항목

| 시료 | 구분별 항목 | 목적별 항목 |
|------|-----------|------------|
| 토양 | 논/밭/과수/시설/임야/성토 | 일반재배/유기/무농약/GAP/저탄소 |
| 수질 | 지하수/하천수/저수지/수돗물 | 생활/농업/참고용/급식 |
| 퇴액비 | 퇴비/액비/기타 | 축종별(소/돼지/닭/오리 등) |
| 중금속 | 밭/과수/시설/기타 | 농업/공장/주거/일반 |
| 잔류농약 | 밭/과수/논/시설/임야 | 무농약/일반재배/유기/GAP/참고 |

---

## 8. 데이터 흐름 요약

```
사용자: 통계 버튼 클릭
  ↓
openStatisticsModal()
  ↓
calculateStatistics()
  ├── this.sampleLogs 전체 순회
  ├── total/completed/pending 카운트
  ├── bySubCategory: log.subCategory 기준 집계
  ├── byPurpose: log.purpose 기준 집계
  ├── byMonth: log.date → substring(5,7) 기준 집계
  ├── byQuarter: byMonth 합산
  └── byReceptionMethod: log.receptionMethod 기준 집계
  ↓
DOM 업데이트
  ├── 상단 카드: textContent 직접 설정
  ├── renderVerticalBarChart('statsByCategory', bySubCategory)
  ├── renderHorizontalBarChart('statsByPurpose', byPurpose)
  ├── renderMonthlyChart('statsByMonth', byMonth)
  ├── renderQuarterlySummary('statsQuarterly', byQuarter)
  └── renderMethodCards('statsByReceptionMethod', byReceptionMethod)
  ↓
modal.classList.remove('hidden')
```

---

*문서 작성일: 2026-04-17*
*대상 버전: v1.8.0*
*작성: Claude Opus 4.6*
