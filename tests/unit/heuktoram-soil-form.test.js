import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// 이 저장소는 xlsx 대신 xlsx-js-style을 쓴다(스타일 보존).
import * as XLSX from 'xlsx-js-style'

// 흙토람 토양 일괄입력 서식(41열) 계약 (SAMPL-1-145)
//
// 사용자가 흙토람에서 내려받은 실물 서식을 fixture로 커밋했다. 우리 산출물이 실물과
// 어긋나면 사용자가 받은 파일을 흙토람에 그대로 올릴 수 없다.
//
// ⚠️ 눈으로 훑어 "N가지 차이"를 세는 방식은 두 번 연속 놓쳤다(토양 저장소 3건, 여기서 2건).
//    개수가 아니라 **문자열·위치 전문**을 대조한다.
//
// ⚠️ 기대값을 손으로 옮겨 적지 않는다. 안내문은 fixture에서 유도한다 —
//    하드코딩하면 구현과 테스트가 같은 오해를 공유해 통과해버린다.

const read = (p) => readFileSync(resolve(process.cwd(), p), 'utf8')
const SRC = read('src/heuktoram/heuktoram-script.js')

let ws
beforeAll(() => {
    const buf = readFileSync(resolve(process.cwd(), 'tests/fixtures/heuktoram-soil-form.xlsx'))
    ws = XLSX.read(buf, { type: 'buffer' }).Sheets['검정정보일괄입력']
    expect(ws, 'fixture에 검정정보일괄입력 시트가 없다').toBeTruthy()
})

const col = (c) => XLSX.utils.encode_col(c)

/**
 * 흙토람 내보내기의 dataStyle을 집는다.
 * ⚠️ `const dataStyle`이 파일에 둘 있다 — 흙토람용과 다른 내보내기용.
 *    위치를 지정하지 않으면 파일 순서에 의존한다(플랜 리뷰 MINOR-1).
 */
function soilDataStyle() {
    // 호출부나 주석이 아니라 **메서드 정의**를 앵커로 쓴다.
    // 단순 문자열이면 앞쪽 호출부·주석에 걸려 엉뚱한 dataStyle을 조용히 집을 수 있다.
    const at = SRC.indexOf('applyHeaderStyles(ws, wsData) {')
    expect(at, 'applyHeaderStyles 정의를 찾지 못했다').toBeGreaterThan(-1)
    return objectLiteral('const dataStyle', at)
}

/**
 * 실물은 줄바꿈이 CRLF, 우리는 LF다. Excel은 둘 다 같은 줄바꿈으로 렌더하므로
 * 기능 차이가 없다 — 비교 전에 맞춘다.
 * ⚠️ xlsx-js-style은 xlsx와 달리 CR을 보존한다. 이 저장소는 전자를 쓴다.
 */
const lf = (v) => String(v).replace(/\r\n/g, '\n')

/**
 * 소스의 메서드 본문을 **실제로 실행**해 반환값을 본다.
 * 문자열 포함 검사는 "그 문자열이 파일 어딘가에 있다"만 증명한다 —
 * 실제로 그 값이 쓰이는지는 증명하지 못한다 (코드리뷰 MEDIUM).
 * HeuktoramManager는 export되지 않고 DOMContentLoaded 안에서 생성되므로
 * 직접 인스턴스화할 수 없다. 본문만 떼어 실행한다(this·DOM 미사용 메서드 한정).
 */
function runMethod(name, params, args) {
    const m = SRC.match(new RegExp(`${name}\\(([^)]*)\\) \\{([\\s\\S]*?)\\n    \\}`))
    expect(m, `${name} 본문을 찾지 못했다`).toBeTruthy()
    return new Function(params, m[2])(...args)   // eslint-disable-line no-new-func
}

/**
 * 소스의 객체 리터럴을 실제 객체로 평가한다.
 * ⚠️ 게으른 정규식은 중첩 괄호(border: { ... })에서 끊긴다 — 괄호 균형으로 잡는다.
 */
