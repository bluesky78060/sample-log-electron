# 토양 필지 "비고" → "기타주소" 명칭 변경

**작업 일자**: 2026-03-13
**관련 버전**: v1.7.70
**영향 범위**: 토양 시료 페이지, 흙토람 엑셀 내보내기

---

## 변경 배경

토양 시료 접수 시 필지별로 제공되는 "비고" 필드의 실제 용도가 명확하지 않았습니다. 실제 사용을 분석한 결과, 이 필드는 **"1동", "2동" 같은 추가 주소 정보를 구분하는 용도**로 사용되고 있었습니다. 사용자 경험 개선을 위해 필드명을 "기타주소"로 변경하고, 관련 UI와 기능을 통합하였습니다.

---

## 변경사항 상세

### 1. 토양 필지 입력 폼 변경

**파일**: `src/soil/index.html`, `src/soil/soil-script.js` (라인 827)

필지 입력 폼의 라벨과 안내 텍스트를 업데이트:

- **라벨 변경**: "비고" → "기타주소"
- **Placeholder 추가**: "예: 1동, 2동"
- **기술 참고**: 데이터 필드명(`parcel.note`)은 호환성을 위해 유지

```html
<!-- src/soil/index.html, src/soil/soil-script.js -->
<label for="parcel-note-${parcel.id}">기타주소</label>
<input type="text" class="parcel-note-input"
       id="parcel-note-${parcel.id}"
       name="parcel-note-${parcel.id}"
       data-id="${parcel.id}"
       placeholder="예: 1동, 2동"
       value="${escapeHTML(parcel.note || '')}">
```

### 2. 토양 상세보기(뷰 모달) 표시

**파일**: `src/soil/soil-script.js` (라인 2608)

상세보기 모달에서 각 필지의 기타주소를 명확하게 표시:

```javascript
// src/soil/soil-script.js, 라인 2608
noteDiv.textContent = '기타주소: ' + (parcel.note || '-');
```

상세보기 모달에서 선택된 필지별로 다음과 같이 표시됩니다:
- **필지 번호**: "필지 1", "필지 2" 등
- **필지 주소**: 주소 정보
- **기타주소**: 각 필지의 note 값 (없으면 "-")

### 3. 토양 목록 테이블에 기타주소 컬럼 추가

**파일**: `src/soil/index.html` (라인 388), `src/soil/soil-script.js` (라인 2835~2836)

토양 접수 목록 테이블의 구조와 렌더링 로직을 확장:

#### 3-1. 테이블 헤더 구조

```html
<!-- src/soil/index.html, 라인 388 -->
<th class="col-zipcode">우편번호</th>
<th>주소</th>
<th>필지 주소</th>
<th>기타주소</th>           <!-- 새로 추가 -->
<th>작물명</th>
<th>면적</th>
<th>전화번호</th>
<th>수령 방법</th>
<th class="col-note">비고</th>
<th class="col-mail-date">발송일자</th>
<th class="col-action">관리</th>
```

#### 3-2. 테이블 렌더링 로직

```javascript
// src/soil/soil-script.js, 라인 2835~2836
const parcelNote = row.parcels && row.parcels[0] && row.parcels[0].note ? row.parcels[0].note : '';
const combinedNote = [row.note, parcelNote].filter(n => n && n.trim()).join(' / ') || '-';
```

- **기타주소 컬럼**: 각 시료 데이터의 첫 번째 필지(`row.parcels[0]`)의 `note` 값을 표시
- **비고 컬럼**: 시료 수준의 `note`와 필지별 `note`를 병합하여 표시

#### 3-3. 농가별 구분 separator 업데이트

기타주소 컬럼 추가로 테이블 구조가 변경되어 농가별 구분 separator의 `colSpan` 값을 조정:

```javascript
// src/soil/soil-script.js, 라인 ~2950
// 농가별 구분 separator: colSpan 17 → 18
separator.colSpan = 18;
```

### 4. 토양 안내 배너 문구 변경

**파일**: `src/soil/index.html` (라인 303)

필지 정보 카드의 안내 배너 문구를 명확하게 변경:

```html
<!-- src/soil/index.html, 라인 303 -->
<!-- 변경 전 -->
<span>같은 필지에 여러 시료 접수 가능 (비고로 구분)</span>

<!-- 변경 후 -->
<span>같은 필지에 여러 시료 접수 가능 (기타주소로 구분)</span>
```

### 5. 흙토람 엑셀 내보내기 R열에 기타주소 반영

**파일**: `src/heuktoram/heuktoram-script.js` (라인 1159)

흙토람 토양검정 일괄입력 서식 내보내기 시 기타주소를 R열에 자동 반영:

```javascript
// src/heuktoram/heuktoram-script.js, 라인 1159
dataRow[17] = row.parcel?.note || ''; // 기타주소
```

