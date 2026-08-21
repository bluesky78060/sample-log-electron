/**
 * jszip 타입 스텁 (SAMPL-2-25)
 *
 * ⚠️ 이 파일이 있는 이유는 **타입을 제공하기 위해서가 아니라 막기 위해서다.**
 *
 * `node_modules/jszip/index.d.ts`는 `/// <reference types="node" />`를 갖는다.
 * `src/heuktoram/heuktoram-entry.js`가 jszip을 import하므로 그 참조를 타고
 * `@types/node`가 **브라우저 프로젝트에 통째로 들어온다** (실측: 80개 파일).
 *
 * 그러면 `compilerOptions.types: []`를 비워도 소용이 없다 — `types`는 **자동 포함**만
 * 막을 뿐, 의존성이 직접 적은 `/// <reference types>`는 막지 못하기 때문이다.
 * 그 결과 브라우저 코드에서 `process.platform`·`Buffer`·`__dirname`이 그대로 통과했고,
 * 이 앱의 중심 불변식(Electron vs Web 이중 환경)을 게이트가 잡지 못했다.
 *
 * 그래서 **브라우저 프로젝트에서만** jszip을 이 스텁으로 돌린다
 * (`tsconfig.browser.json`의 `paths`). `tsconfig.node.json`은 쓰지 않는다 —
 * 그쪽은 Node 전역이 정상이라 원래 타입을 그대로 본다.
 *
 * 지금 안전한 이유: `checkJs`가 false여서 실제로 검사되는 것은 `// @ts-check`를 붙인
 * 파일뿐이고, jszip을 쓰는 `heuktoram-entry.js`에는 그 주석이 없다.
 * **타입이 느슨해져 곤란해지는 사용처가 현재 없다.**
 *
 * ⚠️ heuktoram 쪽에 `@ts-check`를 붙이게 되면 이 스텁이 `any`를 주므로,
 *    그때는 스텁을 실제 타입으로 채우거나 다른 방법을 찾아야 한다.
 */
declare const JSZip: any;
export = JSZip;