function objectLiteral(decl, after = 0) {
    const at = SRC.indexOf(`${decl} = {`, after)
    expect(at, `${decl} 리터럴을 찾지 못했다`).toBeGreaterThan(-1)
    let i = SRC.indexOf('{', at), depth = 0, end = -1
    for (let k = i; k < SRC.length; k++) {
        if (SRC[k] === '{') depth++
        else if (SRC[k] === '}' && --depth === 0) { end = k + 1; break }
    }
    expect(end, `${decl}의 닫는 괄호를 찾지 못했다`).toBeGreaterThan(-1)
    return new Function(`return ${SRC.slice(i, end)}`)()
}

/** buildWorksheetData 본문에서 rowN[i] = '...' 리터럴을 뽑는다 */
function rowValues(rowVar) {
    const body = SRC.match(/buildWorksheetData\(rows\)[\s\S]*?\n    \}/)[0]
    const out = {}
    for (const m of body.matchAll(new RegExp(`${rowVar}\\[(\\d+)\\] = ("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*');`, 'g'))) {
        out[+m[1]] = JSON.parse(m[2][0] === "'" ? `"${m[2].slice(1, -1).replace(/"/g, '\\"')}"` : m[2])
    }
    expect(Object.keys(out).length, `${rowVar} 값을 하나도 못 뽑았다 — 소스 형식이 바뀌었나`)
        .toBeGreaterThan(0)
    return out
}

/** row2 안내문 (여러 줄 연결) */
function guideText() {
    const body = SRC.match(/buildWorksheetData\(rows\)[\s\S]*?\n    \}/)[0]
    const m = body.match(/row2\[0\] = ([\s\S]*?);\n/)
    return m[1].split('\n').map(l => l.trim().replace(/^\+\s*/, ''))
        .map(l => JSON.parse(l)).join('')
}

/** 실물 안내문에서 예시행 문장 2개를 뺀 것 = 우리 기대값 */
function expectedGuide() {
    return lf(ws['A2'].v).split('\n')
        .filter(l => !l.startsWith('5번 행은 예시'))
        .map(l => l.replace('5번 행의 예시내용을 삭제 후 작성하시기 바라며, 원활한', '원활한'))
        .join('\n')
}