- **기술 배경**: 흙토람 서식은 고정 컬럼 구조이며 R열(인덱스 17)이 "기타주소"로 정의되어 있음
- **동작**: 토양 접수 목록에서 선택된 시료의 첫 번째 필지 `parcel.note` 값을 흙토람 R열에 매핑
- **데이터 흐름**: 토양 접수 → 흙토람 편집 → 엑셀 내보내기 시 기타주소 자동 포함

---

## 데이터 구조

기타주소는 토양 시료의 필지(parcel) 객체 내 `note` 필드에 저장됩니다:

```javascript
// 토양 시료 데이터 구조 (localStorage 또는 Firestore)
{
  id: 'soil-001',
  date: '2026-03-13',
  name: '농가명',
  receptionNumber: 'RCP-001',
  address: '봉화군 봉화읍',
  addressRoad: '봉화군 봉화읍 메인로 123',
  addressDetail: '(12345)',
  note: '시료 수준의 메모',      // 시료 비고 필드

  // 필지 정보
  parcels: [
    {
      id: 'parcel-001',
      lotAddress: '봉화군 봉화읍 내성리 123',
      isMountain: false,
      note: '1동',              // ← 기타주소 (필지별 note)
      crops: [
        {
          name: '벼',
          area: '1000',
          unit: 'm2'
        }
      ],
      subLots: []
    },
    {
      id: 'parcel-002',
      lotAddress: '봉화군 봉화읍 내성리 456',
      isMountain: false,
      note: '2동',              // ← 기타주소
      crops: [
        {
          name: '보리',
          area: '500',
          unit: 'm2'
        }
      ],
      subLots: []
    }
  ]
}
```

**필드명 설명**:
- `note` (시료 수준): 전체 시료에 대한 추가 정보 (기존 "비고")
- `parcel.note` (필지 수준): 각 필지별 추가 주소 정보 (기타주소)

---

## 영향 범위

### 변경된 페이지

1. **토양 시료 접수 폼** (`src/soil/index.html`)
   - 필지 입력 폼: "비고" → "기타주소" 라벨 변경
   - 안내 배너: "비고로 구분" → "기타주소로 구분" 문구 변경

2. **토양 목록 페이지** (`src/soil/index.html`, `src/soil/soil-script.js`)
   - 목록 테이블 헤더 추가: "기타주소" 컬럼 (필지 주소 다음)
   - 목록 렌더링: 첫 번째 필지의 기타주소 표시
   - 농가별 구분 separator: colSpan 조정 (17→18)

3. **토양 상세보기 모달** (`src/soil/soil-script.js`)
   - 필지별 기타주소 명확하게 표시

4. **흙토람 엑셀 내보내기** (`src/heuktoram/heuktoram-script.js`)
   - R열(기타주소)에 토양 접수의 필지별 note 값 자동 반영

### 호환성

- **기존 데이터**: 필드명 `note`를 유지하므로 기존 데이터 영향 없음
- **localStorage/Firestore**: 데이터 마이그레이션 불필요
- **엑셀 가져오기**: 기존 엑셀 파일의 "비고" 컬럼을 "기타주소"로 매핑 (ExcelImportManager에서 처리)

---

## 스타일 참고

필지별 기타주소 입력 필드의 스타일은 기존 "비고" 스타일을 유지합니다:

```css
/* src/soil/soil-style.css, 라인 767 */
/* 필지별 기타주소 입력 스타일 */
.parcel-note-row { /* ... */ }
.parcel-note-group { /* ... */ }
.parcel-note-input { /* ... */ }

/* src/soil/soil-style.css, 라인 813 */
/* 다크 모드 필지별 기타주소 */
[data-theme="dark"] .parcel-note-input { /* ... */ }
```

---

## 테스트 항목

이 변경이 완료되었을 때 다음 항목을 검증해야 합니다:

- [ ] 필지 입력 폼에서 "기타주소" 라벨 확인
- [ ] Placeholder "예: 1동, 2동" 표시 확인
- [ ] 목록 테이블에 "기타주소" 컬럼 정상 표시 확인
- [ ] 목록 테이블에서 첫 번째 필지의 기타주소 표시 확인
- [ ] 상세보기 모달에서 필지별 기타주소 표시 확인
- [ ] 흙토람 엑셀 내보내기 시 R열에 기타주소 반영 확인
- [ ] 기존 데이터(기타주소 없는 시료) 호환성 확인
- [ ] 다크모드에서 필지별 기타주소 입력 필드 스타일 정상 표시 확인

---

## 관련 이슈

- **필드명 보존**: `parcel.note` 필드명을 유지하여 기존 데이터와의 호환성 보장
- **테이블 구조 변경**: 기타주소 컬럼 추가로 인한 separator colSpan 조정 필요
- **ExcelImportManager**: 엑셀 가져오기 시 "기타주소", "비고", "메모", "참고" 등의 컬럼명을 `note` 필드로 매핑하도록 설정되어 있음 (호환성 유지)