describe('흙토람 토양 서식 — 실물 대조', () => {
    it('1. A1 제목이 실물과 같다', () => {
        expect(rowValues('row1')[0]).toBe(lf(ws['A1'].v))
    })

    // 🚨 실물을 그대로 복사하면 안 되는 유일한 지점
    it('2. 안내문이 실물과 같다 — 예시행 문장 2개만 뺀다', () => {
        // 실물은 사용자가 채우는 빈 템플릿이라 5행에 예시가 있다.
        // 우리 파일은 **5행부터 사용자의 실제 시료**다(1~4행이 제목·안내·헤더).
        // "5번 행은 예시…삭제 후 작성"을 그대로 두면 안내를 따른 사용자가
        // 자기 첫 시료를 지운다.
        expect(guideText()).toBe(expectedGuide())
        expect(guideText().split('\n')).toHaveLength(18)
        expect(guideText(), '예시행 안내가 남으면 사용자가 자기 데이터를 지운다')
            .not.toContain('5번 행')
        // 마지막 줄을 통째로 지우면 이 문장이 함께 사라진다
        expect(guideText()).toContain('1회당 300건 이하')
    })

    it('3. 3·4행 헤더 41열이 실물과 전부 일치한다', () => {
        const r3 = rowValues('row3'), r4 = rowValues('row4')
        const diffs = []
        for (const [row, ours] of [[3, r3], [4, r4]]) {
            for (let c = 0; c < 41; c++) {
                const real = ws[col(c) + row] ? lf(ws[col(c) + row].v) : undefined
                if ((real || '') !== (ours[c] || '')) {
                    diffs.push(`${row}행 ${col(c)}: 실물=${JSON.stringify(real)} 우리=${JSON.stringify(ours[c])}`)
                }
            }
        }
        expect(diffs, diffs.join(' | ')).toEqual([])
    })

    it('4. 필수 항목 * 표시가 12건이다', () => {
        const starred = Object.values(rowValues('row3')).filter(v => v.includes('*'))
        expect(starred).toHaveLength(12)
        expect(rowValues('row3')[2], '분석의뢰일 뒤 줄바꿈').toBe('*분석의뢰일\n(접수일자)')
    })

    it('5. 흙토람 시트명이 실물과 같다', () => {
        expect(SRC).toContain("book_append_sheet(wb, ws, '검정정보일괄입력')")
    })

    // 🚨 과잉 치환 방어 — 공익직불제는 완전히 다른 서식이다
    it('6. 공익직불제 시트명은 그대로다', () => {
        expect(SRC, '공익직불제까지 바꾸면 그 기능이 깨진다')
            .toContain("book_append_sheet(wb, ws, '일괄등록양식')")
    })

    // 🚨 토양 저장소에서 났던 사고의 역방향 방어 — 메인은 원래 맞다
    it('7. 데이터 검증이 F·G·U에 걸린다', () => {
        // 실제로 실행해 반환값을 본다 — 문자열이 파일에 있는 것만으로는 부족하다.
        const dv = runMethod('buildDataValidations', 'dataRowCount', [3])
        const cols = dv.map(v => v.sqref.match(/^([A-Z]+)/)[1]).sort()
        expect(cols).toEqual(['F', 'G', 'U'])
        // H는 시료번호, AH는 암모니아태질소다 — 걸리면 숫자를 못 넣는다
        expect(cols, 'H(시료번호)에 걸리면 안 된다').not.toContain('H')
        expect(cols, 'AH(암모니아태질소)에 걸리면 안 된다').not.toContain('AH')
    })

    it('8. 검증 범위가 열 전체다', () => {
        // 데이터 3건만 넘겨도 범위가 행 수에 묶이지 않아야 한다
        const dv = runMethod('buildDataValidations', 'dataRowCount', [3])
        for (const v of dv) {
            expect(v.sqref, `${v.sqref}가 데이터 행 수에 묶여 있다`).toContain(':')
            expect(+v.sqref.split(':')[1].replace(/[A-Z]/g, ''), v.sqref).toBe(1048576)
        }
        // 행이 없으면 검증도 없다
        expect(runMethod('buildDataValidations', 'dataRowCount', [0])).toEqual([])
    })

    it('9. 행 높이가 실물과 같다', () => {
        expect(SRC).toContain('hpt: 31.5')
        expect(SRC).toContain('hpt: 309.75')
        expect(SRC).toContain('hpt: 17.45')
    })

    it('10. 숨김이 스페이서·범례 열에만 걸린다', () => {
        // ⚠️ 개수만 세면 **엉뚱한 7개**를 숨겨도 통과한다. 위치를 본다.
        const widths = SRC.match(/getColumnWidths\(\) \{[\s\S]*?\n    \}/)[0]
        const entries = [...widths.matchAll(/\{[^}]*\},\s*\/\/ \[(\d+)\]/g)]
        const hidden = entries.filter(m => m[0].includes('hidden: true')).map(m => +m[1])
        expect(hidden, '스페이서(34) + 범례(35~40)').toEqual([34, 35, 36, 37, 38, 39, 40])
        const dataHidden = entries.filter(m => +m[1] <= 33 && m[0].includes('hidden: true'))
        expect(dataHidden.map(m => +m[1]), '데이터 열이 숨으면 사용자가 입력을 못 한다').toEqual([])
    })

    it('11. 데이터 셀이 텍스트 서식이다', () => {
        // 없으면 사용자가 내보낸 뒤 날짜 칸을 고칠 때 Excel이 일련번호로 바꾼다.
        // xlsx-js-style은 numFmt: '@'를 numFmtId="49"로 내보낸다(실물과 동일).
        expect(soilDataStyle().numFmt).toBe('@')
    })

    it('12. 안내문이 굵은 빨강이다', () => {
        // 실물 fontId 4 = <b/> + color indexed="10". 경고문이 눈에 띄어야 읽는다.
        const a2 = objectLiteral('cellA2.s')
        expect(a2.font.bold).toBe(true)
        expect(a2.font.color.rgb).toBe('FFFF0000')
        // 실물 borderId 4 = bottom thin. A1은 테두리가 없어 우연이 아니다.
        expect(a2.border.bottom.style).toBe('thin')
    })

    // 🚨 여기까지는 "그 객체가 소스에 있다"만 증명했다 (SAMPL-2-21).
    //    xlsx-js-style이 실제 .xlsx로 직렬화하는지는 사람이 손으로만 확인했다.
    //    이제 테스트가 한다 — 프로덕션과 **같은 write 옵션**으로 돌린다.
    //
    // ⚠️ 여전히 증명하지 못하는 것: 내보내기 코드가 이 객체를 실제 셀에 **붙이는지**.
    //    그 연결은 아직 문자열 검색에 기댄다. 닫으려면 export 메서드가 워크시트를
    //    주입받게 고쳐 진짜 산출물을 검사해야 한다.
    it('13. 추출한 스타일 객체가 올바른 OOXML로 직렬화된다', async () => {
        const JSZip = (await import('jszip')).default

        const sheet = XLSX.utils.aoa_to_sheet([['guide'], ['data']])
        sheet.A1.s = objectLiteral('cellA2.s')   // 안내문 스타일
        sheet.A2.s = soilDataStyle()             // 데이터 셀 스타일
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, sheet, 'T')

        const zip = await JSZip.loadAsync(
            XLSX.write(wb, { type: 'array', bookType: 'xlsx' }))
        const styles = await zip.file('xl/styles.xml').async('string')

        // 데이터 셀 — 텍스트 서식이 아니면 사용자가 고친 날짜가 숫자로 바뀐다
        expect(styles, 'numFmt @ → numFmtId 49').toContain('numFmtId="49"')
        expect(styles).toContain('applyNumberFormat="1"')
        // 안내문 — 굵은 빨강 + 아래 구분선
        expect(styles, '굵게').toContain('<b/>')
        expect(styles, '빨강').toContain('rgb="FFFF0000"')
        expect(styles, '아래 테두리').toContain('<bottom style="thin">')
    })
})

// 흙토람 업로드 거부(SAMPL-1-186) — 포장(ZIP) 수준 계약.
// 실측: 흙토람은 [Content_Types].xml이 ZIP 맨 앞이 아니거나 xlsb 본문 선언(Default bin)이
// 남은 SheetJS 출력을 「변조된 확장자」로 거부한다. 둘 중 하나만 고치면 거부된다.
describe('흙토람 xlsx 포장 — 업로드 거부 방지', () => {
    /** 소스의 메서드를 꺼내 실제로 실행한다(HeuktoramManager는 export되지 않는다). */
    const method = (name, async = false) => {
        const m = SRC.match(new RegExp(`\\n    ${async ? 'async ' : ''}${name}\\(([^)]*)\\) \\{([\\s\\S]*?)\\n    \\}\\n`))
        expect(m, `${name} 본문을 찾지 못했다`).toBeTruthy()
        const Fn = async ? Object.getPrototypeOf(async function () {}).constructor : Function
        return new Fn('window', ...m[1].split(',').map(s => s.trim()).filter(Boolean), m[2])
    }

    let JSZip, self
    beforeAll(async () => {
        JSZip = (await import('jszip')).default
        const win = { JSZip }
        const bind = (name, async) => { const f = method(name, async); return (...a) => f.call(self, win, ...a) }
        self = {
            finalizeXlsxPackage: bind('finalizeXlsxPackage', true),
            injectDataValidations: bind('injectDataValidations', true),
            buildDataValidationsXml: bind('buildDataValidationsXml'),
            buildDataValidations: bind('buildDataValidations'),
        }
    })

    const BIN = '<Default Extension="bin" ContentType="application/vnd.ms-excel.sheet.binary.macroEnabled.main"/>'

    /** 프로덕션과 같은 write 옵션의 실제 SheetJS 출력 */
    const sheetJsOutput = () => {
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a', 'b'], ['1', '2']]), '검정정보일괄입력')
        return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    }
    const names = async (buf) => Object.keys((await JSZip.loadAsync(buf)).files)
    const ctOf = async (buf) => (await JSZip.loadAsync(buf)).file('[Content_Types].xml').async('string')

    it('전제: SheetJS 원본 출력은 xlsb bin 선언을 갖고 있다 (이게 사라지면 이 수정이 불필요해졌는지 재확인)', async () => {
        expect(await ctOf(sheetJsOutput())).toContain('binary.macroEnabled.main')
    })

    it('보정 후 [Content_Types].xml이 ZIP 첫 엔트리이고 xlsb bin 선언이 없다', async () => {
        const out = await self.finalizeXlsxPackage(sheetJsOutput())
        expect((await names(out))[0]).toBe('[Content_Types].xml')
        expect(await ctOf(out)).not.toContain('binary.macroEnabled.main')
    })

    it('보정은 그 한 줄만 지운다 — 다른 Default·Override와 다른 엔트리 내용은 그대로다', async () => {
        const src = sheetJsOutput()
        const out = await self.finalizeXlsxPackage(src)
        expect(await ctOf(out)).toBe((await ctOf(src)).replace(BIN, ''))
        const a = await JSZip.loadAsync(src), b = await JSZip.loadAsync(out)
        expect(Object.keys(b.files).sort()).toEqual(Object.keys(a.files).sort())
        for (const n of Object.keys(a.files)) {
            if (n === '[Content_Types].xml' || a.files[n].dir) continue
            expect(await b.file(n).async('string'), n).toBe(await a.file(n).async('string'))
        }
    })

    it('나머지 엔트리의 상대 순서는 유지된다', async () => {
        const src = await names(sheetJsOutput())
        const out = await names(await self.finalizeXlsxPackage(sheetJsOutput()))
        expect(out.slice(1)).toEqual(src.filter(n => n !== '[Content_Types].xml'))
    })

    it('선언이 원래 없으면(SheetJS가 바뀐 경우) 오류 없이 통과하고 순서만 맞춘다', async () => {
        const z = await JSZip.loadAsync(sheetJsOutput())
        z.file('[Content_Types].xml', (await z.file('[Content_Types].xml').async('string')).replace(BIN, ''))
        const out = await self.finalizeXlsxPackage(await z.generateAsync({ type: 'arraybuffer' }))
        expect((await names(out))[0]).toBe('[Content_Types].xml')
        expect(await ctOf(out)).not.toContain('binary.macroEnabled.main')
    })

    it('[Content_Types].xml이 없으면 조용히 통과하지 않고 던진다', async () => {
        const z = await JSZip.loadAsync(sheetJsOutput())
        z.remove('[Content_Types].xml')
        await expect(self.finalizeXlsxPackage(await z.generateAsync({ type: 'arraybuffer' }))).rejects.toThrow()
    })

    it('JSZip이 없으면 조용히 통과하지 않고 던진다', async () => {
        const f = method('finalizeXlsxPackage', true)
        await expect(f.call({}, {}, sheetJsOutput())).rejects.toThrow('JSZip')
    })

    it('검증 목록이 비어 injectDataValidations가 원본을 그대로 돌려줘도 보정은 적용된다', async () => {
        const src = sheetJsOutput()
        const passthrough = await self.injectDataValidations(src, [])
        expect(await ctOf(passthrough)).toContain('binary.macroEnabled.main')   // 이 분기는 재압축하지 않는다
        const out = await self.finalizeXlsxPackage(passthrough)
        expect((await names(out))[0]).toBe('[Content_Types].xml')
        expect(await ctOf(out)).not.toContain('binary.macroEnabled.main')
    })

    it('데이터 검증이 주입된 출력도 보정 후 검증이 그대로 남는다', async () => {
        const out = await self.finalizeXlsxPackage(
            await self.injectDataValidations(sheetJsOutput(), self.buildDataValidations(3)))
        const sheet = await (await JSZip.loadAsync(out)).file('xl/worksheets/sheet1.xml').async('string')
        expect(sheet).toContain('<dataValidations count="3">')
        expect(sheet).toContain('sqref="F5:F1048576"')
        expect((await names(out))[0]).toBe('[Content_Types].xml')
    })

    it('흙토람·공익직불제 두 내보내기 모두 보정을 거쳐 다운로드한다', () => {
        for (const fn of ['exportToHeuktoram', 'exportToGongik']) {
            const body = SRC.match(new RegExp(`async ${fn}\\(\\) \\{[\\s\\S]*?\\n    \\}\\n`))[0]
            expect(body, fn).toMatch(/this\.downloadBuffer\(patchedBuffer,/)
            expect(body, `${fn}: patchedBuffer가 finalizeXlsxPackage 결과여야 한다`)
                .toMatch(/const patchedBuffer = await this\.finalizeXlsxPackage\(\s*await this\.injectDataValidations\(/)
        }
    })
})
