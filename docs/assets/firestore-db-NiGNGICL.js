var ow=Object.defineProperty;var aw=(r,e,t)=>e in r?ow(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var j=(r,e,t)=>aw(r,typeof e!="symbol"?e+"":e,t);const cw=()=>{};var hp={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jg=function(r){const e=[];let t=0;for(let n=0;n<r.length;n++){let s=r.charCodeAt(n);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(s=65536+((s&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},uw=function(r){const e=[];let t=0,n=0;for(;t<r.length;){const s=r[t++];if(s<128)e[n++]=String.fromCharCode(s);else if(s>191&&s<224){const i=r[t++];e[n++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=r[t++],o=r[t++],a=r[t++],c=((s&7)<<18|(i&63)<<12|(o&63)<<6|a&63)-65536;e[n++]=String.fromCharCode(55296+(c>>10)),e[n++]=String.fromCharCode(56320+(c&1023))}else{const i=r[t++],o=r[t++];e[n++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},Jg={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let s=0;s<r.length;s+=3){const i=r[s],o=s+1<r.length,a=o?r[s+1]:0,c=s+2<r.length,l=c?r[s+2]:0,B=i>>2,d=(i&3)<<4|a>>4;let p=(a&15)<<2|l>>6,g=l&63;c||(g=64,o||(p=64)),n.push(t[B],t[d],t[p],t[g])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(jg(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):uw(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let s=0;s<r.length;){const i=t[r.charAt(s++)],a=s<r.length?t[r.charAt(s)]:0;++s;const l=s<r.length?t[r.charAt(s)]:64;++s;const d=s<r.length?t[r.charAt(s)]:64;if(++s,i==null||a==null||l==null||d==null)throw new lw;const p=i<<2|a>>4;if(n.push(p),l!==64){const g=a<<4&240|l>>2;if(n.push(g),d!==64){const w=l<<6&192|d;n.push(w)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class lw extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Bw=function(r){const e=jg(r);return Jg.encodeByteArray(e,!0)},Zc=function(r){return Bw(r).replace(/\./g,"")},oh=function(r){try{return Jg.decodeString(r,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};function eu(r,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:r===void 0&&(r={});break;case Array:r=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!hw(t)||(r[t]=eu(r[t],e[t]));return r}function hw(r){return r!=="__proto__"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ah(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dw=()=>ah().__FIREBASE_DEFAULTS__,fw=()=>{if(typeof process>"u"||typeof hp>"u")return;const r=hp.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},pw=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=r&&oh(r[1]);return e&&JSON.parse(e)},ch=()=>{try{return cw()||dw()||fw()||pw()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},uh=()=>{var r;return(r=ch())==null?void 0:r.config},Cw=r=>{var e;return(e=ch())==null?void 0:e[`_${r}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kg{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gw(r,e){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},n=e||"demo-project",s=r.iat||0,i=r.sub||r.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${n}`,aud:n,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...r};return[Zc(JSON.stringify(t)),Zc(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xe(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function mw(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(xe())}function bu(){var e;const r=(e=ch())==null?void 0:e.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function _w(){return typeof window<"u"||zg()}function zg(){return typeof WorkerGlobalScope<"u"&&typeof self<"u"&&self instanceof WorkerGlobalScope}function Ew(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Wg(){const r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function lh(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Qg(){const r=xe();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function $g(){return!bu()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Yg(){return!bu()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function ra(){try{return typeof indexedDB=="object"}catch{return!1}}function Iw(){return new Promise((r,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(n);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yw="FirebaseError";class bt extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=yw,Object.setPrototypeOf(this,bt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ms.prototype.create)}}class Ms{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?ww(i,n):"Error",a=`${this.serviceName}: ${o} (${s}).`;return new bt(s,a,n)}}function ww(r,e){try{let t=0,n="";for(;t<r.length;){const s=r.indexOf("{$",t);if(s===-1){n+=r.substring(t);break}const i=r.indexOf("}",s+2);if(i===-1){n+=r.substring(t);break}const o=r.substring(s+2,i),a=e[o];n+=r.substring(t,s)+(a!=null?String(a):`<${o}?>`),t=i+1}return n}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dp(r,e){return Object.prototype.hasOwnProperty.call(r,e)}function Dw(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function br(r,e){if(r===e)return!0;const t=Object.keys(r),n=Object.keys(e);for(const s of t){if(!n.includes(s))return!1;const i=r[s],o=e[s];if(fp(i)&&fp(o)){if(!br(i,o))return!1}else if(i!==o)return!1}for(const s of n)if(!t.includes(s))return!1;return!0}function fp(r){return r!==null&&typeof r=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ji(r){const e=[];for(const[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function di(r){const e={};return r.replace(/^\?/,"").split("&").forEach(n=>{if(n){const[s,i]=n.split("=");e[decodeURIComponent(s)]=decodeURIComponent(i)}}),e}function No(r){const e=r.indexOf("?");if(!e)return"";const t=r.indexOf("#",e);return r.substring(e,t>0?t:void 0)}function Xg(r,e){const t=new Tw(r,e);return t.subscribe.bind(t)}class Tw{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let s;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");Aw(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:n},s.next===void 0&&(s.next=ql),s.error===void 0&&(s.error=ql),s.complete===void 0&&(s.complete=ql);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Aw(r,e){if(typeof r!="object"||r===null)return!1;for(const t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function ql(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function re(r){return r&&r._delegate?r._delegate:r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fa(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Zg(r){return(await fetch(r,{credentials:"include"})).ok}class Nn{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rs="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vw{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new Kg;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&n.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(n)return null;throw s}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(bw(e))try{this.getOrInitializeService({instanceIdentifier:rs})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});n.resolve(i)}catch{}}}}clearInstance(e=rs){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=rs){return this.instances.has(e)}getOptions(e=rs){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[i,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(i);n===a&&o.resolve(s)}return s}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);const i=this.instances.get(n);return i&&e(i,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:Rw(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=rs){return this.component?this.component.multipleInstances?e:rs:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Rw(r){return r===rs?void 0:r}function bw(r){return r.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class em{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new vw(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bh=[];var Be;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(Be||(Be={}));const tm={debug:Be.DEBUG,verbose:Be.VERBOSE,info:Be.INFO,warn:Be.WARN,error:Be.ERROR,silent:Be.SILENT},Pw=Be.INFO,Sw={[Be.DEBUG]:"log",[Be.VERBOSE]:"log",[Be.INFO]:"info",[Be.WARN]:"warn",[Be.ERROR]:"error"},Nw=(r,e,...t)=>{if(e<r.logLevel)return;const n=new Date().toISOString(),s=Sw[e];if(s)console[s](`[${n}]  ${r.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Pu{constructor(e){this.name=e,this._logLevel=Pw,this._logHandler=Nw,this._userLogHandler=null,Bh.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in Be))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?tm[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,Be.DEBUG,...e),this._logHandler(this,Be.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,Be.VERBOSE,...e),this._logHandler(this,Be.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,Be.INFO,...e),this._logHandler(this,Be.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,Be.WARN,...e),this._logHandler(this,Be.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,Be.ERROR,...e),this._logHandler(this,Be.ERROR,...e)}}function Ow(r){Bh.forEach(e=>{e.setLogLevel(r)})}function Fw(r,e){for(const t of Bh){let n=null;e&&e.level&&(n=tm[e.level]),r===null?t.userLogHandler=null:t.userLogHandler=(s,i,...o)=>{const a=o.map(c=>{if(c==null)return null;if(typeof c=="string")return c;if(typeof c=="number"||typeof c=="boolean")return c.toString();if(c instanceof Error)return c.message;try{return JSON.stringify(c)}catch{return null}}).filter(c=>c).join(" ");i>=(n??s.logLevel)&&r({level:Be[i].toLowerCase(),message:a,args:o,type:s.name})}}}const Lw=(r,e)=>e.some(t=>r instanceof t);let pp,Cp;function kw(){return pp||(pp=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Vw(){return Cp||(Cp=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const nm=new WeakMap,fB=new WeakMap,rm=new WeakMap,jl=new WeakMap,hh=new WeakMap;function xw(r){const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("success",i),r.removeEventListener("error",o)},i=()=>{t(Dr(r.result)),s()},o=()=>{n(r.error),s()};r.addEventListener("success",i),r.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&nm.set(t,r)}).catch(()=>{}),hh.set(e,r),e}function Mw(r){if(fB.has(r))return;const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("complete",i),r.removeEventListener("error",o),r.removeEventListener("abort",o)},i=()=>{t(),s()},o=()=>{n(r.error||new DOMException("AbortError","AbortError")),s()};r.addEventListener("complete",i),r.addEventListener("error",o),r.addEventListener("abort",o)});fB.set(r,e)}let pB={get(r,e,t){if(r instanceof IDBTransaction){if(e==="done")return fB.get(r);if(e==="objectStoreNames")return r.objectStoreNames||rm.get(r);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Dr(r[e])},set(r,e,t){return r[e]=t,!0},has(r,e){return r instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in r}};function Gw(r){pB=r(pB)}function Uw(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=r.call(Jl(this),e,...t);return rm.set(n,e.sort?e.sort():[e]),Dr(n)}:Vw().includes(r)?function(...e){return r.apply(Jl(this),e),Dr(nm.get(this))}:function(...e){return Dr(r.apply(Jl(this),e))}}function Hw(r){return typeof r=="function"?Uw(r):(r instanceof IDBTransaction&&Mw(r),Lw(r,kw())?new Proxy(r,pB):r)}function Dr(r){if(r instanceof IDBRequest)return xw(r);if(jl.has(r))return jl.get(r);const e=Hw(r);return e!==r&&(jl.set(r,e),hh.set(e,r)),e}const Jl=r=>hh.get(r);function qw(r,e,{blocked:t,upgrade:n,blocking:s,terminated:i}={}){const o=indexedDB.open(r,e),a=Dr(o);return n&&o.addEventListener("upgradeneeded",c=>{n(Dr(o.result),c.oldVersion,c.newVersion,Dr(o.transaction),c)}),t&&o.addEventListener("blocked",c=>t(c.oldVersion,c.newVersion,c)),a.then(c=>{i&&c.addEventListener("close",()=>i()),s&&c.addEventListener("versionchange",l=>s(l.oldVersion,l.newVersion,l))}).catch(()=>{}),a}const jw=["get","getKey","getAll","getAllKeys","count"],Jw=["put","add","delete","clear"],Kl=new Map;function gp(r,e){if(!(r instanceof IDBDatabase&&!(e in r)&&typeof e=="string"))return;if(Kl.get(e))return Kl.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,s=Jw.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(s||jw.includes(t)))return;const i=async function(o,...a){const c=this.transaction(o,s?"readwrite":"readonly");let l=c.store;return n&&(l=l.index(a.shift())),(await Promise.all([l[t](...a),s&&c.done]))[0]};return Kl.set(e,i),i}Gw(r=>({...r,get:(e,t,n)=>gp(e,t)||r.get(e,t,n),has:(e,t)=>!!gp(e,t)||r.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kw{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(zw(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function zw(r){const e=r.getComponent();return(e==null?void 0:e.type)==="VERSION"}const tu="@firebase/app",CB="0.16.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jn=new Pu("@firebase/app"),Ww="@firebase/app-compat",Qw="@firebase/analytics-compat",$w="@firebase/analytics",Yw="@firebase/app-check-compat",Xw="@firebase/app-check",Zw="@firebase/auth",eD="@firebase/auth-compat",tD="@firebase/database",nD="@firebase/data-connect",rD="@firebase/database-compat",sD="@firebase/functions",iD="@firebase/functions-compat",oD="@firebase/installations",aD="@firebase/installations-compat",cD="@firebase/messaging",uD="@firebase/messaging-compat",lD="@firebase/performance",BD="@firebase/performance-compat",hD="@firebase/remote-config",dD="@firebase/remote-config-compat",fD="@firebase/storage",pD="@firebase/storage-compat",CD="@firebase/firestore",gD="@firebase/ai",mD="@firebase/firestore-compat",_D="firebase",ED="12.17.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pr="[DEFAULT]",ID={[tu]:"fire-core",[Ww]:"fire-core-compat",[$w]:"fire-analytics",[Qw]:"fire-analytics-compat",[Xw]:"fire-app-check",[Yw]:"fire-app-check-compat",[Zw]:"fire-auth",[eD]:"fire-auth-compat",[tD]:"fire-rtdb",[nD]:"fire-data-connect",[rD]:"fire-rtdb-compat",[sD]:"fire-fn",[iD]:"fire-fn-compat",[oD]:"fire-iid",[aD]:"fire-iid-compat",[cD]:"fire-fcm",[uD]:"fire-fcm-compat",[lD]:"fire-perf",[BD]:"fire-perf-compat",[hD]:"fire-rc",[dD]:"fire-rc-compat",[fD]:"fire-gcs",[pD]:"fire-gcs-compat",[CD]:"fire-fst",[mD]:"fire-fst-compat",[gD]:"fire-vertex","fire-js":"fire-js",[_D]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sr=new Map,Ei=new Map,Ii=new Map;function sa(r,e){try{r.container.addComponent(e)}catch(t){Jn.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function sm(r,e){r.container.addOrOverwriteComponent(e)}function Nr(r){const e=r.name;if(Ii.has(e))return Jn.debug(`There were multiple attempts to register component ${e}.`),!1;Ii.set(e,r);for(const t of Sr.values())sa(t,r);for(const t of Ei.values())sa(t,r);return!0}function im(r,e){const t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function yD(r,e,t=Pr){im(r,e).clearInstance(t)}function dh(r){return r.options!==void 0}function om(r){return dh(r)?!1:"authIdToken"in r||"appCheckToken"in r||"releaseOnDeref"in r||"automaticDataCollectionEnabled"in r}function ke(r){return r==null?!1:r.settings!==void 0}function wD(){Ii.clear()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const DD={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},kt=new Ms("app","Firebase",DD);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let am=class{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new Nn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw kt.create("app-deleted",{appName:this._name})}};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mp(r,e){const t=oh(r.split(".")[1]);if(t===null){console.error(`FirebaseServerApp ${e} is invalid: second part could not be parsed.`);return}if(JSON.parse(t).exp===void 0){console.error(`FirebaseServerApp ${e} is invalid: expiration claim could not be parsed`);return}const s=JSON.parse(t).exp*1e3,i=new Date().getTime();s-i<=0&&console.error(`FirebaseServerApp ${e} is invalid: the token has expired.`)}class TD extends am{constructor(e,t,n,s){const i=t.automaticDataCollectionEnabled!==void 0?t.automaticDataCollectionEnabled:!0,o={name:n,automaticDataCollectionEnabled:i};if(e.apiKey!==void 0)super(e,o,s);else{const a=e;super(a.options,o,s)}this._serverConfig={automaticDataCollectionEnabled:i,...t},this._serverConfig.authIdToken&&mp(this._serverConfig.authIdToken,"authIdToken"),this._serverConfig.appCheckToken&&mp(this._serverConfig.appCheckToken,"appCheckToken"),this._finalizationRegistry=null,typeof FinalizationRegistry<"u"&&(this._finalizationRegistry=new FinalizationRegistry(()=>{this.automaticCleanup()})),this._refCount=0,this.incRefCount(this._serverConfig.releaseOnDeref),this._serverConfig.releaseOnDeref=void 0,t.releaseOnDeref=void 0,un(tu,CB,"serverapp")}toJSON(){}get refCount(){return this._refCount}incRefCount(e){this.isDeleted||(this._refCount++,e!==void 0&&this._finalizationRegistry!==null&&this._finalizationRegistry.register(e,this))}decRefCount(){return this.isDeleted?0:--this._refCount}automaticCleanup(){ph(this)}get settings(){return this.checkDestroyed(),this._serverConfig}checkDestroyed(){if(this.isDeleted)throw kt.create("server-app-deleted")}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jr=ED;function fh(r,e={}){let t=r;typeof e!="object"&&(e={name:e});const n={name:Pr,automaticDataCollectionEnabled:!0,...e},s=n.name;if(typeof s!="string"||!s)throw kt.create("bad-app-name",{appName:String(s)});if(t||(t=uh()),!t)throw kt.create("no-options");const i=Sr.get(s);if(i)if(br(t,i.options)){if(br(n,i.config))return i;throw kt.create("duplicate-app",{appName:s,mismatchedParam:"config",oldValue:JSON.stringify(i.config),newValue:JSON.stringify(n)})}else throw kt.create("duplicate-app",{appName:s,mismatchedParam:"options",oldValue:JSON.stringify(i.options),newValue:JSON.stringify(t)});const o=new em(s);for(const c of Ii.values())o.addComponent(c);const a=new am(t,n,o);return Sr.set(s,a),a}function AD(r,e={}){if(_w()&&!zg())throw kt.create("invalid-server-app-environment");let t,n=e||{};if(r&&(dh(r)?t=r.options:om(r)?n=r:t=r),n.automaticDataCollectionEnabled===void 0&&(n.automaticDataCollectionEnabled=!0),t||(t=uh()),!t)throw kt.create("no-options");const s={...n,...t};s.releaseOnDeref!==void 0&&delete s.releaseOnDeref;const i=B=>[...B].reduce((d,p)=>Math.imul(31,d)+p.charCodeAt(0)|0,0);if(n.releaseOnDeref!==void 0&&typeof FinalizationRegistry>"u")throw kt.create("finalization-registry-not-supported",{});const o=""+i(JSON.stringify(s)),a=Ei.get(o);if(a)return a.incRefCount(n.releaseOnDeref),a;const c=new em(o);for(const B of Ii.values())c.addComponent(B);const l=new TD(t,n,o,c);return Ei.set(o,l),l}function vD(r=Pr){const e=Sr.get(r);if(!e&&r===Pr&&uh())return fh();if(!e)throw kt.create("no-app",{appName:r});return e}function RD(){return Array.from(Sr.values())}async function ph(r){let e=!1;const t=r.name;Sr.has(t)?(e=!0,Sr.delete(t)):Ei.has(t)&&r.decRefCount()<=0&&(Ei.delete(t),e=!0),e&&(await Promise.all(r.container.getProviders().map(n=>n.delete())),r.isDeleted=!0)}function un(r,e,t){let n=ID[r]??r;t&&(n+=`-${t}`);const s=n.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${n}" with version "${e}":`];s&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Jn.warn(o.join(" "));return}Nr(new Nn(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}function cm(r,e){if(r!==null&&typeof r!="function")throw kt.create("invalid-log-argument");Fw(r,e)}function um(r){Ow(r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bD="firebase-heartbeat-database",PD=1,ia="firebase-heartbeat-store";let zl=null;function lm(){return zl||(zl=qw(bD,PD,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(ia)}catch(t){console.warn(t)}}}}).catch(r=>{throw kt.create("idb-open",{originalErrorMessage:r.message})})),zl}async function SD(r){try{const t=(await lm()).transaction(ia),n=await t.objectStore(ia).get(Bm(r));return await t.done,n}catch(e){if(e instanceof bt)Jn.warn(e.message);else{const t=kt.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Jn.warn(t.message)}}}async function _p(r,e){try{const n=(await lm()).transaction(ia,"readwrite");await n.objectStore(ia).put(e,Bm(r)),await n.done}catch(t){if(t instanceof bt)Jn.warn(t.message);else{const n=kt.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Jn.warn(n.message)}}}function Bm(r){return`${r.name}!${r.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ND=1024,OD=30;class FD{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new kD(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=Ep();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>OD){const o=VD(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){Jn.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Ep(),{heartbeatsToSend:n,unsentEntries:s}=LD(this._heartbeatsCache.heartbeats),i=Zc(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Jn.warn(t),""}}}function Ep(){return new Date().toISOString().substring(0,10)}function LD(r,e=ND){const t=[];let n=r.slice();for(const s of r){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),Ip(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),Ip(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class kD{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return ra()?Iw().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await SD(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return _p(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return _p(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function Ip(r){return Zc(JSON.stringify({version:2,heartbeats:r})).length}function VD(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xD(r){Nr(new Nn("platform-logger",e=>new Kw(e),"PRIVATE")),Nr(new Nn("heartbeat",e=>new FD(e),"PRIVATE")),un(tu,CB,r),un(tu,CB,"esm2020"),un("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */xD("");const MD=Object.freeze(Object.defineProperty({__proto__:null,FirebaseError:bt,SDK_VERSION:jr,_DEFAULT_ENTRY_NAME:Pr,_addComponent:sa,_addOrOverwriteComponent:sm,_apps:Sr,_clearComponents:wD,_components:Ii,_getProvider:im,_isFirebaseApp:dh,_isFirebaseServerApp:ke,_isFirebaseServerAppSettings:om,_registerComponent:Nr,_removeServiceInstance:yD,_serverApps:Ei,deleteApp:ph,getApp:vD,getApps:RD,initializeApp:fh,initializeServerApp:AD,onLog:cm,registerVersion:un,setLogLevel:um},Symbol.toStringTag,{value:"Module"}));/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GD{constructor(e,t){this._delegate=e,this.firebase=t,sa(e,new Nn("app-compat",()=>this,"PUBLIC")),this.container=e.container}get automaticDataCollectionEnabled(){return this._delegate.automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this._delegate.automaticDataCollectionEnabled=e}get name(){return this._delegate.name}get options(){return this._delegate.options}delete(){return new Promise(e=>{this._delegate.checkDestroyed(),e()}).then(()=>(this.firebase.INTERNAL.removeApp(this.name),ph(this._delegate)))}_getService(e,t=Pr){var s;this._delegate.checkDestroyed();const n=this._delegate.container.getProvider(e);return!n.isInitialized()&&((s=n.getComponent())==null?void 0:s.instantiationMode)==="EXPLICIT"&&n.initialize(),n.getImmediate({identifier:t})}_removeServiceInstance(e,t=Pr){this._delegate.container.getProvider(e).clearInstance(t)}_addComponent(e){sa(this._delegate,e)}_addOrOverwriteComponent(e){sm(this._delegate,e)}toJSON(){return{name:this.name,automaticDataCollectionEnabled:this.automaticDataCollectionEnabled,options:this.options}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const UD={"no-app":"No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance."},yp=new Ms("app-compat","Firebase",UD);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function HD(r){const e={},t={__esModule:!0,initializeApp:i,app:s,registerVersion:un,setLogLevel:um,onLog:cm,apps:null,SDK_VERSION:jr,INTERNAL:{registerComponent:a,removeApp:n,useAsService:c,modularAPIs:MD}};t.default=t,Object.defineProperty(t,"apps",{get:o});function n(l){delete e[l]}function s(l){if(l=l||Pr,!dp(e,l))throw yp.create("no-app",{appName:l});return e[l]}s.App=r;function i(l,B={}){const d=fh(l,B);if(dp(e,d.name))return e[d.name];const p=new r(d,t);return e[d.name]=p,p}function o(){return Object.keys(e).map(l=>e[l])}function a(l){const B=l.name,d=B.replace("-compat","");if(Nr(l)&&l.type==="PUBLIC"){const p=(g=s())=>{if(typeof g[d]!="function")throw yp.create("invalid-app-argument",{appName:B});return g[d]()};l.serviceProps!==void 0&&eu(p,l.serviceProps),t[d]=p,r.prototype[d]=function(...g){return this._getService.bind(this,B).apply(this,l.multipleInstances?g:[])}}return l.type==="PUBLIC"?t[d]:null}function c(l,B){return B==="serverAuth"?null:B}return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hm(){const r=HD(GD);r.INTERNAL={...r.INTERNAL,createFirebaseNamespace:hm,extendNamespace:e,createSubscribe:Xg,ErrorFactory:Ms,deepExtend:eu};function e(t){eu(r,t)}return r}const qD=hm();/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wp=new Pu("@firebase/app-compat"),jD="@firebase/app-compat",JD="0.5.16";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function KD(r){un(jD,JD,r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */try{const r=ah();if(r.firebase!==void 0){wp.warn(`
      Warning: Firebase is already defined in the global scope. Please make sure
      Firebase library is only loaded once.
    `);const e=r.firebase.SDK_VERSION;e&&e.indexOf("LITE")>=0&&wp.warn(`
        Warning: You are trying to load Firebase while using Firebase Performance standalone script.
        You should load Firebase Performance with this instance of Firebase to avoid loading duplicate code.
        `)}}catch{}const tt=qD;KD();var zD="firebase",WD="12.17.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */tt.registerVersion(zD,WD,"app-compat");const yo={FACEBOOK:"facebook.com",GITHUB:"github.com",GOOGLE:"google.com",PASSWORD:"password",TWITTER:"twitter.com"},Ys={EMAIL_SIGNIN:"EMAIL_SIGNIN",PASSWORD_RESET:"PASSWORD_RESET",RECOVER_EMAIL:"RECOVER_EMAIL",REVERT_SECOND_FACTOR_ADDITION:"REVERT_SECOND_FACTOR_ADDITION",VERIFY_AND_CHANGE_EMAIL:"VERIFY_AND_CHANGE_EMAIL",VERIFY_EMAIL:"VERIFY_EMAIL"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QD(){return{"admin-restricted-operation":"This operation is restricted to administrators only.","argument-error":"","app-not-authorized":"This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.","app-not-installed":"The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.","captcha-check-failed":"The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.","code-expired":"The SMS code has expired. Please re-send the verification code to try again.","cordova-not-ready":"Cordova framework is not ready.","cors-unsupported":"This browser is not supported.","credential-already-in-use":"This credential is already associated with a different user account.","custom-token-mismatch":"The custom token corresponds to a different audience.","requires-recent-login":"This operation is sensitive and requires recent authentication. Log in again before retrying this request.","dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK.","dynamic-link-not-activated":"Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.","email-change-needs-verification":"Multi-factor users must always have a verified email.","email-already-in-use":"The email address is already in use by another account.","emulator-config-failed":'Auth instance has already been used to make a network call. Auth can no longer be configured to use the emulator. Try calling "connectAuthEmulator()" sooner.',"expired-action-code":"The action code has expired.","cancelled-popup-request":"This operation has been cancelled due to another conflicting popup being opened.","internal-error":"An internal AuthError has occurred.","invalid-app-credential":"The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.","invalid-app-id":"The mobile app identifier is not registered for the current project.","invalid-user-token":"This user's credential isn't valid for this project. This can happen if the user's token has been tampered with, or if the user isn't for the project associated with this API key.","invalid-auth-event":"An internal AuthError has occurred.","invalid-verification-code":"The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure to use the verification code provided by the user.","invalid-continue-uri":"The continue URL provided in the request is invalid.","invalid-cordova-configuration":"The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.","invalid-custom-token":"The custom token format is incorrect. Please check the documentation.","invalid-dynamic-link-domain":"The provided dynamic link domain is not configured or authorized for the current project.","invalid-email":"The email address is badly formatted.","invalid-emulator-scheme":"Emulator URL must start with a valid scheme (http:// or https://).","invalid-api-key":"Your API key is invalid, please check you have copied it correctly.","invalid-cert-hash":"The SHA-1 certificate hash provided is invalid.","invalid-credential":"The supplied auth credential is incorrect, malformed or has expired.","invalid-message-payload":"The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-multi-factor-session":"The request does not contain a valid proof of first factor successful sign-in.","invalid-oauth-provider":"EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.","invalid-oauth-client-id":"The OAuth client ID provided is either invalid or does not match the specified API key.","unauthorized-domain":"This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.","invalid-action-code":"The action code is invalid. This can happen if the code is malformed, expired, or has already been used.","wrong-password":"The password is invalid or the user does not have a password.","invalid-persistence-type":"The specified persistence type is invalid. It can only be local, session or none.","invalid-phone-number":"The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].","invalid-provider-id":"The specified provider ID is invalid.","invalid-recipient-email":"The email corresponding to this action failed to send as the provided recipient email address is invalid.","invalid-sender":"The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-verification-id":"The verification ID used to create the phone auth credential is invalid.","invalid-tenant-id":"The Auth instance's tenant ID is invalid.","login-blocked":"Login blocked by user-provided method: {$originalMessage}","missing-android-pkg-name":"An Android Package Name must be provided if the Android App is required to be installed.","auth-domain-config-required":"Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.","missing-app-credential":"The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.","missing-verification-code":"The phone auth credential was created with an empty SMS verification code.","missing-continue-uri":"A continue URL must be provided in the request.","missing-iframe-start":"An internal AuthError has occurred.","missing-ios-bundle-id":"An iOS Bundle ID must be provided if an App Store ID is provided.","missing-or-invalid-nonce":"The request does not contain a valid nonce. This can occur if the SHA-256 hash of the provided raw nonce does not match the hashed nonce in the ID token payload.","missing-password":"A non-empty password must be provided","missing-multi-factor-info":"No second factor identifier is provided.","missing-multi-factor-session":"The request is missing proof of first factor successful sign-in.","missing-phone-number":"To send verification codes, provide a phone number for the recipient.","missing-verification-id":"The phone auth credential was created with an empty verification ID.","app-deleted":"This instance of FirebaseApp has been deleted.","multi-factor-info-not-found":"The user does not have a second factor matching the identifier provided.","multi-factor-auth-required":"Proof of ownership of a second factor is required to complete sign-in.","account-exists-with-different-credential":"An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.","network-request-failed":"A network AuthError (such as timeout, interrupted connection or unreachable host) has occurred.","no-auth-event":"An internal AuthError has occurred.","no-such-provider":"User was not linked to an account with the given provider.","null-user":"A null user object was provided as the argument for an operation which requires a non-null user object.","operation-not-allowed":"The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.","operation-not-supported-in-this-environment":'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',"popup-blocked":"Unable to establish a connection with the popup. It may have been blocked by the browser.","popup-closed-by-user":"The popup has been closed by the user before finalizing the operation.","provider-already-linked":"User can only be linked to one identity for the given provider.","quota-exceeded":"The project's quota for this operation has been exceeded.","redirect-cancelled-by-user":"The redirect operation has been cancelled by the user before finalizing.","redirect-operation-pending":"A redirect sign-in operation is already pending.","rejected-credential":"The request contains malformed or mismatching credentials.","second-factor-already-in-use":"The second factor is already enrolled on this account.","maximum-second-factor-count-exceeded":"The maximum allowed number of second factors on a user has been exceeded.","tenant-id-mismatch":"The provided tenant ID does not match the Auth instance's tenant ID",timeout:"The operation has timed out.","user-token-expired":"The user's credential is no longer valid. The user must sign in again.","too-many-requests":"We have blocked all requests from this device due to unusual activity. Try again later.","unauthorized-continue-uri":"The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.","unsupported-first-factor":"Enrolling a second factor or signing in with a multi-factor account requires sign-in with a supported first factor.","unsupported-persistence-type":"The current environment does not support the specified persistence type.","unsupported-tenant-operation":"This operation is not supported in a multi-tenant context.","unverified-email":"The operation requires a verified email.","user-cancelled":"The user did not grant your application the permissions it requested.","user-not-found":"There is no user record corresponding to this identifier. The user may have been deleted.","user-disabled":"The user account has been disabled by an administrator.","user-mismatch":"The supplied credentials do not correspond to the previously signed in user.","user-signed-out":"","weak-password":"The password must be 6 characters long or more.","web-storage-unsupported":"This browser is not supported or 3rd party cookies and data may be disabled.","already-initialized":"initializeAuth() has already been called with different options. To avoid this error, call initializeAuth() with the same options as when it was originally called, or call getAuth() to return the already initialized instance.","missing-recaptcha-token":"The reCAPTCHA token is missing when sending request to the backend.","invalid-recaptcha-token":"The reCAPTCHA token is invalid when sending request to the backend.","invalid-recaptcha-action":"The reCAPTCHA action is invalid when sending request to the backend.","recaptcha-not-enabled":"reCAPTCHA Enterprise integration is not enabled for this project.","missing-client-type":"The reCAPTCHA client type is missing when sending request to the backend.","missing-recaptcha-version":"The reCAPTCHA version is missing when sending request to the backend.","invalid-req-type":"Invalid request parameters.","invalid-recaptcha-version":"The reCAPTCHA version is invalid when sending request to the backend.","unsupported-password-policy-schema-version":"The password policy received from the backend uses a schema version that is not supported by this version of the Firebase SDK.","password-does-not-meet-requirements":"The password does not meet the requirements.","invalid-hosting-link-domain":"The provided Hosting link domain is not configured in Firebase Hosting or is not owned by the current project. This cannot be a default Hosting domain (`web.app` or `firebaseapp.com`)."}}function dm(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const $D=QD,YD=dm,fm=new Ms("auth","Firebase",dm());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nu=new Pu("@firebase/auth");function pm(r,...e){nu.logLevel<=Be.WARN&&nu.warn(`Auth (${jr}): ${r}`,...e)}function xc(r,...e){nu.logLevel<=Be.ERROR&&nu.error(`Auth (${jr}): ${r}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ht(r,...e){throw gh(r,...e)}function nt(r,...e){return gh(r,...e)}function Ch(r,e,t){const n={...YD(),[e]:t};return new Ms("auth","Firebase",n).create(e,{appName:r.name})}function ut(r){return Ch(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Ji(r,e,t){const n=t;if(!(e instanceof n))throw n.name!==e.constructor.name&&ht(r,"argument-error"),Ch(r,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function gh(r,...e){if(typeof r!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return fm.create(r,...e)}function H(r,e,...t){if(!r)throw gh(e,...t)}function In(r){const e="INTERNAL ASSERTION FAILED: "+r;throw xc(e),new Error(e)}function hn(r,e){r||In(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oa(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.href)||""}function mh(){return Dp()==="http:"||Dp()==="https:"}function Dp(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function XD(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(mh()||Wg()||"connection"in navigator)?navigator.onLine:!0}function ZD(){if(typeof navigator>"u")return null;const r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class La{constructor(e,t){this.shortDelay=e,this.longDelay=t,hn(t>e,"Short delay should be less than long delay!"),this.isMobile=mw()||lh()}get(){return XD()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _h(r,e){hn(r.emulator,"Emulator should always be set here");const{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cm{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;In("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;In("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;In("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eT={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tT=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],nT=new La(3e4,6e4);function He(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function qe(r,e,t,n,s={}){return gm(r,s,async()=>{let i={},o={};n&&(e==="GET"?o=n:i={body:JSON.stringify(n)});const a=ji({...o,key:r.config.apiKey}).slice(1),c=await r._getAdditionalHeaders();c["Content-Type"]="application/json",r.languageCode&&(c["X-Firebase-Locale"]=r.languageCode);const l={method:e,headers:c,...i};return Ew()||(l.referrerPolicy="strict-origin-when-cross-origin"),r.emulatorConfig&&Fa(r.emulatorConfig.host)&&(l.credentials="include"),Cm.fetch()(await mm(r,r.config.apiHost,t,a),l)})}async function gm(r,e,t){r._canInitEmulator=!1;const n={...eT,...e};try{const s=new sT(r),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw Oo(r,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const a=i.ok?o.errorMessage:o.error.message,[c,l]=a.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw Oo(r,"credential-already-in-use",o);if(c==="EMAIL_EXISTS")throw Oo(r,"email-already-in-use",o);if(c==="USER_DISABLED")throw Oo(r,"user-disabled",o);const B=n[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(l)throw Ch(r,B,l);ht(r,B)}}catch(s){if(s instanceof bt)throw s;ht(r,"network-request-failed",{message:String(s)})}}async function Xn(r,e,t,n,s={}){const i=await qe(r,e,t,n,s);return"mfaPendingCredential"in i&&ht(r,"multi-factor-auth-required",{_serverResponse:i}),i}async function mm(r,e,t,n){const s=`${e}${t}?${n}`,i=r,o=i.config.emulator?_h(r.config,s):`${r.config.apiScheme}://${s}`;return tT.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}function rT(r){switch(r){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class sT{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(nt(this.auth,"network-request-failed")),nT.get())})}}function Oo(r,e,t){const n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const s=nt(r,e,n);return s.customData._tokenResponse=t,s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tp(r){return r!==void 0&&r.getResponse!==void 0}function Ap(r){return r!==void 0&&r.enterprise!==void 0}class _m{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return rT(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function iT(r){return(await qe(r,"GET","/v1/recaptchaParams")).recaptchaSiteKey||""}async function Em(r,e){return qe(r,"GET","/v2/recaptchaConfig",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function oT(r,e){return qe(r,"POST","/v1/accounts:delete",e)}async function aT(r,e){return qe(r,"POST","/v1/accounts:update",e)}async function ru(r,e){return qe(r,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mo(r){if(r)try{const e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function cT(r,e=!1){const t=re(r),n=await t.getIdToken(e),s=Su(n);H(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:n,authTime:Mo(Wl(s.auth_time)),issuedAtTime:Mo(Wl(s.iat)),expirationTime:Mo(Wl(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function Wl(r){return Number(r)*1e3}function Su(r){const[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return xc("JWT malformed, contained fewer than 3 sections"),null;try{const s=oh(t);return s?JSON.parse(s):(xc("Failed to decode base64 JWT payload"),null)}catch(s){return xc("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function vp(r){const e=Su(r);return H(e,"internal-error"),H(typeof e.exp<"u","internal-error"),H(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Kn(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof bt&&uT(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function uT({code:r}){return r==="auth/user-disabled"||r==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lT{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gB{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Mo(this.lastLoginAt),this.creationTime=Mo(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function aa(r){var d;const e=r.auth,t=await r.getIdToken(),n=await Kn(r,ru(e,{idToken:t}));H(n==null?void 0:n.users.length,e,"internal-error");const s=n.users[0];r._notifyReloadListener(s);const i=(d=s.providerUserInfo)!=null&&d.length?Im(s.providerUserInfo):[],o=hT(r.providerData,i),a=r.isAnonymous,c=!(r.email&&s.passwordHash)&&!(o!=null&&o.length),l=a?c:!1,B={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new gB(s.createdAt,s.lastLoginAt),isAnonymous:l};Object.assign(r,B)}async function BT(r){const e=re(r);await aa(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function hT(r,e){return[...r.filter(n=>!e.some(s=>s.providerId===n.providerId)),...e]}function Im(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dT(r,e){const t=await gm(r,{},async()=>{const n=ji({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=r.config,o=await mm(r,s,"/v1/token",`key=${i}`),a=await r._getAdditionalHeaders();a["Content-Type"]="application/x-www-form-urlencoded";const c={method:"POST",headers:a,body:n};return r.emulatorConfig&&Fa(r.emulatorConfig.host)&&(c.credentials="include"),Cm.fetch()(o,c)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function fT(r,e){return qe(r,"POST","/v2/accounts:revokeToken",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fi{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){H(e.idToken,"internal-error"),H(typeof e.idToken<"u","internal-error"),H(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):vp(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){H(e.length!==0,"internal-error");const t=vp(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(H(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:s,expiresIn:i}=await dT(e,t);this.updateTokensAndExpiration(n,s,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:s,expirationTime:i}=t,o=new fi;return n&&(H(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),s&&(H(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&(H(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new fi,this.toJSON())}_performRefresh(){return In("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lr(r,e){H(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}class cn{constructor({uid:e,auth:t,stsTokenManager:n,...s}){this.providerId="firebase",this.proactiveRefresh=new lT(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new gB(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await Kn(this,this.stsTokenManager.getToken(this.auth,e));return H(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return cT(this,e)}reload(){return BT(this)}_assign(e){this!==e&&(H(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new cn({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){H(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await aa(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(ke(this.auth.app))return Promise.reject(ut(this.auth));const e=await this.getIdToken();return await Kn(this,oT(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,a=t.tenantId??void 0,c=t._redirectEventId??void 0,l=t.createdAt??void 0,B=t.lastLoginAt??void 0,{uid:d,emailVerified:p,isAnonymous:g,providerData:w,stsTokenManager:N}=t;H(d&&N,e,"internal-error");const M=fi.fromJSON(this.name,N);H(typeof d=="string",e,"internal-error"),lr(n,e.name),lr(s,e.name),H(typeof p=="boolean",e,"internal-error"),H(typeof g=="boolean",e,"internal-error"),lr(i,e.name),lr(o,e.name),lr(a,e.name),lr(c,e.name),lr(l,e.name),lr(B,e.name);const W=new cn({uid:d,auth:e,email:s,emailVerified:p,displayName:n,isAnonymous:g,photoURL:o,phoneNumber:i,tenantId:a,stsTokenManager:M,createdAt:l,lastLoginAt:B});return w&&Array.isArray(w)&&(W.providerData=w.map(te=>({...te}))),c&&(W._redirectEventId=c),W}static async _fromIdTokenResponse(e,t,n=!1){const s=new fi;s.updateFromServerResponse(t);const i=new cn({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:n});return await aa(i),i}static async _fromGetAccountInfoResponse(e,t,n){const s=t.users[0];H(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?Im(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),a=new fi;a.updateFromIdToken(n);const c=new cn({uid:s.localId,auth:e,stsTokenManager:a,isAnonymous:o}),l={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new gB(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(c,l),c}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rp=new Map;function zt(r){hn(r instanceof Function,"Expected a class definition");let e=Rp.get(r);return e?(hn(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,Rp.set(r,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ym{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}ym.type="NONE";const yi=ym;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Es(r,e,t){return`firebase:${r}:${e}:${t}`}class pi{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:s,name:i}=this.auth;this.fullUserKey=Es(this.userKey,s.apiKey,i),this.fullPersistenceKey=Es("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await ru(this.auth,{idToken:e}).catch(()=>{});return t?cn._fromGetAccountInfoResponse(this.auth,t,e):null}return cn._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,n="authUser"){if(!t.length)return new pi(zt(yi),e,n);const s=(await Promise.all(t.map(async l=>{if(await l._isAvailable())return l}))).filter(l=>l);let i=s[0]||zt(yi);const o=Es(n,e.config.apiKey,e.name);let a=null;for(const l of t)try{const B=await l._get(o);if(B){let d;if(typeof B=="string"){const p=await ru(e,{idToken:B}).catch(()=>{});if(!p)break;d=await cn._fromGetAccountInfoResponse(e,p,B)}else d=cn._fromJSON(e,B);l!==i&&(a=d),i=l;break}}catch{}const c=s.filter(l=>l._shouldAllowMigration);return!i._shouldAllowMigration||!c.length?new pi(i,e,n):(i=c[0],a&&await i._set(o,a.toJSON()),await Promise.all(t.map(async l=>{if(l!==i)try{await l._remove(o)}catch{}})),new pi(i,e,n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bp(r){const e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Am(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(wm(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(vm(e))return"Blackberry";if(Rm(e))return"Webos";if(Dm(e))return"Safari";if((e.includes("chrome/")||Tm(e))&&!e.includes("edge/"))return"Chrome";if(ka(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function wm(r=xe()){return/firefox\//i.test(r)}function Dm(r=xe()){const e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Tm(r=xe()){return/crios\//i.test(r)}function Am(r=xe()){return/iemobile/i.test(r)}function ka(r=xe()){return/android/i.test(r)}function vm(r=xe()){return/blackberry/i.test(r)}function Rm(r=xe()){return/webos/i.test(r)}function Va(r=xe()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function pT(r=xe()){return/(iPad|iPhone|iPod).*OS 7_\d/i.test(r)||/(iPad|iPhone|iPod).*OS 8_\d/i.test(r)}function CT(r=xe()){var e;return Va(r)&&!!((e=window.navigator)!=null&&e.standalone)}function gT(){return Qg()&&document.documentMode===10}function bm(r=xe()){return Va(r)||ka(r)||Rm(r)||vm(r)||/windows phone/i.test(r)||Am(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pm(r,e=[]){let t;switch(r){case"Browser":t=bp(xe());break;case"Worker":t=`${bp(xe())}-${r}`;break;default:t=r}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${jr}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mT{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=i=>new Promise((o,a)=>{try{const c=e(i);o(c)}catch(c){a(c)}});n.onAbort=t,this.queue.push(n);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _T(r,e={}){return qe(r,"GET","/v2/passwordPolicy",He(r,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ET=6;class IT{constructor(e){var n;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??ET,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let s=0;s<e.length;s++)n=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yT{constructor(e,t,n,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Pp(this),this.idTokenSubscription=new Pp(this),this.beforeStateQueue=new mT(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=fm,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=zt(t)),this._initializationPromise=this.queue(async()=>{var n,s,i;if(!this._deleted&&(this.persistenceManager=await pi.create(this,e),(n=this._resolvePersistenceManagerAvailable)==null||n.call(this),!this._deleted)){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await ru(this,{idToken:e}),n=await cn._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(ke(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,a=n==null?void 0:n._redirectEventId,c=await this.tryRedirectSignIn(e);(!o||o===a)&&(c!=null&&c.user)&&(n=c.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(o){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return H(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await aa(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=ZD()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(ke(this.app))return Promise.reject(ut(this));const t=e?re(e):null;return t&&H(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&H(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return ke(this.app)?Promise.reject(ut(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return ke(this.app)?Promise.reject(ut(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(zt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await _T(this),t=new IT(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new Ms("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await fT(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&zt(e)||this._popupRedirectResolver;H(t,this,"argument-error"),this.redirectPersistenceManager=await pi.create(this,[zt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(H(a,this,"internal-error"),a.then(()=>{o||i(this.currentUser)}),typeof t=="function"){const c=e.addObserver(t,n,s);return()=>{o=!0,c()}}else{const c=e.addObserver(t);return()=>{o=!0,c()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return H(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Pm(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(ke(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&pm(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Me(r){return re(r)}class Pp{constructor(e){this.auth=e,this.observer=null,this.addObserver=Xg(t=>this.observer=t)}get next(){return H(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let xa={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function wT(r){xa=r}function Eh(r){return xa.loadJS(r)}function DT(){return xa.recaptchaV2Script}function TT(){return xa.recaptchaEnterpriseScript}function AT(){return xa.gapiScript}function Sm(r){return`__${r}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vT=500,RT=6e4,wc=1e12;class bT{constructor(e){this.auth=e,this.counter=wc,this._widgets=new Map}render(e,t){const n=this.counter;return this._widgets.set(n,new NT(e,this.auth.name,t||{})),this.counter++,n}reset(e){var n;const t=e||wc;(n=this._widgets.get(t))==null||n.delete(),this._widgets.delete(t)}getResponse(e){var n;const t=e||wc;return((n=this._widgets.get(t))==null?void 0:n.getResponse())||""}async execute(e){var n;const t=e||wc;return(n=this._widgets.get(t))==null||n.execute(),""}}class PT{constructor(){this.enterprise=new ST}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class ST{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class NT{constructor(e,t,n){this.params=n,this.timerId=null,this.deleted=!1,this.responseToken=null,this.clickHandler=()=>{this.execute()};const s=typeof e=="string"?document.getElementById(e):e;H(s,"argument-error",{appName:t}),this.container=s,this.isVisible=this.params.size!=="invisible",this.isVisible?this.execute():this.container.addEventListener("click",this.clickHandler)}getResponse(){return this.checkIfDeleted(),this.responseToken}delete(){this.checkIfDeleted(),this.deleted=!0,this.timerId&&(clearTimeout(this.timerId),this.timerId=null),this.container.removeEventListener("click",this.clickHandler)}execute(){this.checkIfDeleted(),!this.timerId&&(this.timerId=window.setTimeout(()=>{this.responseToken=OT(50);const{callback:e,"expired-callback":t}=this.params;if(e)try{e(this.responseToken)}catch{}this.timerId=window.setTimeout(()=>{if(this.timerId=null,this.responseToken=null,t)try{t()}catch{}this.isVisible&&this.execute()},RT)},vT))}checkIfDeleted(){if(this.deleted)throw new Error("reCAPTCHA mock was already deleted!")}}function OT(r){const e=[],t="1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";for(let n=0;n<r;n++)e.push(t.charAt(Math.floor(Math.random()*t.length)));return e.join("")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const FT="recaptcha-enterprise",Go="NO_RECAPTCHA",Sp="onFirebaseAuthREInstanceReady";class xn{constructor(e){this.type=FT,this.auth=Me(e)}async verify(e="verify",t=!1){async function n(i){if(!t){if(i.tenantId==null&&i._agentRecaptchaConfig!=null)return i._agentRecaptchaConfig.siteKey;if(i.tenantId!=null&&i._tenantRecaptchaConfigs[i.tenantId]!==void 0)return i._tenantRecaptchaConfigs[i.tenantId].siteKey}return new Promise(async(o,a)=>{Em(i,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(c=>{if(c.recaptchaKey===void 0)a(new Error("recaptcha Enterprise site key undefined"));else{const l=new _m(c);return i.tenantId==null?i._agentRecaptchaConfig=l:i._tenantRecaptchaConfigs[i.tenantId]=l,o(l.siteKey)}}).catch(c=>{a(c)})})}function s(i,o,a){const c=window.grecaptcha;Ap(c)?c.enterprise.ready(()=>{c.enterprise.execute(i,{action:e}).then(l=>{o(l)}).catch(()=>{o(Go)})}):a(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new PT().execute("siteKey",{action:"verify"}):new Promise((i,o)=>{n(this.auth).then(async a=>{if(!t&&Ap(window.grecaptcha)&&xn.scriptInjectionDeferred)await xn.scriptInjectionDeferred.promise,s(a,i,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let c=TT();c.length!==0&&(c+=a+`&onload=${Sp}`),xn.scriptInjectionDeferred=new Kg,window[Sp]=()=>{var l;(l=xn.scriptInjectionDeferred)==null||l.resolve()},Eh(c).then(()=>{var l;return(l=xn.scriptInjectionDeferred)==null?void 0:l.promise}).then(()=>{s(a,i,o)}).catch(l=>{o(l)})}}).catch(a=>{o(a)})})}}xn.scriptInjectionDeferred=null;async function wo(r,e,t,n=!1,s=!1){const i=new xn(r);let o;if(s)o=Go;else try{o=await i.verify(t)}catch{o=await i.verify(t,!0)}const a={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in a){const c=a.phoneEnrollmentInfo.phoneNumber,l=a.phoneEnrollmentInfo.recaptchaToken;Object.assign(a,{phoneEnrollmentInfo:{phoneNumber:c,recaptchaToken:l,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in a){const c=a.phoneSignInInfo.recaptchaToken;Object.assign(a,{phoneSignInInfo:{recaptchaToken:c,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return a}return n?Object.assign(a,{captchaResp:o}):Object.assign(a,{captchaResponse:o}),Object.assign(a,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(a,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),a}async function Tr(r,e,t,n,s){var i,o;if(s==="EMAIL_PASSWORD_PROVIDER")if((i=r._getRecaptchaConfig())!=null&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const a=await wo(r,e,t,t==="getOobCode");return n(r,a)}else return n(r,e).catch(async a=>{if(a.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const c=await wo(r,e,t,t==="getOobCode");return n(r,c)}else return Promise.reject(a)});else if(s==="PHONE_PROVIDER")if((o=r._getRecaptchaConfig())!=null&&o.isProviderEnabled("PHONE_PROVIDER")){const a=await wo(r,e,t);return n(r,a).catch(async c=>{var l;if(((l=r._getRecaptchaConfig())==null?void 0:l.getProviderEnforcementState("PHONE_PROVIDER"))==="AUDIT"&&(c.code==="auth/missing-recaptcha-token"||c.code==="auth/invalid-app-credential")){console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${t} flow.`);const B=await wo(r,e,t,!1,!0);return n(r,B)}return Promise.reject(c)})}else{const a=await wo(r,e,t,!1,!0);return n(r,a)}else return Promise.reject(s+" provider is not supported.")}async function LT(r){const e=Me(r),t=await Em(e,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}),n=new _m(t);e.tenantId==null?e._agentRecaptchaConfig=n:e._tenantRecaptchaConfigs[e.tenantId]=n,n.isAnyProviderEnabled()&&new xn(e).verify()}function kT(r,e){const t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(zt);e!=null&&e.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function VT(r,e,t){const n=Me(r);H(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const s=!!(t!=null&&t.disableWarnings),i=Nm(e),{host:o,port:a}=xT(e),c=a===null?"":`:${a}`,l={url:`${i}//${o}${c}/`},B=Object.freeze({host:o,port:a,protocol:i.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!n._canInitEmulator){H(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),H(br(l,n.config.emulator)&&br(B,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=l,n.emulatorConfig=B,n.settings.appVerificationDisabledForTesting=!0,Fa(o)?Zg(`${i}//${o}${c}`):s||MT()}function Nm(r){const e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function xT(r){const e=Nm(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(n);if(s){const i=s[1];return{host:i,port:Np(n.substr(i.length+1))}}else{const[i,o]=n.split(":");return{host:i,port:Np(o)}}}function Np(r){if(!r)return null;const e=Number(r);return isNaN(e)?null:e}function MT(){function r(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ki{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return In("not implemented")}_getIdTokenResponse(e){return In("not implemented")}_linkToIdToken(e,t){return In("not implemented")}_getReauthenticationResolver(e){return In("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Om(r,e){return qe(r,"POST","/v1/accounts:resetPassword",He(r,e))}async function GT(r,e){return qe(r,"POST","/v1/accounts:update",e)}async function UT(r,e){return qe(r,"POST","/v1/accounts:signUp",e)}async function HT(r,e){return qe(r,"POST","/v1/accounts:update",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qT(r,e){return Xn(r,"POST","/v1/accounts:signInWithPassword",He(r,e))}async function Nu(r,e){return qe(r,"POST","/v1/accounts:sendOobCode",He(r,e))}async function jT(r,e){return Nu(r,e)}async function JT(r,e){return Nu(r,e)}async function KT(r,e){return Nu(r,e)}async function zT(r,e){return Nu(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function WT(r,e){return Xn(r,"POST","/v1/accounts:signInWithEmailLink",He(r,e))}async function QT(r,e){return Xn(r,"POST","/v1/accounts:signInWithEmailLink",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ca extends Ki{constructor(e,t,n,s=null){super("password",n),this._email=e,this._password=t,this._tenantId=s}static _fromEmailAndPassword(e,t){return new ca(e,t,"password")}static _fromEmailAndCode(e,t,n=null){return new ca(e,t,"emailLink",n)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Tr(e,t,"signInWithPassword",qT,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return WT(e,{email:this._email,oobCode:this._password});default:ht(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const n={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Tr(e,n,"signUpPassword",UT,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return QT(e,{idToken:t,email:this._email,oobCode:this._password});default:ht(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hn(r,e){return Xn(r,"POST","/v1/accounts:signInWithIdp",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $T="http://localhost";class On extends Ki{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new On(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):ht("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,...i}=t;if(!n||!s)return null;const o=new On(n,s);return o.idToken=i.idToken||void 0,o.accessToken=i.accessToken||void 0,o.secret=i.secret,o.nonce=i.nonce,o.pendingToken=i.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return Hn(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,Hn(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Hn(e,t)}buildRequest(){const e={requestUri:$T,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=ji(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Op(r,e){return qe(r,"POST","/v1/accounts:sendVerificationCode",He(r,e))}async function YT(r,e){return Xn(r,"POST","/v1/accounts:signInWithPhoneNumber",He(r,e))}async function XT(r,e){const t=await Xn(r,"POST","/v1/accounts:signInWithPhoneNumber",He(r,e));if(t.temporaryProof)throw Oo(r,"account-exists-with-different-credential",t);return t}const ZT={USER_NOT_FOUND:"user-not-found"};async function eA(r,e){const t={...e,operation:"REAUTH"};return Xn(r,"POST","/v1/accounts:signInWithPhoneNumber",He(r,t),ZT)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Is extends Ki{constructor(e){super("phone","phone"),this.params=e}static _fromVerification(e,t){return new Is({verificationId:e,verificationCode:t})}static _fromTokenResponse(e,t){return new Is({phoneNumber:e,temporaryProof:t})}_getIdTokenResponse(e){return YT(e,this._makeVerificationRequest())}_linkToIdToken(e,t){return XT(e,{idToken:t,...this._makeVerificationRequest()})}_getReauthenticationResolver(e){return eA(e,this._makeVerificationRequest())}_makeVerificationRequest(){const{temporaryProof:e,phoneNumber:t,verificationId:n,verificationCode:s}=this.params;return e&&t?{temporaryProof:e,phoneNumber:t}:{sessionInfo:n,code:s}}toJSON(){const e={providerId:this.providerId};return this.params.phoneNumber&&(e.phoneNumber=this.params.phoneNumber),this.params.temporaryProof&&(e.temporaryProof=this.params.temporaryProof),this.params.verificationCode&&(e.verificationCode=this.params.verificationCode),this.params.verificationId&&(e.verificationId=this.params.verificationId),e}static fromJSON(e){typeof e=="string"&&(e=JSON.parse(e));const{verificationId:t,verificationCode:n,phoneNumber:s,temporaryProof:i}=e;return!n&&!t&&!s&&!i?null:new Is({verificationId:t,verificationCode:n,phoneNumber:s,temporaryProof:i})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tA(r){switch(r){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function nA(r){const e=di(No(r)).link,t=e?di(No(e)).deep_link_id:null,n=di(No(r)).deep_link_id;return(n?di(No(n)).link:null)||n||t||e||r}class Ou{constructor(e){const t=di(No(e)),n=t.apiKey??null,s=t.oobCode??null,i=tA(t.mode??null);H(n&&s&&i,"argument-error"),this.apiKey=n,this.operation=i,this.code=s,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){const t=nA(e);try{return new Ou(t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jr{constructor(){this.providerId=Jr.PROVIDER_ID}static credential(e,t){return ca._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const n=Ou.parseLink(t);return H(n,"argument-error"),ca._fromEmailAndCode(e,n.code,n.tenantId)}}Jr.PROVIDER_ID="password";Jr.EMAIL_PASSWORD_SIGN_IN_METHOD="password";Jr.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zn{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zi extends Zn{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}class Ci extends zi{static credentialFromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;return H("providerId"in t&&"signInMethod"in t,"argument-error"),On._fromParams(t)}credential(e){return this._credential({...e,nonce:e.rawNonce})}_credential(e){return H(e.idToken||e.accessToken,"argument-error"),On._fromParams({...e,providerId:this.providerId,signInMethod:this.providerId})}static credentialFromResult(e){return Ci.oauthCredentialFromTaggedObject(e)}static credentialFromError(e){return Ci.oauthCredentialFromTaggedObject(e.customData||{})}static oauthCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n,oauthTokenSecret:s,pendingToken:i,nonce:o,providerId:a}=e;if(!n&&!s&&!t&&!i||!a)return null;try{return new Ci(a)._credential({idToken:t,accessToken:n,nonce:o,pendingToken:i})}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gn extends zi{constructor(){super("facebook.com")}static credential(e){return On._fromParams({providerId:gn.PROVIDER_ID,signInMethod:gn.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return gn.credentialFromTaggedObject(e)}static credentialFromError(e){return gn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return gn.credential(e.oauthAccessToken)}catch{return null}}}gn.FACEBOOK_SIGN_IN_METHOD="facebook.com";gn.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mn extends zi{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return On._fromParams({providerId:mn.PROVIDER_ID,signInMethod:mn.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return mn.credentialFromTaggedObject(e)}static credentialFromError(e){return mn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return mn.credential(t,n)}catch{return null}}}mn.GOOGLE_SIGN_IN_METHOD="google.com";mn.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _n extends zi{constructor(){super("github.com")}static credential(e){return On._fromParams({providerId:_n.PROVIDER_ID,signInMethod:_n.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return _n.credentialFromTaggedObject(e)}static credentialFromError(e){return _n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return _n.credential(e.oauthAccessToken)}catch{return null}}}_n.GITHUB_SIGN_IN_METHOD="github.com";_n.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rA="http://localhost";class wi extends Ki{constructor(e,t){super(e,e),this.pendingToken=t}_getIdTokenResponse(e){const t=this.buildRequest();return Hn(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,Hn(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Hn(e,t)}toJSON(){return{signInMethod:this.signInMethod,providerId:this.providerId,pendingToken:this.pendingToken}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,pendingToken:i}=t;return!n||!s||!i||n!==s?null:new wi(n,i)}static _create(e,t){return new wi(e,t)}buildRequest(){return{requestUri:rA,returnSecureToken:!0,pendingToken:this.pendingToken}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sA="saml.";class su extends Zn{constructor(e){H(e.startsWith(sA),"argument-error"),super(e)}static credentialFromResult(e){return su.samlCredentialFromTaggedObject(e)}static credentialFromError(e){return su.samlCredentialFromTaggedObject(e.customData||{})}static credentialFromJSON(e){const t=wi.fromJSON(e);return H(t,"argument-error"),t}static samlCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{pendingToken:t,providerId:n}=e;if(!t||!n)return null;try{return wi._create(n,t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class En extends zi{constructor(){super("twitter.com")}static credential(e,t){return On._fromParams({providerId:En.PROVIDER_ID,signInMethod:En.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return En.credentialFromTaggedObject(e)}static credentialFromError(e){return En.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return En.credential(t,n)}catch{return null}}}En.TWITTER_SIGN_IN_METHOD="twitter.com";En.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Fm(r,e){return Xn(r,"POST","/v1/accounts:signUp",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rn{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,s=!1){const i=await cn._fromIdTokenResponse(e,n,s),o=Fp(n);return new rn({user:i,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const s=Fp(n);return new rn({user:e,providerId:s,_tokenResponse:n,operationType:t})}}function Fp(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function iA(r){var s;if(ke(r.app))return Promise.reject(ut(r));const e=Me(r);if(await e._initializationPromise,(s=e.currentUser)!=null&&s.isAnonymous)return new rn({user:e.currentUser,providerId:null,operationType:"signIn"});const t=await Fm(e,{returnSecureToken:!0}),n=await rn._fromIdTokenResponse(e,"signIn",t,!0);return await e._updateCurrentUser(n.user),n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iu extends bt{constructor(e,t,n,s){super(t.code,t.message),this.operationType=n,this.user=s,Object.setPrototypeOf(this,iu.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,s){return new iu(e,t,n,s)}}function Lm(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(i=>{throw i.code==="auth/multi-factor-auth-required"?iu._fromErrorAndOperation(r,i,e,n):i})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function km(r){return new Set(r.map(({providerId:e})=>e).filter(e=>!!e))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function oA(r,e){const t=re(r);await Fu(!0,t,e);const{providerUserInfo:n}=await aT(t.auth,{idToken:await t.getIdToken(),deleteProvider:[e]}),s=km(n||[]);return t.providerData=t.providerData.filter(i=>s.has(i.providerId)),s.has("phone")||(t.phoneNumber=null),await t.auth._persistUserIfCurrent(t),t}async function Ih(r,e,t=!1){const n=await Kn(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return rn._forOperation(r,"link",n)}async function Fu(r,e,t){await aa(e);const n=km(e.providerData),s=r===!1?"provider-already-linked":"no-such-provider";H(n.has(t)===r,e.auth,s)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Vm(r,e,t=!1){const{auth:n}=r;if(ke(n.app))return Promise.reject(ut(n));const s="reauthenticate";try{const i=await Kn(r,Lm(n,s,e,r),t);H(i.idToken,n,"internal-error");const o=Su(i.idToken);H(o,n,"internal-error");const{sub:a}=o;return H(r.uid===a,n,"user-mismatch"),rn._forOperation(r,s,i)}catch(i){throw(i==null?void 0:i.code)==="auth/user-not-found"&&ht(n,"user-mismatch"),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xm(r,e,t=!1){if(ke(r.app))return Promise.reject(ut(r));const n="signIn",s=await Lm(r,n,e),i=await rn._fromIdTokenResponse(r,n,s);return t||await r._updateCurrentUser(i.user),i}async function Lu(r,e){return xm(Me(r),e)}async function Mm(r,e){const t=re(r);return await Fu(!1,t,e.providerId),Ih(t,e)}async function Gm(r,e){return Vm(re(r),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function aA(r,e){return Xn(r,"POST","/v1/accounts:signInWithCustomToken",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function cA(r,e){if(ke(r.app))return Promise.reject(ut(r));const t=Me(r),n=await aA(t,{token:e,returnSecureToken:!0}),s=await rn._fromIdTokenResponse(t,"signIn",n);return await t._updateCurrentUser(s.user),s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ma{constructor(e,t){this.factorId=e,this.uid=t.mfaEnrollmentId,this.enrollmentTime=new Date(t.enrolledAt).toUTCString(),this.displayName=t.displayName}static _fromServerResponse(e,t){return"phoneInfo"in t?yh._fromServerResponse(e,t):"totpInfo"in t?wh._fromServerResponse(e,t):ht(e,"internal-error")}}class yh extends Ma{constructor(e){super("phone",e),this.phoneNumber=e.phoneInfo}static _fromServerResponse(e,t){return new yh(t)}}class wh extends Ma{constructor(e){super("totp",e)}static _fromServerResponse(e,t){return new wh(t)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ku(r,e,t){var n;H(((n=t.url)==null?void 0:n.length)>0,r,"invalid-continue-uri"),H(typeof t.dynamicLinkDomain>"u"||t.dynamicLinkDomain.length>0,r,"invalid-dynamic-link-domain"),H(typeof t.linkDomain>"u"||t.linkDomain.length>0,r,"invalid-hosting-link-domain"),e.continueUrl=t.url,e.dynamicLinkDomain=t.dynamicLinkDomain,e.linkDomain=t.linkDomain,e.canHandleCodeInApp=t.handleCodeInApp,t.iOS&&(H(t.iOS.bundleId.length>0,r,"missing-ios-bundle-id"),e.iOSBundleId=t.iOS.bundleId),t.android&&(H(t.android.packageName.length>0,r,"missing-android-pkg-name"),e.androidInstallApp=t.android.installApp,e.androidMinimumVersionCode=t.android.minimumVersion,e.androidPackageName=t.android.packageName)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Dh(r){const e=Me(r);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function uA(r,e,t){const n=Me(r),s={requestType:"PASSWORD_RESET",email:e,clientType:"CLIENT_TYPE_WEB"};t&&ku(n,s,t),await Tr(n,s,"getOobCode",JT,"EMAIL_PASSWORD_PROVIDER")}async function lA(r,e,t){await Om(re(r),{oobCode:e,newPassword:t}).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&Dh(r),n})}async function BA(r,e){await HT(re(r),{oobCode:e})}async function Um(r,e){const t=re(r),n=await Om(t,{oobCode:e}),s=n.requestType;switch(H(s,t,"internal-error"),s){case"EMAIL_SIGNIN":break;case"VERIFY_AND_CHANGE_EMAIL":H(n.newEmail,t,"internal-error");break;case"REVERT_SECOND_FACTOR_ADDITION":H(n.mfaInfo,t,"internal-error");default:H(n.email,t,"internal-error")}let i=null;return n.mfaInfo&&(i=Ma._fromServerResponse(Me(t),n.mfaInfo)),{data:{email:(n.requestType==="VERIFY_AND_CHANGE_EMAIL"?n.newEmail:n.email)||null,previousEmail:(n.requestType==="VERIFY_AND_CHANGE_EMAIL"?n.email:n.newEmail)||null,multiFactorInfo:i},operation:s}}async function hA(r,e){const{data:t}=await Um(re(r),e);return t.email}async function dA(r,e,t){if(ke(r.app))return Promise.reject(ut(r));const n=Me(r),o=await Tr(n,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",Fm,"EMAIL_PASSWORD_PROVIDER").catch(c=>{throw c.code==="auth/password-does-not-meet-requirements"&&Dh(r),c}),a=await rn._fromIdTokenResponse(n,"signIn",o);return await n._updateCurrentUser(a.user),a}function fA(r,e,t){return ke(r.app)?Promise.reject(ut(r)):Lu(re(r),Jr.credential(e,t)).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&Dh(r),n})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pA(r,e,t){const n=Me(r),s={requestType:"EMAIL_SIGNIN",email:e,clientType:"CLIENT_TYPE_WEB"};function i(o,a){H(a.handleCodeInApp,n,"argument-error"),a&&ku(n,o,a)}i(s,t),await Tr(n,s,"getOobCode",KT,"EMAIL_PASSWORD_PROVIDER")}function CA(r,e){const t=Ou.parseLink(e);return(t==null?void 0:t.operation)==="EMAIL_SIGNIN"}async function gA(r,e,t){if(ke(r.app))return Promise.reject(ut(r));const n=re(r),s=Jr.credentialWithLink(e,t||oa());return H(s._tenantId===(n.tenantId||null),n,"tenant-id-mismatch"),Lu(n,s)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function mA(r,e){return qe(r,"POST","/v1/accounts:createAuthUri",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _A(r,e){const t=mh()?oa():"http://localhost",n={identifier:e,continueUri:t},{signinMethods:s}=await mA(re(r),n);return s||[]}async function EA(r,e){const t=re(r),s={requestType:"VERIFY_EMAIL",idToken:await r.getIdToken()};e&&ku(t.auth,s,e);const{email:i}=await jT(t.auth,s);i!==r.email&&await r.reload()}async function IA(r,e,t){const n=re(r),i={requestType:"VERIFY_AND_CHANGE_EMAIL",idToken:await r.getIdToken(),newEmail:e};t&&ku(n.auth,i,t);const{email:o}=await zT(n.auth,i);o!==r.email&&await r.reload()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yA(r,e){return qe(r,"POST","/v1/accounts:update",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wA(r,{displayName:e,photoURL:t}){if(e===void 0&&t===void 0)return;const n=re(r),i={idToken:await n.getIdToken(),displayName:e,photoUrl:t,returnSecureToken:!0},o=await Kn(n,yA(n.auth,i));n.displayName=o.displayName||null,n.photoURL=o.photoUrl||null;const a=n.providerData.find(({providerId:c})=>c==="password");a&&(a.displayName=n.displayName,a.photoURL=n.photoURL),await n._updateTokensIfNecessary(o)}function DA(r,e){const t=re(r);return ke(t.auth.app)?Promise.reject(ut(t.auth)):Hm(t,e,null)}function TA(r,e){return Hm(re(r),null,e)}async function Hm(r,e,t){const{auth:n}=r,i={idToken:await r.getIdToken(),returnSecureToken:!0};e&&(i.email=e),t&&(i.password=t);const o=await Kn(r,GT(n,i));await r._updateTokensIfNecessary(o,!0)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function AA(r){var s,i;if(!r)return null;const{providerId:e}=r,t=r.rawUserInfo?JSON.parse(r.rawUserInfo):{},n=r.isNewUser||r.kind==="identitytoolkit#SignupNewUserResponse";if(!e&&(r!=null&&r.idToken)){const o=(i=(s=Su(r.idToken))==null?void 0:s.firebase)==null?void 0:i.sign_in_provider;if(o){const a=o!=="anonymous"&&o!=="custom"?o:null;return new gi(n,a)}}if(!e)return null;switch(e){case"facebook.com":return new vA(n,t);case"github.com":return new RA(n,t);case"google.com":return new bA(n,t);case"twitter.com":return new PA(n,t,r.screenName||null);case"custom":case"anonymous":return new gi(n,null);default:return new gi(n,e,t)}}class gi{constructor(e,t,n={}){this.isNewUser=e,this.providerId=t,this.profile=n}}class qm extends gi{constructor(e,t,n,s){super(e,t,n),this.username=s}}class vA extends gi{constructor(e,t){super(e,"facebook.com",t)}}class RA extends qm{constructor(e,t){super(e,"github.com",t,typeof(t==null?void 0:t.login)=="string"?t==null?void 0:t.login:null)}}class bA extends gi{constructor(e,t){super(e,"google.com",t)}}class PA extends qm{constructor(e,t,n){super(e,"twitter.com",t,n)}}function SA(r){const{user:e,_tokenResponse:t}=r;return e.isAnonymous&&!t?{providerId:null,isNewUser:!1,profile:null}:AA(t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ds{constructor(e,t,n){this.type=e,this.credential=t,this.user=n}static _fromIdtoken(e,t){return new ds("enroll",e,t)}static _fromMfaPendingCredential(e){return new ds("signin",e)}toJSON(){return{multiFactorSession:{[this.type==="enroll"?"idToken":"pendingCredential"]:this.credential}}}static fromJSON(e){var t,n;if(e!=null&&e.multiFactorSession){if((t=e.multiFactorSession)!=null&&t.pendingCredential)return ds._fromMfaPendingCredential(e.multiFactorSession.pendingCredential);if((n=e.multiFactorSession)!=null&&n.idToken)return ds._fromIdtoken(e.multiFactorSession.idToken)}return null}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Th{constructor(e,t,n){this.session=e,this.hints=t,this.signInResolver=n}static _fromError(e,t){const n=Me(e),s=t.customData._serverResponse,i=(s.mfaInfo||[]).map(a=>Ma._fromServerResponse(n,a));H(s.mfaPendingCredential,n,"internal-error");const o=ds._fromMfaPendingCredential(s.mfaPendingCredential);return new Th(o,i,async a=>{const c=await a._process(n,o);delete s.mfaInfo,delete s.mfaPendingCredential;const l={...s,idToken:c.idToken,refreshToken:c.refreshToken};switch(t.operationType){case"signIn":const B=await rn._fromIdTokenResponse(n,t.operationType,l);return await n._updateCurrentUser(B.user),B;case"reauthenticate":return H(t.user,n,"internal-error"),rn._forOperation(t.user,t.operationType,l);default:ht(n,"internal-error")}})}async resolveSignIn(e){const t=e;return this.signInResolver(t)}}function NA(r,e){var s;const t=re(r),n=e;return H(e.customData.operationType,t,"argument-error"),H((s=n.customData._serverResponse)==null?void 0:s.mfaPendingCredential,t,"argument-error"),Th._fromError(t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Lp(r,e){return qe(r,"POST","/v2/accounts/mfaEnrollment:start",He(r,e))}function OA(r,e){return qe(r,"POST","/v2/accounts/mfaEnrollment:finalize",He(r,e))}function FA(r,e){return qe(r,"POST","/v2/accounts/mfaEnrollment:withdraw",He(r,e))}class Ah{constructor(e){this.user=e,this.enrolledFactors=[],e._onReload(t=>{t.mfaInfo&&(this.enrolledFactors=t.mfaInfo.map(n=>Ma._fromServerResponse(e.auth,n)))})}static _fromUser(e){return new Ah(e)}async getSession(){return ds._fromIdtoken(await this.user.getIdToken(),this.user)}async enroll(e,t){const n=e,s=await this.getSession(),i=await Kn(this.user,n._process(this.user.auth,s,t));return await this.user._updateTokensIfNecessary(i),this.user.reload()}async unenroll(e){const t=typeof e=="string"?e:e.uid,n=await this.user.getIdToken();try{const s=await Kn(this.user,FA(this.user.auth,{idToken:n,mfaEnrollmentId:t}));this.enrolledFactors=this.enrolledFactors.filter(({uid:i})=>i!==t),await this.user._updateTokensIfNecessary(s),await this.user.reload()}catch(s){throw s}}}const Ql=new WeakMap;function LA(r){const e=re(r);return Ql.has(e)||Ql.set(e,Ah._fromUser(e)),Ql.get(e)}const ou="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jm{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(ou,"1"),this.storage.removeItem(ou),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kA=1e3,VA=10;class Jm extends jm{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=bm(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),s=this.localCache[t];n!==s&&e(t,s,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,a,c)=>{this.notifyListeners(o,c)});return}const n=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},i=this.storage.getItem(n);gT()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,VA):s()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},kA)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Jm.type="LOCAL";const vh=Jm;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Km extends jm{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Km.type="SESSION";const As=Km;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xA(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vu{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const n=new Vu(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:s,data:i}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:s});const a=Array.from(o).map(async l=>l(t.origin,i)),c=await xA(a);t.ports[0].postMessage({status:"done",eventId:n,eventType:s,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Vu.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ga(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class MA{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let i,o;return new Promise((a,c)=>{const l=Ga("",20);s.port1.start();const B=setTimeout(()=>{c(new Error("unsupported_event"))},n);o={messageChannel:s,onMessage(d){const p=d;if(p.data.eventId===l)switch(p.data.status){case"ack":clearTimeout(B),i=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(i),a(p.data.response);break;default:clearTimeout(B),clearTimeout(i),c(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:l,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function We(){return window}function GA(r){We().location.href=r}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rh(){return typeof We().WorkerGlobalScope<"u"&&typeof We().importScripts=="function"}async function UA(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function HA(){var r;return((r=navigator==null?void 0:navigator.serviceWorker)==null?void 0:r.controller)||null}function qA(){return Rh()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zm="firebaseLocalStorageDb",jA=1,au="firebaseLocalStorage",Wm="fbase_key";class Ua{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function xu(r,e){return r.transaction([au],e?"readwrite":"readonly").objectStore(au)}function JA(){const r=indexedDB.deleteDatabase(zm);return new Ua(r).toPromise()}function Qm(){const r=indexedDB.open(zm,jA);return new Promise((e,t)=>{r.addEventListener("error",()=>{t(r.error)}),r.addEventListener("upgradeneeded",()=>{const n=r.result;try{n.createObjectStore(au,{keyPath:Wm})}catch(s){t(s)}}),r.addEventListener("success",async()=>{const n=r.result;n.objectStoreNames.contains(au)?e(n):(n.close(),await JA(),e(await Qm()))})})}async function kp(r,e,t){const n=xu(r,!0).put({[Wm]:e,value:t});return new Ua(n).toPromise()}async function KA(r,e){const t=xu(r,!1).get(e),n=await new Ua(t).toPromise();return n===void 0?null:n.value}function Vp(r,e){const t=xu(r,!0).delete(e);return new Ua(t).toPromise()}const zA=800,WA=3;class $m{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow)),typeof document<"u"&&typeof document.addEventListener=="function"&&document.addEventListener("visibilitychange",this.onVisibilityChange)}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow)),typeof document<"u"&&typeof document.removeEventListener=="function"&&document.removeEventListener("visibilitychange",this.onVisibilityChange)}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isHiding=!1,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isHiding=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isHiding&&(this.isHiding=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this.onVisibilityChange=()=>{typeof document<"u"&&(document.visibilityState==="hidden"?this.onPageHide():document.visibilityState==="visible"&&this.onPageShow())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){if(this.isHiding)throw new Error("Database is closing/hidden");return this.dbPromise?this.dbPromise:(this.dbPromise=Qm(),this.dbPromise.catch(()=>{this.dbPromise=null}),this.dbPromise)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(this.isHiding||t++>WA)throw n;this.dbPromise&&((await this.dbPromise).close(),this.dbPromise=null)}}async initializeServiceWorkerMessaging(){return Rh()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Vu._getInstance(qA()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await UA(),!this.activeServiceWorker)return;this.sender=new MA(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||HA()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{return indexedDB?(await this._withRetries(async e=>{await kp(e,ou,"1"),await Vp(e,ou)}),!0):!1}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>kp(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>KA(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>Vp(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isHiding)return[];try{const e=await this._withRetries(s=>{const i=xu(s,!1).getAll();return new Ua(i).toPromise()});if(this.isHiding)return[];if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:s,value:i}of e)n.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(i)&&(this.notifyListeners(s,i),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!n.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}catch(e){return this.isHiding||pm(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),zA)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}}$m.type="LOCAL";const ua=$m;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xp(r,e){return qe(r,"POST","/v2/accounts/mfaSignIn:start",He(r,e))}function QA(r,e){return qe(r,"POST","/v2/accounts/mfaSignIn:finalize",He(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $l=Sm("rcb"),$A=new La(3e4,6e4);class YA{constructor(){var e;this.hostLanguage="",this.counter=0,this.librarySeparatelyLoaded=!!((e=We().grecaptcha)!=null&&e.render)}load(e,t=""){return H(XA(t),e,"argument-error"),this.shouldResolveImmediately(t)&&Tp(We().grecaptcha)?Promise.resolve(We().grecaptcha):new Promise((n,s)=>{const i=We().setTimeout(()=>{s(nt(e,"network-request-failed"))},$A.get());We()[$l]=()=>{We().clearTimeout(i),delete We()[$l];const a=We().grecaptcha;if(!a||!Tp(a)){s(nt(e,"internal-error"));return}const c=a.render;a.render=(l,B)=>{const d=c(l,B);return this.counter++,d},this.hostLanguage=t,n(a)};const o=`${DT()}?${ji({onload:$l,render:"explicit",hl:t})}`;Eh(o).catch(()=>{clearTimeout(i),s(nt(e,"internal-error"))})})}clearedOneInstance(){this.counter--}shouldResolveImmediately(e){var t;return!!((t=We().grecaptcha)!=null&&t.render)&&(e===this.hostLanguage||this.counter>0||this.librarySeparatelyLoaded)}}function XA(r){return r.length<=6&&/^\s*[a-zA-Z0-9\-]*\s*$/.test(r)}class ZA{async load(e){return new bT(e)}clearedOneInstance(){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uo="recaptcha",ev={theme:"light",type:"image"};let tv=class{constructor(e,t,n={...ev}){this.parameters=n,this.type=Uo,this.destroyed=!1,this.widgetId=null,this.tokenChangeListeners=new Set,this.renderPromise=null,this.recaptcha=null,this.auth=Me(e),this.isInvisible=this.parameters.size==="invisible",H(typeof document<"u",this.auth,"operation-not-supported-in-this-environment");const s=typeof t=="string"?document.getElementById(t):t;H(s,this.auth,"argument-error"),this.container=s,this.parameters.callback=this.makeTokenCallback(this.parameters.callback),this._recaptchaLoader=this.auth.settings.appVerificationDisabledForTesting?new ZA:new YA,this.validateStartingState()}async verify(){this.assertNotDestroyed();const e=await this.render(),t=this.getAssertedRecaptcha(),n=t.getResponse(e);return n||new Promise(s=>{const i=o=>{o&&(this.tokenChangeListeners.delete(i),s(o))};this.tokenChangeListeners.add(i),this.isInvisible&&t.execute(e)})}render(){try{this.assertNotDestroyed()}catch(e){return Promise.reject(e)}return this.renderPromise?this.renderPromise:(this.renderPromise=this.makeRenderPromise().catch(e=>{throw this.renderPromise=null,e}),this.renderPromise)}_reset(){this.assertNotDestroyed(),this.widgetId!==null&&this.getAssertedRecaptcha().reset(this.widgetId)}clear(){this.assertNotDestroyed(),this.destroyed=!0,this._recaptchaLoader.clearedOneInstance(),this.isInvisible||this.container.childNodes.forEach(e=>{this.container.removeChild(e)})}validateStartingState(){H(!this.parameters.sitekey,this.auth,"argument-error"),H(this.isInvisible||!this.container.hasChildNodes(),this.auth,"argument-error"),H(typeof document<"u",this.auth,"operation-not-supported-in-this-environment")}makeTokenCallback(e){return t=>{if(this.tokenChangeListeners.forEach(n=>n(t)),typeof e=="function")e(t);else if(typeof e=="string"){const n=We()[e];typeof n=="function"&&n(t)}}}assertNotDestroyed(){H(!this.destroyed,this.auth,"internal-error")}async makeRenderPromise(){if(await this.init(),!this.widgetId){let e=this.container;if(!this.isInvisible){const t=document.createElement("div");e.appendChild(t),e=t}this.widgetId=this.getAssertedRecaptcha().render(e,this.parameters)}return this.widgetId}async init(){H(mh()&&!Rh(),this.auth,"internal-error"),await nv(),this.recaptcha=await this._recaptchaLoader.load(this.auth,this.auth.languageCode||void 0);const e=await iT(this.auth);H(e,this.auth,"internal-error"),this.parameters.sitekey=e}getAssertedRecaptcha(){return H(this.recaptcha,this.auth,"internal-error"),this.recaptcha}};function nv(){let r=null;return new Promise(e=>{if(document.readyState==="complete"){e();return}r=()=>e(),window.addEventListener("load",r)}).catch(e=>{throw r&&window.removeEventListener("load",r),e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bh{constructor(e,t){this.verificationId=e,this.onConfirmation=t}confirm(e){const t=Is._fromVerification(this.verificationId,e);return this.onConfirmation(t)}}async function rv(r,e,t){if(ke(r.app))return Promise.reject(ut(r));const n=Me(r),s=await Mu(n,e,re(t));return new bh(s,i=>Lu(n,i))}async function sv(r,e,t){const n=re(r);await Fu(!1,n,"phone");const s=await Mu(n.auth,e,re(t));return new bh(s,i=>Mm(n,i))}async function iv(r,e,t){const n=re(r);if(ke(n.auth.app))return Promise.reject(ut(n.auth));const s=await Mu(n.auth,e,re(t));return new bh(s,i=>Gm(n,i))}async function Mu(r,e,t){var n;if(!r._getRecaptchaConfig())try{await LT(r)}catch{console.log("Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.")}try{let s;if(typeof e=="string"?s={phoneNumber:e}:s=e,"session"in s){const i=s.session;if("phoneNumber"in s){H(i.type==="enroll",r,"internal-error");const o={idToken:i.credential,phoneEnrollmentInfo:{phoneNumber:s.phoneNumber,clientType:"CLIENT_TYPE_WEB"}};return(await Tr(r,o,"mfaSmsEnrollment",async(B,d)=>{if(d.phoneEnrollmentInfo.captchaResponse===Go){H((t==null?void 0:t.type)===Uo,B,"argument-error");const p=await Yl(B,d,t);return Lp(B,p)}return Lp(B,d)},"PHONE_PROVIDER").catch(B=>Promise.reject(B))).phoneSessionInfo.sessionInfo}else{H(i.type==="signin",r,"internal-error");const o=((n=s.multiFactorHint)==null?void 0:n.uid)||s.multiFactorUid;H(o,r,"missing-multi-factor-info");const a={mfaPendingCredential:i.credential,mfaEnrollmentId:o,phoneSignInInfo:{clientType:"CLIENT_TYPE_WEB"}};return(await Tr(r,a,"mfaSmsSignIn",async(d,p)=>{if(p.phoneSignInInfo.captchaResponse===Go){H((t==null?void 0:t.type)===Uo,d,"argument-error");const g=await Yl(d,p,t);return xp(d,g)}return xp(d,p)},"PHONE_PROVIDER").catch(d=>Promise.reject(d))).phoneResponseInfo.sessionInfo}}else{const i={phoneNumber:s.phoneNumber,clientType:"CLIENT_TYPE_WEB"};return(await Tr(r,i,"sendVerificationCode",async(l,B)=>{if(B.captchaResponse===Go){H((t==null?void 0:t.type)===Uo,l,"argument-error");const d=await Yl(l,B,t);return Op(l,d)}return Op(l,B)},"PHONE_PROVIDER").catch(l=>Promise.reject(l))).sessionInfo}}finally{t==null||t._reset()}}async function ov(r,e){const t=re(r);if(ke(t.auth.app))return Promise.reject(ut(t.auth));await Ih(t,e)}async function Yl(r,e,t){H(t.type===Uo,r,"argument-error");const n=await t.verify();H(typeof n=="string",r,"argument-error");const s={...e};if("phoneEnrollmentInfo"in s){const i=s.phoneEnrollmentInfo.phoneNumber,o=s.phoneEnrollmentInfo.captchaResponse,a=s.phoneEnrollmentInfo.clientType,c=s.phoneEnrollmentInfo.recaptchaVersion;return Object.assign(s,{phoneEnrollmentInfo:{phoneNumber:i,recaptchaToken:n,captchaResponse:o,clientType:a,recaptchaVersion:c}}),s}else if("phoneSignInInfo"in s){const i=s.phoneSignInInfo.captchaResponse,o=s.phoneSignInInfo.clientType,a=s.phoneSignInInfo.recaptchaVersion;return Object.assign(s,{phoneSignInInfo:{recaptchaToken:n,captchaResponse:i,clientType:o,recaptchaVersion:a}}),s}else return Object.assign(s,{recaptchaToken:n}),s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let vs=class Mc{constructor(e){this.providerId=Mc.PROVIDER_ID,this.auth=Me(e)}verifyPhoneNumber(e,t){return Mu(this.auth,e,re(t))}static credential(e,t){return Is._fromVerification(e,t)}static credentialFromResult(e){const t=e;return Mc.credentialFromTaggedObject(t)}static credentialFromError(e){return Mc.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{phoneNumber:t,temporaryProof:n}=e;return t&&n?Is._fromTokenResponse(t,n):null}};vs.PROVIDER_ID="phone";vs.PHONE_SIGN_IN_METHOD="phone";/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gs(r,e){return e?zt(e):(H(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ph extends Ki{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Hn(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Hn(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Hn(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function av(r){return xm(r.auth,new Ph(r),r.bypassAuthState)}function cv(r){const{auth:e,user:t}=r;return H(t,e,"internal-error"),Vm(t,new Ph(r),r.bypassAuthState)}async function uv(r){const{auth:e,user:t}=r;return H(t,e,"internal-error"),Ih(t,new Ph(r),r.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ym{constructor(e,t,n,s,i=!1){this.auth=e,this.resolver=n,this.user=s,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:s,tenantId:i,error:o,type:a}=e;if(o){this.reject(o);return}const c={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(a)(c))}catch(l){this.reject(l)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return av;case"linkViaPopup":case"linkViaRedirect":return uv;case"reauthViaPopup":case"reauthViaRedirect":return cv;default:ht(this.auth,"internal-error")}}resolve(e){hn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){hn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lv=new La(2e3,1e4);async function Bv(r,e,t){if(ke(r.app))return Promise.reject(nt(r,"operation-not-supported-in-this-environment"));const n=Me(r);Ji(r,e,Zn);const s=Gs(n,t);return new Un(n,"signInViaPopup",e,s).executeNotNull()}async function hv(r,e,t){const n=re(r);if(ke(n.auth.app))return Promise.reject(nt(n.auth,"operation-not-supported-in-this-environment"));Ji(n.auth,e,Zn);const s=Gs(n.auth,t);return new Un(n.auth,"reauthViaPopup",e,s,n).executeNotNull()}async function dv(r,e,t){const n=re(r);Ji(n.auth,e,Zn);const s=Gs(n.auth,t);return new Un(n.auth,"linkViaPopup",e,s,n).executeNotNull()}class Un extends Ym{constructor(e,t,n,s,i){super(e,t,s,i),this.provider=n,this.authWindow=null,this.pollId=null,Un.currentPopupAction&&Un.currentPopupAction.cancel(),Un.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return H(e,this.auth,"internal-error"),e}async onExecution(){hn(this.filter.length===1,"Popup operations only handle one event");const e=Ga();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(nt(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(nt(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Un.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(nt(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,lv.get())};e()}}Un.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fv="pendingRedirect",Ho=new Map;class pv extends Ym{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=Ho.get(this.auth._key());if(!e){try{const n=await Cv(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}Ho.set(this.auth._key(),e)}return this.bypassAuthState||Ho.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function Cv(r,e){const t=Zm(e),n=Xm(r);if(!await n._isAvailable())return!1;const s=await n._get(t)==="true";return await n._remove(t),s}async function Sh(r,e){return Xm(r)._set(Zm(e),"true")}function gv(){Ho.clear()}function Nh(r,e){Ho.set(r._key(),e)}function Xm(r){return zt(r._redirectPersistence)}function Zm(r){return Es(fv,r.config.apiKey,r.name)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mv(r,e,t){return _v(r,e,t)}async function _v(r,e,t){if(ke(r.app))return Promise.reject(ut(r));const n=Me(r);Ji(r,e,Zn),await n._initializationPromise;const s=Gs(n,t);return await Sh(s,n),s._openRedirect(n,e,"signInViaRedirect")}function Ev(r,e,t){return Iv(r,e,t)}async function Iv(r,e,t){const n=re(r);if(Ji(n.auth,e,Zn),ke(n.auth.app))return Promise.reject(ut(n.auth));await n.auth._initializationPromise;const s=Gs(n.auth,t);await Sh(s,n.auth);const i=await e_(n);return s._openRedirect(n.auth,e,"reauthViaRedirect",i)}function yv(r,e,t){return wv(r,e,t)}async function wv(r,e,t){const n=re(r);Ji(n.auth,e,Zn),await n.auth._initializationPromise;const s=Gs(n.auth,t);await Fu(!1,n,e.providerId),await Sh(s,n.auth);const i=await e_(n);return s._openRedirect(n.auth,e,"linkViaRedirect",i)}async function Dv(r,e){return await Me(r)._initializationPromise,Gu(r,e,!1)}async function Gu(r,e,t=!1){if(ke(r.app))return Promise.reject(ut(r));const n=Me(r),s=Gs(n,e),o=await new pv(n,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}async function e_(r){const e=Ga(`${r.uid}:::`);return r._redirectEventId=e,await r.auth._setRedirectUser(r),await r.auth._persistUserIfCurrent(r),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tv=10*60*1e3;class t_{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!Av(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!n_(e)){const s=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(nt(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=Tv&&this.cachedEventUids.clear(),this.cachedEventUids.has(Mp(e))}saveEventToCache(e){this.cachedEventUids.add(Mp(e)),this.lastProcessedEventTime=Date.now()}}function Mp(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function n_({type:r,error:e}){return r==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function Av(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return n_(r);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function r_(r,e={}){return qe(r,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vv=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Rv=/^https?/;async function bv(r){if(r.config.emulator)return;const{authorizedDomains:e}=await r_(r);for(const t of e)try{if(Pv(t))return}catch{}ht(r,"unauthorized-domain")}function Pv(r){const e=oa(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){const o=new URL(r);return o.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!Rv.test(t))return!1;if(vv.test(r))return n===r;const s=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sv=new La(3e4,6e4);function Gp(){const r=We().___jsl;if(r!=null&&r.H){for(const e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function Nv(r){return new Promise((e,t)=>{var s,i,o;function n(){Gp(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Gp(),t(nt(r,"network-request-failed"))},timeout:Sv.get()})}if((i=(s=We().gapi)==null?void 0:s.iframes)!=null&&i.Iframe)e(gapi.iframes.getContext());else if((o=We().gapi)!=null&&o.load)n();else{const a=Sm("iframefcb");return We()[a]=()=>{gapi.load?n():t(nt(r,"network-request-failed"))},Eh(`${AT()}?onload=${a}`).catch(c=>t(c))}}).catch(e=>{throw Gc=null,e})}let Gc=null;function Ov(r){return Gc=Gc||Nv(r),Gc}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fv=new La(5e3,15e3),Lv="__/auth/iframe",kv="emulator/auth/iframe",Vv={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},xv=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Mv(r){const e=r.config;H(e.authDomain,r,"auth-domain-config-required");const t=e.emulator?_h(e,kv):`https://${r.config.authDomain}/${Lv}`,n={apiKey:e.apiKey,appName:r.name,v:jr},s=xv.get(r.config.apiHost);s&&(n.eid=s);const i=r._getFrameworks();return i.length&&(n.fw=i.join(",")),`${t}?${ji(n).slice(1)}`}async function Gv(r){const e=await Ov(r),t=We().gapi;return H(t,r,"internal-error"),e.open({where:document.body,url:Mv(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Vv,dontclear:!0},n=>new Promise(async(s,i)=>{await n.restyle({setHideOnLeave:!1});const o=nt(r,"network-request-failed"),a=We().setTimeout(()=>{i(o)},Fv.get());function c(){We().clearTimeout(a),s(n)}n.ping(c).then(c,()=>{i(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uv={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Hv=500,qv=600,jv="_blank",Jv="http://localhost";class Up{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Kv(r,e,t,n=Hv,s=qv){const i=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let a="";const c={...Uv,width:n.toString(),height:s.toString(),top:i,left:o},l=xe().toLowerCase();t&&(a=Tm(l)?jv:t),wm(l)&&(e=e||Jv,c.scrollbars="yes");const B=Object.entries(c).reduce((p,[g,w])=>`${p}${g}=${w},`,"");if(CT(l)&&a!=="_self")return zv(e||"",a),new Up(null);const d=window.open(e||"",a,B);H(d,r,"popup-blocked");try{d.focus()}catch{}return new Up(d)}function zv(r,e){const t=document.createElement("a");t.href=r,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wv="__/auth/handler",Qv="emulator/auth/handler",$v=encodeURIComponent("fac");async function mB(r,e,t,n,s,i){H(r.config.authDomain,r,"auth-domain-config-required"),H(r.config.apiKey,r,"invalid-api-key");const o={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:jr,eventId:s};if(e instanceof Zn){e.setDefaultLanguage(r.languageCode),o.providerId=e.providerId||"",Dw(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[B,d]of Object.entries(i||{}))o[B]=d}if(e instanceof zi){const B=e.getScopes().filter(d=>d!=="");B.length>0&&(o.scopes=B.join(","))}r.tenantId&&(o.tid=r.tenantId);const a=o;for(const B of Object.keys(a))a[B]===void 0&&delete a[B];const c=await r._getAppCheckToken(),l=c?`#${$v}=${encodeURIComponent(c)}`:"";return`${Yv(r)}?${ji(a).slice(1)}${l}`}function Yv({config:r}){return r.emulator?_h(r,Qv):`https://${r.authDomain}/${Wv}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xl="webStorageSupport";class Xv{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=As,this._completeRedirectFn=Gu,this._overrideRedirectResult=Nh}async _openPopup(e,t,n,s){var o;hn((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const i=await mB(e,t,n,oa(),s);return Kv(e,i,Ga())}async _openRedirect(e,t,n,s){await this._originValidation(e);const i=await mB(e,t,n,oa(),s);return GA(i),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:i}=this.eventManagers[t];return s?Promise.resolve(s):(hn(i,"If manager is not set, promise should be"),i)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await Gv(e),n=new t_(e);return t.register("authEvent",s=>(H(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:n.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Xl,{type:Xl},s=>{var o;const i=(o=s==null?void 0:s[0])==null?void 0:o[Xl];i!==void 0&&t(!!i),ht(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=bv(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return bm()||Dm()||Va()}}const Zv=Xv;class eR{constructor(e){this.factorId=e}_process(e,t,n){switch(t.type){case"enroll":return this._finalizeEnroll(e,t.credential,n);case"signin":return this._finalizeSignIn(e,t.credential);default:return In("unexpected MultiFactorSessionType")}}}class Oh extends eR{constructor(e){super("phone"),this.credential=e}static _fromCredential(e){return new Oh(e)}_finalizeEnroll(e,t,n){return OA(e,{idToken:t,displayName:n,phoneVerificationInfo:this.credential._makeVerificationRequest()})}_finalizeSignIn(e,t){return QA(e,{mfaPendingCredential:t,phoneVerificationInfo:this.credential._makeVerificationRequest()})}}class s_{constructor(){}static assertion(e){return Oh._fromCredential(e)}}s_.FACTOR_ID="phone";var Hp="@firebase/auth",qp="1.13.4";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tR{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){H(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nR(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function rR(r){Nr(new Nn("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=n.options;H(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const c={apiKey:o,authDomain:a,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Pm(r)},l=new yT(n,s,i,c);return kT(l,t),l},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),Nr(new Nn("auth-internal",e=>{const t=Me(e.getProvider("auth").getImmediate());return(n=>new tR(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),un(Hp,qp,nR(r)),un(Hp,qp,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sR=5*60;Cw("authIdTokenMaxAge");function iR(){var r;return((r=document.getElementsByTagName("head"))==null?void 0:r[0])??document}wT({loadJS(r){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",r),n.onload=e,n.onerror=s=>{const i=nt("internal-error");i.customData=s,t(i)},n.type="text/javascript",n.charset="UTF-8",iR().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});rR("Browser");/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rs(){return window}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oR=2e3;async function aR(r,e,t){const{BuildInfo:n}=Rs();hn(e.sessionId,"AuthEvent did not contain a session ID");const s=await hR(e.sessionId),i={};return Va()?i.ibi=n.packageName:ka()?i.apn=n.packageName:ht(r,"operation-not-supported-in-this-environment"),n.displayName&&(i.appDisplayName=n.displayName),i.sessionId=s,mB(r,t,e.type,void 0,e.eventId??void 0,i)}async function cR(r){const{BuildInfo:e}=Rs(),t={};Va()?t.iosBundleId=e.packageName:ka()?t.androidPackageName=e.packageName:ht(r,"operation-not-supported-in-this-environment"),await r_(r,t)}function uR(r){const{cordova:e}=Rs();return new Promise(t=>{e.plugins.browsertab.isAvailable(n=>{let s=null;n?e.plugins.browsertab.openUrl(r):s=e.InAppBrowser.open(r,pT()?"_blank":"_system","location=yes"),t(s)})})}async function lR(r,e,t){const{cordova:n}=Rs();let s=()=>{};try{await new Promise((i,o)=>{let a=null;function c(){var p;i();const d=(p=n.plugins.browsertab)==null?void 0:p.close;typeof d=="function"&&d(),typeof(t==null?void 0:t.close)=="function"&&t.close()}function l(){a||(a=window.setTimeout(()=>{o(nt(r,"redirect-cancelled-by-user"))},oR))}function B(){(document==null?void 0:document.visibilityState)==="visible"&&l()}e.addPassiveListener(c),document.addEventListener("resume",l,!1),ka()&&document.addEventListener("visibilitychange",B,!1),s=()=>{e.removePassiveListener(c),document.removeEventListener("resume",l,!1),document.removeEventListener("visibilitychange",B,!1),a&&window.clearTimeout(a)}})}finally{s()}}function BR(r){var t,n,s,i,o,a,c,l,B,d;const e=Rs();H(typeof((t=e==null?void 0:e.universalLinks)==null?void 0:t.subscribe)=="function",r,"invalid-cordova-configuration",{missingPlugin:"cordova-universal-links-plugin-fix"}),H(typeof((n=e==null?void 0:e.BuildInfo)==null?void 0:n.packageName)<"u",r,"invalid-cordova-configuration",{missingPlugin:"cordova-plugin-buildInfo"}),H(typeof((o=(i=(s=e==null?void 0:e.cordova)==null?void 0:s.plugins)==null?void 0:i.browsertab)==null?void 0:o.openUrl)=="function",r,"invalid-cordova-configuration",{missingPlugin:"cordova-plugin-browsertab"}),H(typeof((l=(c=(a=e==null?void 0:e.cordova)==null?void 0:a.plugins)==null?void 0:c.browsertab)==null?void 0:l.isAvailable)=="function",r,"invalid-cordova-configuration",{missingPlugin:"cordova-plugin-browsertab"}),H(typeof((d=(B=e==null?void 0:e.cordova)==null?void 0:B.InAppBrowser)==null?void 0:d.open)=="function",r,"invalid-cordova-configuration",{missingPlugin:"cordova-plugin-inappbrowser"})}async function hR(r){const e=dR(r),t=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(t)).map(s=>s.toString(16).padStart(2,"0")).join("")}function dR(r){if(hn(/[0-9a-zA-Z]+/.test(r),"Can only convert alpha-numeric strings"),typeof TextEncoder<"u")return new TextEncoder().encode(r);const e=new ArrayBuffer(r.length),t=new Uint8Array(e);for(let n=0;n<r.length;n++)t[n]=r.charCodeAt(n);return t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fR=20;class pR extends t_{constructor(){super(...arguments),this.passiveListeners=new Set,this.initPromise=new Promise(e=>{this.resolveInitialized=e})}addPassiveListener(e){this.passiveListeners.add(e)}removePassiveListener(e){this.passiveListeners.delete(e)}resetRedirect(){this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1}onEvent(e){return this.resolveInitialized(),this.passiveListeners.forEach(t=>t(e)),super.onEvent(e)}async initialized(){await this.initPromise}}function CR(r,e,t=null){return{type:e,eventId:t,urlResponse:null,sessionId:_R(),postBody:null,tenantId:r.tenantId,error:nt(r,"no-auth-event")}}function gR(r,e){return _B()._set(EB(r),e)}async function jp(r){const e=await _B()._get(EB(r));return e&&await _B()._remove(EB(r)),e}function mR(r,e){var n,s;const t=IR(e);if(t.includes("/__/auth/callback")){const i=Uc(t),o=i.firebaseError?ER(decodeURIComponent(i.firebaseError)):null,a=(s=(n=o==null?void 0:o.code)==null?void 0:n.split("auth/"))==null?void 0:s[1],c=a?nt(a):null;return c?{type:r.type,eventId:r.eventId,tenantId:r.tenantId,error:c,urlResponse:null,sessionId:null,postBody:null}:{type:r.type,eventId:r.eventId,tenantId:r.tenantId,sessionId:r.sessionId,urlResponse:t,postBody:null}}return null}function _R(){const r=[],e="1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";for(let t=0;t<fR;t++){const n=Math.floor(Math.random()*e.length);r.push(e.charAt(n))}return r.join("")}function _B(){return zt(vh)}function EB(r){return Es("authEvent",r.config.apiKey,r.name)}function ER(r){try{return JSON.parse(r)}catch{return null}}function IR(r){const e=Uc(r),t=e.link?decodeURIComponent(e.link):void 0,n=Uc(t).link,s=e.deep_link_id?decodeURIComponent(e.deep_link_id):void 0;return Uc(s).link||s||n||t||r}function Uc(r){if(!(r!=null&&r.includes("?")))return{};const[e,...t]=r.split("?");return di(t.join("?"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yR=500;class wR{constructor(){this._redirectPersistence=As,this._shouldInitProactively=!0,this.eventManagers=new Map,this.originValidationPromises={},this._completeRedirectFn=Gu,this._overrideRedirectResult=Nh}async _initialize(e){const t=e._key();let n=this.eventManagers.get(t);return n||(n=new pR(e),this.eventManagers.set(t,n),this.attachCallbackListeners(e,n)),n}_openPopup(e){ht(e,"operation-not-supported-in-this-environment")}async _openRedirect(e,t,n,s){BR(e);const i=await this._initialize(e);await i.initialized(),i.resetRedirect(),gv(),await this._originValidation(e);const o=CR(e,n,s);await gR(e,o);const a=await aR(e,o,t),c=await uR(a);return lR(e,i,c)}_isIframeWebStorageSupported(e,t){throw new Error("Method not implemented.")}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=cR(e)),this.originValidationPromises[t]}attachCallbackListeners(e,t){const{universalLinks:n,handleOpenURL:s,BuildInfo:i}=Rs(),o=setTimeout(async()=>{await jp(e),t.onEvent(Jp())},yR),a=async B=>{clearTimeout(o);const d=await jp(e);let p=null;d&&(B!=null&&B.url)&&(p=mR(d,B.url)),t.onEvent(p||Jp())};typeof n<"u"&&typeof n.subscribe=="function"&&n.subscribe(null,a);const c=s,l=`${i.packageName.toLowerCase()}://`;Rs().handleOpenURL=async B=>{if(B.toLowerCase().startsWith(l)&&a({url:B}),typeof c=="function")try{c(B)}catch(d){console.error(d)}}}}const DR=wR;function Jp(){return{type:"unknown",eventId:null,sessionId:null,urlResponse:null,postBody:null,tenantId:null,error:nt("no-auth-event")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function TR(r,e){Me(r)._logFramework(e)}var AR="@firebase/auth-compat",vR="0.6.9";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const RR=1e3;function qo(){var r;return((r=self==null?void 0:self.location)==null?void 0:r.protocol)||null}function bR(){return qo()==="http:"||qo()==="https:"}function i_(r=xe()){return!!((qo()==="file:"||qo()==="ionic:"||qo()==="capacitor:")&&r.toLowerCase().match(/iphone|ipad|ipod|android/))}function PR(){return lh()||bu()}function SR(){return Qg()&&(document==null?void 0:document.documentMode)===11}function NR(r=xe()){return/Edge\/\d+/.test(r)}function OR(r=xe()){return SR()||NR(r)}function o_(){try{const r=self.localStorage,e=Ga();if(r)return r.setItem(e,"1"),r.removeItem(e),OR()?ra():!0}catch{return Fh()&&ra()}return!1}function Fh(){return typeof global<"u"&&"WorkerGlobalScope"in global&&"importScripts"in global}function Zl(){return(bR()||Wg()||i_())&&!PR()&&o_()&&!Fh()}function a_(){return i_()&&typeof document<"u"}async function FR(){return a_()?new Promise(r=>{const e=setTimeout(()=>{r(!1)},RR);document.addEventListener("deviceready",()=>{clearTimeout(e),r(!0)})}):!1}function LR(){return typeof window<"u"?window:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kt={LOCAL:"local",NONE:"none",SESSION:"session"},Do=H,c_="persistence";function kR(r,e){if(Do(Object.values(Kt).includes(e),r,"invalid-persistence-type"),lh()){Do(e!==Kt.SESSION,r,"unsupported-persistence-type");return}if(bu()){Do(e===Kt.NONE,r,"unsupported-persistence-type");return}if(Fh()){Do(e===Kt.NONE||e===Kt.LOCAL&&ra(),r,"unsupported-persistence-type");return}Do(e===Kt.NONE||o_(),r,"unsupported-persistence-type")}async function IB(r){await r._initializationPromise;const e=u_(),t=Es(c_,r.config.apiKey,r.name);e&&e.setItem(t,r._getPersistenceType())}function VR(r,e){const t=u_();if(!t)return[];const n=Es(c_,r,e);switch(t.getItem(n)){case Kt.NONE:return[yi];case Kt.LOCAL:return[ua,As];case Kt.SESSION:return[As];default:return[]}}function u_(){var r;try{return((r=LR())==null?void 0:r.sessionStorage)||null}catch{return null}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xR=H;class Er{constructor(){this.browserResolver=zt(Zv),this.cordovaResolver=zt(DR),this.underlyingResolver=null,this._redirectPersistence=As,this._completeRedirectFn=Gu,this._overrideRedirectResult=Nh}async _initialize(e){return await this.selectUnderlyingResolver(),this.assertedUnderlyingResolver._initialize(e)}async _openPopup(e,t,n,s){return await this.selectUnderlyingResolver(),this.assertedUnderlyingResolver._openPopup(e,t,n,s)}async _openRedirect(e,t,n,s){return await this.selectUnderlyingResolver(),this.assertedUnderlyingResolver._openRedirect(e,t,n,s)}_isIframeWebStorageSupported(e,t){this.assertedUnderlyingResolver._isIframeWebStorageSupported(e,t)}_originValidation(e){return this.assertedUnderlyingResolver._originValidation(e)}get _shouldInitProactively(){return a_()||this.browserResolver._shouldInitProactively}get assertedUnderlyingResolver(){return xR(this.underlyingResolver,"internal-error"),this.underlyingResolver}async selectUnderlyingResolver(){if(this.underlyingResolver)return;const e=await FR();this.underlyingResolver=e?this.cordovaResolver:this.browserResolver}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function l_(r){return r.unwrap()}function MR(r){return r.wrapped()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function GR(r){return B_(r)}function UR(r,e){var n;const t=(n=e.customData)==null?void 0:n._tokenResponse;if((e==null?void 0:e.code)==="auth/multi-factor-auth-required"){const s=e;s.resolver=new HR(r,NA(r,e))}else if(t){const s=B_(e),i=e;s&&(i.credential=s,i.tenantId=t.tenantId||void 0,i.email=t.email||void 0,i.phoneNumber=t.phoneNumber||void 0)}}function B_(r){const{_tokenResponse:e}=r instanceof bt?r.customData:r;if(!e)return null;if(!(r instanceof bt)&&"temporaryProof"in e&&"phoneNumber"in e)return vs.credentialFromResult(r);const t=e.providerId;if(!t||t===yo.PASSWORD)return null;let n;switch(t){case yo.GOOGLE:n=mn;break;case yo.FACEBOOK:n=gn;break;case yo.GITHUB:n=_n;break;case yo.TWITTER:n=En;break;default:const{oauthIdToken:s,oauthAccessToken:i,oauthTokenSecret:o,pendingToken:a,nonce:c}=e;return!i&&!o&&!s&&!a?null:a?t.startsWith("saml.")?wi._create(t,a):On._fromParams({providerId:t,signInMethod:t,pendingToken:a,idToken:s,accessToken:i}):new Ci(t).credential({idToken:s,accessToken:i,rawNonce:c})}return r instanceof bt?n.credentialFromError(r):n.credentialFromResult(r)}function Lt(r,e){return e.catch(t=>{throw t instanceof bt&&UR(r,t),t}).then(t=>{const n=t.operationType,s=t.user;return{operationType:n,credential:GR(t),additionalUserInfo:SA(t),user:Uu.getOrCreate(s)}})}async function yB(r,e){const t=await e;return{verificationId:t.verificationId,confirm:n=>Lt(r,t.confirm(n))}}class HR{constructor(e,t){this.resolver=t,this.auth=MR(e)}get session(){return this.resolver.session}get hints(){return this.resolver.hints}resolveSignIn(e){return Lt(l_(this.auth),this.resolver.resolveSignIn(e))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Uu=class Fo{constructor(e){this._delegate=e,this.multiFactor=LA(e)}static getOrCreate(e){return Fo.USER_MAP.has(e)||Fo.USER_MAP.set(e,new Fo(e)),Fo.USER_MAP.get(e)}delete(){return this._delegate.delete()}reload(){return this._delegate.reload()}toJSON(){return this._delegate.toJSON()}getIdTokenResult(e){return this._delegate.getIdTokenResult(e)}getIdToken(e){return this._delegate.getIdToken(e)}linkAndRetrieveDataWithCredential(e){return this.linkWithCredential(e)}async linkWithCredential(e){return Lt(this.auth,Mm(this._delegate,e))}async linkWithPhoneNumber(e,t){return yB(this.auth,sv(this._delegate,e,t))}async linkWithPopup(e){return Lt(this.auth,dv(this._delegate,e,Er))}async linkWithRedirect(e){return await IB(Me(this.auth)),yv(this._delegate,e,Er)}reauthenticateAndRetrieveDataWithCredential(e){return this.reauthenticateWithCredential(e)}async reauthenticateWithCredential(e){return Lt(this.auth,Gm(this._delegate,e))}reauthenticateWithPhoneNumber(e,t){return yB(this.auth,iv(this._delegate,e,t))}reauthenticateWithPopup(e){return Lt(this.auth,hv(this._delegate,e,Er))}async reauthenticateWithRedirect(e){return await IB(Me(this.auth)),Ev(this._delegate,e,Er)}sendEmailVerification(e){return EA(this._delegate,e)}async unlink(e){return await oA(this._delegate,e),this}updateEmail(e){return DA(this._delegate,e)}updatePassword(e){return TA(this._delegate,e)}updatePhoneNumber(e){return ov(this._delegate,e)}updateProfile(e){return wA(this._delegate,e)}verifyBeforeUpdateEmail(e,t){return IA(this._delegate,e,t)}get emailVerified(){return this._delegate.emailVerified}get isAnonymous(){return this._delegate.isAnonymous}get metadata(){return this._delegate.metadata}get phoneNumber(){return this._delegate.phoneNumber}get providerData(){return this._delegate.providerData}get refreshToken(){return this._delegate.refreshToken}get tenantId(){return this._delegate.tenantId}get displayName(){return this._delegate.displayName}get email(){return this._delegate.email}get photoURL(){return this._delegate.photoURL}get providerId(){return this._delegate.providerId}get uid(){return this._delegate.uid}get auth(){return this._delegate.auth}};Uu.USER_MAP=new WeakMap;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const To=H;class wB{constructor(e,t){if(this.app=e,t.isInitialized()){this._delegate=t.getImmediate(),this.linkUnderlyingAuth();return}const{apiKey:n}=e.options;To(n,"invalid-api-key",{appName:e.name}),To(n,"invalid-api-key",{appName:e.name});const s=typeof window<"u"?Er:void 0;this._delegate=t.initialize({options:{persistence:qR(n,e.name),popupRedirectResolver:s}}),this._delegate._updateErrorMap($D),this.linkUnderlyingAuth()}get emulatorConfig(){return this._delegate.emulatorConfig}get currentUser(){return this._delegate.currentUser?Uu.getOrCreate(this._delegate.currentUser):null}get languageCode(){return this._delegate.languageCode}set languageCode(e){this._delegate.languageCode=e}get settings(){return this._delegate.settings}get tenantId(){return this._delegate.tenantId}set tenantId(e){this._delegate.tenantId=e}useDeviceLanguage(){this._delegate.useDeviceLanguage()}signOut(){return this._delegate.signOut()}useEmulator(e,t){VT(this._delegate,e,t)}applyActionCode(e){return BA(this._delegate,e)}checkActionCode(e){return Um(this._delegate,e)}confirmPasswordReset(e,t){return lA(this._delegate,e,t)}async createUserWithEmailAndPassword(e,t){return Lt(this._delegate,dA(this._delegate,e,t))}fetchProvidersForEmail(e){return this.fetchSignInMethodsForEmail(e)}fetchSignInMethodsForEmail(e){return _A(this._delegate,e)}isSignInWithEmailLink(e){return CA(this._delegate,e)}async getRedirectResult(){To(Zl(),this._delegate,"operation-not-supported-in-this-environment");const e=await Dv(this._delegate,Er);return e?Lt(this._delegate,Promise.resolve(e)):{credential:null,user:null}}addFrameworkForLogging(e){TR(this._delegate,e)}onAuthStateChanged(e,t,n){const{next:s,error:i,complete:o}=Kp(e,t,n);return this._delegate.onAuthStateChanged(s,i,o)}onIdTokenChanged(e,t,n){const{next:s,error:i,complete:o}=Kp(e,t,n);return this._delegate.onIdTokenChanged(s,i,o)}sendSignInLinkToEmail(e,t){return pA(this._delegate,e,t)}sendPasswordResetEmail(e,t){return uA(this._delegate,e,t||void 0)}async setPersistence(e){kR(this._delegate,e);let t;switch(e){case Kt.SESSION:t=As;break;case Kt.LOCAL:t=await zt(ua)._isAvailable()?ua:vh;break;case Kt.NONE:t=yi;break;default:return ht("argument-error",{appName:this._delegate.name})}return this._delegate.setPersistence(t)}signInAndRetrieveDataWithCredential(e){return this.signInWithCredential(e)}signInAnonymously(){return Lt(this._delegate,iA(this._delegate))}signInWithCredential(e){return Lt(this._delegate,Lu(this._delegate,e))}signInWithCustomToken(e){return Lt(this._delegate,cA(this._delegate,e))}signInWithEmailAndPassword(e,t){return Lt(this._delegate,fA(this._delegate,e,t))}signInWithEmailLink(e,t){return Lt(this._delegate,gA(this._delegate,e,t))}signInWithPhoneNumber(e,t){return yB(this._delegate,rv(this._delegate,e,t))}async signInWithPopup(e){return To(Zl(),this._delegate,"operation-not-supported-in-this-environment"),Lt(this._delegate,Bv(this._delegate,e,Er))}async signInWithRedirect(e){return To(Zl(),this._delegate,"operation-not-supported-in-this-environment"),await IB(this._delegate),mv(this._delegate,e,Er)}updateCurrentUser(e){return this._delegate.updateCurrentUser(e)}verifyPasswordResetCode(e){return hA(this._delegate,e)}unwrap(){return this._delegate}_delete(){return this._delegate._delete()}linkUnderlyingAuth(){this._delegate.wrapped=()=>this}}wB.Persistence=Kt;function Kp(r,e,t){let n=r;typeof r!="function"&&({next:n,error:e,complete:t}=r);const s=n;return{next:o=>s(o&&Uu.getOrCreate(o)),error:e,complete:t}}function qR(r,e){const t=VR(r,e);if(typeof self<"u"&&!t.includes(ua)&&t.push(ua),typeof window<"u")for(const n of[vh,As])t.includes(n)||t.push(n);return t.includes(yi)||t.push(yi),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lh{static credential(e,t){return vs.credential(e,t)}constructor(){this.providerId="phone",this._delegate=new vs(l_(tt.auth()))}verifyPhoneNumber(e,t){return this._delegate.verifyPhoneNumber(e,t)}unwrap(){return this._delegate}}Lh.PHONE_SIGN_IN_METHOD=vs.PHONE_SIGN_IN_METHOD;Lh.PROVIDER_ID=vs.PROVIDER_ID;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jR=H;class JR{constructor(e,t,n=tt.app()){var s;jR((s=n.options)==null?void 0:s.apiKey,"invalid-api-key",{appName:n.name}),this._delegate=new tv(n.auth(),e,t),this.type=this._delegate.type}clear(){this._delegate.clear()}render(){return this._delegate.render()}verify(){return this._delegate.verify()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const KR="auth-compat";function zR(r){r.INTERNAL.registerComponent(new Nn(KR,e=>{const t=e.getProvider("app-compat").getImmediate(),n=e.getProvider("auth");return new wB(t,n)},"PUBLIC").setServiceProps({ActionCodeInfo:{Operation:{EMAIL_SIGNIN:Ys.EMAIL_SIGNIN,PASSWORD_RESET:Ys.PASSWORD_RESET,RECOVER_EMAIL:Ys.RECOVER_EMAIL,REVERT_SECOND_FACTOR_ADDITION:Ys.REVERT_SECOND_FACTOR_ADDITION,VERIFY_AND_CHANGE_EMAIL:Ys.VERIFY_AND_CHANGE_EMAIL,VERIFY_EMAIL:Ys.VERIFY_EMAIL}},EmailAuthProvider:Jr,FacebookAuthProvider:gn,GithubAuthProvider:_n,GoogleAuthProvider:mn,OAuthProvider:Ci,SAMLAuthProvider:su,PhoneAuthProvider:Lh,PhoneMultiFactorGenerator:s_,RecaptchaVerifier:JR,TwitterAuthProvider:En,Auth:wB,AuthCredential:Ki,Error:bt}).setInstantiationMode("LAZY").setMultipleInstances(!1)),r.registerVersion(AR,vR)}zR(tt);var WR={};const QR=(()=>{var r;if(typeof process<"u"&&WR)return(r=process.argv)==null?void 0:r.includes("--dev");try{return localStorage.getItem("DEBUG_MODE")==="true"}catch{return!1}})(),Ae=(...r)=>QR&&console.log("[Firebase]",...r);let on=null,ys=null,la=!1,kh=!1,Ba=!1,Xt=null;const Vh="firebase_config",h_={encode:r=>{try{return btoa(encodeURIComponent(r))}catch{return r}},decode:r=>{try{return decodeURIComponent(atob(r))}catch{return r}}};async function $R(){var r,e,t;if(!((r=window.electronAPI)!=null&&r.isElectron))return Ae("웹 환경 - 인증 파일 사용 불가"),null;try{if(!((e=window.electronAPI)!=null&&e.readAuthFile))return Ae("readAuthFile API 없음"),null;const n=await window.electronAPI.readAuthFile();if(!n.exists)return Ae("인증 파일 없음 - 로컬 모드로 동작"),null;const s=JSON.parse(n.content);return s.apiKey&&s.projectId?(Ae("인증 파일에서 Firebase 설정 로드됨"),s):(Ae("인증 파일에 필수 설정 없음"),null)}catch(n){return(((t=window.logger)==null?void 0:t.error)||console.error)("[Firebase] 인증 파일 로드 실패:",n),null}}function YR(){var r;try{const e=localStorage.getItem(Vh);if(e){let t;if(e.startsWith("eyJ"))try{t=JSON.parse(h_.decode(e))}catch{t=JSON.parse(e)}else t=JSON.parse(e);if(t.apiKey&&t.projectId)return t}}catch(e){(((r=window.logger)==null?void 0:r.error)||console.error)("Firebase 설정 로드 실패:",e)}return null}async function XR(){const r=await $R();if(r)return r;const e=YR();return e?(Ae("localStorage에서 설정 로드됨"),e):(Ae("Firebase 설정 없음 - 로컬 모드로 동작"),null)}function d_(r){return r?r.apiKey&&r.apiKey.trim()!==""&&r.projectId&&r.projectId.trim()!=="":!1}async function f_(){var r,e,t,n,s,i,o,a,c,l,B,d;if(Ae("초기화 시작..."),la&&on)return Ae("이미 초기화됨"),!0;if(!navigator.onLine)return Ae("오프라인 상태 - 로컬 모드로 동작"),(((r=window.logger)==null?void 0:r.info)||console.info)("[Firebase] 인터넷 연결 없음. 로컬 모드로 동작합니다."),!1;if(window.NetworkAccess){const p=await window.NetworkAccess.checkAccess();if(Ae("네트워크 접근 체크:",p),!p.allowed)return Ae("네트워크 접근 거부:",p.reason),(((e=window.logger)==null?void 0:e.warn)||console.warn)("[Firebase] 허용되지 않은 네트워크입니다. 로컬 모드로 동작합니다."),!1}if(typeof tt>"u")return(((t=window.logger)==null?void 0:t.error)||console.error)("[Firebase] SDK가 로드되지 않았습니다. firebase-app-compat.js를 먼저 로드하세요."),!1;if(Xt=await XR(),Ae("로드된 설정:",Xt?"있음":"없음"),!Xt)return Ae("설정이 없습니다. 로컬 모드로 동작합니다."),!1;if(Ae("설정값 확인:",{apiKey:Xt.apiKey?Xt.apiKey.substring(0,10)+"...":"없음",projectId:Xt.projectId||"없음",authDomain:Xt.authDomain||"없음"}),!d_(Xt))return Ae("설정이 유효하지 않습니다."),!1;try{Ae("앱 초기화 중..."),tt.apps.length||tt.initializeApp(Xt),on=tt.firestore(),on.settings({cacheSizeBytes:tt.firestore.CACHE_SIZE_UNLIMITED,merge:!0}),Ae("Firestore 연결됨");try{ys=tt.auth();const p=await ys.signInAnonymously();Ba=!0,Ae("익명 인증 성공:",p.user.uid)}catch(p){(((n=window.logger)==null?void 0:n.error)||console.error)("[Firebase] 익명 인증 실패:",p),Ba=!1;const g=p.code||"";if(g==="auth/operation-not-allowed")return(((s=window.logger)==null?void 0:s.error)||console.error)("[Firebase] 익명 인증이 비활성화되어 있습니다. Firebase Console에서 활성화하세요."),!1;g==="auth/network-request-failed"?(((i=window.logger)==null?void 0:i.warn)||console.warn)("[Firebase] 네트워크 오류로 인증 실패. 오프라인 모드로 계속 진행합니다."):(((o=window.logger)==null?void 0:o.warn)||console.warn)("[Firebase] 인증 없이 계속 진행 (보안 규칙에 따라 제한될 수 있음)")}try{await on.enablePersistence({synchronizeTabs:!0}),kh=!0,Ae("오프라인 지원 활성화됨")}catch(p){(((a=window.logger)==null?void 0:a.warn)||console.warn)("[Firebase] 오프라인 지원 에러:",p.code,p.message),p.code==="failed-precondition"?(((c=window.logger)==null?void 0:c.warn)||console.warn)("[Firebase] 여러 탭이 열려 있어 오프라인 지원이 제한됩니다."):p.code==="unimplemented"&&(((l=window.logger)==null?void 0:l.warn)||console.warn)("[Firebase] 이 브라우저는 오프라인 지원을 지원하지 않습니다.")}return la=!0,Ae("초기화 완료:",Xt.projectId),window.addEventListener("offline",()=>{Ae("네트워크 끊김 감지 - Firestore 네트워크 비활성화"),on&&on.disableNetwork().catch(()=>{})}),window.addEventListener("online",()=>{Ae("네트워크 복구 감지 - Firestore 네트워크 활성화"),on&&on.enableNetwork().catch(()=>{})}),!0}catch(p){return(((B=window.logger)==null?void 0:B.error)||console.error)("[Firebase] 초기화 실패:",p),(((d=window.logger)==null?void 0:d.error)||console.error)("[Firebase] 에러 상세:",p.message,p.stack),!1}}function ZR(){return on}function eb(){return la}function tb(){return kh}function nb(){return Ba}function rb(){var r;return((r=ys==null?void 0:ys.currentUser)==null?void 0:r.uid)||null}function sb(r){var e;try{const t=h_.encode(JSON.stringify(r));localStorage.setItem(Vh,t),Ae("설정 저장됨 (난독화)")}catch(t){(((e=window.logger)==null?void 0:e.error)||console.error)("Firebase 설정 저장 실패:",t)}}function ib(){localStorage.removeItem(Vh),la=!1,Ba=!1,on=null,ys=null,Xt=null,Ae("설정 초기화됨")}async function ob(){var r;if(Ae("재초기화 시작..."),la=!1,Ba=!1,kh=!1,on=null,ys=null,Xt=null,typeof tt<"u"&&tt.apps.length>0)try{await tt.app().delete(),Ae("기존 Firebase 앱 삭제됨")}catch(e){(((r=window.logger)==null?void 0:r.warn)||console.warn)("[Firebase] 앱 삭제 실패:",e)}return await f_()}window.firebaseConfig={initialize:f_,reinitialize:ob,getDb:ZR,isEnabled:eb,isOfflineSupported:tb,isAuthenticated:nb,getCurrentUserId:rb,isConfigValid:d_,saveConfig:sb,resetConfig:ib};var zp=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ar,p_;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(T,E){function y(){}y.prototype=E.prototype,T.F=E.prototype,T.prototype=new y,T.prototype.constructor=T,T.D=function(R,v,S){for(var I=Array(arguments.length-2),Nt=2;Nt<arguments.length;Nt++)I[Nt-2]=arguments[Nt];return E.prototype[v].apply(R,I)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(T,E,y){y||(y=0);const R=Array(16);if(typeof E=="string")for(var v=0;v<16;++v)R[v]=E.charCodeAt(y++)|E.charCodeAt(y++)<<8|E.charCodeAt(y++)<<16|E.charCodeAt(y++)<<24;else for(v=0;v<16;++v)R[v]=E[y++]|E[y++]<<8|E[y++]<<16|E[y++]<<24;E=T.g[0],y=T.g[1],v=T.g[2];let S=T.g[3],I;I=E+(S^y&(v^S))+R[0]+3614090360&4294967295,E=y+(I<<7&4294967295|I>>>25),I=S+(v^E&(y^v))+R[1]+3905402710&4294967295,S=E+(I<<12&4294967295|I>>>20),I=v+(y^S&(E^y))+R[2]+606105819&4294967295,v=S+(I<<17&4294967295|I>>>15),I=y+(E^v&(S^E))+R[3]+3250441966&4294967295,y=v+(I<<22&4294967295|I>>>10),I=E+(S^y&(v^S))+R[4]+4118548399&4294967295,E=y+(I<<7&4294967295|I>>>25),I=S+(v^E&(y^v))+R[5]+1200080426&4294967295,S=E+(I<<12&4294967295|I>>>20),I=v+(y^S&(E^y))+R[6]+2821735955&4294967295,v=S+(I<<17&4294967295|I>>>15),I=y+(E^v&(S^E))+R[7]+4249261313&4294967295,y=v+(I<<22&4294967295|I>>>10),I=E+(S^y&(v^S))+R[8]+1770035416&4294967295,E=y+(I<<7&4294967295|I>>>25),I=S+(v^E&(y^v))+R[9]+2336552879&4294967295,S=E+(I<<12&4294967295|I>>>20),I=v+(y^S&(E^y))+R[10]+4294925233&4294967295,v=S+(I<<17&4294967295|I>>>15),I=y+(E^v&(S^E))+R[11]+2304563134&4294967295,y=v+(I<<22&4294967295|I>>>10),I=E+(S^y&(v^S))+R[12]+1804603682&4294967295,E=y+(I<<7&4294967295|I>>>25),I=S+(v^E&(y^v))+R[13]+4254626195&4294967295,S=E+(I<<12&4294967295|I>>>20),I=v+(y^S&(E^y))+R[14]+2792965006&4294967295,v=S+(I<<17&4294967295|I>>>15),I=y+(E^v&(S^E))+R[15]+1236535329&4294967295,y=v+(I<<22&4294967295|I>>>10),I=E+(v^S&(y^v))+R[1]+4129170786&4294967295,E=y+(I<<5&4294967295|I>>>27),I=S+(y^v&(E^y))+R[6]+3225465664&4294967295,S=E+(I<<9&4294967295|I>>>23),I=v+(E^y&(S^E))+R[11]+643717713&4294967295,v=S+(I<<14&4294967295|I>>>18),I=y+(S^E&(v^S))+R[0]+3921069994&4294967295,y=v+(I<<20&4294967295|I>>>12),I=E+(v^S&(y^v))+R[5]+3593408605&4294967295,E=y+(I<<5&4294967295|I>>>27),I=S+(y^v&(E^y))+R[10]+38016083&4294967295,S=E+(I<<9&4294967295|I>>>23),I=v+(E^y&(S^E))+R[15]+3634488961&4294967295,v=S+(I<<14&4294967295|I>>>18),I=y+(S^E&(v^S))+R[4]+3889429448&4294967295,y=v+(I<<20&4294967295|I>>>12),I=E+(v^S&(y^v))+R[9]+568446438&4294967295,E=y+(I<<5&4294967295|I>>>27),I=S+(y^v&(E^y))+R[14]+3275163606&4294967295,S=E+(I<<9&4294967295|I>>>23),I=v+(E^y&(S^E))+R[3]+4107603335&4294967295,v=S+(I<<14&4294967295|I>>>18),I=y+(S^E&(v^S))+R[8]+1163531501&4294967295,y=v+(I<<20&4294967295|I>>>12),I=E+(v^S&(y^v))+R[13]+2850285829&4294967295,E=y+(I<<5&4294967295|I>>>27),I=S+(y^v&(E^y))+R[2]+4243563512&4294967295,S=E+(I<<9&4294967295|I>>>23),I=v+(E^y&(S^E))+R[7]+1735328473&4294967295,v=S+(I<<14&4294967295|I>>>18),I=y+(S^E&(v^S))+R[12]+2368359562&4294967295,y=v+(I<<20&4294967295|I>>>12),I=E+(y^v^S)+R[5]+4294588738&4294967295,E=y+(I<<4&4294967295|I>>>28),I=S+(E^y^v)+R[8]+2272392833&4294967295,S=E+(I<<11&4294967295|I>>>21),I=v+(S^E^y)+R[11]+1839030562&4294967295,v=S+(I<<16&4294967295|I>>>16),I=y+(v^S^E)+R[14]+4259657740&4294967295,y=v+(I<<23&4294967295|I>>>9),I=E+(y^v^S)+R[1]+2763975236&4294967295,E=y+(I<<4&4294967295|I>>>28),I=S+(E^y^v)+R[4]+1272893353&4294967295,S=E+(I<<11&4294967295|I>>>21),I=v+(S^E^y)+R[7]+4139469664&4294967295,v=S+(I<<16&4294967295|I>>>16),I=y+(v^S^E)+R[10]+3200236656&4294967295,y=v+(I<<23&4294967295|I>>>9),I=E+(y^v^S)+R[13]+681279174&4294967295,E=y+(I<<4&4294967295|I>>>28),I=S+(E^y^v)+R[0]+3936430074&4294967295,S=E+(I<<11&4294967295|I>>>21),I=v+(S^E^y)+R[3]+3572445317&4294967295,v=S+(I<<16&4294967295|I>>>16),I=y+(v^S^E)+R[6]+76029189&4294967295,y=v+(I<<23&4294967295|I>>>9),I=E+(y^v^S)+R[9]+3654602809&4294967295,E=y+(I<<4&4294967295|I>>>28),I=S+(E^y^v)+R[12]+3873151461&4294967295,S=E+(I<<11&4294967295|I>>>21),I=v+(S^E^y)+R[15]+530742520&4294967295,v=S+(I<<16&4294967295|I>>>16),I=y+(v^S^E)+R[2]+3299628645&4294967295,y=v+(I<<23&4294967295|I>>>9),I=E+(v^(y|~S))+R[0]+4096336452&4294967295,E=y+(I<<6&4294967295|I>>>26),I=S+(y^(E|~v))+R[7]+1126891415&4294967295,S=E+(I<<10&4294967295|I>>>22),I=v+(E^(S|~y))+R[14]+2878612391&4294967295,v=S+(I<<15&4294967295|I>>>17),I=y+(S^(v|~E))+R[5]+4237533241&4294967295,y=v+(I<<21&4294967295|I>>>11),I=E+(v^(y|~S))+R[12]+1700485571&4294967295,E=y+(I<<6&4294967295|I>>>26),I=S+(y^(E|~v))+R[3]+2399980690&4294967295,S=E+(I<<10&4294967295|I>>>22),I=v+(E^(S|~y))+R[10]+4293915773&4294967295,v=S+(I<<15&4294967295|I>>>17),I=y+(S^(v|~E))+R[1]+2240044497&4294967295,y=v+(I<<21&4294967295|I>>>11),I=E+(v^(y|~S))+R[8]+1873313359&4294967295,E=y+(I<<6&4294967295|I>>>26),I=S+(y^(E|~v))+R[15]+4264355552&4294967295,S=E+(I<<10&4294967295|I>>>22),I=v+(E^(S|~y))+R[6]+2734768916&4294967295,v=S+(I<<15&4294967295|I>>>17),I=y+(S^(v|~E))+R[13]+1309151649&4294967295,y=v+(I<<21&4294967295|I>>>11),I=E+(v^(y|~S))+R[4]+4149444226&4294967295,E=y+(I<<6&4294967295|I>>>26),I=S+(y^(E|~v))+R[11]+3174756917&4294967295,S=E+(I<<10&4294967295|I>>>22),I=v+(E^(S|~y))+R[2]+718787259&4294967295,v=S+(I<<15&4294967295|I>>>17),I=y+(S^(v|~E))+R[9]+3951481745&4294967295,T.g[0]=T.g[0]+E&4294967295,T.g[1]=T.g[1]+(v+(I<<21&4294967295|I>>>11))&4294967295,T.g[2]=T.g[2]+v&4294967295,T.g[3]=T.g[3]+S&4294967295}n.prototype.v=function(T,E){E===void 0&&(E=T.length);const y=E-this.blockSize,R=this.C;let v=this.h,S=0;for(;S<E;){if(v==0)for(;S<=y;)s(this,T,S),S+=this.blockSize;if(typeof T=="string"){for(;S<E;)if(R[v++]=T.charCodeAt(S++),v==this.blockSize){s(this,R),v=0;break}}else for(;S<E;)if(R[v++]=T[S++],v==this.blockSize){s(this,R),v=0;break}}this.h=v,this.o+=E},n.prototype.A=function(){var T=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);T[0]=128;for(var E=1;E<T.length-8;++E)T[E]=0;E=this.o*8;for(var y=T.length-8;y<T.length;++y)T[y]=E&255,E/=256;for(this.v(T),T=Array(16),E=0,y=0;y<4;++y)for(let R=0;R<32;R+=8)T[E++]=this.g[y]>>>R&255;return T};function i(T,E){var y=a;return Object.prototype.hasOwnProperty.call(y,T)?y[T]:y[T]=E(T)}function o(T,E){this.h=E;const y=[];let R=!0;for(let v=T.length-1;v>=0;v--){const S=T[v]|0;R&&S==E||(y[v]=S,R=!1)}this.g=y}var a={};function c(T){return-128<=T&&T<128?i(T,function(E){return new o([E|0],E<0?-1:0)}):new o([T|0],T<0?-1:0)}function l(T){if(isNaN(T)||!isFinite(T))return d;if(T<0)return M(l(-T));const E=[];let y=1;for(let R=0;T>=y;R++)E[R]=T/y|0,y*=4294967296;return new o(E,0)}function B(T,E){if(T.length==0)throw Error("number format error: empty string");if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(T.charAt(0)=="-")return M(B(T.substring(1),E));if(T.indexOf("-")>=0)throw Error('number format error: interior "-" character');const y=l(Math.pow(E,8));let R=d;for(let S=0;S<T.length;S+=8){var v=Math.min(8,T.length-S);const I=parseInt(T.substring(S,S+v),E);v<8?(v=l(Math.pow(E,v)),R=R.j(v).add(l(I))):(R=R.j(y),R=R.add(l(I)))}return R}var d=c(0),p=c(1),g=c(16777216);r=o.prototype,r.m=function(){if(N(this))return-M(this).m();let T=0,E=1;for(let y=0;y<this.g.length;y++){const R=this.i(y);T+=(R>=0?R:4294967296+R)*E,E*=4294967296}return T},r.toString=function(T){if(T=T||10,T<2||36<T)throw Error("radix out of range: "+T);if(w(this))return"0";if(N(this))return"-"+M(this).toString(T);const E=l(Math.pow(T,6));var y=this;let R="";for(;;){const v=Ee(y,E).g;y=W(y,v.j(E));let S=((y.g.length>0?y.g[0]:y.h)>>>0).toString(T);if(y=v,w(y))return S+R;for(;S.length<6;)S="0"+S;R=S+R}},r.i=function(T){return T<0?0:T<this.g.length?this.g[T]:this.h};function w(T){if(T.h!=0)return!1;for(let E=0;E<T.g.length;E++)if(T.g[E]!=0)return!1;return!0}function N(T){return T.h==-1}r.l=function(T){return T=W(this,T),N(T)?-1:w(T)?0:1};function M(T){const E=T.g.length,y=[];for(let R=0;R<E;R++)y[R]=~T.g[R];return new o(y,~T.h).add(p)}r.abs=function(){return N(this)?M(this):this},r.add=function(T){const E=Math.max(this.g.length,T.g.length),y=[];let R=0;for(let v=0;v<=E;v++){let S=R+(this.i(v)&65535)+(T.i(v)&65535),I=(S>>>16)+(this.i(v)>>>16)+(T.i(v)>>>16);R=I>>>16,S&=65535,I&=65535,y[v]=I<<16|S}return new o(y,y[y.length-1]&-2147483648?-1:0)};function W(T,E){return T.add(M(E))}r.j=function(T){if(w(this)||w(T))return d;if(N(this))return N(T)?M(this).j(M(T)):M(M(this).j(T));if(N(T))return M(this.j(M(T)));if(this.l(g)<0&&T.l(g)<0)return l(this.m()*T.m());const E=this.g.length+T.g.length,y=[];for(var R=0;R<2*E;R++)y[R]=0;for(R=0;R<this.g.length;R++)for(let v=0;v<T.g.length;v++){const S=this.i(R)>>>16,I=this.i(R)&65535,Nt=T.i(v)>>>16,Yr=T.i(v)&65535;y[2*R+2*v]+=I*Yr,te(y,2*R+2*v),y[2*R+2*v+1]+=S*Yr,te(y,2*R+2*v+1),y[2*R+2*v+1]+=I*Nt,te(y,2*R+2*v+1),y[2*R+2*v+2]+=S*Nt,te(y,2*R+2*v+2)}for(T=0;T<E;T++)y[T]=y[2*T+1]<<16|y[2*T];for(T=E;T<2*E;T++)y[T]=0;return new o(y,0)};function te(T,E){for(;(T[E]&65535)!=T[E];)T[E+1]+=T[E]>>>16,T[E]&=65535,E++}function ie(T,E){this.g=T,this.h=E}function Ee(T,E){if(w(E))throw Error("division by zero");if(w(T))return new ie(d,d);if(N(T))return E=Ee(M(T),E),new ie(M(E.g),M(E.h));if(N(E))return E=Ee(T,M(E)),new ie(M(E.g),E.h);if(T.g.length>30){if(N(T)||N(E))throw Error("slowDivide_ only works with positive integers.");for(var y=p,R=E;R.l(T)<=0;)y=de(y),R=de(R);var v=le(y,1),S=le(R,1);for(R=le(R,2),y=le(y,2);!w(R);){var I=S.add(R);I.l(T)<=0&&(v=v.add(y),S=I),R=le(R,1),y=le(y,1)}return E=W(T,v.j(E)),new ie(v,E)}for(v=d;T.l(E)>=0;){for(y=Math.max(1,Math.floor(T.m()/E.m())),R=Math.ceil(Math.log(y)/Math.LN2),R=R<=48?1:Math.pow(2,R-48),S=l(y),I=S.j(E);N(I)||I.l(T)>0;)y-=R,S=l(y),I=S.j(E);w(S)&&(S=p),v=v.add(S),T=W(T,I)}return new ie(v,T)}r.B=function(T){return Ee(this,T).h},r.and=function(T){const E=Math.max(this.g.length,T.g.length),y=[];for(let R=0;R<E;R++)y[R]=this.i(R)&T.i(R);return new o(y,this.h&T.h)},r.or=function(T){const E=Math.max(this.g.length,T.g.length),y=[];for(let R=0;R<E;R++)y[R]=this.i(R)|T.i(R);return new o(y,this.h|T.h)},r.xor=function(T){const E=Math.max(this.g.length,T.g.length),y=[];for(let R=0;R<E;R++)y[R]=this.i(R)^T.i(R);return new o(y,this.h^T.h)};function de(T){const E=T.g.length+1,y=[];for(let R=0;R<E;R++)y[R]=T.i(R)<<1|T.i(R-1)>>>31;return new o(y,T.h)}function le(T,E){const y=E>>5;E%=32;const R=T.g.length-y,v=[];for(let S=0;S<R;S++)v[S]=E>0?T.i(S+y)>>>E|T.i(S+y+1)<<32-E:T.i(S+y);return new o(v,T.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,p_=n,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=l,o.fromString=B,Ar=o}).apply(typeof zp<"u"?zp:typeof self<"u"?self:typeof window<"u"?window:{});var Dc=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var C_,Lo,g_,Hc,DB,m_,__,E_;(function(){var r,e=Object.defineProperty;function t(u){u=[typeof globalThis=="object"&&globalThis,u,typeof window=="object"&&window,typeof self=="object"&&self,typeof Dc=="object"&&Dc];for(var h=0;h<u.length;++h){var f=u[h];if(f&&f.Math==Math)return f}throw Error("Cannot find global object")}var n=t(this);function s(u,h){if(h)e:{var f=n;u=u.split(".");for(var C=0;C<u.length-1;C++){var P=u[C];if(!(P in f))break e;f=f[P]}u=u[u.length-1],C=f[u],h=h(C),h!=C&&h!=null&&e(f,u,{configurable:!0,writable:!0,value:h})}}s("Symbol.dispose",function(u){return u||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(u){return u||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(u){return u||function(h){var f=[],C;for(C in h)Object.prototype.hasOwnProperty.call(h,C)&&f.push([C,h[C]]);return f}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function a(u){var h=typeof u;return h=="object"&&u!=null||h=="function"}function c(u,h,f){return u.call.apply(u.bind,arguments)}function l(u,h,f){return l=c,l.apply(null,arguments)}function B(u,h){var f=Array.prototype.slice.call(arguments,1);return function(){var C=f.slice();return C.push.apply(C,arguments),u.apply(this,C)}}function d(u,h){function f(){}f.prototype=h.prototype,u.Z=h.prototype,u.prototype=new f,u.prototype.constructor=u,u.Ob=function(C,P,F){for(var Q=Array(arguments.length-2),ue=2;ue<arguments.length;ue++)Q[ue-2]=arguments[ue];return h.prototype[P].apply(C,Q)}}var p=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?u=>u&&AsyncContext.Snapshot.wrap(u):u=>u;function g(u){const h=u.length;if(h>0){const f=Array(h);for(let C=0;C<h;C++)f[C]=u[C];return f}return[]}function w(u,h){for(let C=1;C<arguments.length;C++){const P=arguments[C];var f=typeof P;if(f=f!="object"?f:P?Array.isArray(P)?"array":f:"null",f=="array"||f=="object"&&typeof P.length=="number"){f=u.length||0;const F=P.length||0;u.length=f+F;for(let Q=0;Q<F;Q++)u[f+Q]=P[Q]}else u.push(P)}}class N{constructor(h,f){this.i=h,this.j=f,this.h=0,this.g=null}get(){let h;return this.h>0?(this.h--,h=this.g,this.g=h.next,h.next=null):h=this.i(),h}}function M(u){o.setTimeout(()=>{throw u},0)}function W(){var u=T;let h=null;return u.g&&(h=u.g,u.g=u.g.next,u.g||(u.h=null),h.next=null),h}class te{constructor(){this.h=this.g=null}add(h,f){const C=ie.get();C.set(h,f),this.h?this.h.next=C:this.g=C,this.h=C}}var ie=new N(()=>new Ee,u=>u.reset());class Ee{constructor(){this.next=this.g=this.h=null}set(h,f){this.h=h,this.g=f,this.next=null}reset(){this.next=this.g=this.h=null}}let de,le=!1,T=new te,E=()=>{const u=Promise.resolve(void 0);de=()=>{u.then(y)}};function y(){for(var u;u=W();){try{u.h.call(u.g)}catch(f){M(f)}var h=ie;h.j(u),h.h<100&&(h.h++,u.next=h.g,h.g=u)}le=!1}function R(){this.u=this.u,this.C=this.C}R.prototype.u=!1,R.prototype.dispose=function(){this.u||(this.u=!0,this.N())},R.prototype[Symbol.dispose]=function(){this.dispose()},R.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function v(u,h){this.type=u,this.g=this.target=h,this.defaultPrevented=!1}v.prototype.h=function(){this.defaultPrevented=!0};var S=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var u=!1,h=Object.defineProperty({},"passive",{get:function(){u=!0}});try{const f=()=>{};o.addEventListener("test",f,h),o.removeEventListener("test",f,h)}catch{}return u}();function I(u){return/^[\s\xa0]*$/.test(u)}function Nt(u,h){v.call(this,u?u.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,u&&this.init(u,h)}d(Nt,v),Nt.prototype.init=function(u,h){const f=this.type=u.type,C=u.changedTouches&&u.changedTouches.length?u.changedTouches[0]:null;this.target=u.target||u.srcElement,this.g=h,h=u.relatedTarget,h||(f=="mouseover"?h=u.fromElement:f=="mouseout"&&(h=u.toElement)),this.relatedTarget=h,C?(this.clientX=C.clientX!==void 0?C.clientX:C.pageX,this.clientY=C.clientY!==void 0?C.clientY:C.pageY,this.screenX=C.screenX||0,this.screenY=C.screenY||0):(this.clientX=u.clientX!==void 0?u.clientX:u.pageX,this.clientY=u.clientY!==void 0?u.clientY:u.pageY,this.screenX=u.screenX||0,this.screenY=u.screenY||0),this.button=u.button,this.key=u.key||"",this.ctrlKey=u.ctrlKey,this.altKey=u.altKey,this.shiftKey=u.shiftKey,this.metaKey=u.metaKey,this.pointerId=u.pointerId||0,this.pointerType=u.pointerType,this.state=u.state,this.i=u,u.defaultPrevented&&Nt.Z.h.call(this)},Nt.prototype.h=function(){Nt.Z.h.call(this);const u=this.i;u.preventDefault?u.preventDefault():u.returnValue=!1};var Yr="closure_listenable_"+(Math.random()*1e6|0),Ry=0;function by(u,h,f,C,P){this.listener=u,this.proxy=null,this.src=h,this.type=f,this.capture=!!C,this.ha=P,this.key=++Ry,this.da=this.fa=!1}function cc(u){u.da=!0,u.listener=null,u.proxy=null,u.src=null,u.ha=null}function uc(u,h,f){for(const C in u)h.call(f,u[C],C,u)}function Py(u,h){for(const f in u)h.call(void 0,u[f],f,u)}function Bf(u){const h={};for(const f in u)h[f]=u[f];return h}const hf="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function df(u,h){let f,C;for(let P=1;P<arguments.length;P++){C=arguments[P];for(f in C)u[f]=C[f];for(let F=0;F<hf.length;F++)f=hf[F],Object.prototype.hasOwnProperty.call(C,f)&&(u[f]=C[f])}}function lc(u){this.src=u,this.g={},this.h=0}lc.prototype.add=function(u,h,f,C,P){const F=u.toString();u=this.g[F],u||(u=this.g[F]=[],this.h++);const Q=El(u,h,C,P);return Q>-1?(h=u[Q],f||(h.fa=!1)):(h=new by(h,this.src,F,!!C,P),h.fa=f,u.push(h)),h};function _l(u,h){const f=h.type;if(f in u.g){var C=u.g[f],P=Array.prototype.indexOf.call(C,h,void 0),F;(F=P>=0)&&Array.prototype.splice.call(C,P,1),F&&(cc(h),u.g[f].length==0&&(delete u.g[f],u.h--))}}function El(u,h,f,C){for(let P=0;P<u.length;++P){const F=u[P];if(!F.da&&F.listener==h&&F.capture==!!f&&F.ha==C)return P}return-1}var Il="closure_lm_"+(Math.random()*1e6|0),yl={};function ff(u,h,f,C,P){if(Array.isArray(h)){for(let F=0;F<h.length;F++)ff(u,h[F],f,C,P);return null}return f=gf(f),u&&u[Yr]?u.J(h,f,a(C)?!!C.capture:!1,P):Sy(u,h,f,!1,C,P)}function Sy(u,h,f,C,P,F){if(!h)throw Error("Invalid event type");const Q=a(P)?!!P.capture:!!P;let ue=Dl(u);if(ue||(u[Il]=ue=new lc(u)),f=ue.add(h,f,C,Q,F),f.proxy)return f;if(C=Ny(),f.proxy=C,C.src=u,C.listener=f,u.addEventListener)S||(P=Q),P===void 0&&(P=!1),u.addEventListener(h.toString(),C,P);else if(u.attachEvent)u.attachEvent(Cf(h.toString()),C);else if(u.addListener&&u.removeListener)u.addListener(C);else throw Error("addEventListener and attachEvent are unavailable.");return f}function Ny(){function u(f){return h.call(u.src,u.listener,f)}const h=Oy;return u}function pf(u,h,f,C,P){if(Array.isArray(h))for(var F=0;F<h.length;F++)pf(u,h[F],f,C,P);else C=a(C)?!!C.capture:!!C,f=gf(f),u&&u[Yr]?(u=u.i,F=String(h).toString(),F in u.g&&(h=u.g[F],f=El(h,f,C,P),f>-1&&(cc(h[f]),Array.prototype.splice.call(h,f,1),h.length==0&&(delete u.g[F],u.h--)))):u&&(u=Dl(u))&&(h=u.g[h.toString()],u=-1,h&&(u=El(h,f,C,P)),(f=u>-1?h[u]:null)&&wl(f))}function wl(u){if(typeof u!="number"&&u&&!u.da){var h=u.src;if(h&&h[Yr])_l(h.i,u);else{var f=u.type,C=u.proxy;h.removeEventListener?h.removeEventListener(f,C,u.capture):h.detachEvent?h.detachEvent(Cf(f),C):h.addListener&&h.removeListener&&h.removeListener(C),(f=Dl(h))?(_l(f,u),f.h==0&&(f.src=null,h[Il]=null)):cc(u)}}}function Cf(u){return u in yl?yl[u]:yl[u]="on"+u}function Oy(u,h){if(u.da)u=!0;else{h=new Nt(h,this);const f=u.listener,C=u.ha||u.src;u.fa&&wl(u),u=f.call(C,h)}return u}function Dl(u){return u=u[Il],u instanceof lc?u:null}var Tl="__closure_events_fn_"+(Math.random()*1e9>>>0);function gf(u){return typeof u=="function"?u:(u[Tl]||(u[Tl]=function(h){return u.handleEvent(h)}),u[Tl])}function ft(){R.call(this),this.i=new lc(this),this.M=this,this.G=null}d(ft,R),ft.prototype[Yr]=!0,ft.prototype.removeEventListener=function(u,h,f,C){pf(this,u,h,f,C)};function Dt(u,h){var f,C=u.G;if(C)for(f=[];C;C=C.G)f.push(C);if(u=u.M,C=h.type||h,typeof h=="string")h=new v(h,u);else if(h instanceof v)h.target=h.target||u;else{var P=h;h=new v(C,u),df(h,P)}P=!0;let F,Q;if(f)for(Q=f.length-1;Q>=0;Q--)F=h.g=f[Q],P=Bc(F,C,!0,h)&&P;if(F=h.g=u,P=Bc(F,C,!0,h)&&P,P=Bc(F,C,!1,h)&&P,f)for(Q=0;Q<f.length;Q++)F=h.g=f[Q],P=Bc(F,C,!1,h)&&P}ft.prototype.N=function(){if(ft.Z.N.call(this),this.i){var u=this.i;for(const h in u.g){const f=u.g[h];for(let C=0;C<f.length;C++)cc(f[C]);delete u.g[h],u.h--}}this.G=null},ft.prototype.J=function(u,h,f,C){return this.i.add(String(u),h,!1,f,C)},ft.prototype.K=function(u,h,f,C){return this.i.add(String(u),h,!0,f,C)};function Bc(u,h,f,C){if(h=u.i.g[String(h)],!h)return!0;h=h.concat();let P=!0;for(let F=0;F<h.length;++F){const Q=h[F];if(Q&&!Q.da&&Q.capture==f){const ue=Q.listener,et=Q.ha||Q.src;Q.fa&&_l(u.i,Q),P=ue.call(et,C)!==!1&&P}}return P&&!C.defaultPrevented}function Fy(u,h){if(typeof u!="function")if(u&&typeof u.handleEvent=="function")u=l(u.handleEvent,u);else throw Error("Invalid listener argument");return Number(h)>2147483647?-1:o.setTimeout(u,h||0)}function mf(u){u.g=Fy(()=>{u.g=null,u.i&&(u.i=!1,mf(u))},u.l);const h=u.h;u.h=null,u.m.apply(null,h)}class Ly extends R{constructor(h,f){super(),this.m=h,this.l=f,this.h=null,this.i=!1,this.g=null}j(h){this.h=arguments,this.g?this.i=!0:mf(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function io(u){R.call(this),this.h=u,this.g={}}d(io,R);var _f=[];function Ef(u){uc(u.g,function(h,f){this.g.hasOwnProperty(f)&&wl(h)},u),u.g={}}io.prototype.N=function(){io.Z.N.call(this),Ef(this)},io.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Al=o.JSON.stringify,ky=o.JSON.parse,Vy=class{stringify(u){return o.JSON.stringify(u,void 0)}parse(u){return o.JSON.parse(u,void 0)}};function If(){}function yf(){}var oo={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function vl(){v.call(this,"d")}d(vl,v);function Rl(){v.call(this,"c")}d(Rl,v);var Xr={},wf=null;function hc(){return wf=wf||new ft}Xr.Ia="serverreachability";function Df(u){v.call(this,Xr.Ia,u)}d(Df,v);function ao(u){const h=hc();Dt(h,new Df(h))}Xr.STAT_EVENT="statevent";function Tf(u,h){v.call(this,Xr.STAT_EVENT,u),this.stat=h}d(Tf,v);function Tt(u){const h=hc();Dt(h,new Tf(h,u))}Xr.Ja="timingevent";function Af(u,h){v.call(this,Xr.Ja,u),this.size=h}d(Af,v);function co(u,h){if(typeof u!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){u()},h)}function uo(){this.g=!0}uo.prototype.ua=function(){this.g=!1};function xy(u,h,f,C,P,F){u.info(function(){if(u.g)if(F){var Q="",ue=F.split("&");for(let De=0;De<ue.length;De++){var et=ue[De].split("=");if(et.length>1){const st=et[0];et=et[1];const fn=st.split("_");Q=fn.length>=2&&fn[1]=="type"?Q+(st+"="+et+"&"):Q+(st+"=redacted&")}}}else Q=null;else Q=F;return"XMLHTTP REQ ("+C+") [attempt "+P+"]: "+h+`
`+f+`
`+Q})}function My(u,h,f,C,P,F,Q){u.info(function(){return"XMLHTTP RESP ("+C+") [ attempt "+P+"]: "+h+`
`+f+`
`+F+" "+Q})}function Ws(u,h,f,C){u.info(function(){return"XMLHTTP TEXT ("+h+"): "+Uy(u,f)+(C?" "+C:"")})}function Gy(u,h){u.info(function(){return"TIMEOUT: "+h})}uo.prototype.info=function(){};function Uy(u,h){if(!u.g)return h;if(!h)return null;try{const F=JSON.parse(h);if(F){for(u=0;u<F.length;u++)if(Array.isArray(F[u])){var f=F[u];if(!(f.length<2)){var C=f[1];if(Array.isArray(C)&&!(C.length<1)){var P=C[0];if(P!="noop"&&P!="stop"&&P!="close")for(let Q=1;Q<C.length;Q++)C[Q]=""}}}}return Al(F)}catch{return h}}var dc={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},vf={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},Rf;function bl(){}d(bl,If),bl.prototype.g=function(){return new XMLHttpRequest},Rf=new bl;function lo(u){return encodeURIComponent(String(u))}function Hy(u){var h=1;u=u.split(":");const f=[];for(;h>0&&u.length;)f.push(u.shift()),h--;return u.length&&f.push(u.join(":")),f}function sr(u,h,f,C){this.j=u,this.i=h,this.l=f,this.S=C||1,this.V=new io(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new bf}function bf(){this.i=null,this.g="",this.h=!1}var Pf={},Pl={};function Sl(u,h,f){u.M=1,u.A=pc(dn(h)),u.u=f,u.R=!0,Sf(u,null)}function Sf(u,h){u.F=Date.now(),fc(u),u.B=dn(u.A);var f=u.B,C=u.S;Array.isArray(C)||(C=[String(C)]),jf(f.i,"t",C),u.C=0,f=u.j.L,u.h=new bf,u.g=cp(u.j,f?h:null,!u.u),u.P>0&&(u.O=new Ly(l(u.Y,u,u.g),u.P)),h=u.V,f=u.g,C=u.ba;var P="readystatechange";Array.isArray(P)||(P&&(_f[0]=P.toString()),P=_f);for(let F=0;F<P.length;F++){const Q=ff(f,P[F],C||h.handleEvent,!1,h.h||h);if(!Q)break;h.g[Q.key]=Q}h=u.J?Bf(u.J):{},u.u?(u.v||(u.v="POST"),h["Content-Type"]="application/x-www-form-urlencoded",u.g.ea(u.B,u.v,u.u,h)):(u.v="GET",u.g.ea(u.B,u.v,null,h)),ao(),xy(u.i,u.v,u.B,u.l,u.S,u.u)}sr.prototype.ba=function(u){u=u.target;const h=this.O;h&&ar(u)==3?h.j():this.Y(u)},sr.prototype.Y=function(u){try{if(u==this.g)e:{const ue=ar(this.g),et=this.g.ya(),De=this.g.ca();if(!(ue<3)&&(ue!=3||this.g&&(this.h.h||this.g.la()||Yf(this.g)))){this.K||ue!=4||et==7||(et==8||De<=0?ao(3):ao(2)),Nl(this);var h=this.g.ca();this.X=h;var f=qy(this);if(this.o=h==200,My(this.i,this.v,this.B,this.l,this.S,ue,h),this.o){if(this.U&&!this.L){t:{if(this.g){var C,P=this.g;if((C=P.g?P.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!I(C)){var F=C;break t}}F=null}if(u=F)Ws(this.i,this.l,u,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Ol(this,u);else{this.o=!1,this.m=3,Tt(12),Zr(this),Bo(this);break e}}if(this.R){u=!0;let st;for(;!this.K&&this.C<f.length;)if(st=jy(this,f),st==Pl){ue==4&&(this.m=4,Tt(14),u=!1),Ws(this.i,this.l,null,"[Incomplete Response]");break}else if(st==Pf){this.m=4,Tt(15),Ws(this.i,this.l,f,"[Invalid Chunk]"),u=!1;break}else Ws(this.i,this.l,st,null),Ol(this,st);if(Nf(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),ue!=4||f.length!=0||this.h.h||(this.m=1,Tt(16),u=!1),this.o=this.o&&u,!u)Ws(this.i,this.l,f,"[Invalid Chunked Response]"),Zr(this),Bo(this);else if(f.length>0&&!this.W){this.W=!0;var Q=this.j;Q.g==this&&Q.aa&&!Q.P&&(Q.j.info("Great, no buffering proxy detected. Bytes received: "+f.length),Ul(Q),Q.P=!0,Tt(11))}}else Ws(this.i,this.l,f,null),Ol(this,f);ue==4&&Zr(this),this.o&&!this.K&&(ue==4?sp(this.j,this):(this.o=!1,fc(this)))}else sw(this.g),h==400&&f.indexOf("Unknown SID")>0?(this.m=3,Tt(12)):(this.m=0,Tt(13)),Zr(this),Bo(this)}}}catch{}finally{}};function qy(u){if(!Nf(u))return u.g.la();const h=Yf(u.g);if(h==="")return"";let f="";const C=h.length,P=ar(u.g)==4;if(!u.h.i){if(typeof TextDecoder>"u")return Zr(u),Bo(u),"";u.h.i=new o.TextDecoder}for(let F=0;F<C;F++)u.h.h=!0,f+=u.h.i.decode(h[F],{stream:!(P&&F==C-1)});return h.length=0,u.h.g+=f,u.C=0,u.h.g}function Nf(u){return u.g?u.v=="GET"&&u.M!=2&&u.j.Aa:!1}function jy(u,h){var f=u.C,C=h.indexOf(`
`,f);return C==-1?Pl:(f=Number(h.substring(f,C)),isNaN(f)?Pf:(C+=1,C+f>h.length?Pl:(h=h.slice(C,C+f),u.C=C+f,h)))}sr.prototype.cancel=function(){this.K=!0,Zr(this)};function fc(u){u.T=Date.now()+u.H,Of(u,u.H)}function Of(u,h){if(u.D!=null)throw Error("WatchDog timer not null");u.D=co(l(u.aa,u),h)}function Nl(u){u.D&&(o.clearTimeout(u.D),u.D=null)}sr.prototype.aa=function(){this.D=null;const u=Date.now();u-this.T>=0?(Gy(this.i,this.B),this.M!=2&&(ao(),Tt(17)),Zr(this),this.m=2,Bo(this)):Of(this,this.T-u)};function Bo(u){u.j.I==0||u.K||sp(u.j,u)}function Zr(u){Nl(u);var h=u.O;h&&typeof h.dispose=="function"&&h.dispose(),u.O=null,Ef(u.V),u.g&&(h=u.g,u.g=null,h.abort(),h.dispose())}function Ol(u,h){try{var f=u.j;if(f.I!=0&&(f.g==u||Fl(f.h,u))){if(!u.L&&Fl(f.h,u)&&f.I==3){try{var C=f.Ba.g.parse(h)}catch{C=null}if(Array.isArray(C)&&C.length==3){var P=C;if(P[0]==0){e:if(!f.v){if(f.g)if(f.g.F+3e3<u.F)Ec(f),mc(f);else break e;Gl(f),Tt(18)}}else f.xa=P[1],0<f.xa-f.K&&P[2]<37500&&f.F&&f.A==0&&!f.C&&(f.C=co(l(f.Va,f),6e3));kf(f.h)<=1&&f.ta&&(f.ta=void 0)}else ts(f,11)}else if((u.L||f.g==u)&&Ec(f),!I(h))for(P=f.Ba.g.parse(h),h=0;h<P.length;h++){let De=P[h];const st=De[0];if(!(st<=f.K))if(f.K=st,De=De[1],f.I==2)if(De[0]=="c"){f.M=De[1],f.ba=De[2];const fn=De[3];fn!=null&&(f.ka=fn,f.j.info("VER="+f.ka));const ns=De[4];ns!=null&&(f.za=ns,f.j.info("SVER="+f.za));const cr=De[5];cr!=null&&typeof cr=="number"&&cr>0&&(C=1.5*cr,f.O=C,f.j.info("backChannelRequestTimeoutMs_="+C)),C=f;const ur=u.g;if(ur){const yc=ur.g?ur.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(yc){var F=C.h;F.g||yc.indexOf("spdy")==-1&&yc.indexOf("quic")==-1&&yc.indexOf("h2")==-1||(F.j=F.l,F.g=new Set,F.h&&(Ll(F,F.h),F.h=null))}if(C.G){const Hl=ur.g?ur.g.getResponseHeader("X-HTTP-Session-Id"):null;Hl&&(C.wa=Hl,Se(C.J,C.G,Hl))}}f.I=3,f.l&&f.l.ra(),f.aa&&(f.T=Date.now()-u.F,f.j.info("Handshake RTT: "+f.T+"ms")),C=f;var Q=u;if(C.na=ap(C,C.L?C.ba:null,C.W),Q.L){Vf(C.h,Q);var ue=Q,et=C.O;et&&(ue.H=et),ue.D&&(Nl(ue),fc(ue)),C.g=Q}else np(C);f.i.length>0&&_c(f)}else De[0]!="stop"&&De[0]!="close"||ts(f,7);else f.I==3&&(De[0]=="stop"||De[0]=="close"?De[0]=="stop"?ts(f,7):Ml(f):De[0]!="noop"&&f.l&&f.l.qa(De),f.A=0)}}ao(4)}catch{}}var Jy=class{constructor(u,h){this.g=u,this.map=h}};function Ff(u){this.l=u||10,o.PerformanceNavigationTiming?(u=o.performance.getEntriesByType("navigation"),u=u.length>0&&(u[0].nextHopProtocol=="hq"||u[0].nextHopProtocol=="h2")):u=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=u?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Lf(u){return u.h?!0:u.g?u.g.size>=u.j:!1}function kf(u){return u.h?1:u.g?u.g.size:0}function Fl(u,h){return u.h?u.h==h:u.g?u.g.has(h):!1}function Ll(u,h){u.g?u.g.add(h):u.h=h}function Vf(u,h){u.h&&u.h==h?u.h=null:u.g&&u.g.has(h)&&u.g.delete(h)}Ff.prototype.cancel=function(){if(this.i=xf(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const u of this.g.values())u.cancel();this.g.clear()}};function xf(u){if(u.h!=null)return u.i.concat(u.h.G);if(u.g!=null&&u.g.size!==0){let h=u.i;for(const f of u.g.values())h=h.concat(f.G);return h}return g(u.i)}var Mf=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Ky(u,h){if(u){u=u.split("&");for(let f=0;f<u.length;f++){const C=u[f].indexOf("=");let P,F=null;C>=0?(P=u[f].substring(0,C),F=u[f].substring(C+1)):P=u[f],h(P,F?decodeURIComponent(F.replace(/\+/g," ")):"")}}}function ir(u){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let h;u instanceof ir?(this.l=u.l,ho(this,u.j),this.o=u.o,this.g=u.g,fo(this,u.u),this.h=u.h,kl(this,Jf(u.i)),this.m=u.m):u&&(h=String(u).match(Mf))?(this.l=!1,ho(this,h[1]||"",!0),this.o=po(h[2]||""),this.g=po(h[3]||"",!0),fo(this,h[4]),this.h=po(h[5]||"",!0),kl(this,h[6]||"",!0),this.m=po(h[7]||"")):(this.l=!1,this.i=new go(null,this.l))}ir.prototype.toString=function(){const u=[];var h=this.j;h&&u.push(Co(h,Gf,!0),":");var f=this.g;return(f||h=="file")&&(u.push("//"),(h=this.o)&&u.push(Co(h,Gf,!0),"@"),u.push(lo(f).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),f=this.u,f!=null&&u.push(":",String(f))),(f=this.h)&&(this.g&&f.charAt(0)!="/"&&u.push("/"),u.push(Co(f,f.charAt(0)=="/"?Qy:Wy,!0))),(f=this.i.toString())&&u.push("?",f),(f=this.m)&&u.push("#",Co(f,Yy)),u.join("")},ir.prototype.resolve=function(u){const h=dn(this);let f=!!u.j;f?ho(h,u.j):f=!!u.o,f?h.o=u.o:f=!!u.g,f?h.g=u.g:f=u.u!=null;var C=u.h;if(f)fo(h,u.u);else if(f=!!u.h){if(C.charAt(0)!="/")if(this.g&&!this.h)C="/"+C;else{var P=h.h.lastIndexOf("/");P!=-1&&(C=h.h.slice(0,P+1)+C)}if(P=C,P==".."||P==".")C="";else if(P.indexOf("./")!=-1||P.indexOf("/.")!=-1){C=P.lastIndexOf("/",0)==0,P=P.split("/");const F=[];for(let Q=0;Q<P.length;){const ue=P[Q++];ue=="."?C&&Q==P.length&&F.push(""):ue==".."?((F.length>1||F.length==1&&F[0]!="")&&F.pop(),C&&Q==P.length&&F.push("")):(F.push(ue),C=!0)}C=F.join("/")}else C=P}return f?h.h=C:f=u.i.toString()!=="",f?kl(h,Jf(u.i)):f=!!u.m,f&&(h.m=u.m),h};function dn(u){return new ir(u)}function ho(u,h,f){u.j=f?po(h,!0):h,u.j&&(u.j=u.j.replace(/:$/,""))}function fo(u,h){if(h){if(h=Number(h),isNaN(h)||h<0)throw Error("Bad port number "+h);u.u=h}else u.u=null}function kl(u,h,f){h instanceof go?(u.i=h,Xy(u.i,u.l)):(f||(h=Co(h,$y)),u.i=new go(h,u.l))}function Se(u,h,f){u.i.set(h,f)}function pc(u){return Se(u,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),u}function po(u,h){return u?h?decodeURI(u.replace(/%25/g,"%2525")):decodeURIComponent(u):""}function Co(u,h,f){return typeof u=="string"?(u=encodeURI(u).replace(h,zy),f&&(u=u.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),u):null}function zy(u){return u=u.charCodeAt(0),"%"+(u>>4&15).toString(16)+(u&15).toString(16)}var Gf=/[#\/\?@]/g,Wy=/[#\?:]/g,Qy=/[#\?]/g,$y=/[#\?@]/g,Yy=/#/g;function go(u,h){this.h=this.g=null,this.i=u||null,this.j=!!h}function es(u){u.g||(u.g=new Map,u.h=0,u.i&&Ky(u.i,function(h,f){u.add(decodeURIComponent(h.replace(/\+/g," ")),f)}))}r=go.prototype,r.add=function(u,h){es(this),this.i=null,u=Qs(this,u);let f=this.g.get(u);return f||this.g.set(u,f=[]),f.push(h),this.h+=1,this};function Uf(u,h){es(u),h=Qs(u,h),u.g.has(h)&&(u.i=null,u.h-=u.g.get(h).length,u.g.delete(h))}function Hf(u,h){return es(u),h=Qs(u,h),u.g.has(h)}r.forEach=function(u,h){es(this),this.g.forEach(function(f,C){f.forEach(function(P){u.call(h,P,C,this)},this)},this)};function qf(u,h){es(u);let f=[];if(typeof h=="string")Hf(u,h)&&(f=f.concat(u.g.get(Qs(u,h))));else for(u=Array.from(u.g.values()),h=0;h<u.length;h++)f=f.concat(u[h]);return f}r.set=function(u,h){return es(this),this.i=null,u=Qs(this,u),Hf(this,u)&&(this.h-=this.g.get(u).length),this.g.set(u,[h]),this.h+=1,this},r.get=function(u,h){return u?(u=qf(this,u),u.length>0?String(u[0]):h):h};function jf(u,h,f){Uf(u,h),f.length>0&&(u.i=null,u.g.set(Qs(u,h),g(f)),u.h+=f.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const u=[],h=Array.from(this.g.keys());for(let C=0;C<h.length;C++){var f=h[C];const P=lo(f);f=qf(this,f);for(let F=0;F<f.length;F++){let Q=P;f[F]!==""&&(Q+="="+lo(f[F])),u.push(Q)}}return this.i=u.join("&")};function Jf(u){const h=new go;return h.i=u.i,u.g&&(h.g=new Map(u.g),h.h=u.h),h}function Qs(u,h){return h=String(h),u.j&&(h=h.toLowerCase()),h}function Xy(u,h){h&&!u.j&&(es(u),u.i=null,u.g.forEach(function(f,C){const P=C.toLowerCase();C!=P&&(Uf(this,C),jf(this,P,f))},u)),u.j=h}function Zy(u,h){const f=new uo;if(o.Image){const C=new Image;C.onload=B(or,f,"TestLoadImage: loaded",!0,h,C),C.onerror=B(or,f,"TestLoadImage: error",!1,h,C),C.onabort=B(or,f,"TestLoadImage: abort",!1,h,C),C.ontimeout=B(or,f,"TestLoadImage: timeout",!1,h,C),o.setTimeout(function(){C.ontimeout&&C.ontimeout()},1e4),C.src=u}else h(!1)}function ew(u,h){const f=new uo,C=new AbortController,P=setTimeout(()=>{C.abort(),or(f,"TestPingServer: timeout",!1,h)},1e4);fetch(u,{signal:C.signal}).then(F=>{clearTimeout(P),F.ok?or(f,"TestPingServer: ok",!0,h):or(f,"TestPingServer: server error",!1,h)}).catch(()=>{clearTimeout(P),or(f,"TestPingServer: error",!1,h)})}function or(u,h,f,C,P){try{P&&(P.onload=null,P.onerror=null,P.onabort=null,P.ontimeout=null),C(f)}catch{}}function tw(){this.g=new Vy}function Vl(u){this.i=u.Sb||null,this.h=u.ab||!1}d(Vl,If),Vl.prototype.g=function(){return new Cc(this.i,this.h)};function Cc(u,h){ft.call(this),this.H=u,this.o=h,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}d(Cc,ft),r=Cc.prototype,r.open=function(u,h){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=u,this.D=h,this.readyState=1,_o(this)},r.send=function(u){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const h={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};u&&(h.body=u),(this.H||o).fetch(new Request(this.D,h)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,mo(this)),this.readyState=0},r.Pa=function(u){if(this.g&&(this.l=u,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=u.headers,this.readyState=2,_o(this)),this.g&&(this.readyState=3,_o(this),this.g)))if(this.responseType==="arraybuffer")u.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in u){if(this.j=u.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Kf(this)}else u.text().then(this.Oa.bind(this),this.ga.bind(this))};function Kf(u){u.j.read().then(u.Ma.bind(u)).catch(u.ga.bind(u))}r.Ma=function(u){if(this.g){if(this.o&&u.value)this.response.push(u.value);else if(!this.o){var h=u.value?u.value:new Uint8Array(0);(h=this.B.decode(h,{stream:!u.done}))&&(this.response=this.responseText+=h)}u.done?mo(this):_o(this),this.readyState==3&&Kf(this)}},r.Oa=function(u){this.g&&(this.response=this.responseText=u,mo(this))},r.Na=function(u){this.g&&(this.response=u,mo(this))},r.ga=function(){this.g&&mo(this)};function mo(u){u.readyState=4,u.l=null,u.j=null,u.B=null,_o(u)}r.setRequestHeader=function(u,h){this.A.append(u,h)},r.getResponseHeader=function(u){return this.h&&this.h.get(u.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const u=[],h=this.h.entries();for(var f=h.next();!f.done;)f=f.value,u.push(f[0]+": "+f[1]),f=h.next();return u.join(`\r
`)};function _o(u){u.onreadystatechange&&u.onreadystatechange.call(u)}Object.defineProperty(Cc.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(u){this.m=u?"include":"same-origin"}});function zf(u){let h="";return uc(u,function(f,C){h+=C,h+=":",h+=f,h+=`\r
`}),h}function xl(u,h,f){e:{for(C in f){var C=!1;break e}C=!0}C||(f=zf(f),typeof u=="string"?f!=null&&lo(f):Se(u,h,f))}function Ge(u){ft.call(this),this.headers=new Map,this.L=u||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}d(Ge,ft);var nw=/^https?$/i,rw=["POST","PUT"];r=Ge.prototype,r.Fa=function(u){this.H=u},r.ea=function(u,h,f,C){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+u);h=h?h.toUpperCase():"GET",this.D=u,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Rf.g(),this.g.onreadystatechange=p(l(this.Ca,this));try{this.B=!0,this.g.open(h,String(u),!0),this.B=!1}catch(F){Wf(this,F);return}if(u=f||"",f=new Map(this.headers),C)if(Object.getPrototypeOf(C)===Object.prototype)for(var P in C)f.set(P,C[P]);else if(typeof C.keys=="function"&&typeof C.get=="function")for(const F of C.keys())f.set(F,C.get(F));else throw Error("Unknown input type for opt_headers: "+String(C));C=Array.from(f.keys()).find(F=>F.toLowerCase()=="content-type"),P=o.FormData&&u instanceof o.FormData,!(Array.prototype.indexOf.call(rw,h,void 0)>=0)||C||P||f.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[F,Q]of f)this.g.setRequestHeader(F,Q);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(u),this.v=!1}catch(F){Wf(this,F)}};function Wf(u,h){u.h=!1,u.g&&(u.j=!0,u.g.abort(),u.j=!1),u.l=h,u.o=5,Qf(u),gc(u)}function Qf(u){u.A||(u.A=!0,Dt(u,"complete"),Dt(u,"error"))}r.abort=function(u){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=u||7,Dt(this,"complete"),Dt(this,"abort"),gc(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),gc(this,!0)),Ge.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?$f(this):this.Xa())},r.Xa=function(){$f(this)};function $f(u){if(u.h&&typeof i<"u"){if(u.v&&ar(u)==4)setTimeout(u.Ca.bind(u),0);else if(Dt(u,"readystatechange"),ar(u)==4){u.h=!1;try{const F=u.ca();e:switch(F){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var h=!0;break e;default:h=!1}var f;if(!(f=h)){var C;if(C=F===0){let Q=String(u.D).match(Mf)[1]||null;!Q&&o.self&&o.self.location&&(Q=o.self.location.protocol.slice(0,-1)),C=!nw.test(Q?Q.toLowerCase():"")}f=C}if(f)Dt(u,"complete"),Dt(u,"success");else{u.o=6;try{var P=ar(u)>2?u.g.statusText:""}catch{P=""}u.l=P+" ["+u.ca()+"]",Qf(u)}}finally{gc(u)}}}}function gc(u,h){if(u.g){u.m&&(clearTimeout(u.m),u.m=null);const f=u.g;u.g=null,h||Dt(u,"ready");try{f.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function ar(u){return u.g?u.g.readyState:0}r.ca=function(){try{return ar(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(u){if(this.g){var h=this.g.responseText;return u&&h.indexOf(u)==0&&(h=h.substring(u.length)),ky(h)}};function Yf(u){try{if(!u.g)return null;if("response"in u.g)return u.g.response;switch(u.F){case"":case"text":return u.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in u.g)return u.g.mozResponseArrayBuffer}return null}catch{return null}}function sw(u){const h={};u=(u.g&&ar(u)>=2&&u.g.getAllResponseHeaders()||"").split(`\r
`);for(let C=0;C<u.length;C++){if(I(u[C]))continue;var f=Hy(u[C]);const P=f[0];if(f=f[1],typeof f!="string")continue;f=f.trim();const F=h[P]||[];h[P]=F,F.push(f)}Py(h,function(C){return C.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Eo(u,h,f){return f&&f.internalChannelParams&&f.internalChannelParams[u]||h}function Xf(u){this.za=0,this.i=[],this.j=new uo,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Eo("failFast",!1,u),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Eo("baseRetryDelayMs",5e3,u),this.Za=Eo("retryDelaySeedMs",1e4,u),this.Ta=Eo("forwardChannelMaxRetries",2,u),this.va=Eo("forwardChannelRequestTimeoutMs",2e4,u),this.ma=u&&u.xmlHttpFactory||void 0,this.Ua=u&&u.Rb||void 0,this.Aa=u&&u.useFetchStreams||!1,this.O=void 0,this.L=u&&u.supportsCrossDomainXhr||!1,this.M="",this.h=new Ff(u&&u.concurrentRequestLimit),this.Ba=new tw,this.S=u&&u.fastHandshake||!1,this.R=u&&u.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=u&&u.Pb||!1,u&&u.ua&&this.j.ua(),u&&u.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&u&&u.detectBufferingProxy||!1,this.ia=void 0,u&&u.longPollingTimeout&&u.longPollingTimeout>0&&(this.ia=u.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=Xf.prototype,r.ka=8,r.I=1,r.connect=function(u,h,f,C){Tt(0),this.W=u,this.H=h||{},f&&C!==void 0&&(this.H.OSID=f,this.H.OAID=C),this.F=this.X,this.J=ap(this,null,this.W),_c(this)};function Ml(u){if(Zf(u),u.I==3){var h=u.V++,f=dn(u.J);if(Se(f,"SID",u.M),Se(f,"RID",h),Se(f,"TYPE","terminate"),Io(u,f),h=new sr(u,u.j,h),h.M=2,h.A=pc(dn(f)),f=!1,o.navigator&&o.navigator.sendBeacon)try{f=o.navigator.sendBeacon(h.A.toString(),"")}catch{}!f&&o.Image&&(new Image().src=h.A,f=!0),f||(h.g=cp(h.j,null),h.g.ea(h.A)),h.F=Date.now(),fc(h)}op(u)}function mc(u){u.g&&(Ul(u),u.g.cancel(),u.g=null)}function Zf(u){mc(u),u.v&&(o.clearTimeout(u.v),u.v=null),Ec(u),u.h.cancel(),u.m&&(typeof u.m=="number"&&o.clearTimeout(u.m),u.m=null)}function _c(u){if(!Lf(u.h)&&!u.m){u.m=!0;var h=u.Ea;de||E(),le||(de(),le=!0),T.add(h,u),u.D=0}}function iw(u,h){return kf(u.h)>=u.h.j-(u.m?1:0)?!1:u.m?(u.i=h.G.concat(u.i),!0):u.I==1||u.I==2||u.D>=(u.Sa?0:u.Ta)?!1:(u.m=co(l(u.Ea,u,h),ip(u,u.D)),u.D++,!0)}r.Ea=function(u){if(this.m)if(this.m=null,this.I==1){if(!u){this.V=Math.floor(Math.random()*1e5),u=this.V++;const P=new sr(this,this.j,u);let F=this.o;if(this.U&&(F?(F=Bf(F),df(F,this.U)):F=this.U),this.u!==null||this.R||(P.J=F,F=null),this.S)e:{for(var h=0,f=0;f<this.i.length;f++){t:{var C=this.i[f];if("__data__"in C.map&&(C=C.map.__data__,typeof C=="string")){C=C.length;break t}C=void 0}if(C===void 0)break;if(h+=C,h>4096){h=f;break e}if(h===4096||f===this.i.length-1){h=f+1;break e}}h=1e3}else h=1e3;h=tp(this,P,h),f=dn(this.J),Se(f,"RID",u),Se(f,"CVER",22),this.G&&Se(f,"X-HTTP-Session-Id",this.G),Io(this,f),F&&(this.R?h="headers="+lo(zf(F))+"&"+h:this.u&&xl(f,this.u,F)),Ll(this.h,P),this.Ra&&Se(f,"TYPE","init"),this.S?(Se(f,"$req",h),Se(f,"SID","null"),P.U=!0,Sl(P,f,null)):Sl(P,f,h),this.I=2}}else this.I==3&&(u?ep(this,u):this.i.length==0||Lf(this.h)||ep(this))};function ep(u,h){var f;h?f=h.l:f=u.V++;const C=dn(u.J);Se(C,"SID",u.M),Se(C,"RID",f),Se(C,"AID",u.K),Io(u,C),u.u&&u.o&&xl(C,u.u,u.o),f=new sr(u,u.j,f,u.D+1),u.u===null&&(f.J=u.o),h&&(u.i=h.G.concat(u.i)),h=tp(u,f,1e3),f.H=Math.round(u.va*.5)+Math.round(u.va*.5*Math.random()),Ll(u.h,f),Sl(f,C,h)}function Io(u,h){u.H&&uc(u.H,function(f,C){Se(h,C,f)}),u.l&&uc({},function(f,C){Se(h,C,f)})}function tp(u,h,f){f=Math.min(u.i.length,f);const C=u.l?l(u.l.Ka,u.l,u):null;e:{var P=u.i;let ue=-1;for(;;){const et=["count="+f];ue==-1?f>0?(ue=P[0].g,et.push("ofs="+ue)):ue=0:et.push("ofs="+ue);let De=!0;for(let st=0;st<f;st++){var F=P[st].g;const fn=P[st].map;if(F-=ue,F<0)ue=Math.max(0,P[st].g-100),De=!1;else try{F="req"+F+"_"||"";try{var Q=fn instanceof Map?fn:Object.entries(fn);for(const[ns,cr]of Q){let ur=cr;a(cr)&&(ur=Al(cr)),et.push(F+ns+"="+encodeURIComponent(ur))}}catch(ns){throw et.push(F+"type="+encodeURIComponent("_badmap")),ns}}catch{C&&C(fn)}}if(De){Q=et.join("&");break e}}Q=void 0}return u=u.i.splice(0,f),h.G=u,Q}function np(u){if(!u.g&&!u.v){u.Y=1;var h=u.Da;de||E(),le||(de(),le=!0),T.add(h,u),u.A=0}}function Gl(u){return u.g||u.v||u.A>=3?!1:(u.Y++,u.v=co(l(u.Da,u),ip(u,u.A)),u.A++,!0)}r.Da=function(){if(this.v=null,rp(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var u=4*this.T;this.j.info("BP detection timer enabled: "+u),this.B=co(l(this.Wa,this),u)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Tt(10),mc(this),rp(this))};function Ul(u){u.B!=null&&(o.clearTimeout(u.B),u.B=null)}function rp(u){u.g=new sr(u,u.j,"rpc",u.Y),u.u===null&&(u.g.J=u.o),u.g.P=0;var h=dn(u.na);Se(h,"RID","rpc"),Se(h,"SID",u.M),Se(h,"AID",u.K),Se(h,"CI",u.F?"0":"1"),!u.F&&u.ia&&Se(h,"TO",u.ia),Se(h,"TYPE","xmlhttp"),Io(u,h),u.u&&u.o&&xl(h,u.u,u.o),u.O&&(u.g.H=u.O);var f=u.g;u=u.ba,f.M=1,f.A=pc(dn(h)),f.u=null,f.R=!0,Sf(f,u)}r.Va=function(){this.C!=null&&(this.C=null,mc(this),Gl(this),Tt(19))};function Ec(u){u.C!=null&&(o.clearTimeout(u.C),u.C=null)}function sp(u,h){var f=null;if(u.g==h){Ec(u),Ul(u),u.g=null;var C=2}else if(Fl(u.h,h))f=h.G,Vf(u.h,h),C=1;else return;if(u.I!=0){if(h.o)if(C==1){f=h.u?h.u.length:0,h=Date.now()-h.F;var P=u.D;C=hc(),Dt(C,new Af(C,f)),_c(u)}else np(u);else if(P=h.m,P==3||P==0&&h.X>0||!(C==1&&iw(u,h)||C==2&&Gl(u)))switch(f&&f.length>0&&(h=u.h,h.i=h.i.concat(f)),P){case 1:ts(u,5);break;case 4:ts(u,10);break;case 3:ts(u,6);break;default:ts(u,2)}}}function ip(u,h){let f=u.Qa+Math.floor(Math.random()*u.Za);return u.isActive()||(f*=2),f*h}function ts(u,h){if(u.j.info("Error code "+h),h==2){var f=l(u.bb,u),C=u.Ua;const P=!C;C=new ir(C||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||ho(C,"https"),pc(C),P?Zy(C.toString(),f):ew(C.toString(),f)}else Tt(2);u.I=0,u.l&&u.l.pa(h),op(u),Zf(u)}r.bb=function(u){u?(this.j.info("Successfully pinged google.com"),Tt(2)):(this.j.info("Failed to ping google.com"),Tt(1))};function op(u){if(u.I=0,u.ja=[],u.l){const h=xf(u.h);(h.length!=0||u.i.length!=0)&&(w(u.ja,h),w(u.ja,u.i),u.h.i.length=0,g(u.i),u.i.length=0),u.l.oa()}}function ap(u,h,f){var C=f instanceof ir?dn(f):new ir(f);if(C.g!="")h&&(C.g=h+"."+C.g),fo(C,C.u);else{var P=o.location;C=P.protocol,h=h?h+"."+P.hostname:P.hostname,P=+P.port;const F=new ir(null);C&&ho(F,C),h&&(F.g=h),P&&fo(F,P),f&&(F.h=f),C=F}return f=u.G,h=u.wa,f&&h&&Se(C,f,h),Se(C,"VER",u.ka),Io(u,C),C}function cp(u,h,f){if(h&&!u.L)throw Error("Can't create secondary domain capable XhrIo object.");return h=u.Aa&&!u.ma?new Ge(new Vl({ab:f})):new Ge(u.ma),h.Fa(u.L),h}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function up(){}r=up.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function Ic(){}Ic.prototype.g=function(u,h){return new Ht(u,h)};function Ht(u,h){ft.call(this),this.g=new Xf(h),this.l=u,this.h=h&&h.messageUrlParams||null,u=h&&h.messageHeaders||null,h&&h.clientProtocolHeaderRequired&&(u?u["X-Client-Protocol"]="webchannel":u={"X-Client-Protocol":"webchannel"}),this.g.o=u,u=h&&h.initMessageHeaders||null,h&&h.messageContentType&&(u?u["X-WebChannel-Content-Type"]=h.messageContentType:u={"X-WebChannel-Content-Type":h.messageContentType}),h&&h.sa&&(u?u["X-WebChannel-Client-Profile"]=h.sa:u={"X-WebChannel-Client-Profile":h.sa}),this.g.U=u,(u=h&&h.Qb)&&!I(u)&&(this.g.u=u),this.A=h&&h.supportsCrossDomainXhr||!1,this.v=h&&h.sendRawJson||!1,(h=h&&h.httpSessionIdParam)&&!I(h)&&(this.g.G=h,u=this.h,u!==null&&h in u&&(u=this.h,h in u&&delete u[h])),this.j=new $s(this)}d(Ht,ft),Ht.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Ht.prototype.close=function(){Ml(this.g)},Ht.prototype.o=function(u){var h=this.g;if(typeof u=="string"){var f={};f.__data__=u,u=f}else this.v&&(f={},f.__data__=Al(u),u=f);h.i.push(new Jy(h.Ya++,u)),h.I==3&&_c(h)},Ht.prototype.N=function(){this.g.l=null,delete this.j,Ml(this.g),delete this.g,Ht.Z.N.call(this)};function lp(u){vl.call(this),u.__headers__&&(this.headers=u.__headers__,this.statusCode=u.__status__,delete u.__headers__,delete u.__status__);var h=u.__sm__;if(h){e:{for(const f in h){u=f;break e}u=void 0}(this.i=u)&&(u=this.i,h=h!==null&&u in h?h[u]:void 0),this.data=h}else this.data=u}d(lp,vl);function Bp(){Rl.call(this),this.status=1}d(Bp,Rl);function $s(u){this.g=u}d($s,up),$s.prototype.ra=function(){Dt(this.g,"a")},$s.prototype.qa=function(u){Dt(this.g,new lp(u))},$s.prototype.pa=function(u){Dt(this.g,new Bp)},$s.prototype.oa=function(){Dt(this.g,"b")},Ic.prototype.createWebChannel=Ic.prototype.g,Ht.prototype.send=Ht.prototype.o,Ht.prototype.open=Ht.prototype.m,Ht.prototype.close=Ht.prototype.close,E_=function(){return new Ic},__=function(){return hc()},m_=Xr,DB={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},dc.NO_ERROR=0,dc.TIMEOUT=8,dc.HTTP_ERROR=6,Hc=dc,vf.COMPLETE="complete",g_=vf,yf.EventType=oo,oo.OPEN="a",oo.CLOSE="b",oo.ERROR="c",oo.MESSAGE="d",ft.prototype.listen=ft.prototype.J,Lo=yf,Ge.prototype.listenOnce=Ge.prototype.K,Ge.prototype.getLastError=Ge.prototype.Ha,Ge.prototype.getLastErrorCode=Ge.prototype.ya,Ge.prototype.getStatus=Ge.prototype.ca,Ge.prototype.getResponseJson=Ge.prototype.La,Ge.prototype.getResponseText=Ge.prototype.la,Ge.prototype.send=Ge.prototype.ea,Ge.prototype.setWithCredentials=Ge.prototype.Fa,C_=Ge}).apply(typeof Dc<"u"?Dc:typeof self<"u"?self:typeof window<"u"?window:{});/*!
* re2js
* RE2JS is the JavaScript port of RE2, a regular expression engine that provides linear time matching
*
* @version v2.8.6
* @author Oleksii Vasyliev
* @homepage https://github.com/le0pard/re2js#readme
* @repository github:le0pard/re2js
* @license MIT
*/var Te,G=(Te=class{},j(Te,"FOLD_CASE",1),j(Te,"LITERAL",2),j(Te,"CLASS_NL",4),j(Te,"DOT_NL",8),j(Te,"ONE_LINE",16),j(Te,"NON_GREEDY",32),j(Te,"PERL_X",64),j(Te,"UNICODE_GROUPS",128),j(Te,"WAS_DOLLAR",256),j(Te,"LOOKBEHIND",512),j(Te,"MATCH_NL",Te.CLASS_NL|Te.DOT_NL),j(Te,"PERL",Te.CLASS_NL|Te.ONE_LINE|Te.PERL_X|Te.UNICODE_GROUPS),j(Te,"POSIX",0),j(Te,"UNANCHORED",0),j(Te,"ANCHOR_START",1),j(Te,"ANCHOR_BOTH",2),Te);const Xs={CASE_INSENSITIVE:1,DOTALL:2,MULTILINE:4,DISABLE_UNICODE_GROUPS:8,LONGEST_MATCH:16,LOOKBEHINDS:512},ha=128,TB=new Int32Array(ha),AB=new Int32Array(ha),Tc=65535;for(let r=0;r<ha;r++)r>=97&&r<=122?TB[r]=r-32:TB[r]=r,r>=65&&r<=90?AB[r]=r+32:AB[r]=r;var dB,L=(dB=class{static toUpperCase(r){if(r<ha)return TB[r];const e=String.fromCodePoint(r).toUpperCase(),t=e.codePointAt(0)>Tc?2:1;if(e.length>t)return r;const n=String.fromCodePoint(e.codePointAt(0)).toLowerCase(),s=n.codePointAt(0)>Tc?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}static toLowerCase(r){if(r<ha)return AB[r];const e=String.fromCodePoint(r).toLowerCase(),t=e.codePointAt(0)>Tc?2:1;if(e.length>t)return r;const n=String.fromCodePoint(e.codePointAt(0)).toUpperCase(),s=n.codePointAt(0)>Tc?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}},j(dB,"CODES",new Map([["\x07",7],["\b",8],["	",9],[`
`,10],["\v",11],["\f",12],["\r",13],[" ",32],['"',34],["$",36],["&",38],["'",39],["(",40],[")",41],["*",42],["+",43],["-",45],[".",46],["0",48],["1",49],["2",50],["3",51],["4",52],["5",53],["6",54],["7",55],["8",56],["9",57],[":",58],["<",60],[">",62],["?",63],["A",65],["B",66],["C",67],["F",70],["P",80],["Q",81],["U",85],["Z",90],["[",91],["\\",92],["]",93],["^",94],["_",95],["`",96],["a",97],["b",98],["f",102],["i",105],["m",109],["n",110],["r",114],["s",115],["t",116],["v",118],["x",120],["z",122],["{",123],["|",124],["}",125]])),dB),m=class{constructor(r,e=!1){this.data=r,this.isStride1=e,this.SIZE=e?2:3}getLo(r){return this.data[r*this.SIZE]}getHi(r){return this.data[r*this.SIZE+1]}getStride(r){return this.isStride1?1:this.data[r*this.SIZE+2]}get length(){return this.data.length/this.SIZE}};const I_=new Uint8Array(256);for(let r=0,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";r<64;r++)I_[e.charCodeAt(r)]=r;const y_=r=>{const e=[];let t=0,n=0;for(let s=0;s<r.length;s++){let i=I_[r.charCodeAt(s)];t|=(i&31)<<n,i&32?n+=5:(e.push(t),t=0,n=0)}return e},_=(r,e)=>{const t=y_(r),n=e?t.length/2:t.length/3,s=new Uint32Array(n*3);let i=0,o=0;for(let a=0;a<n;a++)i+=t[o++],s[a*3]=i,i+=t[o++],s[a*3+1]=i,s[a*3+2]=e?1:t[o++];return s},ab=r=>{const e=y_(r),t=new Map;let n=0;for(let s=0;s<e.length;s+=2){n+=e[s];const i=e[s+1],o=i>>>1^-(i&1);t.set(n,n+o)}return t};var Ac=class{constructor(r){this.initializer=r,this.cache=new Map}has(r){return r in this.initializer}get(r){if(this.cache.has(r))return this.cache.get(r);const e=this.initializer[r],t=e?e():null;return this.cache.set(r,t),t}},gr,Ft=(gr=class{static get CASE_ORBIT(){return this._CASE_ORBIT||(this._CASE_ORBIT=ab("rCgCIgCY+rQI4QiCuuBLgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCCgCBgCBgCBgCBgCBgCBgCB+7OB-BB-BB-BB-BB-BBskQB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BC-BB-BB-BB-BB-BB-BB-BByHBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBxHBCBBBCBBBCBBB3SBmMBkNBCBBBCBBB8MBCBBB6MB6MBCBBC+EB0MB2MBCBBB6MB+MBiGBmNBiNBCBBBmKBikzCBmNBqNBkIBsNBCBBBCBBBCBBB0NBCBBB0NDCBBB0NBCBBByNByNBCBBBCBBB2NBCBBDCBBCwDFCBCBDBCBCBDBCBCBDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB9EBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBCBDBCBBBhGBvDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBjICCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBH2iVBCBBBlKBwiVB+jVB+jVBCBBBlMBqEBuEBCBBBCBBBCBBBCBBBCBBB+hVB4hVB8hVBjNB7MC5MB5MCzMC1MB+0yCE5MB20yCC9MBu2yCBwyyCBo0yCChNBlNBo0yCBu-UBi0yCDlNC6-UBpNDrNIu+UDzNCm0yCBzNE0yyCBzNBpEBxNBxNBtEG1NLqxyCBkxyCnFoFrBCBBBCBBDCBBEkIBkIBkICoHHsCCqCBqCBqCCgEC+DB+DBmkOBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCC+BBgCBgCBgCBgCBgCBgCBgCBgCBrCBpCBpCBpCBmjOB-BB8BB-BB-BBgEB-BB-BByBBqgOBsDB-BBtwBB-BB-BB-BBsBBgDBCB-BB-BB-BBeB-BB-BB61OB-BB-BB-DB9DB9DBQB7DBmCE9CBrDBPBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBrFB-EBOBnHB3FB-FCCBBBNBCBBCjIBjIBjIBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB8kMB-BB6kMB-BB-BB-BB-BB-BB-BB-BB-BB-BBokMB-BB-BBkkMBkkMB-BB-BB-BB-BB-BB-BB-BB4jMB-BB-BB-BB-BB-BB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EBCBBBCBoiMBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBJCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBeBCBBBCBBBCBBBCBBBCBBBCBBBCBBBdBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDL-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-C64CgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOCgmOGgmODg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FDg8FBg8FBg8FhVg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBQBQBQBQBQBQDPBPBPBPBPBPjkC7mMB5mMBnmMBjmMBCBlmMB3lMBpiMBk8kCBCBBG-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FD-7FB-7FB-7F6FoglCEsuHRwjlCyDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCB0DBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBG1DD97OCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPEQCQCQCQCPCPCPCPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPB0EB0EBsFBsFBsFBsFBoGBoGBgIBgIBgHBgHB8HB8HDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQCSFPBPBzEBzEBRCxnOFSFrFBrFBrFBrFBREQBQClkOFPBPBnGBnGFQBQCljOCODPBPB-GB-GBNHSF-HB-HB7HB7HBRqJ53OE9tQBrmQH4Bc3BSgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfECBByZ0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzB34BgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CBCBBBt-UBruHBt+UB1iVBviVBCBBBCBBBCBBB3hVB5-UB9hVB7hVCCBBCCBBI9jVB9jVBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBICBBBCBBECBBN-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOC-lOG-lOzoeCBBBCBBBCBBBCBBBCBBBCBl8kCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBTCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBnECBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBKCBBBCBBBnglCBCBBBCBBBCBBBCBBBCBBECBBBvyyCDCBBBCBBBgDCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBn0yCB90yCB10yCBh0yCBn0yCCjxyCBzyyCBpxyCBg6BBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB-CBl0yCBvjlCBCBBBCBBBt2yCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBhkzCZCBB9a-5Bd-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCm6TCBB7gBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCH-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BmlBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvChDwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCFvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvC1DuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCCuCBuCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCCtCBtCk2BgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEO-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-D+CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCL-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-B74CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhrVgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BD1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BtxekCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjC")),this._CASE_ORBIT}static get Print(){return this._Print||(this._Print=new m(_("hB9CBjBLBCpWBDFBFGBCCCBSBCsMBClBBDxBBDCBC2BBJaBFFBSVBC-FBCvBBD6BBDkDBP6BBDwBBDOBCbBDCCBJBGfBIqCBCgFBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYBDCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPBLCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGBCCBCHBDBBDVBCGBCBBCEBDIBDBBDCBICBFBBCEBDRBLBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBGMBCCBCWBCPBDIBCCBCDBIBBCCBCBBDDBDJBIVBCCBCWBCJBCEBDIBCCBCDBIBBGCBCDBDJBCCBNMBCCBCyBBCCBCFBFPBDZBCCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBN5BBFcBmBBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDBhBnCBCjBBFmBBCjBBCOBCMBmBlGBCGGD4LBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBH1CBDFBD-TBCbBE4CBIVBKXBKTBNMBCCBCBBN9CBDJBHJBHNBCKBH4CBIqBBGlCBLeBCLBFLBFEEBoBBDEBMrBBFZBHKBE9BBDgCBCcBDKBHJBHNBDtBBDLBVsCBClFBJ7BBEOBE9BBGqBBDKBJqBBG1QBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBSXBJuBBSBBDaBCMBEhBBPgBBQrEBF5UBXKBWz4BBD9LBGsBBCGGD3BBIBBPXBKGBCGBCGBCGBCGBCGBCGBCGBC9DBjBZBC4CBN1GBbPBC+BBC1CBDmDBGqBBC9CBC1CBKvBBCszcBE2BBK7KBV3FBJ8GBV7BBEJBH3BBJlCBJLBHzDBMdBEtCBCKBFgBBC2BBKNBDJBDmDBZbBLFBDFBDFBKGBCGBC7BBF9DBDJBHj9KBNWBFwBBloItLBDpDBnBGBNEBGZBCEBCCCBCCBCCBoUBhBpBBHyBBCSBCDBFEBCmEBF9FBEFBDFBDFBDCBEGBCGBOBBDLBCZBCSBCBBCOBDNBjB6DBGCBFsBBE3CBCMBEwBwBBsBBjEcBEwBBQbBFjBBKdBGqBBGdBCkBBFNBrB9EBDJBHjBBFjBBFnBBJzBBMLBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBCnCBJIBxBSBCBBGgBBEaBGaBnB3BBFTBDxBBCBBGHBCCBCcBDCBFJBIIBI-BBhBmBBFLBK1BBEcBDaBGZBIDBNGBxCoCB4ByBBOyBBItBBJJBHlBBEcBJBBxGeBCpBBCCBDBBRFBJIBiBtBBJpBBXZBnBbBVWBKtCBFjBBK9BBCEBOYBIJBH0BBCRBJmBBK-CBCTBMRBCuBB-BGBCCCBCBCOBCKBH6BBGJBHDBCHBDBBDVBCGBCBBCEBCJBDBBDCBDHHGGBDGBEEBMJBCDDClBBCJBCDDCDBCJBCBBJBBe7CBCEBfnCBJJBnF1BBDlBBjBkCBMJBHMBU5BBHJBHTBdaBDOBFWB6F7BBlDyCBNHBDDDBGBCBBCdBCBBDLBKJBnCHBDtBBDKBcnCBJyCBOoCBIJB3CHB5ChBBPJBHIBCsBBCNBLcBEfBDVBCNBqCGBCBBCrBBECCBCCBHBJJBHFBCBBCkBBCBBCFBIJBHrBBFJB3HYBIQBCoBBEcB2CQQBwBBO6cBnDuDBCEBMjGBtyCiDBOvhBBRVBL68DBGmSB61G5BBn2B4RBIeBCJBFwCBCJBHdBDFBLlCBLJBCGBCUBGSBxN5BBnG6CBGYBDYBtBqCBF4BBIQBhCEBMGBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBDDBh7D8HBEzNBHWBQQBQtBBDWBKzDB9B1HBLmBBDpCBJvDBWlCB7DTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBD9VBQEBCOBxiBeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBENBDJBFBBhKeBS5BBGxOxOBoBB3GqBBFhGhGBdBCVBJBBhHGBCDBCBBCOBCkGBDPBqBrCBFJBFBByYjCBtC8BBjGDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBBvIrBBFjDBNOBDOBCOBCkBBLtFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBmgB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIBnkzVvHB",!1))),this._Print}static get Upper(){return this.CATEGORIES.get("Lu")}},j(gr,"_CASE_ORBIT",null),j(gr,"_Print",null),j(gr,"CATEGORIES",new Ac({C:()=>new m(_("AfBgDgBBOrWrWBHHBCBICCVuMuMnBBBzBBBE4B4BBGBcDBHQBXhGhGxBBB8BBBmDNB8BBByBBBQddBCCMEBhBGBsCiFiFJBBDBBXIICCBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBPMMBEB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKMMBDBbEByBPBDBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCB-FCBHBBHBBHBBECBIIIBLBDBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIB-BGGBLBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMBxhBPBXJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBF-6DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBrCHBxDUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIlkzVBxHvw-FB",!1)),Cc:()=>new m(_("AfgDgB",!0)),Cf:()=>new m(_("tFzqBzqBBEBXhGhGyBhMhMBxCxCs5D9-B9-BBDBbEByBEBCJBw03B6H6HBBBimEQQj7IPBhjiBDBwmFHBn0rYffB+CB",!1)),Cn:()=>new m(_("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBDBvzIBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-BB---BBB---BBB",!1)),Co:()=>new m(_("gg4B-nGh4hc9--BD9--B",!0)),Cs:()=>new m(_("gg2B--B",!0)),L:()=>new m(_("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICCiEEBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoCaBFDBuBqBBkBBBCiDBCQQBIIBLLBBBDRRCdBe4CBMZZBfBKBBFGGBUBFKKEYYBXBIKBGXBCGBRpBB7B1BBETTIJBQPBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNGB7BBBCCCBDBCXBCCCBIBCBBKDDBDBCWWBCBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNSSBkBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBkBFFkC4CBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBzC+C+CBtBBSHB3BdBOBBLrBBbjBBqBCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBhC1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBF1B1BB8zC8zCBjHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBxC2O2OBrBrBBDBGBBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBReBDlCByBIBDmDBDxCBVQBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBdRRBDBCJBLEBCoBBYCBCHBVWBEEEBwBBCEEBDDBDBDCCZCBDKBICBNFBDFBDFBKGBCGBCqBBCNBHyDBej9KBNWBFwBBloItLBDpDBnBGBNEBGCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBxB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOjBBnBbBKWB7HpBBHBBRFB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB1D-BBgBHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBqBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBGjCjCBLBhCBBCPPBNNB0mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBn7F0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFBmI9BBzEsBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCCBCBBCGBDEBKBBhHGBCDBCBBCOBCkGB8BjCBI1lB1lBBCBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),LC:()=>new m(_("hCZBHZB7BLLBVBCeBCiGBCDBFvGBDZBhGDBDBBECBCHHCCBCCCBSBCyCBCqEBJlFBClBBKoBB44ClBBCGGDqBBDCBhV1CBDFBjkCKBGqBBDCBhCrBBgCMBChBBmD1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGBmIFFDJBCEEBDBHGCBCBCFBFDDBCBGEBF1B1BB8zC8zCB6DBDmDBHDBEBBNlBBCGGzoetBBTbBnEtCBCWBEDBCsCBZBBE2Z2ZBpBBGIBIvCBh6TGBNEBqgBZBHZBmlBvCBhDjBBFjBB1DKBCOBCGBCBBCKBCOBCGBCBBk2ByBBOyBB+CVBLVB74C-BBhrV-BBhBYBDYBtpZ0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BJBCTBHFB2uCjCB",!1)),Ll:()=>new m(_("hDZB7BqBqBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDZBiGCCEEEBBBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBDCB5XFBjkCIBC2D2DBqBBgCMBChBBnD0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBBzIEEBEEcKFDBBJDBF2B2Bs1CvBBCEEBGCFCCBCCBEBGiDCBIICFFNlBBCGG0oesBCUaCoEMCBBBC+BCBGBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCbEE2ZqBBGIBIvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFB4vChBB",!1)),Lm:()=>new m(_("wVRBFLBPEBICCmEGG-OnHnHlFBBuIBBFgBgBKEEhFoFoF1mBgEgE2R72B72BsDkTkTxOFBvF+BBOjBjBBjBByVOORMBg-CBByHgGgG2OsBsBBDBGiDiDB+C+CBBB34bjnBjnBBEBvIzDzDdBB6DIBxCYYpDDBEBB2OXXqEtDtDWBBoDDBKngVngVuBBBh-BFBCpBBCIB0sBhBhB2K04D04DnrTDB9PCBpBBBnRMBhCBBCPPB9-P9-PBCBCGBCBByhM9BBqGGBud0Q0QsSAB",!1)),Lo:()=>new m(_("qFQQhIFFBCBxGBB7ZaBFDBuBfBCJBkBBBCiDBCZZBLLBBBDRRCdBe4CBMZZBfBWVBrBYBIKBGXBCGBRoBB8B1BBETTIJBROBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNFB8BBBCCCBDBCXBCCCBIBCBBKDDBDBYDBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNyDyDBnKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPByDrTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBpBkCkCBhBBC0BBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBxFuBBSHB3BdBOBBLrBBbjBBqBCBLdByDDBCFBCBBE7hB7hBBCB4-C3BBZWBKGBCGBCGBCGBCGBCGBCGBCGBoR2B2BF1CBJCCB4CBFGGBpBBC9CBSfBxBPBhQ-tGBhC0wUBC2jBBkCnBBJrIBFPBLBBjCyByBBkCBqFoDoDEGBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBuBEBDIBLEBCoBBYCBCHBVPBCFBEEEBwBBCEEBDDBDBDCCZBBEKBIPPBEBDFBDFBKGBCGByEiBBej9KBNWBFwBBloItLBDpDBkCCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBqDJBCsBBDeBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBhEtCBjDnBBJzBB9CzBBN2JBKVBLHB5EFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4FjBBnBDBCxJxJBoBBHBBRCBCBB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB0GHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBnBBCBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBB0BUBGSB0NnBB2MqCBGwFwFB0mHBqBfBiDyDBuwIiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBxzI2P2PBrBBiBiKiKBcBTrBBlPaBmHdBDwGwGBdBCCBCBBCGBDEBKiHiHBFBCDBCBBCOBCkGB8pBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Lt:()=>new m(_("lOGDnB2sH2sHBGBJHBJHBNQQwBAB",!1)),Lu:()=>new m(_("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBG+B+B9zCvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBB",!1)),M:()=>new m(_("gYvDB0IGBoIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCgBB3BCBCRBCGBLBBeCB5BCCBFBDBBDCBKLLBbbDCB5BCCBDBFBBDCBEffBEEMCB5BCCBGBCCBCCBVBBXFBCCB5BCCBFBDBBDCBICBLBBf8B8BBDBECBCDBKpBpBBDB4BCCBFBCCBCDBIBBMBBeCB5BCCBFBCCBCDBIBBMBBQNNBCB4BBBCGBCCBCDBKLLBeeBBBnCFFBEBCCCBGBTBB+BDDBFBNHBjDDDBHBMGBqCBBcECFBByBTBCBBGKBCjBBKlDlDBSBYDBFCBCCBDGBEDBOLBCLLBCBgWCBzdDBdCBeBBfBBhCfBKuBuBBBBC2D2DBjBjB3DLBFLB8GEB6BJBCcBDxBxBBsBBDLBVEBwBQBnBIBNCBfMB5BNBxBTB5ECBCUBFHHDCBnG-BBxWgBB--CCBuEhDhDBeBrRFBqDBB1udDBCJBhBBBxCBBxIEEFYYBDBF0C0CBzBzBBQBbRBOnBnBBGBaMBtBDBwBNBlBkCkCBMBNJJBuBuBBBBzBCCBBBDBBGBBCqBqBBDBGBBtHHBCBBx5TiXiXBOBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB7DCB2BOBqBDDBLLBCBuBKBI+B+BBBBlBNBRBBtBNNBBBxBNBJDBCBB9CLBHDD+ELBWDB4BBBCGBDBBDCBKLLBDDBFBEEBkCIBCDDCDBCEBCPPBzCzCBQBYyCyCBSBsHGBDIBcBBzCQBrDMBmDOBhIOB2HFBCBBDDBCCCBuEuEBFBDGBEddBIBpBGBCDBJKKBJBvBPBnGHBoGHBCHBzCVBCNB7DFBECCBCCBFBCjCjCBDBCBBCEB8KDBKBBCxBxBBFBEEBYmnFmnFHOBpmLRBhuCEB8BGB5gBCCB1BBIDByCMMBslTslTBizEizEBsBBDWB-QEBEFBJHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),Mc:()=>new m(_("joC4B4BDCBJDBCBBzBBB7BCBHBBDBBLsBsB7BCBjC7B7BBBBJCCB2B2BB7B7BCHHBDDBLLnDBBCBBECBCCBLqBqBBBB+BDB+BBB7BCCBDBDBBCBBKBBdPPB7B7BBBBGCBCCBLrBrBBsCsCBBBHHBTBBrKBBgCsFsFBFFHDDBaaBLLBBBDGBWBBDFBDLLBBB5zBffiEIIBGBCBB7KDBDCBFBBCFBhHBB7BCCKCCBJJBEByExBxBGCCBDBCBB+BffFBBD9B9BDCBCEEBxBxBBGBJBBsFWW35EBB0-dBBD5C5CBzBzBBOBvEBBwBxBxBBFFBDDBBBvDBBDBBZuBuBCuDuDDBBGuHuHBCCBCCBCC0gZCCgEuBuBBBBFBB0DZZB8B8BxBCBKBBO+C+CBBBEBBCrFrFBBBgBBB7BBBCDBDBBDCBKLLB1C1CBBBIDDCDBCBBCmDmDBBBJBBErDrDBBBHCCBCBDuHuHBBBHDBDyDyDBBBJBBCuDuDCBBHoDoDCBBFmImIBBBK4H4HBEBCBBFDDCvEvEBBBJDBF1C1CeBB-BqGqGECCoGPPrDIID2G2GBDBFBBC-K-KBNNxBBBJBBCpvQpvQBBBlxD2BBpDBB0rYBBHFB",!1)),Me:()=>new m(_("okBBB1xF-wB-wBBCBCCBsshBCB",!1)),Mn:()=>new m(_("gYvDB0IEBqIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCfB4BCCFHBFEEBFBLBBe7B7BFDBJVVBbbDBB6BFFBFFBDDBBBEffBEEMBB6BFFBDBCBBFVVBXXBEBC7B7BDCCBCBJIIBMMBff+BNNzBEE4BCCBBBGCBCDBIBBMBBe7B7BDHHGBBVBBdBB6BBBFDBJVVBeepCIIBBBC7C7CDGBNHBjDDDBHBMGBqCBBcEC4BNBCEBCBBGKBCjBBKnDnDBCBCFBCBBDBBaBBFCBRDBODDBHHQgWgWBBBzdCBeBBfBBfBBhCBBCGBJDDBJBKuBuBBBBC2D2DBjBjB3DCBFBBKHHBBB8GBBD7B7BCGBCCCDHBHJBDxBxBBMBCeBDLBVDBxBCCBDBCGGpBIBNBBhBDBDBBCCB5BCCBEECCB7BHBDBB5ECBCMBCGBFHHEBBnG-BBxWMBFEEBKB--CCBuEhDhDBeBrRDBsDBB1udFFBIBhBBBxCBBxIEEFaaBGG4EBBbRBOnBnBBGBaKBvBCBxBDDBCBDBBoBkCkCBEBDBBDBBNJJwB0B0BCCBDBBGBBCrBrBBJJvHDDFx5Tx5TiXPBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB8D3B3BBNBqBDDBLLBBByBDBDBBI+B+BBBBlBEBCHB-BNNB1B1BBHBLDBDgDgDBBBDCCBHHD+E+EEHBWBB6BBBEmBmBBFBEEBnCFBOECPBB2CHBDCBCYY1CFBCFFBCCBvHvHBCBHBBCBBcBB2CHBDCCBrDrDCDDBEBCmDmDCDDBCBCEBkIIBCBBhIBBCFFxEDBDBBFhBhBBIBpBFBDDBJKKBEBDCBvBMBCBBnGCCBBBCqGqGBFBCFBCzCzCBUBDGBCBBCBB7DFBECCBCCBFBCpCpCBEEC8K8KBMMB1B1BBDBGCCYmnFmnFHOBpmLLBECBhuCEB8BGB5gBgCgCBCByC5lT5lTBizEizEBsBBDWBhRCBSHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),N:()=>new m(_("wBJB5DBBGDDBBBitBJBnEJBnGJB9MJB3DJBFFBtDJB3DJB3DJBDFBvDMB0DJBJGBoDJBpDGBISBuDJBhDJB3DJBnCTBtIJBnCJBwWTBybCBwHJBHJBXJBtJJBhEKBmFJBHJB3FJB3CJBnEJBHJB3gBEEBEBHJBnGyBBDEB3W7BBvCVB3TdBqrBqYqYaIBPCB4KDBrEJBfHBCOBhBJBoBOBh7cJB9FJBhKFB7EJBnBJBnGJBXJB3CJB3MJB34UJBuPsBBN4BBSBB2KaBlBDBeJJnEEBrGJBvdHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBxBJBHJB3IeB-EJBrBDBxDGBnEdBhEJB9BJBxEJBITB8HJB3KJB3DJB3LJBnDJBHTBtCLBlNSB+CJB3UJB3CcBkHJBnCJB3BJBnLJBnDUBshBuDBimPJBnpCJB3CJBnEJBCGBvQJBnIWB+KCB6nXJBnuBTBNTBtDYB2iBxBBhqCJBnNJB3PJB4HJBtWIBhEJB4Y6BBCCBCDBtCsBBCOBjeMBk3CJB",!1)),Nd:()=>new m(_("wBJnxBJnEJnGJ9MJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJhDJ3DJnCJ3IJnCJn6BJnBJtJJhEJnFJHJ3FJ3CJnEJHJnuiBJnVJnBJnGJXJ3CJ3MJ34UJnsBJnkCJHJ9YJhEJ9BJxEJ3IJ3KJ3DJ3LJnDJHTtCJnNJnDJ3UJ3CJ3HJnCJ3BJnLJ3uQJnpCJ3CJnEJ3QJ37XJ12CxBhqCJnNJ3PJ4HJ2aJ30EJ",!0)),Nl:()=>new m(_("u3FCBwzCiBBDDB-zDaaBHBPCBs1dJBxyW0BBtOJJnEEBrhIuDBm8SCB",!1)),No:()=>new m(_("yFBBGDDBBB2pCFB5LFB5DCBmEGB6GGBSIByNJB2hBTB0jBJBhP20B20BEFBHJBnGPBqB3W3WB6BBvCVB3TdBqrB1kB1kBBCBrEJBfHBCOBhBJBoBOBxrdFBymWsBBiCDBSBB2KaBlBDB1pBHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBhLeB-EJBrBDBxDGBnETB8LTBmqBBBvNIBobSB0aUBn8SGB-YWBqhZTBNTBtDYBvqFIBid6BBCCBCDBtCsBBCOBjeMB",!1)),P:()=>new m(_("hBCBCFBCDBLBBEBBbCBCccCkBkBGEELBBEEE-VJJzOFBqBBB0BCCDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCmBmBBCBoCrCrCBDBFBBwDFBsFlTlTBHB4EuTuTtBBBvCCBoCBB+ECBCCBmBKB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBM9Z9ZBWBJTBCMBCLBfBBPBB6TDBeBB+hBNBwCBBgBJB0MVBgCDBhBBB8XDBCBBxDwEwEBtBBCfBDLBkNCBFJBDLBRNNjD7C7CjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HzqUzqUBxGxGBIBXiBBCNBCFFCBB2ECBCFBCDBLBBEBBbCBCccCCCBFB7MCB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDByO-J-JjBlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Pc:()=>new m(_("-Cg-Hg-HBUU-u3BBBZCBwHAB",!1)),Pd:()=>new m(_("tB9qB9qB0BiyDiyDmgBqgCqgCBEBiwDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Pe:()=>new m(_("pB0B0BgB+1D+1DC-6B-6BqtC4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECtBGCtNICEGCDBB-ozB6G6GeOCESSCCCrF0B0BgBGD",!1)),Pf:()=>new m(_("7F+6H+6HEddpuDCCFDDQEE",!1)),Pi:()=>new m(_("rFt7Ht7HDBBDaapuDCCFDDQEE",!1)),Po:()=>new m(_("hBCBCCBDECBLLBEEBcclCGGPBBI-V-VJzOzOBEBqB3B3BDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCxDxDrCEBFBBwDFBsFlTlTBHBmY9D9DBBBoCBB+ECBCCBmBFBCDB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBMjajaBJJBGBJIBDDBDCBEKBCCCBIB7kDDBCBBxDwEwEBFFBBBDDDBHBCBBCDDBLLBDBCJBDDBCCCBLBDCBtNCB6B+F+FjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HlxUlxUBFBDXXVBBDDBECBCDBICBHCCB2E2EBBBCCBDECBLLBEEBcclBDDB7M7MBBB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDB0ZlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Ps:()=>new m(_("oBzBzBgB-1D-1DC-6B-6B-rCEEnB4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECaTTCECtNICEGCDipzBipzB4GeeCMCESSCCCrFzBzBgBEEDAB",!1)),S:()=>new m(_("kBHHRCBgBCCcCCkBEBCBBDCCBCBDEEfgBgBrODBNNBGGBCCCBPB2DPPBxDxDsErIrIBBB3DCBDDDBvGvGLUUB4H4HIBBpEqLqLBHHB2H2H-DjEjEBGBlEwGwGqBmGmGiGCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WuLuLlL+E+EBgBBiLJBKIBhiBCCBBBMCBOCBOCBOBBmCOOoBCBOCBUhBB-BBBCDBCBBLCCBBBGFBCECFMMBFFBDBGDBC7B7BBFFB2LBFcBD+HBXKByCtCBXnTBtBwBBDeBLyMBX+BBFfBD1LBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBB8CBB0HBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BB6RWBKBBoDBB+EDBLDB+RCBiHPPB+9T+9TpEgBBuLPBhCBB3BHBtBDBjDCCBBBD7E7EHRRBBBgBCCcCCiEGBCGBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSmWmWBiKiKBGBnjC2kC2kCBbBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQQBgDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBrbaagBaagBaagBaagBaa9B-PB4BDBzBHBCNBCBBp2BwNwNttCEE+DiOiOBvIvIBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Sc:()=>new m(_("kB+D+DBCBqnB8D8DzPBBzPBBI2H2HoImSmS8sClmClmCBgBB37hBkuVkuVtD7E7E8GBBEBB3-HDB-4wBxtCxtC",!1)),Sk:()=>new m(_("+CCCoCHHFEEqQDBNNBGGBCCCBPB2DPPBjoBjoB15FCCBBBMCBOCBOCBOBB9kEBBkzdWBKBBoDBBxePPBniUniUBPB8bCCjF4g9B4g9BBDB",!1)),Sm:()=>new m(_("rBRRBBB+BCCuBFFmBgBgB-XwQwQBBB8xGOOoBCBOCBsEoBoBBDBHlClCBDBGBBFGDIgBgBBDDCgBgBBqIBhBBB7CffBXBpBFB2OKK3BHBwDxKxKBDBDeBLPBhIiEBX+BBFfBDhIBxBUBDFB9+zB5Z5ZCCBlFRRBBB+BCCkEHHBCBitDBBhrwBx+Bx+BagBgBagBgBagBgBagBgBat5Ft5FB-uC-uCBHB",!1)),So:()=>new m(_("mFDDFCCyerIrIBgEgEBvGvGLUUB4H4HkQ2L2LjEFBClElEwGqBqBoMCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WzWzW+EhBBiLJBKIBksBBBCDBCBBLCCBHHBEBCECFMMBPPCBBC7B7BBKKBDBDDBCBBCBBCGBCeBDBBCCCBdBtIHBFTBDGBDwCBCdBanBBHnCBXKByCtCBX2FBCIBC1BBJuDBC3HBtBrBBhC-HBhQvBBWBBHmBBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBBxKBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BBibDBLBBC+R+RBBBqqUPBuLPBhCBB3BHBuBCBlPEEFBBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSpgBpgBBGBnjC2kC2kCBGBFQBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQPBhDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBqlB-PB4BDBzBHBCNBCBBp2B96C96CiEyWyWBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E6HBG4WBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBB-B3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Z:()=>new m(_("gBgEgEgvFgsCgsCBJBeBBGwBwBh9DAB",!1)),Zl:()=>new m(_("ohIA",!0)),Zp:()=>new m(_("phIA",!0)),Zs:()=>new m(_("gBgEgEgvFgsCgsCBJBlBwBwBh9DAB",!1)),ASCII_Hex_Digit:()=>new m(_("wBJIFbF",!0)),Alphabetic:()=>new m(_("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICC3CeeBQBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoBNBCCCBCCBCCJaBFDBeKBG3BBCGBPlDBCHBFHBFCBLCBDRRBuBBOkDBZgBBKBBFGGBWBDSBUYBIKBGXBCGBIJJBoBBLLBEGBHrCBCPBCCBFOBOSBCHBDBBDVBCGBCEEBCBEHBDBBDBBCJJFBBCEBNBBLFFBBBCFBFBBDVBCGBCBBCBBCBBFEBFBBDBBFIIBCBCSSBEBMCBCIBCCBCVBCGBCBBCEBEIBCCBCBBEQQBCBWDBFCBCHBDBBDVBCGBCBBCEBEHBDBBDBBKBBFBBCEBORRBCCBEBECBCDBEBBCCCBEEBEEBBBELBFEBECBCCBEHHpBMBCCBCWBCPBEHBCCBCCBJBBCCBCBBDDBdDBCHBCCBCWBCJBCEBEHBCCBCCBJBBGCBCDBOCBNMBCCBCoBBDHBCCBCCBCGGBCBIEBXFBCCBCRBEXBCIBCDDBFBJFBCCCBGBTBBO5BBGGBH0B0BBECBDBCXBCCCBRBCCBDEBCHHPDBhBgCgCBGBCjBBFSBFPBCjBBkC2BBCDDBDBR-BBLDBDlBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBEKBITBMUBNTBNMBCCBCBBNzBBDSBPFFkC4CBIqBBGlCBLeBCLBFIBYdBDEBMrBBFZB3BbBF+BBDTBzBYYBMMBBByBzBBCOBCHB0BpBBDDBLrBBCKBP2BBXCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBUhBBM1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBFSSBnBBuZzBB34BkHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBCfBwB2O2OBBBaIBIEBDEBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBGHBEwDBoBIBDmDBDxCBVUBCgBBZzBBNjCBCtBtBBEBECCBBBLgBBGiBBOcBEyBBCLBQRRBOBLEBC2BBKNBTWBEkCBCCCZCBDPBDDBMFBDFBDFBKGBCGBCqBBCNBH6DBWj9KBNWBFwBBloItLBDpDBnBGBNEBGLBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmC0BBsIcBEwBBwBfBOdBGqBBGdBDjBBFHBCEBrB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCDBCBBGHBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOnBBjBbBEGGBVB7HpBBCBBEBBRFBzBCBEcBLJJBUBrBRBvBUBcWBKlCBsBEBL4BBKOOBXBYyBBSDBJiBBEKKB+BBCDBKBBLCCkBRBChBBDHHBCB-BGBCCCBCBCOBCJBI4BBYDBCHBDBBDVBCGBCBBCEBEHBDBBDBBEHHGGBdJBCDDClBBCJBCDDCDBCBBECCtBhCBCCBCDBVCBfhCBDBBC5F5FB0BBDGBaFBjB+BBCEE8B1BBDoCoCBZBDNBWGB6F4BBoD-BBgBHBDDDBGBCBBCdBCBBDBBDDB+CHBDtBBDFBCCCBccBxBBDJBSnCBGTTBnCBoDHB5CgBBgBIBCsBBCGBCyByBBcBDVBCNBqCGBCBBCrBBECCBCCBBBCDDBZZBEBCBBCkBBCBBCDBCYYBqBBlIWBKQBCoBBECBwDwCwCB4cBnDuDBSjGBtyCgDBQvhBBSFBa68DBGmSB61GuBBy2B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBF4BBIQBhCBBCNNBFBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBFi7Fi7FBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCVBJBBhHGBCDBCBBCOBCkGB8BjCBEEE1lBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1TZBHZBHZB3zD-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Dash:()=>new m(_("tB9qB9qB0BiyDiyDmgBqgCqgCBEB+BoBoBQnMnMlgDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Emoji:()=>new m(_("jBHHGJBwDFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDrGrGhFBBNBBPDDBIBsCZBCBBYVVDIBWBBvFhBBDvDBDBBCCBDyCBDCBCmIBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDDBEJBECCBEEDJBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Emoji_Component:()=>new m(_("jBHHGJB0+H2G2Gsp3B3+8B3+8BBYB8PEBxtBDBtzhY-CB",!1)),Emoji_Modifier:()=>new m(_("7-8DE",!0)),Emoji_Modifier_Base:()=>new m(_("9wJ8G8GRDB4jzD9B9BBBBDDDBBB2DBBDKBWSBEFFBBBCCBICCZqGqGBFFWFFBvFvFBBBEEB0CRRBBBKMMgSDDJHBHKKBIBDCB5B+B+BBCCBCCSCBCMBmHCBrBIB",!1)),Emoji_Presentation:()=>new m(_("64IBBuGDBEDDqQBBWBBzBLBsBUUOJJBSSBGGBJJGWWIBBCFFDIIFBBdkBkBCFFBBBC+B+BBBBZPP8aBB0BFFvlxDrGrG-FDDBIBsCZBCZZVDDBDBCCBWBBvFgBBNIBClCBCVBNqBBFEBNQBEEEBlCBCCCB5FBD+BBODBCXBTbbBOO3C0CBxBlCBHEEBBBDDBEDBMBBIIBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Extended_Pictographic:()=>new m(_("pFFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDoBoBBCBlDLBQBBQPPBmBmBBIBxDBBNBBPDDBIBU3BBcOBLVVDIBCDBKWBH7FBDvDBDBBCCBDyCBDCBCDBG9HBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDQBECCBEBDMB7GlBBNDB5BHBLFBpBHBfBBNDBDNBKmBBNuBBCJBC4FB5CHBPxEBhI9fB",!1)),Hex_Digit:()=>new m(_("wBJIFbFq1-BJIFbF",!0)),Lowercase:()=>new m(_("hDZBwBLLFlBlBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDiBBIBBfEBhDsBsBCEEDDBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBCDB5XFBjkCIBC2D2DB+FBiC0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBB6DOORMBuDEEBEEcKFDBBJDBFiBiBBOBFsasaBYBn6BvBBCEEBGCFCCBCCBGBEiDCBIICFFNlBBCGG0oesBCUaCBBBmEMCBBBC8BCBIBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCWDBCCCBBB2ZqBBCNBHvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBkODDBBBCpBBCIBmoByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFBmI9BB1lChBB",!1)),Math:()=>new m(_("rBRRBBBgBeeCuBuBFmBmBgB5W5WBBBDbbBDDBBBwQCBuwGccBBBMEEOPPBCBWEBMEBiCMBFEEBFFBDBTFFDJBCDDBEBHEEBDDBCCBBBCFBENBClClCBWBCFBCBBFBBFfBCHHBPPBqIBJDBVBB7CffBZBCZZMGB+NBBNJBFFBFBBDBBEEBPCCDFBMHBGBB6BCCeDBKCBxK-BBhI-PBxBUBDFB9+zB4Z4ZBEBCjFjFRCBeCCeCCkEHHBCBitDBBhrwBwoBwoBBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBBhwFDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB-uCIB",!1)),Quotation_Mark:()=>new m(_("iBFFkEQQ96HHBaBBowDqOqOBCBOCBixzBDB+FFF7CBB",!1)),Terminal_Punctuation:()=>new m(_("hBLLCMMBEE-ZJJiQ6B6BpCPPCCB1FsBsBBJBCsHsHB3B3BBEBCHBgBmImIB1nB1nBBtFtFFFB4JBB2YHBmY9D9DBBBoCBB+ECBEoBoBBCBDBB7JBBjLDBjFBBLBBCCBeCB8FEB-BBBldYYBKKBBBwlDCBzJOOFLLCBBEBBtNBB8ndBBuICBkHEB-LBB3CBBgD4E4EBBB0ECBgERRB6H6HnxUDDB6B6BBBBCDBqFLLCMMBEEiCDD7hBxBxBnkBoGoG3JBB5EFBlCFB6CDB5dEBtBDB+FGBxDDBgECBiEBBHRRB5C5CBDBtDrJrJB2D2DBBBNBBnLDBEOBqDBB6HCBmQCC8HBB4CBBFBB-MCBuBmUmUBrCrCBspBspBBDB6vRBBmEiCiCBBBLqRqRBoJoJBnwTnwTovHDB",!1)),Uppercase:()=>new m(_("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBGbbBOBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBBvgCZBHZBHZB",!1)),White_Space:()=>new m(_("JEBTlDlDbgvFgvFgsCKBeBBGwBwBh9DAB",!1))})),j(gr,"SCRIPTS",new Ac({Adlam:()=>new m(_("go6DrCFJFB",!0)),Ahom:()=>new m(_("g4lCaDOFW",!0)),Anatolian_Hieroglyphs:()=>new m(_("ggxCmS",!0)),Arabic:()=>new m(_("gwBEBCFBCNBCCBCfBCJBMZBCrDBChBBxCvBBxHhBBGqCBCcBxy8BtPBDvEBhBPBxDEBCmEBk7DeBkCFBJIBiBFBh43BDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB",!1)),Armenian:()=>new m(_("xpBlBDxBDCks9BE",!0)),Avestan:()=>new m(_("g4iC1BEG",!0)),Balinese:()=>new m(_("g4GsCCxB",!0)),Bamum:()=>new m(_("g1pB3CpowB4R",!0)),Bassa_Vah:()=>new m(_("w26CdDF",!0)),Batak:()=>new m(_("g+GzBJD",!0)),Bengali:()=>new m(_("gsCDBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYB",!1)),Beria_Erfe:()=>new m(_("g17CYDY",!0)),Bhaiksuki:()=>new m(_("ggnCICsBCNLc",!0)),Bopomofo:()=>new m(_("qXB6wLqBxDf",!0)),Brahmi:()=>new m(_("ggkCtCFjBKA",!0)),Braille:()=>new m(_("ggK-H",!0)),Buginese:()=>new m(_("gwGbDB",!0)),Buhid:()=>new m(_("g6FT",!0)),Canadian_Aboriginal:()=>new m(_("ggF-TxRlC7tgCP",!0)),Carian:()=>new m(_("g1gCwB",!0)),Caucasian_Albanian:()=>new m(_("wphCzBMA",!0)),Chakma:()=>new m(_("gokC0BCR",!0)),Cham:()=>new m(_("gwqB2BKNDJDD",!0)),Cherokee:()=>new m(_("g9E1CDFz7lBvC",!0)),Chorasmian:()=>new m(_("w9jCb",!0)),Common:()=>new m(_("AgCBbFBbuBBCOBCEBYgBgBiOmBBGEBDTB1DKKHCC+THHPEEhB9E9ElQiEiEB6mB6mB2MDBjJwvBwvBBBBoCBBsGBBCumBumBOIIBCBCFBCCBDmYmYBKBD2CBCKBEKBCOBShBB-BlBBCCBDFBCaBCQBqBCBF5UBXKBW-cBhIzTBDpEBhQ9CBzMUBCCCBXBQHBFDB8CBBE7C7CB0E0EBOBhBlBBKxBxBB+BBgBwCBwB5C5CBmFBhuG-BBhoWhBBnDCBmFJB1HhFhFsMPPBzuUzuUBxGxGBIBXiBBCSBCDB0ECCBeBbFBbKBLuBuBBhChCBFBCGBLEBjICBFsBBEIBxCMB0BsBBlHaBltuBDB96D8HBEzNBHWBQQBgDzDB9B1HBLmBBD9BBEQBJBBIdBF8BB2GTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBByjFjCBtC8BBjWrBBFjDBNOBDOBCOBCkBBLtFB5BZBCBBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBnghYffB+CB",!1)),Coptic:()=>new m(_("ifNxkKzDGG",!0)),Cuneiform:()=>new m(_("ggoC5cnDuDCEMjG",!0)),Cypriot:()=>new m(_("ggiCFBDCCBqBBCBBEDD",!1)),Cypro_Minoan:()=>new m(_("w8rCiD",!0)),Cyrillic:()=>new m(_("ggBkEBDoFBx6FKBhFtCtCojEfBhie-CBv8VBBhw4B9BBiBAB",!1)),Deseret:()=>new m(_("gghCvC",!0)),Devanagari:()=>new m(_("goCwCFODZh7nBfhwcJ",!0)),Dives_Akuru:()=>new m(_("gomCGBDDDBGBCBBCdBCBBDLBKJB",!1)),Dogra:()=>new m(_("ggmC7B",!0)),Duployan:()=>new m(_("ggvDqDGMEIIJDD",!0)),Egyptian_Hieroglyphs:()=>new m(_("ggsC1iBL68D",!0)),Elbasan:()=>new m(_("gohCnB",!0)),Elymaic:()=>new m(_("g-jCW",!0)),Ethiopic:()=>new m(_("gwEoCBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBnvGWBKGBCGBCGBCGBCGBCGBCGBCGBjpfFBDFBDFBKGBCGBylvCGBCDBCBBCOB",!1)),Garay:()=>new m(_("gqjClBEcJB",!0)),Georgian:()=>new m(_("glElBBCGGDqBBCDBx8CqBBDCBhiElBBCGG",!1)),Glagolitic:()=>new m(_("ggL-Ch9sDGCQDGCBCE",!0)),Gothic:()=>new m(_("w5gCa",!0)),Grantha:()=>new m(_("g4kCDBCHBDBBDVBCGBCBBCEBDIBDBBDCBDHHGGBDGBEEB",!1)),Greek:()=>new m(_("wbDBCCBDDBCFFCCCBBBCCCBSBC+BBPPBnpGEBzBEBFEB1ChKhKBUBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBoJ-xiB-xiB7uVuCBSgj0Bgj0BBkCB",!1)),Gujarati:()=>new m(_("h0CCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGB",!1)),Gunjala_Gondi:()=>new m(_("grnCFCBCkBCBCFIJ",!0)),Gurmukhi:()=>new m(_("hwCCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPB",!1)),Gurung_Khema:()=>new m(_("go4C5B",!0)),Han:()=>new m(_("g0LZBC4CBN1GBwBCCaIBPDBle-tGBhC-vUBhoWtLBDpDBpodBBNGBqgkB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Hangul:()=>new m(_("goE-HvxHBiI9CyDeiCei3dckUj9KNWFwBl9JeEFDFDFDC",!0)),Hanifi_Rohingya:()=>new m(_("gojCnBJJ",!0)),Hanunoo:()=>new m(_("g5FU",!0)),Hatran:()=>new m(_("gniCSCBGE",!0)),Hebrew:()=>new m(_("xsB2BBJaBFFBpp9BZBCEBCCCBCCBCCBIB",!1)),Hiragana:()=>new m(_("hiM1CBHCBi7-C+IBTeeBBBulQAB",!1)),Imperial_Aramaic:()=>new m(_("giiCVCI",!0)),Inherited:()=>new m(_("gYvDB2IBBlOKBbhXhXBCB8qEtBBDLBlPCBCMBCGBFHHEBBnG-BBtQBBjGgBB65DDBsDBBmrzBPBRNBwejHjH7iEl+uBl+uBBsBBDWBhRCBSHBDGBfDBz6rYvHB",!1)),Inscriptional_Pahlavi:()=>new m(_("g7iCSGH",!0)),Inscriptional_Parthian:()=>new m(_("g6iCVDH",!0)),Javanese:()=>new m(_("gsqBtCDJFB",!0)),Kaithi:()=>new m(_("gkkCiCLA",!0)),Kannada:()=>new m(_("gkDMCCCWCJCEDICCCDIBGCCDDJCC",!0)),Katakana:()=>new m(_("hlM5CBDCBxHPBxGuBBC3CBvgzBJBCsBBzisBDBCGBCBBCgJgJBBBzBPPBCB",!1)),Kawi:()=>new m(_("g4nCQCoBEc",!0)),Kayah_Li:()=>new m(_("goqBtBCA",!0)),Kharoshthi:()=>new m(_("gwiCDCBGHCCCcDCFJII",!0)),Khitan_Small_Script:()=>new m(_("k-7C84G84GB0OBqBAB",!1)),Khmer:()=>new m(_("g8F9CDJHJnPf",!0)),Khojki:()=>new m(_("gwkCRCuB",!0)),Khudawadi:()=>new m(_("w1kC6BGJ",!0)),Kirat_Rai:()=>new m(_("gq7C5B",!0)),Lao:()=>new m(_("h0DBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDB",!1)),Latin:()=>new m(_("hCZBHZBwBQQGWBCeBCgOBoBEB8wGlBBHwBBGDBGMBClCBiC-HByLOORMBuEBBHccSoBB42CfBj1elDBExCBVOBxZqBBCIBCDB38TGB7gBZBHZBmhCFBCpBBCIBm61BeBHFB",!1)),Lepcha:()=>new m(_("ggH3BEOEC",!0)),Limbu:()=>new m(_("goGeBCLBFLBFEEBKB",!1)),Linear_A:()=>new m(_("gwhC2JKVLH",!0)),Linear_B:()=>new m(_("gggCLCZCSCBCODNjB6D",!0)),Lisu:()=>new m(_("wmpBvBx1eA",!0)),Lycian:()=>new m(_("g0gCc",!0)),Lydian:()=>new m(_("gpiCZGA",!0)),Mahajani:()=>new m(_("wqkCmB",!0)),Makasar:()=>new m(_("g3nCY",!0)),Malayalam:()=>new m(_("goDMCCCyBCCCFFPDZ",!0)),Mandaic:()=>new m(_("giCbDA",!0)),Manichaean:()=>new m(_("g2iCmBFL",!0)),Marchen:()=>new m(_("wjnCfDVCN",!0)),Masaram_Gondi:()=>new m(_("gonCGBCBBCrBBECCBCCBHBJJB",!1)),Medefaidrin:()=>new m(_("gy7C6C",!0)),Meetei_Mayek:()=>new m(_("g3qBWqGtBDJ",!0)),Mende_Kikakui:()=>new m(_("gg6DkGDP",!0)),Meroitic_Cursive:()=>new m(_("gtiCXFTDtB",!0)),Meroitic_Hieroglyphs:()=>new m(_("gsiCf",!0)),Miao:()=>new m(_("g47CqCF4BIQ",!0)),Modi:()=>new m(_("gwlCkCMJ",!0)),Mongolian:()=>new m(_("ggGBBDCCBSBH4CBIqBB2t-BMB",!1)),Mro:()=>new m(_("gy6CeCJFB",!0)),Multani:()=>new m(_("g0kCGBCCCBCBCOBCKB",!1)),Myanmar:()=>new m(_("ggE-EhqmBeiDfxibT",!0)),Nabataean:()=>new m(_("gkiCeJI",!0)),Nag_Mundari:()=>new m(_("wm5DpB",!0)),Nandinagari:()=>new m(_("gtmCHDtBDK",!0)),New_Tai_Lue:()=>new m(_("gsGrBFZHKEB",!0)),Newa:()=>new m(_("gglC7CCE",!0)),Nko:()=>new m(_("g+B6BDC",!0)),Nushu:()=>new m(_("h-7CvsQvsQBqMB",!1)),Nyiakeng_Puachue_Hmong:()=>new m(_("go4DsBENDJFB",!0)),Ogham:()=>new m(_("g0Fc",!0)),Ol_Chiki:()=>new m(_("wiHvB",!0)),Ol_Onal:()=>new m(_("wu5DqBFA",!0)),Old_Hungarian:()=>new m(_("gkjCyBOyBIF",!0)),Old_Italic:()=>new m(_("g4gCjBKC",!0)),Old_North_Arabian:()=>new m(_("g0iCf",!0)),Old_Permic:()=>new m(_("w6gCqB",!0)),Old_Persian:()=>new m(_("g9gCjBFN",!0)),Old_Sogdian:()=>new m(_("g4jCnB",!0)),Old_South_Arabian:()=>new m(_("gziCf",!0)),Old_Turkic:()=>new m(_("ggjCoC",!0)),Old_Uyghur:()=>new m(_("w7jCZ",!0)),Oriya:()=>new m(_("h4CCCHDBDVCGCBCEDIDBDCICFBCEDR",!0)),Osage:()=>new m(_("wlhCjBFjB",!0)),Osmanya:()=>new m(_("gkhCdDJ",!0)),Pahawh_Hmong:()=>new m(_("g46ClCLJCGCUGS",!0)),Palmyrene:()=>new m(_("gjiCf",!0)),Pau_Cin_Hau:()=>new m(_("g2mC4B",!0)),Phags_Pa:()=>new m(_("giqB3B",!0)),Phoenician:()=>new m(_("goiCbEA",!0)),Psalter_Pahlavi:()=>new m(_("g8iCRIDNG",!0)),Rejang:()=>new m(_("wpqBjBMA",!0)),Runic:()=>new m(_("g1FqCEK",!0)),Samaritan:()=>new m(_("ggCtBDO",!0)),Saurashtra:()=>new m(_("gkqBlCJL",!0)),Sharada:()=>new m(_("gskC-ChsCH",!0)),Shavian:()=>new m(_("wihCvB",!0)),Siddham:()=>new m(_("gslC1BDlB",!0)),Sidetic:()=>new m(_("gqiCZ",!0)),SignWriting:()=>new m(_("gg2DrUQECO",!0)),Sinhala:()=>new m(_("hsDCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBt-gCTB",!1)),Sogdian:()=>new m(_("w5jCpB",!0)),Sora_Sompeng:()=>new m(_("wmkCYIJ",!0)),Soyombo:()=>new m(_("wymCyC",!0)),Sundanese:()=>new m(_("g8G-BhIH",!0)),Sunuwar:()=>new m(_("g+mChBPJ",!0)),Syloti_Nagri:()=>new m(_("ggqBsB",!0)),Syriac:()=>new m(_("g4BNC7BDCxIK",!0)),Tagalog:()=>new m(_("g4FVKA",!0)),Tagbanwa:()=>new m(_("g7FMCCCB",!0)),Tai_Le:()=>new m(_("wqGdDE",!0)),Tai_Tham:()=>new m(_("gxG+BCcDKHJHN",!0)),Tai_Viet:()=>new m(_("g0qBiCZE",!0)),Tai_Yo:()=>new m(_("g25DeCVJB",!0)),Takri:()=>new m(_("g0lC5BHJ",!0)),Tamil:()=>new m(_("i8CBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBm+kCxBBOAB",!1)),Tangsa:()=>new m(_("wz6CuCCJ",!0)),Tangut:()=>new m(_("g-7CgBgBB+3GBhQeBiDyDB",!1)),Telugu:()=>new m(_("ggDMCCCWCPDICCCDIBCCCBDDDJII",!0)),Thaana:()=>new m(_("g8BxB",!0)),Thai:()=>new m(_("hwD5BGb",!0)),Tibetan:()=>new m(_("g4DnCCjBFmBCjBCOCGFB",!0)),Tifinagh:()=>new m(_("wpL3BIBPA",!0)),Tirhuta:()=>new m(_("gklCnCJJ",!0)),Todhri:()=>new m(_("guhCzB",!0)),Tolong_Siki:()=>new m(_("wtnCrBFJ",!0)),Toto:()=>new m(_("w04De",!0)),Tulu_Tigalari:()=>new m(_("g8kCJBCDDClBBCJBCDDCDBCJBCBBJBB",!1)),Ugaritic:()=>new m(_("g8gCdCA",!0)),Unknown:()=>new m(_("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-FB",!1)),Vai:()=>new m(_("gopBrJ",!0)),Vithkuqi:()=>new m(_("wrhCKCOCGCBCKCOCGCB",!0)),Wancho:()=>new m(_("g24D5BGA",!0)),Warang_Citi:()=>new m(_("glmCyCNA",!0)),Yezidi:()=>new m(_("g0jCpBCCDB",!0)),Yi:()=>new m(_("ggoBskBE2B",!0)),Zanabazar_Square:()=>new m(_("gwmCnC",!0))})),j(gr,"FOLD_CATEGORIES",new Ac({L:()=>new m(_("laA",!0)),LC:()=>new m(_("laA",!0)),Ll:()=>new m(_("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGC3HrBrBCEEJHHCCBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHxC9zC9zCBuBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Lt:()=>new m(_("kOCCBCCBCClBCCtsHHBJHBJHBMQQwBAB",!1)),Lu:()=>new m(_("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpL2B2Bs1CvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1)),M:()=>new m(_("5cgBgBlgHAB",!1)),Mn:()=>new m(_("5cgBgBlgHAB",!1)),Emoji:()=>new m(_("8mJA",!0)),Extended_Pictographic:()=>new m(_("8mJA",!0)),Lowercase:()=>new m(_("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHuBPBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Math:()=>new m(_("ycGDCHHFMMDDDCHHFAB",!1)),Uppercase:()=>new m(_("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpLiBiBBOBFsasaBYBn6BvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1))})),j(gr,"FOLD_SCRIPT",new Ac({Common:()=>new m(_("8cgBgB",!1)),Greek:()=>new m(_("1FwUwU",!1)),Inherited:()=>new m(_("5cgBgBlgHAB",!1))})),gr),ve,X=(ve=class{static is32(e,t){let n=0,s=e.length;for(;n<s;){const i=n+Math.floor((s-n)/2),o=e.getLo(i),a=e.getHi(i);if(o<=t&&t<=a){const c=e.getStride(i);return(t-o)%c===0}t<o?s=i:n=i+1}return!1}static is(e,t){if(t<=ve.MAX_LATIN1){for(let n=0;n<e.length;n++){if(t>e.getHi(n))continue;const s=e.getLo(n);if(t<s)return!1;const i=e.getStride(n);return(t-s)%i===0}return!1}return e.length>0&&t>=e.getLo(0)&&ve.is32(e,t)}static isUpper(e){if(e<=ve.MAX_LATIN1){const t=String.fromCodePoint(e);return t.toUpperCase()===t&&t.toLowerCase()!==t}return ve.is(Ft.Upper,e)}static isPrint(e){return e<=ve.MAX_LATIN1?e>=32&&e<ve.MAX_ASCII||e>=161&&e!==173:ve.is(Ft.Print,e)}static simpleFold(e){if(Ft.CASE_ORBIT.has(e))return Ft.CASE_ORBIT.get(e);const t=L.toLowerCase(e);return t!==e?t:L.toUpperCase(e)}static equalsIgnoreCase(e,t){if(e===t)return!0;if(e<0||t<0)return!1;if(e<=ve.MAX_ASCII&&t<=ve.MAX_ASCII)return 65<=e&&e<=90&&(e|=32),65<=t&&t<=90&&(t|=32),e===t;for(let n=ve.simpleFold(e);n!==e;n=ve.simpleFold(n))if(n===t)return!0;return!1}},j(ve,"MAX_RUNE",1114111),j(ve,"MAX_ASCII",127),j(ve,"MAX_LATIN1",255),j(ve,"MAX_BMP",65535),j(ve,"MIN_FOLD",65),j(ve,"MAX_FOLD",125251),j(ve,"MIN_HIGH_SURROGATE",55296),j(ve,"MAX_HIGH_SURROGATE",56319),j(ve,"MIN_LOW_SURROGATE",56320),j(ve,"MAX_LOW_SURROGATE",57343),j(ve,"MIN_SUPPLEMENTARY_CODE_POINT",65536),ve);const xh=256,w_=new Uint8Array(xh);for(let r=0;r<xh;r++)w_[r]=97<=r&&r<=122||65<=r&&r<=90||48<=r&&r<=57||r===95?1:0;let eB=null,tB=null;var Oe,ee=(Oe=class{static emptyInts(){return[]}static isByteArray(e){return Array.isArray(e)||e instanceof Uint8Array}static isalnum(e){return L.CODES.get("0")<=e&&e<=L.CODES.get("9")||L.CODES.get("a")<=e&&e<=L.CODES.get("z")||L.CODES.get("A")<=e&&e<=L.CODES.get("Z")}static unhex(e){return L.CODES.get("0")<=e&&e<=L.CODES.get("9")?e-L.CODES.get("0"):L.CODES.get("a")<=e&&e<=L.CODES.get("f")?e-L.CODES.get("a")+10:L.CODES.get("A")<=e&&e<=L.CODES.get("F")?e-L.CODES.get("A")+10:-1}static escapeRune(e){let t="";if(X.isPrint(e))Oe.METACHARACTERS.indexOf(String.fromCodePoint(e))>=0&&(t+="\\"),t+=String.fromCodePoint(e);else switch(e){case L.CODES.get('"'):t+='\\"';break;case L.CODES.get("\\"):t+="\\\\";break;case L.CODES.get("	"):t+="\\t";break;case L.CODES.get(`
`):t+="\\n";break;case L.CODES.get("\r"):t+="\\r";break;case L.CODES.get("\b"):t+="\\b";break;case L.CODES.get("\f"):t+="\\f";break;default:{let n=e.toString(16);e<256?(t+="\\x",n.length===1&&(t+="0"),t+=n):t+=`\\x{${n}}`;break}}return t}static stringToRunes(e){const t=String(e),n=[];let s=0;for(;s<t.length;){const i=t.codePointAt(s);n.push(i),s+=i>X.MAX_BMP?2:1}return n}static runeToString(e){return String.fromCodePoint(e)}static isWordRune(e){return e<xh?w_[e]===1:!1}static emptyOpContext(e,t){let n=0;return e<0&&(n|=Oe.EMPTY_BEGIN_TEXT|Oe.EMPTY_BEGIN_LINE),e===10&&(n|=Oe.EMPTY_BEGIN_LINE),t<0&&(n|=Oe.EMPTY_END_TEXT|Oe.EMPTY_END_LINE),t===10&&(n|=Oe.EMPTY_END_LINE),Oe.isWordRune(e)!==Oe.isWordRune(t)?n|=Oe.EMPTY_WORD_BOUNDARY:n|=Oe.EMPTY_NO_WORD_BOUNDARY,n}static quoteMeta(e){return e.split("").map(t=>Oe.METACHARACTERS.indexOf(t)>=0?`\\${t}`:t).join("")}static charCount(e){return e>X.MAX_BMP?2:1}static toArray(e){const t=e.length,n=new Array(t);for(let s=0;s<t;s++)n[s]=e[s];return n}static stringToUtf8ByteArray(e){if(globalThis.TextEncoder)return eB||(eB=new TextEncoder),eB.encode(e);{let t=[],n=0;for(let s=0;s<e.length;s++){let i=e.charCodeAt(s);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===X.MIN_HIGH_SURROGATE&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===X.MIN_LOW_SURROGATE?(i=X.MIN_SUPPLEMENTARY_CODE_POINT+((i&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t}}static utf8ByteArrayToString(e){if(globalThis.TextDecoder){tB||(tB=new TextDecoder("utf-8"));const t=e instanceof Uint8Array?e:new Uint8Array(e);return tB.decode(t)}else{let t=[],n=0,s=0;for(;n<e.length;){let i=e[n++];if(i<128)t[s++]=String.fromCharCode(i);else if(i>191&&i<224){let o=e[n++];t[s++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){let o=e[n++],a=e[n++],c=e[n++],l=((i&7)<<18|(o&63)<<12|(a&63)<<6|c&63)-X.MIN_SUPPLEMENTARY_CODE_POINT;t[s++]=String.fromCharCode(X.MIN_HIGH_SURROGATE+(l>>10)),t[s++]=String.fromCharCode(X.MIN_LOW_SURROGATE+(l&1023))}else{let o=e[n++],a=e[n++];t[s++]=String.fromCharCode((i&15)<<12|(o&63)<<6|a&63)}}return t.join("")}}},j(Oe,"METACHARACTERS","\\.+*?()|[]{}^$"),j(Oe,"EMPTY_BEGIN_LINE",1),j(Oe,"EMPTY_END_LINE",2),j(Oe,"EMPTY_BEGIN_TEXT",4),j(Oe,"EMPTY_END_TEXT",8),j(Oe,"EMPTY_WORD_BOUNDARY",16),j(Oe,"EMPTY_NO_WORD_BOUNDARY",32),j(Oe,"EMPTY_ALL",-1),Oe);const D_=(r=[],e=0)=>{const t=Object.create(null);for(let n=0;n<r.length;n++){const s=r[n],i=e+n;t[s]=i,t[i]=s}return Object.freeze(t)};var wr,bs=(wr=class{getEncoding(){throw Error("not implemented")}asCharSequence(){throw Error("not implemented")}asBytes(){throw Error("not implemented")}length(){throw Error("not implemented")}isUTF8Encoding(){return this.getEncoding()===wr.Encoding.UTF_8}isUTF16Encoding(){return this.getEncoding()===wr.Encoding.UTF_16}},j(wr,"Encoding",D_(["UTF_16","UTF_8"])),wr),Wp=class extends bs{constructor(r=null){super(),this.bytes=r}getEncoding(){return bs.Encoding.UTF_8}asCharSequence(){return ee.utf8ByteArrayToString(this.bytes)}asBytes(){return this.bytes}length(){return this.bytes.length}},cb=class extends bs{constructor(r=null){super(),this.charSequence=r}getEncoding(){return bs.Encoding.UTF_16}asCharSequence(){return this.charSequence}asBytes(){return ee.stringToUtf8ByteArray(this.charSequence.toString())}length(){return this.charSequence.length}},fs=class{static utf16(r){return new cb(r)}static utf8(r){return ee.isByteArray(r)?new Wp(r):new Wp(ee.stringToUtf8ByteArray(r))}},Rt=class{static EOF(){return-8}constructor(){this.end=0}canCheckPrefix(){return!0}endPos(){return this.end}hasString(){return!1}hasAnyString(){return!1}prefixLength(){return 0}},ub=class extends Rt{constructor(r,e=0,t=r.length){super(),this.bytes=r,this.start=e,this.end=t}hasString(r,e){const t=r.bytes;if(t.length===0)return!0;const n=this.indexOf(this.bytes,t,this.start+e);return n!==-1&&n<=this.end-t.length}hasAnyString(r,e){return r.ac8?r.ac8.searchUTF8(this.bytes,this.start+e,this.end):!1}step(r){if(r+=this.start,r>=this.end)return Rt.EOF();const e=this.bytes[r]&255;if(e<128)return e<<3|1;if(e>=194&&e<=223&&r+1<this.end){const t=this.bytes[r+1]&255;return(t&192)!==128?e<<3|1:((e&31)<<6|t&63)<<3|2}else if(e>=224&&e<=239&&r+2<this.end){const t=this.bytes[r+1]&255;if((t&192)!==128)return e<<3|1;const n=this.bytes[r+2]&255;return(n&192)!==128?e<<3|1:((e&15)<<12|(t&63)<<6|n&63)<<3|3}else if(e>=240&&e<=244&&r+3<this.end){const t=this.bytes[r+1]&255;if((t&192)!==128)return e<<3|1;const n=this.bytes[r+2]&255;if((n&192)!==128)return e<<3|1;const s=this.bytes[r+3]&255;return(s&192)!==128?e<<3|1:((e&7)<<18|(t&63)<<12|(n&63)<<6|s&63)<<3|4}else return e<<3|1}index(r,e){e+=this.start;const t=this.indexOf(this.bytes,r.prefixUTF8,e);return t<0?t:t-e}context(r){r+=this.start;let e=-1;if(r>this.start&&r<=this.end){let n=r-1;if(e=this.bytes[n--],e>=128){let s=r-4;for(s<this.start&&(s=this.start);n>=s&&(this.bytes[n]&192)===128;)n--;n<this.start&&(n=this.start),e=this.step(n-this.start)>>3}}const t=r<this.end?this.step(r-this.start)>>3:-1;return ee.emptyOpContext(e,t)}indexOf(r,e,t=0){let n=e.length;if(n===0)return t<=this.end?t:-1;const s=e[0];let i=this.end-n;const o=typeof r.indexOf=="function";let a=t;for(;a<=i;){if(o){if(a=r.indexOf(s,a),a===-1||a>i)return-1}else{for(;a<=i&&r[a]!==s;)a++;if(a>i)return-1}let c=!0;for(let l=1;l<n;l++)if(r[a+l]!==e[l]){c=!1;break}if(c)return a;a++}return-1}prefixLength(r){return r.prefixUTF8.length}},lb=class extends Rt{constructor(r,e=0,t=r.length){super(),this.charSequence=r,this.start=e,this.end=t}hasString(r,e){const t=this.charSequence.indexOf(r.str,this.start+e);return t!==-1&&t<=this.end-r.str.length}hasAnyString(r,e){return r.ac16?r.ac16.searchUTF16(this.charSequence,this.start+e,this.end):!1}step(r){if(r+=this.start,r>=this.end)return Rt.EOF();const e=this.charSequence.charCodeAt(r);if(e<X.MIN_HIGH_SURROGATE||e>X.MAX_HIGH_SURROGATE||r+1>=this.end)return e<<3|1;const t=this.charSequence.charCodeAt(r+1);return t>=X.MIN_LOW_SURROGATE&&t<=X.MAX_LOW_SURROGATE?(e-X.MIN_HIGH_SURROGATE)*1024+(t-X.MIN_LOW_SURROGATE)+X.MIN_SUPPLEMENTARY_CODE_POINT<<3|2:e<<3|1}index(r,e){e+=this.start;const t=this.charSequence.indexOf(r.prefix,e);return t<0||t>this.end-r.prefix.length?-1:t-e}context(r){r+=this.start;const e=r>this.start&&r<=this.end?this.charSequence.charCodeAt(r-1):-1,t=r<this.end?this.charSequence.charCodeAt(r):-1;return ee.emptyOpContext(e,t)}prefixLength(r){return r.prefix.length}},Ne=class{static fromUTF8(r,e=0,t=r.length){return new ub(r,e,t)}static fromUTF16(r,e=0,t=r.length){return new lb(r,e,t)}},Ha=class extends Error{constructor(r){super(r),this.name="RE2JSException"}},be=class extends Ha{constructor(r,e=null){let t=`error parsing regexp: ${r}`;e&&(t+=`: \`${e}\``),super(t),this.name="RE2JSSyntaxException",this.message=t,this.error=r,this.input=e}getDescription(){return this.error}getPattern(){return this.input}},Bb=class extends Ha{constructor(r){super(r),this.name="RE2JSCompileException"}},Ot=class extends Ha{constructor(r){super(r),this.name="RE2JSGroupException"}},hb=class extends Ha{constructor(r){super(r),this.name="RE2JSFlagsException"}},jo=class extends Ha{constructor(r){super(r),this.name="RE2JSInternalException"}},_s,Qp=(_s=class{static quoteReplacement(e,t=!1){return t?e.indexOf("\\")<0&&e.indexOf("$")<0?e:e.split("").map(n=>{const s=n.codePointAt(0);return s===L.CODES.get("\\")||s===L.CODES.get("$")?`\\${n}`:n}).join(""):e.indexOf("$")<0?e:e.split("").map(n=>n.codePointAt(0)===L.CODES.get("$")?"$$":n).join("")}constructor(e,t){if(e===null)throw new Error("pattern is null");this.patternInput=e;const n=this.patternInput.re2();this.patternGroupCount=n.numberOfCapturingGroups(),this.groups=[],this.namedGroups=n.namedGroups,this.numberOfInstructions=n.numberOfInstructions(),t instanceof bs?this.resetMatcherInput(t):ee.isByteArray(t)?this.resetMatcherInput(fs.utf8(t)):this.resetMatcherInput(fs.utf16(t))}pattern(){return this.patternInput}reset(){return this.matcherInputLength=this.matcherInput.length(),this.appendPos=0,this.hasMatch=!1,this.hasGroups=!1,this.anchorFlag=0,this}resetMatcherInput(e){if(e===null)throw new Error("input is null");return e instanceof bs||(ee.isByteArray(e)?e=fs.utf8(e):e=fs.utf16(e)),this.matcherInput=e,this.reset(),this}start(e=0){if(typeof e=="string"){const t=this.namedGroups[e];if(!Number.isFinite(t))throw new Ot(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e]}end(e=0){if(typeof e=="string"){const t=this.namedGroups[e];if(!Number.isFinite(t))throw new Ot(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e+1]}programSize(){return this.numberOfInstructions}group(e=0){if(typeof e=="string"){const s=this.namedGroups[e];if(!Number.isFinite(s))throw new Ot(`group '${e}' not found`);e=s}const t=this.start(e),n=this.end(e);return t<0&&n<0?null:this.substring(t,n)}getNamedGroups(){if(!this.hasMatch)throw new Ot("perhaps no match attempted");const e=Object.create(null);for(const t of Object.keys(this.namedGroups))e[t]=this.group(t);return e}groupCount(){return this.patternGroupCount}loadGroup(e){if(e<0||e>this.patternGroupCount)throw new Ot(`Group index out of bounds: ${e}`);if(!this.hasMatch)throw new Ot("perhaps no match attempted");if(e===0||this.hasGroups)return;const t=this.matcherInputLength,n=this.patternInput.re2().matchMachineInput(this.matcherInput,this.groups[0],t,this.anchorFlag,1+this.patternGroupCount);if(!n[0])throw new Ot("inconsistency in matching group data");this.groups=n[1],this.hasGroups=!0}matches(){return this.genMatch(0,G.ANCHOR_BOTH)}lookingAt(){return this.genMatch(0,G.ANCHOR_START)}find(e=null){if(e!==null){if(e<0||e>this.matcherInputLength)throw new Ot(`start index out of bounds: ${e}`);return this.reset(),this.genMatch(e,0)}if(e=0,this.hasMatch&&(e=this.groups[1],this.groups[0]===this.groups[1])){const t=(this.matcherInput.isUTF16Encoding()?Ne.fromUTF16(this.matcherInput.asCharSequence(),0,this.matcherInputLength):Ne.fromUTF8(this.matcherInput.asBytes(),0,this.matcherInputLength)).step(e);t<0?e++:e+=t&7}return this.genMatch(e,G.UNANCHORED)}genMatch(e,t){const n=this.patternInput.re2().matchMachineInput(this.matcherInput,e,this.matcherInputLength,t,1);return n[0]?(this.groups=n[1],this.hasMatch=!0,this.hasGroups=this.patternGroupCount===0,this.anchorFlag=t,!0):(this.hasMatch=!1,!1)}substring(e,t){return this.matcherInput.isUTF8Encoding()?ee.utf8ByteArrayToString(this.matcherInput.asBytes().slice(e,t)):this.matcherInput.asCharSequence().substring(e,t).toString()}inputLength(){return this.matcherInputLength}appendReplacement(e,t=!1){let n="";const s=this.start(),i=this.end();return this.appendPos<s&&(n+=this.substring(this.appendPos,s)),this.appendPos=i,n+=t?this.appendReplacementInternalJava(e):this.appendReplacementInternalJs(e),n}appendReplacementInternalJava(e){let t="",n=0;const s=e.length;let i=0;for(;i<s;){const o=e.codePointAt(i);if(o===L.CODES.get("\\")){if(n<i&&(t+=e.substring(n,i)),i++,i>=s)throw new Ot("character to be escaped is missing");n=i,i++;continue}if(o===L.CODES.get("$")){if(n<i&&(t+=e.substring(n,i)),i+1>=s)throw new Ot("Illegal group reference: group index is missing");const a=e.codePointAt(i+1);if(L.CODES.get("0")<=a&&a<=L.CODES.get("9")){let c=a-L.CODES.get("0"),l=i+2;for(;l<s;l++){const d=e.codePointAt(l);if(d<L.CODES.get("0")||d>L.CODES.get("9")||c*10+d-L.CODES.get("0")>this.patternGroupCount)break;c=c*10+d-L.CODES.get("0")}if(c>this.patternGroupCount)throw new Ot(`n > number of groups: ${c}`);const B=this.group(c);B!==null&&(t+=B),i=l,n=i}else if(a===L.CODES.get("{")){let c=i+2;for(;c<s&&e.codePointAt(c)!==L.CODES.get("}");)c++;if(c>=s)throw new Ot("named capture group is missing trailing '}'");const l=e.substring(i+2,c),B=this.group(l);B!==null&&(t+=B),i=c+1,n=i}else throw new Ot("Illegal group reference");continue}i++}return n<s&&(t+=e.substring(n,s)),t}appendReplacementInternalJs(e){let t="",n=0;const s=e.length;for(let i=0;i<s-1;i++)if(e.codePointAt(i)===L.CODES.get("$")){let o=e.codePointAt(i+1);if(L.CODES.get("$")===o){n<i&&(t+=e.substring(n,i)),t+="$",i++,n=i+1;continue}else if(L.CODES.get("&")===o){n<i&&(t+=e.substring(n,i));const a=this.group(0);a!==null?t+=a:t+="$&",i++,n=i+1;continue}else if(L.CODES.get("`")===o){n<i&&(t+=e.substring(n,i)),t+=this.substring(0,this.start(0)),i++,n=i+1;continue}else if(L.CODES.get("'")===o){n<i&&(t+=e.substring(n,i)),t+=this.substring(this.end(0),this.matcherInputLength),i++,n=i+1;continue}else if(L.CODES.get("1")<=o&&o<=L.CODES.get("9")){let a=o-L.CODES.get("0");for(n<i&&(t+=e.substring(n,i)),i+=2;i<s&&(o=e.codePointAt(i),!(o<L.CODES.get("0")||o>L.CODES.get("9")||a*10+o-L.CODES.get("0")>this.patternGroupCount));i++)a=a*10+o-L.CODES.get("0");if(a>this.patternGroupCount){t+=`$${a}`,n=i,i--;continue}const c=this.group(a);c!==null&&(t+=c),n=i,i--;continue}else if(o===L.CODES.get("<")){n<i&&(t+=e.substring(n,i)),i++;let a=i+1;for(;a<e.length&&e.codePointAt(a)!==L.CODES.get(">")&&e.codePointAt(a)!==L.CODES.get(" ");)a++;if(a===e.length||e.codePointAt(a)!==L.CODES.get(">")){t+=e.substring(i-1,a+1),n=a+1,i=a;continue}const c=e.substring(i+1,a);if(Object.prototype.hasOwnProperty.call(this.namedGroups,c)){const l=this.group(c);l!==null&&(t+=l)}else t+=`$<${c}>`;n=a+1,i=a;continue}}return n<s&&(t+=e.substring(n,s)),t}appendTail(){return this.substring(this.appendPos,this.matcherInputLength)}replaceAll(e,t=!1){return this.replace(e,!0,t)}replaceFirst(e,t=!1){return this.replace(e,!1,t)}replace(e,t=!0,n=!1){let s="";this.reset();const i=typeof e=="function",o=Object.keys(this.namedGroups).length>0;let a=null;if(i){if(this.groupCount()>=_s.MAX_REPLACER_ARGS)throw new Ot("Too many capture groups to safely invoke replacer function");a=this.matcherInput.isUTF8Encoding()?this.matcherInput.asBytes():this.matcherInput.asCharSequence()}for(;this.find()&&(s+=i?this.appendReplacementFunc(e,o,a):this.appendReplacement(e,n),!!t););return s+=this.appendTail(),s}appendReplacementFunc(e,t,n){let s="";const i=this.start(),o=this.end();this.appendPos<i&&(s+=this.substring(this.appendPos,i)),this.appendPos=o;const a=this.buildReplacerArgs(i,t,n);return s+=String(e(...a)),s}buildReplacerArgs(e,t,n){const s=[this.group(0)],i=this.groupCount();for(let o=1;o<=i;o++){const a=this.start(o);a<0?s.push(void 0):s.push(this.substring(a,this.end(o)))}if(s.push(e),s.push(n),t){const o=this.getNamedGroups();for(const a in o)o[a]===null&&(o[a]=void 0);s.push(o)}return s}},j(_s,"MAX_REPLACER_ARGS",65535),_s),fe,k=(fe=class{static isRuneOp(e){return fe.RUNE<=e&&e<=fe.RUNE_ANY_NOT_NL}static escapeRunes(e){let t='"';for(let n of e)t+=ee.escapeRune(n);return t+='"',t}constructor(e){this.op=e,this.out=0,this.arg=0,this.runes=[],this.next=null}matchRune(e){if(this.runes.length===1){const o=this.runes[0];return this.arg&G.FOLD_CASE?X.equalsIgnoreCase(o,e):e===o}const t=this.runes.length;if(t===0)return!1;if(t===2||t===4||t===6||t===8){for(let o=0;o<t;o+=2){if(e<this.runes[o])return!1;if(e<=this.runes[o+1])return!0}return!1}let n=0,s=t>>1;for(;s>1;){const o=s>>1;n+=this.runes[n+o<<1]<=e?o:0,s-=o}n+=this.runes[n<<1]<=e?1:0;const i=n-1;return i>=0&&e<=this.runes[i<<1|1]}matchRunePos(e){if(this.runes.length===1){const o=this.runes[0];return this.arg&G.FOLD_CASE?X.equalsIgnoreCase(o,e)?0:-1:e===o?0:-1}const t=this.runes.length;if(t===0)return-1;if(t===2||t===4||t===6||t===8){for(let o=0;o<t;o+=2){if(e<this.runes[o])return-1;if(e<=this.runes[o+1])return Math.floor(o/2)}return-1}let n=0,s=t>>1;for(;s>1;){const o=s>>1;n+=this.runes[n+o<<1]<=e?o:0,s-=o}n+=this.runes[n<<1]<=e?1:0;const i=n-1;return i>=0&&e<=this.runes[i<<1|1]?i:-1}toString(){switch(this.op){case fe.ALT:return`alt -> ${this.out}, ${this.arg}`;case fe.ALT_MATCH:return`altmatch -> ${this.out}, ${this.arg}`;case fe.CAPTURE:return`cap ${this.arg} -> ${this.out}`;case fe.EMPTY_WIDTH:return`empty ${this.arg} -> ${this.out}`;case fe.MATCH:return`match${this.arg!==0?` ${this.arg}`:""}`;case fe.FAIL:return"fail";case fe.NOP:return`nop -> ${this.out}`;case fe.LB_WRITE:return`lbwrite ${this.arg} -> ${this.out}`;case fe.LB_CHECK:return`lbcheck ${this.arg} -> ${this.out}`;case fe.RUNE:return this.runes===null?"rune <null>":["rune ",fe.escapeRunes(this.runes),this.arg&G.FOLD_CASE?"/i":""," -> ",this.out].join("");case fe.RUNE1:return`rune1 ${fe.escapeRunes(this.runes)} -> ${this.out}`;case fe.RUNE_ANY:return`any -> ${this.out}`;case fe.RUNE_ANY_NOT_NL:return`anynotnl -> ${this.out}`;default:throw new Error("unhandled case in Inst.toString")}}},j(fe,"ALT",1),j(fe,"ALT_MATCH",2),j(fe,"CAPTURE",3),j(fe,"EMPTY_WIDTH",4),j(fe,"FAIL",5),j(fe,"MATCH",6),j(fe,"NOP",7),j(fe,"RUNE",8),j(fe,"RUNE1",9),j(fe,"RUNE_ANY",10),j(fe,"RUNE_ANY_NOT_NL",11),j(fe,"LB_WRITE",12),j(fe,"LB_CHECK",13),fe),$p=class{constructor(r){this.sparse=new Int32Array(r),this.densePcs=new Int32Array(r),this.denseCaps=null,this.size=0,this.ncap=0}init(r){this.ncap=r;const e=this.densePcs.length*r;(!this.denseCaps||this.denseCaps.length<e)&&(this.denseCaps=new Int32Array(e))}contains(r){const e=this.sparse[r];return e<this.size&&this.densePcs[e]===r}isEmpty(){return this.size===0}add(r){const e=this.size++;return this.sparse[r]=e,this.densePcs[e]=r,e}clear(){this.size=0}toString(){let r="{";for(let e=0;e<this.size;e++)e!==0&&(r+=", "),r+=this.densePcs[e];return r+="}",r}},db=class vB{static fromRE2(e){const t=new vB;return t.prog=e.prog,t.re2=e,t.q0=new $p(t.prog.numInst()),t.q1=new $p(t.prog.numInst()),t.matched=!1,t.matchcap=new Int32Array(t.prog.numCap<2?2:t.prog.numCap),t.ncap=0,t}static fromMachine(e){return vB.fromRE2(e.re2)}constructor(){this.prog=null,this.re2=null,this.q0=null,this.q1=null,this.matched=!1,this.matchcap=null,this.ncap=0,this.lbTable=null}init(e){this.ncap=e,e>this.matchcap.length?this.matchcap=new Int32Array(e).fill(-1):this.matchcap.fill(-1),this.q0.init(e),this.q1.init(e),this.prog.numLb>0&&((!this.lbTable||this.lbTable.length<this.prog.numLb+1)&&(this.lbTable=new Int32Array(this.prog.numLb+1)),this.lbTable.fill(-1))}submatches(){return this.ncap===0?ee.emptyInts():ee.toArray(this.matchcap.subarray(0,this.ncap))}match(e,t,n){const s=this.re2.cond;if(s===ee.EMPTY_ALL||(n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&t!==0)return!1;this.matched=!1,this.matchcap.fill(-1);let i=this.prog.numLb>0?0:t,o=t,a=this.q0,c=this.q1,l=e.step(i),B=l>>3,d=l&7,p=-1,g=0;l!==Rt.EOF()&&(l=e.step(i+d),p=l>>3,g=l&7);let w;for(i===0?w=ee.emptyOpContext(-1,B):w=e.context(i);;){if(a.isEmpty()){if(s&ee.EMPTY_BEGIN_TEXT&&i!==0||(n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&i!==0||this.matched)break;if(this.prog.numLb===0&&this.re2.prefix.length!==0&&p!==this.re2.prefixRune&&e.canCheckPrefix()){const W=e.index(this.re2,i);if(W<0)break;i+=W,l=e.step(i),B=l>>3,d=l&7,l=e.step(i+d),p=l>>3,g=l&7,w=e.context(i)}}if(i===0&&this.prog.numLb>0)for(let W=0;W<this.prog.lbStarts.length;W++)this.add(a,this.prog.lbStarts[W],i,this.matchcap,0,w);!this.matched&&(i===0||n===G.UNANCHORED)&&i>=o&&(this.ncap>0&&(this.matchcap[0]=i),this.add(a,this.prog.start,i,this.matchcap,0,w));const N=i+d;if(w=e.context(N),this.step(a,c,i,N,B,w,n,i===e.endPos()),d===0||this.ncap===0&&this.matched)break;i+=d,B=p,d=g,B!==-1&&(l=e.step(i+d),p=l>>3,g=l&7);const M=a;a=c,c=M}return c.clear(),this.matched}matchSet(e,t,n){const s=this.re2.cond;if(s===ee.EMPTY_ALL)return[];if((n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&t!==0)return[];let i=this.prog.numLb>0?0:t,o=t,a=this.q0,c=this.q1,l=e.step(i),B=l>>3,d=l&7,p=-1,g=0;l!==Rt.EOF()&&(l=e.step(i+d),p=l>>3,g=l&7);let w=i===0?ee.emptyOpContext(-1,B):e.context(i);const N=new Set;for(;!(a.isEmpty()&&(s&ee.EMPTY_BEGIN_TEXT&&i!==0||(n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&i!==0));){if(i===0&&this.prog.numLb>0)for(let te=0;te<this.prog.lbStarts.length;te++)this.add(a,this.prog.lbStarts[te],i,this.matchcap,0,w);(i===0||n===G.UNANCHORED)&&i>=o&&this.add(a,this.prog.start,i,this.matchcap,0,w);const M=i+d;w=e.context(M);for(let te=0;te<a.size;te++){const ie=a.densePcs[te],Ee=this.prog.inst[ie],de=te*this.ncap;let le=!1;switch(Ee.op){case k.MATCH:if(n===G.ANCHOR_BOTH&&i!==e.endPos())break;N.add(Ee.arg);break;case k.RUNE:le=Ee.matchRune(B);break;case k.RUNE1:le=B===Ee.runes[0];break;case k.RUNE_ANY:le=!0;break;case k.RUNE_ANY_NOT_NL:le=B!==10;break;default:continue}le&&this.add(c,Ee.out,M,a.denseCaps,de,w)}if(a.clear(),d===0)break;i+=d,B=p,d=g,B!==-1&&(l=e.step(i+d),p=l>>3,g=l&7);const W=a;a=c,c=W}return c.clear(),Array.from(N).sort((M,W)=>M-W)}step(e,t,n,s,i,o,a,c){const l=this.re2.longest;for(let B=0;B<e.size;B++){const d=e.densePcs[B],p=B*this.ncap;if(l&&this.matched&&this.ncap>0&&this.matchcap[0]<e.denseCaps[p])continue;const g=this.prog.inst[d];let w=!1;switch(g.op){case k.MATCH:if(a===G.ANCHOR_BOTH&&!c)break;if(this.ncap>0&&(!l||!this.matched||this.matchcap[1]<n)){e.denseCaps[p+1]=n;for(let N=0;N<this.ncap;N++)this.matchcap[N]=e.denseCaps[p+N]}l||(e.size=0),this.matched=!0;break;case k.RUNE:w=g.matchRune(i);break;case k.RUNE1:w=i===g.runes[0];break;case k.RUNE_ANY:w=!0;break;case k.RUNE_ANY_NOT_NL:w=i!==10;break;default:continue}w&&this.add(t,g.out,s,e.denseCaps,p,o)}e.clear()}add(e,t,n,s,i,o){for(;;){if(t===0||e.contains(t))return;const a=e.add(t),c=this.prog.inst[t];switch(c.op){case k.FAIL:return;case k.ALT:case k.ALT_MATCH:this.add(e,c.out,n,s,i,o),t=c.arg;continue;case k.EMPTY_WIDTH:if(!(c.arg&~o)){t=c.out;continue}return;case k.NOP:t=c.out;continue;case k.CAPTURE:if(c.arg<this.ncap){const l=s[i+c.arg];s[i+c.arg]=n,this.add(e,c.out,n,s,i,o),s[i+c.arg]=l;return}else{t=c.out;continue}case k.LB_WRITE:this.lbTable[Math.abs(c.arg)]=n,t=c.out;continue;case k.LB_CHECK:if(c.arg>0){if(this.lbTable[c.arg]===n){t=c.out;continue}}else if(this.lbTable[-c.arg]!==n){t=c.out;continue}return;case k.MATCH:case k.RUNE:case k.RUNE1:case k.RUNE_ANY:case k.RUNE_ANY_NOT_NL:if(this.ncap>0){const l=a*this.ncap;for(let B=0;B<this.ncap;B++)e.denseCaps[l+B]=s[i+B]}return;default:throw new jo("unhandled")}}}};const Yp=r=>{let e=-2128831035;for(let t=0;t<r.length;t++)e^=r[t],e=Math.imul(e,16777619);return e},fb=(r,e)=>{if(r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0};var pb=class{constructor(r,e,t=[]){this.nfaStates=r,this.isMatch=e,this.matchIDs=t,this.nextLatin1=new Array(X.MAX_LATIN1+1).fill(null),this.nextLatin1Anchored=new Array(X.MAX_LATIN1+1).fill(null),this.transKeys=[],this.transVals=[],this.lastSeen=0}},Gn,Cb=(Gn=class{constructor(e,t=8388608){this.prog=e,this.stateCache=new Map,this.stateCount=0,this.startState=null,this.stateLimit=Math.max(1,Math.floor(t/Gn.STATE_MEMORY_ESTIMATE)),this.cacheClears=0,this.failed=!1,this.clock=0}computeClosure(e){const t=new Set,n=[...e];let s=!1;const i=[];for(;n.length>0;){const a=n.pop();if(t.has(a))continue;t.add(a);const c=this.prog.getInst(a);switch(c.op){case k.MATCH:s=!0,i.includes(c.arg)||i.push(c.arg);break;case k.ALT:case k.ALT_MATCH:n.push(c.out),n.push(c.arg);break;case k.NOP:case k.CAPTURE:n.push(c.out);break;case k.EMPTY_WIDTH:case k.LB_WRITE:case k.LB_CHECK:return null}}const o=Int32Array.from(t).sort();return i.sort((a,c)=>a-c),{pcs:o,isMatch:s,matchIDs:i}}getState(e){const t=this.computeClosure(e);if(!t)return null;const n=t.pcs,s=Yp(n);let i=this.stateCache.get(s);if(i)for(let a=0;a<i.length;a++){const c=i[a];if(fb(c.nfaStates,n))return c.lastSeen=++this.clock,c}else i=[],this.stateCache.set(s,i);if(this.failed)return null;if(this.stateCount>=this.stateLimit){if(this.cacheClears++,this.cacheClears>=Gn.MAX_CACHE_CLEARS)return this.failed=!0,this.stateCache.clear(),this.stateCount=0,this.startState=null,null;this.evictCache(),i=this.stateCache.get(s),i||(i=[],this.stateCache.set(s,i))}const o=new pb(n,t.isMatch,t.matchIDs);return o.lastSeen=++this.clock,i.push(o),this.stateCount++,o}evictCache(){const e=[];for(const o of this.stateCache.values())for(let a=0;a<o.length;a++)e.push(o[a]);e.sort((o,a)=>o.lastSeen-a.lastSeen);const t=Math.max(1,Math.floor(this.stateLimit/2)),n=e.length-t,s=e.slice(n),i=new Set(s);this.stateCache.clear(),this.stateCount=0;for(let o=0;o<s.length;o++){const a=s[o];a.nextLatin1.fill(null),a.nextLatin1Anchored.fill(null),a.transKeys.length=0,a.transVals.length=0;const c=Yp(a.nfaStates);let l=this.stateCache.get(c);l||(l=[],this.stateCache.set(c,l)),l.push(a),this.stateCount++}this.startState&&!i.has(this.startState)&&(this.startState=null)}step(e,t,n){if(t<=X.MAX_LATIN1)if(n===G.UNANCHORED){const o=e.nextLatin1[t];if(o!==null)return o}else{const o=e.nextLatin1Anchored[t];if(o!==null)return o}else{const o=t+(n===G.UNANCHORED?0:X.MAX_RUNE+1),a=e.transKeys,c=a.length;for(let l=0;l<c;l++)if(a[l]===o)return e.transVals[l]}const s=[];for(let o=0;o<e.nfaStates.length;o++){const a=e.nfaStates[o],c=this.prog.getInst(a);k.isRuneOp(c.op)&&c.matchRune(t)&&s.push(c.out)}n===G.UNANCHORED&&s.push(this.prog.start);const i=this.getState(s);if(t<=X.MAX_LATIN1)n===G.UNANCHORED?e.nextLatin1[t]=i:e.nextLatin1Anchored[t]=i;else{const o=t+(n===G.UNANCHORED?0:X.MAX_RUNE+1);e.transKeys.push(o),e.transVals.push(i)}return i}match(e,t,n){if((n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&t!==0)return!1;if(!this.startState&&(this.startState=this.getState([this.prog.start]),!this.startState))return null;let s=e.endPos(),i=this.startState;if(i.isMatch)if(n===G.ANCHOR_BOTH){if(t===s)return!0}else return!0;let o=t;for(;o<s;){const a=e.step(o),c=a>>3,l=a&7;if(l===0)break;if(i=n===G.UNANCHORED&&c<=X.MAX_LATIN1&&i.nextLatin1[c]||this.step(i,c,n),i===null)return null;if(i.lastSeen=++this.clock,i.isMatch)if(n===G.ANCHOR_BOTH){if(o+l===s)return!0}else return!0;if(i.nfaStates.length===0&&n!==G.UNANCHORED)return!1;o+=l}return!1}matchSet(e,t,n){if((n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&t!==0)return[];if(!this.startState&&(this.startState=this.getState([this.prog.start]),!this.startState))return null;let s=e.endPos(),i=this.startState;const o=new Set,a=(l,B)=>{l.isMatch&&(n===G.ANCHOR_BOTH?B===s&&l.matchIDs.forEach(d=>o.add(d)):l.matchIDs.forEach(d=>o.add(d)))};a(i,t);let c=t;for(;c<s;){const l=e.step(c),B=l>>3,d=l&7;if(d===0)break;if(i=n===G.UNANCHORED&&B<=X.MAX_LATIN1&&i.nextLatin1[B]||this.step(i,B,n),i===null)return null;if(i.lastSeen=++this.clock,c+=d,a(i,c),i.nfaStates.length===0&&n!==G.UNANCHORED)break}return Array.from(o).sort((l,B)=>l-B)}},j(Gn,"MAX_CACHE_CLEARS",5),j(Gn,"STATE_MEMORY_ESTIMATE",838),Gn);const gb=32,mb=500,nB=256,_b=256*1024;var Eb=class{constructor(){this.end=0,this.cap=new Int32Array(0),this.matchcap=new Int32Array(0),this.ncap=0,this.jobPc=new Int32Array(nB),this.jobArg=new Uint8Array(nB),this.jobPos=new Int32Array(nB),this.jobLen=0,this.visited=new Uint32Array(0)}reset(r,e,t){this.end=e,this.jobLen=0,this.ncap=t;const n=r.numInst()*(e+1)+gb-1>>>5;this.visited.length<n?this.visited=new Uint32Array(n):this.visited.fill(0,0,n),this.cap.length<t?this.cap=new Int32Array(t).fill(-1):this.cap.fill(-1,0,t),this.matchcap.length<t?this.matchcap=new Int32Array(t).fill(-1):this.matchcap.fill(-1,0,t)}shouldVisit(r,e){const t=r*(this.end+1)+e,n=t>>>5,s=1<<(t&31);return this.visited[n]&s?!1:(this.visited[n]|=s,!0)}push(r,e,t,n){if(r.prog.getInst(e).op!==k.FAIL&&(n||this.shouldVisit(e,t))){if(this.jobLen>=this.jobPc.length){const s=this.jobPc.length*2,i=new Int32Array(s);i.set(this.jobPc),this.jobPc=i;const o=new Uint8Array(s);o.set(this.jobArg),this.jobArg=o;const a=new Int32Array(s);a.set(this.jobPos),this.jobPos=a}this.jobPc[this.jobLen]=e,this.jobArg[this.jobLen]=n?1:0,this.jobPos[this.jobLen]=t,this.jobLen++}}tryBacktrack(r,e,t,n,s){const i=r.longest;for(this.push(r,t,n,!1);this.jobLen>0;){this.jobLen--;let o=this.jobPc[this.jobLen],a=this.jobArg[this.jobLen]===1,c=this.jobPos[this.jobLen],l=!0;for(;!(!l&&!this.shouldVisit(o,c));){l=!1;const B=r.prog.getInst(o);switch(B.op){case k.FAIL:throw new jo("unexpected InstFail");case k.ALT:if(a){a=!1,o=B.arg;continue}else{this.push(r,o,c,!0),o=B.out;continue}case k.ALT_MATCH:{const d=r.prog.getInst(B.out);if(k.isRuneOp(d.op)){this.push(r,B.arg,c,!1),o=B.arg,c=this.end;continue}this.push(r,B.out,this.end,!1),o=B.out;continue}case k.RUNE:{const d=e.step(c);if(d===Rt.EOF()||!B.matchRune(d>>3))break;c+=d&7,o=B.out;continue}case k.RUNE1:{const d=e.step(c);if(d===Rt.EOF()||d>>3!==B.runes[0])break;c+=d&7,o=B.out;continue}case k.RUNE_ANY_NOT_NL:{const d=e.step(c);if(d===Rt.EOF()||d>>3===10)break;c+=d&7,o=B.out;continue}case k.RUNE_ANY:{const d=e.step(c);if(d===Rt.EOF())break;c+=d&7,o=B.out;continue}case k.CAPTURE:if(a){this.cap[B.arg]=c;break}else{B.arg<this.ncap&&(this.push(r,o,this.cap[B.arg],!0),this.cap[B.arg]=c),o=B.out;continue}case k.EMPTY_WIDTH:{const d=e.context(c);if(B.arg&~d)break;o=B.out;continue}case k.NOP:o=B.out;continue;case k.MATCH:{if(s===G.ANCHOR_BOTH&&c!==this.end)break;if(this.ncap===0)return!0;this.ncap>1&&(this.cap[1]=c);const d=this.matchcap[1];if((d===-1||i&&c>0&&c>d)&&this.matchcap.set(this.cap),!i||c===this.end)return!0;break}case k.LB_WRITE:case k.LB_CHECK:throw new jo("Backtracker cannot evaluate Lookbehind instructions");default:throw new jo("bad inst")}break}}return i&&this.matchcap.length>1&&this.matchcap[1]>=0}};const vc=[];var Rc=class T_{static shouldBacktrack(e){return e.numInst()<=mb}static maxBitStateLen(e){return T_.shouldBacktrack(e)?Math.floor(_b/e.numInst()):0}static execute(e,t,n,s,i){const o=e.cond;if(o===ee.EMPTY_ALL||(s===G.ANCHOR_START||s===G.ANCHOR_BOTH)&&n!==0||o&ee.EMPTY_BEGIN_TEXT&&n!==0)return null;const a=vc.length>0?vc.pop():new Eb,c=t.endPos();a.reset(e.prog,c,i);let l=!1;if(o&ee.EMPTY_BEGIN_TEXT||s===G.ANCHOR_START||s===G.ANCHOR_BOTH)a.ncap>0&&(a.cap[0]=n),a.tryBacktrack(e,t,e.prog.start,n,s)&&(l=!0);else{let d=-1;for(;n<=c&&d!==0;n+=d){if(e.prefix.length>0){const g=t.index(e,n);if(g<0)break;n+=g}if(a.ncap>0&&(a.cap[0]=n),a.tryBacktrack(e,t,e.prog.start,n,s)){l=!0;break}const p=t.step(n);d=p===Rt.EOF()?0:p&7}}if(!l)return vc.push(a),null;const B=i===0?[]:ee.toArray(a.matchcap.subarray(0,i));return vc.push(a),B}},Xp=class{constructor(r){this.sparse=new Uint32Array(r),this.dense=new Uint32Array(r),this.size=0,this.nextIndex=0}empty(){return this.nextIndex>=this.size}next(){return this.dense[this.nextIndex++]}clear(){this.size=0,this.nextIndex=0}contains(r){return r<this.sparse.length&&this.sparse[r]<this.size&&this.dense[this.sparse[r]]===r}insert(r){this.contains(r)||this.insertNew(r)}insertNew(r){r>=this.sparse.length||(this.sparse[r]=this.size,this.dense[this.size]=r,this.size++)}};const Ib=(r,e,t,n)=>{const s=r.length,i=e.length;let o=0,a=0;const c=[],l=[];let B=!0,d=-1;const p=g=>{const w=g?r:e,N=g?o:a,M=g?t:n;return d>0&&w[N]<=c[d]?!1:(c.push(w[N],w[N+1]),g?o+=2:a+=2,d+=2,l.push(M),!0)};for(;o<s||a<i;)if(a>=i?B=p(!0):o>=s||e[a]<r[o]?B=p(!1):B=p(!0),!B)return null;return{merged:c,next:l}};var yb=class{constructor(r){this.start=r.start,this.numCap=r.numCap,this.inst=new Array(r.inst.length);for(let e=0;e<r.inst.length;e++){const t=r.inst[e],n=new k(t.op);n.out=t.out,n.arg=t.arg,n.runes=t.runes?t.runes.slice():[],n.next=null,this.inst[e]=n}}};const wb=r=>{const e=new yb(r);for(let t=0;t<e.inst.length;t++){const n=e.inst[t];if(n.op!==k.ALT&&n.op!==k.ALT_MATCH)continue;let s="out",i="arg",o=e.inst[n[i]];if(o.op!==k.ALT&&o.op!==k.ALT_MATCH&&(s="arg",i="out",o=e.inst[n[i]],o.op!==k.ALT&&o.op!==k.ALT_MATCH))continue;const a=e.inst[n[s]];if(a.op===k.ALT||a.op===k.ALT_MATCH)continue;let c="out",l="arg",B=!1;o.out===t?B=!0:o.arg===t&&(B=!0,c="arg",l="out"),B&&(o[c]=n[s]),n[s]===o[c]&&(n[i]=o[l])}return e},Db=r=>{if(r.inst.length>=1e3)return null;const e=new Xp(r.inst.length),t=new Xp(r.inst.length),n=new Array(r.inst.length),s=new Array(r.inst.length).fill(!1),i=o=>{let a=!0;const c=r.inst[o];if(t.contains(o))return!0;switch(t.insert(o),c.op){case k.ALT:case k.ALT_MATCH:{a=i(c.out)&&i(c.arg);let l=s[c.out],B=s[c.arg];if(l&&B)return!1;if(B){const w=c.out;c.out=c.arg,c.arg=w;const N=l;l=B,B=N}l&&(s[o]=!0,c.op=k.ALT_MATCH);const d=n[c.out]||[],p=n[c.arg]||[],g=Ib(d,p,c.out,c.arg);if(!g)return!1;n[o]=g.merged,c.next=new Uint32Array(g.next);break}case k.CAPTURE:case k.EMPTY_WIDTH:case k.NOP:a=i(c.out),s[o]=s[c.out],n[o]=n[c.out]?n[c.out].slice():[],c.next=new Uint32Array(Math.floor(n[o].length/2)+1).fill(c.out);break;case k.MATCH:case k.FAIL:s[o]=c.op===k.MATCH;break;case k.RUNE:{if(s[o]=!1,c.next&&c.next.length>0)break;if(e.insert(c.out),!c.runes||c.runes.length===0){n[o]=[],c.next=new Uint32Array([c.out]);break}let l=[];if(c.runes.length===1&&c.arg&G.FOLD_CASE){const B=c.runes[0];l.push(B,B);for(let d=X.simpleFold(B);d!==B;d=X.simpleFold(d))l.push(d,d);l.sort((d,p)=>d-p)}else for(let B=0;B<c.runes.length;B++)l.push(c.runes[B]);n[o]=l,c.next=new Uint32Array(Math.floor(l.length/2)+1).fill(c.out),c.op=k.RUNE;break}case k.RUNE1:{if(s[o]=!1,c.next&&c.next.length>0)break;e.insert(c.out);let l=[];if(c.arg&G.FOLD_CASE){const B=c.runes[0];l.push(B,B);for(let d=X.simpleFold(B);d!==B;d=X.simpleFold(d))l.push(d,d);l.sort((d,p)=>d-p)}else l.push(c.runes[0],c.runes[0]);n[o]=l,c.next=new Uint32Array(Math.floor(l.length/2)+1).fill(c.out),c.op=k.RUNE;break}case k.RUNE_ANY:if(s[o]=!1,c.next&&c.next.length>0)break;e.insert(c.out),n[o]=[0,X.MAX_RUNE],c.next=new Uint32Array([c.out]);break;case k.RUNE_ANY_NOT_NL:if(s[o]=!1,c.next&&c.next.length>0)break;e.insert(c.out),n[o]=[0,9,11,X.MAX_RUNE],c.next=new Uint32Array(Math.floor(n[o].length/2)+1).fill(c.out);break}return a};for(e.clear(),e.insert(r.start);!e.empty();)if(t.clear(),!i(e.next()))return null;for(let o=0;o<r.inst.length;o++)n[o]&&(r.inst[o].runes=n[o]);return r},Tb=(r,e)=>{for(let t=0;t<e.inst.length;t++){const n=e.inst[t];switch(n.op){case k.ALT:case k.ALT_MATCH:case k.RUNE:break;case k.CAPTURE:case k.EMPTY_WIDTH:case k.NOP:case k.MATCH:case k.FAIL:r.inst[t].next=null;break;case k.RUNE1:case k.RUNE_ANY:case k.RUNE_ANY_NOT_NL:r.inst[t].next=null,r.inst[t].op=n.op,r.inst[t].runes=n.runes?n.runes.slice():[];break}}};var Zp=class A_{static compile(e){if(e.start===0||e.numLb>0)return null;const t=e.inst[e.start];if(t.op!==k.EMPTY_WIDTH||!(t.arg&ee.EMPTY_BEGIN_TEXT))return null;let n=!1;for(let i=0;i<e.inst.length;i++)if(e.inst[i].op===k.ALT||e.inst[i].op===k.ALT_MATCH){n=!0;break}for(let i=0;i<e.inst.length;i++){const o=e.inst[i],a=e.inst[o.out].op;switch(o.op){case k.ALT:case k.ALT_MATCH:if(a===k.MATCH||e.inst[o.arg].op===k.MATCH)return null;break;case k.EMPTY_WIDTH:if(a===k.MATCH){if((o.arg&ee.EMPTY_END_TEXT)===ee.EMPTY_END_TEXT)continue;return null}break;default:if(a===k.MATCH&&n)return null;break}}let s=wb(e);return s=Db(s),s!==null&&Tb(s,e),s}static next(e,t){const n=e.matchRunePos(t);return n>=0?e.next[n]:e.op===k.ALT_MATCH?e.out:0}static execute(e,t,n,s,i){const o=e.onepass;if(!o)return null;const a=new Int32Array(i).fill(-1);let c=!1,l=t.step(n),B=l>>3,d=l&7,p=Rt.EOF(),g=-1,w=0;l!==Rt.EOF()&&(p=t.step(n+d),p!==Rt.EOF()&&(g=p>>3,w=p&7));let N=n===0?ee.emptyOpContext(-1,B):t.context(n),M=o.start,W;for(;;){switch(W=o.inst[M],M=W.out,W.op){case k.MATCH:return s===G.ANCHOR_BOTH&&n!==t.endPos()?null:(c=!0,a.length>0&&(a[0]=0,a[1]=n),i===0?[]:ee.toArray(a));case k.RUNE:if(!W.matchRune(B))return null;break;case k.RUNE1:if(B!==W.runes[0])return null;break;case k.RUNE_ANY:break;case k.RUNE_ANY_NOT_NL:if(B===10)return null;break;case k.ALT:case k.ALT_MATCH:M=A_.next(W,B);continue;case k.FAIL:return null;case k.NOP:continue;case k.EMPTY_WIDTH:if(W.arg&~N)return null;continue;case k.CAPTURE:W.arg<a.length&&(a[W.arg]=n);continue;default:throw new jo("bad inst")}if(d===0)break;N=ee.emptyOpContext(B,g),n+=d,B=g,d=w,B!==-1&&(p=t.step(n+d),p!==Rt.EOF()?(g=p>>3,w=p&7):(g=-1,w=0))}return c?i===0?[]:ee.toArray(a):null}},ne,A=(ne=class{static isPseudoOp(e){return e>=ne.Op.LEFT_PAREN}static emptySubs(){return[]}static quoteIfHyphen(e){return e===L.CODES.get("-")?"\\":""}static fromRegexp(e){const t=new ne(e.op);return t.flags=e.flags,t.subs=e.subs,t.runes=e.runes,t.cap=e.cap,t.min=e.min,t.max=e.max,t.name=e.name,t.namedGroups=e.namedGroups,t.lb=e.lb,t}constructor(e){this.op=e,this.flags=0,this.subs=ne.emptySubs(),this.runes=[],this.min=0,this.max=0,this.cap=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}reinit(){this.flags=0,this.subs=ne.emptySubs(),this.runes=[],this.cap=0,this.min=0,this.max=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}toString(){return this.appendTo()}appendTo(){let e="";switch(this.op){case ne.Op.NO_MATCH:e+="[^\\x00-\\x{10FFFF}]";break;case ne.Op.EMPTY_MATCH:e+="(?:)";break;case ne.Op.STAR:case ne.Op.PLUS:case ne.Op.QUEST:case ne.Op.REPEAT:{const t=this.subs[0];switch(t.op>ne.Op.CAPTURE||t.op===ne.Op.LITERAL&&t.runes.length>1?e+=`(?:${t.appendTo()})`:e+=t.appendTo(),this.op){case ne.Op.STAR:e+="*";break;case ne.Op.PLUS:e+="+";break;case ne.Op.QUEST:e+="?";break;case ne.Op.REPEAT:e+=`{${this.min}`,this.min!==this.max&&(e+=",",this.max>=0&&(e+=this.max)),e+="}";break}this.flags&G.NON_GREEDY&&(e+="?");break}case ne.Op.CONCAT:for(let t of this.subs)t.op===ne.Op.ALTERNATE?e+=`(?:${t.appendTo()})`:e+=t.appendTo();break;case ne.Op.ALTERNATE:{let t="";for(let n of this.subs)e+=t,t="|",e+=n.appendTo();break}case ne.Op.LITERAL:this.flags&G.FOLD_CASE&&(e+="(?i:");for(let t of this.runes)e+=ee.escapeRune(t);this.flags&G.FOLD_CASE&&(e+=")");break;case ne.Op.ANY_CHAR_NOT_NL:e+="(?-s:.)";break;case ne.Op.ANY_CHAR:e+="(?s:.)";break;case ne.Op.PLB:e+=`(?<=${this.subs[0].appendTo()})`;break;case ne.Op.NLB:e+=`(?<!${this.subs[0].appendTo()})`;break;case ne.Op.CAPTURE:this.name===null||this.name.length===0?e+="(":e+=`(?P<${this.name}>`,this.subs[0].op!==ne.Op.EMPTY_MATCH&&(e+=this.subs[0].appendTo()),e+=")";break;case ne.Op.BEGIN_TEXT:e+="\\A";break;case ne.Op.END_TEXT:this.flags&G.WAS_DOLLAR?e+="(?-m:$)":e+="\\z";break;case ne.Op.BEGIN_LINE:e+="^";break;case ne.Op.END_LINE:e+="$";break;case ne.Op.WORD_BOUNDARY:e+="\\b";break;case ne.Op.NO_WORD_BOUNDARY:e+="\\B";break;case ne.Op.CHAR_CLASS:if(this.runes.length%2!==0){e+="[invalid char class]";break}if(e+="[",this.runes.length===0)e+="^\\x00-\\x{10FFFF}";else if(this.runes[0]===0&&this.runes[this.runes.length-1]===X.MAX_RUNE){e+="^";for(let t=1;t<this.runes.length-1;t+=2){const n=this.runes[t]+1,s=this.runes[t+1]-1;e+=ne.quoteIfHyphen(n),e+=ee.escapeRune(n),n!==s&&(e+="-",e+=ne.quoteIfHyphen(s),e+=ee.escapeRune(s))}}else for(let t=0;t<this.runes.length;t+=2){const n=this.runes[t],s=this.runes[t+1];e+=ne.quoteIfHyphen(n),e+=ee.escapeRune(n),n!==s&&(e+="-",e+=ne.quoteIfHyphen(s),e+=ee.escapeRune(s))}e+="]";break;default:e+=this.op;break}return e}maxCap(){let e=0;if(this.op===ne.Op.CAPTURE&&(e=this.cap),this.subs!==null)for(let t of this.subs){const n=t.maxCap();e<n&&(e=n)}return e}equals(e){if(!(e!==null&&e instanceof ne)||this.op!==e.op)return!1;switch(this.op){case ne.Op.END_TEXT:if((this.flags&G.WAS_DOLLAR)!==(e.flags&G.WAS_DOLLAR))return!1;break;case ne.Op.LITERAL:case ne.Op.CHAR_CLASS:if(this.runes===null&&e.runes===null)break;if(this.runes===null||e.runes===null||this.runes.length!==e.runes.length)return!1;for(let t=0;t<this.runes.length;t++)if(this.runes[t]!==e.runes[t])return!1;break;case ne.Op.ALTERNATE:case ne.Op.CONCAT:if(this.subs.length!==e.subs.length)return!1;for(let t=0;t<this.subs.length;++t)if(!this.subs[t].equals(e.subs[t]))return!1;break;case ne.Op.STAR:case ne.Op.PLUS:case ne.Op.QUEST:if((this.flags&G.NON_GREEDY)!==(e.flags&G.NON_GREEDY)||!this.subs[0].equals(e.subs[0]))return!1;break;case ne.Op.REPEAT:if((this.flags&G.NON_GREEDY)!==(e.flags&G.NON_GREEDY)||this.min!==e.min||this.max!==e.max||!this.subs[0].equals(e.subs[0]))return!1;break;case ne.Op.CAPTURE:if(this.cap!==e.cap||(this.name===null?e.name!==null:this.name!==e.name)||!this.subs[0].equals(e.subs[0]))return!1;break;case ne.Op.PLB:case ne.Op.NLB:if(this.lb!==e.lb||!this.subs[0].equals(e.subs[0]))return!1;break}return!0}},j(ne,"Op",D_(["NO_MATCH","EMPTY_MATCH","LITERAL","CHAR_CLASS","ANY_CHAR_NOT_NL","ANY_CHAR","BEGIN_LINE","END_LINE","BEGIN_TEXT","END_TEXT","WORD_BOUNDARY","NO_WORD_BOUNDARY","CAPTURE","STAR","PLUS","QUEST","REPEAT","CONCAT","ALTERNATE","PLB","NLB","LEFT_PAREN","VERTICAL_BAR"])),ne),eC=class{constructor(r){this.next=[Object.create(null)],this.fail=[0],this.match=[!1];for(const t of r){let n=0;for(let s=0;s<t.length;s++){const i=t[s];i in this.next[n]||(this.next.push(Object.create(null)),this.fail.push(0),this.match.push(!1),this.next[n][i]=this.next.length-1),n=this.next[n][i]}this.match[n]=!0}const e=[];for(const t in this.next[0])if(Object.prototype.hasOwnProperty.call(this.next[0],t)){const n=this.next[0][t];this.fail[n]=0,e.push(n)}for(;e.length>0;){const t=e.shift();for(const n in this.next[t])if(Object.prototype.hasOwnProperty.call(this.next[t],n)){const s=this.next[t][n];let i=this.fail[t];for(;i!==0&&!(n in this.next[i]);)i=this.fail[i];n in this.next[i]?this.fail[s]=this.next[i][n]:this.fail[s]=0,this.match[s]=this.match[s]||this.match[this.fail[s]],e.push(s)}}}searchUTF16(r,e,t){let n=0;for(let s=e;s<t;s++){const i=r.charCodeAt(s);for(;n!==0&&!(i in this.next[n]);)n=this.fail[n];if(i in this.next[n]&&(n=this.next[n][i]),this.match[n])return!0}return!1}searchUTF8(r,e,t){let n=0;for(let s=e;s<t;s++){const i=r[s];for(;n!==0&&!(i in this.next[n]);)n=this.fail[n];if(i in this.next[n]&&(n=this.next[n][i]),this.match[n])return!0}return!1}},vn,ge=(vn=class{constructor(e){this.type=e,this.subs=[],this.str="",this.bytes=null,this.ac16=null,this.ac8=null}eval(e,t){switch(this.type){case vn.Type.NONE:return!0;case vn.Type.EXACT:return e.hasString(this,t);case vn.Type.AND:for(let n=0;n<this.subs.length;n++)if(!this.subs[n].eval(e,t))return!1;return!0;case vn.Type.OR:if(this.ac16&&this.ac8)return e.hasAnyString(this,t);for(let n=0;n<this.subs.length;n++)if(this.subs[n].eval(e,t))return!0;return!1;default:return!0}}},j(vn,"Type",{NONE:0,EXACT:1,AND:2,OR:3}),vn),Ab=class Vn{static build(e){const t=Vn.fromRegexp(e);return Vn.simplify(t)}static fromRegexp(e){if(!e)return new ge(ge.Type.NONE);switch(e.op){case A.Op.PLB:case A.Op.NLB:case A.Op.NO_MATCH:case A.Op.EMPTY_MATCH:case A.Op.BEGIN_LINE:case A.Op.END_LINE:case A.Op.BEGIN_TEXT:case A.Op.END_TEXT:case A.Op.WORD_BOUNDARY:case A.Op.NO_WORD_BOUNDARY:case A.Op.CHAR_CLASS:case A.Op.ANY_CHAR_NOT_NL:case A.Op.ANY_CHAR:return new ge(ge.Type.NONE);case A.Op.LITERAL:{if(e.runes.length===0||e.flags&G.FOLD_CASE)return new ge(ge.Type.NONE);const t=new ge(ge.Type.EXACT);let n="";for(let s=0;s<e.runes.length;s++)n+=String.fromCodePoint(e.runes[s]);return t.str=n,t.bytes=ee.stringToUtf8ByteArray(t.str),t}case A.Op.CAPTURE:case A.Op.PLUS:return Vn.fromRegexp(e.subs[0]);case A.Op.REPEAT:return e.min>=1?Vn.fromRegexp(e.subs[0]):new ge(ge.Type.NONE);case A.Op.CONCAT:{const t=new ge(ge.Type.AND);for(const n of e.subs)t.subs.push(Vn.fromRegexp(n));return t}case A.Op.ALTERNATE:{const t=new ge(ge.Type.OR);for(const n of e.subs)t.subs.push(Vn.fromRegexp(n));return t}default:return new ge(ge.Type.NONE)}}static simplify(e){if(e.type===ge.Type.EXACT||e.type===ge.Type.NONE)return e;if(e.type===ge.Type.AND){const t=[];for(const n of e.subs){const s=Vn.simplify(n);if(s.type!==ge.Type.NONE)if(s.type===ge.Type.AND)for(let i=0;i<s.subs.length;i++)t.push(s.subs[i]);else t.push(s)}return t.length===0?new ge(ge.Type.NONE):t.length===1?t[0]:(e.subs=t,e)}if(e.type===ge.Type.OR){const t=[];for(const o of e.subs){const a=Vn.simplify(o);if(a.type===ge.Type.NONE)return new ge(ge.Type.NONE);if(a.type===ge.Type.OR)for(let c=0;c<a.subs.length;c++)t.push(a.subs[c]);else t.push(a)}if(t.length===0)return new ge(ge.Type.NONE);if(t.length===1)return t[0];const n=new Set,s=[];for(const o of t)o.type===ge.Type.EXACT?n.has(o.str)||(n.add(o.str),s.push(o)):s.push(o);e.subs=s;let i=!0;for(const o of s)if(o.type!==ge.Type.EXACT){i=!1;break}return i&&s.length>1&&(e.ac16=new eC(s.map(o=>{const a=[];for(let c=0;c<o.str.length;c++)a.push(o.str.charCodeAt(c));return a})),e.ac8=new eC(s.map(o=>o.bytes))),e}return e}},Zt=class{constructor(r=0,e=0){this.head=r,this.tail=e}},vb=class{constructor(){this.inst=[],this.start=0,this.numCap=2,this.lbStarts=[],this.numLb=0}getInst(r){return this.inst[r]}numInst(){return this.inst.length}addInst(r){this.inst.push(new k(r))}skipNop(r){let e=this.inst[r];for(;e.op===k.NOP||e.op===k.CAPTURE;)e=this.inst[r],r=e.out;return e}prefix(){let r="",e=this.skipNop(this.start);if(!k.isRuneOp(e.op)||e.runes.length!==1)return[e.op===k.MATCH,r];for(;k.isRuneOp(e.op)&&e.runes.length===1&&!(e.arg&G.FOLD_CASE);)r+=String.fromCodePoint(e.runes[0]),e=this.skipNop(e.out);return[e.op===k.MATCH,r]}startCond(){let r=0,e=this.start;e:for(;;){const t=this.inst[e];switch(t.op){case k.EMPTY_WIDTH:r|=t.arg;break;case k.FAIL:return-1;case k.CAPTURE:case k.NOP:break;default:break e}e=t.out}return r}patch(r,e){let t=r.head;for(;t!==0;){const n=this.inst[t>>1];t&1?(t=n.arg,n.arg=e):(t=n.out,n.out=e)}}append(r,e){if(r.head===0)return e;if(e.head===0)return r;const t=this.inst[r.tail>>1];return r.tail&1?t.arg=e.head:t.out=e.head,new Zt(r.head,e.tail)}toString(){let r="";for(let e=0;e<this.inst.length;e++){const t=r.length;r+=e,e===this.start&&(r+="*"),r+="        ".substring(r.length-t),r+=this.inst[e],r+=`
`}return r}},bc=class{constructor(r=0,e=new Zt,t=!1){this.i=r,this.out=e,this.nullable=t}},Rb=class oi{static ANY_RUNE_NOT_NL(){return[0,L.CODES.get(`
`)-1,L.CODES.get(`
`)+1,X.MAX_RUNE]}static ANY_RUNE(){return[0,X.MAX_RUNE]}static compileRegexp(e){const t=new oi,n=t.compile(e);return t.prog.patch(n.out,t.newInst(k.MATCH).i),t.prog.start=n.i,t.prog}static compileSet(e){const t=new oi;if(e.length===0)return t.prog.start=t.newInst(k.FAIL).i,t.prog;let n=[];for(let i=0;i<e.length;i++){const o=t.compile(e[i]),a=t.newInst(k.MATCH);t.prog.getInst(a.i).arg=i,t.prog.patch(o.out,a.i),n.push(o.i)}let s=n[0];for(let i=1;i<n.length;i++){const o=t.newInst(k.ALT),a=t.prog.getInst(o.i);a.out=s,a.arg=n[i],s=o.i}return t.prog.start=s,t.prog}constructor(){this.prog=new vb,this.newInst(k.FAIL)}newInst(e){return this.prog.addInst(e),new bc(this.prog.numInst()-1,new Zt,!0)}nop(){const e=this.newInst(k.NOP);return e.out=new Zt(e.i<<1,e.i<<1),e}fail(){return new bc}cap(e){const t=this.newInst(k.CAPTURE);return t.out=new Zt(t.i<<1,t.i<<1),this.prog.getInst(t.i).arg=e,this.prog.numCap<e+1&&(this.prog.numCap=e+1),t}cat(e,t){return e.i===0||t.i===0?this.fail():(this.prog.patch(e.out,t.i),new bc(e.i,t.out,e.nullable&&t.nullable))}alt(e,t){if(e.i===0)return t;if(t.i===0)return e;const n=this.newInst(k.ALT),s=this.prog.getInst(n.i);return s.out=e.i,s.arg=t.i,n.out=this.prog.append(e.out,t.out),n.nullable=e.nullable||t.nullable,n}loop(e,t){const n=this.newInst(k.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new Zt(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new Zt(n.i<<1|1,n.i<<1|1)),this.prog.patch(e.out,n.i),n}quest(e,t){const n=this.newInst(k.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new Zt(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new Zt(n.i<<1|1,n.i<<1|1)),n.out=this.prog.append(n.out,e.out),n}star(e,t){return e.nullable?this.quest(this.plus(e,t),t):this.loop(e,t)}plus(e,t){return new bc(e.i,this.loop(e,t).out,e.nullable)}empty(e){const t=this.newInst(k.EMPTY_WIDTH);return this.prog.getInst(t.i).arg=e,t.out=new Zt(t.i<<1,t.i<<1),t}rune(e,t){const n=this.newInst(k.RUNE);n.nullable=!1;const s=this.prog.getInst(n.i);return s.runes=e,t&=G.FOLD_CASE,(e.length!==1||X.simpleFold(e[0])===e[0])&&(t&=-2),s.arg=t,n.out=new Zt(n.i<<1,n.i<<1),!(t&G.FOLD_CASE)&&e.length===1||e.length===2&&e[0]===e[1]?s.op=k.RUNE1:e.length===2&&e[0]===0&&e[1]===X.MAX_RUNE?s.op=k.RUNE_ANY:e.length===4&&e[0]===0&&e[1]===L.CODES.get(`
`)-1&&e[2]===L.CODES.get(`
`)+1&&e[3]===X.MAX_RUNE&&(s.op=k.RUNE_ANY_NOT_NL),n}lookBehind(e,t){const n=this.newInst(k.LB_WRITE);this.prog.getInst(n.i).arg=t;const s=this.rune(oi.ANY_RUNE(),0),i=this.star(s,!0),o=this.cat(i,e);this.prog.patch(o.out,n.i);const a=this.newInst(k.LB_CHECK);return this.prog.getInst(a.i).arg=t,this.prog.lbStarts.push(o.i),Math.abs(t)>this.prog.numLb&&(this.prog.numLb=Math.abs(t)),a.out=new Zt(a.i<<1,a.i<<1),a}compile(e){switch(e.op){case A.Op.NO_MATCH:return this.fail();case A.Op.EMPTY_MATCH:return this.nop();case A.Op.LITERAL:if(e.runes.length===0)return this.nop();{let t=null;for(let n of e.runes){const s=this.rune([n],e.flags);t=t===null?s:this.cat(t,s)}return t}case A.Op.CHAR_CLASS:return this.rune(e.runes,e.flags);case A.Op.ANY_CHAR_NOT_NL:return this.rune(oi.ANY_RUNE_NOT_NL(),0);case A.Op.ANY_CHAR:return this.rune(oi.ANY_RUNE(),0);case A.Op.BEGIN_LINE:return this.empty(ee.EMPTY_BEGIN_LINE);case A.Op.END_LINE:return this.empty(ee.EMPTY_END_LINE);case A.Op.BEGIN_TEXT:return this.empty(ee.EMPTY_BEGIN_TEXT);case A.Op.END_TEXT:return this.empty(ee.EMPTY_END_TEXT);case A.Op.WORD_BOUNDARY:return this.empty(ee.EMPTY_WORD_BOUNDARY);case A.Op.NO_WORD_BOUNDARY:return this.empty(ee.EMPTY_NO_WORD_BOUNDARY);case A.Op.PLB:case A.Op.NLB:return this.lookBehind(this.compile(e.subs[0]),e.lb);case A.Op.CAPTURE:{const t=this.cap(e.cap<<1),n=this.compile(e.subs[0]),s=this.cap(e.cap<<1|1);return this.cat(this.cat(t,n),s)}case A.Op.STAR:return this.star(this.compile(e.subs[0]),(e.flags&G.NON_GREEDY)!==0);case A.Op.PLUS:return this.plus(this.compile(e.subs[0]),(e.flags&G.NON_GREEDY)!==0);case A.Op.QUEST:return this.quest(this.compile(e.subs[0]),(e.flags&G.NON_GREEDY)!==0);case A.Op.CONCAT:if(e.subs.length===0)return this.nop();{let t=null;for(let n of e.subs){const s=this.compile(n);t=t===null?s:this.cat(t,s)}return t}case A.Op.ALTERNATE:if(e.subs.length===0)return this.nop();{let t=null;for(let n of e.subs){const s=this.compile(n);t=t===null?s:this.alt(t,s)}return t}default:throw new Bb("regexp: unhandled case in compile")}}},bb=class qt{static simplify(e){if(e===null)return null;switch(e.op){case A.Op.PLB:case A.Op.NLB:case A.Op.CAPTURE:{const t=qt.simplify(e.subs[0]);if(t!==e.subs[0]){const n=A.fromRegexp(e);return n.runes=[],n.subs=[t],n}return e}case A.Op.CONCAT:case A.Op.ALTERNATE:{const t=[];let n=!1;for(let s=0;s<e.subs.length;s++){const i=e.subs[s],o=qt.simplify(i);if(o!==i&&(n=!0),e.op===A.Op.CONCAT){if(o.op===A.Op.NO_MATCH)return new A(A.Op.NO_MATCH);if(o.op===A.Op.EMPTY_MATCH){n=!0;continue}if(o.op===A.Op.CONCAT){n=!0;for(let a=0;a<o.subs.length;a++)t.push(o.subs[a]);continue}}else if(e.op===A.Op.ALTERNATE){if(o.op===A.Op.NO_MATCH){n=!0;continue}if(o.op===A.Op.ALTERNATE){n=!0;for(let a=0;a<o.subs.length;a++)t.push(o.subs[a]);continue}}t.push(o)}if(n){if(t.length===0)return new A(e.op===A.Op.CONCAT?A.Op.EMPTY_MATCH:A.Op.NO_MATCH);if(t.length===1)return t[0];const s=A.fromRegexp(e);return s.runes=[],s.subs=t,s}return e}case A.Op.CHAR_CLASS:return e.runes===null?e:e.runes.length===0?new A(A.Op.NO_MATCH):e.runes.length===2&&e.runes[0]===0&&e.runes[1]===X.MAX_RUNE?new A(A.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===L.CODES.get(`
`)-1&&e.runes[2]===L.CODES.get(`
`)+1&&e.runes[3]===X.MAX_RUNE?new A(A.Op.ANY_CHAR_NOT_NL):e;case A.Op.STAR:case A.Op.PLUS:case A.Op.QUEST:{const t=qt.simplify(e.subs[0]);return qt.simplify1(e.op,e.flags,t,e)}case A.Op.REPEAT:{if(e.min===0&&e.max===0)return new A(A.Op.EMPTY_MATCH);const t=qt.simplify(e.subs[0]);if(e.max===-1){if(e.min===0)return qt.simplify1(A.Op.STAR,e.flags,t,null);if(e.min===1)return qt.simplify1(A.Op.PLUS,e.flags,t,null);const s=new A(A.Op.CONCAT),i=[];for(let o=0;o<e.min-1;o++)i.push(t);return i.push(qt.simplify1(A.Op.PLUS,e.flags,t,null)),s.subs=i.slice(0),qt.simplify(s)}if(e.min===1&&e.max===1)return t;let n=null;if(e.min>0){n=[];for(let s=0;s<e.min;s++)n.push(t)}if(e.max>e.min){let s=qt.simplify1(A.Op.QUEST,e.flags,t,null);for(let i=e.min+1;i<e.max;i++){const o=new A(A.Op.CONCAT);o.subs=[t,s],s=qt.simplify1(A.Op.QUEST,e.flags,o,null)}if(n===null)return s;n.push(s)}if(n!==null){const s=new A(A.Op.CONCAT);return s.subs=n.slice(0),qt.simplify(s)}return new A(A.Op.NO_MATCH)}}return e}static simplify1(e,t,n,s){if(n.op===A.Op.EMPTY_MATCH)return n;if(n.op===A.Op.NO_MATCH)return e===A.Op.PLUS?n:new A(A.Op.EMPTY_MATCH);if(e===n.op&&(t&G.NON_GREEDY)===(n.flags&G.NON_GREEDY))return n;if(s!==null&&s.op===e&&(s.flags&G.NON_GREEDY)===(t&G.NON_GREEDY)&&n===s.subs[0])return s;const i=new A(e);return i.flags=t,i.subs=[n],i}},Ce=class{constructor(r,e){this.sign=r,this.cls=e}};const tC=[48,57],nC=[9,10,12,13,32,32],rC=[48,57,65,90,95,95,97,122],sC=new Map([["\\d",new Ce(1,tC)],["\\D",new Ce(-1,tC)],["\\s",new Ce(1,nC)],["\\S",new Ce(-1,nC)],["\\w",new Ce(1,rC)],["\\W",new Ce(-1,rC)]]),iC=[48,57,65,90,97,122],oC=[65,90,97,122],aC=[0,127],cC=[9,9,32,32],uC=[0,31,127,127],lC=[48,57],BC=[33,126],hC=[97,122],dC=[32,126],fC=[33,47,58,64,91,96,123,126],pC=[9,13,32,32],CC=[65,90],gC=[48,57,65,90,95,95,97,122],mC=[48,57,65,70,97,102],_C=new Map([["[:alnum:]",new Ce(1,iC)],["[:^alnum:]",new Ce(-1,iC)],["[:alpha:]",new Ce(1,oC)],["[:^alpha:]",new Ce(-1,oC)],["[:ascii:]",new Ce(1,aC)],["[:^ascii:]",new Ce(-1,aC)],["[:blank:]",new Ce(1,cC)],["[:^blank:]",new Ce(-1,cC)],["[:cntrl:]",new Ce(1,uC)],["[:^cntrl:]",new Ce(-1,uC)],["[:digit:]",new Ce(1,lC)],["[:^digit:]",new Ce(-1,lC)],["[:graph:]",new Ce(1,BC)],["[:^graph:]",new Ce(-1,BC)],["[:lower:]",new Ce(1,hC)],["[:^lower:]",new Ce(-1,hC)],["[:print:]",new Ce(1,dC)],["[:^print:]",new Ce(-1,dC)],["[:punct:]",new Ce(1,fC)],["[:^punct:]",new Ce(-1,fC)],["[:space:]",new Ce(1,pC)],["[:^space:]",new Ce(-1,pC)],["[:upper:]",new Ce(1,CC)],["[:^upper:]",new Ce(-1,CC)],["[:word:]",new Ce(1,gC)],["[:^word:]",new Ce(-1,gC)],["[:xdigit:]",new Ce(1,mC)],["[:^xdigit:]",new Ce(-1,mC)]]);var Br=class mr{static charClassToString(e,t){let n="[";for(let s=0;s<t;s+=2){s>0&&(n+=" ");const i=e[s],o=e[s+1];i===o?n+=`0x${i.toString(16)}`:n+=`0x${i.toString(16)}-0x${o.toString(16)}`}return n+="]",n}static cmp(e,t,n,s){const i=e[t]-n;return i!==0?i:s-e[t+1]}static qsortIntPair(e,t,n){const s=((t+n)/2|0)&-2,i=e[s],o=e[s+1];let a=t,c=n;for(;a<=c;){for(;a<n&&mr.cmp(e,a,i,o)<0;)a+=2;for(;c>t&&mr.cmp(e,c,i,o)>0;)c-=2;if(a<=c){if(a!==c){let l=e[a];e[a]=e[c],e[c]=l,l=e[a+1],e[a+1]=e[c+1],e[c+1]=l}a+=2,c-=2}}t<c&&mr.qsortIntPair(e,t,c),a<n&&mr.qsortIntPair(e,a,n)}constructor(e=ee.emptyInts()){this.r=e,this.len=e.length}toArray(){return this.len===this.r.length?this.r:this.r.slice(0,this.len)}cleanClass(){if(this.len<4)return this;mr.qsortIntPair(this.r,0,this.len-2);let e=2;for(let t=2;t<this.len;t+=2){const n=this.r[t],s=this.r[t+1];if(n<=this.r[e-1]+1){s>this.r[e-1]&&(this.r[e-1]=s);continue}this.r[e]=n,this.r[e+1]=s,e+=2}return this.len=e,this}appendLiteral(e,t){return t&G.FOLD_CASE?this.appendFoldedRange(e,e):this.appendRange(e,e)}appendRange(e,t){if(this.len>0){for(let n=2;n<=4;n+=2)if(this.len>=n){const s=this.r[this.len-n],i=this.r[this.len-n+1];if(e<=i+1&&s<=t+1)return e<s&&(this.r[this.len-n]=e),t>i&&(this.r[this.len-n+1]=t),this}}return this.r[this.len++]=e,this.r[this.len++]=t,this}appendFoldedRange(e,t){if(e<=X.MIN_FOLD&&t>=X.MAX_FOLD)return this.appendRange(e,t);if(t<X.MIN_FOLD||e>X.MAX_FOLD)return this.appendRange(e,t);e<X.MIN_FOLD&&(this.appendRange(e,X.MIN_FOLD-1),e=X.MIN_FOLD),t>X.MAX_FOLD&&(this.appendRange(X.MAX_FOLD+1,t),t=X.MAX_FOLD);for(let n=e;n<=t;n++){this.appendRange(n,n);for(let s=X.simpleFold(n);s!==n;s=X.simpleFold(s))this.appendRange(s,s)}return this}appendClass(e){for(let t=0;t<e.length;t+=2)this.appendRange(e[t],e[t+1]);return this}appendFoldedClass(e){for(let t=0;t<e.length;t+=2)this.appendFoldedRange(e[t],e[t+1]);return this}appendNegatedClass(e){let t=0;for(let n=0;n<e.length;n+=2){const s=e[n],i=e[n+1];t<=s-1&&this.appendRange(t,s-1),t=i+1}return t<=X.MAX_RUNE&&this.appendRange(t,X.MAX_RUNE),this}appendTable(e){for(let t=0;t<e.length;++t){const n=e.getLo(t),s=e.getHi(t),i=e.getStride(t);if(i===1){this.appendRange(n,s);continue}for(let o=n;o<=s;o+=i)this.appendRange(o,o)}return this}appendNegatedTable(e){let t=0;for(let n=0;n<e.length;++n){const s=e.getLo(n),i=e.getHi(n),o=e.getStride(n);if(o===1){t<=s-1&&this.appendRange(t,s-1),t=i+1;continue}for(let a=s;a<=i;a+=o)t<=a-1&&this.appendRange(t,a-1),t=a+1}return t<=X.MAX_RUNE&&this.appendRange(t,X.MAX_RUNE),this}appendTableWithSign(e,t){return t<0?this.appendNegatedTable(e):this.appendTable(e)}negateClass(){let e=0,t=0;for(let n=0;n<this.len;n+=2){const s=this.r[n],i=this.r[n+1];e<=s-1&&(this.r[t]=e,this.r[t+1]=s-1,t+=2),e=i+1}return this.len=t,e<=X.MAX_RUNE&&(this.r[this.len++]=e,this.r[this.len++]=X.MAX_RUNE),this}appendClassWithSign(e,t){return t<0?this.appendNegatedClass(e):this.appendClass(e)}appendGroup(e,t){let n=e.cls;return t&&(n=new mr().appendFoldedClass(n).cleanClass().toArray()),this.appendClassWithSign(n,e.sign)}toString(){return mr.charClassToString(this.r,this.len)}},Pb=class{constructor(r){this.str=r,this.position=0}pos(){return this.position}rewindTo(r){this.position=r}more(){return this.position<this.str.length}peek(){return this.str.codePointAt(this.position)}skip(r){this.position+=r}skipString(r){this.position+=r.length}pop(){const r=this.str.codePointAt(this.position);return this.position+=ee.charCount(r),r}lookingAt(r){return this.str.startsWith(r,this.position)}rest(){return this.str.substring(this.position)}from(r){return this.str.substring(r,this.position)}toString(){return this.rest()}},J,Sb=(J=class{static unicodeTable(e){return e==="Any"?{tab:J.ANY_TABLE,fold:J.ANY_TABLE,sign:1}:e==="Ascii"?{tab:J.ASCII_TABLE,fold:J.ASCII_FOLD_TABLE,sign:1}:e==="Assigned"?{tab:Ft.CATEGORIES.get("Cn"),fold:Ft.CATEGORIES.get("Cn"),sign:-1}:e==="Lc"?{tab:Ft.CATEGORIES.get("LC"),fold:Ft.FOLD_CATEGORIES.get("LC"),sign:1}:Ft.CATEGORIES.has(e)?{tab:Ft.CATEGORIES.get(e),fold:Ft.FOLD_CATEGORIES.get(e),sign:1}:Ft.SCRIPTS.has(e)?{tab:Ft.SCRIPTS.get(e),fold:Ft.FOLD_SCRIPT.get(e),sign:1}:null}static minFoldRune(e){if(e<X.MIN_FOLD||e>X.MAX_FOLD)return e;let t=e;const n=e;for(e=X.simpleFold(e);e!==n;e=X.simpleFold(e))t>e&&(t=e);return t}static leadingRegexp(e){if(e.op===A.Op.EMPTY_MATCH)return null;if(e.op===A.Op.CONCAT&&e.subs.length>0){const t=e.subs[0];return t.op===A.Op.EMPTY_MATCH?null:t}return e}static literalRegexp(e,t){const n=new A(A.Op.LITERAL);return n.flags=t,n.runes=ee.stringToRunes(e),n}static parse(e,t){return new J(e,t).parseInternal()}static parseRepeat(e){const t=e.pos();if(!e.more()||!e.lookingAt("{"))return-1;e.skip(1);const n=J.parseInt(e);if(n===-1||!e.more())return-1;let s;if(!e.lookingAt(","))s=n;else{if(e.skip(1),!e.more())return-1;if(e.lookingAt("}"))s=-1;else if((s=J.parseInt(e))===-1)return-1}if(!e.more()||!e.lookingAt("}"))return-1;if(e.skip(1),n<0||n>1e3||s===-2||s>1e3||s>=0&&n>s)throw new be(J.ERR_INVALID_REPEAT_SIZE,e.from(t));return n<<16|s&X.MAX_BMP}static isValidCaptureName(e){if(e.length===0)return!1;for(let t=0;t<e.length;t++){const n=e.codePointAt(t);if(n!==L.CODES.get("_")&&!ee.isalnum(n))return!1}return!0}static parseInt(e){const t=e.pos();for(;e.more()&&e.peek()>=L.CODES.get("0")&&e.peek()<=L.CODES.get("9");)e.skip(1);const n=e.from(t);return n.length===0||n.length>1&&n.codePointAt(0)===L.CODES.get("0")?-1:n.length>8?-2:parseInt(n,10)}static isCharClass(e){return e.op===A.Op.LITERAL&&e.runes.length===1||e.op===A.Op.CHAR_CLASS||e.op===A.Op.ANY_CHAR_NOT_NL||e.op===A.Op.ANY_CHAR}static matchRune(e,t){switch(e.op){case A.Op.LITERAL:return e.runes.length===1&&e.runes[0]===t;case A.Op.CHAR_CLASS:for(let n=0;n<e.runes.length;n+=2)if(e.runes[n]<=t&&t<=e.runes[n+1])return!0;return!1;case A.Op.ANY_CHAR_NOT_NL:return t!==L.CODES.get(`
`);case A.Op.ANY_CHAR:return!0}return!1}static mergeCharClass(e,t){switch(e.op){case A.Op.ANY_CHAR:break;case A.Op.ANY_CHAR_NOT_NL:J.matchRune(t,L.CODES.get(`
`))&&(e.op=A.Op.ANY_CHAR);break;case A.Op.CHAR_CLASS:t.op===A.Op.LITERAL?e.runes=new Br(e.runes).appendLiteral(t.runes[0],t.flags).toArray():e.runes=new Br(e.runes).appendClass(t.runes).toArray();break;case A.Op.LITERAL:if(t.runes[0]===e.runes[0]&&t.flags===e.flags)break;e.op=A.Op.CHAR_CLASS,e.runes=new Br().appendLiteral(e.runes[0],e.flags).appendLiteral(t.runes[0],t.flags).toArray();break}}static parseEscape(e){const t=e.pos();if(e.skip(1),!e.more())throw new be(J.ERR_TRAILING_BACKSLASH);let n=e.pop();e:switch(n){case L.CODES.get("1"):case L.CODES.get("2"):case L.CODES.get("3"):case L.CODES.get("4"):case L.CODES.get("5"):case L.CODES.get("6"):case L.CODES.get("7"):if(!e.more()||e.peek()<L.CODES.get("0")||e.peek()>L.CODES.get("7"))break;case L.CODES.get("0"):{let s=n-L.CODES.get("0");for(let i=1;i<3&&!(!e.more()||e.peek()<L.CODES.get("0")||e.peek()>L.CODES.get("7"));i++)s=s*8+e.peek()-L.CODES.get("0"),e.skip(1);return s}case L.CODES.get("x"):{if(!e.more())break;if(n=e.pop(),n===L.CODES.get("{")){let o=0,a=0;for(;;){if(!e.more())break e;if(n=e.pop(),n===L.CODES.get("}"))break;const c=ee.unhex(n);if(c<0||(a=a*16+c,a>X.MAX_RUNE))break e;o++}if(o===0)break e;return a}const s=ee.unhex(n);if(!e.more())break;n=e.pop();const i=ee.unhex(n);if(s<0||i<0)break;return s*16+i}case L.CODES.get("a"):return L.CODES.get("\x07");case L.CODES.get("f"):return L.CODES.get("\f");case L.CODES.get("n"):return L.CODES.get(`
`);case L.CODES.get("r"):return L.CODES.get("\r");case L.CODES.get("t"):return L.CODES.get("	");case L.CODES.get("v"):return L.CODES.get("\v");default:if(n<=X.MAX_ASCII&&!ee.isalnum(n))return n;break}throw new be(J.ERR_INVALID_ESCAPE,e.from(t))}static parseClassChar(e,t){if(!e.more())throw new be(J.ERR_MISSING_BRACKET,e.from(t));return e.lookingAt("\\")?J.parseEscape(e):e.pop()}static concatRunes(e,t){for(let n=0;n<t.length;n++)e.push(t[n]);return e}static hasCapture(e){if(e===null)return!1;if(e.op===A.Op.CAPTURE)return!0;if(e.subs){for(let t of e.subs)if(J.hasCapture(t))return!0}return!1}constructor(e,t=0){this.wholeRegexp=e,this.flags=t,this.numCap=0,this.namedGroups=Object.create(null),this.stack=[],this.free=null,this.numRegexp=0,this.numRunes=0,this.repeats=0,this.height=null,this.size=null,this.nlb=0}newRegexp(e){let t=this.free;return t!==null&&t.subs!==null&&t.subs.length>0?(this.free=t.subs[0],t.reinit(),t.op=e):(t=new A(e),this.numRegexp+=1),t}reuse(e){this.height!==null&&this.height.has(e)&&this.height.delete(e),e.subs!==null&&e.subs.length>0&&(e.subs[0]=this.free),this.free=e}checkLimits(e){if(this.numRunes>J.MAX_RUNES)throw new be(J.ERR_LARGE);this.checkSize(e),this.checkHeight(e)}checkSize(e){if(this.size===null){if(this.repeats===0&&(this.repeats=1),e.op===A.Op.REPEAT){let t=e.max;t===-1&&(t=e.min),t<=0&&(t=1),t>Math.floor(J.MAX_SIZE/this.repeats)?this.repeats=J.MAX_SIZE:this.repeats*=t}if(this.numRegexp<Math.floor(J.MAX_SIZE/this.repeats))return;this.size=new Map;for(let t of this.stack)this.checkSize(t)}if(this.calcSize(e,!0)>J.MAX_SIZE)throw new be(J.ERR_LARGE)}calcSize(e,t=!1){if(!t&&this.size!==null&&this.size.has(e))return this.size.get(e);let n=0;switch(e.op){case A.Op.LITERAL:n=e.runes.length;break;case A.Op.PLB:case A.Op.NLB:case A.Op.CAPTURE:case A.Op.STAR:n=2+this.calcSize(e.subs[0]);break;case A.Op.PLUS:case A.Op.QUEST:n=1+this.calcSize(e.subs[0]);break;case A.Op.CONCAT:for(let s of e.subs)n=n+this.calcSize(s);break;case A.Op.ALTERNATE:for(let s of e.subs)n=n+this.calcSize(s);e.subs.length>1&&(n=n+e.subs.length-1);break;case A.Op.REPEAT:{let s=this.calcSize(e.subs[0]);if(e.max===-1){e.min===0?n=2+s:n=1+e.min*s;break}n=e.max*s+(e.max-e.min);break}}return n=Math.max(1,n),this.size===null&&(this.size=new Map),this.size.set(e,n),n}checkHeight(e){if(!(this.numRegexp<J.MAX_HEIGHT)){if(this.height===null){this.height=new Map;for(let t of this.stack)this.checkHeight(t)}if(this.calcHeight(e,!0)>J.MAX_HEIGHT)throw new be(J.ERR_NESTING_DEPTH)}}calcHeight(e,t=!1){if(!t&&this.height!==null&&this.height.has(e))return this.height.get(e);let n=1;for(let s of e.subs){const i=this.calcHeight(s);n<1+i&&(n=1+i)}return this.height===null&&(this.height=new Map),this.height.set(e,n),n}pop(){return this.stack.pop()}popToPseudo(){const e=this.stack.length;let t=e;for(;t>0&&!A.isPseudoOp(this.stack[t-1].op);)t--;const n=this.stack.slice(t,e);return this.stack=this.stack.slice(0,t),n}push(e){if(this.numRunes+=e.runes.length,e.op===A.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]===e.runes[1]){if(this.maybeConcat(e.runes[0],this.flags&-2))return null;e.op=A.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags&-2}else if(e.op===A.Op.CHAR_CLASS&&e.runes.length===4&&e.runes[0]===e.runes[1]&&e.runes[2]===e.runes[3]&&X.simpleFold(e.runes[0])===e.runes[2]&&X.simpleFold(e.runes[2])===e.runes[0]||e.op===A.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]+1===e.runes[1]&&X.simpleFold(e.runes[0])===e.runes[1]&&X.simpleFold(e.runes[1])===e.runes[0]){if(this.maybeConcat(e.runes[0],this.flags|G.FOLD_CASE))return null;e.op=A.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags|G.FOLD_CASE}else this.maybeConcat(-1,0);return this.stack.push(e),this.checkLimits(e),e}maybeConcat(e,t){const n=this.stack.length;if(n<2)return!1;const s=this.stack[n-1],i=this.stack[n-2];return s.op!==A.Op.LITERAL||i.op!==A.Op.LITERAL||(s.flags&G.FOLD_CASE)!==(i.flags&G.FOLD_CASE)?!1:(i.runes=J.concatRunes(i.runes,s.runes),e>=0?(s.runes=[e],s.flags=t,!0):(this.pop(),this.reuse(s),!1))}newLiteral(e,t){const n=this.newRegexp(A.Op.LITERAL);return n.flags=t,t&G.FOLD_CASE&&(e=J.minFoldRune(e)),n.runes=[e],n}literal(e){this.push(this.newLiteral(e,this.flags))}op(e){const t=this.newRegexp(e);return t.flags=this.flags,this.push(t)}repeat(e,t,n,s,i,o){let a=this.flags;if(a&G.PERL_X&&(i.more()&&i.lookingAt("?")&&(i.skip(1),a^=G.NON_GREEDY),o!==-1))throw new be(J.ERR_INVALID_REPEAT_OP,i.from(o));const c=this.stack.length;if(c===0)throw new be(J.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));const l=this.stack[c-1];if(A.isPseudoOp(l.op))throw new be(J.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));const B=this.newRegexp(e);if(B.min=t,B.max=n,B.flags=a,B.subs=[l],this.stack[c-1]=B,this.checkLimits(B),e===A.Op.REPEAT&&(t>=2||n>=2)&&!this.repeatIsValid(B,1e3))throw new be(J.ERR_INVALID_REPEAT_SIZE,i.from(s))}repeatIsValid(e,t){if(e.op===A.Op.REPEAT){let n=e.max;if(n===0)return!0;if(n<0&&(n=e.min),n>t)return!1;n>0&&(t=Math.trunc(t/n))}for(let n of e.subs)if(!this.repeatIsValid(n,t))return!1;return!0}concat(){this.maybeConcat(-1,0);const e=this.popToPseudo();return e.length===0?this.push(this.newRegexp(A.Op.EMPTY_MATCH)):this.push(this.collapse(e,A.Op.CONCAT))}alternate(){const e=this.popToPseudo();return e.length>0&&this.cleanAlt(e[e.length-1]),e.length===0?this.push(this.newRegexp(A.Op.NO_MATCH)):this.push(this.collapse(e,A.Op.ALTERNATE))}cleanAlt(e){e.op===A.Op.CHAR_CLASS&&(e.runes=new Br(e.runes).cleanClass().toArray(),e.runes.length===2&&e.runes[0]===0&&e.runes[1]===X.MAX_RUNE?(e.runes=[],e.op=A.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===L.CODES.get(`
`)-1&&e.runes[2]===L.CODES.get(`
`)+1&&e.runes[3]===X.MAX_RUNE&&(e.runes=[],e.op=A.Op.ANY_CHAR_NOT_NL))}collapse(e,t){if(e.length===1)return e[0];let n=0;for(let a of e)n+=a.op===t?a.subs.length:1;let s=new Array(n).fill(null),i=0;for(let a of e)if(a.op===t){for(let c=0;c<a.subs.length;c++)s[i++]=a.subs[c];this.reuse(a)}else s[i++]=a;let o=this.newRegexp(t);if(o.subs=s,t===A.Op.ALTERNATE&&(o.subs=this.factor(o.subs),o.subs.length===1)){const a=o;o=o.subs[0],this.reuse(a)}return o}factor(e){if(e.length<2)return e;let t=0,n=e.length,s=0,i=null,o=0,a=0,c=0;for(let B=0;B<=n;B++){let d=null,p=0,g=0;if(B<n){let w=e[t+B];if(w.op===A.Op.CONCAT&&w.subs.length>0&&(w=w.subs[0]),w.op===A.Op.LITERAL&&(d=w.runes,p=w.runes.length,g=w.flags&G.FOLD_CASE),g===a){let N=0;for(;N<o&&N<p&&i[N]===d[N];)N++;if(N>0){o=N;continue}}}if(B!==c)if(B===c+1)e[s++]=e[t+c];else{const w=this.newRegexp(A.Op.LITERAL);w.flags=a,w.runes=i.slice(0,o);for(let W=c;W<B;W++)e[t+W]=this.removeLeadingString(e[t+W],o),this.checkLimits(e[t+W]);const N=this.collapse(e.slice(t+c,t+B),A.Op.ALTERNATE),M=this.newRegexp(A.Op.CONCAT);M.subs=[w,N],e[s++]=M}c=B,i=d,o=p,a=g}n=s,t=0,c=0,s=0;let l=null;for(let B=0;B<=n;B++){let d=null;if(!(B<n&&(d=J.leadingRegexp(e[t+B]),l!==null&&l.equals(d)&&(J.isCharClass(l)||l.op===A.Op.REPEAT&&l.min===l.max&&J.isCharClass(l.subs[0]))))){if(B!==c)if(B===c+1)e[s++]=e[t+c];else{const p=l;for(let N=c;N<B;N++){const M=N!==c;e[t+N]=this.removeLeadingRegexp(e[t+N],M),this.checkLimits(e[t+N])}const g=this.collapse(e.slice(t+c,t+B),A.Op.ALTERNATE),w=this.newRegexp(A.Op.CONCAT);w.subs=[p,g],e[s++]=w}c=B,l=d}}n=s,t=0,c=0,s=0;for(let B=0;B<=n;B++)if(!(B<n&&J.isCharClass(e[t+B]))){if(B!==c)if(B===c+1)e[s++]=e[t+c];else{let d=c;for(let g=c+1;g<B;g++){const w=e[t+d],N=e[t+g];(w.op<N.op||w.op===N.op&&(w.runes!==null?w.runes.length:0)<(N.runes!==null?N.runes.length:0))&&(d=g)}const p=e[t+c];e[t+c]=e[t+d],e[t+d]=p;for(let g=c+1;g<B;g++)J.mergeCharClass(e[t+c],e[t+g]),this.reuse(e[t+g]);this.cleanAlt(e[t+c]),e[s++]=e[t+c]}B<n&&(e[s++]=e[t+B]),c=B+1}n=s,t=0,c=0,s=0;for(let B=0;B<n;++B)B+1<n&&e[t+B].op===A.Op.EMPTY_MATCH&&e[t+B+1].op===A.Op.EMPTY_MATCH||(e[s++]=e[t+B]);return n=s,t=0,e.slice(t,n)}removeLeadingString(e,t){if(e.op===A.Op.CONCAT&&e.subs.length>0){const n=this.removeLeadingString(e.subs[0],t);if(e.subs[0]=n,n.op===A.Op.EMPTY_MATCH)switch(this.reuse(n),e.subs.length){case 0:case 1:e.op=A.Op.EMPTY_MATCH,e.subs=A.emptySubs();break;case 2:{const s=e;e=e.subs[1],this.reuse(s);break}default:e.subs=e.subs.slice(1,e.subs.length);break}return e}return e.op===A.Op.LITERAL&&(e.runes=e.runes.slice(t,e.runes.length),e.runes.length===0&&(e.op=A.Op.EMPTY_MATCH)),e}removeLeadingRegexp(e,t){if(e.op===A.Op.CONCAT&&e.subs.length>0){switch(t&&this.reuse(e.subs[0]),e.subs=e.subs.slice(1,e.subs.length),e.subs.length){case 0:e.op=A.Op.EMPTY_MATCH,e.subs=A.emptySubs();break;case 1:{const n=e;e=e.subs[0],this.reuse(n);break}}return e}return t&&this.reuse(e),this.newRegexp(A.Op.EMPTY_MATCH)}parseInternal(){if(this.flags&G.LITERAL)return J.literalRegexp(this.wholeRegexp,this.flags);let e=-1,t=-1,n=-1;const s=new Pb(this.wholeRegexp);for(;s.more();){let i=-1;e:switch(s.peek()){case L.CODES.get("("):if(this.flags&G.LOOKBEHIND){if(s.lookingAt("(?<=")){this.parsePosLookBehind(),s.skip(4);break}if(s.lookingAt("(?<!")){this.parseNegLookBehind(),s.skip(4);break}}if(this.flags&G.PERL_X&&s.lookingAt("(?")){this.parsePerlFlags(s);break}this.op(A.Op.LEFT_PAREN).cap=++this.numCap,s.skip(1);break;case L.CODES.get("|"):this.parseVerticalBar(),s.skip(1);break;case L.CODES.get(")"):this.parseRightParen(),s.skip(1);break;case L.CODES.get("^"):this.flags&G.ONE_LINE?this.op(A.Op.BEGIN_TEXT):this.op(A.Op.BEGIN_LINE),s.skip(1);break;case L.CODES.get("$"):this.flags&G.ONE_LINE?this.op(A.Op.END_TEXT).flags|=G.WAS_DOLLAR:this.op(A.Op.END_LINE),s.skip(1);break;case L.CODES.get("."):this.flags&G.DOT_NL?this.op(A.Op.ANY_CHAR):this.op(A.Op.ANY_CHAR_NOT_NL),s.skip(1);break;case L.CODES.get("["):this.parseClass(s);break;case L.CODES.get("*"):case L.CODES.get("+"):case L.CODES.get("?"):{i=s.pos();let o=null;switch(s.pop()){case L.CODES.get("*"):o=A.Op.STAR;break;case L.CODES.get("+"):o=A.Op.PLUS;break;case L.CODES.get("?"):o=A.Op.QUEST;break}this.repeat(o,t,n,i,s,e);break}case L.CODES.get("{"):{i=s.pos();const o=J.parseRepeat(s);if(o<0){s.rewindTo(i),this.literal(s.pop());break}t=o>>16,n=(o&X.MAX_BMP)<<16>>16,this.repeat(A.Op.REPEAT,t,n,i,s,e);break}case L.CODES.get("\\"):{const o=s.pos();if(s.skip(1),this.flags&G.PERL_X&&s.more())switch(s.pop()){case L.CODES.get("A"):this.op(A.Op.BEGIN_TEXT);break e;case L.CODES.get("b"):this.op(A.Op.WORD_BOUNDARY);break e;case L.CODES.get("B"):this.op(A.Op.NO_WORD_BOUNDARY);break e;case L.CODES.get("C"):throw new be(J.ERR_INVALID_ESCAPE,"\\C");case L.CODES.get("Q"):{let l=s.rest();const B=l.indexOf("\\E");B>=0?(l=l.substring(0,B),s.skipString(l),s.skipString("\\E")):s.skipString(l);let d=0;for(;d<l.length;){const p=l.codePointAt(d);this.literal(p),d+=ee.charCount(p)}break e}case L.CODES.get("z"):this.op(A.Op.END_TEXT);break e;default:s.rewindTo(o);break}else s.rewindTo(o);const a=this.newRegexp(A.Op.CHAR_CLASS);if(a.flags=this.flags,s.lookingAt("\\p")||s.lookingAt("\\P")){const l=new Br;if(this.parseUnicodeClass(s,l)){a.runes=l.toArray(),this.push(a);break e}}const c=new Br;if(this.parsePerlClassEscape(s,c)){a.runes=c.toArray(),this.push(a);break e}s.rewindTo(o),this.reuse(a),this.literal(J.parseEscape(s));break}default:this.literal(s.pop());break}e=i}if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length!==1)throw new be(J.ERR_MISSING_PAREN,this.wholeRegexp);return this.stack[0].namedGroups=this.namedGroups,this.stack[0]}parsePerlFlags(e){const t=e.pos(),n=e.rest();if(n.startsWith("(?P<")||n.startsWith("(?<")){const a=n.charAt(2)==="P"?4:3,c=n.indexOf(">");if(c<0)throw new be(J.ERR_INVALID_NAMED_CAPTURE,n);const l=n.substring(a,c);if(e.skipString(l),e.skip(a+1),!J.isValidCaptureName(l))throw new be(J.ERR_INVALID_NAMED_CAPTURE,n.substring(0,c+1));const B=this.op(A.Op.LEFT_PAREN);if(B.cap=++this.numCap,this.namedGroups[l])throw new be(J.ERR_DUPLICATE_NAMED_CAPTURE,l);this.namedGroups[l]=this.numCap,B.name=l;return}e.skip(2);let s=this.flags,i=1,o=!1;e:for(;e.more();){const a=e.pop();switch(a){case L.CODES.get("i"):s|=G.FOLD_CASE,o=!0;break;case L.CODES.get("m"):s&=-17,o=!0;break;case L.CODES.get("s"):s|=G.DOT_NL,o=!0;break;case L.CODES.get("U"):s|=G.NON_GREEDY,o=!0;break;case L.CODES.get("-"):if(i<0)break e;i=-1,s=~s,o=!1;break;case L.CODES.get(":"):case L.CODES.get(")"):if(i<0){if(!o)break e;s=~s}a===L.CODES.get(":")&&this.op(A.Op.LEFT_PAREN),this.flags=s;return;default:break e}}throw new be(J.ERR_INVALID_PERL_OP,e.from(t))}parsePosLookBehind(){const e=this.newRegexp(A.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=++this.nlb,this.push(e)}parseNegLookBehind(){const e=this.newRegexp(A.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=-++this.nlb,this.push(e)}parseVerticalBar(){this.concat(),this.swapVerticalBar()||this.op(A.Op.VERTICAL_BAR)}swapVerticalBar(){const e=this.stack.length;if(e>=3&&this.stack[e-2].op===A.Op.VERTICAL_BAR&&J.isCharClass(this.stack[e-1])&&J.isCharClass(this.stack[e-3])){let t=this.stack[e-1],n=this.stack[e-3];if(t.op>n.op){const s=n;n=t,t=s,this.stack[e-3]=n}return J.mergeCharClass(n,t),this.reuse(t),this.pop(),!0}if(e>=2){const t=this.stack[e-1],n=this.stack[e-2];if(n.op===A.Op.VERTICAL_BAR)return e>=3&&this.cleanAlt(this.stack[e-3]),this.stack[e-2]=t,this.stack[e-1]=n,!0}return!1}parseRightParen(){if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length<2)throw new be(J.ERR_UNEXPECTED_PAREN,this.wholeRegexp);const e=this.pop(),t=this.pop();if(t.op!==A.Op.LEFT_PAREN)throw new be(J.ERR_UNEXPECTED_PAREN,this.wholeRegexp);if(this.flags=t.flags,t.lb!==0){if(J.hasCapture(e))throw new be(J.ERR_INVALID_CAPTURE_IN_LOOKBEHIND,this.wholeRegexp);t.lb>0?t.op=A.Op.PLB:t.op=A.Op.NLB,t.subs=[e],this.push(t);return}t.cap===0?this.push(e):(t.op=A.Op.CAPTURE,t.subs=[e],this.push(t))}parsePerlClassEscape(e,t){const n=e.pos();if(!(this.flags&G.PERL_X)||!e.more()||e.pop()!==L.CODES.get("\\")||!e.more())return!1;e.pop();const s=e.from(n),i=sC.has(s)?sC.get(s):null;return i===null?!1:(t.appendGroup(i,(this.flags&G.FOLD_CASE)!==0),!0)}parseNamedClass(e,t){const n=e.rest(),s=n.indexOf(":]");if(s<0)return!1;const i=n.substring(0,s+2);e.skipString(i);const o=_C.has(i)?_C.get(i):null;if(o===null)throw new be(J.ERR_INVALID_CHAR_RANGE,i);return t.appendGroup(o,(this.flags&G.FOLD_CASE)!==0),!0}parseUnicodeClass(e,t){const n=e.pos();if(!(this.flags&G.UNICODE_GROUPS)||!e.lookingAt("\\p")&&!e.lookingAt("\\P"))return!1;e.skip(1);let s=1,i=e.pop();if(i===L.CODES.get("P")&&(s=-1),!e.more())throw e.rewindTo(n),new be(J.ERR_INVALID_CHAR_RANGE,e.rest());i=e.pop();let o;if(i!==L.CODES.get("{"))o=ee.runeToString(i);else{const B=e.rest(),d=B.indexOf("}");if(d<0)throw e.rewindTo(n),new be(J.ERR_INVALID_CHAR_RANGE,e.rest());o=B.substring(0,d),e.skipString(o),e.skip(1)}o.length!==0&&o.codePointAt(0)===L.CODES.get("^")&&(s=0-s,o=o.substring(1));const a=J.unicodeTable(o);if(a===null)throw new be(J.ERR_INVALID_CHAR_RANGE,e.from(n));a.sign<0&&(s=0-s);const c=a.tab,l=a.fold;if(!(this.flags&G.FOLD_CASE)||l===null)t.appendTableWithSign(c,s);else{const B=new Br().appendTable(c).appendTable(l).cleanClass().toArray();t.appendClassWithSign(B,s)}return!0}parseClass(e){const t=e.pos();e.skip(1);const n=this.newRegexp(A.Op.CHAR_CLASS);n.flags=this.flags;const s=new Br;let i=1;e.more()&&e.lookingAt("^")&&(i=-1,e.skip(1),this.flags&G.CLASS_NL||s.appendRange(L.CODES.get(`
`),L.CODES.get(`
`)));let o=!0;for(;!e.more()||e.peek()!==L.CODES.get("]")||o;){if(e.more()&&e.lookingAt("-")&&!(this.flags&G.PERL_X)&&!o){const B=e.rest();if(B==="-"||!B.startsWith("-]"))throw e.rewindTo(t),new be(J.ERR_INVALID_CHAR_RANGE,e.rest())}o=!1;const a=e.pos();if(e.lookingAt("[:")){if(this.parseNamedClass(e,s))continue;e.rewindTo(a)}if(this.parseUnicodeClass(e,s)||this.parsePerlClassEscape(e,s))continue;e.rewindTo(a);const c=J.parseClassChar(e,t);let l=c;if(e.more()&&e.lookingAt("-")){if(e.skip(1),e.more()&&e.lookingAt("]"))e.skip(-1);else if(l=J.parseClassChar(e,t),l<c)throw new be(J.ERR_INVALID_CHAR_RANGE,e.from(a))}this.flags&G.FOLD_CASE?s.appendFoldedRange(c,l):s.appendRange(c,l)}e.skip(1),s.cleanClass(),i<0&&s.negateClass(),n.runes=s.toArray(),this.push(n)}},j(J,"ERR_INTERNAL_ERROR","regexp/syntax: internal error"),j(J,"ERR_INVALID_CHAR_RANGE","invalid character class range"),j(J,"ERR_INVALID_ESCAPE","invalid escape sequence"),j(J,"ERR_INVALID_NAMED_CAPTURE","invalid named capture"),j(J,"ERR_INVALID_PERL_OP","invalid or unsupported Perl syntax"),j(J,"ERR_INVALID_REPEAT_OP","invalid nested repetition operator"),j(J,"ERR_INVALID_REPEAT_SIZE","invalid repeat count"),j(J,"ERR_MISSING_BRACKET","missing closing ]"),j(J,"ERR_MISSING_PAREN","missing closing )"),j(J,"ERR_MISSING_REPEAT_ARGUMENT","missing argument to repetition operator"),j(J,"ERR_TRAILING_BACKSLASH","trailing backslash at end of expression"),j(J,"ERR_DUPLICATE_NAMED_CAPTURE","duplicate capture group name"),j(J,"ERR_UNEXPECTED_PAREN","unexpected )"),j(J,"ERR_NESTING_DEPTH","expression nests too deeply"),j(J,"ERR_LARGE","expression too large"),j(J,"ERR_INVALID_CAPTURE_IN_LOOKBEHIND","invalid capture in lookbehind"),j(J,"MAX_HEIGHT",1e3),j(J,"MAX_SIZE",3355443),j(J,"MAX_RUNES",33554432),j(J,"ANY_TABLE",new m(new Uint32Array([0,X.MAX_RUNE,1]))),j(J,"ASCII_TABLE",new m(new Uint32Array([0,127,1]))),j(J,"ASCII_FOLD_TABLE",new m(new Uint32Array([0,127,1,383,383,1,8490,8490,1]))),J),Nb=class ss{static initTest(e){const t=ss.compile(e),n=new ss(t.expr,t.prog,t.numSubexp,t.longest);return n.cond=t.cond,n.prefix=t.prefix,n.prefixUTF8=t.prefixUTF8,n.prefixComplete=t.prefixComplete,n.prefixRune=t.prefixRune,n.prefilter=t.prefilter,n}static compile(e){return ss.compileImpl(e,G.PERL,!1)}static compilePOSIX(e){return ss.compileImpl(e,G.POSIX,!0)}static compileImpl(e,t,n){let s=Sb.parse(e,t);const i=s.maxCap();s=bb.simplify(s);const o=Ab.build(s),a=Rb.compileRegexp(s),c=new ss(e,a,i,n);c.prefilter=o.type===ge.Type.NONE?null:o;const[l,B]=a.prefix();return c.prefixComplete=l,c.prefix=B,c.prefixUTF8=ee.stringToUtf8ByteArray(c.prefix),c.prefix.length>0&&(c.prefixRune=c.prefix.codePointAt(0)),c.namedGroups=s.namedGroups,c}static match(e,t){return ss.compile(e).match(t)}constructor(e,t,n=0,s=0){this.expr=e,this.prog=t,this.numSubexp=n,this.longest=s,this.cond=t.startCond(),this.prefix=null,this.prefixUTF8=null,this.prefixComplete=!1,this.prefixRune=0,this.machinePool=[],this.dfa=new Cb(this.prog),this.onepass=Zp.compile(this.prog),this.prefilter=null}matchPrefixComplete(e,t,n,s){if((n===G.ANCHOR_START||n===G.ANCHOR_BOTH)&&t!==0)return null;let i=-1,o=-1;const a=e.prefixLength(this);if(n===G.UNANCHORED){const c=e.index(this,t);if(c<0)return null;i=t+c,o=i+a}else if(n===G.ANCHOR_BOTH){if(e.endPos()!==a||e.index(this,0)!==0)return null;i=0,o=a}else if(n===G.ANCHOR_START){if(e.index(this,0)!==0)return null;i=0,o=a}if(i<0)return null;if(s>0){const c=new Int32Array(s).fill(-1);return c[0]=i,c[1]=o,Array.from(c)}return[]}executeEngine(e,t,n,s){if(this.prefixComplete&&(s===0||this.numSubexp===0))return this.matchPrefixComplete(e,t,n,s);if(this.prefilter!==null&&n===G.UNANCHORED&&!this.prefilter.eval(e,t))return null;if(this.onepass!==null)return Zp.execute(this,e,t,n,s);if(s>0)return this.prog.numLb===0&&e.endPos()<=Rc.maxBitStateLen(this.prog)?Rc.execute(this,e,t,n,s):this.doExecuteNFA(e,t,n,s);if(this.prog.numLb===0){const i=this.dfa.match(e,t,n);if(i!==null)return i?[]:null;if(e.endPos()<=Rc.maxBitStateLen(this.prog))return Rc.execute(this,e,t,n,s)}return this.doExecuteNFA(e,t,n,s)}numberOfCapturingGroups(){return this.numSubexp}numberOfInstructions(){return this.prog.numInst()}get(){return this.machinePool.length>0?this.machinePool.pop():null}reset(){this.machinePool.length=0}put(e){this.machinePool.push(e)}toString(){return this.expr}doExecuteNFA(e,t,n,s){let i=this.get();i||(i=db.fromRE2(this)),i.init(s);const o=i.match(e,t,n)?i.submatches():null;return this.put(i),o}match(e){return this.executeEngine(Ne.fromUTF16(e),0,G.UNANCHORED,0)!==null}matchWithGroup(e,t,n,s,i){return e instanceof bs||(ee.isByteArray(e)?e=fs.utf8(e):e=fs.utf16(e)),this.matchMachineInput(e,t,n,s,i)}matchMachineInput(e,t,n,s,i){if(t>n)return[!1,null];const o=e.isUTF16Encoding()?Ne.fromUTF16(e.asCharSequence(),0,n):Ne.fromUTF8(e.asBytes(),0,n),a=this.executeEngine(o,t,s,2*i);return a===null?[!1,null]:[!0,a]}matchUTF8(e){return this.executeEngine(Ne.fromUTF8(e),0,G.UNANCHORED,0)!==null}replaceAll(e,t){return this.replaceAllFunc(e,()=>t,2*e.length+1)}replaceFirst(e,t){return this.replaceAllFunc(e,()=>t,1)}replaceAllFunc(e,t,n){let s=0,i=0,o="";const a=Ne.fromUTF16(e);let c=0;for(;i<=e.length;){const l=this.executeEngine(a,i,G.UNANCHORED,2);if(l===null||l.length===0)break;o+=e.substring(s,l[0]),(l[1]>s||l[0]===0)&&(o+=t(e.substring(l[0],l[1])),c++),s=l[1];const B=a.step(i)&7;if(i+B>l[1]?i+=B:i+1>l[1]?i++:i=l[1],c>=n)break}return o+=e.substring(s),o}pad(e){if(e===null)return null;let t=(1+this.numSubexp)*2;if(e.length<t){let n=new Array(t).fill(-1);for(let s=0;s<e.length;s++)n[s]=e[s];e=n}return e}allMatches(e,t,n=s=>s){let s=[];const i=e.endPos();t<0&&(t=i+1);let o=0,a=0,c=-1;for(;a<t&&o<=i;){const l=this.executeEngine(e,o,G.UNANCHORED,this.prog.numCap);if(l===null||l.length===0)break;let B=!0;if(l[1]===o){l[0]===c&&(B=!1);const d=e.step(o);d<0?o=i+1:o+=d&7}else o=l[1];c=l[1],B&&(s.push(n(this.pad(l))),a++)}return s}findUTF8(e){const t=this.executeEngine(Ne.fromUTF8(e),0,G.UNANCHORED,2);return t===null?null:e.slice(t[0],t[1])}findUTF8Index(e){const t=this.executeEngine(Ne.fromUTF8(e),0,G.UNANCHORED,2);return t===null?null:t.slice(0,2)}find(e){const t=this.executeEngine(Ne.fromUTF16(e),0,G.UNANCHORED,2);return t===null?"":e.substring(t[0],t[1])}findIndex(e){return this.executeEngine(Ne.fromUTF16(e),0,G.UNANCHORED,2)}findUTF8Submatch(e){const t=this.executeEngine(Ne.fromUTF8(e),0,G.UNANCHORED,this.prog.numCap);if(t===null)return null;const n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.slice(t[2*s],t[2*s+1]));return n}findUTF8SubmatchIndex(e){return this.pad(this.executeEngine(Ne.fromUTF8(e),0,G.UNANCHORED,this.prog.numCap))}findSubmatch(e){const t=this.executeEngine(Ne.fromUTF16(e),0,G.UNANCHORED,this.prog.numCap);if(t===null)return null;const n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.substring(t[2*s],t[2*s+1]));return n}findSubmatchIndex(e){return this.pad(this.executeEngine(Ne.fromUTF16(e),0,G.UNANCHORED,this.prog.numCap))}findAllUTF8(e,t){const n=this.allMatches(Ne.fromUTF8(e),t,s=>e.slice(s[0],s[1]));return n.length===0?null:n}findAllUTF8Index(e,t){const n=this.allMatches(Ne.fromUTF8(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAll(e,t){const n=this.allMatches(Ne.fromUTF16(e),t,s=>e.substring(s[0],s[1]));return n.length===0?null:n}findAllIndex(e,t){const n=this.allMatches(Ne.fromUTF16(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAllUTF8Submatch(e,t){const n=this.allMatches(Ne.fromUTF8(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let o=0;o<i.length;o++)s[2*o]>=0&&(i[o]=e.slice(s[2*o],s[2*o+1]));return i});return n.length===0?null:n}findAllUTF8SubmatchIndex(e,t){const n=this.allMatches(Ne.fromUTF8(e),t);return n.length===0?null:n}findAllSubmatch(e,t){const n=this.allMatches(Ne.fromUTF16(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let o=0;o<i.length;o++)s[2*o]>=0&&(i[o]=e.substring(s[2*o],s[2*o+1]));return i});return n.length===0?null:n}findAllSubmatchIndex(e,t){const n=this.allMatches(Ne.fromUTF16(e),t);return n.length===0?null:n}},Ob=class ai{static isHexadecimal(e){return"0"<=e&&e<="9"||"A"<=e&&e<="F"||"a"<=e&&e<="f"}static translate(e){let t="";if(e instanceof RegExp&&(e.ignoreCase&&(t+="i"),e.multiline&&(t+="m"),e.dotAll&&(t+="s"),e=e.source),typeof e!="string")return e;let n="",s=!1,i=e.length;i===0&&(n="(?:)",s=!0);let o=!1,a=0;for(;a<i;){let l=e[a];if(l==="\\"){if(a+1<i)switch(l=e[a+1],l){case"\\":n+="\\\\",a+=2;continue;case"c":if(a+2<i){let p=e[a+2].charCodeAt(0);if(p>=65&&p<=90||p>=97&&p<=122){let g=p%32;n+="\\x",n+=(g>>4).toString(16).toUpperCase(),n+=(g&15).toString(16).toUpperCase(),a+=3,s=!0;continue}}n+="c",a+=2,s=!0;continue;case"u":if(a+2<i){if(e[a+2]==="{"){let p=a+3,g=!1,w=!1;for(;p<i;){const N=e[p];if(N==="}"){w=!0;break}if(!ai.isHexadecimal(N))break;g=!0,p++}if(w&&g){n+="\\x",a+=2,s=!0;continue}}else if(a+5<i){let p=!0;for(let g=0;g<4;g++)if(!ai.isHexadecimal(e[a+2+g])){p=!1;break}if(p){n+="\\x{"+e.substring(a+2,a+6)+"}",a+=6,s=!0;continue}}}n+="u",a+=2,s=!0;continue;case"x":{let p=!1;if(a+2<i&&e[a+2]==="{"){let g=a+3,w=!1,N=!1;for(;g<i;){const M=e[g];if(M==="}"){N=!0;break}if(!ai.isHexadecimal(M))break;w=!0,g++}N&&w&&(p=!0)}else a+3<i&&ai.isHexadecimal(e[a+2])&&ai.isHexadecimal(e[a+3])&&(p=!0);p?(n+="\\x",a+=2):(n+="x",a+=2,s=!0);continue}case"n":case"r":case"t":case"a":case"f":case"v":case"d":case"D":case"s":case"S":case"w":case"W":case"b":case"B":case"p":case"P":case"A":case"z":case"Q":case"E":case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":n+="\\"+l,a+=2;continue;default:{let p=e.codePointAt(a+1);if(p>=48&&p<=57||p>=65&&p<=90||p>=97&&p<=122){let g=ee.charCount(p);n+=e.substring(a+1,a+1+g),a+=g+1,s=!0}else{n+="\\";let g=ee.charCount(p);n+=e.substring(a+1,a+1+g),a+=g+1}continue}}}else if(l==="/"){n+="\\/",a+=1,s=!0;continue}else if(l==="[")o=!0;else if(l==="]")o=!1;else if(!o&&l==="("&&a+2<i&&e[a+1]==="?"&&e[a+2]==="<"&&a+3<i&&!"=!>)".includes(e[a+3])){n+="(?P<",a+=3,s=!0;continue}let B=e.codePointAt(a),d=ee.charCount(B);n+=e.substring(a,a+d),a+=d}const c=s?n:e;return t.length>0?`(?${t})${c}`:c}},Qe,Mh=(Qe=class{static quote(e){return ee.quoteMeta(e)}static quoteReplacement(e,t=!1){return Qp.quoteReplacement(e,t)}static translateRegExp(e){return Ob.translate(e)}static compile(e,t=0){let n=e;if(t&Qe.CASE_INSENSITIVE&&(n=`(?i)${n}`),t&Qe.DOTALL&&(n=`(?s)${n}`),t&Qe.MULTILINE&&(n=`(?m)${n}`),t&-544)throw new hb("Flags should only be a combination of MULTILINE, DOTALL, CASE_INSENSITIVE, DISABLE_UNICODE_GROUPS, LONGEST_MATCH, LOOKBEHINDS");let s=G.PERL;t&Qe.DISABLE_UNICODE_GROUPS&&(s&=-129),t&Qe.LOOKBEHINDS&&(s|=G.LOOKBEHIND);const i=new Qe(e,t);return i.re2Input=Nb.compileImpl(n,s,(t&Qe.LONGEST_MATCH)!==0),i}static matches(e,t){return Qe.compile(e).testExact(t)}static initTest(e,t,n){if(e==null)throw new Error("pattern is null");if(n==null)throw new Error("re2 is null");const s=new Qe(e,t);return s.re2Input=n,s}constructor(e,t){this.patternInput=e,this.flagsInput=t,this.re2Input=null}reset(){this.re2Input.reset()}flags(){return this.flagsInput}pattern(){return this.patternInput}re2(){return this.re2Input}matches(e){return this.testExact(e)}matcher(e){return ee.isByteArray(e)&&(e=fs.utf8(e)),new Qp(this,e)}test(e){return ee.isByteArray(e)?this.re2Input.matchUTF8(e):this.re2Input.match(e)}testExact(e){const t=ee.isByteArray(e)?Ne.fromUTF8(e):Ne.fromUTF16(e);return this.re2Input.executeEngine(t,0,G.ANCHOR_BOTH,0)!==null}exec(e){const t=this.matcher(e);if(!t.find())return null;const n=[t.group(0)];for(let i=1;i<=t.groupCount();i++){const o=t.group(i);n.push(o===null?void 0:o)}n.index=t.start(0),n.input=e;const s=this.namedGroups();if(Object.keys(s).length>0){const i=t.getNamedGroups();for(const o in i)i[o]===null&&(i[o]=void 0);n.groups=i}else n.groups=void 0;return n}split(e,t=0){const n=this.matcher(e),s=[];let i=0,o=0;for(;n.find();){if(o===0&&n.end()===0){o=n.end();continue}if(t>0&&s.length===t-1)break;if(o===n.start()){if(t===0){i+=1,o=n.end();continue}}else for(;i>0;)s.push(""),i-=1;s.push(n.substring(o,n.start())),o=n.end()}if(t===0&&o!==n.inputLength()){for(;i>0;)s.push(""),i-=1;s.push(n.substring(o,n.inputLength()))}return(t!==0||s.length===0&&!(o===n.inputLength()&&o>0))&&s.push(n.substring(o,n.inputLength())),s}*matchAll(e){const t=this.matcher(e);for(;t.find();){const n=[t.group(0)];for(let i=1;i<=t.groupCount();i++){const o=t.group(i);n.push(o===null?void 0:o)}n.index=t.start(0),n.input=e;const s=this.namedGroups();if(Object.keys(s).length>0){const i=t.getNamedGroups();for(const o in i)i[o]===null&&(i[o]=void 0);n.groups=i}else n.groups=void 0;yield n}}toString(){return this.patternInput}programSize(){return this.re2Input.numberOfInstructions()}groupCount(){return this.re2Input.numberOfCapturingGroups()}namedGroups(){return this.re2Input.namedGroups}equals(e){return this===e?!0:e===null||this.constructor!==e.constructor?!1:this.flagsInput===e.flagsInput&&this.patternInput===e.patternInput}},j(Qe,"CASE_INSENSITIVE",Xs.CASE_INSENSITIVE),j(Qe,"DOTALL",Xs.DOTALL),j(Qe,"MULTILINE",Xs.MULTILINE),j(Qe,"DISABLE_UNICODE_GROUPS",Xs.DISABLE_UNICODE_GROUPS),j(Qe,"LONGEST_MATCH",Xs.LONGEST_MATCH),j(Qe,"LOOKBEHINDS",Xs.LOOKBEHINDS),Qe);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Wi="12.17.0";function Fb(r){Wi=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Or=new Pu("@firebase/firestore");function ci(){return Or.logLevel}function Lb(r){Or.setLogLevel(r)}function U(r,...e){if(Or.logLevel<=Be.DEBUG){const t=e.map(Gh);Or.debug(`Firestore (${Wi}): ${r}`,...t)}}function je(r,...e){if(Or.logLevel<=Be.ERROR){const t=e.map(Gh);Or.error(`Firestore (${Wi}): ${r}`,...t)}}function Et(r,...e){if(Or.logLevel<=Be.WARN){const t=e.map(Gh);Or.warn(`Firestore (${Wi}): ${r}`,...t)}}function Gh(r){if(typeof r=="string")return r;try{return function(t){return JSON.stringify(t)}(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Y(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,v_(r,n,t)}function v_(r,e,t){let n=`FIRESTORE (${Wi}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw je(n),new Error(n)}function q(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||v_(e,s,n)}function kb(r,e){r||Y(57014,e)}function $(r,e){return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vb(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uh{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=Vb(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function oe(r,e){return r<e?-1:r>e?1:0}function RB(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return rB(s)===rB(i)?oe(s,i):rB(s)?1:-1}return oe(r.length,e.length)}const xb=55296,Mb=57343;function rB(r){const e=r.charCodeAt(0);return e>=xb&&e<=Mb}function Di(r,e,t){return r.length===e.length&&r.every((n,s)=>t(n,e[s]))}function R_(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Re{constructor(e,t){this.comparator=e,this.root=t||lt.EMPTY}insert(e,t){return new Re(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,lt.BLACK,null,null))}remove(e){return new Re(this.comparator,this.root.remove(e,this.comparator).copy(null,null,lt.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,n)=>(e(t,n),!1))}toString(){const e=[];return this.inorderTraversal((t,n)=>(e.push(`${t}:${n}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Pc(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Pc(this.root,e,this.comparator,!1)}getReverseIterator(){return new Pc(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Pc(this.root,e,this.comparator,!0)}}class Pc{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class lt{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??lt.RED,this.left=s??lt.EMPTY,this.right=i??lt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new lt(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return lt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return lt.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,lt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,lt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw Y(43730,{key:this.key,value:this.value});if(this.right.isRed())throw Y(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw Y(27949);return e+(this.isRed()?0:1)}}lt.EMPTY=null,lt.RED=!0,lt.BLACK=!1;lt.EMPTY=new class{constructor(){this.size=0}get key(){throw Y(57766)}get value(){throw Y(16141)}get color(){throw Y(16727)}get left(){throw Y(29726)}get right(){throw Y(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new lt(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ye{constructor(e){this.comparator=e,this.data=new Re(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,n)=>(e(t),!1))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new EC(this.data.getIterator())}getIteratorFrom(e){return new EC(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(n=>{t=t.add(n)}),t}isEqual(e){if(!(e instanceof ye)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new ye(this.comparator);return t.data=e,t}}class EC{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function Zs(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class x extends bt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yn="__name__";class pn{constructor(e,t,n){t===void 0?t=0:t>e.length&&Y(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&Y(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return pn.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof pn?e.forEach(n=>{t.push(n)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=pn.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return oe(e.length,t.length)}static compareSegments(e,t){const n=pn.isNumericId(e),s=pn.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?pn.extractNumericId(e).compare(pn.extractNumericId(t)):RB(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Ar.fromString(e.substring(4,e.length-2))}}class ce extends pn{construct(e,t,n){return new ce(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new x(O.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter(s=>s.length>0))}return new ce(t)}static emptyPath(){return new ce([])}}const Gb=/^[_a-zA-Z][_a-zA-Z0-9]*$/;let Xe=class ui extends pn{construct(e,t,n){return new ui(e,t,n)}static isValidIdentifier(e){return Gb.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),ui.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===yn}static keyField(){return new ui([yn])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new x(O.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;s<e.length;){const a=e[s];if(a==="\\"){if(s+1===e.length)throw new x(O.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const c=e[s+1];if(c!=="\\"&&c!=="."&&c!=="`")throw new x(O.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=c,s+=2}else a==="`"?(o=!o,s++):a!=="."||o?(n+=a,s++):(i(),s++)}if(i(),o)throw new x(O.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new ui(t)}static emptyPath(){return new ui([])}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(e){this.fields=e,e.sort(Xe.comparator)}static empty(){return new Vt([])}unionWith(e){let t=new ye(Xe.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new Vt(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Di(this.fields,e.fields,(t,n)=>t.isEqual(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cu(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function Kr(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function Ub(r,e){const t=[];for(const n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function b_(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z{constructor(e){this.path=e}static fromPath(e){return new z(ce.fromString(e))}static fromName(e){return new z(ce.fromString(e).popFirst(5))}static empty(){return new z(ce.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&ce.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return ce.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new z(new ce(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hh(r,e,t){if(!t)throw new x(O.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function P_(r,e,t,n){if(e===!0&&n===!0)throw new x(O.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function IC(r){if(!z.isDocumentKey(r))throw new x(O.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function yC(r){if(z.isDocumentKey(r))throw new x(O.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function qa(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function Hu(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=function(n){return n.constructor?n.constructor.name:null}(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":Y(12329,{type:typeof r})}function _e(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new x(O.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Hu(r);throw new x(O.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}function S_(r,e){if(e<=0)throw new x(O.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${e}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ye(r,e){const t={typeString:r};return e&&(t.value=e),t}function ja(r,e){if(!qa(r))throw new x(O.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new x(O.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wC=-62135596800,DC=1e6;class Ie{static now(){return Ie.fromMillis(Date.now())}static fromDate(e){return Ie.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*DC);return new Ie(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new x(O.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new x(O.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<wC)throw new x(O.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new x(O.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/DC}_compareTo(e){return this.seconds===e.seconds?oe(this.nanoseconds,e.nanoseconds):oe(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Ie._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(ja(e,Ie._jsonSchema))return new Ie(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-wC;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Ie._jsonSchemaVersion="firestore/timestamp/1.0",Ie._jsonSchema={type:Ye("string",Ie._jsonSchemaVersion),seconds:Ye("number"),nanoseconds:Ye("number")};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class N_ extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hb(){return typeof atob<"u"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new N_("Invalid base64 string: "+i):i}}(e);return new Le(t)}static fromUint8Array(e){const t=function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i}(e);return new Le(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return oe(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Le.EMPTY_BYTE_STRING=new Le("");const qb=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function zn(r){if(q(!!r,39018),typeof r=="string"){let e=0;const t=qb.exec(r);if(q(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:Pe(r.seconds),nanos:Pe(r.nanos)}}function Pe(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function Wn(r){return typeof r=="string"?Le.fromBase64String(r):Le.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O_="server_timestamp",F_="__type__",L_="__previous_value__",k_="__local_write_time__";function Ja(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[F_])==null?void 0:n.stringValue)===O_}function Ka(r){const e=r.mapValue.fields[L_];return Ja(e)?Ka(e):e}function Ti(r){const e=zn(r.mapValue.fields[k_].timestampValue);return new Ie(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jb{constructor(e,t,n,s,i,o,a,c,l,B,d,p,g){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=a,this.longPollingOptions=c,this.useFetchStreams=l,this.isUsingEmulator=B,this.apiKey=d,this._customHeaders=p,this.grpcFlowControlWindow=g}}const bB="(default)";class Fr{constructor(e,t){this.projectId=e,this.database=t||bB}static empty(){return new Fr("","")}get isDefaultDatabase(){return this.database===bB}isEqual(e){return e instanceof Fr&&e.projectId===this.projectId&&e.database===this.database}}function Jb(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new x(O.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Fr(r.options.projectId,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vr=-1;function za(r){return r==null}function Ai(r){return r===0&&1/r==-1/0}function V_(r){return typeof r=="number"&&Number.isInteger(r)&&!Ai(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}function Kb(r){return typeof r=="string"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qh="__type__",x_="__max__",Ir={mapValue:{fields:{__type__:{stringValue:x_}}}},jh="__vector__",Ps="value",Rn={nullValue:"NULL_VALUE"},Gt={booleanValue:!0},ct={booleanValue:!1};function Ze(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?Ja(r)?4:M_(r)?9007199254740991:Ns(r)?10:11:Y(28295,{value:r})}function sn(r,e,t){if(r===e)return!0;const n=Ze(r);if(n!==Ze(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return Ti(r).isEqual(Ti(e));case 3:return function(i,o){if(typeof i.timestampValue=="string"&&typeof o.timestampValue=="string"&&i.timestampValue.length===o.timestampValue.length)return i.timestampValue===o.timestampValue;const a=zn(i.timestampValue),c=zn(o.timestampValue);return a.seconds===c.seconds&&a.nanos===c.nanos}(r,e);case 5:return r.stringValue===e.stringValue;case 6:return function(i,o){return Wn(i.bytesValue).isEqual(Wn(o.bytesValue))}(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return function(i,o){return Pe(i.geoPointValue.latitude)===Pe(o.geoPointValue.latitude)&&Pe(i.geoPointValue.longitude)===Pe(o.geoPointValue.longitude)}(r,e);case 2:return function(i,o,a){if("integerValue"in i&&"integerValue"in o)return Pe(i.integerValue)===Pe(o.integerValue);let c,l;if("doubleValue"in i&&"doubleValue"in o)c=Pe(i.doubleValue),l=Pe(o.doubleValue);else{if(!(a!=null&&a.t))return!1;c=Pe(i.integerValue??i.doubleValue),l=Pe(o.integerValue??o.doubleValue)}return c===l?!!(a!=null&&a.i)||Ai(c)===Ai(l):!!(a===void 0||a.o)&&isNaN(c)&&isNaN(l)}(r,e,t);case 9:return Di(r.arrayValue.values||[],e.arrayValue.values||[],(s,i)=>sn(s,i,t));case 10:case 11:return function(i,o,a){const c=i.mapValue.fields||{},l=o.mapValue.fields||{};if(cu(c)!==cu(l))return!1;for(const B in c)if(c.hasOwnProperty(B)&&(l[B]===void 0||!sn(c[B],l[B],a)))return!1;return!0}(r,e,t);default:return Y(52216,{left:r})}}function da(r,e){return(r.values||[]).find(t=>sn(t,e))!==void 0}function It(r,e){if(r===e)return 0;const t=Ze(r),n=Ze(e);if(t!==n)return oe(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return oe(r.booleanValue,e.booleanValue);case 2:return function(i,o){const a=Pe(i.integerValue||i.doubleValue),c=Pe(o.integerValue||o.doubleValue);return a<c?-1:a>c?1:a===c?0:isNaN(a)?isNaN(c)?0:-1:1}(r,e);case 3:return TC(r.timestampValue,e.timestampValue);case 4:return TC(Ti(r),Ti(e));case 5:return RB(r.stringValue,e.stringValue);case 6:return function(i,o){const a=Wn(i),c=Wn(o);return a.compareTo(c)}(r.bytesValue,e.bytesValue);case 7:return function(i,o){const a=i.split("/"),c=o.split("/");for(let l=0;l<a.length&&l<c.length;l++){const B=oe(a[l],c[l]);if(B!==0)return B}return oe(a.length,c.length)}(r.referenceValue,e.referenceValue);case 8:return function(i,o){const a=oe(Pe(i.latitude),Pe(o.latitude));return a!==0?a:oe(Pe(i.longitude),Pe(o.longitude))}(r.geoPointValue,e.geoPointValue);case 9:return AC(r.arrayValue,e.arrayValue);case 10:return function(i,o){var p,g,w,N;const a=i.fields||{},c=o.fields||{},l=(p=a[Ps])==null?void 0:p.arrayValue,B=(g=c[Ps])==null?void 0:g.arrayValue,d=oe(((w=l==null?void 0:l.values)==null?void 0:w.length)||0,((N=B==null?void 0:B.values)==null?void 0:N.length)||0);return d!==0?d:AC(l,B)}(r.mapValue,e.mapValue);case 11:return function(i,o){if(i===Ir.mapValue&&o===Ir.mapValue)return 0;if(i===Ir.mapValue)return 1;if(o===Ir.mapValue)return-1;const a=i.fields||{},c=Object.keys(a),l=o.fields||{},B=Object.keys(l);c.sort(),B.sort();for(let d=0;d<c.length&&d<B.length;++d){const p=RB(c[d],B[d]);if(p!==0)return p;const g=It(a[c[d]],l[B[d]]);if(g!==0)return g}return oe(c.length,B.length)}(r.mapValue,e.mapValue);default:throw Y(23264,{u:t})}}function TC(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return oe(r,e);const t=zn(r),n=zn(e),s=oe(t.seconds,n.seconds);return s!==0?s:oe(t.nanos,n.nanos)}function AC(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=It(t[s],n[s]);if(i!==void 0&&i!==0)return i}return oe(t.length,n.length)}function vi(r){return PB(r)}function PB(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?function(t){const n=zn(t);return`time(${n.seconds},${n.nanos})`}(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?function(t){return Wn(t).toBase64()}(r.bytesValue):"referenceValue"in r?function(t){return z.fromName(t).toString()}(r.referenceValue):"geoPointValue"in r?function(t){return`geo(${t.latitude},${t.longitude})`}(r.geoPointValue):"arrayValue"in r?function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=PB(i);return n+"]"}(r.arrayValue):"mapValue"in r?function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${PB(t.fields[o])}`;return s+"}"}(r.mapValue):Y(61005,{value:r})}function qc(r){switch(Ze(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Ka(r);return e?16+qc(e):16;case 5:return 2*r.stringValue.length;case 6:return Wn(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return function(n){return(n.values||[]).reduce((s,i)=>s+qc(i),0)}(r.arrayValue);case 10:case 11:return function(n){let s=0;return Kr(n.fields,(i,o)=>{s+=i.length+qc(o)}),s}(r.mapValue);default:throw Y(13486,{value:r})}}function Ss(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function wn(r){return!!r&&"integerValue"in r}function ps(r){return!!r&&"doubleValue"in r}function Lr(r){return wn(r)||ps(r)}function kr(r){return!!r&&"arrayValue"in r}function Wt(r){return!!r&&"nullValue"in r}function Ut(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function ws(r){return!!r&&"mapValue"in r}function Ns(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[qh])==null?void 0:n.stringValue)===jh}function SB(r){var e,t;return(t=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Ps])==null?void 0:t.arrayValue}function Jo(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return Kr(r.mapValue.fields,(t,n)=>e.mapValue.fields[t]=Jo(n)),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Jo(r.arrayValue.values[t]);return e}return{...r}}function M_(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===x_}const G_={mapValue:{fields:{[qh]:{stringValue:jh},[Ps]:{arrayValue:{}}}}};function zb(r){return"nullValue"in r?Rn:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?Ss(Fr.empty(),z.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?Ns(r)?G_:{mapValue:{}}:Y(35942,{value:r})}function Wb(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?Ss(Fr.empty(),z.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?G_:"mapValue"in r?Ns(r)?{mapValue:{}}:Ir:Y(61959,{value:r})}function vC(r,e){const t=It(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function RC(r,e){const t=It(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class at{constructor(e){this.value=e}static empty(){return new at({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!ws(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Jo(t)}setAll(e){let t=Xe.emptyPath(),n={},s=[];e.forEach((o,a)=>{if(!t.isImmediateParentOf(a)){const c=this.getFieldsMap(t);this.applyChanges(c,n,s),n={},s=[],t=a.popLast()}o?n[a.lastSegment()]=Jo(o):s.push(a.lastSegment())});const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());ws(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return sn(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];ws(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){Kr(t,(s,i)=>e[s]=i);for(const s of n)delete e[s]}clone(){return new at(Jo(this.value))}}function U_(r){const e=[];return Kr(r.fields,(t,n)=>{const s=new Xe([t]);if(ws(n)){const i=U_(n.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)}),new Vt(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qu(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Ai(e)?"-0":e}}function Jh(r){return{integerValue:""+r}}function ju(r,e,t){return V_(e)?Jh(e):qu(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ju{constructor(){this._=void 0}}function Qb(r,e,t){return r instanceof Ri?function(s,i){const o={fields:{[F_]:{stringValue:O_},[k_]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Ja(i)&&(i=Ka(i)),i&&(o.fields[L_]=i),{mapValue:o}}(t,e):r instanceof Os?q_(r,e):r instanceof Fs?j_(r,e):r instanceof Ls?function(s,i){const o=H_(s,i),a=uu(o)+uu(s.l);return wn(o)&&wn(s.l)?Jh(a):qu(s.serializer,a)}(r,e):r instanceof fa?function(s,i){return bC(s,i,Math.min)}(r,e):r instanceof pa?function(s,i){return bC(s,i,Math.max)}(r,e):void 0}function $b(r,e,t){return r instanceof Os?q_(r,e):r instanceof Fs?j_(r,e):t}function H_(r,e){return r instanceof Ls?Lr(e)?e:{integerValue:0}:null}class Ri extends Ju{}class Os extends Ju{constructor(e){super(),this.elements=e}}function q_(r,e){const t=J_(e);for(const n of r.elements)t.some(s=>sn(s,n))||t.push(n);return{arrayValue:{values:t}}}class Fs extends Ju{constructor(e){super(),this.elements=e}}function j_(r,e){let t=J_(e);for(const n of r.elements)t=t.filter(s=>!sn(s,n));return{arrayValue:{values:t}}}class Kh extends Ju{constructor(e,t){super(),this.serializer=e,this.l=t}}class Ls extends Kh{}class fa extends Kh{}class pa extends Kh{}function bC(r,e,t){if(!Lr(e))return r.l;const n=t(uu(e),uu(r.l));return wn(e)&&wn(r.l)?Jh(n):qu(r.serializer,n)}function uu(r){return Pe(r.integerValue||r.doubleValue)}function J_(r){return kr(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wa{constructor(e,t){this.field=e,this.transform=t}}function Yb(r,e){return r.field.isEqual(e.field)&&function(n,s){return n instanceof Os&&s instanceof Os||n instanceof Fs&&s instanceof Fs?Di(n.elements,s.elements,sn):n instanceof Ls&&s instanceof Ls||n instanceof fa&&s instanceof fa||n instanceof pa&&s instanceof pa?sn(n.l,s.l):n instanceof Ri&&s instanceof Ri}(r.transform,e.transform)}class Xb{constructor(e,t){this.version=e,this.transformResults=t}}class Ve{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new Ve}static exists(e){return new Ve(void 0,e)}static updateTime(e){return new Ve(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function jc(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class Ku{}function K_(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new $i(r.key,Ve.none()):new Qi(r.key,r.data,Ve.none());{const t=r.data,n=at.empty();let s=new ye(Xe.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new er(r.key,n,new Vt(s.toArray()),Ve.none())}}function Zb(r,e,t){r instanceof Qi?function(s,i,o){const a=s.value.clone(),c=SC(s.fieldTransforms,i,o.transformResults);a.setAll(c),i.convertToFoundDocument(o.version,a).setHasCommittedMutations()}(r,e,t):r instanceof er?function(s,i,o){if(!jc(s.precondition,i))return void i.convertToUnknownDocument(o.version);const a=SC(s.fieldTransforms,i,o.transformResults),c=i.data;c.setAll(z_(s)),c.setAll(a),i.convertToFoundDocument(o.version,c).setHasCommittedMutations()}(r,e,t):function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()}(0,e,t)}function Ko(r,e,t,n){return r instanceof Qi?function(i,o,a,c){if(!jc(i.precondition,o))return a;const l=i.value.clone(),B=NC(i.fieldTransforms,c,o);return l.setAll(B),o.convertToFoundDocument(o.version,l).setHasLocalMutations(),null}(r,e,t,n):r instanceof er?function(i,o,a,c){if(!jc(i.precondition,o))return a;const l=NC(i.fieldTransforms,c,o),B=o.data;return B.setAll(z_(i)),B.setAll(l),o.convertToFoundDocument(o.version,B).setHasLocalMutations(),a===null?null:a.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map(d=>d.field))}(r,e,t,n):function(i,o,a){return jc(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):a}(r,e,t)}function eP(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=H_(n.transform,s||null);i!=null&&(t===null&&(t=at.empty()),t.set(n.field,i))}return t||null}function PC(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&Di(n,s,(i,o)=>Yb(i,o))}(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class Qi extends Ku{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class er extends Ku{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function z_(r){const e=new Map;return r.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}}),e}function SC(r,e,t){const n=new Map;q(r.length===t.length,32656,{h:t.length,T:r.length});for(let s=0;s<t.length;s++){const i=r[s],o=i.transform,a=e.data.field(i.field);n.set(i.field,$b(o,a,t[s]))}return n}function NC(r,e,t){const n=new Map;for(const s of r){const i=s.transform,o=t.data.field(s.field);n.set(s.field,Qb(i,o,e))}return n}class $i extends Ku{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class zh extends Ku{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vr{constructor(e,t){this.position=e,this.inclusive=t}}function OC(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],o=r.position[s];if(i.field.isKeyField()?n=z.comparator(z.fromName(o.referenceValue),t.key):n=It(o,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function FC(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!sn(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class W_{}class he extends W_{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new tP(e,t,n):t==="array-contains"?new sP(e,n):t==="in"?new eE(e,n):t==="not-in"?new iP(e,n):t==="array-contains-any"?new oP(e,n):new he(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new nP(e,n):new rP(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(It(t,this.value)):t!==null&&Ze(this.value)===Ze(t)&&this.matchesComparison(It(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return Y(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class we extends W_{constructor(e,t){super(),this.filters=e,this.op=t,this.P=null}static create(e,t){return new we(e,t)}matches(e){return bi(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.P!==null||(this.P=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.P}getFilters(){return Object.assign([],this.filters)}}function bi(r){return r.op==="and"}function NB(r){return r.op==="or"}function Wh(r){return Q_(r)&&bi(r)}function Q_(r){for(const e of r.filters)if(e instanceof we)return!1;return!0}function OB(r){if(r instanceof he)return r.field.canonicalString()+r.op.toString()+vi(r.value);if(Wh(r))return r.filters.map(e=>OB(e)).join(",");{const e=r.filters.map(t=>OB(t)).join(",");return`${r.op}(${e})`}}function $_(r,e){return r instanceof he?function(n,s){return s instanceof he&&n.op===s.op&&n.field.isEqual(s.field)&&sn(n.value,s.value)}(r,e):r instanceof we?function(n,s){return s instanceof we&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce((i,o,a)=>i&&$_(o,s.filters[a]),!0):!1}(r,e):void Y(19439)}function Y_(r,e){const t=r.filters.concat(e);return we.create(t,r.op)}function X_(r){return r instanceof he?function(t){return`${t.field.canonicalString()} ${t.op} ${vi(t.value)}`}(r):r instanceof we?function(t){return t.op.toString()+" {"+t.getFilters().map(X_).join(" ,")+"}"}(r):"Filter"}class tP extends he{constructor(e,t,n){super(e,t,n),this.key=z.fromName(n.referenceValue)}matches(e){const t=z.comparator(e.key,this.key);return this.matchesComparison(t)}}class nP extends he{constructor(e,t){super(e,"in",t),this.keys=Z_("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class rP extends he{constructor(e,t){super(e,"not-in",t),this.keys=Z_("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function Z_(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map(n=>z.fromName(n.referenceValue))}class sP extends he{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return kr(t)&&da(t.arrayValue,this.value)}}class eE extends he{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&da(this.value.arrayValue,t)}}class iP extends he{constructor(e,t){super(e,"not-in",t)}matches(e){if(da(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!da(this.value.arrayValue,t)}}class oP extends he{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!kr(t)||!t.arrayValue.values)&&t.arrayValue.values.some(n=>da(this.value.arrayValue,n))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ca{constructor(e,t="asc"){this.field=e,this.dir=t}}function aP(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{static fromTimestamp(e){return new Z(e)}static min(){return new Z(new Ie(0,0))}static max(){return new Z(new Ie(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(e,t,n,s,i,o,a){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=a}static newInvalidDocument(e){return new Fe(e,0,Z.min(),Z.min(),Z.min(),at.empty(),0)}static newFoundDocument(e,t,n,s){return new Fe(e,1,t,Z.min(),n,s,0)}static newNoDocument(e,t){return new Fe(e,2,t,Z.min(),Z.min(),at.empty(),0)}static newUnknownDocument(e,t){return new Fe(e,3,t,Z.min(),Z.min(),at.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(Z.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=at.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=at.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=Z.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof Fe&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new Fe(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pi=-1;class lu{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}}function FB(r){return r.fields.find(e=>e.kind===2)}function is(r){return r.fields.filter(e=>e.kind!==2)}lu.UNKNOWN_ID=-1;class Jc{constructor(e,t){this.fieldPath=e,this.kind=t}}class ga{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new ga(0,$t.min())}}function tE(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=Z.fromTimestamp(n===1e9?new Ie(t+1,0):new Ie(t,n));return new $t(s,z.empty(),e)}function nE(r){return new $t(r.readTime,r.key,Pi)}class $t{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new $t(Z.min(),z.empty(),Pi)}static max(){return new $t(Z.max(),z.empty(),Pi)}}function Qh(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=z.comparator(r.documentKey,e.documentKey),t!==0?t:oe(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cP{constructor(e,t=null,n=[],s=[],i=null,o=null,a=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=a,this.R=null}}function LB(r,e=null,t=[],n=[],s=null,i=null,o=null){return new cP(r,e,t,n,s,i,o)}function Bu(r){const e=$(r);if(e.R===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(n=>OB(n)).join(","),t+="|ob:",t+=e.orderBy.map(n=>function(i){return i.field.canonicalString()+i.dir}(n)).join(","),za(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(n=>vi(n)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(n=>vi(n)).join(",")),e.R=t}return e.R}function $h(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!aP(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!$_(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!FC(r.startAt,e.startAt)&&FC(r.endAt,e.endAt)}function Mn(r){return!!r.isCorePipeline}function Yh(r){return!!r.path&&z.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function hu(r,e){return r.filters.filter(t=>t instanceof he&&t.field.isEqual(e))}function LC(r,e,t){let n=Rn,s=!0;for(const i of hu(r,e)){let o=Rn,a=!0;switch(i.op){case"<":case"<=":o=zb(i.value);break;case"==":case"in":case">=":o=i.value;break;case">":o=i.value,a=!1;break;case"!=":case"not-in":o=Rn}vC({value:n,inclusive:s},{value:o,inclusive:a})<0&&(n=o,s=a)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];vC({value:n,inclusive:s},{value:o,inclusive:t.inclusive})<0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}function kC(r,e,t){let n=Ir,s=!0;for(const i of hu(r,e)){let o=Ir,a=!0;switch(i.op){case">=":case">":o=Wb(i.value),a=!1;break;case"==":case"in":case"<=":o=i.value;break;case"<":o=i.value,a=!1;break;case"!=":case"not-in":o=Ir}RC({value:n,inclusive:s},{value:o,inclusive:a})>0&&(n=o,s=a)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const o=t.position[i];RC({value:n,inclusive:s},{value:o,inclusive:t.inclusive})>0&&(n=o,s=t.inclusive);break}}return{value:n,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tr{constructor(e,t=null,n=[],s=[],i=null,o="F",a=null,c=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=a,this.endAt=c,this.I=null,this.A=null,this.V=null,this.startAt,this.endAt}}function rE(r,e,t,n,s,i,o,a){return new tr(r,e,t,n,s,i,o,a)}function Yi(r){return new tr(r)}function VC(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function uP(r){return z.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function Xh(r){return r.collectionGroup!==null}function mi(r){const e=$(r);if(e.I===null){e.I=[];const t=new Set;for(const i of e.explicitOrderBy)e.I.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let a=new ye(Xe.comparator);return o.filters.forEach(c=>{c.getFlattenedFilters().forEach(l=>{l.isInequality()&&(a=a.add(l.field))})}),a})(e).forEach(i=>{t.has(i.canonicalString())||i.isKeyField()||e.I.push(new Ca(i,n))}),t.has(Xe.keyField().canonicalString())||e.I.push(new Ca(Xe.keyField(),n))}return e.I}function Pt(r){const e=$(r);return e.A||(e.A=lP(e,mi(r))),e.A}function lP(r,e){if(r.limitType==="F")return LB(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map(s=>{const i=s.dir==="desc"?"asc":"desc";return new Ca(s.field,i)});const t=r.endAt?new Vr(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Vr(r.startAt.position,r.startAt.inclusive):null;return LB(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function kB(r,e){const t=r.filters.concat([e]);return new tr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function BP(r,e){const t=r.explicitOrderBy.concat([e]);return new tr(r.path,r.collectionGroup,t,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}function du(r,e,t){return new tr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function hP(r,e){return new tr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),r.limit,r.limitType,e,r.endAt)}function dP(r,e){return new tr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),r.limit,r.limitType,r.startAt,e)}function sE(r,e){return $h(Pt(r),Pt(e))&&r.limitType===e.limitType}function zo(r){return`Query(target=${function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map(s=>X_(s)).join(", ")}]`),za(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map(s=>function(o){return`${o.field.canonicalString()} (${o.dir})`}(s)).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map(s=>vi(s)).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map(s=>vi(s)).join(",")),`Target(${n})`}(Pt(r))}; limitType=${r.limitType})`}function zu(r,e){return e.isFoundDocument()&&function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):z.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)}(r,e)&&function(n,s){for(const i of mi(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0}(r,e)&&function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0}(r,e)&&function(n,s){return!(n.startAt&&!function(o,a,c){const l=OC(o,a,c);return o.inclusive?l<=0:l<0}(n.startAt,mi(n),s)||n.endAt&&!function(o,a,c){const l=OC(o,a,c);return o.inclusive?l>=0:l>0}(n.endAt,mi(n),s))}(r,e)}function Zh(r){return(e,t)=>{let n=!1;for(const s of mi(r)){const i=fP(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function fP(r,e,t){const n=r.field.isKeyField()?z.comparator(e.key,t.key):function(i,o,a){const c=o.data.field(i),l=a.data.field(i);return c!==null&&l!==null?It(c,l):Y(42886)}(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return Y(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pP{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ze,pe;function iE(r){switch(r){case O.OK:return Y(64938);case O.CANCELLED:case O.UNKNOWN:case O.DEADLINE_EXCEEDED:case O.RESOURCE_EXHAUSTED:case O.INTERNAL:case O.UNAVAILABLE:case O.UNAUTHENTICATED:return!1;case O.INVALID_ARGUMENT:case O.NOT_FOUND:case O.ALREADY_EXISTS:case O.PERMISSION_DENIED:case O.FAILED_PRECONDITION:case O.ABORTED:case O.OUT_OF_RANGE:case O.UNIMPLEMENTED:case O.DATA_LOSS:return!0;default:return Y(15467,{code:r})}}function oE(r){if(r===void 0)return je("GRPC error has no .code"),O.UNKNOWN;switch(r){case ze.OK:return O.OK;case ze.CANCELLED:return O.CANCELLED;case ze.UNKNOWN:return O.UNKNOWN;case ze.DEADLINE_EXCEEDED:return O.DEADLINE_EXCEEDED;case ze.RESOURCE_EXHAUSTED:return O.RESOURCE_EXHAUSTED;case ze.INTERNAL:return O.INTERNAL;case ze.UNAVAILABLE:return O.UNAVAILABLE;case ze.UNAUTHENTICATED:return O.UNAUTHENTICATED;case ze.INVALID_ARGUMENT:return O.INVALID_ARGUMENT;case ze.NOT_FOUND:return O.NOT_FOUND;case ze.ALREADY_EXISTS:return O.ALREADY_EXISTS;case ze.PERMISSION_DENIED:return O.PERMISSION_DENIED;case ze.FAILED_PRECONDITION:return O.FAILED_PRECONDITION;case ze.ABORTED:return O.ABORTED;case ze.OUT_OF_RANGE:return O.OUT_OF_RANGE;case ze.UNIMPLEMENTED:return O.UNIMPLEMENTED;case ze.DATA_LOSS:return O.DATA_LOSS;default:return Y(39323,{code:r})}}(pe=ze||(ze={}))[pe.OK=0]="OK",pe[pe.CANCELLED=1]="CANCELLED",pe[pe.UNKNOWN=2]="UNKNOWN",pe[pe.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",pe[pe.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",pe[pe.NOT_FOUND=5]="NOT_FOUND",pe[pe.ALREADY_EXISTS=6]="ALREADY_EXISTS",pe[pe.PERMISSION_DENIED=7]="PERMISSION_DENIED",pe[pe.UNAUTHENTICATED=16]="UNAUTHENTICATED",pe[pe.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",pe[pe.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",pe[pe.ABORTED=10]="ABORTED",pe[pe.OUT_OF_RANGE=11]="OUT_OF_RANGE",pe[pe.UNIMPLEMENTED=12]="UNIMPLEMENTED",pe[pe.INTERNAL=13]="INTERNAL",pe[pe.UNAVAILABLE=14]="UNAVAILABLE",pe[pe.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nr{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){Kr(this.inner,(t,n)=>{for(const[s,i]of n)e(s,i)})}isEmpty(){return b_(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const CP=new Re(z.comparator);function $e(){return CP}const aE=new Re(z.comparator);function as(...r){let e=aE;for(const t of r)e=e.insert(t.key,t);return e}function cE(r){let e=aE;return r.forEach((t,n)=>e=e.insert(t,n.overlayedDocument)),e}function en(){return Wo()}function uE(){return Wo()}function Wo(){return new nr(r=>r.toString(),(r,e)=>r.isEqual(e))}const gP=new Re(z.comparator),mP=new ye(z.comparator);function ae(...r){let e=mP;for(const t of r)e=e.add(t);return e}const _P=new ye(oe);function ed(){return _P}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lE(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const EP=new Ar([4294967295,4294967295],0);function xC(r){const e=lE().encode(r),t=new p_;return t.update(e),new Uint8Array(t.digest())}function MC(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Ar([t,n],0),new Ar([s,i],0)]}class td{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new ko(`Invalid padding: ${t}`);if(n<0)throw new ko(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new ko(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new ko(`Invalid padding when bitmap length is 0: ${t}`);this.m=8*e.length-t,this.p=Ar.fromNumber(this.m)}v(e,t,n){let s=e.add(t.multiply(Ar.fromNumber(n)));return s.compare(EP)===1&&(s=new Ar([s.getBits(0),s.getBits(1)],0)),s.modulo(this.p).toNumber()}S(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.m===0)return!1;const t=xC(e),[n,s]=MC(t);for(let i=0;i<this.hashCount;i++){const o=this.v(n,s,i);if(!this.S(o))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new td(i,s,t);return n.forEach(a=>o.insert(a)),o}insert(e){if(this.m===0)return;const t=xC(e),[n,s]=MC(t);for(let i=0;i<this.hashCount;i++){const o=this.v(n,s,i);this.D(o)}}D(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class ko extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xi{constructor(e,t,n,s,i,o){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.augmentedDocumentUpdates=i,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,Qa.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new Xi(Z.min(),s,new Re(oe),$e(),$e(),ae())}}class Qa{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new Qa(n,t,ae(),ae(),ae())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kc{constructor(e,t,n,s){this.C=e,this.removedTargetIds=t,this.key=n,this.F=s}}class BE{constructor(e,t){this.targetId=e,this.O=t}}class hE{constructor(e,t,n=Le.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class GC{constructor(e){this.targetId=e,this.M=0,this.N=UC(),this.L=Le.EMPTY_BYTE_STRING,this.B=!1,this.U=!0}get current(){return this.B}get resumeToken(){return this.L}get k(){return this.M!==0}get q(){return this.U}$(e){e.approximateByteSize()>0&&(this.U=!0,this.L=e)}K(){let e=ae(),t=ae(),n=ae();return this.N.forEach((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:Y(38017,{changeType:i})}}),new Qa(this.L,this.B,e,t,n)}W(){this.U=!1,this.N=UC()}G(e,t){this.U=!0,this.N=this.N.insert(e,t)}j(e){this.U=!0,this.N=this.N.remove(e)}H(){this.M+=1}J(){this.M-=1,q(this.M>=0,3241,{M:this.M,targetId:this.targetId})}Y(){this.U=!0,this.B=!0}}const Ao="WatchChangeAggregator";class IP{constructor(e){this.Z=e,this.X=new Map,this.ee=$e(),this.te=Sc(),this.ne=$e(),this.re=Sc(),this.ie=new Re(oe)}se(e){for(const t of e.C)e.F&&e.F.isFoundDocument()?this._e(t,e.F):this.oe(t,e.key,e.F);for(const t of e.removedTargetIds)this.oe(t,e.key,e.F)}ae(e){this.forEachTarget(e,t=>{const n=this.X.get(t);if(n)switch(e.state){case 0:this.ue(t)&&n.$(e.resumeToken);break;case 1:n.J(),n.k||n.W(),n.$(e.resumeToken);break;case 2:n.J(),n.k||this.removeTarget(t);break;case 3:this.ue(t)&&(n.Y(),n.$(e.resumeToken));break;case 4:this.ue(t)&&(this.ce(t),n.$(e.resumeToken));break;default:Y(56790,{state:e.state})}else U(Ao,`handleTargetChange received targetChange for untracked target ID (${t}) with state (${e.state})`)})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.X.forEach((n,s)=>{this.ue(s)&&t(s)})}le(e){var t;return Mn(e)?e.getPipelineSourceType()==="documents"&&((t=e.getPipelineDocuments())==null?void 0:t.length)===1:Yh(e)}Ee(e){const t=e.targetId,n=e.O.count,s=this.he(t);if(s){const i=s.target;if(this.le(i))if(n===0){const o=new z(Mn(i)?ce.fromString(i.getPipelineDocuments()[0]):i.path);this.oe(t,o,Fe.newNoDocument(o,Z.min()))}else q(n===1,20013,"Single document existence filter with count: "+n);else{const o=this.Te(t);if(o!==n){const a=this.Pe(e),c=a?this.Re(a,e,o):1;if(c!==0){this.ce(t);const l=c===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.ie=this.ie.insert(t,l)}}}}}Pe(e){const t=e.O.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let o,a;try{o=Wn(n).toUint8Array()}catch(c){if(c instanceof N_)return Et("Decoding the base64 bloom filter in existence filter failed ("+c.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw c}try{a=new td(o,s,i)}catch(c){return Et(c instanceof ko?"BloomFilter error: ":"Applying bloom filter failed: ",c),null}return a.m===0?null:a}Re(e,t,n){return t.O.count===n-this.Ve(e,t.targetId)?0:2}Ve(e,t){const n=this.Z.getRemoteKeysForTarget(t);let s=0;return n.forEach(i=>{const o=this.Z.Ae(),a=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(a)||(this.oe(t,i,null),s++)}),s}de(e){const t=new Map;this.X.forEach((i,o)=>{const a=this.he(o);if(a){if(i.current&&this.le(a.target)){const c=Mn(a.target)?ce.fromString(a.target.getPipelineDocuments()[0]):a.target.path,l=new z(c);this.fe(l).has(o)||this.me(o,l)||this.oe(o,l,Fe.newNoDocument(l,e))}i.q&&(t.set(o,i.K()),i.W())}});let n=ae();this.re.forEach((i,o)=>{let a=!0;o.forEachWhile(c=>{const l=this.he(c);return!l||l.purpose==="TargetPurposeLimboResolution"||(a=!1,!1)}),a&&(n=n.add(i))}),this.ee.forEach((i,o)=>o.setReadTime(e)),this.ne.forEach((i,o)=>o.setReadTime(e));const s=new Xi(e,t,this.ie,this.ee,this.ne,n);return this.ee=$e(),this.te=Sc(),this.ne=$e(),this.re=Sc(),this.ie=new Re(oe),s}_e(e,t){const n=this.X.get(e);if(!n||!this.ue(e))return void U(Ao,`addDocumentToTarget received document for unknown inactive target (${e})`);const s=this.me(e,t.key)?2:0;n.G(t.key,s),Mn(this.he(e).target)&&this.he(e).target.getPipelineFlavor()!=="exact"?this.ne=this.ne.insert(t.key,t):this.ee=this.ee.insert(t.key,t),this.te=this.te.insert(t.key,this.fe(t.key).add(e)),this.re=this.re.insert(t.key,this.pe(t.key).add(e))}oe(e,t,n){const s=this.X.get(e);s&&this.ue(e)?(this.me(e,t)?s.G(t,1):s.j(t),this.re=this.re.insert(t,this.pe(t).delete(e)),this.re=this.re.insert(t,this.pe(t).add(e)),n&&(Mn(this.he(e).target)&&this.he(e).target.getPipelineFlavor()!=="exact"?this.ne=this.ne.insert(t,n):this.ee=this.ee.insert(t,n))):U(Ao,`removeDocumentFromTarget received document for unknown or inactive target (${e})`)}removeTarget(e){this.X.delete(e)}Te(e){const t=this.X.get(e);if(!t)return 0;const n=t.K();return this.Z.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}H(e){let t=this.X.get(e);t||(U(Ao,`recordPendingTargetRequest set up tracking for target ID ${e}`),t=new GC(e),this.X.set(e,t)),t.H()}pe(e){let t=this.re.get(e);return t||(t=new ye(oe),this.re=this.re.insert(e,t)),t}fe(e){let t=this.te.get(e);return t||(t=new ye(oe),this.te=this.te.insert(e,t)),t}ue(e){const t=this.he(e)!==null;return t||U(Ao,"Detected inactive target",e),t}he(e){const t=this.X.get(e);return t===void 0||t.k?null:this.Z.ge(e)}ce(e){this.X.set(e,new GC(e)),this.Z.getRemoteKeysForTarget(e).forEach(t=>{this.oe(e,t,null)})}me(e,t){return this.Z.getRemoteKeysForTarget(e).has(t)}}function Sc(){return new Re(z.comparator)}function UC(){return new Re(z.comparator)}const yP={asc:"ASCENDING",desc:"DESCENDING"},wP={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},DP={and:"AND",or:"OR"};class TP{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function VB(r,e){return r.useProto3Json||za(e)?e:{value:e}}function Si(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function nd(r){const e=zn(r);return new Ie(e.seconds,e.nanos)}function dE(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function zc(r,e){return Si(r,e.toTimestamp())}function Je(r){return q(!!r,49232),Z.fromTimestamp(nd(r))}function rd(r,e){return xB(r,e).canonicalString()}function xB(r,e){const t=function(s){return new ce(["projects",s.projectId,"databases",s.database])}(r).child("documents");return e===void 0?t:t.child(e)}function fE(r){const e=ce.fromString(r);return q(TE(e),10190,{key:e.toString()}),e}function Ni(r,e){return rd(r.databaseId,e.path)}function bn(r,e){const t=fE(e);if(t.get(1)!==r.databaseId.projectId)throw new x(O.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new x(O.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new z(gE(t))}function pE(r,e){return rd(r.databaseId,e)}function CE(r){const e=fE(r);return e.length===4?ce.emptyPath():gE(e)}function MB(r){return new ce(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function gE(r){return q(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function HC(r,e,t){return{name:Ni(r,e),fields:t.value.mapValue.fields}}function mE(r,e,t){const n=bn(r,e.name),s=Je(e.updateTime),i=e.createTime?Je(e.createTime):Z.min(),o=new at({mapValue:{fields:e.fields}}),a=Fe.newFoundDocument(n,s,i,o);return t&&a.setHasCommittedMutations(),t?a.setHasCommittedMutations():a}function AP(r,e){return"found"in e?function(n,s){q(!!s.found,43571),s.found.name,s.found.updateTime;const i=bn(n,s.found.name),o=Je(s.found.updateTime),a=s.found.createTime?Je(s.found.createTime):Z.min(),c=new at({mapValue:{fields:s.found.fields}});return Fe.newFoundDocument(i,o,a,c)}(r,e):"missing"in e?function(n,s){q(!!s.missing,3894),q(!!s.readTime,22933);const i=bn(n,s.missing),o=Je(s.readTime);return Fe.newNoDocument(i,o)}(r,e):Y(7234,{result:e})}function vP(r,e){let t;if("targetChange"in e){e.targetChange;const n=function(l){return l==="NO_CHANGE"?0:l==="ADD"?1:l==="REMOVE"?2:l==="CURRENT"?3:l==="RESET"?4:Y(39313,{state:l})}(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=function(l,B){return l.useProto3Json?(q(B===void 0||typeof B=="string",58123),Le.fromBase64String(B||"")):(q(B===void 0||B instanceof Buffer||B instanceof Uint8Array,16193),Le.fromUint8Array(B||new Uint8Array))}(r,e.targetChange.resumeToken),o=e.targetChange.cause,a=o&&function(l){const B=l.code===void 0?O.UNKNOWN:oE(l.code);return new x(B,l.message||"")}(o);t=new hE(n,s,i,a||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=bn(r,n.document.name),i=Je(n.document.updateTime),o=n.document.createTime?Je(n.document.createTime):Z.min(),a=new at({mapValue:{fields:n.document.fields}}),c=Fe.newFoundDocument(s,i,o,a),l=n.targetIds||[],B=n.removedTargetIds||[];t=new Kc(l,B,c.key,c)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=bn(r,n.document),i=n.readTime?Je(n.readTime):Z.min(),o=Fe.newNoDocument(s,i),a=n.removedTargetIds||[];t=new Kc([],a,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=bn(r,n.document),i=n.removedTargetIds||[];t=new Kc([],i,s,null)}else{if(!("filter"in e))return Y(11601,{ye:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new pP(s,i),a=n.targetId;t=new BE(a,o)}}return t}function ma(r,e){let t;if(e instanceof Qi)t={update:HC(r,e.key,e.value)};else if(e instanceof $i)t={delete:Ni(r,e.key)};else if(e instanceof er)t={update:HC(r,e.key,e.data),updateMask:OP(e.fieldMask)};else{if(!(e instanceof zh))return Y(16599,{we:e.type});t={verify:Ni(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(n=>function(i,o){const a=o.transform;if(a instanceof Ri)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(a instanceof Os)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:a.elements}};if(a instanceof Fs)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:a.elements}};if(a instanceof Ls)return{fieldPath:o.field.canonicalString(),increment:a.l};if(a instanceof fa)return{fieldPath:o.field.canonicalString(),minimum:a.l};if(a instanceof pa)return{fieldPath:o.field.canonicalString(),maximum:a.l};throw Y(20930,{transform:o.transform})}(0,n))),e.precondition.isNone||(t.currentDocument=function(s,i){return i.updateTime!==void 0?{updateTime:zc(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:Y(27497)}(r,e.precondition)),t}function GB(r,e){const t=e.currentDocument?function(i){return i.updateTime!==void 0?Ve.updateTime(Je(i.updateTime)):i.exists!==void 0?Ve.exists(i.exists):Ve.none()}(e.currentDocument):Ve.none(),n=e.updateTransforms?e.updateTransforms.map(s=>function(o,a){let c=null;if("setToServerValue"in a)q(a.setToServerValue==="REQUEST_TIME",16630,{proto:a}),c=new Ri;else if("appendMissingElements"in a){const B=a.appendMissingElements.values||[];c=new Os(B)}else if("removeAllFromArray"in a){const B=a.removeAllFromArray.values||[];c=new Fs(B)}else"increment"in a?c=new Ls(o,a.increment):"minimum"in a?c=new fa(o,a.minimum):"maximum"in a?c=new pa(o,a.maximum):Y(16584,{proto:a});const l=Xe.fromServerFormat(a.fieldPath);return new Wa(l,c)}(r,s)):[];if(e.update){e.update.name;const s=bn(r,e.update.name),i=new at({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=function(c){const l=c.fieldPaths||[];return new Vt(l.map(B=>Xe.fromServerFormat(B)))}(e.updateMask);return new er(s,i,o,t,n)}return new Qi(s,i,t,n)}if(e.delete){const s=bn(r,e.delete);return new $i(s,t)}if(e.verify){const s=bn(r,e.verify);return new zh(s,t)}return Y(1463,{proto:e})}function RP(r,e){return r&&r.length>0?(q(e!==void 0,14353),r.map(t=>function(s,i){let o=s.updateTime?Je(s.updateTime):Je(i);return o.isEqual(Z.min())&&(o=Je(i)),new Xb(o,s.transformResults||[])}(t,e))):[]}function _E(r,e){return{documents:[pE(r,e.path)]}}function EE(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=pE(r,s);const i=function(l){if(l.length!==0)return DE(we.create(l,"and"))}(e.filters);i&&(t.structuredQuery.where=i);const o=function(l){if(l.length!==0)return l.map(B=>function(p){return{field:li(p.field),direction:PP(p.dir)}}(B))}(e.orderBy);o&&(t.structuredQuery.orderBy=o);const a=VB(r,e.limit);return a!==null&&(t.structuredQuery.limit=a),e.startAt&&(t.structuredQuery.startAt=function(l){return{before:l.inclusive,values:l.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(l){return{before:!l.inclusive,values:l.position}}(e.endAt)),{be:t,parent:s}}function IE(r){let e=CE(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){q(n===1,65062);const B=t.from[0];B.allDescendants?s=B.collectionId:e=e.child(B.collectionId)}let i=[];t.where&&(i=function(d){const p=wE(d);return p instanceof we&&Wh(p)?p.getFilters():[p]}(t.where));let o=[];t.orderBy&&(o=function(d){return d.map(p=>function(w){return new Ca(Bi(w.field),function(M){switch(M){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(w.direction))}(p))}(t.orderBy));let a=null;t.limit&&(a=function(d){let p;return p=typeof d=="object"?d.value:d,za(p)?null:p}(t.limit));let c=null;t.startAt&&(c=function(d){const p=!!d.before,g=d.values||[];return new Vr(g,p)}(t.startAt));let l=null;return t.endAt&&(l=function(d){const p=!d.before,g=d.values||[];return new Vr(g,p)}(t.endAt)),rE(e,s,o,i,a,"F",c,l)}function bP(r,e){const t=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return Y(28987,{purpose:s})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function yE(r,e){return{structuredPipeline:{pipeline:{stages:e.stages.map(t=>t._toProto(r))}}}}function wE(r){return r.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=Bi(t.unaryFilter.field);return he.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=Bi(t.unaryFilter.field);return he.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Bi(t.unaryFilter.field);return he.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Bi(t.unaryFilter.field);return he.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return Y(61313);default:return Y(60726)}}(r):r.fieldFilter!==void 0?function(t){return he.create(Bi(t.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return Y(58110);default:return Y(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(r):r.compositeFilter!==void 0?function(t){return we.create(t.compositeFilter.filters.map(n=>wE(n)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return Y(1026)}}(t.compositeFilter.op))}(r):Y(30097,{filter:r})}function PP(r){return yP[r]}function SP(r){return wP[r]}function NP(r){return DP[r]}function li(r){return{fieldPath:r.canonicalString()}}function Bi(r){return Xe.fromServerFormat(r.fieldPath)}function DE(r){return r instanceof he?function(t){if(t.op==="=="){if(Ut(t.value))return{unaryFilter:{field:li(t.field),op:"IS_NAN"}};if(Wt(t.value))return{unaryFilter:{field:li(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Ut(t.value))return{unaryFilter:{field:li(t.field),op:"IS_NOT_NAN"}};if(Wt(t.value))return{unaryFilter:{field:li(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:li(t.field),op:SP(t.op),value:t.value}}}(r):r instanceof we?function(t){const n=t.getFilters().map(s=>DE(s));return n.length===1?n[0]:{compositeFilter:{op:NP(t.op),filters:n}}}(r):Y(54877,{filter:r})}function OP(r){const e=[];return r.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function TE(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function AE(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}function _a(r,e){const t={fields:{}};return e.forEach((n,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);t.fields[s]=n._toProto(r)}),{mapValue:t}}function vE(r){return{stringValue:r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $a(r){return new TP(r,!0)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(e){this._byteString=e}static fromBase64String(e){try{return new mt(Le.fromBase64String(e))}catch(t){throw new x(O.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new mt(Le.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:mt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(ja(e,mt._jsonSchema))return mt.fromBase64String(e.bytes)}}mt._jsonSchemaVersion="firestore/bytes/1.0",mt._jsonSchema={type:Ye("string",mt._jsonSchemaVersion),bytes:Ye("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let xr=class{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new x(O.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Xe(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}};function FP(){return new xr(yn)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Us=class{constructor(e){this._methodName=e}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ln{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new x(O.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new x(O.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return oe(this._lat,e._lat)||oe(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:ln._jsonSchemaVersion}}static fromJSON(e){if(ja(e,ln._jsonSchema))return new ln(e.latitude,e.longitude)}}ln._jsonSchemaVersion="firestore/geoPoint/1.0",ln._jsonSchema={type:Ye("string",ln._jsonSchemaVersion),latitude:Ye("number"),longitude:Ye("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}ot.UNAUTHENTICATED=new ot(null),ot.GOOGLE_CREDENTIALS=new ot("google-credentials-uid"),ot.FIRST_PARTY=new ot("first-party-uid"),ot.MOCK_USER=new ot("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class RE{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class LP{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(ot.UNAUTHENTICATED))}shutdown(){}}class kP{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class VP{constructor(e){this.Se=e,this.currentUser=ot.UNAUTHENTICATED,this.De=0,this.forceRefresh=!1,this.auth=null}start(e,t){q(this.xe===void 0,42304);let n=this.De;const s=c=>this.De!==n?(n=this.De,t(c)):Promise.resolve();let i=new Bt;this.xe=()=>{this.De++,this.currentUser=this.Ce(),i.resolve(),i=new Bt,e.enqueueRetryable(()=>s(this.currentUser))};const o=()=>{const c=i;e.enqueueRetryable(async()=>{await c.promise,await s(this.currentUser)})},a=c=>{U("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=c,this.xe&&(this.auth.addAuthTokenListener(this.xe),o())};this.Se.onInit(c=>a(c)),setTimeout(()=>{if(!this.auth){const c=this.Se.getImmediate({optional:!0});c?a(c):(U("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Bt)}},0),o()}getToken(){const e=this.De,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(n=>this.De!==e?(U("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(q(typeof n.accessToken=="string",31837,{Fe:n}),new RE(n.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.xe&&this.auth.removeAuthTokenListener(this.xe),this.xe=void 0}Ce(){const e=this.auth&&this.auth.getUid();return q(e===null||typeof e=="string",2055,{Oe:e}),new ot(e)}}class xP{constructor(e,t,n){this.Me=e,this.Ne=t,this.Le=n,this.type="FirstParty",this.user=ot.FIRST_PARTY,this.Be=new Map}Ue(){return this.Le?this.Le():null}get headers(){this.Be.set("X-Goog-AuthUser",this.Me);const e=this.Ue();return e&&this.Be.set("Authorization",e),this.Ne&&this.Be.set("X-Goog-Iam-Authorization-Token",this.Ne),this.Be}}class MP{constructor(e,t,n){this.Me=e,this.Ne=t,this.Le=n}getToken(){return Promise.resolve(new xP(this.Me,this.Ne,this.Le))}start(e,t){e.enqueueRetryable(()=>t(ot.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class qC{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class GP{constructor(e,t){this.ke=t,this.forceRefresh=!1,this.appCheck=null,this.qe=null,this.$e=null,ke(e)&&e.settings.appCheckToken&&(this.$e=e.settings.appCheckToken)}start(e,t){q(this.xe===void 0,3512);const n=i=>{i.error!=null&&U("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.qe;return this.qe=i.token,U("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.xe=i=>{e.enqueueRetryable(()=>n(i))};const s=i=>{U("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.xe&&this.appCheck.addTokenListener(this.xe)};this.ke.onInit(i=>s(i)),setTimeout(()=>{if(!this.appCheck){const i=this.ke.getImmediate({optional:!0});i?s(i):U("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.$e)return Promise.resolve(new qC(this.$e));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(q(typeof t.token=="string",44558,{tokenResult:t}),this.qe=t.token,new qC(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.xe&&this.appCheck.removeTokenListener(this.xe),this.xe=void 0}}function bE(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class UP{Ke(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jC="ConnectivityMonitor";class JC{constructor(){this.We=()=>this.Qe(),this.Ge=()=>this.ze(),this.je=[],this.He()}Ke(e){this.je.push(e)}shutdown(){window.removeEventListener("online",this.We),window.removeEventListener("offline",this.Ge)}He(){window.addEventListener("online",this.We),window.addEventListener("offline",this.Ge)}Qe(){U(jC,"Network connectivity changed: AVAILABLE");for(const e of this.je)e(0)}ze(){U(jC,"Network connectivity changed: UNAVAILABLE");for(const e of this.je)e(1)}static Je(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Nc=null;function UB(){return Nc===null?Nc=function(){return 268435456+Math.round(2147483648*Math.random())}():Nc++,"0x"+Nc.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sB="RestConnection",HP={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class qP{get Ye(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Ze=t+"://"+e.host,this.Xe=`projects/${n}/databases/${s}`,this.et=this.databaseId.database===bB?`project_id=${n}`:`project_id=${n}&database_id=${s}`}tt(e,t,n,s,i){const o=UB(),a=this.nt(e,t.toUriEncodedString());U(sB,`Sending RPC '${e}' ${o}:`,a,n);const c={"google-cloud-resource-prefix":this.Xe,"x-goog-request-params":this.et};this.rt(c,s,i);const{host:l}=new URL(a),B=Fa(l);return this.it(e,a,c,n,B).then(d=>(U(sB,`Received RPC '${e}' ${o}: `,d),d),d=>{throw Et(sB,`RPC '${e}' ${o} failed with error: `,d,"url: ",a,"request:",n),d})}st(e,t,n,s,i,o){return this.tt(e,t,n,s,i)}rt(e,t,n){if(e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+Wi}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((s,i)=>e[i]=s),n&&n.headers.forEach((s,i)=>e[i]=s),this.databaseInfo._customHeaders)for(const s of Object.keys(this.databaseInfo._customHeaders))e[s]=this.databaseInfo._customHeaders[s]}nt(e,t){const n=HP[e];let s=`${this.Ze}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jP{constructor(e){this._t=e._t,this.ot=e.ot}ut(e){this.ct=e}lt(e){this.Et=e}ht(e){this.Tt=e}onMessage(e){this.Pt=e}close(){this.ot()}send(e){this._t(e)}Rt(){this.ct()}It(){this.Et()}At(e){this.Tt(e)}Vt(e){this.Pt(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pt="WebChannelConnection",vo=(r,e,t)=>{r.listen(e,n=>{try{t(n)}catch(s){setTimeout(()=>{throw s},0)}})};class _i extends qP{constructor(e){super(e),this.dt=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static ft(){if(!_i.gt){const e=__();vo(e,m_.STAT_EVENT,t=>{t.stat===DB.PROXY?U(pt,"STAT_EVENT: detected buffering proxy"):t.stat===DB.NOPROXY&&U(pt,"STAT_EVENT: detected no buffering proxy")}),_i.gt=!0}}it(e,t,n,s,i){const o=UB();return new Promise((a,c)=>{const l=new C_;l.setWithCredentials(!0),l.listenOnce(g_.COMPLETE,()=>{try{switch(l.getLastErrorCode()){case Hc.NO_ERROR:const d=l.getResponseJson();U(pt,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(d)),a(d);break;case Hc.TIMEOUT:U(pt,`RPC '${e}' ${o} timed out`),c(new x(O.DEADLINE_EXCEEDED,"Request time out"));break;case Hc.HTTP_ERROR:const p=l.getStatus();if(U(pt,`RPC '${e}' ${o} failed with status:`,p,"response text:",l.getResponseText()),p>0){let g=l.getResponseJson();Array.isArray(g)&&(g=g[0]);const w=g==null?void 0:g.error;if(w&&w.status&&w.message){const N=function(W){const te=W.toLowerCase().replace(/_/g,"-");return Object.values(O).indexOf(te)>=0?te:O.UNKNOWN}(w.status);c(new x(N,w.message))}else c(new x(O.UNKNOWN,"Server responded with status "+l.getStatus()))}else c(new x(O.UNAVAILABLE,"Connection failed."));break;default:Y(9055,{yt:e,streamId:o,wt:l.getLastErrorCode(),bt:l.getLastError()})}}finally{U(pt,`RPC '${e}' ${o} completed.`)}});const B=JSON.stringify(s);U(pt,`RPC '${e}' ${o} sending request:`,s),l.send(t,"POST",B,n,15)})}vt(e,t,n){const s=UB(),i=[this.Ze,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),a={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;c!==void 0&&(a.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(a.useFetchStreams=!0),this.rt(a.initMessageHeaders,t,n),a.encodeInitMessageHeaders=!0;const l=i.join("");U(pt,`Creating RPC '${e}' stream ${s}: ${l}`,a);const B=o.createWebChannel(l,a);this.St(B);let d=!1,p=!1;const g=new jP({_t:w=>{p?U(pt,`Not sending because RPC '${e}' stream ${s} is closed:`,w):(d||(U(pt,`Opening RPC '${e}' stream ${s} transport.`),B.open(),d=!0),U(pt,`RPC '${e}' stream ${s} sending:`,w),B.send(w))},ot:()=>B.close()});return vo(B,Lo.EventType.OPEN,()=>{p||(U(pt,`RPC '${e}' stream ${s} transport opened.`),g.Rt())}),vo(B,Lo.EventType.CLOSE,()=>{p||(p=!0,U(pt,`RPC '${e}' stream ${s} transport closed`),g.At(),this.Dt(B))}),vo(B,Lo.EventType.ERROR,w=>{p||(p=!0,Et(pt,`RPC '${e}' stream ${s} transport errored. Name:`,w.name,"Message:",w.message),g.At(new x(O.UNAVAILABLE,"The operation could not be completed")))}),vo(B,Lo.EventType.MESSAGE,w=>{var N;if(!p){const M=w.data[0];q(!!M,16349);const W=M,te=(W==null?void 0:W.error)||((N=W[0])==null?void 0:N.error);if(te){U(pt,`RPC '${e}' stream ${s} received error:`,te);const ie=te.status;let Ee=function(T){const E=ze[T];if(E!==void 0)return oE(E)}(ie),de=te.message;ie==="NOT_FOUND"&&de.includes("database")&&de.includes("does not exist")&&de.includes(this.databaseId.database)&&Et(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),Ee===void 0&&(Ee=O.INTERNAL,de="Unknown error status: "+ie+" with message "+te.message),p=!0,g.At(new x(Ee,de)),B.close()}else U(pt,`RPC '${e}' stream ${s} received:`,M),g.Vt(M)}}),_i.ft(),setTimeout(()=>{g.It()},0),g}terminate(){this.dt.forEach(e=>e.close()),this.dt=[]}St(e){this.dt.push(e)}Dt(e){this.dt=this.dt.filter(t=>t===e)}rt(e,t,n){super.rt(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return E_()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function JP(r){return new _i(r)}_i.gt=!1;class sd{constructor(e,t,n=1e3,s=1.5,i=6e4){this.xt=e,this.timerId=t,this.Ct=n,this.Ft=s,this.Ot=i,this.Mt=0,this.Nt=null,this.Lt=Date.now(),this.reset()}reset(){this.Mt=0}Bt(){this.Mt=this.Ot}Ut(e){this.cancel();const t=Math.floor(this.Mt+this.kt()),n=Math.max(0,Date.now()-this.Lt),s=Math.max(0,t-n);s>0&&U("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Mt} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.Nt=this.xt.enqueueAfterDelay(this.timerId,s,()=>(this.Lt=Date.now(),e())),this.Mt*=this.Ft,this.Mt<this.Ct&&(this.Mt=this.Ct),this.Mt>this.Ot&&(this.Mt=this.Ot)}qt(){this.Nt!==null&&(this.Nt.skipDelay(),this.Nt=null)}cancel(){this.Nt!==null&&(this.Nt.cancel(),this.Nt=null)}kt(){return(Math.random()-.5)*this.Mt}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const KC="PersistentStream";class PE{constructor(e,t,n,s,i,o,a,c){this.xt=e,this.$t=n,this.Kt=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=a,this.listener=c,this.state=0,this.Wt=0,this.Qt=null,this.Gt=null,this.stream=null,this.zt=0,this.jt=new sd(e,t)}Ht(){return this.state===1||this.state===5||this.Jt()}Jt(){return this.state===2||this.state===3}start(){this.zt=0,this.state!==4?this.auth():this.Yt()}async stop(){this.Ht()&&await this.close(0)}Zt(){this.state=0,this.jt.reset()}Xt(){this.Jt()&&this.Qt===null&&(this.Qt=this.xt.enqueueAfterDelay(this.$t,6e4,()=>this.en()))}tn(e){this.nn(),this.stream.send(e)}async en(){if(this.Jt())return this.close(0)}nn(){this.Qt&&(this.Qt.cancel(),this.Qt=null)}rn(){this.Gt&&(this.Gt.cancel(),this.Gt=null)}async close(e,t){this.nn(),this.rn(),this.jt.cancel(),this.Wt++,e!==4?this.jt.reset():t&&t.code===O.RESOURCE_EXHAUSTED?(je(t.toString()),je("Using maximum backoff delay to prevent overloading the backend."),this.jt.Bt()):t&&t.code===O.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.sn(),this.stream.close(),this.stream=null),this.state=e,await this.listener.ht(t)}sn(){}auth(){this.state=1;const e=this._n(this.Wt),t=this.Wt;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([n,s])=>{this.Wt===t&&this.an(n,s)},n=>{e(()=>{const s=new x(O.UNKNOWN,"Fetching auth token failed: "+n.message);return this.un(s)})})}an(e,t){const n=this._n(this.Wt);this.stream=this.cn(e,t),this.stream.ut(()=>{n(()=>this.listener.ut())}),this.stream.lt(()=>{n(()=>(this.state=2,this.Gt=this.xt.enqueueAfterDelay(this.Kt,1e4,()=>(this.Jt()&&(this.state=3),Promise.resolve())),this.listener.lt()))}),this.stream.ht(s=>{n(()=>this.un(s))}),this.stream.onMessage(s=>{n(()=>++this.zt==1?this.En(s):this.onNext(s))})}Yt(){this.state=5,this.jt.Ut(async()=>{this.state=0,this.start()})}un(e){return U(KC,`close with error: ${e}`),this.stream=null,this.close(4,e)}_n(e){return t=>{this.xt.enqueueAndForget(()=>this.Wt===e?t():(U(KC,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class KP extends PE{constructor(e,t,n,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}cn(e,t){return this.connection.vt("Listen",e,t)}En(e){return this.onNext(e)}onNext(e){this.jt.reset();const t=vP(this.serializer,e),n=function(i){if(!("targetChange"in i))return Z.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?Z.min():o.readTime?Je(o.readTime):Z.min()}(e);return this.listener.hn(t,n)}Tn(e){const t={};t.database=MB(this.serializer),t.addTarget=function(i,o){let a;const c=o.target;if(a=Mn(c)?{pipelineQuery:yE(i,c)}:Yh(c)?{documents:_E(i,c)}:{query:EE(i,c).be},a.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){a.resumeToken=dE(i,o.resumeToken);const l=VB(i,o.expectedCount);l!==null&&(a.expectedCount=l)}else if(o.snapshotVersion.compareTo(Z.min())>0){a.readTime=Si(i,o.snapshotVersion.toTimestamp());const l=VB(i,o.expectedCount);l!==null&&(a.expectedCount=l)}return a}(this.serializer,e);const n=bP(this.serializer,e);n&&(t.labels=n),this.tn(t)}Pn(e){const t={};t.database=MB(this.serializer),t.removeTarget=e,this.tn(t)}}class zP extends PE{constructor(e,t,n,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}get Rn(){return this.zt>0}start(){this.lastStreamToken=void 0,super.start()}sn(){this.Rn&&this.In([])}cn(e,t){return this.connection.vt("Write",e,t)}En(e){return q(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,q(!e.writeResults||e.writeResults.length===0,55816),this.listener.An()}onNext(e){q(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.jt.reset();const t=RP(e.writeResults,e.commitTime),n=Je(e.commitTime);return this.listener.Vn(n,t)}dn(){const e={};e.database=MB(this.serializer),this.tn(e)}In(e){const t={streamToken:this.lastStreamToken,writes:e.map(n=>ma(this.serializer,n))};this.tn(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WP{}class QP extends WP{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.fn=!1}mn(){if(this.fn)throw new x(O.FAILED_PRECONDITION,"The client has already been terminated.")}tt(e,t,n,s){return this.mn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([i,o])=>this.connection.tt(e,xB(t,n),s,i,o)).catch(i=>{throw i.name==="FirebaseError"?(i.code===O.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new x(O.UNKNOWN,i.toString())})}st(e,t,n,s,i){return this.mn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,a])=>this.connection.st(e,xB(t,n),s,o,a,i)).catch(o=>{throw o.name==="FirebaseError"?(o.code===O.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new x(O.UNKNOWN,o.toString())})}terminate(){this.fn=!0,this.connection.terminate()}}function $P(r,e,t,n){return new QP(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const YP="ComponentProvider",zC=new Map;function XP(r,e,t,n,s){return new jb(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,bE(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n,s._customHeaders,s.grpcFlowControlWindow)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const WC={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},SE=41943040;class Ct{static withCacheSize(e){return new Ct(e,Ct.DEFAULT_COLLECTION_PERCENTILE,Ct.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}Ct.DEFAULT_COLLECTION_PERCENTILE=10,Ct.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Ct.DEFAULT=new Ct(SE,Ct.DEFAULT_COLLECTION_PERCENTILE,Ct.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Ct.DISABLED=new Ct(-1,0,0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xt{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.pn(n),this.gn=n=>t.writeSequenceNumber(n))}pn(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.gn&&this.gn(e),e}}xt.yn=-1;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const NE="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class OE{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function zr(r){if(r.code!==O.FAILED_PRECONDITION||r.message!==NE)throw r;U("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class b{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&Y(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new b((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof b?t:b.resolve(t)}catch(t){return b.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):b.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):b.reject(t)}static resolve(e){return new b((t,n)=>{t(e)})}static reject(e){return new b((t,n)=>{n(e)})}static waitFor(e){return new b((t,n)=>{let s=0,i=0,o=!1;e.forEach(a=>{++s,a.next(()=>{++i,o&&i===s&&t()},c=>n(c))}),o=!0,i===s&&t()})}static or(e){let t=b.resolve(!1);for(const n of e)t=t.next(s=>s?b.resolve(s):n());return t}static forEach(e,t){const n=[];return e.forEach((s,i)=>{n.push(t.call(this,s,i))}),this.waitFor(n)}static mapArray(e,t){return new b((n,s)=>{const i=e.length,o=new Array(i);let a=0;for(let c=0;c<i;c++){const l=c;t(e[l]).next(B=>{o[l]=B,++a,a===i&&n(o)},B=>s(B))}})}static doWhile(e,t){return new b((n,s)=>{const i=()=>{e()===!0?t().next(()=>{i()},s):n()};i()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jt="SimpleDb";class Wu{static open(e,t,n,s){try{return new Wu(t,e.transaction(s,n))}catch(i){throw new Qo(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.wn=new Bt,this.transaction.oncomplete=()=>{this.wn.resolve()},this.transaction.onabort=()=>{t.error?this.wn.reject(new Qo(e,t.error)):this.wn.resolve()},this.transaction.onerror=n=>{const s=id(n.target.error);this.wn.reject(new Qo(e,s))}}get bn(){return this.wn.promise}abort(e){e&&this.wn.reject(e),this.aborted||(U(Jt,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}vn(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new eS(t)}}class Pn{static delete(e){return U(Jt,"Removing database:",e),cs(ah().indexedDB.deleteDatabase(e)).toPromise()}static Je(){if(!ra())return!1;if(Pn.Sn())return!0;const e=xe(),t=Pn.Dn(e),n=0<t&&t<10,s=FE(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||i)}static Sn(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static xn(e,t){return e.store(t)}static Dn(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.Cn=n,this.Fn=null,Pn.Dn(xe())===12.2&&je("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async On(e){return this.db||(U(Jt,"Opening database:",this.name),this.db=await new Promise((t,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const o=i.target.result;t(o)},s.onblocked=()=>{n(new Qo(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const o=i.target.error;o.name==="VersionError"?n(new x(O.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?n(new x(O.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):n(new Qo(e,o))},s.onupgradeneeded=i=>{U(Jt,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const o=i.target.result;this.Cn.Mn(o,s.transaction,i.oldVersion,this.version).next(()=>{U(Jt,"Database upgrade to version "+this.version+" complete")})}})),this.Nn&&(this.db.onversionchange=t=>this.Nn(t)),this.db}Ln(e){this.Nn=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,s){const i=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.On(e);const a=Wu.open(this.db,e,i?"readonly":"readwrite",n),c=s(a).next(l=>(a.vn(),l)).catch(l=>(a.abort(l),b.reject(l))).toPromise();return c.catch(()=>{}),await a.bn,c}catch(a){const c=a,l=c.name!=="FirebaseError"&&o<3;if(U(Jt,"Transaction failed with error:",c.message,"Retrying:",l),this.close(),!l)return Promise.reject(c)}}}close(){this.db&&this.db.close(),this.db=void 0}}function FE(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class ZP{constructor(e){this.Bn=e,this.Un=!1,this.kn=null}get isDone(){return this.Un}get qn(){return this.kn}set cursor(e){this.Bn=e}done(){this.Un=!0}$n(e){this.kn=e}delete(){return cs(this.Bn.delete())}}class Qo extends x{constructor(e,t){super(O.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function Wr(r){return r.name==="IndexedDbTransactionError"}class eS{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(U(Jt,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(U(Jt,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),cs(n)}add(e){return U(Jt,"ADD",this.store.name,e,e),cs(this.store.add(e))}get(e){return cs(this.store.get(e)).next(t=>(t===void 0&&(t=null),U(Jt,"GET",this.store.name,e,t),t))}delete(e){return U(Jt,"DELETE",this.store.name,e),cs(this.store.delete(e))}count(){return U(Jt,"COUNT",this.store.name),cs(this.store.count())}Kn(e,t){const n=this.options(e,t),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new b((o,a)=>{i.onerror=c=>{a(c.target.error)},i.onsuccess=c=>{o(c.target.result)}})}{const i=this.cursor(n),o=[];return this.Wn(i,(a,c)=>{o.push(c)}).next(()=>o)}}Qn(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new b((s,i)=>{n.onerror=o=>{i(o.target.error)},n.onsuccess=o=>{s(o.target.result)}})}Gn(e,t){U(Jt,"DELETE ALL",this.store.name);const n=this.options(e,t);n.zn=!1;const s=this.cursor(n);return this.Wn(s,(i,o,a)=>a.delete())}jn(e,t){let n;t?n=e:(n={},t=e);const s=this.cursor(n);return this.Wn(s,t)}Hn(e){const t=this.cursor({});return new b((n,s)=>{t.onerror=i=>{const o=id(i.target.error);s(o)},t.onsuccess=i=>{const o=i.target.result;o?e(o.primaryKey,o.value).next(a=>{a?o.continue():n()}):n()}})}Wn(e,t){const n=[];return new b((s,i)=>{e.onerror=o=>{i(o.target.error)},e.onsuccess=o=>{const a=o.target.result;if(!a)return void s();const c=new ZP(a),l=t(a.primaryKey,a.value,c);if(l instanceof b){const B=l.catch(d=>(c.done(),b.reject(d)));n.push(B)}c.isDone?s():c.qn===null?a.continue():a.continue(c.qn)}}).next(()=>b.waitFor(n))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.zn?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function cs(r){return new b((e,t)=>{r.onsuccess=n=>{const s=n.target.result;e(s)},r.onerror=n=>{const s=id(n.target.error);t(s)}})}let QC=!1;function id(r){const e=Pn.Dn(xe());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new x("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return QC||(QC=!0,setTimeout(()=>{throw n},0)),n}}return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $C="LruGarbageCollector",tS=1048576;function YC([r,e],[t,n]){const s=oe(r,t);return s===0?oe(e,n):s}class nS{constructor(e){this.Jn=e,this.buffer=new ye(YC),this.Yn=0}Zn(){return++this.Yn}Xn(e){const t=[e,this.Zn()];if(this.buffer.size<this.Jn)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();YC(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class LE{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.er=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.tr(6e4)}stop(){this.er&&(this.er.cancel(),this.er=null)}get started(){return this.er!==null}tr(e){U($C,`Garbage collection scheduled in ${e}ms`),this.er=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.er=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Wr(t)?U($C,"Ignoring IndexedDB error during garbage collection: ",t):await zr(t)}await this.tr(3e5)})}}class rS{constructor(e,t){this.nr=e,this.params=t}calculateTargetCount(e,t){return this.nr.rr(e).next(n=>Math.floor(t/100*n))}nthSequenceNumber(e,t){if(t===0)return b.resolve(xt.yn);const n=new nS(t);return this.nr.forEachTarget(e,s=>n.Xn(s.sequenceNumber)).next(()=>this.nr.ir(e,s=>n.Xn(s))).next(()=>n.maxValue)}removeTargets(e,t,n){return this.nr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.nr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(U("LruGarbageCollector","Garbage collection skipped; disabled"),b.resolve(WC)):this.getCacheSize(e).next(n=>n<this.params.cacheSizeCollectionThreshold?(U("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),WC):this.sr(e,t))}getCacheSize(e){return this.nr.getCacheSize(e)}sr(e,t){let n,s,i,o,a,c,l;const B=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(d=>(d>this.params.maximumSequenceNumbersToCollect?(U("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${d}`),s=this.params.maximumSequenceNumbersToCollect):s=d,o=Date.now(),this.nthSequenceNumber(e,s))).next(d=>(n=d,a=Date.now(),this.removeTargets(e,n,t))).next(d=>(i=d,c=Date.now(),this.removeOrphanedDocuments(e,n))).next(d=>(l=Date.now(),ci()<=Be.DEBUG&&U("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-B}ms
	Determined least recently used ${s} in `+(a-o)+`ms
	Removed ${i} targets in `+(c-a)+`ms
	Removed ${d} documents in `+(l-c)+`ms
Total Duration: ${l-B}ms`),b.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:d})))}}function kE(r,e){return new rS(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const VE="firestore.googleapis.com",XC=!0;class ZC{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new x(O.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=VE,this.ssl=XC}else this.host=e.host,this.ssl=e.ssl??XC;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e._customHeaders&&(this._customHeaders={...e._customHeaders}),e.cacheSizeBytes===void 0)this.cacheSizeBytes=SE;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<tS)throw new x(O.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}if(P_("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=bE(e.experimentalLongPollingOptions??{}),function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new x(O.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new x(O.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new x(O.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams,e.grpcFlowControlWindow!==void 0){if(typeof e.grpcFlowControlWindow!="number"||e.grpcFlowControlWindow<=0||e.grpcFlowControlWindow>2147483647||!Number.isInteger(e.grpcFlowControlWindow))throw new x(O.INVALID_ARGUMENT,"grpcFlowControlWindow must be a positive integer and cannot exceed 2147483647");this.grpcFlowControlWindow=e.grpcFlowControlWindow}}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(n,s){return n.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams&&this.grpcFlowControlWindow===e.grpcFlowControlWindow&&function(n,s){if(n===s)return!0;if(!n||!s)return!1;const i=Object.keys(n),o=Object.keys(s);if(i.length!==o.length)return!1;for(const a of i)if(n[a]!==s[a])return!1;return!0}(this._customHeaders,e._customHeaders)}}let Ya=class{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new ZC({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new x(O.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new x(O.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new ZC(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(n){if(!n)return new LP;switch(n.type){case"firstParty":return new MP(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new x(O.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const n=zC.get(t);n&&(U(YP,"Removing Datastore"),zC.delete(t),n.terminate())}(this),Promise.resolve()}};function sS(r,e,t,n={}){var l;r=_e(r,Ya);const s=Fa(e),i=r._getSettings(),o={...i,emulatorOptions:r._getEmulatorOptions()},a=`${e}:${t}`;s&&Zg(`https://${a}`),i.host!==VE&&i.host!==a&&Et("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const c={...i,host:a,ssl:s,emulatorOptions:n};if(!br(c,o)&&(r._setSettings(c),n.mockUserToken)){let B,d;if(typeof n.mockUserToken=="string")B=n.mockUserToken,d=ot.MOCK_USER;else{B=gw(n.mockUserToken,(l=r._app)==null?void 0:l.options.projectId);const p=n.mockUserToken.sub||n.mockUserToken.user_id;if(!p)throw new x(O.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");d=new ot(p)}r._authCredentials=new kP(new RE(B,d))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let St=class xE{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new xE(this.firestore,e,this._query)}};class me{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Sn(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new me(this.firestore,e,this._key)}toJSON(){return{type:me._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(ja(t,me._jsonSchema))return new me(e,n||null,new z(ce.fromString(t.referencePath)))}}me._jsonSchemaVersion="firestore/documentReference/1.0",me._jsonSchema={type:Ye("string",me._jsonSchemaVersion),referencePath:Ye("string")};class Sn extends St{constructor(e,t,n){super(e,t,Yi(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new me(this.firestore,null,new z(e))}withConverter(e){return new Sn(this.firestore,e,this._path)}}function ME(r,e,...t){if(r=re(r),Hh("collection","path",e),r instanceof Ya){const n=ce.fromString(e,...t);return yC(n),new Sn(r,null,n)}{if(!(r instanceof me||r instanceof Sn))throw new x(O.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(ce.fromString(e,...t));return yC(n),new Sn(r.firestore,null,n)}}function iS(r,e){if(r=_e(r,Ya),Hh("collectionGroup","collection id",e),e.indexOf("/")>=0)throw new x(O.INVALID_ARGUMENT,`Invalid collection ID '${e}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new St(r,null,function(n){return new tr(ce.emptyPath(),n)}(e))}function fu(r,e,...t){if(r=re(r),arguments.length===1&&(e=Uh.newId()),Hh("doc","path",e),r instanceof Ya){const n=ce.fromString(e,...t);return IC(n),new me(r,null,new z(n))}{if(!(r instanceof me||r instanceof Sn))throw new x(O.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(ce.fromString(e,...t));return IC(n),new me(r.firestore,r instanceof Sn?r.converter:null,new z(n))}}function GE(r,e){return r=re(r),e=re(e),(r instanceof me||r instanceof Sn)&&(e instanceof me||e instanceof Sn)&&r.firestore===e.firestore&&r.path===e.path&&r.converter===e.converter}function UE(r,e){return r=re(r),e=re(e),r instanceof St&&e instanceof St&&r.firestore===e.firestore&&sE(r._query,e._query)&&r.converter===e.converter}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mt{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0}(this._values,e._values)}toJSON(){return{type:Mt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(ja(e,Mt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new Mt(e.vectorValues);throw new x(O.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Mt._jsonSchemaVersion="firestore/vectorValue/1.0",Mt._jsonSchema={type:Ye("string",Mt._jsonSchemaVersion),vectorValues:Ye("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oS=/^__.*__$/;class aS{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new er(e,this.data,this.fieldMask,t,this.fieldTransforms):new Qi(e,this.data,t,this.fieldTransforms)}}class HE{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new er(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function qE(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw Y(40011,{dataSource:r})}}class Qu{constructor(e,t,n,s,i,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new Qu({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return pu(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if(qE(this.dataSource)&&oS.test(e))throw this.createError('Document fields cannot begin and end with "__"')}}class cS{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||$a(e)}createContext(e,t,n,s=!1){return new Qu({dataSource:e,methodName:t,targetDoc:n,path:Xe.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Hs(r){const e=r._freezeSettings(),t=$a(r._databaseId);return new cS(r._databaseId,!!e.ignoreUndefinedProperties,t)}function $u(r,e,t,n,s,i={}){const o=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);hd("Data must be an object, but it was:",o,n);const a=KE(n,o);let c,l;if(i.merge)c=new Vt(o.fieldMask),l=o.fieldTransforms;else if(i.mergeFields){const B=[];for(const d of i.mergeFields){const p=Qn(e,d,t);if(!o.contains(p))throw new x(O.INVALID_ARGUMENT,`Field '${p}' is specified in your field mask but missing from your input data.`);QE(B,p)||B.push(p)}c=new Vt(B),l=o.fieldTransforms.filter(d=>c.covers(d.field))}else c=null,l=o.fieldTransforms;return new aS(new at(a),c,l)}class Xa extends Us{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Xa}}function jE(r,e,t){return new Qu({dataSource:3,targetDoc:e.settings.targetDoc,methodName:r._methodName,arrayElement:t},e.databaseId,e.serializer,e.ignoreUndefinedProperties)}class od extends Us{_toFieldTransform(e){return new Wa(e.path,new Ri)}isEqual(e){return e instanceof od}}class ad extends Us{constructor(e,t){super(e),this._r=t}_toFieldTransform(e){const t=jE(this,e,!0),n=this._r.map(i=>Fn(i,t)),s=new Os(n);return new Wa(e.path,s)}isEqual(e){return e instanceof ad&&br(this._r,e._r)}}class cd extends Us{constructor(e,t){super(e),this._r=t}_toFieldTransform(e){const t=jE(this,e,!0),n=this._r.map(i=>Fn(i,t)),s=new Fs(n);return new Wa(e.path,s)}isEqual(e){return e instanceof cd&&br(this._r,e._r)}}class ud extends Us{constructor(e,t){super(e),this.ar=t}_toFieldTransform(e){const t=new Ls(e.serializer,ju(e.serializer,this.ar));return new Wa(e.path,t)}isEqual(e){return e instanceof ud&&(this.ar===e.ar||Number.isNaN(this.ar)&&Number.isNaN(e.ar))}}function ld(r,e,t,n){const s=r.createContext(1,e,t);hd("Data must be an object, but it was:",s,n);const i=[],o=at.empty();Kr(n,(c,l)=>{const B=WE(e,c,t);l=re(l);const d=s.childContextForFieldPath(B);if(l instanceof Xa)i.push(B);else{const p=Fn(l,d);p!=null&&(i.push(B),o.set(B,p))}});const a=new Vt(i);return new HE(o,a,s.fieldTransforms)}function Bd(r,e,t,n,s,i){const o=r.createContext(1,e,t),a=[Qn(e,n,t)],c=[s];if(i.length%2!=0)throw new x(O.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let p=0;p<i.length;p+=2)a.push(Qn(e,i[p])),c.push(i[p+1]);const l=[],B=at.empty();for(let p=a.length-1;p>=0;--p)if(!QE(l,a[p])){const g=a[p];let w=c[p];w=re(w);const N=o.childContextForFieldPath(g);if(w instanceof Xa)l.push(g);else{const M=Fn(w,N);M!=null&&(l.push(g),B.set(g,M))}}const d=new Vt(l);return new HE(B,d,o.fieldTransforms)}function JE(r,e,t,n=!1){return Fn(t,r.createContext(n?4:3,e))}function Fn(r,e,t){if(zE(r=re(r)))return hd("Unsupported field value:",e,r),KE(r,e);if(r instanceof Us)return function(s,i){if(!qE(i.dataSource))throw i.createError(`${s._methodName}() can only be used with update() and set()`);if(!i.path)throw i.createError(`${s._methodName}() is not currently supported inside arrays`);const o=s._toFieldTransform(i);o&&i.fieldTransforms.push(o)}(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return function(s,i){const o=[];let a=0;for(const c of s){let l=Fn(c,i.childContextForArray(a));l==null&&(l={nullValue:"NULL_VALUE"}),o.push(l),a++}return{arrayValue:{values:o}}}(r,e)}return function(s,i,o){if((s=re(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return ju(i.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const a=Ie.fromDate(s);return{timestampValue:Si(i.serializer,a)}}if(s instanceof Ie){const a=new Ie(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:Si(i.serializer,a)}}if(s instanceof ln)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof mt)return{bytesValue:dE(i.serializer,s._byteString)};if(s instanceof me){const a=i.databaseId,c=s.firestore._databaseId;if(!c.isEqual(a))throw i.createError(`Document reference is for database ${c.projectId}/${c.database} but should be for database ${a.projectId}/${a.database}`);return{referenceValue:rd(s.firestore._databaseId||i.databaseId,s._key.path)}}if(s instanceof Mt)return function(c,l){const B=c instanceof Mt?c.toArray():c;return{mapValue:{fields:{[qh]:{stringValue:jh},[Ps]:{arrayValue:{values:B.map(p=>{if(typeof p!="number")throw l.createError("VectorValues must only contain numeric values.");return qu(l.serializer,p)})}}}}}}(s,i);if(AE(s))return s._toProto(i.serializer);throw i.createError(`Unsupported field value: ${Hu(s)}`)}(r,e)}function KE(r,e){const t={};return b_(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Kr(r,(n,s)=>{const i=Fn(s,e.childContextForField(n));i!=null&&(t[n]=i)}),{mapValue:{fields:t}}}function zE(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof Ie||r instanceof ln||r instanceof mt||r instanceof me||r instanceof Us||r instanceof Mt||AE(r))}function hd(r,e,t){if(!zE(t)||!qa(t)){const n=Hu(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function Qn(r,e,t){if((e=re(e))instanceof xr)return e._internalPath;if(typeof e=="string")return WE(r,e);throw pu("Field path arguments must be of type string or ",r,!1,void 0,t)}const uS=new RegExp("[~\\*/\\[\\]]");function WE(r,e,t){if(e.search(uS)>=0)throw pu(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new xr(...e.split("."))._internalPath}catch{throw pu(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function pu(r,e,t,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let a=`Function ${e}() called with invalid data`;t&&(a+=" (via `toFirestore()`)"),a+=". ";let c="";return(i||o)&&(c+=" (found",i&&(c+=` in field ${n}`),o&&(c+=` in document ${s}`),c+=")"),new x(O.INVALID_ARGUMENT,a+r+c)}function QE(r,e){return r.some(t=>t.isEqual(e))}function $E(r){return typeof r._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yt{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){const n=at.empty();for(const s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){const i=this.optionDefinitions[s];if(s in e){const o=e[s];let a;i.nestedOptions&&qa(o)?a={mapValue:{fields:new yt(i.nestedOptions).getOptionsProto(t,o)}}:o&&(a=Fn(o,t)??void 0),a&&n.set(Xe.fromServerFormat(i.serverName),a)}}return n}getOptionsProto(e,t,n){const s=this._getKnownOptions(t,e);if(n){const i=new Map(Ub(n,(o,a)=>[Xe.fromServerFormat(a),o!==void 0?Fn(o,e):null]));s.setAll(i)}return s.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lS(r){return typeof r=="object"&&r!==null&&!!("nullValue"in r&&(r.nullValue===null||r.nullValue==="NULL_VALUE")||"booleanValue"in r&&(r.booleanValue===null||typeof r.booleanValue=="boolean")||"integerValue"in r&&(r.integerValue===null||typeof r.integerValue=="number"||typeof r.integerValue=="string")||"doubleValue"in r&&(r.doubleValue===null||typeof r.doubleValue=="number")||"timestampValue"in r&&(r.timestampValue===null||function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")}(r.timestampValue))||"stringValue"in r&&(r.stringValue===null||typeof r.stringValue=="string")||"bytesValue"in r&&(r.bytesValue===null||r.bytesValue instanceof Uint8Array)||"referenceValue"in r&&(r.referenceValue===null||typeof r.referenceValue=="string")||"geoPointValue"in r&&(r.geoPointValue===null||function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")}(r.geoPointValue))||"arrayValue"in r&&(r.arrayValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))}(r.arrayValue))||"mapValue"in r&&(r.mapValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!qa(t.fields))}(r.mapValue))||"fieldReferenceValue"in r&&(r.fieldReferenceValue===null||typeof r.fieldReferenceValue=="string")||"functionValue"in r&&(r.functionValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))}(r.functionValue))||"pipelineValue"in r&&(r.pipelineValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))}(r.pipelineValue)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function BS(){return new Xa("deleteField")}function hS(){return new od("serverTimestamp")}function dS(...r){return new ad("arrayUnion",r)}function fS(...r){return new cd("arrayRemove",r)}function pS(r){return new ud("increment",r)}function CS(r){return new Mt(r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function K(r){let e;return r instanceof qs?r:(e=qa(r)?IS(r):r instanceof Array?yS(r):YE(r,void 0),e)}function iB(r){if(r instanceof qs)return r;if(r instanceof Mt)return Ea(r);if(Array.isArray(r))return Ea(CS(r));throw new Error("Unsupported value: "+typeof r)}function dd(r){return Kb(r)?Wc(r):K(r)}class qs{constructor(){this._protoValueType="ProtoValue"}add(e){return new V("add",[this,K(e)],"add")}asBoolean(){if(this instanceof Mr)return this;if(this instanceof Js)return new ZE(this);if(this instanceof js)return new ES(this);if(this instanceof V)return new XE(this);throw new x("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new V("subtract",[this,K(e)],"subtract")}multiply(e){return new V("multiply",[this,K(e)],"multiply")}divide(e){return new V("divide",[this,K(e)],"divide")}mod(e){return new V("mod",[this,K(e)],"mod")}equal(e){return new V("equal",[this,K(e)],"equal").asBoolean()}notEqual(e){return new V("not_equal",[this,K(e)],"notEqual").asBoolean()}lessThan(e){return new V("less_than",[this,K(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new V("less_than_or_equal",[this,K(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new V("greater_than",[this,K(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new V("greater_than_or_equal",[this,K(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){const n=[e,...t].map(s=>K(s));return new V("array_concat",[this,...n],"arrayConcat")}arrayContains(e){return new V("array_contains",[this,K(e)],"arrayContains").asBoolean()}arrayContainsAll(e){const t=Array.isArray(e)?new Vo(e.map(K),"arrayContainsAll"):e;return new V("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){const t=Array.isArray(e)?new Vo(e.map(K),"arrayContainsAny"):e;return new V("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new V("array_reverse",[this])}arrayLength(){return new V("array_length",[this],"arrayLength")}equalAny(e){const t=Array.isArray(e)?new Vo(e.map(K),"equalAny"):e;return new V("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){const t=Array.isArray(e)?new Vo(e.map(K),"notEqualAny"):e;return new V("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new V("exists",[this],"exists").asBoolean()}charLength(){return new V("char_length",[this],"charLength")}like(e){return new V("like",[this,K(e)],"like").asBoolean()}regexContains(e){return new V("regex_contains",[this,K(e)],"regexContains").asBoolean()}regexFind(e){return new V("regex_find",[this,K(e)],"regexFind")}regexFindAll(e){return new V("regex_find_all",[this,K(e)],"regexFindAll")}regexMatch(e){return new V("regex_match",[this,K(e)],"regexMatch").asBoolean()}stringContains(e){return new V("string_contains",[this,K(e)],"stringContains").asBoolean()}startsWith(e){return new V("starts_with",[this,K(e)],"startsWith").asBoolean()}endsWith(e){return new V("ends_with",[this,K(e)],"endsWith").asBoolean()}toLower(){return new V("to_lower",[this],"toLower")}toUpper(){return new V("to_upper",[this],"toUpper")}trim(e){const t=[this];return e&&t.push(K(e)),new V("trim",t,"trim")}ltrim(e){const t=[this];return e&&t.push(K(e)),new V("ltrim",t,"ltrim")}rtrim(e){const t=[this];return e&&t.push(K(e)),new V("rtrim",t,"rtrim")}type(){return new V("type",[this])}isType(e){return new V("is_type",[this,Ea(e)],"isType").asBoolean()}stringConcat(e,...t){const n=[e,...t].map(K);return new V("string_concat",[this,...n],"stringConcat")}stringIndexOf(e){return new V("string_index_of",[this,K(e)],"stringIndexOf")}stringRepeat(e){return new V("string_repeat",[this,K(e)],"stringRepeat")}stringReplaceAll(e,t){return new V("string_replace_all",[this,K(e),K(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new V("string_replace_one",[this,K(e),K(t)],"stringReplaceOne")}concat(e,...t){const n=[e,...t].map(K);return new V("concat",[this,...n],"concat")}reverse(){return new V("reverse",[this],"reverse")}arrayFilter(e,t){return new V("array_filter",[this,K(e),t],"arrayFilter")}arrayTransform(e,t){return new V("array_transform",[this,K(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,n){return new V("array_transform",[this,K(e),K(t),n],"arrayTransformWithIndex")}arraySlice(e,t){const n=[this,K(e)];return t!==void 0&&n.push(K(t)),new V("array_slice",n,"arraySlice")}arrayFirst(){return new V("array_first",[this],"arrayFirst")}arrayFirstN(e){return new V("array_first_n",[this,K(e)],"arrayFirstN")}arrayLast(){return new V("array_last",[this],"arrayLast")}arrayLastN(e){return new V("array_last_n",[this,K(e)],"arrayLastN")}arrayMaximum(){return new V("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new V("maximum_n",[this,K(e)],"arrayMaximumN")}arrayMinimum(){return new V("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new V("minimum_n",[this,K(e)],"arrayMinimumN")}arrayIndexOf(e){return new V("array_index_of",[this,K(e),K("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new V("array_index_of",[this,K(e),K("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new V("array_index_of_all",[this,K(e)],"arrayIndexOfAll")}byteLength(){return new V("byte_length",[this],"byteLength")}ceil(){return new V("ceil",[this])}floor(){return new V("floor",[this])}abs(){return new V("abs",[this])}exp(){return new V("exp",[this])}mapGet(e){return new V("map_get",[this,Ea(e)],"mapGet")}mapSet(e,t,...n){const s=[this,K(e),K(t),...n.map(K)];return new V("map_set",s,"mapSet")}mapKeys(){return new V("map_keys",[this],"mapKeys")}mapValues(){return new V("map_values",[this],"mapValues")}mapEntries(){return new V("map_entries",[this],"mapEntries")}getField(e){return new V("get_field",[this,K(e)],"get_field")}count(){return jt._create("count",[this],"count")}sum(){return jt._create("sum",[this],"sum")}average(){return jt._create("average",[this],"average")}minimum(){return jt._create("minimum",[this],"minimum")}maximum(){return jt._create("maximum",[this],"maximum")}first(){return jt._create("first",[this],"first")}last(){return jt._create("last",[this],"last")}arrayAgg(){return jt._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return jt._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return jt._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){const n=[e,...t];return new V("maximum",[this,...n.map(K)],"logicalMaximum")}logicalMinimum(e,...t){const n=[e,...t];return new V("minimum",[this,...n.map(K)],"minimum")}vectorLength(){return new V("vector_length",[this],"vectorLength")}cosineDistance(e){return new V("cosine_distance",[this,iB(e)],"cosineDistance")}dotProduct(e){return new V("dot_product",[this,iB(e)],"dotProduct")}euclideanDistance(e){return new V("euclidean_distance",[this,iB(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new V("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new V("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new V("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new V("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new V("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new V("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new V("timestamp_add",[this,K(e),K(t)],"timestampAdd")}timestampSubtract(e,t){return new V("timestamp_subtract",[this,K(e),K(t)],"timestampSubtract")}timestampDiff(e,t){return new V("timestamp_diff",[this,dd(e),K(t)],"timestampDiff")}timestampExtract(e,t){const n=[this,K(e)];return t&&n.push(K(t)),new V("timestamp_extract",n,"timestampExtract")}documentId(){return new V("document_id",[this],"documentId")}parent(){return new V("parent",[this],"parent")}substring(e,t){const n=K(e);return new V("substring",t===void 0?[this,n]:[this,n,K(t)],"substring")}arrayGet(e){return new V("array_get",[this,K(e)],"arrayGet")}isError(){return new V("is_error",[this],"isError").asBoolean()}ifError(e){const t=new V("if_error",[this,K(e)],"ifError");return e instanceof Mr?t.asBoolean():t}isAbsent(){return new V("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new V("map_remove",[this,K(e)],"mapRemove")}mapMerge(e,...t){const n=K(e),s=t.map(K);return new V("map_merge",[this,n,...s],"mapMerge")}pow(e){return new V("pow",[this,K(e)])}trunc(e){return e===void 0?new V("trunc",[this]):new V("trunc",[this,K(e)],"trunc")}round(e){return e===void 0?new V("round",[this]):new V("round",[this,K(e)],"round")}collectionId(){return new V("collection_id",[this])}length(){return new V("length",[this])}ln(){return new V("ln",[this])}sqrt(){return new V("sqrt",[this])}stringReverse(){return new V("string_reverse",[this])}ifAbsent(e){return new V("if_absent",[this,K(e)],"ifAbsent")}ifNull(e){return new V("if_null",[this,K(e)],"ifNull")}coalesce(e,...t){return new V("coalesce",[this,K(e),...t.map(K)],"coalesce")}join(e){return new V("join",[this,K(e)],"join")}log10(){return new V("log10",[this])}arraySum(){return new V("sum",[this])}split(e){return new V("split",[this,K(e)])}timestampTruncate(e,t){const n=[this,K(e)];return t&&n.push(K(t)),new V("timestamp_trunc",n)}ascending(){return wS(this)}descending(){return DS(this)}as(e){return new mS(this,e,"as")}}class jt{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,n){const s=new jt(e,t);return s._methodName=n,s}as(e){return new gS(this,e,"as")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map(t=>t._toProto(e))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach(t=>t._readUserData(e))}}class gS{constructor(e,t,n){this.aggregate=e,this.alias=t,this._methodName=n}_readUserData(e){this.aggregate._readUserData(e)}}class mS{constructor(e,t,n){this.expr=e,this.alias=t,this._methodName=n,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}}class Vo extends qs{constructor(e,t){super(),this.ur=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.ur.map(t=>t._toProto(e))}}}_readUserData(e){this.ur.forEach(t=>t._readUserData(e))}}class js extends qs{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new V("geo_distance",[this,K(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}}function Wc(r){return _S(r,"field")}function _S(r,e){return new js(typeof r=="string"?yn===r?FP()._internalPath:Qn("field",r):r._internalPath,e)}class Js extends qs{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){const t=new Js(e,void 0);return t._protoValue=e,t}_toProto(e){return q(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,lS(this._protoValue)||(this._protoValue=Fn(this.value,e))}}function Ea(r,e){return YE(r,"constant")}function YE(r,e){const t=new Js(r,e);return typeof r=="boolean"?new ZE(t):t}class V extends qs{constructor(e,t,n,s){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,n!==void 0&&(this._methodName=n),s!==void 0&&(this._options=s)}get _optionsUtil(){return new yt({})}_toProto(e){const t={functionValue:{name:this.name,args:this.params.map(n=>n._toProto(e))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach(t=>t._readUserData(e)),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}}class Mr extends qs{get _methodName(){return this._expr._methodName}countIf(){return jt._create("count_if",[this],"countIf")}not(){return new V("not",[this],"not").asBoolean()}conditional(e,t){return new V("conditional",[this,e,t],"conditional")}ifError(e){const t=K(e),n=new V("if_error",[this,t],"ifError");return t instanceof Mr?n.asBoolean():n}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}}class XE extends Mr{constructor(e){super(),this._expr=e,this.expressionType="Function"}}class ZE extends Mr{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class ES extends Mr{constructor(e){super(),this._expr=e,this.expressionType="Field"}}function IS(r,e){const t=[];for(const n in r)if(Object.prototype.hasOwnProperty.call(r,n)){const s=r[n];t.push(Ea(n)),t.push(K(s))}return new V("map",t,"map")}function yS(r){return function(t,n){return new V("array",t.map(s=>K(s)),n)}(r,"array")}function wS(r){return new fd(dd(r),"ascending","ascending")}function DS(r){return new fd(dd(r),"descending","descending")}class fd{constructor(e,t,n){this.expr=e,this.direction=t,this._methodName=n,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:vE(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yt{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}}class eI extends Yt{get _name(){return"add_fields"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[_a(e,this.fields)]}}_readUserData(e){super._readUserData(e),Ur(this.fields,e)}}class tI extends Yt{get _name(){return"aggregate"}get _optionsUtil(){return new yt({})}constructor(e,t,n){super(n),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[_a(e,this.accumulators),_a(e,this.groups)]}}_readUserData(e){super._readUserData(e),Ur(this.groups,e),Ur(this.accumulators,e)}}class nI extends Yt{get _name(){return"distinct"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[_a(e,this.groups)]}}_readUserData(e){super._readUserData(e),Ur(this.groups,e)}}class Za extends Yt{get _name(){return"collection"}get _optionsUtil(){return new yt({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.Er=e.startsWith("/")?e:"/"+e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.Er}]}}_readUserData(e){super._readUserData(e)}}class ec extends Yt{get _name(){return"collection_group"}get _optionsUtil(){return new yt({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}}class Yu extends Yt{get _name(){return"database"}get _optionsUtil(){return new yt({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}}class Xu extends Yt{get _name(){return"documents"}get _optionsUtil(){return new yt({})}constructor(e,t){if(super(t),!e||e.length===0)throw new x(O.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const n=e.map(i=>i.startsWith("/")?i:"/"+i),s=new Set(n);if(s.size!==n.length)throw new x(O.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.hr=n,this.Tr=s}_toProto(e){return{...super._toProto(e),args:this.hr.map(t=>({referenceValue:t}))}}_readUserData(e){super._readUserData(e)}}class tc extends Yt{get _name(){return"where"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.condition=e}_toProto(e){return{...super._toProto(e),args:[this.condition._toProto(e)]}}_readUserData(e){super._readUserData(e),Ur(this.condition,e)}}class Gr extends Yt{get _name(){return"limit"}get _optionsUtil(){return new yt({})}constructor(e,t){q(!isNaN(e)&&e!==1/0&&e!==-1/0,34860),super(t),this.limit=e}_toProto(e){return{...super._toProto(e),args:[ju(e,this.limit)]}}}class eg extends Yt{get _name(){return"offset"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.offset=e}_toProto(e){return{...super._toProto(e),args:[ju(e,this.offset)]}}}class TS extends Yt{get _name(){return"select"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[_a(e,this.selections)]}}_readUserData(e){super._readUserData(e),Ur(this.selections,e)}}class Dn extends Yt{get _name(){return"sort"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map(t=>t._toProto(e))}}_readUserData(e){super._readUserData(e),Ur(this.orderings,e)}}class pd extends Yt{get _name(){return"replace_with"}get _optionsUtil(){return new yt({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),vE(pd.Pr)]}}_readUserData(e){super._readUserData(e),Ur(this.map,e)}}pd.Pr="full_replace";function Ur(r,e){return $E(r)?r._readUserData(e):Array.isArray(r)?r.forEach(t=>t._readUserData(e)):r instanceof Map?r.forEach(t=>t._readUserData(e)):Object.values(r).forEach(t=>t._readUserData(e)),r}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $o{constructor(e,t,n,s){this._db=e,this.userDataReader=t,this._userDataWriter=n,this.stages=s}Ar(e,t){const n=this.userDataReader.createContext(3,e);return $E(t)?t._readUserData(n):Array.isArray(t)?t.forEach(s=>s._readUserData(n)):t.forEach(s=>s._readUserData(n)),t}where(e){const t=this.stages.map(n=>n);return this.Ar("where",e),t.push(new tc(e,{})),new $o(this._db,this.userDataReader,this._userDataWriter,t)}limit(e){const t=this.stages.map(n=>n);return t.push(new Gr(e,{})),new $o(this._db,this.userDataReader,this._userDataWriter,t)}sort(e,...t){const n=this.stages.map(s=>s);return"orderings"in e?n.push(new Dn(this.Ar("sort",e.orderings),{})):n.push(new Dn(this.Ar("sort",[e,...t]),{})),new $o(this._db,this.userDataReader,this._userDataWriter,n)}Vr(e){return{pipeline:{stages:this.stages.map(t=>t._toProto(e))}}}}// Copyright 2024 Google LLC* @license
class D{constructor(e,t){this.type=e,this.value=t}static dr(){return new D("ERROR",void 0)}static mr(){return new D("UNSET",void 0)}static pr(){return new D("NULL",Rn)}static newValue(e){return Wt(e)?new D("NULL",Rn):function(n){return!!n&&"booleanValue"in n}(e)?new D("BOOLEAN",e):wn(e)?new D("INT",e):ps(e)?new D("DOUBLE",e):function(n){return!!n&&"timestampValue"in n&&!!n.timestampValue}(e)?new D("TIMESTAMP",e):function(n){return!!n&&"stringValue"in n}(e)?new D("STRING",e):function(n){return!!n&&"bytesValue"in n}(e)?new D("BYTES",e):e.referenceValue?new D("REFERENCE",e):e.geoPointValue?new D("GEO_POINT",e):kr(e)?new D("ARRAY",e):Ns(e)?new D("VECTOR",e):ws(e)?new D("MAP",e):new D("ERROR",void 0)}gr(){return this.type==="ERROR"||this.type==="UNSET"}yr(){return this.type==="NULL"}}function Yo(r){if(!r.gr())return r.value}function rI(r){return r instanceof Mr?r._expr:r}function se(r){if((r=rI(r))instanceof js)return new AS(r);if(r instanceof Js)return new vS(r);if(r instanceof Vo)return new RS(r);if(r instanceof V){if(r.name==="add")return new SS(r);if(r.name==="subtract")return new NS(r);if(r.name==="multiply")return new OS(r);if(r.name==="divide")return new FS(r);if(r.name==="mod")return new LS(r);if(r.name==="and")return new kS(r);if(r.name==="equal")return new WS(r);if(r.name==="not_equal")return new QS(r);if(r.name==="less_than")return new $S(r);if(r.name==="less_than_or_equal")return new YS(r);if(r.name==="greater_than")return new XS(r);if(r.name==="greater_than_or_equal")return new ZS(r);if(r.name==="array_concat")return new eN(r);if(r.name==="array_reverse")return new tN(r);if(r.name==="array_contains")return new nN(r);if(r.name==="array_contains_all")return new rN(r);if(r.name==="array_contains_any")return new sN(r);if(r.name==="array_length")return new iN(r);if(r.name==="array_element")return new oN(r);if(r.name==="equal_any")return new sI(r);if(r.name==="not_equal_any")return new xS(r);if(r.name==="is_nan")return new MS(r);if(r.name==="is_not_nan")return new GS(r);if(r.name==="is_null")return new US(r);if(r.name==="is_not_null")return new HS(r);if(r.name==="is_error")return new qS(r);if(r.name==="exists")return new jS(r);if(r.name==="not")return new Zu(r);if(r.name==="or")return new VS(r);if(r.name==="xor")return new Cd(r);if(r.name==="conditional")return new JS(r);if(r.name==="maximum")return new KS(r);if(r.name==="minimum")return new zS(r);if(r.name==="reverse")return new aN(r);if(r.name==="replace_first")return new cN(r);if(r.name==="replace_all")return new uN(r);if(r.name==="char_length")return new lN(r);if(r.name==="byte_length")return new BN(r);if(r.name==="like")return new hN(r);if(r.name==="regex_contains")return new dN(r);if(r.name==="regex_match")return new fN(r);if(r.name==="string_contains")return new pN(r);if(r.name==="starts_with")return new CN(r);if(r.name==="ends_with")return new gN(r);if(r.name==="to_lower")return new mN(r);if(r.name==="to_upper")return new _N(r);if(r.name==="trim")return new EN(r);if(r.name==="string_concat")return new IN(r);if(r.name==="map_get")return new yN(r);if(r.name==="cosine_distance")return new wN(r);if(r.name==="dot_product")return new DN(r);if(r.name==="euclidean_distance")return new TN(r);if(r.name==="vector_length")return new AN(r);if(r.name==="unix_micros_to_timestamp")return new SN(r);if(r.name==="timestamp_to_unix_micros")return new FN(r);if(r.name==="unix_millis_to_timestamp")return new NN(r);if(r.name==="timestamp_to_unix_millis")return new LN(r);if(r.name==="unix_seconds_to_timestamp")return new ON(r);if(r.name==="timestamp_to_unix_seconds")return new kN(r);if(r.name==="timestamp_add")return new VN(r);if(r.name==="timestamp_subtract")return new xN(r)}throw new Error(`Unknown Expr : ${r}`)}class AS{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===yn)return D.newValue({referenceValue:Ni(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return D.newValue({timestampValue:zc(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return D.newValue({timestampValue:zc(e.serializer,t.createTime)});const n=t.data.field(this.expr._fieldPath);return n?Ja(n)?D.newValue(function(i,o){if(i.serverTimestampBehavior==="estimate")return{timestampValue:zc(i.serializer,Z.fromTimestamp(Ti(o)))};if(i.serverTimestampBehavior==="previous"){const a=Ka(o);if(a)return a}return{nullValue:"NULL_VALUE"}}(e,n)):D.newValue(n):D.mr()}}class vS{constructor(e){this.expr=e}evaluate(e,t){return D.newValue(this.expr._getValue())}}class RS{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.ur.map(s=>se(s).evaluate(e,t));return n.some(s=>s.gr())?D.dr():D.newValue({arrayValue:{values:n.map(s=>s.value)}})}}function dt(r){return ps(r)?Number(r.doubleValue):Number(r.integerValue)}function Ln(r){return BigInt(r.integerValue)}const bS=BigInt("0x7fffffffffffffff"),PS=-BigInt("0x8000000000000000");class nc{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length>=2,24778);const n=se(this.expr.params[0]).evaluate(e,t),s=se(this.expr.params[1]).evaluate(e,t);let i=this.wr(n,s);for(const o of this.expr.params.slice(2)){const a=se(o).evaluate(e,t);i=this.wr(i,a)}return i}wr(e,t){if(e.gr()||t.gr())return D.dr();if(e.yr()||t.yr())return D.pr();const n=e.value,s=t.value;if(!ps(n)&&!wn(n)||!ps(s)&&!wn(s))return D.dr();if(ps(n)||ps(s)){const i=this.br(n,s);return i?D.newValue(i):D.dr()}if(wn(n)&&wn(s)){const i=this.vr(n,s);return i===void 0?D.dr():typeof i=="number"?D.newValue({doubleValue:i}):i<PS||i>bS?D.dr():D.newValue({integerValue:`${i}`})}return D.dr()}}function $n(r,e){return Ze(r)!==Ze(e)?"TYPE_MISMATCH":Ut(r)||Ut(e)?"NOT_EQ":Wt(r)&&Wt(e)?"EQ":Wt(r)||Wt(e)?"NULL":kr(r)&&kr(e)?function(n,s){var o,a,c;if(((o=n.values)==null?void 0:o.length)!==((a=s.values)==null?void 0:a.length))return"NOT_EQ";let i=!1;for(let l=0;l<(((c=n.values)==null?void 0:c.length)??0);l++){const B=n.values[l],d=s.values[l];switch($n(B,d)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":i=!0;break;default:Y(44609,{Sr:B,Dr:d})}}return i?"NULL":"EQ"}(r.arrayValue,e.arrayValue):Ns(r)&&Ns(e)||ws(r)&&ws(e)?function(n,s){const i=n.fields||{},o=s.fields||{};if(cu(i)!==cu(o))return"NOT_EQ";let a=!1;for(const c in i)if(i.hasOwnProperty(c)){if(o[c]===void 0)return"NOT_EQ";switch($n(i[c],o[c])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":a=!0}}return a?"NULL":"EQ"}(r.mapValue,e.mapValue):function(n,s){return sn(n,s,{o:!1,t:!0,i:!0})}(r,e)?"EQ":"NOT_EQ"}class SS extends nc{vr(e,t){return Ln(e)+Ln(t)}br(e,t){return{doubleValue:dt(e)+dt(t)}}}class NS extends nc{constructor(e){super(e),this.expr=e}vr(e,t){return Ln(e)-Ln(t)}br(e,t){return{doubleValue:dt(e)-dt(t)}}}class OS extends nc{constructor(e){super(e),this.expr=e}vr(e,t){return Ln(e)*Ln(t)}br(e,t){return{doubleValue:dt(e)*dt(t)}}}class FS extends nc{constructor(e){super(e),this.expr=e}vr(e,t){const n=Ln(t);if(n!==BigInt(0))return Ln(e)/n}br(e,t){const n=dt(t);return n===0?{doubleValue:Ai(n)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:dt(e)/n}}}class LS extends nc{constructor(e){super(e),this.expr=e}vr(e,t){const n=Ln(t);if(n!==BigInt(0))return Ln(e)%n}br(e,t){const n=dt(t);if(n!==0)return{doubleValue:dt(e)%n}}}class kS{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const a=se(o).evaluate(e,t);switch(a.type){case"BOOLEAN":if(!((i=a.value)!=null&&i.booleanValue))return D.newValue(ct);break;case"NULL":s=!0;break;default:n=!0}}return n?D.dr():s?D.pr():D.newValue(Gt)}}class Zu{constructor(e){this.expr=e}evaluate(e,t){var s;q(this.expr.params.length===1,9634);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return D.newValue({booleanValue:!((s=n.value)!=null&&s.booleanValue)});case"NULL":return D.pr();default:return D.dr()}}}class VS{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const a=se(o).evaluate(e,t);switch(a.type){case"BOOLEAN":if((i=a.value)!=null&&i.booleanValue)return D.newValue(Gt);break;case"NULL":s=!0;break;default:n=!0}}return n?D.dr():s?D.pr():D.newValue(ct)}}class Cd{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const a=se(o).evaluate(e,t);switch(a.type){case"BOOLEAN":n=Cd.xor(n,!!((i=a.value)!=null&&i.booleanValue));break;case"NULL":s=!0;break;default:return D.dr()}}return s?D.pr():D.newValue({booleanValue:n})}static xor(e,t){return(e||t)&&!(e&&t)}}class sI{constructor(e){this.expr=e}evaluate(e,t){var o,a;q(this.expr.params.length===2,55094);let n=!1;const s=se(this.expr.params[0]).evaluate(e,t);switch(s.type){case"NULL":n=!0;break;case"ERROR":case"UNSET":return D.dr()}const i=se(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return D.dr()}if(n)return D.pr();for(const c of((a=(o=i.value)==null?void 0:o.arrayValue)==null?void 0:a.values)??[])switch(Wt(s.value)&&Wt(c)?"EQ":$n(s.value,c)){case"EQ":return D.newValue(Gt);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Y(44608,{value:s.value,candidate:c})}return n?D.pr():D.newValue(ct)}}class xS{constructor(e){this.expr=e}evaluate(e,t){return new Zu(new V("not",[new V("equal_any",this.expr.params)])).evaluate(e,t)}}class MS{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length===1,23322);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return D.newValue(ct);case"DOUBLE":return D.newValue({booleanValue:isNaN(dt(n.value))});case"NULL":return D.pr();default:return D.dr()}}}class GS{constructor(e){this.expr=e}evaluate(e,t){return q(this.expr.params.length===1,50406),new Zu(new V("not",[new V("is_nan",this.expr.params)])).evaluate(e,t)}}class US{constructor(e){this.expr=e}evaluate(e,t){switch(q(this.expr.params.length===1,23123),se(this.expr.params[0]).evaluate(e,t).type){case"NULL":return D.newValue(Gt);case"UNSET":case"ERROR":return D.dr();default:return D.newValue(ct)}}}class HS{constructor(e){this.expr=e}evaluate(e,t){return q(this.expr.params.length===1,23167),new Zu(new V("not",[new V("is_null",this.expr.params)])).evaluate(e,t)}}class qS{constructor(e){this.expr=e}evaluate(e,t){return q(this.expr.params.length===1,5228),se(this.expr.params[0]).evaluate(e,t).type==="ERROR"?D.newValue(Gt):D.newValue(ct)}}class jS{constructor(e){this.expr=e}evaluate(e,t){switch(q(this.expr.params.length===1,6877),se(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return D.dr();case"UNSET":return D.newValue(ct);default:return D.newValue(Gt)}}}class JS{constructor(e){this.expr=e}evaluate(e,t){var s;q(this.expr.params.length===3,11706);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return(s=n.value)!=null&&s.booleanValue?se(this.expr.params[1]).evaluate(e,t):se(this.expr.params[2]).evaluate(e,t);case"NULL":return se(this.expr.params[2]).evaluate(e,t);default:return D.dr()}}}class KS{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(i=>se(i).evaluate(e,t));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||It(i.value,s.value)>0?i:s}return s===void 0?D.pr():s}}class zS{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(i=>se(i).evaluate(e,t));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||It(i.value,s.value)<0?i:s}return s===void 0?D.pr():s}}class Zi{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"ERROR":case"UNSET":return D.dr()}const s=se(this.expr.params[1]).evaluate(e,t);switch(s.type){case"ERROR":case"UNSET":return D.dr()}return this.Cr(n,s)}}class WS extends Zi{constructor(e){super(e),this.expr=e}Cr(e,t){if(e.yr()&&t.yr())return D.newValue(Gt);if(e.yr()||t.yr()||Ut(e.value)||Ut(t.value)||Ze(e.value)!==Ze(t.value))return D.newValue(ct);switch($n(e.value,t.value)){case"EQ":return D.newValue(Gt);case"NOT_EQ":return D.newValue(ct);case"NULL":return D.pr();default:Y(44615,{left:e,right:t})}}}class QS extends Zi{constructor(e){super(e),this.expr=e}Cr(e,t){switch($n(e.value,t.value)){case"EQ":return D.newValue(ct);case"NOT_EQ":case"TYPE_MISMATCH":return D.newValue(Gt);case"NULL":return D.pr();default:Y(44614,{left:e,right:t})}}}class $S extends Zi{constructor(e){super(e),this.expr=e}Cr(e,t){return Ze(e.value)!==Ze(t.value)||Ut(e.value)||Ut(t.value)?D.newValue(ct):D.newValue({booleanValue:It(e.value,t.value)<0})}}class YS extends Zi{constructor(e){super(e),this.expr=e}Cr(e,t){return Ze(e.value)!==Ze(t.value)||Ut(e.value)||Ut(t.value)?D.newValue(ct):$n(e.value,t.value)==="EQ"?D.newValue(Gt):D.newValue({booleanValue:It(e.value,t.value)<0})}}class XS extends Zi{constructor(e){super(e),this.expr=e}Cr(e,t){return Ze(e.value)!==Ze(t.value)||Ut(e.value)||Ut(t.value)?D.newValue(ct):D.newValue({booleanValue:It(e.value,t.value)>0})}}class ZS extends Zi{constructor(e){super(e),this.expr=e}Cr(e,t){return Ze(e.value)!==Ze(t.value)||Ut(e.value)||Ut(t.value)?D.newValue(ct):$n(e.value,t.value)==="EQ"?D.newValue(Gt):D.newValue({booleanValue:It(e.value,t.value)>0})}}class eN{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class tN{constructor(e){this.expr=e}evaluate(e,t){var s;q(this.expr.params.length===1,216);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return D.pr();case"ARRAY":{const i=((s=n.value.arrayValue)==null?void 0:s.values)??[];return D.newValue({arrayValue:{values:[...i].reverse()}})}default:return D.dr()}}}class nN{constructor(e){this.expr=e}evaluate(e,t){return q(this.expr.params.length===2,52884),new sI(new V("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}}class rN{constructor(e){this.expr=e}evaluate(e,t){var c,l,B,d;q(this.expr.params.length===2,1392);let n=!1;const s=se(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return D.dr()}const i=se(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return D.dr()}if(n)return D.pr();const o=((l=(c=i.value)==null?void 0:c.arrayValue)==null?void 0:l.values)??[],a=((d=(B=s.value)==null?void 0:B.arrayValue)==null?void 0:d.values)??[];for(const p of o){let g=!1;n=!1;for(const w of a){switch(Wt(p)&&Wt(w)?"EQ":$n(p,w)){case"EQ":g=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Y(44613,{value:w,search:p})}if(g)break}if(!g)return D.newValue(ct)}return D.newValue(Gt)}}class sN{constructor(e){this.expr=e}evaluate(e,t){var c,l,B,d;q(this.expr.params.length===2,2680);let n=!1;const s=se(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return D.dr()}const i=se(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return D.dr()}if(n)return D.pr();const o=((l=(c=i.value)==null?void 0:c.arrayValue)==null?void 0:l.values)??[],a=((d=(B=s.value)==null?void 0:B.arrayValue)==null?void 0:d.values)??[];for(const p of a)for(const g of o)switch(Wt(p)&&Wt(g)?"EQ":$n(p,g)){case"EQ":return D.newValue(Gt);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Y(60403,{value:p,search:g})}return n?D.pr():D.newValue(ct)}}class iN{constructor(e){this.expr=e}evaluate(e,t){var s,i,o;q(this.expr.params.length===1,38605);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return D.pr();case"ARRAY":return D.newValue({integerValue:`${((o=(i=(s=n.value)==null?void 0:s.arrayValue)==null?void 0:i.values)==null?void 0:o.length)??0}`});default:return D.dr()}}}class oN{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class aN{constructor(e){this.expr=e}evaluate(e,t){var s,i;q(this.expr.params.length===1,1508);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return D.pr();case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;if(typeof o=="string"){const a=Le.fromBase64String(o).toUint8Array();return a.reverse(),D.newValue({bytesValue:Le.fromUint8Array(a).toBase64()})}return D.newValue({bytesValue:new Uint8Array(o).reverse()})}case"STRING":{const o=(i=n.value)==null?void 0:i.stringValue,a=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(o),c=Array.from(a,l=>l.segment).reverse();return D.newValue({stringValue:c.join("")})}default:return D.dr()}}}class cN{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class uN{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class lN{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length===1,19400);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return D.pr();case"STRING":{const s=function(o){let a=0;for(let c=0;c<o.length;c++){const l=o.codePointAt(c);if(l===void 0)return;if(l<=65535)if(l>=55296&&l<=57343)if(l<=56319){const B=o.codePointAt(c+1);B!==void 0&&B>=56320&&B<=57343?(a+=1,c++):a+=1}else a+=1;else a+=1;else{if(!(l<=1114111))return;a+=1,c++}}return a}(n.value.stringValue);return s===void 0?D.dr():D.newValue({integerValue:s})}default:return D.dr()}}}class BN{constructor(e){this.expr=e}evaluate(e,t){var s,i;q(this.expr.params.length===1,8486);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;return typeof o=="string"?D.newValue({integerValue:Le.fromBase64String(o).toUint8Array().length}):D.newValue({integerValue:new Uint8Array(o).length})}case"STRING":{const o=function(c){let l=0;for(let B=0;B<c.length;B++){const d=c.codePointAt(B);if(d===void 0)return;if(d>=55296&&d<=57343){if(!(d<=56319))return;{const p=c.codePointAt(B+1);if(p===void 0||!(p>=56320&&p<=57343))return;l+=4,B++}}else if(d<=127)l+=1;else if(d<=2047)l+=2;else if(d<=65535)l+=3;else{if(!(d<=1114111))return;l+=4,B++}}return l}((i=n.value)==null?void 0:i.stringValue);return o===void 0?D.dr():D.newValue({integerValue:o})}case"NULL":return D.pr();default:return D.dr()}}}class eo{constructor(e){this.expr=e}evaluate(e,t){var o,a;q(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let n=!1;const s=se(this.expr.params[0]).evaluate(e,t);switch(s.type){case"STRING":break;case"NULL":n=!0;break;default:return D.dr()}const i=se(this.expr.params[1]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":n=!0;break;default:return D.dr()}return n?D.pr():this.Fr((o=s.value)==null?void 0:o.stringValue,(a=i.value)==null?void 0:a.stringValue)}}class hN extends eo{Fr(e,t){try{const n=function(o){let a="";for(let c=0;c<o.length;c++){const l=o.charAt(c);switch(l){case"_":a+=".";break;case"%":a+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":a+="\\"+l;break;default:a+=l}}return"^"+a+"$"}(t),s=Mh.compile(n);return D.newValue({booleanValue:s.matches(e)})}catch(n){return Et(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${n}`),D.dr()}}}class dN extends eo{Fr(e,t){try{const n=Mh.compile(t);return D.newValue({booleanValue:n.test(e)})}catch{return Et(`Invalid regex pattern found in regex_contains: ${t}, returning error`),D.dr()}}}class fN extends eo{Fr(e,t){try{return D.newValue({booleanValue:Mh.compile(t).matches(e)})}catch{return Et(`Invalid regex pattern found in regex_match: ${t}, returning error`),D.dr()}}}class pN extends eo{Fr(e,t){return D.newValue({booleanValue:e.includes(t)})}}class CN extends eo{Fr(e,t){return D.newValue({booleanValue:e.startsWith(t)})}}class gN extends eo{Fr(e,t){return D.newValue({booleanValue:e.endsWith(t)})}}class mN{constructor(e){this.expr=e}evaluate(e,t){var s,i;q(this.expr.params.length===1,29079);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return D.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toLowerCase()});case"NULL":return D.pr();default:return D.dr()}}}class _N{constructor(e){this.expr=e}evaluate(e,t){var s,i;q(this.expr.params.length===1,60487);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return D.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toUpperCase()});case"NULL":return D.pr();default:return D.dr()}}}class EN{constructor(e){this.expr=e}evaluate(e,t){var s,i;q(this.expr.params.length===1,28544);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return D.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.trim()});case"NULL":return D.pr();default:return D.dr()}}}class IN{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(o=>se(o).evaluate(e,t));let s="",i=!1;for(const o of n)switch(o.type){case"STRING":s+=o.value.stringValue;break;case"NULL":i=!0;break;default:return D.dr()}return i?D.pr():D.newValue({stringValue:s})}}class yN{constructor(e){this.expr=e}evaluate(e,t){var o,a,c,l;q(this.expr.params.length===2,4483);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"UNSET":return D.mr();case"MAP":break;default:return D.dr()}const s=se(this.expr.params[1]).evaluate(e,t);if(s.type!=="STRING")return D.dr();const i=(l=(a=(o=n.value)==null?void 0:o.mapValue)==null?void 0:a.fields)==null?void 0:l[(c=s.value)==null?void 0:c.stringValue];return i===void 0?D.mr():D.newValue(i)}}class gd{constructor(e){this.expr=e}evaluate(e,t){var l,B;q(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let n=!1;const s=se(this.expr.params[0]).evaluate(e,t);switch(s.type){case"VECTOR":break;case"NULL":n=!0;break;default:return D.dr()}const i=se(this.expr.params[1]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":n=!0;break;default:return D.dr()}if(n)return D.pr();const o=SB(s.value),a=SB(i.value);if(o===void 0||a===void 0||((l=o.values)==null?void 0:l.length)!==((B=a.values)==null?void 0:B.length))return D.dr();const c=this.Or(o,a);return c===void 0||isNaN(c)?D.dr():D.newValue({doubleValue:c})}}class wN extends gd{Or(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return;let i=0,o=0,a=0;for(let l=0;l<n.length;l++){if(!Lr(n[l])||!Lr(s[l]))return;const B=dt(n[l]),d=dt(s[l]);i+=B*d,o+=B*B,a+=d*d}const c=Math.sqrt(o)*Math.sqrt(a);if(c!==0)return 1-Math.max(-1,Math.min(1,i/c))}}class DN extends gd{Or(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!Lr(n[o])||!Lr(s[o]))return;i+=dt(n[o])*dt(s[o])}return i}}class TN extends gd{Or(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!Lr(n[o])||!Lr(s[o]))return;const a=dt(n[o]),c=dt(s[o]);i+=Math.pow(a-c,2)}return Math.sqrt(i)}}class AN{constructor(e){this.expr=e}evaluate(e,t){var s;q(this.expr.params.length===1,39044);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"VECTOR":{const i=SB(n.value);return D.newValue({integerValue:((s=i==null?void 0:i.values)==null?void 0:s.length)??0})}case"NULL":return D.pr();default:return D.dr()}}}const Ia=BigInt(-62135596800),ya=BigInt(253402300799),Cu=BigInt(1e3),Rr=BigInt(1e6),vN=Ia*Cu,RN=ya*Cu+BigInt(999),bN=Ia*Rr,PN=ya*Rr+BigInt(999999);function md(r){return r>=bN&&r<=PN}function iI(r){return r>=Ia&&r<=ya}function wa(r,e){const t=BigInt(r);return!(t<Ia||t>ya)&&!(e<0||e>=1e9)&&(t!==Ia||e===0)&&!(t===ya&&e>999999999)}function oI(r,e){return e<0?{seconds:r-1,nanos:e+1e9}:{seconds:r,nanos:e}}function _d(r){return BigInt(r.seconds)*Rr+BigInt(Math.trunc(r.nanoseconds/1e3))}class Ed{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return this.toTimestamp(BigInt(n.value.integerValue));case"NULL":return D.pr();default:return D.dr()}}}class SN extends Ed{toTimestamp(e){if(!md(e))return D.dr();let t=Number(e/Rr),n=Number(e%Rr*BigInt(1e3));const s=oI(t,n);return t=s.seconds,n=s.nanos,wa(t,n)?D.newValue({timestampValue:{seconds:t,nanos:n}}):D.dr()}}class NN extends Ed{toTimestamp(e){if(!function(o){return o>=vN&&o<=RN}(e))return D.dr();let t=Number(e/Cu),n=Number(e%Cu*BigInt(1e6));const s=oI(t,n);return t=s.seconds,n=s.nanos,wa(t,n)?D.newValue({timestampValue:{seconds:t,nanos:n}}):D.dr()}}class ON extends Ed{toTimestamp(e){if(!iI(e))return D.dr();const t=Number(e);return D.newValue({timestampValue:{seconds:t,nanos:0}})}}class Id{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const n=se(this.expr.params[0]).evaluate(e,t);switch(n.type){case"TIMESTAMP":break;case"NULL":return D.pr();default:return D.dr()}const s=nd(n.value.timestampValue);return wa(s.seconds,s.nanoseconds)?this.Mr(s):D.dr()}}class FN extends Id{Mr(e){const t=_d(e);return md(t)?D.newValue({integerValue:`${t.toString()}`}):D.dr()}}class LN extends Id{Mr(e){const t=_d(e),n=t/BigInt(1e3),s=t%BigInt(1e3);return n>BigInt(0)||s===BigInt(0)?D.newValue({integerValue:n.toString()}):D.newValue({integerValue:(n-BigInt(1)).toString()})}}class kN extends Id{Mr(e){const t=BigInt(e.seconds);return iI(t)?D.newValue({integerValue:t.toString()}):D.dr()}}class aI{constructor(e){this.expr=e}evaluate(e,t){q(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let n=!1;const s=se(this.expr.params[0]).evaluate(e,t);switch(s.type){case"TIMESTAMP":break;case"NULL":n=!0;break;default:return D.dr()}const i=se(this.expr.params[1]).evaluate(e,t);let o;switch(i.type){case"STRING":if(o=function(te){switch(te){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}}(i.value.stringValue),o===void 0)return D.dr();break;case"NULL":n=!0;break;default:return D.dr()}const a=se(this.expr.params[2]).evaluate(e,t);switch(a.type){case"INT":break;case"NULL":n=!0;break;default:return D.dr()}if(n)return D.pr();const c=BigInt(a.value.integerValue);let l;try{switch(o){case"microsecond":l=c;break;case"millisecond":l=c*BigInt(1e3);break;case"second":l=c*BigInt(1e6);break;case"minute":l=c*BigInt(6e7);break;case"hour":l=c*BigInt(36e8);break;case"day":l=c*BigInt(864e8);break;default:return D.dr()}if(o!=="microsecond"&&c!==BigInt(0)&&l/c!==BigInt(this.Nr(o)))return D.dr()}catch(W){return Et(`Error during timestamp arithmetic: ${W}`),D.dr()}const B=nd(s.value.timestampValue);if(!wa(B.seconds,B.nanoseconds))return D.dr();const d=_d(B),p=this.Lr(d,l);if(!md(p))return D.dr();const g=Number(p/Rr),w=p%Rr,N=Number((w<0?w+Rr:w)*BigInt(1e3)),M=w<0?g-1:g;return wa(M,N)?D.newValue({timestampValue:{seconds:M,nanos:N}}):D.dr()}Nr(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class VN extends aI{Lr(e,t){return e+t}}class xN extends aI{Lr(e,t){return e-t}}// Copyright 2024 Google LLC* @license
class gt{constructor(e,t,n){this.serializer=e,this.stages=t,this.listenOptions=n,this.isCorePipeline=!0}getPipelineCollection(){return rc(this)}getPipelineCollectionGroup(){return yd(this)}getPipelineCollectionId(){return cI(this)}getPipelineDocuments(){return gu(this)}getPipelineFlavor(){return function(t){let n="exact";return t.stages.forEach((s,i)=>{s._name!==nI.name&&s._name!==tI.name||(n="keyless"),s._name===TS.name&&n==="exact"&&(n="augmented"),s._name===eI.name&&i<t.stages.length-1&&n==="exact"&&(n="augmented")}),n}(this)}getPipelineSourceType(){return qn(this)}}function qn(r){const e=r.stages[0];return e instanceof Za||e instanceof ec||e instanceof Yu||e instanceof Xu?e._name:"unknown"}function rc(r){if(qn(r)==="collection")return r.stages[0].Er}function yd(r){if(qn(r)==="collection_group")return r.stages[0].collectionId}function cI(r){switch(qn(r)){case"collection":return ce.fromString(rc(r)).lastSegment();case"collection_group":return yd(r);default:return}}function gu(r){if(qn(r)==="documents")return r.stages[0].hr}function Da(r){if((r=rI(r))instanceof js)return`fld(${r.fieldName})`;if(r instanceof Js)return`cst(${function(t){return t===null?"null":typeof t=="number"?t.toString():typeof t=="string"?`"${t}"`:t instanceof me?`ref(${t.path})`:t instanceof Mt?`vec(${JSON.stringify(t)})`:JSON.stringify(t)}(r.value)})`;if(r instanceof V)return`fn(${r.name},[${r.params.map(Da).join(",")}])`;if(r.expressionType==="ListOfExpressions")return`list([${r.ur.map(Da).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(r,null,2)}`)}function MN(r){if(r instanceof eI)return`${r._name}(${Oc(r.fields)})`;if(r instanceof tI){let e=`${r._name}(${Oc(r.accumulators)})`;return r.groups.size>0&&(e+=`grouping(${Oc(r.groups)})`),e}if(r instanceof nI)return`${r._name}(${Oc(r.groups)})`;if(r instanceof Za)return`${r._name}(${r.Er})`;if(r instanceof ec)return`${r._name}(${r.collectionId})`;if(r instanceof Yu)return`${r._name}()`;if(r instanceof Xu)return`${r._name}(${r.hr.sort()})`;if(r instanceof tc)return`${r._name}(${Da(r.condition)})`;if(r instanceof Gr)return`${r._name}(${r.limit})`;if(r instanceof Dn)return`${r._name}(${function(t){return t.map(n=>`${Da(n.expr)}${n.direction}`).join(",")}(r.orderings)})`;throw new Error(`Unrecognized stage ${r._name}`)}function Oc(r){return`${Array.from(r.entries()).sort().map(([e,t])=>`${e}=${Da(t)}`).join(",")}`}function jn(r){return r.stages.map(e=>MN(e)).join("|")}function uI(r,e){return jn(r)===jn(e)}function Ue(r){return r instanceof gt}function tg(r){return Ue(r)?jn(r):zo(r)}function lI(r){return Ue(r)?jn(r):function(t){return`${Bu(Pt(t))}|lt:${t.limitType}`}(r)}function el(r,e){return r instanceof gt&&e instanceof gt?uI(r,e):!(r instanceof gt&&!(e instanceof gt)||!(r instanceof gt)&&e instanceof gt)&&sE(r,e)}function tl(r){return Mn(r)?jn(r):Bu(r)}function wd(r,e){return r instanceof gt&&e instanceof gt?uI(r,e):!(r instanceof gt&&!(e instanceof gt)||!(r instanceof gt)&&e instanceof gt)&&$h(r,e)}function GN(r,e){const t=function(s){let i=!1;const o=[];for(const a of s)if(a instanceof Dn)if(i=!0,a.orderings.some(c=>c.expr instanceof js&&c.expr.fieldName===yn))o.push(a);else{const c=a.orderings.map(l=>l);c.push(Wc(yn).ascending()),o.push(new Dn(c,{}))}else a instanceof Gr&&(i||(o.push(new Dn([Wc(yn).ascending()],{})),i=!0)),o.push(a);return i||o.push(new Dn([Wc(yn).ascending()],{})),o}(r.stages);if(r.userDataReader){const n=r.userDataReader.createContext(3,"toCorePipeline");t.forEach(s=>s._readUserData(n))}return new gt(r.userDataReader.serializer,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dd{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&Zb(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=Ko(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=Ko(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=uE();return this.mutations.forEach(s=>{const i=e.get(s.key),o=i.overlayedDocument;let a=this.applyToLocalView(o,i.mutatedFields);a=t.has(s.key)?null:a;const c=K_(o,a);c!==null&&n.set(s.key,c),o.isValidDocument()||o.convertToNoDocument(Z.min())}),n}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),ae())}isEqual(e){return this.batchId===e.batchId&&Di(this.mutations,e.mutations,(t,n)=>PC(t,n))&&Di(this.baseMutations,e.baseMutations,(t,n)=>PC(t,n))}}class Td{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){q(e.mutations.length===n.length,58842,{Br:e.mutations.length,Ur:n.length});let s=function(){return gP}();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new Td(e,t,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mu="";function _t(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=ng(e)),e=UN(r.get(t),e);return ng(e)}function UN(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case mu:t+="";break;default:t+=i}}return t}function ng(r){return r+mu+""}function Tn(r){const e=r.length;if(q(e>=2,64408,{path:r}),e===2)return q(r.charAt(0)===mu&&r.charAt(1)==="",56145,{path:r}),ce.emptyPath();const t=e-2,n=[];let s="";for(let i=0;i<e;){const o=r.indexOf(mu,i);switch((o<0||o>t)&&Y(50515,{path:r}),r.charAt(o+1)){case"":const a=r.substring(i,o);let c;s.length===0?c=a:(s+=a,c=s,s=""),n.push(c);break;case"":s+=r.substring(i,o),s+="\0";break;case"":s+=r.substring(i,o+1);break;default:Y(61167,{path:r})}i=o+2}return new ce(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const os="remoteDocuments",sc="owner",ei="owner",Ta="mutationQueues",HN="userId",an="mutations",rg="batchId",Cs="userMutationsIndex",sg=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qc(r,e){return[r,_t(e)]}function BI(r,e,t){return[r,_t(e),t]}const qN={},Oi="documentMutations",_u="remoteDocumentsV14",jN=["prefixPath","collectionGroup","readTime","documentId"],$c="documentKeyIndex",JN=["prefixPath","collectionGroup","documentId"],hI="collectionGroupIndex",KN=["collectionGroup","readTime","prefixPath","documentId"],Aa="remoteDocumentGlobal",HB="remoteDocumentGlobalKey",Fi="targets",dI="queryTargetsIndex",zN=["canonicalId","targetId"],Li="targetDocuments",WN=["targetId","path"],Ad="documentTargetsIndex",QN=["path","targetId"],Eu="targetGlobalKey",Ds="targetGlobal",va="collectionParents",$N=["collectionId","parent"],ki="clientMetadata",YN="clientId",nl="bundles",XN="bundleId",rl="namedQueries",ZN="name",vd="indexConfiguration",eO="indexId",qB="collectionGroupIndex",tO="collectionGroup",Xo="indexState",nO=["indexId","uid"],fI="sequenceNumberIndex",rO=["uid","sequenceNumber"],Zo="indexEntries",sO=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],pI="documentKeyIndex",iO=["indexId","uid","orderedDocumentKey"],sl="documentOverlays",oO=["userId","collectionPath","documentId"],jB="collectionPathOverlayIndex",aO=["userId","collectionPath","largestBatchId"],CI="collectionGroupOverlayIndex",cO=["userId","collectionGroup","largestBatchId"],Rd="globals",uO="name",gI=[Ta,an,Oi,os,Fi,sc,Ds,Li,ki,Aa,va,nl,rl],lO=[...gI,sl],mI=[Ta,an,Oi,_u,Fi,sc,Ds,Li,ki,Aa,va,nl,rl,sl],_I=mI,bd=[..._I,vd,Xo,Zo],BO=bd,EI=[...bd,Rd],hO=EI;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function II(r,e,t){const n=r.store(an),s=r.store(Oi),i=[],o=IDBKeyRange.only(t.batchId);let a=0;const c=n.jn({range:o},(B,d,p)=>(a++,p.delete()));i.push(c.next(()=>{q(a===1,47070,{batchId:t.batchId})}));const l=[];for(const B of t.mutations){const d=BI(e,B.key.path,t.batchId);i.push(s.delete(d)),l.push(B.key)}return b.waitFor(i).next(()=>l)}function Iu(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw Y(14731);e=r.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class JB extends OE{constructor(e,t){super(),this.kr=e,this.currentSequenceNumber=t}}function rt(r,e){const t=$(r);return Pn.xn(t.kr,e)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pd{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class An{constructor(e,t,n,s,i=Z.min(),o=Z.min(),a=Le.EMPTY_BYTE_STRING,c=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=a,this.expectedCount=c}withSequenceNumber(e){return new An(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new An(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new An(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new An(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yI{constructor(e){this.qr=e}}function dO(r,e){let t;if(e.document)t=mE(r.qr,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=z.fromSegments(e.noDocument.path),s=Vs(e.noDocument.readTime);t=Fe.newNoDocument(n,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return Y(56709);{const n=z.fromSegments(e.unknownDocument.path),s=Vs(e.unknownDocument.version);t=Fe.newUnknownDocument(n,s)}}return e.readTime&&t.setReadTime(function(s){const i=new Ie(s[0],s[1]);return Z.fromTimestamp(i)}(e.readTime)),t}function ig(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:yu(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=function(i,o){return{name:Ni(i,o.key),fields:o.data.value.mapValue.fields,updateTime:Si(i,o.version.toTimestamp()),createTime:Si(i,o.createTime.toTimestamp())}}(r.qr,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:ks(e.version)};else{if(!e.isUnknownDocument())return Y(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:ks(e.version)}}return n}function yu(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function ks(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function Vs(r){const e=new Ie(r.seconds,r.nanoseconds);return Z.fromTimestamp(e)}function us(r,e){const t=(e.baseMutations||[]).map(i=>GB(r.qr,i));for(let i=0;i<e.mutations.length-1;++i){const o=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const a=e.mutations[i+1];o.updateTransforms=a.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const n=e.mutations.map(i=>GB(r.qr,i)),s=Ie.fromMillis(e.localWriteTimeMs);return new Dd(e.batchId,s,t,n)}function xo(r,e){const t=Vs(e.readTime),n=e.lastLimboFreeSnapshotVersion!==void 0?Vs(e.lastLimboFreeSnapshotVersion):Z.min();let s;return s=function(o){return o.structuredPipeline!==void 0}(e.query)?function(o,a){var B,d;const c=o.structuredPipeline;q((((B=c==null?void 0:c.pipeline)==null?void 0:B.stages)??[]).length>0,1845);const l=(d=c==null?void 0:c.pipeline)==null?void 0:d.stages.map(fO);return new gt(a,l)}(e.query,r.qr):function(o){return o.documents!==void 0}(e.query)?function(o){const a=o.documents.length;return q(a===1,1966,{count:a}),Pt(Yi(CE(o.documents[0])))}(e.query):function(o){return Pt(IE(o))}(e.query),new An(s,e.targetId,"TargetPurposeListen",e.lastListenSequenceNumber,t,n,Le.fromBase64String(e.resumeToken))}function wI(r,e){const t=ks(e.snapshotVersion),n=ks(e.lastLimboFreeSnapshotVersion);let s;s=Mn(e.target)?yE(r.qr,e.target):Yh(e.target)?_E(r.qr,e.target):EE(r.qr,e.target).be;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:tl(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function Sd(r){const e=IE({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?du(e,e.limit,"L"):e}function Fc(r,e){return new Pd(e.largestBatchId,GB(r.qr,e.overlayMutation))}function og(r,e){const t=e.path.lastSegment();return[r,_t(e.path.popLast()),t]}function ag(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:ks(n.readTime),documentKey:_t(n.documentKey.path),largestBatchId:n.largestBatchId}}function fO(r){switch(r.name){case"collection":return new Za(r.args[0].referenceValue,{});case"collection_group":return new ec(r.args[1].stringValue,{});case"database":return new Yu({});case"documents":return new Xu(r.args.map(e=>e.referenceValue),{});case"where":return new tc(KB(r.args[0]),{});case"limit":{const e=r.args[0].integerValue??r.args[0].doubleValue;return new Gr(typeof e=="number"?e:Number(e),{})}case"sort":return new Dn(r.args.map(e=>function(n){var i,o;const s=(i=n.mapValue)==null?void 0:i.fields;return new fd(KB(s.expression),(o=s.direction)==null?void 0:o.stringValue,"orderingFromProto")}(e)),{});default:throw new Error(`Stage type: ${r.name} not supported.`)}}function KB(r){return r.fieldReferenceValue?new js(Qn("_exprFromProto",r.fieldReferenceValue),"_exprFromProto"):r.functionValue?function(t){var n;return new V(t.functionValue.name,((n=t.functionValue.args)==null?void 0:n.map(KB))||[])}(r):Js._fromProto(r)}class il{constructor(e,t,n,s){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=s,this.$r={}}static Kr(e,t,n,s){q(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new il(i,t,n,s)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return hr(e).jn({index:Cs,range:n},(s,i,o)=>{t=!1,o.done()}).next(()=>t)}addMutationBatch(e,t,n,s){const i=hi(e),o=hr(e);return o.add({}).next(a=>{q(typeof a=="number",49019);const c=new Dd(a,t,n,s),l=function(g,w,N){const M=N.baseMutations.map(te=>ma(g.qr,te)),W=N.mutations.map(te=>ma(g.qr,te));return{userId:w,batchId:N.batchId,localWriteTimeMs:N.localWriteTime.toMillis(),baseMutations:M,mutations:W}}(this.serializer,this.userId,c),B=[];let d=new ye((p,g)=>oe(p.canonicalString(),g.canonicalString()));for(const p of s){const g=BI(this.userId,p.key.path,a);d=d.add(p.key.path.popLast()),B.push(o.put(l)),B.push(i.put(g,qN))}return d.forEach(p=>{B.push(this.indexManager.addToCollectionParentIndex(e,p))}),e.addOnCommittedListener(()=>{this.$r[a]=c.keys()}),b.waitFor(B).next(()=>c)})}lookupMutationBatch(e,t){return hr(e).get(t).next(n=>n?(q(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),us(this.serializer,n)):null)}Wr(e,t){return this.$r[t]?b.resolve(this.$r[t]):this.lookupMutationBatch(e,t).next(n=>{if(n){const s=n.keys();return this.$r[t]=s,s}return null})}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return hr(e).jn({index:Cs,range:s},(o,a,c)=>{a.userId===this.userId&&(q(a.batchId>=n,47524,{Qr:n}),i=us(this.serializer,a)),c.done()}).next(()=>i)}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=vr;return hr(e).jn({index:Cs,range:t,reverse:!0},(s,i,o)=>{n=i.batchId,o.done()}).next(()=>n)}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,vr],[this.userId,Number.POSITIVE_INFINITY]);return hr(e).Kn(Cs,t).next(n=>n.map(s=>us(this.serializer,s)))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=Qc(this.userId,t.path),s=IDBKeyRange.lowerBound(n),i=[];return hi(e).jn({range:s},(o,a,c)=>{const[l,B,d]=o,p=Tn(B);if(l===this.userId&&t.path.isEqual(p))return hr(e).get(d).next(g=>{if(!g)throw Y(61480,{Gr:o,batchId:d});q(g.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:g.userId,batchId:d}),i.push(us(this.serializer,g))});c.done()}).next(()=>i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new ye(oe);const s=[];return t.forEach(i=>{const o=Qc(this.userId,i.path),a=IDBKeyRange.lowerBound(o),c=hi(e).jn({range:a},(l,B,d)=>{const[p,g,w]=l,N=Tn(g);p===this.userId&&i.path.isEqual(N)?n=n.add(w):d.done()});s.push(c)}),b.waitFor(s).next(()=>this.zr(e,n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1,i=Qc(this.userId,n),o=IDBKeyRange.lowerBound(i);let a=new ye(oe);return hi(e).jn({range:o},(c,l,B)=>{const[d,p,g]=c,w=Tn(p);d===this.userId&&n.isPrefixOf(w)?w.length===s&&(a=a.add(g)):B.done()}).next(()=>this.zr(e,a))}zr(e,t){const n=[],s=[];return t.forEach(i=>{s.push(hr(e).get(i).next(o=>{if(o===null)throw Y(35274,{batchId:i});q(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:i}),n.push(us(this.serializer,o))}))}),b.waitFor(s).next(()=>n)}removeMutationBatch(e,t){return II(e.kr,this.userId,t).next(n=>(e.addOnCommittedListener(()=>{this.jr(t.batchId)}),b.forEach(n,s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))}jr(e){delete this.$r[e]}performConsistencyCheck(e){return this.checkEmpty(e).next(t=>{if(!t)return b.resolve();const n=IDBKeyRange.lowerBound(function(o){return[o]}(this.userId)),s=[];return hi(e).jn({range:n},(i,o,a)=>{if(i[0]===this.userId){const c=Tn(i[1]);s.push(c)}else a.done()}).next(()=>{q(s.length===0,56720,{Hr:s.map(i=>i.canonicalString())})})})}containsKey(e,t){return DI(e,this.userId,t)}Jr(e){return TI(e).get(this.userId).next(t=>t||{userId:this.userId,lastAcknowledgedBatchId:vr,lastStreamToken:""})}}function DI(r,e,t){const n=Qc(e,t.path),s=n[1],i=IDBKeyRange.lowerBound(n);let o=!1;return hi(r).jn({range:i,zn:!0},(a,c,l)=>{const[B,d,p]=a;B===e&&d===s&&(o=!0),l.done()}).next(()=>o)}function hr(r){return rt(r,an)}function hi(r){return rt(r,Oi)}function TI(r){return rt(r,Ta)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pO{getBundleMetadata(e,t){return cg(e).get(t).next(n=>{if(n)return function(i){return{id:i.bundleId,createTime:Vs(i.createTime),version:i.version}}(n)})}saveBundleMetadata(e,t){return cg(e).put(function(s){return{bundleId:s.id,createTime:ks(Je(s.createTime)),version:s.version}}(t))}getNamedQuery(e,t){return ug(e).get(t).next(n=>{if(n)return function(i){return{name:i.name,query:Sd(i.bundledQuery),readTime:Vs(i.readTime)}}(n)})}saveNamedQuery(e,t){return ug(e).put(function(s){return{name:s.name,readTime:ks(Je(s.readTime)),bundledQuery:s.bundledQuery}}(t))}}function cg(r){return rt(r,nl)}function ug(r){return rt(r,rl)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ol{constructor(e,t){this.serializer=e,this.userId=t}static Kr(e,t){const n=t.uid||"";return new ol(e,n)}getOverlay(e,t){return ti(e).get(og(this.userId,t)).next(n=>n?Fc(this.serializer,n):null)}getOverlays(e,t){const n=en();return b.forEach(t,s=>this.getOverlay(e,s).next(i=>{i!==null&&n.set(s,i)})).next(()=>n)}getAllOverlays(e,t){const n=en();return ti(e).jn((s,i)=>{const o=Fc(this.serializer,i);o.largestBatchId>t&&n.set(o.getKey(),o)}).next(()=>n)}saveOverlays(e,t,n){const s=[];return n.forEach((i,o)=>{const a=new Pd(t,o);s.push(this.Yr(e,a))}),b.waitFor(s)}removeOverlaysForBatchId(e,t,n){const s=new Set;t.forEach(o=>s.add(_t(o.getCollectionPath())));const i=[];return s.forEach(o=>{const a=IDBKeyRange.bound([this.userId,o,n],[this.userId,o,n+1],!1,!0);i.push(ti(e).Gn(jB,a))}),b.waitFor(i)}getOverlaysForCollection(e,t,n){const s=en(),i=_t(t),o=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return ti(e).Kn(jB,o).next(a=>{for(const c of a){const l=Fc(this.serializer,c);s.set(l.getKey(),l)}return s})}getOverlaysForCollectionGroup(e,t,n,s){const i=en();let o;const a=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return ti(e).jn({index:CI,range:a},(c,l,B)=>{const d=Fc(this.serializer,l);i.size()<s||d.largestBatchId===o?(i.set(d.getKey(),d),o=d.largestBatchId):B.done()}).next(()=>i)}Yr(e,t){return ti(e).put(function(s,i,o){const[a,c,l]=og(i,o.mutation.key);return{userId:i,collectionPath:c,documentId:l,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:ma(s.qr,o.mutation)}}(this.serializer,this.userId,t))}}function ti(r){return rt(r,sl)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class CO{Zr(e){return rt(e,Rd)}getSessionToken(e){return this.Zr(e).get("sessionToken").next(t=>{const n=t==null?void 0:t.value;return n?Le.fromUint8Array(n):Le.EMPTY_BYTE_STRING})}setSessionToken(e,t){return this.Zr(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ls{constructor(){}Xr(e,t){this.ei(e,t),t.ti()}ei(e,t){if("nullValue"in e)this.ni(t,5);else if("booleanValue"in e)this.ni(t,10),t.ri(e.booleanValue?1:0);else if("integerValue"in e)this.ni(t,15),t.ri(Pe(e.integerValue));else if("doubleValue"in e){const n=Pe(e.doubleValue);isNaN(n)?this.ni(t,13):(this.ni(t,15),Ai(n)?t.ri(0):t.ri(n))}else if("timestampValue"in e){let n=e.timestampValue;this.ni(t,20),typeof n=="string"&&(n=zn(n)),t.ii(`${n.seconds||""}`),t.ri(n.nanos||0)}else if("stringValue"in e)this.si(e.stringValue,t),this._i(t);else if("bytesValue"in e)this.ni(t,30),t.oi(Wn(e.bytesValue)),this._i(t);else if("referenceValue"in e)this.ai(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.ni(t,45),t.ri(n.latitude||0),t.ri(n.longitude||0)}else"mapValue"in e?M_(e)?this.ni(t,Number.MAX_SAFE_INTEGER):Ns(e)?this.ui(e.mapValue,t):(this.ci(e.mapValue,t),this._i(t)):"arrayValue"in e?(this.li(e.arrayValue,t),this._i(t)):Y(19022,{Ei:e})}si(e,t){this.ni(t,25),this.hi(e,t)}hi(e,t){t.ii(e)}ci(e,t){const n=e.fields||{};this.ni(t,55);for(const s of Object.keys(n))this.si(s,t),this.ei(n[s],t)}ui(e,t){var o,a;const n=e.fields||{};this.ni(t,53);const s=Ps,i=((a=(o=n[s].arrayValue)==null?void 0:o.values)==null?void 0:a.length)||0;this.ni(t,15),t.ri(Pe(i)),this.si(s,t),this.ei(n[s],t)}li(e,t){const n=e.values||[];this.ni(t,50);for(const s of n)this.ei(s,t)}ai(e,t){this.ni(t,37),z.fromName(e).path.forEach(n=>{this.ni(t,60),this.hi(n,t)})}ni(e,t){e.ri(t)}_i(e){e.ri(2)}}ls.Ti=new ls;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ni=255;function gO(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function lg(r){const e=64-function(n){let s=0;for(let i=0;i<8;++i){const o=gO(255&n[i]);if(s+=o,o!==8)break}return s}(r);return Math.ceil(e/8)}class mO{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Pi(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Ri(n.value),n=t.next();this.Ii()}Ai(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Vi(n.value),n=t.next();this.di()}fi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Ri(n);else if(n<2048)this.Ri(960|n>>>6),this.Ri(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Ri(480|n>>>12),this.Ri(128|63&n>>>6),this.Ri(128|63&n);else{const s=t.codePointAt(0);this.Ri(240|s>>>18),this.Ri(128|63&s>>>12),this.Ri(128|63&s>>>6),this.Ri(128|63&s)}}this.Ii()}mi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Vi(n);else if(n<2048)this.Vi(960|n>>>6),this.Vi(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Vi(480|n>>>12),this.Vi(128|63&n>>>6),this.Vi(128|63&n);else{const s=t.codePointAt(0);this.Vi(240|s>>>18),this.Vi(128|63&s>>>12),this.Vi(128|63&s>>>6),this.Vi(128|63&s)}}this.di()}pi(e){const t=this.gi(e),n=lg(t);this.yi(1+n),this.buffer[this.position++]=255&n;for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=255&t[s]}wi(e){const t=this.gi(e),n=lg(t);this.yi(1+n),this.buffer[this.position++]=~(255&n);for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}bi(){this.Si(ni),this.Si(255)}Di(){this.xi(ni),this.xi(255)}reset(){this.position=0}seed(e){this.yi(e.length),this.buffer.set(e,this.position),this.position+=e.length}Ci(){return this.buffer.slice(0,this.position)}gi(e){const t=function(i){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,i,!1),new Uint8Array(o.buffer)}(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let s=1;s<t.length;++s)t[s]^=n?255:0;return t}Ri(e){const t=255&e;t===0?(this.Si(0),this.Si(255)):t===ni?(this.Si(ni),this.Si(0)):this.Si(t)}Vi(e){const t=255&e;t===0?(this.xi(0),this.xi(255)):t===ni?(this.xi(ni),this.xi(0)):this.xi(e)}Ii(){this.Si(0),this.Si(1)}di(){this.xi(0),this.xi(1)}Si(e){this.yi(1),this.buffer[this.position++]=e}xi(e){this.yi(1),this.buffer[this.position++]=~e}yi(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class _O{constructor(e){this.Fi=e}oi(e){this.Fi.Pi(e)}ii(e){this.Fi.fi(e)}ri(e){this.Fi.pi(e)}ti(){this.Fi.bi()}}class EO{constructor(e){this.Fi=e}oi(e){this.Fi.Ai(e)}ii(e){this.Fi.mi(e)}ri(e){this.Fi.wi(e)}ti(){this.Fi.Di()}}class Ro{constructor(){this.Fi=new mO,this.ascending=new _O(this.Fi),this.descending=new EO(this.Fi)}seed(e){this.Fi.seed(e)}Oi(e){return e===0?this.ascending:this.descending}Ci(){return this.Fi.Ci()}reset(){this.Fi.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bs{constructor(e,t,n,s){this.Mi=e,this.Ni=t,this.Li=n,this.Bi=s}Ui(){const e=this.Bi.length,t=e===0||this.Bi[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.Bi,0),t!==e?n.set([0],this.Bi.length):++n[n.length-1],new Bs(this.Mi,this.Ni,this.Li,n)}ki(e,t,n){return{indexId:this.Mi,uid:e,arrayValue:Yc(this.Li),directionalValue:Yc(this.Bi),orderedDocumentKey:Yc(t),documentKey:n.path.toArray()}}qi(e,t,n){const s=this.ki(e,t,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function dr(r,e){let t=r.Mi-e.Mi;return t!==0?t:(t=Bg(r.Li,e.Li),t!==0?t:(t=Bg(r.Bi,e.Bi),t!==0?t:z.comparator(r.Ni,e.Ni)))}function Bg(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function Yc(r){return Yg()?function(t){let n="";for(let s=0;s<t.length;s++)n+=String.fromCharCode(t[s]);return n}(r):r}function hg(r){return typeof r!="string"?r:function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}(r)}class dg{constructor(e){this.$i=new ye((t,n)=>Xe.comparator(t.field,n.field)),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.Ki=e.orderBy,this.Wi=[];for(const t of e.filters){const n=t;n.isInequality()?this.$i=this.$i.add(n):this.Wi.push(n)}}get Qi(){return this.$i.size>1}Gi(e){if(q(e.collectionGroup===this.collectionId,49279),this.Qi)return!1;const t=FB(e);if(t!==void 0&&!this.zi(t))return!1;const n=is(e);let s=new Set,i=0,o=0;for(;i<n.length&&this.zi(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.$i.size>0){const a=this.$i.getIterator().getNext();if(!s.has(a.field.canonicalString())){const c=n[i];if(!this.ji(a,c)||!this.Hi(this.Ki[o++],c))return!1}++i}for(;i<n.length;++i){const a=n[i];if(o>=this.Ki.length||!this.Hi(this.Ki[o++],a))return!1}return!0}Ji(){if(this.Qi)return null;let e=new ye(Xe.comparator);const t=[];for(const n of this.Wi)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new Jc(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new Jc(n.field,0))}for(const n of this.Ki)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new Jc(n.field,n.dir==="asc"?0:1)));return new lu(lu.UNKNOWN_ID,this.collectionId,t,ga.empty())}zi(e){for(const t of this.Wi)if(this.ji(t,e))return!0;return!1}ji(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}Hi(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function AI(r){var t,n;if(q(r instanceof he||r instanceof we,20012),r instanceof he){if(r instanceof eE){const s=((n=(t=r.value.arrayValue)==null?void 0:t.values)==null?void 0:n.map(i=>he.create(r.field,"==",i)))||[];return we.create(s,"or")}return r}const e=r.filters.map(s=>AI(s));return we.create(e,r.op)}function IO(r){if(r.getFilters().length===0)return[];const e=QB(AI(r));return q(vI(e),7391),zB(e)||WB(e)?[e]:e.getFilters()}function zB(r){return r instanceof he}function WB(r){return r instanceof we&&Wh(r)}function vI(r){return zB(r)||WB(r)||function(t){if(t instanceof we&&NB(t)){for(const n of t.getFilters())if(!zB(n)&&!WB(n))return!1;return!0}return!1}(r)}function QB(r){if(q(r instanceof he||r instanceof we,34018),r instanceof he)return r;if(r.filters.length===1)return QB(r.filters[0]);const e=r.filters.map(n=>QB(n));let t=we.create(e,r.op);return t=wu(t),vI(t)?t:(q(t instanceof we,64498),q(bi(t),40251),q(t.filters.length>1,57927),t.filters.reduce((n,s)=>Nd(n,s)))}function Nd(r,e){let t;return q(r instanceof he||r instanceof we,38388),q(e instanceof he||e instanceof we,25473),t=r instanceof he?e instanceof he?function(s,i){return we.create([s,i],"and")}(r,e):fg(r,e):e instanceof he?fg(e,r):function(s,i){if(q(s.filters.length>0&&i.filters.length>0,48005),bi(s)&&bi(i))return Y_(s,i.getFilters());const o=NB(s)?s:i,a=NB(s)?i:s,c=o.filters.map(l=>Nd(l,a));return we.create(c,"or")}(r,e),wu(t)}function fg(r,e){if(bi(e))return Y_(e,r.getFilters());{const t=e.filters.map(n=>Nd(r,n));return we.create(t,"or")}}function wu(r){if(q(r instanceof he||r instanceof we,11850),r instanceof he)return r;const e=r.getFilters();if(e.length===1)return wu(e[0]);if(Q_(r))return r;const t=e.map(s=>wu(s)),n=[];return t.forEach(s=>{s instanceof he?n.push(s):s instanceof we&&(s.op===r.op?n.push(...s.filters):n.push(s))}),n.length===1?n[0]:we.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yO{constructor(){this.Yi=new Od}addToCollectionParentIndex(e,t){return this.Yi.add(t),b.resolve()}getCollectionParents(e,t){return b.resolve(this.Yi.getEntries(t))}addFieldIndex(e,t){return b.resolve()}deleteFieldIndex(e,t){return b.resolve()}deleteAllFieldIndexes(e){return b.resolve()}createTargetIndexes(e,t){return b.resolve()}getDocumentsMatchingTarget(e,t){return b.resolve(null)}getIndexType(e,t){return b.resolve(0)}getFieldIndexes(e,t){return b.resolve([])}getNextCollectionGroupToUpdate(e){return b.resolve(null)}getMinOffset(e,t){return b.resolve($t.min())}getMinOffsetFromCollectionGroup(e,t){return b.resolve($t.min())}updateCollectionGroup(e,t,n){return b.resolve()}updateIndexEntries(e,t){return b.resolve()}}class Od{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new ye(ce.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new ye(ce.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pg="IndexedDbIndexManager",Lc=new Uint8Array(0);class wO{constructor(e,t){this.databaseId=t,this.Zi=new Od,this.Xi=new nr(n=>Bu(n),(n,s)=>$h(n,s)),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.Zi.has(t)){const n=t.lastSegment(),s=t.popLast();e.addOnCommittedListener(()=>{this.Zi.add(t)});const i={collectionId:n,parent:_t(s)};return Cg(e).put(i)}return b.resolve()}getCollectionParents(e,t){const n=[],s=IDBKeyRange.bound([t,""],[R_(t),""],!1,!0);return Cg(e).Kn(s).next(i=>{for(const o of i){if(o.collectionId!==t)break;n.push(Tn(o.parent))}return n})}addFieldIndex(e,t){const n=bo(e),s=function(a){return{indexId:a.indexId,collectionGroup:a.collectionGroup,fields:a.fields.map(c=>[c.fieldPath.canonicalString(),c.kind])}}(t);delete s.indexId;const i=n.add(s);if(t.indexState){const o=si(e);return i.next(a=>{o.put(ag(a,this.uid,t.indexState.sequenceNumber,t.indexState.offset))})}return i.next()}deleteFieldIndex(e,t){const n=bo(e),s=si(e),i=ri(e);return n.delete(t.indexId).next(()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))).next(()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))}deleteAllFieldIndexes(e){const t=bo(e),n=ri(e),s=si(e);return t.Gn().next(()=>n.Gn()).next(()=>s.Gn())}createTargetIndexes(e,t){return b.forEach(this.es(t),n=>this.getIndexType(e,n).next(s=>{if(s===0||s===1){const i=new dg(n).Ji();if(i!=null)return this.addFieldIndex(e,i)}}))}getDocumentsMatchingTarget(e,t){const n=ri(e);let s=!0;const i=new Map;return b.forEach(this.es(t),o=>this.ts(e,o).next(a=>{s&&(s=!!a),i.set(o,a)})).next(()=>{if(s){let o=ae();const a=[];return b.forEach(i,(c,l)=>{U(pg,`Using index ${function(ie){return`id=${ie.indexId}|cg=${ie.collectionGroup}|f=${ie.fields.map(Ee=>`${Ee.fieldPath}:${Ee.kind}`).join(",")}`}(c)} to execute ${Bu(t)}`);const B=function(ie,Ee){const de=FB(Ee);if(de===void 0)return null;for(const le of hu(ie,de.fieldPath))switch(le.op){case"array-contains-any":return le.value.arrayValue.values||[];case"array-contains":return[le.value]}return null}(l,c),d=function(ie,Ee){const de=new Map;for(const le of is(Ee))for(const T of hu(ie,le.fieldPath))switch(T.op){case"==":case"in":de.set(le.fieldPath.canonicalString(),T.value);break;case"not-in":case"!=":return de.set(le.fieldPath.canonicalString(),T.value),Array.from(de.values())}return null}(l,c),p=function(ie,Ee){const de=[];let le=!0;for(const T of is(Ee)){const E=T.kind===0?LC(ie,T.fieldPath,ie.startAt):kC(ie,T.fieldPath,ie.startAt);de.push(E.value),le&&(le=E.inclusive)}return new Vr(de,le)}(l,c),g=function(ie,Ee){const de=[];let le=!0;for(const T of is(Ee)){const E=T.kind===0?kC(ie,T.fieldPath,ie.endAt):LC(ie,T.fieldPath,ie.endAt);de.push(E.value),le&&(le=E.inclusive)}return new Vr(de,le)}(l,c),w=this.ns(c,l,p),N=this.ns(c,l,g),M=this.rs(c,l,d),W=this.ss(c.indexId,B,w,p.inclusive,N,g.inclusive,M);return b.forEach(W,te=>n.Qn(te,t.limit).next(ie=>{ie.forEach(Ee=>{const de=z.fromSegments(Ee.documentKey);o.has(de)||(o=o.add(de),a.push(de))})}))}).next(()=>a)}return b.resolve(null)})}es(e){let t=this.Xi.get(e);return t||(e.filters.length===0?t=[e]:t=IO(we.create(e.filters,"and")).map(n=>LB(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt)),this.Xi.set(e,t),t)}ss(e,t,n,s,i,o,a){const c=(t!=null?t.length:1)*Math.max(n.length,i.length),l=c/(t!=null?t.length:1),B=[];for(let d=0;d<c;++d){const p=t?this._s(t[d/l]):Lc,g=this.us(e,p,n[d%l],s),w=this.cs(e,p,i[d%l],o),N=a.map(M=>this.us(e,p,M,!0));B.push(...this.createRange(g,w,N))}return B}us(e,t,n,s){const i=new Bs(e,z.empty(),t,n);return s?i:i.Ui()}cs(e,t,n,s){const i=new Bs(e,z.empty(),t,n);return s?i.Ui():i}ts(e,t){const n=new dg(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next(i=>{let o=null;for(const a of i)n.Gi(a)&&(!o||a.fields.length>o.fields.length)&&(o=a);return o})}getIndexType(e,t){let n=2;const s=this.es(t);return b.forEach(s,i=>this.ts(e,i).next(o=>{o?n!==0&&o.fields.length<function(c){let l=new ye(Xe.comparator),B=!1;for(const d of c.filters)for(const p of d.getFlattenedFilters())p.field.isKeyField()||(p.op==="array-contains"||p.op==="array-contains-any"?B=!0:l=l.add(p.field));for(const d of c.orderBy)d.field.isKeyField()||(l=l.add(d.field));return l.size+(B?1:0)}(i)&&(n=1):n=0})).next(()=>function(o){return o.limit!==null}(t)&&s.length>1&&n===2?1:n)}ls(e,t){const n=new Ro;for(const s of is(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const o=n.Oi(s.kind);ls.Ti.Xr(i,o)}return n.Ci()}_s(e){const t=new Ro;return ls.Ti.Xr(e,t.Oi(0)),t.Ci()}Es(e,t){const n=new Ro;return ls.Ti.Xr(Ss(this.databaseId,t),n.Oi(function(i){const o=is(i);return o.length===0?0:o[o.length-1].kind}(e))),n.Ci()}rs(e,t,n){if(n===null)return[];let s=[];s.push(new Ro);let i=0;for(const o of is(e)){const a=n[i++];for(const c of s)if(this.hs(t,o.fieldPath)&&kr(a))s=this.Ts(s,o,a);else{const l=c.Oi(o.kind);ls.Ti.Xr(a,l)}}return this.Ps(s)}ns(e,t,n){return this.rs(e,t,n.position)}Ps(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].Ci();return t}Ts(e,t,n){const s=[...e],i=[];for(const o of n.arrayValue.values||[])for(const a of s){const c=new Ro;c.seed(a.Ci()),ls.Ti.Xr(o,c.Oi(t.kind)),i.push(c)}return i}hs(e,t){return!!e.filters.find(n=>n instanceof he&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in"))}getFieldIndexes(e,t){const n=bo(e),s=si(e);return(t?n.Kn(qB,IDBKeyRange.bound(t,t)):n.Kn()).next(i=>{const o=[];return b.forEach(i,a=>s.get([a.indexId,this.uid]).next(c=>{o.push(function(B,d){const p=d?new ga(d.sequenceNumber,new $t(Vs(d.readTime),new z(Tn(d.documentKey)),d.largestBatchId)):ga.empty(),g=B.fields.map(([w,N])=>new Jc(Xe.fromServerFormat(w),N));return new lu(B.indexId,B.collectionGroup,g,p)}(a,c))})).next(()=>o)})}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next(t=>t.length===0?null:(t.sort((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:oe(n.collectionGroup,s.collectionGroup)}),t[0].collectionGroup))}updateCollectionGroup(e,t,n){const s=bo(e),i=si(e);return this.Rs(e).next(o=>s.Kn(qB,IDBKeyRange.bound(t,t)).next(a=>b.forEach(a,c=>i.put(ag(c.indexId,this.uid,o,n)))))}updateIndexEntries(e,t){const n=new Map;return b.forEach(t,(s,i)=>{const o=n.get(s.collectionGroup);return(o?b.resolve(o):this.getFieldIndexes(e,s.collectionGroup)).next(a=>(n.set(s.collectionGroup,a),b.forEach(a,c=>this.Is(e,s,c).next(l=>{const B=this.As(i,c);return l.isEqual(B)?b.resolve():this.Vs(e,i,c,l,B)}))))})}ds(e,t,n,s){return ri(e).put(s.ki(this.uid,this.Es(n,t.key),t.key))}fs(e,t,n,s){return ri(e).delete(s.qi(this.uid,this.Es(n,t.key),t.key))}Is(e,t,n){const s=ri(e);let i=new ye(dr);return s.jn({index:pI,range:IDBKeyRange.only([n.indexId,this.uid,Yc(this.Es(n,t))])},(o,a)=>{i=i.add(new Bs(n.indexId,t,hg(a.arrayValue),hg(a.directionalValue)))}).next(()=>i)}As(e,t){let n=new ye(dr);const s=this.ls(t,e);if(s==null)return n;const i=FB(t);if(i!=null){const o=e.data.field(i.fieldPath);if(kr(o))for(const a of o.arrayValue.values||[])n=n.add(new Bs(t.indexId,e.key,this._s(a),s))}else n=n.add(new Bs(t.indexId,e.key,Lc,s));return n}Vs(e,t,n,s,i){U(pg,"Updating index entries for document '%s'",t.key);const o=[];return function(c,l,B,d,p){const g=c.getIterator(),w=l.getIterator();let N=Zs(g),M=Zs(w);for(;N||M;){let W=!1,te=!1;if(N&&M){const ie=B(N,M);ie<0?te=!0:ie>0&&(W=!0)}else N!=null?te=!0:W=!0;W?(d(M),M=Zs(w)):te?(p(N),N=Zs(g)):(N=Zs(g),M=Zs(w))}}(s,i,dr,a=>{o.push(this.ds(e,t,n,a))},a=>{o.push(this.fs(e,t,n,a))}),b.waitFor(o)}Rs(e){let t=1;return si(e).jn({index:fI,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},(n,s,i)=>{i.done(),t=s.sequenceNumber+1}).next(()=>t)}createRange(e,t,n){n=n.sort((o,a)=>dr(o,a)).filter((o,a,c)=>!a||dr(o,c[a-1])!==0);const s=[];s.push(e);for(const o of n){const a=dr(o,e),c=dr(o,t);if(a===0)s[0]=e.Ui();else if(a>0&&c<0)s.push(o),s.push(o.Ui());else if(c>0)break}s.push(t);const i=[];for(let o=0;o<s.length;o+=2){if(this.ps(s[o],s[o+1]))return[];const a=s[o].qi(this.uid,Lc,z.empty()),c=s[o+1].qi(this.uid,Lc,z.empty());i.push(IDBKeyRange.bound(a,c))}return i}ps(e,t){return dr(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(gg)}getMinOffset(e,t){return b.mapArray(this.es(t),n=>this.ts(e,n).next(s=>s||Y(44426))).next(gg)}}function Cg(r){return rt(r,va)}function ri(r){return rt(r,Zo)}function bo(r){return rt(r,vd)}function si(r){return rt(r,Xo)}function gg(r){q(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;Qh(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new $t(e.readTime,e.documentKey,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yn{constructor(e){this.gs=e}next(){return this.gs+=2,this.gs}static ys(){return new Yn(0)}static ws(){return new Yn(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DO{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.bs(e).next(t=>{const n=new Yn(t.highestTargetId);return t.highestTargetId=n.next(),this.vs(e,t).next(()=>t.highestTargetId)})}getLastRemoteSnapshotVersion(e){return this.bs(e).next(t=>Z.fromTimestamp(new Ie(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds)))}getHighestSequenceNumber(e){return this.bs(e).next(t=>t.highestListenSequenceNumber)}setTargetsMetadata(e,t,n){return this.bs(e).next(s=>(s.highestListenSequenceNumber=t,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.vs(e,s)))}addTargetData(e,t){return this.Ss(e,t).next(()=>this.bs(e).next(n=>(n.targetCount+=1,this.Ds(t,n),this.vs(e,n))))}updateTargetData(e,t){return this.Ss(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next(()=>ii(e).delete(t.targetId)).next(()=>this.bs(e)).next(n=>(q(n.targetCount>0,8065),n.targetCount-=1,this.vs(e,n)))}removeTargets(e,t,n){let s=0;const i=[];return ii(e).jn((o,a)=>{const c=xo(this.serializer,a);c.sequenceNumber<=t&&n.get(c.targetId)===null&&(s++,i.push(this.removeTargetData(e,c)))}).next(()=>b.waitFor(i)).next(()=>s)}forEachTarget(e,t){return ii(e).jn((n,s)=>{const i=xo(this.serializer,s);t(i)})}bs(e){return mg(e).get(Eu).next(t=>(q(t!==null,2888),t))}vs(e,t){return mg(e).put(Eu,t)}Ss(e,t){return ii(e).put(wI(this.serializer,t))}Ds(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.bs(e).next(t=>t.targetCount)}getTargetData(e,t){const n=tl(t),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return ii(e).jn({range:s,index:dI},(o,a,c)=>{const l=xo(this.serializer,a);wd(t,l.target)&&(i=l,c.done())}).next(()=>i)}addMatchingKeys(e,t,n){const s=[],i=_r(e);return t.forEach(o=>{const a=_t(o.path);s.push(i.put({targetId:n,path:a})),s.push(this.referenceDelegate.addReference(e,n,o))}),b.waitFor(s)}removeMatchingKeys(e,t,n){const s=_r(e);return b.forEach(t,i=>{const o=_t(i.path);return b.waitFor([s.delete([n,o]),this.referenceDelegate.removeReference(e,n,i)])})}removeMatchingKeysForTargetId(e,t){const n=_r(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),s=_r(e);let i=ae();return s.jn({range:n,zn:!0},(o,a,c)=>{const l=Tn(o[1]),B=new z(l);i=i.add(B)}).next(()=>i)}containsKey(e,t){const n=_t(t.path),s=IDBKeyRange.bound([n],[R_(n)],!1,!0);let i=0;return _r(e).jn({index:Ad,zn:!0,range:s},([o,a],c,l)=>{o!==0&&(i++,l.done())}).next(()=>i>0)}ge(e,t){return ii(e).get(t).next(n=>n?xo(this.serializer,n):null)}}function ii(r){return rt(r,Fi)}function mg(r){return rt(r,Ds)}function _r(r){return rt(r,Li)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class TO{constructor(e,t){this.db=e,this.garbageCollector=kE(this,t)}rr(e){const t=this.xs(e);return this.db.getTargetCache().getTargetCount(e).next(n=>t.next(s=>n+s))}xs(e){let t=0;return this.ir(e,n=>{t++}).next(()=>t)}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}ir(e,t){return this.Cs(e,(n,s)=>t(s))}addReference(e,t,n){return kc(e,n)}removeReference(e,t,n){return kc(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return kc(e,t)}Fs(e,t){return function(s,i){let o=!1;return TI(s).Hn(a=>DI(s,a,i).next(c=>(c&&(o=!0),b.resolve(!c)))).next(()=>o)}(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Cs(e,(o,a)=>{if(a<=t){const c=this.Fs(e,o).next(l=>{if(!l)return i++,n.getEntry(e,o).next(()=>(n.removeEntry(o,Z.min()),_r(e).delete(function(d){return[0,_t(d.path)]}(o))))});s.push(c)}}).next(()=>b.waitFor(s)).next(()=>n.apply(e)).next(()=>i)}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return kc(e,t)}Cs(e,t){const n=_r(e);let s,i=xt.yn;return n.jn({index:Ad},([o,a],{path:c,sequenceNumber:l})=>{o===0?(i!==xt.yn&&t(new z(Tn(s)),i),i=l,s=c):i=xt.yn}).next(()=>{i!==xt.yn&&t(new z(Tn(s)),i)})}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function kc(r,e){return _r(r).put(function(n,s){return{targetId:0,path:_t(n.path),sequenceNumber:s}}(e,r.currentSequenceNumber))}// Copyright 2024 Google LLC* @license
function RI(r,e){var n;let t=e;for(const s of r.stages)t=AO({serializer:r.serializer,serverTimestampBehavior:(n=r.listenOptions)==null?void 0:n.serverTimestampBehavior},s,t);return t}function al(r,e){return RI(r,[e]).length>0}function bI(r,e){return Ue(r)?al(r,e):zu(r,e)}function AO(r,e,t){if(e instanceof Za)return function(s,i,o){return o.filter(a=>a.isFoundDocument()&&`/${a.key.getCollectionPath().canonicalString()}`===i.Er)}(0,e,t);if(e instanceof tc)return function(s,i,o){return o.filter(a=>{const c=Yo(se(i.condition).evaluate(s,a));return c!==void 0&&sn(c,Gt)})}(r,e,t);if(e instanceof ec)return function(s,i,o){return o.filter(a=>a.isFoundDocument()&&a.key.getCollectionPath().lastSegment()===i.collectionId)}(0,e,t);if(e instanceof Yu)return function(s,i,o){return o.filter(a=>a.isFoundDocument())}(0,0,t);if(e instanceof Xu)return function(s,i,o){return o.filter(a=>a.isFoundDocument()&&i.Tr.has(a.key.path.toStringWithLeadingSlash()))}(0,e,t);if(e instanceof Gr)return function(s,i,o){return o.slice(0,i.limit)}(0,e,t);if(e instanceof Dn)return function(s,i,o){const a=i.orderings.map(c=>({Os:se(c.expr),direction:c.direction}));return[...o].sort((c,l)=>{for(const{Os:B,direction:d}of a){const p=Yo(B.evaluate(s,c)),g=Yo(B.evaluate(s,l)),w=It(p??Rn,g??Rn);if(w!==0)return d==="ascending"?w:-w}return 0})}(r,e,t);throw new Error(`Unknown stage: ${e._name}`)}function $B(r){const e=function(n){for(let s=n.stages.length-1;s>=0;s--){const i=n.stages[s];if(i instanceof Dn)return i.orderings}throw new Error("Pipeline must contain at least one Sort stage")}(r);return(t,n)=>{for(const s of e){const i=Yo(se(s.expr).evaluate({serializer:r.serializer},t)),o=Yo(se(s.expr).evaluate({serializer:r.serializer},n)),a=It(i||Rn,o||Rn);if(a!==0)return s.direction==="ascending"?a:-a}return 0}}function oB(r){for(let e=r.stages.length-1;e>=0;e--){const t=r.stages[e];if(t instanceof Gr)return{limit:t.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PI{constructor(){this.changes=new nr(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,Fe.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?b.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vO{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return fr(e).put(n)}removeEntry(e,t,n){return fr(e).delete(function(i,o){const a=i.path.toArray();return[a.slice(0,a.length-2),a[a.length-2],yu(o),a[a.length-1]]}(t,n))}updateMetadata(e,t){return this.getMetadata(e).next(n=>(n.byteSize+=t,this.Ms(e,n)))}getEntry(e,t){let n=Fe.newInvalidDocument(t);return fr(e).jn({index:$c,range:IDBKeyRange.only(Po(t))},(s,i)=>{n=this.Ns(t,i)}).next(()=>n)}Ls(e,t){let n={size:0,document:Fe.newInvalidDocument(t)};return fr(e).jn({index:$c,range:IDBKeyRange.only(Po(t))},(s,i)=>{n={document:this.Ns(t,i),size:Iu(i)}}).next(()=>n)}getEntries(e,t){let n=$e();return this.Bs(e,t,(s,i)=>{const o=this.Ns(s,i);n=n.insert(s,o)}).next(()=>n)}getAllEntries(e){let t=$e();return fr(e).jn((n,s)=>{const i=this.Ns(z.fromSegments(s.prefixPath.concat(s.collectionGroup,s.documentId)),s);t=t.insert(i.key,i)}).next(()=>t)}Us(e,t){let n=$e(),s=new Re(z.comparator);return this.Bs(e,t,(i,o)=>{const a=this.Ns(i,o);n=n.insert(i,a),s=s.insert(i,Iu(o))}).next(()=>({documents:n,ks:s}))}Bs(e,t,n){if(t.isEmpty())return b.resolve();let s=new ye(Ig);t.forEach(c=>s=s.add(c));const i=IDBKeyRange.bound(Po(s.first()),Po(s.last())),o=s.getIterator();let a=o.getNext();return fr(e).jn({index:$c,range:i},(c,l,B)=>{const d=z.fromSegments([...l.prefixPath,l.collectionGroup,l.documentId]);for(;a&&Ig(a,d)<0;)n(a,null),a=o.getNext();a&&a.isEqual(d)&&(n(a,l),a=o.hasNext()?o.getNext():null),a?B.$n(Po(a)):B.done()}).next(()=>{for(;a;)n(a,null),a=o.hasNext()?o.getNext():null})}getDocumentsMatchingQuery(e,t,n,s,i){const o=Ue(t)?ce.fromString(rc(t)):t.path,a=[o.popLast().toArray(),o.lastSegment(),yu(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],c=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return fr(e).Kn(IDBKeyRange.bound(a,c,!0)).next(l=>{i==null||i.incrementDocumentReadCount(l.length);let B=$e();for(const d of l){const p=this.Ns(z.fromSegments(d.prefixPath.concat(d.collectionGroup,d.documentId)),d);p.isFoundDocument()&&(bI(t,p)||s.has(p.key))&&(B=B.insert(p.key,p))}return B})}getAllFromCollectionGroup(e,t,n,s){let i=$e();const o=Eg(t,n),a=Eg(t,$t.max());return fr(e).jn({index:hI,range:IDBKeyRange.bound(o,a,!0)},(c,l,B)=>{const d=this.Ns(z.fromSegments(l.prefixPath.concat(l.collectionGroup,l.documentId)),l);i=i.insert(d.key,d),i.size===s&&B.done()}).next(()=>i)}newChangeBuffer(e){return new RO(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next(t=>t.byteSize)}getMetadata(e){return _g(e).get(HB).next(t=>(q(!!t,20021),t))}Ms(e,t){return _g(e).put(HB,t)}Ns(e,t){if(t){const n=dO(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(Z.min())))return n}return Fe.newInvalidDocument(e)}}function SI(r){return new vO(r)}class RO extends PI{constructor(e,t){super(),this.qs=e,this.trackRemovals=t,this.$s=new nr(n=>n.toString(),(n,s)=>n.isEqual(s))}applyChanges(e){const t=[];let n=0,s=new ye((i,o)=>oe(i.canonicalString(),o.canonicalString()));return this.changes.forEach((i,o)=>{const a=this.$s.get(i);if(t.push(this.qs.removeEntry(e,i,a.readTime)),o.isValidDocument()){const c=ig(this.qs.serializer,o);s=s.add(i.path.popLast());const l=Iu(c);n+=l-a.size,t.push(this.qs.addEntry(e,i,c))}else if(n-=a.size,this.trackRemovals){const c=ig(this.qs.serializer,o.convertToNoDocument(Z.min()));t.push(this.qs.addEntry(e,i,c))}}),s.forEach(i=>{t.push(this.qs.indexManager.addToCollectionParentIndex(e,i))}),t.push(this.qs.updateMetadata(e,n)),b.waitFor(t)}getFromCache(e,t){return this.qs.Ls(e,t).next(n=>(this.$s.set(t,{size:n.size,readTime:n.document.readTime}),n.document))}getAllFromCache(e,t){return this.qs.Us(e,t).next(({documents:n,ks:s})=>(s.forEach((i,o)=>{this.$s.set(i,{size:o,readTime:n.get(i).readTime})}),n))}}function _g(r){return rt(r,Aa)}function fr(r){return rt(r,_u)}function Po(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function Eg(r,e){const t=e.documentKey.path.toArray();return[r,yu(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function Ig(r,e){const t=r.path.toArray(),n=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<n.length-2;++i)if(s=oe(t[i],n[i]),s)return s;return s=oe(t.length,n.length),s||(s=oe(t[t.length-2],n[n.length-2]),s||oe(t[t.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bO{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class NI{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next(s=>(n=s,this.remoteDocumentCache.getEntry(e,t))).next(s=>(n!==null&&Ko(n.mutation,s,Vt.empty(),Ie.now()),s))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.getLocalViewOfDocuments(e,n,ae()).next(()=>n))}getLocalViewOfDocuments(e,t,n=ae()){const s=en();return this.populateOverlays(e,s,t).next(()=>this.computeViews(e,t,s,n).next(i=>{let o=as();return i.forEach((a,c)=>{o=o.insert(a,c.overlayedDocument)}),o}))}getOverlayedDocuments(e,t){const n=en();return this.populateOverlays(e,n,t).next(()=>this.computeViews(e,t,n,ae()))}populateOverlays(e,t,n){const s=[];return n.forEach(i=>{t.has(i)||s.push(i)}),this.documentOverlayCache.getOverlays(e,s).next(i=>{i.forEach((o,a)=>{t.set(o,a)})})}computeViews(e,t,n,s){let i=$e();const o=Wo(),a=function(){return Wo()}();return t.forEach((c,l)=>{const B=n.get(l.key);s.has(l.key)&&(B===void 0||B.mutation instanceof er)?i=i.insert(l.key,l):B!==void 0?(o.set(l.key,B.mutation.getFieldMask()),Ko(B.mutation,l,B.mutation.getFieldMask(),Ie.now())):o.set(l.key,Vt.empty())}),this.recalculateAndSaveOverlays(e,i).next(c=>(c.forEach((l,B)=>o.set(l,B)),t.forEach((l,B)=>a.set(l,new bO(B,o.get(l)??null))),a))}recalculateAndSaveOverlays(e,t){const n=Wo();let s=new Re((o,a)=>o-a),i=ae();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(o=>{for(const a of o)a.keys().forEach(c=>{const l=t.get(c);if(l===null)return;let B=n.get(c)||Vt.empty();B=a.applyToLocalView(l,B),n.set(c,B);const d=(s.get(a.batchId)||ae()).add(c);s=s.insert(a.batchId,d)})}).next(()=>{const o=[],a=s.getReverseIterator();for(;a.hasNext();){const c=a.getNext(),l=c.key,B=c.value,d=uE();B.forEach(p=>{if(!i.has(p)){const g=K_(t.get(p),n.get(p));g!==null&&d.set(p,g),i=i.add(p)}}),o.push(this.documentOverlayCache.saveOverlays(e,l,d))}return b.waitFor(o)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.recalculateAndSaveOverlays(e,n))}getDocumentsMatchingQuery(e,t,n,s){return Ue(t)?this.getDocumentsMatchingPipeline(e,t,n,s):uP(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Xh(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next(i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):b.resolve(en());let a=Pi,c=i;return o.next(l=>b.forEach(l,(B,d)=>(a<d.largestBatchId&&(a=d.largestBatchId),i.get(B)?b.resolve():this.remoteDocumentCache.getEntry(e,B).next(p=>{c=c.insert(B,p)}))).next(()=>this.populateOverlays(e,l,i)).next(()=>this.computeViews(e,c,l,ae())).next(B=>({batchId:a,changes:cE(B)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new z(t)).next(n=>{let s=as();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s})}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let o=as();return this.indexManager.getCollectionParents(e,i).next(a=>b.forEach(a,c=>{const l=function(d,p){return new tr(p,null,d.explicitOrderBy.slice(),d.filters.slice(),d.limit,d.limitType,d.startAt,d.endAt)}(t,c.child(i));return this.getDocumentsMatchingCollectionQuery(e,l,n,s).next(B=>{B.forEach((d,p)=>{o=o.insert(d,p)})})}).next(()=>o))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next(o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s))).next(o=>this.retrieveMatchingLocalDocuments(i,o,a=>zu(t,a)))}getDocumentsMatchingPipeline(e,t,n,s){if(qn(t)==="collection_group"){const i=yd(t);let o=as();return this.indexManager.getCollectionParents(e,i).next(a=>b.forEach(a,c=>{const l=function(d,p){const g=d.stages.map(w=>w instanceof ec?new Za(p.canonicalString(),{}):w);return new gt(d.serializer,g)}(t,c.child(i));return this.getDocumentsMatchingPipeline(e,l,n,s).next(B=>{B.forEach((d,p)=>{o=o.insert(d,p)})})}).next(()=>o))}{let i;return this.getOverlaysForPipeline(e,t,n.largestBatchId).next(o=>{switch(i=o,qn(t)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s);case"documents":let a=ae();for(const c of gu(t))a=a.add(z.fromPath(c));return this.remoteDocumentCache.getEntries(e,a);case"database":return this.remoteDocumentCache.getAllEntries(e);default:throw new x("invalid-argument",`Invalid pipeline source to execute offline: ${jn(t)}`)}}).next(o=>this.retrieveMatchingLocalDocuments(i,o,a=>al(t,a)))}}retrieveMatchingLocalDocuments(e,t,n){e.forEach((i,o)=>{const a=o.getKey();t.get(a)===null&&(t=t.insert(a,Fe.newInvalidDocument(a)))});let s=as();return t.forEach((i,o)=>{const a=e.get(i);a!==void 0&&Ko(a.mutation,o,Vt.empty(),Ie.now()),n(o)&&(s=s.insert(i,o))}),s}getOverlaysForPipeline(e,t,n){switch(qn(t)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(e,ce.fromString(rc(t)),n);case"collection_group":throw new x("invalid-argument",`Unexpected collection group pipeline: ${jn(t)}`);case"documents":return this.documentOverlayCache.getOverlays(e,gu(t).map(s=>z.fromPath(s)));case"database":return this.documentOverlayCache.getAllOverlays(e,n);default:throw new x("invalid-argument",`Failed to get overlays for pipeline: ${jn(t)}`)}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PO{constructor(e){this.serializer=e,this.Ks=new Map,this.Ws=new Map}getBundleMetadata(e,t){return b.resolve(this.Ks.get(t))}saveBundleMetadata(e,t){return this.Ks.set(t.id,function(s){return{id:s.id,version:s.version,createTime:Je(s.createTime)}}(t)),b.resolve()}getNamedQuery(e,t){return b.resolve(this.Ws.get(t))}saveNamedQuery(e,t){return this.Ws.set(t.name,function(s){return{name:s.name,query:Sd(s.bundledQuery),readTime:Je(s.readTime)}}(t)),b.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class SO{constructor(){this.overlays=new Re(z.comparator),this.Qs=new Map}getOverlay(e,t){return b.resolve(this.overlays.get(t))}getOverlays(e,t){const n=en();return b.forEach(t,s=>this.getOverlay(e,s).next(i=>{i!==null&&n.set(s,i)})).next(()=>n)}getAllOverlays(e,t){const n=en();return this.overlays.forEach((s,i)=>{i.largestBatchId>t&&n.set(s,i)}),b.resolve(n)}saveOverlays(e,t,n){return n.forEach((s,i)=>{this.Yr(e,t,i)}),b.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.Qs.get(n);return s!==void 0&&(s.forEach(i=>this.overlays=this.overlays.remove(i)),this.Qs.delete(n)),b.resolve()}getOverlaysForCollection(e,t,n){const s=en(),i=t.length+1,o=new z(t.child("")),a=this.overlays.getIteratorFrom(o);for(;a.hasNext();){const c=a.getNext().value,l=c.getKey();if(!t.isPrefixOf(l.path))break;l.path.length===i&&c.largestBatchId>n&&s.set(c.getKey(),c)}return b.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new Re((l,B)=>l-B);const o=this.overlays.getIterator();for(;o.hasNext();){const l=o.getNext().value;if(l.getKey().getCollectionGroup()===t&&l.largestBatchId>n){let B=i.get(l.largestBatchId);B===null&&(B=en(),i=i.insert(l.largestBatchId,B)),B.set(l.getKey(),l)}}const a=en(),c=i.getIterator();for(;c.hasNext()&&(c.getNext().value.forEach((l,B)=>a.set(l,B)),!(a.size()>=s)););return b.resolve(a)}Yr(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.Qs.get(s.largestBatchId).delete(n.key);this.Qs.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new Pd(t,n));let i=this.Qs.get(t);i===void 0&&(i=ae(),this.Qs.set(t,i)),this.Qs.set(t,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class NO{constructor(){this.sessionToken=Le.EMPTY_BYTE_STRING}getSessionToken(e){return b.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,b.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fd{constructor(){this.Gs=new ye(it.zs),this.js=new ye(it.Hs)}isEmpty(){return this.Gs.isEmpty()}addReference(e,t){const n=new it(e,t);this.Gs=this.Gs.add(n),this.js=this.js.add(n)}Js(e,t){e.forEach(n=>this.addReference(n,t))}removeReference(e,t){this.Ys(new it(e,t))}Zs(e,t){e.forEach(n=>this.removeReference(n,t))}Xs(e){const t=new z(new ce([])),n=new it(t,e),s=new it(t,e+1),i=[];return this.js.forEachInRange([n,s],o=>{this.Ys(o),i.push(o.key)}),i}e_(){this.Gs.forEach(e=>this.Ys(e))}Ys(e){this.Gs=this.Gs.delete(e),this.js=this.js.delete(e)}t_(e){const t=new z(new ce([])),n=new it(t,e),s=new it(t,e+1);let i=ae();return this.js.forEachInRange([n,s],o=>{i=i.add(o.key)}),i}containsKey(e){const t=new it(e,0),n=this.Gs.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class it{constructor(e,t){this.key=e,this.n_=t}static zs(e,t){return z.comparator(e.key,t.key)||oe(e.n_,t.n_)}static Hs(e,t){return oe(e.n_,t.n_)||z.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class OO{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Qr=1,this.r_=new ye(it.zs)}checkEmpty(e){return b.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.Qr;this.Qr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new Dd(i,t,n,s);this.mutationQueue.push(o);for(const a of s)this.r_=this.r_.add(new it(a.key,i)),this.indexManager.addToCollectionParentIndex(e,a.key.path.popLast());return b.resolve(o)}lookupMutationBatch(e,t){return b.resolve(this.i_(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.s_(n),i=s<0?0:s;return b.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return b.resolve(this.mutationQueue.length===0?vr:this.Qr-1)}getAllMutationBatches(e){return b.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new it(t,0),s=new it(t,Number.POSITIVE_INFINITY),i=[];return this.r_.forEachInRange([n,s],o=>{const a=this.i_(o.n_);i.push(a)}),b.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new ye(oe);return t.forEach(s=>{const i=new it(s,0),o=new it(s,Number.POSITIVE_INFINITY);this.r_.forEachInRange([i,o],a=>{n=n.add(a.n_)})}),b.resolve(this.__(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;z.isDocumentKey(i)||(i=i.child(""));const o=new it(new z(i),0);let a=new ye(oe);return this.r_.forEachWhile(c=>{const l=c.key.path;return!!n.isPrefixOf(l)&&(l.length===s&&(a=a.add(c.n_)),!0)},o),b.resolve(this.__(a))}__(e){const t=[];return e.forEach(n=>{const s=this.i_(n);s!==null&&t.push(s)}),t}removeMutationBatch(e,t){q(this.o_(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.r_;return b.forEach(t.mutations,s=>{const i=new it(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)}).next(()=>{this.r_=n})}jr(e){}containsKey(e,t){const n=new it(t,0),s=this.r_.firstAfterOrEqual(n);return b.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,b.resolve()}o_(e,t){return this.s_(e)}s_(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}i_(e){const t=this.s_(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class FO{constructor(e){this.a_=e,this.docs=function(){return new Re(z.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,o=this.a_(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return b.resolve(n?n.document.mutableCopy():Fe.newInvalidDocument(t))}getEntries(e,t){let n=$e();return t.forEach(s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():Fe.newInvalidDocument(s))}),b.resolve(n)}getAllEntries(e){let t=$e();return this.docs.forEach((n,s)=>{t=t.insert(n,s.document)}),b.resolve(t)}getDocumentsMatchingQuery(e,t,n,s){let i,o;Ue(t)?(i=ce.fromString(rc(t)),o=B=>al(t,B)):(i=t.path,o=B=>zu(t,B));let a=$e();const c=new z(i.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(c);for(;l.hasNext();){const{key:B,value:{document:d}}=l.getNext();if(!i.isPrefixOf(B.path))break;B.path.length>i.length+1||Qh(nE(d),n)<=0||(s.has(d.key)||o(d))&&(a=a.insert(d.key,d.mutableCopy()))}return b.resolve(a)}getAllFromCollectionGroup(e,t,n,s){Y(9500)}u_(e,t){return b.forEach(this.docs,n=>t(n))}newChangeBuffer(e){return new LO(this)}getSize(e){return b.resolve(this.size)}}class LO extends PI{constructor(e){super(),this.qs=e}applyChanges(e){const t=[];return this.changes.forEach((n,s)=>{s.isValidDocument()?t.push(this.qs.addEntry(e,s)):this.qs.removeEntry(n)}),b.waitFor(t)}getFromCache(e,t){return this.qs.getEntry(e,t)}getAllFromCache(e,t){return this.qs.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kO{constructor(e){this.persistence=e,this.c_=new nr(t=>tl(t),wd),this.lastRemoteSnapshotVersion=Z.min(),this.highestTargetId=0,this.l_=0,this.E_=new Fd,this.targetCount=0,this.h_=Yn.ys()}forEachTarget(e,t){return this.c_.forEach((n,s)=>t(s)),b.resolve()}getLastRemoteSnapshotVersion(e){return b.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return b.resolve(this.l_)}allocateTargetId(e){return this.highestTargetId=this.h_.next(),b.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.l_&&(this.l_=t),b.resolve()}Ss(e){this.c_.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.h_=new Yn(t),this.highestTargetId=t),e.sequenceNumber>this.l_&&(this.l_=e.sequenceNumber)}addTargetData(e,t){return this.Ss(t),this.targetCount+=1,b.resolve()}updateTargetData(e,t){return this.Ss(t),b.resolve()}removeTargetData(e,t){return this.c_.delete(t.target),this.E_.Xs(t.targetId),this.targetCount-=1,b.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.c_.forEach((o,a)=>{a.sequenceNumber<=t&&n.get(a.targetId)===null&&(this.c_.delete(o),i.push(this.removeMatchingKeysForTargetId(e,a.targetId)),s++)}),b.waitFor(i).next(()=>s)}getTargetCount(e){return b.resolve(this.targetCount)}getTargetData(e,t){const n=this.c_.get(t)||null;return b.resolve(n)}addMatchingKeys(e,t,n){return this.E_.Js(t,n),b.resolve()}removeMatchingKeys(e,t,n){this.E_.Zs(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach(o=>{i.push(s.markPotentiallyOrphaned(e,o))}),b.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.E_.Xs(t),b.resolve()}getMatchingKeysForTargetId(e,t){const n=this.E_.t_(t);return b.resolve(n)}containsKey(e,t){return b.resolve(this.E_.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ld{constructor(e,t){this.T_={},this.overlays={},this.P_=new xt(0),this.R_=!1,this.R_=!0,this.I_=new NO,this.referenceDelegate=e(this),this.A_=new kO(this),this.indexManager=new yO,this.remoteDocumentCache=function(s){return new FO(s)}(n=>this.referenceDelegate.V_(n)),this.serializer=new yI(t),this.d_=new PO(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.R_=!1,Promise.resolve()}get started(){return this.R_}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new SO,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.T_[e.toKey()];return n||(n=new OO(t,this.referenceDelegate),this.T_[e.toKey()]=n),n}getGlobalsCache(){return this.I_}getTargetCache(){return this.A_}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.d_}runTransaction(e,t,n){U("MemoryPersistence","Starting transaction:",e);const s=new VO(this.P_.next());return this.referenceDelegate.f_(),n(s).next(i=>this.referenceDelegate.m_(s).next(()=>i)).toPromise().then(i=>(s.raiseOnCommittedEvent(),i))}p_(e,t){return b.or(Object.values(this.T_).map(n=>()=>n.containsKey(e,t)))}}class VO extends OE{constructor(e){super(),this.currentSequenceNumber=e}}class cl{constructor(e){this.persistence=e,this.g_=new Fd,this.y_=null}static w_(e){return new cl(e)}get b_(){if(this.y_)return this.y_;throw Y(60996)}addReference(e,t,n){return this.g_.addReference(n,t),this.b_.delete(n.toString()),b.resolve()}removeReference(e,t,n){return this.g_.removeReference(n,t),this.b_.add(n.toString()),b.resolve()}markPotentiallyOrphaned(e,t){return this.b_.add(t.toString()),b.resolve()}removeTarget(e,t){this.g_.Xs(t.targetId).forEach(s=>this.b_.add(s.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next(s=>{s.forEach(i=>this.b_.add(i.toString()))}).next(()=>n.removeTargetData(e,t))}f_(){this.y_=new Set}m_(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return b.forEach(this.b_,n=>{const s=z.fromPath(n);return this.v_(e,s).next(i=>{i||t.removeEntry(s,Z.min())})}).next(()=>(this.y_=null,t.apply(e)))}updateLimboDocument(e,t){return this.v_(e,t).next(n=>{n?this.b_.delete(t.toString()):this.b_.add(t.toString())})}V_(e){return 0}v_(e,t){return b.or([()=>b.resolve(this.g_.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.p_(e,t)])}}class Du{constructor(e,t){this.persistence=e,this.S_=new nr(n=>_t(n.path),(n,s)=>n.isEqual(s)),this.garbageCollector=kE(this,t)}static w_(e,t){return new Du(e,t)}f_(){}m_(e){return b.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}rr(e){const t=this.xs(e);return this.persistence.getTargetCache().getTargetCount(e).next(n=>t.next(s=>n+s))}xs(e){let t=0;return this.ir(e,n=>{t++}).next(()=>t)}ir(e,t){return b.forEach(this.S_,(n,s)=>this.Fs(e,n,s).next(i=>i?b.resolve():t(s)))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.u_(e,o=>this.Fs(e,o,t).next(a=>{a||(n++,i.removeEntry(o,Z.min()))})).next(()=>i.apply(e)).next(()=>n)}markPotentiallyOrphaned(e,t){return this.S_.set(t,e.currentSequenceNumber),b.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.S_.set(n,e.currentSequenceNumber),b.resolve()}removeReference(e,t,n){return this.S_.set(n,e.currentSequenceNumber),b.resolve()}updateLimboDocument(e,t){return this.S_.set(t,e.currentSequenceNumber),b.resolve()}V_(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=qc(e.data.value)),t}Fs(e,t,n){return b.or([()=>this.persistence.p_(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.S_.get(t);return b.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xO{constructor(e){this.serializer=e}Mn(e,t,n,s){const i=new Wu("createOrUpgrade",t);n<1&&s>=1&&(function(c){c.createObjectStore(sc)}(e),function(c){c.createObjectStore(Ta,{keyPath:HN}),c.createObjectStore(an,{keyPath:rg,autoIncrement:!0}).createIndex(Cs,sg,{unique:!0}),c.createObjectStore(Oi)}(e),yg(e),function(c){c.createObjectStore(os)}(e));let o=b.resolve();return n<3&&s>=3&&(n!==0&&(function(c){c.deleteObjectStore(Li),c.deleteObjectStore(Fi),c.deleteObjectStore(Ds)}(e),yg(e)),o=o.next(()=>function(c){const l=c.store(Ds),B={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:Z.min().toTimestamp(),targetCount:0};return l.put(Eu,B)}(i))),n<4&&s>=4&&(n!==0&&(o=o.next(()=>function(c,l){return l.store(an).Kn().next(d=>{c.deleteObjectStore(an),c.createObjectStore(an,{keyPath:rg,autoIncrement:!0}).createIndex(Cs,sg,{unique:!0});const p=l.store(an),g=d.map(w=>p.put(w));return b.waitFor(g)})}(e,i))),o=o.next(()=>{(function(c){c.createObjectStore(ki,{keyPath:YN})})(e)})),n<5&&s>=5&&(o=o.next(()=>this.D_(i))),n<6&&s>=6&&(o=o.next(()=>(function(c){c.createObjectStore(Aa)}(e),this.x_(i)))),n<7&&s>=7&&(o=o.next(()=>this.C_(i))),n<8&&s>=8&&(o=o.next(()=>this.F_(e,i))),n<9&&s>=9&&(o=o.next(()=>{(function(c){c.objectStoreNames.contains("remoteDocumentChanges")&&c.deleteObjectStore("remoteDocumentChanges")})(e)})),n<10&&s>=10&&(o=o.next(()=>this.O_(i))),n<11&&s>=11&&(o=o.next(()=>{(function(c){c.createObjectStore(nl,{keyPath:XN})})(e),function(c){c.createObjectStore(rl,{keyPath:ZN})}(e)})),n<12&&s>=12&&(o=o.next(()=>{(function(c){const l=c.createObjectStore(sl,{keyPath:oO});l.createIndex(jB,aO,{unique:!1}),l.createIndex(CI,cO,{unique:!1})})(e)})),n<13&&s>=13&&(o=o.next(()=>function(c){const l=c.createObjectStore(_u,{keyPath:jN});l.createIndex($c,JN),l.createIndex(hI,KN)}(e)).next(()=>this.M_(e,i)).next(()=>e.deleteObjectStore(os))),n<14&&s>=14&&(o=o.next(()=>this.N_(e,i))),n<15&&s>=15&&(o=o.next(()=>function(c){c.createObjectStore(vd,{keyPath:eO,autoIncrement:!0}).createIndex(qB,tO,{unique:!1}),c.createObjectStore(Xo,{keyPath:nO}).createIndex(fI,rO,{unique:!1}),c.createObjectStore(Zo,{keyPath:sO}).createIndex(pI,iO,{unique:!1})}(e))),n<16&&s>=16&&(o=o.next(()=>{t.objectStore(Xo).clear()}).next(()=>{t.objectStore(Zo).clear()})),n<17&&s>=17&&(o=o.next(()=>{(function(c){c.createObjectStore(Rd,{keyPath:uO})})(e)})),n<18&&s>=18&&Yg()&&(o=o.next(()=>{t.objectStore(Xo).clear()}).next(()=>{t.objectStore(Zo).clear()})),o}x_(e){let t=0;return e.store(os).jn((n,s)=>{t+=Iu(s)}).next(()=>{const n={byteSize:t};return e.store(Aa).put(HB,n)})}D_(e){const t=e.store(Ta),n=e.store(an);return t.Kn().next(s=>b.forEach(s,i=>{const o=IDBKeyRange.bound([i.userId,vr],[i.userId,i.lastAcknowledgedBatchId]);return n.Kn(Cs,o).next(a=>b.forEach(a,c=>{q(c.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:c.batchId});const l=us(this.serializer,c);return II(e,i.userId,l).next(()=>{})}))}))}C_(e){const t=e.store(Li),n=e.store(os);return e.store(Ds).get(Eu).next(s=>{const i=[];return n.jn((o,a)=>{const c=new ce(o),l=function(d){return[0,_t(d)]}(c);i.push(t.get(l).next(B=>B?b.resolve():(d=>t.put({targetId:0,path:_t(d),sequenceNumber:s.highestListenSequenceNumber}))(c)))}).next(()=>b.waitFor(i))})}F_(e,t){e.createObjectStore(va,{keyPath:$N});const n=t.store(va),s=new Od,i=o=>{if(s.add(o)){const a=o.lastSegment(),c=o.popLast();return n.put({collectionId:a,parent:_t(c)})}};return t.store(os).jn({zn:!0},(o,a)=>{const c=new ce(o);return i(c.popLast())}).next(()=>t.store(Oi).jn({zn:!0},([o,a,c],l)=>{const B=Tn(a);return i(B.popLast())}))}O_(e){const t=e.store(Fi);return t.jn((n,s)=>{const i=xo(this.serializer,s),o=wI(this.serializer,i);return t.put(o)})}M_(e,t){const n=t.store(os),s=[];return n.jn((i,o)=>{const a=t.store(_u),c=function(d){return d.document?new z(ce.fromString(d.document.name).popFirst(5)):d.noDocument?z.fromSegments(d.noDocument.path):d.unknownDocument?z.fromSegments(d.unknownDocument.path):Y(36783)}(o).path.toArray(),l={prefixPath:c.slice(0,c.length-2),collectionGroup:c[c.length-2],documentId:c[c.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};s.push(a.put(l))}).next(()=>b.waitFor(s))}N_(e,t){const n=t.store(an),s=SI(this.serializer),i=new Ld(cl.w_,this.serializer.qr);return n.Kn().next(o=>{const a=new Map;return o.forEach(c=>{let l=a.get(c.userId)??ae();us(this.serializer,c).keys().forEach(B=>l=l.add(B)),a.set(c.userId,l)}),b.forEach(a,(c,l)=>{const B=new ot(l),d=ol.Kr(this.serializer,B),p=i.getIndexManager(B),g=il.Kr(B,this.serializer,p,i.referenceDelegate);return new NI(s,g,d,p).recalculateAndSaveOverlaysForDocumentKeys(new JB(t,xt.yn),c).next()})})}}function yg(r){r.createObjectStore(Li,{keyPath:WN}).createIndex(Ad,QN,{unique:!0}),r.createObjectStore(Fi,{keyPath:"targetId"}).createIndex(dI,zN,{unique:!0}),r.createObjectStore(Ds)}const pr="IndexedDbPersistence",aB=18e5,cB=5e3,uB="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",OI="main";class kd{constructor(e,t,n,s,i,o,a,c,l,B,d=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.xt=i,this.window=o,this.document=a,this.L_=l,this.B_=B,this.U_=d,this.P_=null,this.R_=!1,this.isPrimary=!1,this.networkEnabled=!0,this.k_=null,this.inForeground=!1,this.q_=null,this.K_=null,this.W_=Number.NEGATIVE_INFINITY,this.Q_=p=>Promise.resolve(),!kd.Je())throw new x(O.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new TO(this,s),this.G_=t+OI,this.serializer=new yI(c),this.z_=new Pn(this.G_,this.U_,new xO(this.serializer)),this.I_=new CO,this.A_=new DO(this.referenceDelegate,this.serializer),this.remoteDocumentCache=SI(this.serializer),this.d_=new pO,this.window&&this.window.localStorage?this.j_=this.window.localStorage:(this.j_=null,B===!1&&je(pr,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.H_().then(()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new x(O.FAILED_PRECONDITION,uB);return this.J_(),this.Y_(),this.Z_(),this.runTransaction("getHighestListenSequenceNumber","readonly",e=>this.A_.getHighestSequenceNumber(e))}).then(e=>{this.P_=new xt(e,this.L_)}).then(()=>{this.R_=!0}).catch(e=>(this.z_&&this.z_.close(),Promise.reject(e)))}X_(e){return this.Q_=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.z_.Ln(async t=>{t.newVersion===null&&await e()})}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.xt.enqueueAndForget(async()=>{this.started&&await this.H_()}))}H_(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",e=>Vc(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next(()=>{if(this.isPrimary)return this.eo(e).next(t=>{t||(this.isPrimary=!1,this.xt.enqueueRetryable(()=>this.Q_(!1)))})}).next(()=>this.no(e)).next(t=>this.isPrimary&&!t?this.ro(e).next(()=>!1):!!t&&this.io(e).next(()=>!0))).catch(e=>{if(Wr(e))return U(pr,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return U(pr,"Releasing owner lease after error during lease refresh",e),!1}).then(e=>{this.isPrimary!==e&&this.xt.enqueueRetryable(()=>this.Q_(e)),this.isPrimary=e})}eo(e){return So(e).get(ei).next(t=>b.resolve(this.so(t)))}_o(e){return Vc(e).delete(this.clientId)}async oo(){if(this.isPrimary&&!this.ao(this.W_,aB)){this.W_=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",t=>{const n=rt(t,ki);return n.Kn().next(s=>{const i=this.uo(s,aB),o=s.filter(a=>i.indexOf(a)===-1);return b.forEach(o,a=>n.delete(a.clientId)).next(()=>o)})}).catch(()=>[]);if(this.j_)for(const t of e)this.j_.removeItem(this.co(t.clientId))}}Z_(){this.K_=this.xt.enqueueAfterDelay("client_metadata_refresh",4e3,()=>this.H_().then(()=>this.oo()).then(()=>this.Z_()))}so(e){return!!e&&e.ownerId===this.clientId}no(e){return this.B_?b.resolve(!0):So(e).get(ei).next(t=>{if(t!==null&&this.ao(t.leaseTimestampMs,cB)&&!this.lo(t.ownerId)){if(this.so(t)&&this.networkEnabled)return!0;if(!this.so(t)){if(!t.allowTabSynchronization)throw new x(O.FAILED_PRECONDITION,uB);return!1}}return!(!this.networkEnabled||!this.inForeground)||Vc(e).Kn().next(n=>this.uo(n,cB).find(s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,o=!this.inForeground&&s.inForeground,a=this.networkEnabled===s.networkEnabled;if(i||o&&a)return!0}return!1})===void 0)}).next(t=>(this.isPrimary!==t&&U(pr,`Client ${t?"is":"is not"} eligible for a primary lease.`),t))}async shutdown(){this.R_=!1,this.Eo(),this.K_&&(this.K_.cancel(),this.K_=null),this.ho(),this.To(),await this.z_.runTransaction("shutdown","readwrite",[sc,ki],e=>{const t=new JB(e,xt.yn);return this.ro(t).next(()=>this._o(t))}),this.z_.close(),this.Po()}uo(e,t){return e.filter(n=>this.ao(n.updateTimeMs,t)&&!this.lo(n.clientId))}Ro(){return this.runTransaction("getActiveClients","readonly",e=>Vc(e).Kn().next(t=>this.uo(t,aB).map(n=>n.clientId)))}get started(){return this.R_}getGlobalsCache(){return this.I_}getMutationQueue(e,t){return il.Kr(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.A_}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new wO(e,this.serializer.qr.databaseId)}getDocumentOverlayCache(e){return ol.Kr(this.serializer,e)}getBundleCache(){return this.d_}runTransaction(e,t,n){U(pr,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=function(c){return c===18?hO:c===17?EI:c===16?BO:c===15?bd:c===14?_I:c===13?mI:c===12?lO:c===11?gI:void Y(60245)}(this.U_);let o;return this.z_.runTransaction(e,s,i,a=>(o=new JB(a,this.P_?this.P_.next():xt.yn),t==="readwrite-primary"?this.eo(o).next(c=>!!c||this.no(o)).next(c=>{if(!c)throw je(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.xt.enqueueRetryable(()=>this.Q_(!1)),new x(O.FAILED_PRECONDITION,NE);return n(o)}).next(c=>this.io(o).next(()=>c)):this.Io(o).next(()=>n(o)))).then(a=>(o.raiseOnCommittedEvent(),a))}Io(e){return So(e).get(ei).next(t=>{if(t!==null&&this.ao(t.leaseTimestampMs,cB)&&!this.lo(t.ownerId)&&!this.so(t)&&!(this.B_||this.allowTabSynchronization&&t.allowTabSynchronization))throw new x(O.FAILED_PRECONDITION,uB)})}io(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return So(e).put(ei,t)}static Je(){return Pn.Je()}ro(e){const t=So(e);return t.get(ei).next(n=>this.so(n)?(U(pr,"Releasing primary lease."),t.delete(ei)):b.resolve())}ao(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||(je(`Detected an update time that is in the future: ${e} > ${n}`),!1))}J_(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.q_=()=>{this.xt.enqueueAndForget(()=>(this.inForeground=this.document.visibilityState==="visible",this.H_()))},this.document.addEventListener("visibilitychange",this.q_),this.inForeground=this.document.visibilityState==="visible")}ho(){this.q_&&(this.document.removeEventListener("visibilitychange",this.q_),this.q_=null)}Y_(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.k_=()=>{this.Eo();const t=/(?:Version|Mobile)\/1[456]/;$g()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.xt.enterRestrictedMode(!0),this.xt.enqueueAndForget(()=>this.shutdown())},this.window.addEventListener("pagehide",this.k_))}To(){this.k_&&(this.window.removeEventListener("pagehide",this.k_),this.k_=null)}lo(e){var t;try{const n=((t=this.j_)==null?void 0:t.getItem(this.co(e)))!==null;return U(pr,`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return je(pr,"Failed to get zombied client id.",n),!1}}Eo(){if(this.j_)try{this.j_.setItem(this.co(this.clientId),String(Date.now()))}catch(e){je("Failed to set zombie client id.",e)}}Po(){if(this.j_)try{this.j_.removeItem(this.co(this.clientId))}catch{}}co(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function So(r){return rt(r,sc)}function Vc(r){return rt(r,ki)}function Vd(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xd{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Ao=n,this.Vo=s}static fo(e,t){let n=ae(),s=ae();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new xd(e,t.fromCache,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MO(r,e){return z.comparator(r.key,e.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GO{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class FI{constructor(){this.mo=!1,this.po=!1,this.yo=100,this.wo=function(){return $g()?8:FE(xe())>0?6:4}()}initialize(e,t){this.bo=e,this.indexManager=t,this.mo=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.vo(e,t).next(o=>{i.result=o}).next(()=>{if(!i.result)return this.So(e,t,s,n).next(o=>{i.result=o})}).next(()=>{if(i.result)return;const o=new GO;return this.Do(e,t,o).next(a=>{if(i.result=a,this.po)return this.xo(e,t,o,a.size)})}).next(()=>i.result)}xo(e,t,n,s){return Ue(t)?b.resolve():n.documentReadCount<this.yo?(ci()<=Be.DEBUG&&U("QueryEngine","SDK will not create cache indexes for query:",zo(t),"since it only creates cache indexes for collection contains","more than or equal to",this.yo,"documents"),b.resolve()):(ci()<=Be.DEBUG&&U("QueryEngine","Query:",zo(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.wo*s?(ci()<=Be.DEBUG&&U("QueryEngine","The SDK decides to create cache indexes for query:",zo(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Pt(t))):b.resolve())}vo(e,t){if(Ue(t))return b.resolve(null);let n=t;if(VC(n))return b.resolve(null);let s=Pt(n);return this.indexManager.getIndexType(e,s).next(i=>i===0?null:(n.limit!==null&&i===1&&(n=du(n,null,"F"),s=Pt(n)),this.indexManager.getDocumentsMatchingTarget(e,s).next(o=>{const a=ae(...o);return this.bo.getDocuments(e,a).next(c=>this.indexManager.getMinOffset(e,s).next(l=>{const B=this.Co(n,c);return this.Fo(n,B,a,l.readTime)?this.vo(e,du(n,null,"F")):this.Oo(e,B,n,l)}))})))}So(e,t,n,s){return(Ue(t)?function(o){for(const a of o.stages){if(a instanceof Gr||a instanceof eg)return!1;if(a instanceof tc){if(a.condition instanceof XE&&a.condition._expr.name==="exists"&&a.condition._expr.params[0]instanceof js&&a.condition._expr.params[0].fieldName===yn)continue;return!1}}return!0}(t):VC(t))||s.isEqual(Z.min())?b.resolve(null):this.bo.getDocuments(e,n).next(i=>{const o=this.Co(t,i);return this.Fo(t,o,n,s)?b.resolve(null):(ci()<=Be.DEBUG&&U("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),tg(t)),this.Oo(e,o,t,tE(s,Pi)).next(a=>a))})}Co(e,t){let n,s;return Ue(e)?(n=new ye(MO),s=i=>al(e,i)):(n=new ye(Zh(e)),s=i=>zu(e,i)),t.forEach((i,o)=>{s(o)&&(n=n.add(o))}),n}Fo(e,t,n,s){if(Ue(e))return function(a){return a.stages.some(c=>c instanceof Gr||c instanceof eg)}(e);if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Do(e,t,n){return ci()<=Be.DEBUG&&U("QueryEngine","Using full collection scan to execute query:",tg(t)),this.bo.getDocumentsMatchingQuery(e,t,$t.min(),n)}Oo(e,t,n,s){return this.bo.getDocumentsMatchingQuery(e,n,s).next(i=>(t.forEach(o=>{i=i.insert(o.key,o)}),i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Md="LocalStore",UO=3e8;class HO{constructor(e,t,n,s){this.persistence=e,this.Mo=t,this.serializer=s,this.No=new Re(oe),this.Lo=new nr(i=>tl(i),wd),this.Bo=new Map,this.Uo=e.getRemoteDocumentCache(),this.A_=e.getTargetCache(),this.d_=e.getBundleCache(),this.ko(n)}ko(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new NI(this.Uo,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Uo.setIndexManager(this.indexManager),this.Mo.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.No))}}function LI(r,e,t,n){return new HO(r,e,t,n)}async function kI(r,e){const t=$(r);return await t.persistence.runTransaction("Handle user change","readonly",n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next(i=>(s=i,t.ko(e),t.mutationQueue.getAllMutationBatches(n))).next(i=>{const o=[],a=[];let c=ae();for(const l of s){o.push(l.batchId);for(const B of l.mutations)c=c.add(B.key)}for(const l of i){a.push(l.batchId);for(const B of l.mutations)c=c.add(B.key)}return t.localDocuments.getDocuments(n,c).next(l=>({qo:l,removedBatchIds:o,addedBatchIds:a}))})})}function qO(r,e){const t=$(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",n=>{const s=e.batch.keys(),i=t.Uo.newChangeBuffer({trackRemovals:!0});return function(a,c,l,B){const d=l.batch,p=d.keys();let g=b.resolve();return p.forEach(w=>{g=g.next(()=>B.getEntry(c,w)).next(N=>{const M=l.docVersions.get(w);q(M!==null,48541),N.version.compareTo(M)<0&&(d.applyToRemoteDocument(N,l),N.isValidDocument()&&(N.setReadTime(l.commitVersion),B.addEntry(N)))})}),g.next(()=>a.mutationQueue.removeMutationBatch(c,d))}(t,n,e,i).next(()=>i.apply(n)).next(()=>t.mutationQueue.performConsistencyCheck(n)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,function(a){let c=ae();for(let l=0;l<a.mutationResults.length;++l)a.mutationResults[l].transformResults.length>0&&(c=c.add(a.batch.mutations[l].key));return c}(e))).next(()=>t.localDocuments.getDocuments(n,s))})}function VI(r){const e=$(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.A_.getLastRemoteSnapshotVersion(t))}function jO(r,e){const t=$(r),n=e.snapshotVersion;let s=t.No;return t.persistence.runTransaction("Apply remote event","readwrite-primary",i=>{const o=t.Uo.newChangeBuffer({trackRemovals:!0});s=t.No;const a=[];e.targetChanges.forEach((B,d)=>{const p=s.get(d);if(!p)return;a.push(t.A_.removeMatchingKeys(i,B.removedDocuments,d).next(()=>t.A_.addMatchingKeys(i,B.addedDocuments,d)));let g=p.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(d)!==null?g=g.withResumeToken(Le.EMPTY_BYTE_STRING,Z.min()).withLastLimboFreeSnapshotVersion(Z.min()):B.resumeToken.approximateByteSize()>0&&(g=g.withResumeToken(B.resumeToken,n)),s=s.insert(d,g),function(N,M,W){return N.resumeToken.approximateByteSize()===0||M.snapshotVersion.toMicroseconds()-N.snapshotVersion.toMicroseconds()>=UO?!0:W.addedDocuments.size+W.modifiedDocuments.size+W.removedDocuments.size>0}(p,g,B)&&a.push(t.A_.updateTargetData(i,g))});let c=$e(),l=ae();if(e.documentUpdates.forEach(B=>{e.resolvedLimboDocuments.has(B)&&a.push(t.persistence.referenceDelegate.updateLimboDocument(i,B))}),a.push(xI(i,o,e.documentUpdates).next(B=>{c=B.$o,l=B.Ko})),!n.isEqual(Z.min())){const B=t.A_.getLastRemoteSnapshotVersion(i).next(d=>t.A_.setTargetsMetadata(i,i.currentSequenceNumber,n));a.push(B)}return b.waitFor(a).next(()=>o.apply(i)).next(()=>t.localDocuments.getLocalViewOfDocuments(i,c,l)).next(()=>c)}).then(i=>(t.No=s,i))}function xI(r,e,t){let n=ae(),s=ae();return t.forEach(i=>n=n.add(i)),e.getEntries(r,n).next(i=>{let o=$e();return t.forEach((a,c)=>{const l=i.get(a);c.isFoundDocument()!==l.isFoundDocument()&&(s=s.add(a)),c.isNoDocument()&&c.version.isEqual(Z.min())?(e.removeEntry(a,c.readTime),o=o.insert(a,c)):!l.isValidDocument()||c.version.compareTo(l.version)>0||c.version.compareTo(l.version)===0&&l.hasPendingWrites?(e.addEntry(c),o=o.insert(a,c)):U(Md,"Ignoring outdated watch update for ",a,". Current version:",l.version," Watch version:",c.version)}),{$o:o,Ko:s}})}function JO(r,e){const t=$(r);return t.persistence.runTransaction("Get next mutation batch","readonly",n=>(e===void 0&&(e=vr),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e)))}function Vi(r,e){const t=$(r);return t.persistence.runTransaction("Allocate target","readwrite",n=>{let s;return t.A_.getTargetData(n,e).next(i=>i?(s=i,b.resolve(s)):t.A_.allocateTargetId(n).next(o=>(s=new An(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.A_.addTargetData(n,s).next(()=>s))))}).then(n=>{const s=t.No.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.No=t.No.insert(n.targetId,n),t.Lo.set(e,n.targetId)),n})}async function xi(r,e,t){const n=$(r),s=n.No.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,o=>n.persistence.referenceDelegate.removeTarget(o,s))}catch(o){if(!Wr(o))throw o;U(Md,`Failed to update sequence numbers for target ${e}: ${o}`)}n.No=n.No.remove(e),n.Lo.delete(s.target)}function Tu(r,e,t){const n=$(r);let s=Z.min(),i=ae();return n.persistence.runTransaction("Execute query","readwrite",o=>function(c,l,B){const d=$(c),p=d.Lo.get(B);return p!==void 0?b.resolve(d.No.get(p)):d.A_.getTargetData(l,B)}(n,o,Ue(e)?e:Pt(e)).next(a=>{if(a)return s=a.lastLimboFreeSnapshotVersion,n.A_.getMatchingKeysForTargetId(o,a.targetId).next(c=>{i=c})}).next(()=>n.Mo.getDocumentsMatchingQuery(o,e,t?s:Z.min(),t?i:ae())).next(a=>(GI(n,a),{documents:a,Wo:i})))}function MI(r,e){const t=$(r),n=$(t.A_),s=t.No.get(e);return s?Promise.resolve(s.target??null):t.persistence.runTransaction("Get target data","readonly",i=>n.ge(i,e).next(o=>(o==null?void 0:o.target)??null))}function YB(r,e){const t=$(r),n=t.Bo.get(e)||Z.min();return t.persistence.runTransaction("Get new document changes","readonly",s=>t.Uo.getAllFromCollectionGroup(s,e,tE(n,Pi),Number.MAX_SAFE_INTEGER)).then(s=>(GI(t,s),s))}function GI(r,e){e.forEach((t,n)=>{const s=n.key.getCollectionGroup(),i=r.Bo.get(s)||Z.min();n.readTime.compareTo(i)>0&&r.Bo.set(s,n.readTime)})}async function KO(r,e,t,n){const s=$(r);let i=ae(),o=$e();for(const l of t){const B=e.Qo(l.metadata.name);l.document&&(i=i.add(B));const d=e.Go(l);d.setReadTime(e.zo(l.metadata.readTime)),o=o.insert(B,d)}const a=s.Uo.newChangeBuffer({trackRemovals:!0}),c=await Vi(s,function(B){return Pt(Yi(ce.fromString(`__bundle__/docs/${B}`)))}(n));return s.persistence.runTransaction("Apply bundle documents","readwrite",l=>xI(l,a,o).next(B=>(a.apply(l),B)).next(B=>s.A_.removeMatchingKeysForTargetId(l,c.targetId).next(()=>s.A_.addMatchingKeys(l,i,c.targetId)).next(()=>s.localDocuments.getLocalViewOfDocuments(l,B.$o,B.Ko)).next(()=>B.$o)))}async function zO(r,e,t=ae()){const n=await Vi(r,Pt(Sd(e.bundledQuery))),s=$(r);return s.persistence.runTransaction("Save named query","readwrite",i=>{const o=Je(e.readTime);if(n.snapshotVersion.compareTo(o)>=0)return s.d_.saveNamedQuery(i,e);const a=n.withResumeToken(Le.EMPTY_BYTE_STRING,o);return s.No=s.No.insert(a.targetId,a),s.A_.updateTargetData(i,a).next(()=>s.A_.removeMatchingKeysForTargetId(i,n.targetId)).next(()=>s.A_.addMatchingKeys(i,t,n.targetId)).next(()=>s.d_.saveNamedQuery(i,e))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WO{constructor(e,t){this.jo=e,this.byteLength=t}Ho(){return"metadata"in this.jo}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wg(r,e=10240){let t=0;return{async read(){if(t<r.byteLength){const n={value:r.slice(t,t+e),done:!1};return t+=e,n}return{done:!0}},async cancel(){},releaseLock(){},closed:Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class QO{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.Jo=0,this.Yo=null,this.Zo=!0}Xo(){this.Jo===0&&(this.ea("Unknown"),this.Yo=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.Yo=null,this.ta("Backend didn't respond within 10 seconds."),this.ea("Offline"),Promise.resolve())))}na(e){this.state==="Online"?this.ea("Unknown"):(this.Jo++,this.Jo>=1&&(this.ra(),this.ta(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ea("Offline")))}set(e){this.ra(),this.Jo=0,e==="Online"&&(this.Zo=!1),this.ea(e)}ea(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}ta(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Zo?(je(t),this.Zo=!1):U("OnlineStateTracker",t)}ra(){this.Yo!==null&&(this.Yo.cancel(),this.Yo=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kn="RemoteStore";class $O{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.ia=[],this.sa=new Map,this._a=new Map,this.oa=new Map,this.aa=new Yn(1e3),this.ua=new Yn(1001),this.ca=new Set,this.la=[],this.Ea=i,this.Ea.Ke(o=>{n.enqueueAndForget(async()=>{Qr(this)&&(U(kn,"Restarting streams for network reachability change."),await async function(c){const l=$(c);l.ca.add(4),await to(l),l.ha.set("Unknown"),l.ca.delete(4),await ic(l)}(this))})}),this.ha=new QO(n,s)}}async function ic(r){if(Qr(r))for(const e of r.la)await e(!0)}async function to(r){for(const e of r.la)await e(!1)}function XB(r,e){return r._a.get(e)||void 0}function ul(r,e){const t=$(r),n=XB(t,e.targetId);if(n!==void 0&&t.sa.has(n))return;const s=function(a,c){const l=XB(a,c);l!==void 0&&a.oa.delete(l);const B=function(p,g){return g%2!=0?p.ua.next():p.aa.next()}(a,c);return a._a.set(c,B),a.oa.set(B,c),B}(t,e.targetId);U(kn,"remoteStoreListen mapping SDK target ID to remote",e.targetId,s);const i=new An(e.target,s,e.purpose,e.sequenceNumber,e.snapshotVersion,e.lastLimboFreeSnapshotVersion,e.resumeToken);t.sa.set(s,i),Hd(t)?Ud(t):ro(t).Jt()&&Gd(t,i)}function Mi(r,e){const t=$(r),n=ro(t),s=XB(t,e);U(kn,"remoteStoreUnlisten removing mapping of SDK target ID to remote",e,s),t.sa.delete(s),t._a.delete(e),t.oa.delete(s),n.Jt()&&UI(t,s),t.sa.size===0&&(n.Jt()?n.Xt():Qr(t)&&t.ha.set("Unknown"))}function Gd(r,e){if(r.Ta.H(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(Z.min())>0){const t=r.oa.get(e.targetId);if(t===void 0)return void U(kn,"SDK target ID not found for remote ID: "+e.targetId);const n=r.remoteSyncer.getRemoteKeysForTarget(t).size;e=e.withExpectedCount(n)}ro(r).Tn(e)}function UI(r,e){r.Ta.H(e),ro(r).Pn(e)}function Ud(r){r.Ta=new IP({getRemoteKeysForTarget:e=>{const t=r.oa.get(e);return t!==void 0?r.remoteSyncer.getRemoteKeysForTarget(t):ae()},ge:e=>r.sa.get(e)||null,Ae:()=>r.datastore.serializer.databaseId}),ro(r).start(),r.ha.Xo()}function Hd(r){return Qr(r)&&!ro(r).Ht()&&r.sa.size>0}function Qr(r){return $(r).ca.size===0}function HI(r){r.Ta=void 0}async function YO(r){r.ha.set("Online")}async function XO(r){r.sa.forEach((e,t)=>{Gd(r,e)})}async function ZO(r,e){HI(r),Hd(r)?(r.ha.na(e),Ud(r)):r.ha.set("Unknown")}async function e0(r,e,t){if(r.ha.set("Online"),e instanceof hE&&e.state===2&&e.cause)try{await async function(s,i){const o=i.cause;for(const a of i.targetIds){if(s.sa.has(a)){const c=s.oa.get(a);c!==void 0&&(await s.remoteSyncer.rejectListen(c,o),s._a.delete(c),s.oa.delete(a)),s.sa.delete(a)}s.Ta.removeTarget(a)}}(r,e)}catch(n){U(kn,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Au(r,n)}else if(e instanceof Kc?r.Ta.se(e):e instanceof BE?r.Ta.Ee(e):r.Ta.ae(e),!t.isEqual(Z.min()))try{const n=await VI(r.localStore);t.compareTo(n)>=0&&await function(i,o){const a=i.Ta.de(o);a.targetChanges.forEach((l,B)=>{if(l.resumeToken.approximateByteSize()>0){const d=i.sa.get(B);d&&i.sa.set(B,d.withResumeToken(l.resumeToken,o))}}),a.targetMismatches.forEach((l,B)=>{const d=i.sa.get(l);if(!d)return;i.sa.set(l,d.withResumeToken(Le.EMPTY_BYTE_STRING,d.snapshotVersion)),UI(i,l);const p=new An(d.target,l,B,d.sequenceNumber);Gd(i,p)});const c=function(B,d){const p=new Map;d.targetChanges.forEach((w,N)=>{const M=B.oa.get(N);M!==void 0&&p.set(M,w)});let g=new Re(oe);return d.targetMismatches.forEach((w,N)=>{const M=B.oa.get(w);M!==void 0&&(g=g.insert(M,N))}),new Xi(d.snapshotVersion,p,g,d.documentUpdates,d.augmentedDocumentUpdates,d.resolvedLimboDocuments)}(i,a);return i.remoteSyncer.applyRemoteEvent(c)}(r,t)}catch(n){U(kn,"Failed to raise snapshot:",n),await Au(r,n)}}async function Au(r,e,t){if(!Wr(e))throw e;r.ca.add(1),await to(r),r.ha.set("Offline"),t||(t=()=>VI(r.localStore)),r.asyncQueue.enqueueRetryable(async()=>{U(kn,"Retrying IndexedDB access"),await t(),r.ca.delete(1),await ic(r)})}function qI(r,e){return e().catch(t=>Au(r,t,e))}async function no(r){const e=$(r),t=Hr(e);let n=e.ia.length>0?e.ia[e.ia.length-1].batchId:vr;for(;t0(e);)try{const s=await JO(e.localStore,n);if(s===null){e.ia.length===0&&t.Xt();break}n=s.batchId,n0(e,s)}catch(s){await Au(e,s)}jI(e)&&JI(e)}function t0(r){return Qr(r)&&r.ia.length<10}function n0(r,e){r.ia.push(e);const t=Hr(r);t.Jt()&&t.Rn&&t.In(e.mutations)}function jI(r){return Qr(r)&&!Hr(r).Ht()&&r.ia.length>0}function JI(r){Hr(r).start()}async function r0(r){Hr(r).dn()}async function s0(r){const e=Hr(r);for(const t of r.ia)e.In(t.mutations)}async function i0(r,e,t){const n=r.ia.shift(),s=Td.from(n,e,t);await qI(r,()=>r.remoteSyncer.applySuccessfulWrite(s)),await no(r)}async function o0(r,e){e&&Hr(r).Rn&&await async function(n,s){if(function(o){return iE(o)&&o!==O.ABORTED}(s.code)){const i=n.ia.shift();Hr(n).Zt(),await qI(n,()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s)),await no(n)}}(r,e),jI(r)&&JI(r)}async function Dg(r,e){const t=$(r);t.asyncQueue.verifyOperationInProgress(),U(kn,"RemoteStore received new credentials");const n=Qr(t);t.ca.add(3),await to(t),n&&t.ha.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.ca.delete(3),await ic(t)}async function ZB(r,e){const t=$(r);e?(t.ca.delete(2),await ic(t)):e||(t.ca.add(2),await to(t),t.ha.set("Unknown"))}function ro(r){return r.Pa||(r.Pa=function(t,n,s){const i=$(t);return i.mn(),new KP(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(r.datastore,r.asyncQueue,{ut:YO.bind(null,r),lt:XO.bind(null,r),ht:ZO.bind(null,r),hn:e0.bind(null,r)}),r.la.push(async e=>{e?(r.Pa.Zt(),Hd(r)?Ud(r):r.ha.set("Unknown")):(await r.Pa.stop(),HI(r))})),r.Pa}function Hr(r){return r.Ra||(r.Ra=function(t,n,s){const i=$(t);return i.mn(),new zP(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(r.datastore,r.asyncQueue,{ut:()=>Promise.resolve(),lt:r0.bind(null,r),ht:o0.bind(null,r),An:s0.bind(null,r),Vn:i0.bind(null,r)}),r.la.push(async e=>{e?(r.Ra.Zt(),await no(r)):(await r.Ra.stop(),r.ia.length>0&&(U(kn,`Stopping write stream with ${r.ia.length} pending writes`),r.ia=[]))})),r.Ra}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ll{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ia(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ia(this.observer.error,e):je("Uncaught Error in snapshot listener:",e.toString()))}Aa(){this.muted=!0}Ia(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qd{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Bt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(o=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const o=Date.now()+n,a=new qd(e,t,o,s,i);return a.start(n),a}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new x(O.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function so(r,e){if(je("AsyncQueue",`${e}: ${r}`),Wr(r))return new x(O.UNAVAILABLE,`${e}: ${r}`);throw r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class a0{constructor(e,t){this.Va=e,this.serializer=t,this.metadata=new Bt,this.buffer=new Uint8Array,this.da=function(){return new TextDecoder("utf-8")}(),this.fa().then(n=>{n&&n.Ho()?this.metadata.resolve(n.jo.metadata):this.metadata.reject(new Error(`The first element of the bundle is not a metadata, it is
             ${JSON.stringify(n==null?void 0:n.jo)}`))},n=>this.metadata.reject(n))}close(){return this.Va.cancel()}async getMetadata(){return this.metadata.promise}async ma(){return await this.getMetadata(),this.fa()}async fa(){const e=await this.pa();if(e===null)return null;const t=this.da.decode(e),n=Number(t);isNaN(n)&&this.ga(`length string (${t}) is not valid number`);const s=await this.ya(n);return new WO(JSON.parse(s),e.length+n)}wa(){return this.buffer.findIndex(e=>e===123)}async pa(){for(;this.wa()<0&&!await this.ba(););if(this.buffer.length===0)return null;const e=this.wa();e<0&&this.ga("Reached the end of bundle when a length string is expected.");const t=this.buffer.slice(0,e);return this.buffer=this.buffer.slice(e),t}async ya(e){for(;this.buffer.length<e;)await this.ba()&&this.ga("Reached the end of bundle when more is expected.");const t=this.da.decode(this.buffer.slice(0,e));return this.buffer=this.buffer.slice(e),t}ga(e){throw this.Va.cancel(),new Error(`Invalid bundle format: ${e}`)}async ba(){const e=await this.Va.read();if(!e.done){const t=new Uint8Array(this.buffer.length+e.value.length);t.set(this.buffer),t.set(e.value,this.buffer.length),this.buffer=t}return e.done}}const ea="IndexBackfiller";class c0{constructor(e,t){this.asyncQueue=e,this.Sa=t,this.task=null}start(){this.Da(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}Da(e){U(ea,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,async()=>{this.task=null;try{const t=await this.Sa.xa();U(ea,`Documents written: ${t}`)}catch(t){Wr(t)?U(ea,"Ignoring IndexedDB error during index backfill: ",t):await zr(t)}await this.Da(6e4)})}}class u0{constructor(e,t){this.localStore=e,this.persistence=t}async xa(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",t=>this.Ca(t,e))}Ca(e,t){const n=new Set;let s=t,i=!0;return b.doWhile(()=>i===!0&&s>0,()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next(o=>{if(o!==null&&!n.has(o))return U(ea,`Processing collection: ${o}`),this.Fa(e,o,s).next(a=>{s-=a,n.add(o)});i=!1})).next(()=>t-s)}Fa(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next(s=>this.localStore.localDocuments.getNextDocuments(e,t,s,n).next(i=>{const o=i.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next(()=>this.Oa(s,i)).next(a=>(U(ea,`Updating offset: ${a}`),this.localStore.indexManager.updateCollectionGroup(e,t,a))).next(()=>o.size)}))}Oa(e,t){let n=e;return t.changes.forEach((s,i)=>{const o=nE(i);Qh(o,n)>0&&(n=o)}),new $t(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const KI="firestore_clients";function Tg(r,e){return`${KI}_${r}_${e}`}const zI="firestore_mutations";function Ag(r,e,t){let n=`${zI}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const WI="firestore_targets";function lB(r,e){return`${WI}_${r}_${e}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cn="SharedClientState";class vu{constructor(e,t,n,s){this.user=e,this.batchId=t,this.state=n,this.error=s}static Ma(e,t,n){const s=JSON.parse(n);let i,o=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return o&&s.error&&(o=typeof s.error.message=="string"&&typeof s.error.code=="string",o&&(i=new x(s.error.code,s.error.message))),o?new vu(e,t,s.state,i):(je(Cn,`Failed to parse mutation state for ID '${t}': ${n}`),null)}Na(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class ta{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static Ma(e,t){const n=JSON.parse(t);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new x(n.error.code,n.error.message))),i?new ta(e,n.state,s):(je(Cn,`Failed to parse target state for ID '${e}': ${t}`),null)}Na(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Ru{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Ma(e,t){const n=JSON.parse(t);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=ed();for(let o=0;s&&o<n.activeTargetIds.length;++o)s=V_(n.activeTargetIds[o]),i=i.add(n.activeTargetIds[o]);return s?new Ru(e,i):(je(Cn,`Failed to parse client data for instance '${e}': ${t}`),null)}}class jd{constructor(e,t){this.clientId=e,this.onlineState=t}static Ma(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new jd(t.clientId,t.onlineState):(je(Cn,`Failed to parse online state: ${e}`),null)}}class eh{constructor(){this.activeTargetIds=ed()}La(e){this.activeTargetIds=this.activeTargetIds.add(e)}Ba(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Na(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class BB{constructor(e,t,n,s,i){this.window=e,this.xt=t,this.persistenceKey=n,this.Ua=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.ka=this.qa.bind(this),this.$a=new Re(oe),this.started=!1,this.Ka=[];const o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.Wa=Tg(this.persistenceKey,this.Ua),this.Qa=function(c){return`firestore_sequence_number_${c}`}(this.persistenceKey),this.$a=this.$a.insert(this.Ua,new eh),this.Ga=new RegExp(`^${KI}_${o}_([^_]*)$`),this.za=new RegExp(`^${zI}_${o}_(\\d+)(?:_(.*))?$`),this.ja=new RegExp(`^${WI}_${o}_(\\d+)$`),this.Ha=function(c){return`firestore_online_state_${c}`}(this.persistenceKey),this.Ja=function(c){return`firestore_bundle_loaded_v2_${c}`}(this.persistenceKey),this.window.addEventListener("storage",this.ka)}static Je(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ro();for(const n of e){if(n===this.Ua)continue;const s=this.getItem(Tg(this.persistenceKey,n));if(s){const i=Ru.Ma(n,s);i&&(this.$a=this.$a.insert(i.clientId,i))}}this.Ya();const t=this.storage.getItem(this.Ha);if(t){const n=this.Za(t);n&&this.Xa(n)}for(const n of this.Ka)this.qa(n);this.Ka=[],this.window.addEventListener("pagehide",()=>this.shutdown()),this.started=!0}writeSequenceNumber(e){this.setItem(this.Qa,JSON.stringify(e))}getAllActiveQueryTargets(){return this.eu(this.$a)}isActiveQueryTarget(e){let t=!1;return this.$a.forEach((n,s)=>{s.activeTargetIds.has(e)&&(t=!0)}),t}addPendingMutation(e){this.tu(e,"pending")}updateMutationState(e,t,n){this.tu(e,t,n),this.nu(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(lB(this.persistenceKey,e));if(s){const i=ta.Ma(e,s);i&&(n=i.state)}}return t&&this.ru.La(e),this.Ya(),n}removeLocalQueryTarget(e){this.ru.Ba(e),this.Ya()}isLocalQueryTarget(e){return this.ru.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(lB(this.persistenceKey,e))}updateQueryState(e,t,n){this.iu(e,t,n)}handleUserChange(e,t,n){t.forEach(s=>{this.nu(s)}),this.currentUser=e,n.forEach(s=>{this.addPendingMutation(s)})}setOnlineState(e){this.su(e)}notifyBundleLoaded(e){this._u(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.ka),this.removeItem(this.Wa),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return U(Cn,"READ",e,t),t}setItem(e,t){U(Cn,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){U(Cn,"REMOVE",e),this.storage.removeItem(e)}qa(e){const t=e;if(t.storageArea===this.storage){if(U(Cn,"EVENT",t.key,t.newValue),t.key===this.Wa)return void je("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.xt.enqueueRetryable(async()=>{if(this.started){if(t.key!==null){if(this.Ga.test(t.key)){if(t.newValue==null){const n=this.ou(t.key);return this.au(n,null)}{const n=this.uu(t.key,t.newValue);if(n)return this.au(n.clientId,n)}}else if(this.za.test(t.key)){if(t.newValue!==null){const n=this.cu(t.key,t.newValue);if(n)return this.lu(n)}}else if(this.ja.test(t.key)){if(t.newValue!==null){const n=this.Eu(t.key,t.newValue);if(n)return this.hu(n)}}else if(t.key===this.Ha){if(t.newValue!==null){const n=this.Za(t.newValue);if(n)return this.Xa(n)}}else if(t.key===this.Qa){const n=function(i){let o=xt.yn;if(i!=null)try{const a=JSON.parse(i);q(typeof a=="number",30636,{Tu:i}),o=a}catch(a){je(Cn,"Failed to read sequence number from WebStorage",a)}return o}(t.newValue);n!==xt.yn&&this.sequenceNumberHandler(n)}else if(t.key===this.Ja){const n=this.Pu(t.newValue);await Promise.all(n.map(s=>this.syncEngine.Ru(s)))}}}else this.Ka.push(t)})}}get ru(){return this.$a.get(this.Ua)}Ya(){this.setItem(this.Wa,this.ru.Na())}tu(e,t,n){const s=new vu(this.currentUser,e,t,n),i=Ag(this.persistenceKey,this.currentUser,e);this.setItem(i,s.Na())}nu(e){const t=Ag(this.persistenceKey,this.currentUser,e);this.removeItem(t)}su(e){const t={clientId:this.Ua,onlineState:e};this.storage.setItem(this.Ha,JSON.stringify(t))}iu(e,t,n){const s=lB(this.persistenceKey,e),i=new ta(e,t,n);this.setItem(s,i.Na())}_u(e){const t=JSON.stringify(Array.from(e));this.setItem(this.Ja,t)}ou(e){const t=this.Ga.exec(e);return t?t[1]:null}uu(e,t){const n=this.ou(e);return Ru.Ma(n,t)}cu(e,t){const n=this.za.exec(e),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return vu.Ma(new ot(i),s,t)}Eu(e,t){const n=this.ja.exec(e),s=Number(n[1]);return ta.Ma(s,t)}Za(e){return jd.Ma(e)}Pu(e){return JSON.parse(e)}async lu(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Iu(e.batchId,e.state,e.error);U(Cn,`Ignoring mutation for non-active user ${e.user.uid}`)}hu(e){return this.syncEngine.Au(e.targetId,e.state,e.error)}au(e,t){const n=t?this.$a.insert(e,t):this.$a.remove(e),s=this.eu(this.$a),i=this.eu(n),o=[],a=[];return i.forEach(c=>{s.has(c)||o.push(c)}),s.forEach(c=>{i.has(c)||a.push(c)}),this.syncEngine.Vu(o,a).then(()=>{this.$a=n})}Xa(e){this.$a.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}eu(e){let t=ed();return e.forEach((n,s)=>{t=t.unionWith(s.activeTargetIds)}),t}}class QI{constructor(){this.du=new eh,this.fu={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.du.La(e),this.fu[e]||"not-current"}updateQueryState(e,t,n){this.fu[e]=t}removeLocalQueryTarget(e){this.du.Ba(e)}isLocalQueryTarget(e){return this.du.activeTargetIds.has(e)}clearQueryState(e){delete this.fu[e]}getAllActiveQueryTargets(){return this.du.activeTargetIds}isActiveQueryTarget(e){return this.du.activeTargetIds.has(e)}start(){return this.du=new eh,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $I(){return typeof window<"u"?window:null}function Xc(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ts{static emptySet(e){return new Ts(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||z.comparator(t.key,n.key):(t,n)=>z.comparator(t.key,n.key),this.keyedMap=as(),this.sortedSet=new Re(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,n)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Ts)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new Ts;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vg{constructor(){this.mu=new Re(z.comparator)}track(e){const t=e.doc.key,n=this.mu.get(t);n?e.type!==0&&n.type===3?this.mu=this.mu.insert(t,e):e.type===3&&n.type!==1?this.mu=this.mu.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.mu=this.mu.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.mu=this.mu.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.mu=this.mu.remove(t):e.type===1&&n.type===2?this.mu=this.mu.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.mu=this.mu.insert(t,{type:2,doc:e.doc}):Y(63341,{ye:e,pu:n}):this.mu=this.mu.insert(t,e)}gu(){const e=[];return this.mu.inorderTraversal((t,n)=>{e.push(n)}),e}}class Gi{constructor(e,t,n,s,i,o,a,c,l){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=a,this.excludesMetadataChanges=c,this.hasCachedResults=l}static fromInitialDocuments(e,t,n,s,i){const o=[];return t.forEach(a=>{o.push({type:0,doc:a})}),new Gi(e,t,Ts.emptySet(t),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&el(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class l0{constructor(){this.yu=void 0,this.wu=[]}bu(){return this.wu.some(e=>e.vu())}}class B0{constructor(){this.queries=Rg(),this.onlineState="Unknown",this.Su=new Set}terminate(){(function(t,n){const s=$(t),i=s.queries;s.queries=Rg(),i.forEach((o,a)=>{for(const c of a.wu)c.onError(n)})})(this,new x(O.ABORTED,"Firestore shutting down"))}}function Rg(){return new nr(r=>lI(r),el)}async function Jd(r,e){const t=$(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.bu()&&e.vu()&&(n=2):(i=new l0,n=e.vu()?0:1);try{switch(n){case 0:i.yu=await t.onListen(s,!0);break;case 1:i.yu=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const a=so(o,`Initialization of query '${Ue(e.query)?jn(e.query):zo(e.query)}' failed`);return void e.onError(a)}t.queries.set(s,i),i.wu.push(e),e.Du(t.onlineState),i.yu&&e.xu(i.yu)&&zd(t)}async function Kd(r,e){const t=$(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const o=i.wu.indexOf(e);o>=0&&(i.wu.splice(o,1),i.wu.length===0?s=e.vu()?0:1:!i.bu()&&e.vu()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function h0(r,e){const t=$(r);let n=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const a of o.wu)a.xu(s)&&(n=!0);o.yu=s}}n&&zd(t)}function d0(r,e,t){const n=$(r),s=n.queries.get(e);if(s)for(const i of s.wu)i.onError(t);n.queries.delete(e)}function zd(r){r.Su.forEach(e=>{e.next()})}var th;(function(r){r.Default="default",r.Cache="cache"})(th||(th={}));class Wd{constructor(e,t,n){this.query=e,this.Cu=t,this.Fu=!1,this.Ou=null,this.onlineState="Unknown",this.options=n||{}}xu(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new Gi(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Fu?this.Mu(e)&&(this.Cu.next(e),t=!0):this.Nu(e,this.onlineState)&&(this.Lu(e),t=!0),this.Ou=e,t}onError(e){this.Cu.error(e)}Du(e){this.onlineState=e;let t=!1;return this.Ou&&!this.Fu&&this.Nu(this.Ou,e)&&(this.Lu(this.Ou),t=!0),t}Nu(e,t){if(!e.fromCache||!this.vu())return!0;const n=t!=="Offline";return(!this.options.waitForSyncWhenOnline||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Mu(e){if(e.docChanges.length>0)return!0;const t=this.Ou&&this.Ou.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}Lu(e){e=Gi.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Fu=!0,this.Cu.next(e)}vu(){return this.options.source!==th.Cache}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bg{constructor(e){this.serializer=e}Qo(e){return bn(this.serializer,e)}Go(e){return e.metadata.exists?mE(this.serializer,e.document,!1):Fe.newNoDocument(this.Qo(e.metadata.name),this.zo(e.metadata.readTime))}zo(e){return Je(e)}}class f0{constructor(e,t){this.Bu=e,this.serializer=t,this.Uu=[],this.ku=[],this.collectionGroups=new Set,this.progress=YI(e)}get queries(){return this.Uu}get documents(){return this.ku}qu(e){this.progress.bytesLoaded+=e.byteLength;let t=this.progress.documentsLoaded;if(e.jo.namedQuery)this.Uu.push(e.jo.namedQuery);else if(e.jo.documentMetadata){this.ku.push({metadata:e.jo.documentMetadata}),e.jo.documentMetadata.exists||++t;const n=ce.fromString(e.jo.documentMetadata.name);this.collectionGroups.add(n.get(n.length-2))}else e.jo.document&&(this.ku[this.ku.length-1].document=e.jo.document,++t);return t!==this.progress.documentsLoaded?(this.progress.documentsLoaded=t,{...this.progress}):null}$u(e){const t=new Map,n=new bg(this.serializer);for(const s of e)if(s.metadata.queries){const i=n.Qo(s.metadata.name);for(const o of s.metadata.queries){const a=(t.get(o)||ae()).add(i);t.set(o,a)}}return t}async Ku(e){const t=await KO(e,new bg(this.serializer),this.ku,this.Bu.id),n=this.$u(this.documents);for(const s of this.Uu)await zO(e,s,n.get(s.name));return this.progress.taskState="Success",{progress:this.progress,Wu:this.collectionGroups,Qu:t}}}function YI(r){return{taskState:"Running",documentsLoaded:0,bytesLoaded:0,totalDocuments:r.totalDocuments,totalBytes:r.totalBytes}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class XI{constructor(e){this.key=e}}class ZI{constructor(e){this.key=e}}class ey{constructor(e,t){this.query=e,this.Gu=t,this.zu=null,this.hasCachedResults=!1,this.current=!1,this.ju=ae(),this.mutatedKeys=ae(),this.Hu=Ue(e)?$B(e):Zh(e),this.Ju=new Ts(this.Hu)}get Yu(){return this.Gu}Zu(e,t){const n=t?t.Xu:new vg,s=t?t.Ju:this.Ju;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,a=!1;const[c,l]=this.ec(this.query,s);e.inorderTraversal((d,p)=>{const g=s.get(d),w=bI(this.query,p)?p:null,N=!!g&&this.mutatedKeys.has(g.key),M=!!w&&(w.hasLocalMutations||this.mutatedKeys.has(w.key)&&w.hasCommittedMutations);let W=!1;g&&w?g.data.isEqual(w.data)?N!==M&&(n.track({type:3,doc:w}),W=!0):this.tc(g,w)||(n.track({type:2,doc:w}),W=!0,(c&&this.Hu(w,c)>0||l&&this.Hu(w,l)<0)&&(a=!0)):!g&&w?(n.track({type:0,doc:w}),W=!0):g&&!w&&(n.track({type:1,doc:g}),W=!0,(c||l)&&(a=!0)),W&&(w?(o=o.add(w),i=M?i.add(d):i.delete(d)):(o=o.delete(d),i=i.delete(d)))});const B=this.nc(this.query);if(B)if(Ue(this.query)){const d=[];o.forEach(w=>d.push(w));const p=RI(this.query,d);let g=new Ts($B(this.query));for(const w of p)g=g.add(w);o.forEach(w=>{g.has(w.key)||(i=i.delete(w.key),n.track({type:1,doc:w}))}),o=g}else{const d=this.rc(this.query);for(;o.size>B;){const p=d==="F"?o.last():o.first();o=o.delete(p.key),i=i.delete(p.key),n.track({type:1,doc:p})}}return{Ju:o,Xu:n,Fo:a,mutatedKeys:i}}nc(e){var t;return Ue(e)?(t=oB(e))==null?void 0:t.limit:e.limit||void 0}rc(e){if(Ue(e)){const t=oB(e);return t&&t.limit<0?"L":"F"}return e.limitType}ec(e,t){var n;if(Ue(e)){const s=(n=oB(e))==null?void 0:n.limit;return[t.size===s?t.last():null,null]}return[e.limitType==="F"&&t.size===this.nc(this.query)?t.last():null,e.limitType==="L"&&t.size===this.nc(this.query)?t.first():null]}tc(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.Ju;this.Ju=e.Ju,this.mutatedKeys=e.mutatedKeys;const o=e.Xu.gu();o.sort((B,d)=>function(g,w){const N=M=>{switch(M){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return Y(20277,{ye:M})}};return N(g)-N(w)}(B.type,d.type)||this.Hu(B.doc,d.doc)),this.sc(n),s=s??!1;const a=t&&!s?this._c():[],c=this.ju.size===0&&this.current&&!s?1:0,l=c!==this.zu;return this.zu=c,o.length!==0||l?{snapshot:new Gi(this.query,e.Ju,i,o,e.mutatedKeys,c===0,l,!1,!!n&&n.resumeToken.approximateByteSize()>0),oc:a}:{oc:a}}Du(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Ju:this.Ju,Xu:new vg,mutatedKeys:this.mutatedKeys,Fo:!1},!1)):{oc:[]}}ac(e){return!this.Gu.has(e)&&!!this.Ju.has(e)&&!this.Ju.get(e).hasLocalMutations}sc(e){e&&(e.addedDocuments.forEach(t=>this.Gu=this.Gu.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.Gu=this.Gu.delete(t)),this.current=e.current)}_c(){if(!this.current)return[];const e=this.ju;this.ju=ae(),this.Ju.forEach(n=>{this.ac(n.key)&&(this.ju=this.ju.add(n.key))});const t=[];return e.forEach(n=>{this.ju.has(n)||t.push(new ZI(n))}),this.ju.forEach(n=>{e.has(n)||t.push(new XI(n))}),t}uc(e){this.Gu=e.Wo,this.ju=ae();const t=this.Zu(e.documents);return this.applyChanges(t,!0)}cc(){return Gi.fromInitialDocuments(this.query,this.Ju,this.mutatedKeys,this.zu===0,this.hasCachedResults)}}const $r="SyncEngine";class p0{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class C0{constructor(e){this.key=e,this.lc=!1}}class g0{constructor(e,t,n,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.Ec={},this.hc=new nr(a=>lI(a),el),this.Tc=new Map,this.Pc=new Set,this.Rc=new Re(z.comparator),this.Ic=new Map,this.Ac=new Fd,this.Vc={},this.dc=new Map,this.fc=Yn.ws(),this.onlineState="Unknown",this.mc=void 0}get isPrimaryClient(){return this.mc===!0}}async function m0(r,e,t=!0){const n=Bl(r);let s;const i=n.hc.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.cc()):s=await ty(n,e,t,!0),s}async function _0(r,e){const t=Bl(r);await ty(t,e,!0,!1)}async function ty(r,e,t,n){const s=await Vi(r.localStore,Ue(e)?e:Pt(e)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,t);let a;return n&&(a=await Qd(r,e,i,o==="current",s.resumeToken)),r.isPrimaryClient&&t&&ul(r.remoteStore,s),a}async function Qd(r,e,t,n,s){r.gc=(d,p,g)=>async function(N,M,W,te){let ie=M.view.Zu(W);ie.Fo&&(ie=await Tu(N.localStore,M.query,!1).then(({documents:T})=>M.view.Zu(T,ie)));const Ee=te&&te.targetChanges.get(M.targetId),de=te&&te.targetMismatches.get(M.targetId)!=null,le=M.view.applyChanges(ie,N.isPrimaryClient,Ee,de);return nh(N,M.targetId,le.oc),le.snapshot}(r,d,p,g);const i=await Tu(r.localStore,e,!0),o=new ey(e,i.Wo),a=o.Zu(i.documents),c=Qa.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),l=o.applyChanges(a,r.isPrimaryClient,c);nh(r,t,l.oc);const B=new p0(e,t,o);return r.hc.set(e,B),r.Tc.has(t)?r.Tc.get(t).push(e):r.Tc.set(t,[e]),l.snapshot}async function E0(r,e,t){const n=$(r),s=n.hc.get(e),i=n.Tc.get(s.targetId);if(i.length>1)return n.Tc.set(s.targetId,i.filter(o=>!el(o,e))),void n.hc.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await xi(n.localStore,s.targetId,!1).then(()=>{n.sharedClientState.clearQueryState(s.targetId),t&&Mi(n.remoteStore,s.targetId),Ui(n,s.targetId)}).catch(zr)):(Ui(n,s.targetId),await xi(n.localStore,s.targetId,!0))}async function I0(r,e){const t=$(r),n=t.hc.get(e),s=t.Tc.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),Mi(t.remoteStore,n.targetId))}async function y0(r,e,t){const n=Zd(r);try{const s=await function(o,a){const c=$(o),l=Ie.now(),B=a.reduce((g,w)=>g.add(w.key),ae());let d,p;return c.persistence.runTransaction("Locally write mutations","readwrite",g=>{let w=$e(),N=ae();return c.Uo.getEntries(g,B).next(M=>{w=M,w.forEach((W,te)=>{te.isValidDocument()||(N=N.add(W))})}).next(()=>c.localDocuments.getOverlayedDocuments(g,w)).next(M=>{d=M;const W=[];for(const te of a){const ie=eP(te,d.get(te.key).overlayedDocument);ie!=null&&W.push(new er(te.key,ie,U_(ie.value.mapValue),Ve.exists(!0)))}return c.mutationQueue.addMutationBatch(g,l,W,a)}).next(M=>{p=M;const W=M.applyToLocalDocumentSet(d,N);return c.documentOverlayCache.saveOverlays(g,M.batchId,W)})}).then(()=>({batchId:p.batchId,changes:cE(d)}))}(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),function(o,a,c){let l=o.Vc[o.currentUser.toKey()];l||(l=new Re(oe)),l=l.insert(a,c),o.Vc[o.currentUser.toKey()]=l}(n,s.batchId,t),await rr(n,s.changes),await no(n.remoteStore)}catch(s){const i=so(s,"Failed to persist write");t.reject(i)}}async function ny(r,e){const t=$(r);try{const n=await jO(t.localStore,e);e.targetChanges.forEach((s,i)=>{const o=t.Ic.get(i);o&&(q(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.lc=!0:s.modifiedDocuments.size>0?q(o.lc,14607):s.removedDocuments.size>0&&(q(o.lc,42227),o.lc=!1))}),await rr(t,n,e)}catch(n){await zr(n)}}function Pg(r,e,t){const n=$(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.hc.forEach((i,o)=>{const a=o.view.Du(e);a.snapshot&&s.push(a.snapshot)}),function(o,a){const c=$(o);c.onlineState=a;let l=!1;c.queries.forEach((B,d)=>{for(const p of d.wu)p.Du(a)&&(l=!0)}),l&&zd(c)}(n.eventManager,e),s.length&&n.Ec.hn(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function w0(r,e,t){const n=$(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Ic.get(e),i=s&&s.key;if(i){let o=new Re(z.comparator);o=o.insert(i,Fe.newNoDocument(i,Z.min()));const a=ae().add(i),c=new Xi(Z.min(),new Map,new Re(oe),o,$e(),a);await ny(n,c),n.Rc=n.Rc.remove(i),n.Ic.delete(e),Xd(n)}else await xi(n.localStore,e,!1).then(()=>Ui(n,e,t)).catch(zr)}async function D0(r,e){const t=$(r),n=e.batch.batchId;try{const s=await qO(t.localStore,e);Yd(t,n,null),$d(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await rr(t,s)}catch(s){await zr(s)}}async function T0(r,e,t){const n=$(r);try{const s=await function(o,a){const c=$(o);return c.persistence.runTransaction("Reject batch","readwrite-primary",l=>{let B;return c.mutationQueue.lookupMutationBatch(l,a).next(d=>(q(d!==null,37113),B=d.keys(),c.mutationQueue.removeMutationBatch(l,d))).next(()=>c.mutationQueue.performConsistencyCheck(l)).next(()=>c.documentOverlayCache.removeOverlaysForBatchId(l,B,a)).next(()=>c.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(l,B)).next(()=>c.localDocuments.getDocuments(l,B))})}(n.localStore,e);Yd(n,e,t),$d(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await rr(n,s)}catch(s){await zr(s)}}async function A0(r,e){const t=$(r);Qr(t.remoteStore)||U($r,"The network is disabled. The task returned by 'awaitPendingWrites()' will not complete until the network is enabled.");try{const n=await function(o){const a=$(o);return a.persistence.runTransaction("Get highest unacknowledged batch id","readonly",c=>a.mutationQueue.getHighestUnacknowledgedBatchId(c))}(t.localStore);if(n===vr)return void e.resolve();const s=t.dc.get(n)||[];s.push(e),t.dc.set(n,s)}catch(n){const s=so(n,"Initialization of waitForPendingWrites() operation failed");e.reject(s)}}function $d(r,e){(r.dc.get(e)||[]).forEach(t=>{t.resolve()}),r.dc.delete(e)}function Yd(r,e,t){const n=$(r);let s=n.Vc[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.Vc[n.currentUser.toKey()]=s}}function Ui(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Tc.get(e))r.hc.delete(n),t&&r.Ec.yc(n,t);r.Tc.delete(e),r.isPrimaryClient&&r.Ac.Xs(e).forEach(n=>{r.Ac.containsKey(n)||ry(r,n)})}function ry(r,e){r.Pc.delete(e.path.canonicalString());const t=r.Rc.get(e);t!==null&&(Mi(r.remoteStore,t),r.Rc=r.Rc.remove(e),r.Ic.delete(t),Xd(r))}function nh(r,e,t){for(const n of t)n instanceof XI?(r.Ac.addReference(n.key,e),v0(r,n)):n instanceof ZI?(U($r,"Document no longer in limbo: "+n.key),r.Ac.removeReference(n.key,e),r.Ac.containsKey(n.key)||ry(r,n.key)):Y(19791,{wc:n})}function v0(r,e){const t=e.key,n=t.path.canonicalString();r.Rc.get(t)||r.Pc.has(n)||(U($r,"New document in limbo: "+t),r.Pc.add(n),Xd(r))}function Xd(r){for(;r.Pc.size>0&&r.Rc.size<r.maxConcurrentLimboResolutions;){const e=r.Pc.values().next().value;r.Pc.delete(e);const t=new z(ce.fromString(e)),n=r.fc.next();r.Ic.set(n,new C0(t)),r.Rc=r.Rc.insert(t,n),ul(r.remoteStore,new An(Pt(Yi(t.path)),n,"TargetPurposeLimboResolution",xt.yn))}}async function rr(r,e,t){const n=$(r),s=[],i=[],o=[];n.hc.isEmpty()||(n.hc.forEach((a,c)=>{o.push(n.gc(c,e,t).then(l=>{var B;if((l||t)&&n.isPrimaryClient){const d=l?!l.fromCache:(B=t==null?void 0:t.targetChanges.get(c.targetId))==null?void 0:B.current;n.sharedClientState.updateQueryState(c.targetId,d?"current":"not-current")}if(l){s.push(l);const d=xd.fo(c.targetId,l);i.push(d)}}))}),await Promise.all(o),n.Ec.hn(s),await async function(c,l){const B=$(c);try{await B.persistence.runTransaction("notifyLocalViewChanges","readwrite",d=>b.forEach(l,p=>b.forEach(p.Ao,g=>B.persistence.referenceDelegate.addReference(d,p.targetId,g)).next(()=>b.forEach(p.Vo,g=>B.persistence.referenceDelegate.removeReference(d,p.targetId,g)))))}catch(d){if(!Wr(d))throw d;U(Md,"Failed to update sequence numbers: "+d)}for(const d of l){const p=d.targetId;if(!d.fromCache){const g=B.No.get(p),w=g.snapshotVersion,N=g.withLastLimboFreeSnapshotVersion(w);B.No=B.No.insert(p,N)}}}(n.localStore,i))}async function R0(r,e){const t=$(r);if(!t.currentUser.isEqual(e)){U($r,"User change. New user:",e.toKey());const n=await kI(t.localStore,e);t.currentUser=e,function(i,o){i.dc.forEach(a=>{a.forEach(c=>{c.reject(new x(O.CANCELLED,o))})}),i.dc.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await rr(t,n.qo)}}function b0(r,e){const t=$(r),n=t.Ic.get(e);if(n&&n.lc)return ae().add(n.key);{let s=ae();const i=t.Tc.get(e);if(!i)return s;for(const o of i??[]){const a=t.hc.get(o);s=s.unionWith(a.view.Yu)}return s}}async function P0(r,e){const t=$(r),n=await Tu(t.localStore,e.query,!0),s=e.view.uc(n);return t.isPrimaryClient&&nh(t,e.targetId,s.oc),s}async function S0(r,e){const t=$(r);return YB(t.localStore,e).then(n=>rr(t,n))}async function N0(r,e,t,n){const s=$(r),i=await function(a,c){const l=$(a),B=$(l.mutationQueue);return l.persistence.runTransaction("Lookup mutation documents","readonly",d=>B.Wr(d,c).next(p=>p?l.localDocuments.getDocuments(d,p):b.resolve(null)))}(s.localStore,e);i!==null?(t==="pending"?await no(s.remoteStore):t==="acknowledged"||t==="rejected"?(Yd(s,e,n||null),$d(s,e),function(a,c){$($(a).mutationQueue).jr(c)}(s.localStore,e)):Y(6720,"Unknown batchState",{bc:t}),await rr(s,i)):U($r,"Cannot apply mutation batch with id: "+e)}async function O0(r,e){const t=$(r);if(Bl(t),Zd(t),e===!0&&t.mc!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),s=await Sg(t,n.toArray());t.mc=!0,await ZB(t.remoteStore,!0);for(const i of s)ul(t.remoteStore,i)}else if(e===!1&&t.mc!==!1){const n=[];let s=Promise.resolve();t.Tc.forEach((i,o)=>{t.sharedClientState.isLocalQueryTarget(o)?n.push(o):s=s.then(()=>(Ui(t,o),xi(t.localStore,o,!0))),Mi(t.remoteStore,o)}),await s,await Sg(t,n),function(o){const a=$(o);a.Ic.forEach((c,l)=>{Mi(a.remoteStore,l)}),a.Ac.e_(),a.Ic=new Map,a.Rc=new Re(z.comparator)}(t),t.mc=!1,await ZB(t.remoteStore,!1)}}async function Sg(r,e,t){const n=$(r),s=[],i=[];for(const o of e){let a;const c=n.Tc.get(o);if(c&&c.length!==0){a=await Vi(n.localStore,Ue(c[0])?c[0]:Pt(c[0]));for(const l of c){const B=n.hc.get(l),d=await P0(n,B);d.snapshot&&i.push(d.snapshot)}}else{const l=await MI(n.localStore,o);a=await Vi(n.localStore,l),await Qd(n,sy(l),o,!1,a.resumeToken)}s.push(a)}return n.Ec.hn(i),s}function sy(r){return Mn(r)?r:rE(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function F0(r){return function(t){return $($(t).persistence).Ro()}($(r).localStore)}async function L0(r,e,t,n){const s=$(r);if(s.mc)return void U($r,"Ignoring unexpected query state notification.");const i=s.Tc.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{let o;if(Ue(i[0]))switch(qn(i[0])){case"collection_group":case"collection":o=await YB(s.localStore,cI(i[0]));break;case"documents":o=await function(l,B){const d=$(l),p=ae(...gu(B).map(g=>z.fromPath(g)));return d.persistence.runTransaction("Get documents for pipeline","readonly",g=>d.Uo.getEntries(g,p)).then(g=>g)}(s.localStore,i[0]);break;default:Et(""),o=as()}else o=await YB(s.localStore,function(l){return l.collectionGroup||(l.path.length%2==1?l.path.lastSegment():l.path.get(l.path.length-2))}(i[0]));const a=Xi.createSynthesizedRemoteEventForCurrentChange(e,t==="current",Le.EMPTY_BYTE_STRING);await rr(s,o,a);break}case"rejected":await xi(s.localStore,e,!0),Ui(s,e,n);break;default:Y(64155,t)}}async function k0(r,e,t){const n=Bl(r);if(n.mc){for(const s of e){if(n.Tc.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){U($r,"Adding an already active target "+s);continue}const i=await MI(n.localStore,s),o=await Vi(n.localStore,i);await Qd(n,sy(i),o.targetId,!1,o.resumeToken),ul(n.remoteStore,o)}for(const s of t)n.Tc.has(s)&&await xi(n.localStore,s,!1).then(()=>{Mi(n.remoteStore,s),Ui(n,s)}).catch(zr)}}function Bl(r){const e=$(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=ny.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=b0.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=w0.bind(null,e),e.Ec.hn=h0.bind(null,e.eventManager),e.Ec.yc=d0.bind(null,e.eventManager),e}function Zd(r){const e=$(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=D0.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=T0.bind(null,e),e}function V0(r,e,t){const n=$(r);(async function(i,o,a){try{const c=await o.getMetadata();if(await function(g,w){const N=$(g),M=Je(w.createTime);return N.persistence.runTransaction("hasNewerBundle","readonly",W=>N.d_.getBundleMetadata(W,w.id)).then(W=>!!W&&W.createTime.compareTo(M)>=0)}(i.localStore,c))return await o.close(),a._completeWith(function(g){return{taskState:"Success",documentsLoaded:g.totalDocuments,bytesLoaded:g.totalBytes,totalDocuments:g.totalDocuments,totalBytes:g.totalBytes}}(c)),Promise.resolve(new Set);a._updateProgress(YI(c));const l=new f0(c,o.serializer);let B=await o.ma();for(;B;){const p=await l.qu(B);p&&a._updateProgress(p),B=await o.ma()}const d=await l.Ku(i.localStore);return await rr(i,d.Qu,void 0),await function(g,w){const N=$(g);return N.persistence.runTransaction("Save bundle","readwrite",M=>N.d_.saveBundleMetadata(M,w))}(i.localStore,c),a._completeWith(d.progress),Promise.resolve(d.Wu)}catch(c){return Et($r,`Loading bundle failed with ${c}`),a._failWith(c),Promise.resolve(new Set)}})(n,e,t).then(s=>{n.sharedClientState.notifyBundleLoaded(s)})}class Ra{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=$a(e.databaseInfo.databaseId),this.sharedClientState=this.vc(e),this.persistence=this.Sc(e),await this.persistence.start(),this.localStore=this.Dc(e),this.gcScheduler=this.xc(e,this.localStore),this.indexBackfillerScheduler=this.Cc(e,this.localStore)}xc(e,t){return null}Cc(e,t){return null}Dc(e){return LI(this.persistence,new FI,e.initialUser,this.serializer)}Sc(e){return new Ld(cl.w_,this.serializer)}vc(e){return new QI}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Ra.provider={build:()=>new Ra};class x0 extends Ra{constructor(e){super(),this.cacheSizeBytes=e}xc(e,t){q(this.persistence.referenceDelegate instanceof Du,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new LE(n,e.asyncQueue,t)}Sc(e){const t=this.cacheSizeBytes!==void 0?Ct.withCacheSize(this.cacheSizeBytes):Ct.DEFAULT;return new Ld(n=>Du.w_(n,t),this.serializer)}}class iy extends Ra{constructor(e,t,n){super(),this.Fc=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.Fc.initialize(this,e),await Zd(this.Fc.syncEngine),await no(this.Fc.remoteStore),await this.persistence.X_(()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve()))}Dc(e){return LI(this.persistence,new FI,e.initialUser,this.serializer)}xc(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new LE(n,e.asyncQueue,t)}Cc(e,t){const n=new u0(t,this.persistence);return new c0(e.asyncQueue,n)}Sc(e){const t=Vd(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?Ct.withCacheSize(this.cacheSizeBytes):Ct.DEFAULT;return new kd(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,$I(),Xc(),this.serializer,this.sharedClientState,!!this.forceOwnership)}vc(e){return new QI}}class M0 extends iy{constructor(e,t){super(e,t,!1),this.Fc=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.Fc.syncEngine;this.sharedClientState instanceof BB&&(this.sharedClientState.syncEngine={Iu:N0.bind(null,t),Au:L0.bind(null,t),Vu:k0.bind(null,t),Ro:F0.bind(null,t),Ru:S0.bind(null,t)},await this.sharedClientState.start()),await this.persistence.X_(async n=>{await O0(this.Fc.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())})}vc(e){const t=$I();if(!BB.Je(t))throw new x(O.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=Vd(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new BB(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class ba{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>Pg(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=R0.bind(null,this.syncEngine),await ZB(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new B0}()}createDatastore(e){const t=$a(e.databaseInfo.databaseId),n=JP(e.databaseInfo);return $P(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return function(n,s,i,o,a){return new $O(n,s,i,o,a)}(this.localStore,this.datastore,e.asyncQueue,t=>Pg(this.syncEngine,t,0),function(){return JC.Je()?new JC:new UP}())}createSyncEngine(e,t){return function(s,i,o,a,c,l,B){const d=new g0(s,i,o,a,c,l);return B&&(d.mc=!0),d}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(s){const i=$(s);U(kn,"RemoteStore shutting down."),i.ca.add(5),await to(i),i.Ea.shutdown(),i.ha.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}ba.provider={build:()=>new ba};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let G0=class{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new x(O.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await async function(s,i){const o=$(s),a={documents:i.map(d=>Ni(o.serializer,d))},c=await o.st("BatchGetDocuments",o.serializer.databaseId,ce.emptyPath(),a,i.length),l=new Map;c.forEach(d=>{const p=AP(o.serializer,d);l.set(p.key.toString(),p)});const B=[];return i.forEach(d=>{const p=l.get(d.toString());q(!!p,55234,{key:d}),B.push(p)}),B}(this.datastore,e);return t.forEach(n=>this.recordVersion(n)),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(e.toString())}delete(e){this.write(new $i(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach(t=>{e.delete(t.key.toString())}),e.forEach((t,n)=>{const s=z.fromPath(n);this.mutations.push(new zh(s,this.precondition(s)))}),await async function(n,s){const i=$(n),o={writes:s.map(a=>ma(i.serializer,a))};await i.tt("Commit",i.serializer.databaseId,ce.emptyPath(),o)}(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw Y(50498,{Oc:e.constructor.name});t=Z.min()}const n=this.readVersions.get(e.key.toString());if(n){if(!t.isEqual(n))throw new x(O.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(Z.min())?Ve.exists(!1):Ve.updateTime(t):Ve.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(Z.min()))throw new x(O.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return Ve.updateTime(t)}return Ve.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U0{constructor(e,t,n,s,i){this.asyncQueue=e,this.datastore=t,this.options=n,this.updateFunction=s,this.deferred=i,this.Mc=n.maxAttempts,this.jt=new sd(this.asyncQueue,"transaction_retry")}Nc(){this.Mc-=1,this.Lc()}Lc(){this.jt.Ut(async()=>{const e=new G0(this.datastore),t=this.Bc(e);t&&t.then(n=>{this.asyncQueue.enqueueAndForget(()=>e.commit().then(()=>{this.deferred.resolve(n)}).catch(s=>{this.Uc(s)}))}).catch(n=>{this.Uc(n)})})}Bc(e){try{const t=this.updateFunction(e);return!za(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}Uc(e){this.Mc>0&&this.kc(e)?(this.Mc-=1,this.asyncQueue.enqueueAndForget(()=>(this.Lc(),Promise.resolve()))):this.deferred.reject(e)}kc(e){if((e==null?void 0:e.name)==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!iE(t)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qr="FirestoreClient";class H0{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=ot.UNAUTHENTICATED,this.clientId=Uh.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,async o=>{U(qr,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o}),this.appCheckCredentials.start(n,o=>(U(qr,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Bt;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=so(t,"Failed to shutdown persistence");e.reject(n)}}),e.promise}}async function hB(r,e){r.asyncQueue.verifyOperationInProgress(),U(qr,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener(async s=>{n.isEqual(s)||(await kI(e.localStore,s),n=s)}),e.persistence.setDatabaseDeletedListener(()=>r.terminate()),r._offlineComponents=e}async function Ng(r,e){r.asyncQueue.verifyOperationInProgress();const t=await ef(r);U(qr,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener(n=>Dg(e.remoteStore,n)),r.setAppCheckTokenChangeListener((n,s)=>Dg(e.remoteStore,s)),r._onlineComponents=e}async function ef(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){U(qr,"Using user provided OfflineComponentProvider");try{await hB(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(s){return s.name==="FirebaseError"?s.code===O.FAILED_PRECONDITION||s.code===O.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(t))throw t;Et("Error using user provided cache. Falling back to memory cache: "+t),await hB(r,new Ra)}}else U(qr,"Using default OfflineComponentProvider"),await hB(r,new x0(void 0));return r._offlineComponents}async function hl(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(U(qr,"Using user provided OnlineComponentProvider"),await Ng(r,r._uninitializedComponentsProvider._online)):(U(qr,"Using default OnlineComponentProvider"),await Ng(r,new ba))),r._onlineComponents}function oy(r){return ef(r).then(e=>e.persistence)}function tf(r){return ef(r).then(e=>e.localStore)}function ay(r){return hl(r).then(e=>e.remoteStore)}function nf(r){return hl(r).then(e=>e.syncEngine)}function q0(r){return hl(r).then(e=>e.datastore)}async function Hi(r){const e=await hl(r),t=e.eventManager;return t.onListen=m0.bind(null,e.syncEngine),t.onUnlisten=E0.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=_0.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=I0.bind(null,e.syncEngine),t}function j0(r){return r.asyncQueue.enqueue(async()=>{const e=await oy(r),t=await ay(r);return e.setNetworkEnabled(!0),function(s){const i=$(s);return i.ca.delete(0),ic(i)}(t)})}function J0(r){return r.asyncQueue.enqueue(async()=>{const e=await oy(r),t=await ay(r);return e.setNetworkEnabled(!1),async function(s){const i=$(s);i.ca.add(0),await to(i),i.ha.set("Offline")}(t)})}function K0(r,e,t,n){const s=new ll(n),i=new Wd(e,s,t);return r.asyncQueue.enqueueAndForget(async()=>Jd(await Hi(r),i)),()=>{s.Aa(),r.asyncQueue.enqueueAndForget(async()=>Kd(await Hi(r),i))}}function z0(r,e){const t=new Bt;return r.asyncQueue.enqueueAndForget(async()=>async function(s,i,o){try{const a=await function(l,B){const d=$(l);return d.persistence.runTransaction("read document","readonly",p=>d.localDocuments.getDocument(p,B))}(s,i);a.isFoundDocument()?o.resolve(a):a.isNoDocument()?o.resolve(null):o.reject(new x(O.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"))}catch(a){const c=so(a,`Failed to get document '${i} from cache`);o.reject(c)}}(await tf(r),e,t)),t.promise}function cy(r,e,t={}){const n=new Bt;return r.asyncQueue.enqueueAndForget(async()=>function(i,o,a,c,l){const B=new ll({next:p=>{B.Aa(),o.enqueueAndForget(()=>Kd(i,d));const g=p.docs.has(a);!g&&p.fromCache?l.reject(new x(O.UNAVAILABLE,"Failed to get document because the client is offline.")):g&&p.fromCache&&c&&c.source==="server"?l.reject(new x(O.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):l.resolve(p)},error:p=>l.reject(p)}),d=new Wd(Yi(a.path),B,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return Jd(i,d)}(await Hi(r),r.asyncQueue,e,t,n)),n.promise}function W0(r,e){const t=new Bt;return r.asyncQueue.enqueueAndForget(async()=>async function(s,i,o){try{const a=await Tu(s,i,!0),c=new ey(i,a.Wo),l=c.Zu(a.documents),B=c.applyChanges(l,!1);o.resolve(B.snapshot)}catch(a){const c=so(a,`Failed to execute query '${i} against cache`);o.reject(c)}}(await tf(r),e,t)),t.promise}function uy(r,e,t={}){const n=new Bt;return r.asyncQueue.enqueueAndForget(async()=>function(i,o,a,c,l){const B=new ll({next:p=>{B.Aa(),o.enqueueAndForget(()=>Kd(i,d)),p.fromCache&&c.source==="server"?l.reject(new x(O.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):l.resolve(p)},error:p=>l.reject(p)}),d=new Wd(a instanceof $o?GN(a):a,B,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return Jd(i,d)}(await Hi(r),r.asyncQueue,e,t,n)),n.promise}function Q0(r,e){const t=new Bt;return r.asyncQueue.enqueueAndForget(async()=>y0(await nf(r),e,t)),t.promise}function $0(r,e){const t=new ll(e);return r.asyncQueue.enqueueAndForget(async()=>function(s,i){$(s).Su.add(i),i.next()}(await Hi(r),t)),()=>{t.Aa(),r.asyncQueue.enqueueAndForget(async()=>function(s,i){$(s).Su.delete(i)}(await Hi(r),t))}}function Y0(r,e,t){const n=new Bt;return r.asyncQueue.enqueueAndForget(async()=>{const s=await q0(r);new U0(r.asyncQueue,s,t,e,n).Nc()}),n.promise}function X0(r,e,t,n){const s=function(o,a){let c;return c=typeof o=="string"?lE().encode(o):o,function(B,d){return new a0(B,d)}(function(B,d){if(B instanceof Uint8Array)return wg(B,d);if(B instanceof ArrayBuffer)return wg(new Uint8Array(B),d);if(B instanceof ReadableStream)return B.getReader();throw new Error("Source of `toByteStreamReader` has to be a ArrayBuffer or ReadableStream")}(c),a)}(t,$a(e));r.asyncQueue.enqueueAndForget(async()=>{V0(await nf(r),s,n)})}function Z0(r,e){return r.asyncQueue.enqueue(async()=>function(n,s){const i=$(n);return i.persistence.runTransaction("Get named query","readonly",o=>i.d_.getNamedQuery(o,s))}(await tf(r),e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Og="AsyncQueue";class Fg{constructor(e=Promise.resolve()){this.Wc=[],this.Qc=!1,this.Gc=[],this.zc=null,this.jc=!1,this.Hc=!1,this.Jc=[],this.jt=new sd(this,"async_queue_retry"),this.Yc=()=>{const n=Xc();n&&U(Og,"Visibility state changed to "+n.visibilityState),this.jt.qt()},this.Zc=e;const t=Xc();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.Yc)}get isShuttingDown(){return this.Qc}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Xc(),this.el(e)}enterRestrictedMode(e){if(!this.Qc){this.Qc=!0,this.Hc=e||!1;const t=Xc();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.Yc)}}enqueue(e){if(this.Xc(),this.Qc)return new Promise(()=>{});const t=new Bt;return this.el(()=>this.Qc&&this.Hc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Wc.push(e),this.tl()))}async tl(){if(this.Wc.length!==0){try{await this.Wc[0](),this.Wc.shift(),this.jt.reset()}catch(e){if(!Wr(e))throw e;U(Og,"Operation failed with retryable error: "+e)}this.Wc.length>0&&this.jt.Ut(()=>this.tl())}}el(e){const t=this.Zc.then(()=>(this.jc=!0,e().catch(n=>{throw this.zc=n,this.jc=!1,je("INTERNAL UNHANDLED ERROR: ",Lg(n)),n}).then(n=>(this.jc=!1,n))));return this.Zc=t,t}enqueueAfterDelay(e,t,n){this.Xc(),this.Jc.indexOf(e)>-1&&(t=0);const s=qd.createAndSchedule(this,e,t,n,i=>this.nl(i));return this.Gc.push(s),s}Xc(){this.zc&&Y(47125,{rl:Lg(this.zc)})}verifyOperationInProgress(){}async il(){let e;do e=this.Zc,await e;while(e!==this.Zc)}sl(e){for(const t of this.Gc)if(t.timerId===e)return!0;return!1}_l(e){return this.il().then(()=>{this.Gc.sort((t,n)=>t.targetTimeMs-n.targetTimeMs);for(const t of this.Gc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.il()})}ol(e){this.Jc.push(e)}nl(e){const t=this.Gc.indexOf(e);this.Gc.splice(t,1)}}function Lg(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eF{constructor(){this._progressObserver={},this._taskCompletionResolver=new Bt,this._lastProgress={taskState:"Running",totalBytes:0,totalDocuments:0,bytesLoaded:0,documentsLoaded:0}}onProgress(e,t,n){this._progressObserver={next:e,error:t,complete:n}}catch(e){return this._taskCompletionResolver.promise.catch(e)}then(e,t){return this._taskCompletionResolver.promise.then(e,t)}_completeWith(e){this._updateProgress(e),this._progressObserver.complete&&this._progressObserver.complete(),this._taskCompletionResolver.resolve(e)}_failWith(e){this._lastProgress.taskState="Error",this._progressObserver.next&&this._progressObserver.next(this._lastProgress),this._progressObserver.error&&this._progressObserver.error(e),this._taskCompletionResolver.reject(e)}_updateProgress(e){this._lastProgress=e,this._progressObserver.next&&this._progressObserver.next(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tF=-1;class Ke extends Ya{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new Fg,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Fg(e),this._firestoreClient=void 0,await e}}}function wt(r){if(r._terminated)throw new x(O.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||ly(r),r._firestoreClient}function ly(r){var n,s,i,o;const e=r._freezeSettings(),t=XP(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new H0(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&function(c){const l=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(l),_online:l}}(r._componentsProvider))}function nF(r,e){Et("enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const t=r._freezeSettings();return By(r,ba.provider,{build:n=>new iy(n,t.cacheSizeBytes,e==null?void 0:e.forceOwnership)}),Promise.resolve()}async function rF(r){Et("enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const e=r._freezeSettings();By(r,ba.provider,{build:t=>new M0(t,e.cacheSizeBytes)})}function By(r,e,t){if((r=_e(r,Ke))._firestoreClient||r._terminated)throw new x(O.FAILED_PRECONDITION,"Firestore has already been started and persistence can no longer be enabled. You can only enable persistence before calling any other methods on a Firestore object.");if(r._componentsProvider||r._getSettings().localCache)throw new x(O.FAILED_PRECONDITION,"SDK cache is already specified.");r._componentsProvider={_online:e,_offline:t},ly(r)}function sF(r){if(r._initialized&&!r._terminated)throw new x(O.FAILED_PRECONDITION,"Persistence can only be cleared before a Firestore instance is initialized or after it is terminated.");const e=new Bt;return r._queue.enqueueAndForgetEvenWhileRestricted(async()=>{try{await async function(n){if(!Pn.Je())return Promise.resolve();const s=n+OI;await Pn.delete(s)}(Vd(r._databaseId,r._persistenceKey)),e.resolve()}catch(t){e.reject(t)}}),e.promise}function iF(r){return function(t){const n=new Bt;return t.asyncQueue.enqueueAndForget(async()=>A0(await nf(t),n)),n.promise}(wt(r=_e(r,Ke)))}function oF(r){return j0(wt(r=_e(r,Ke)))}function aF(r){return J0(wt(r=_e(r,Ke)))}function cF(r,e){const t=wt(r=_e(r,Ke)),n=new eF;return X0(t,r._databaseId,e,n),n}function uF(r,e){return Z0(wt(r=_e(r,Ke)),e).then(t=>t?new St(r,null,t.query):null)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rf{convertValue(e,t="none"){switch(Ze(e)){case 0:return null;case 1:return e.booleanValue;case 2:return Pe(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Wn(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw Y(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return Kr(e,(s,i)=>{n[s]=this.convertValue(i,t)}),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[Ps].arrayValue)==null?void 0:s.values)==null?void 0:i.map(o=>Pe(o.doubleValue));return new Mt(t)}convertGeoPoint(e){return new ln(Pe(e.latitude),Pe(e.longitude))}convertArray(e,t){return(e.values||[]).map(n=>this.convertValue(n,t))}convertServerTimestamp(e,t){switch(t){case"previous":const n=Ka(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(Ti(e));default:return null}}convertTimestamp(e){const t=zn(e);return new Ie(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=ce.fromString(e);q(TE(n),9688,{name:e});const s=new Fr(n.get(1),n.get(3)),i=new z(n.popFirst(5));return s.isEqual(t)||je(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ks extends rf{constructor(e){super(),this.firestore=e}convertBytes(e){return new mt(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new me(this.firestore,null,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rh(r){return function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1}(r,["next","error","complete"])}const kg="@firebase/firestore",Vg="4.17.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Pa=class{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new me(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new lF(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(Qn("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},lF=class extends Pa{data(){return super.data()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hy(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new x(O.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class sf{}class oc extends sf{}function Cr(r,e,...t){let n=[];e instanceof sf&&n.push(e),n=n.concat(t),function(i){const o=i.filter(c=>c instanceof of).length,a=i.filter(c=>c instanceof dl).length;if(o>1||o>0&&a>0)throw new x(O.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(n);for(const s of n)r=s._apply(r);return r}class dl extends oc{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new dl(e,t,n)}_apply(e){const t=this._parse(e);return fy(e._query,t),new St(e.firestore,e.converter,kB(e._query,t))}_parse(e){const t=Hs(e.firestore);return function(i,o,a,c,l,B,d){let p;if(l.isKeyField()){if(B==="array-contains"||B==="array-contains-any")throw new x(O.INVALID_ARGUMENT,`Invalid Query. You can't perform '${B}' queries on documentId().`);if(B==="in"||B==="not-in"){Mg(d,B);const w=[];for(const N of d)w.push(xg(c,i,N));p={arrayValue:{values:w}}}else p=xg(c,i,d)}else B!=="in"&&B!=="not-in"&&B!=="array-contains-any"||Mg(d,B),p=JE(a,o,d,B==="in"||B==="not-in");return he.create(l,B,p)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function BF(r,e,t){const n=e,s=Qn("where",r);return dl._create(s,n,t)}class of extends sf{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new of(e,t)}_parse(e){const t=this._queryConstraints.map(n=>n._parse(e)).filter(n=>n.getFilters().length>0);return t.length===1?t[0]:we.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(s,i){let o=s;const a=i.getFlattenedFilters();for(const c of a)fy(o,c),o=kB(o,c)}(e._query,t),new St(e.firestore,e.converter,kB(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class af extends oc{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new af(e,t)}_apply(e){const t=function(s,i,o){if(s.startAt!==null)throw new x(O.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new x(O.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new Ca(i,o)}(e._query,this._field,this._direction);return new St(e.firestore,e.converter,BP(e._query,t))}}function hF(r,e="asc"){const t=e,n=Qn("orderBy",r);return af._create(n,t)}class fl extends oc{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new fl(e,t,n)}_apply(e){return new St(e.firestore,e.converter,du(e._query,this._limit,this._limitType))}}function dF(r){return S_("limit",r),fl._create("limit",r,"F")}function fF(r){return S_("limitToLast",r),fl._create("limitToLast",r,"L")}class pl extends oc{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new pl(e,t,n)}_apply(e){const t=dy(e,this.type,this._docOrFields,this._inclusive);return new St(e.firestore,e.converter,hP(e._query,t))}}function pF(...r){return pl._create("startAt",r,!0)}function CF(...r){return pl._create("startAfter",r,!1)}class Cl extends oc{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Cl(e,t,n)}_apply(e){const t=dy(e,this.type,this._docOrFields,this._inclusive);return new St(e.firestore,e.converter,dP(e._query,t))}}function gF(...r){return Cl._create("endBefore",r,!1)}function mF(...r){return Cl._create("endAt",r,!0)}function dy(r,e,t,n){if(t[0]=re(t[0]),t[0]instanceof Pa)return function(i,o,a,c,l){if(!c)throw new x(O.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${a}().`);const B=[];for(const d of mi(i))if(d.field.isKeyField())B.push(Ss(o,c.key));else{const p=c.data.field(d.field);if(Ja(p))throw new x(O.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+d.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(p===null){const g=d.field.canonicalString();throw new x(O.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${g}' (used as the orderBy) does not exist.`)}B.push(p)}return new Vr(B,l)}(r._query,r.firestore._databaseId,e,t[0]._document,n);{const s=Hs(r.firestore);return function(o,a,c,l,B,d){const p=o.explicitOrderBy;if(B.length>p.length)throw new x(O.INVALID_ARGUMENT,`Too many arguments provided to ${l}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const g=[];for(let w=0;w<B.length;w++){const N=B[w];if(p[w].field.isKeyField()){if(typeof N!="string")throw new x(O.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${l}(), but got a ${typeof N}`);if(!Xh(o)&&N.indexOf("/")!==-1)throw new x(O.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${l}() must be a plain document ID, but '${N}' contains a slash.`);const M=o.path.child(ce.fromString(N));if(!z.isDocumentKey(M))throw new x(O.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${l}() must result in a valid document path, but '${M}' is not because it contains an odd number of segments.`);const W=new z(M);g.push(Ss(a,W))}else{const M=JE(c,l,N);g.push(M)}}return new Vr(g,d)}(r._query,r.firestore._databaseId,s,e,t,n)}}function xg(r,e,t){if(typeof(t=re(t))=="string"){if(t==="")throw new x(O.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Xh(e)&&t.indexOf("/")!==-1)throw new x(O.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(ce.fromString(t));if(!z.isDocumentKey(n))throw new x(O.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Ss(r,new z(n))}if(t instanceof me)return Ss(r,t._key);throw new x(O.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Hu(t)}.`)}function Mg(r,e){if(!Array.isArray(r)||r.length===0)throw new x(O.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function fy(r,e){const t=function(s,i){for(const o of s)for(const a of o.getFlattenedFilters())if(i.indexOf(a.op)>=0)return a.op;return null}(r.filters,function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new x(O.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new x(O.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}function gl(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}class _F extends rf{constructor(e){super(),this.firestore=e}convertBytes(e){return new mt(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new me(this.firestore,null,t)}}class gs{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}let nn=class py extends Pa{constructor(e,t,n,s,i,o){super(e,t,n,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new na(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(Qn("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new x(O.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=py._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}};nn._jsonSchemaVersion="firestore/documentSnapshot/1.0",nn._jsonSchema={type:Ye("string",nn._jsonSchemaVersion),bundleSource:Ye("string","DocumentSnapshot"),bundleName:Ye("string"),bundle:Ye("string")};let na=class extends nn{data(e={}){return super.data(e)}},Bn=class Cy{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new gs(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(n=>{e.call(t,new na(this._firestore,this._userDataWriter,n.key,n,new gs(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new x(O.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map(a=>{Ue(s._snapshot.query)?$B(s._snapshot.query):Zh(s.query._query);const c=new na(s._firestore,s._userDataWriter,a.doc.key,a.doc,new gs(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);return a.doc,{type:"added",doc:c,oldIndex:-1,newIndex:o++}})}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(a=>i||a.type!==3).map(a=>{const c=new na(s._firestore,s._userDataWriter,a.doc.key,a.doc,new gs(s._snapshot.mutatedKeys.has(a.doc.key),s._snapshot.fromCache),s.query.converter);let l=-1,B=-1;return a.type!==0&&(l=o.indexOf(a.doc.key),o=o.delete(a.doc.key)),a.type!==1&&(o=o.add(a.doc),B=o.indexOf(a.doc.key)),{type:EF(a.type),doc:c,oldIndex:l,newIndex:B}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new x(O.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Cy._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Uh.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach(i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}};function EF(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return Y(61501,{type:r})}}function gy(r,e){return r instanceof nn&&e instanceof nn?r._firestore===e._firestore&&r._key.isEqual(e._key)&&(r._document===null?e._document===null:r._document.isEqual(e._document))&&r._converter===e._converter:r instanceof Bn&&e instanceof Bn&&r._firestore===e._firestore&&UE(r.query,e.query)&&r.metadata.isEqual(e.metadata)&&r._snapshot.isEqual(e._snapshot)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Bn._jsonSchemaVersion="firestore/querySnapshot/1.0",Bn._jsonSchema={type:Ye("string",Bn._jsonSchemaVersion),bundleSource:Ye("string","QuerySnapshot"),bundleName:Ye("string"),bundle:Ye("string")};const IF={maxAttempts:5};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let yF=class{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=Hs(e)}set(e,t,n){this._verifyNotCommitted();const s=yr(e,this._firestore),i=gl(s.converter,t,n),o=$u(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,Ve.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=yr(e,this._firestore);let o;return o=typeof(t=re(t))=="string"||t instanceof xr?Bd(this._dataReader,"WriteBatch.update",i._key,t,n,s):ld(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,Ve.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=yr(e,this._firestore);return this._mutations=this._mutations.concat(new $i(t._key,Ve.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new x(O.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}};function yr(r,e){if((r=re(r)).firestore!==e)throw new x(O.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let wF=class{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=Hs(e)}get(e){const t=yr(e,this._firestore),n=new _F(this._firestore);return this._transaction.lookup([t._key]).then(s=>{if(!s||s.length!==1)return Y(24041);const i=s[0];if(i.isFoundDocument())return new Pa(this._firestore,n,i.key,i,t.converter);if(i.isNoDocument())return new Pa(this._firestore,n,t._key,null,t.converter);throw Y(18433,{doc:i})})}set(e,t,n){const s=yr(e,this._firestore),i=gl(s.converter,t,n),o=$u(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,n);return this._transaction.set(s._key,o),this}update(e,t,n,...s){const i=yr(e,this._firestore);let o;return o=typeof(t=re(t))=="string"||t instanceof xr?Bd(this._dataReader,"Transaction.update",i._key,t,n,s):ld(this._dataReader,"Transaction.update",i._key,t),this._transaction.update(i._key,o),this}delete(e){const t=yr(e,this._firestore);return this._transaction.delete(t._key),this}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let DF=class extends wF{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=yr(e,this._firestore),n=new Ks(this._firestore);return super.get(e).then(s=>new nn(this._firestore,n,t._key,s._document,new gs(!1,!1),t.converter))}};function TF(r,e,t){r=_e(r,Ke);const n={...IF,...t};(function(o){if(o.maxAttempts<1)throw new x(O.INVALID_ARGUMENT,"Max attempts must be at least 1")})(n);const s=wt(r);return Y0(s,i=>e(new DF(r,i)),n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function AF(r){r=_e(r,me);const e=_e(r.firestore,Ke),t=wt(e);return cy(t,r._key).then(n=>cf(e,r,n))}function vF(r){r=_e(r,me);const e=_e(r.firestore,Ke),t=wt(e),n=new Ks(e);return z0(t,r._key).then(s=>new nn(e,n,r._key,s,new gs(s!==null&&s.hasLocalMutations,!0),r.converter))}function RF(r){r=_e(r,me);const e=_e(r.firestore,Ke),t=wt(e);return cy(t,r._key,{source:"server"}).then(n=>cf(e,r,n))}function bF(r){r=_e(r,St);const e=_e(r.firestore,Ke),t=wt(e),n=new Ks(e);return hy(r._query),uy(t,r._query).then(s=>new Bn(e,n,r,s))}function PF(r){r=_e(r,St);const e=_e(r.firestore,Ke),t=wt(e),n=new Ks(e);return W0(t,r._query).then(s=>new Bn(e,n,r,s))}function SF(r){r=_e(r,St);const e=_e(r.firestore,Ke),t=wt(e),n=new Ks(e);return uy(t,r._query,{source:"server"}).then(s=>new Bn(e,n,r,s))}function Gg(r,e,t){r=_e(r,me);const n=_e(r.firestore,Ke),s=gl(r.converter,e,t),i=Hs(n);return ac(n,[$u(i,"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,Ve.none())])}function Ug(r,e,t,...n){r=_e(r,me);const s=_e(r.firestore,Ke),i=Hs(s);let o;return o=typeof(e=re(e))=="string"||e instanceof xr?Bd(i,"updateDoc",r._key,e,t,n):ld(i,"updateDoc",r._key,e),ac(s,[o.toMutation(r._key,Ve.exists(!0))])}function NF(r){return ac(_e(r.firestore,Ke),[new $i(r._key,Ve.none())])}function OF(r,e){const t=_e(r.firestore,Ke),n=fu(r),s=gl(r.converter,e),i=Hs(r.firestore);return ac(t,[$u(i,"addDoc",n._key,s,r.converter!==null,{}).toMutation(n._key,Ve.exists(!1))]).then(()=>n)}function my(r,...e){var l,B,d;r=re(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||rh(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(rh(e[n])){const p=e[n];e[n]=(l=p.next)==null?void 0:l.bind(p),e[n+1]=(B=p.error)==null?void 0:B.bind(p),e[n+2]=(d=p.complete)==null?void 0:d.bind(p)}let i,o,a;if(r instanceof me)o=_e(r.firestore,Ke),a=Yi(r._key.path),i={next:p=>{e[n]&&e[n](cf(o,r,p))},error:e[n+1],complete:e[n+2]};else{const p=_e(r,St);o=_e(p.firestore,Ke),a=p._query;const g=new Ks(o);i={next:w=>{e[n]&&e[n](new Bn(o,g,p,w))},error:e[n+1],complete:e[n+2]},hy(r._query)}const c=wt(o);return K0(c,a,s,i)}function FF(r,e){r=_e(r,Ke);const t=wt(r),n=rh(e)?e:{next:e};return $0(t,n)}function ac(r,e){const t=wt(r);return Q0(t,e)}function cf(r,e,t){const n=t.docs.get(e._key),s=new Ks(r);return new nn(r,s,e._key,n,new gs(t.hasPendingWrites,t.fromCache),e.converter)}(function(e,t=!0){Fb(jr),Nr(new Nn("firestore",(n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),a=new Ke(new VP(n.getProvider("auth-internal")),new GP(o,n.getProvider("app-check-internal")),Jb(o,s),o);return i={useFetchStreams:t,...i},a._setSettings(i),a},"PUBLIC").setMultipleInstances(!0)),un(kg,Vg,e),un(kg,Vg,"esm2020")})();const LF="@firebase/firestore-compat",kF="0.4.12";/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uf(r,e){if(e===void 0)return{merge:!1};if(e.mergeFields!==void 0&&e.merge!==void 0)throw new x("invalid-argument",`Invalid options passed to function ${r}(): You cannot specify both "merge" and "mergeFields".`);return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hg(){if(typeof Uint8Array>"u")throw new x("unimplemented","Uint8Arrays are not available in this environment.")}function qg(){if(!Hb())throw new x("unimplemented","Blobs are unavailable in Firestore in this environment.")}class Sa{constructor(e){this._delegate=e}static fromBase64String(e){return qg(),new Sa(mt.fromBase64String(e))}static fromUint8Array(e){return Hg(),new Sa(mt.fromUint8Array(e))}toBase64(){return qg(),this._delegate.toBase64()}toUint8Array(){return Hg(),this._delegate.toUint8Array()}isEqual(e){return this._delegate.isEqual(e._delegate)}toString(){return"Blob(base64: "+this.toBase64()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sh(r){return VF(r,["next","error","complete"])}function VF(r,e){if(typeof r!="object"||r===null)return!1;const t=r;for(const n of e)if(n in t&&typeof t[n]=="function")return!0;return!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xF{enableIndexedDbPersistence(e,t){return nF(e._delegate,{forceOwnership:t})}enableMultiTabIndexedDbPersistence(e){return rF(e._delegate)}clearIndexedDbPersistence(e){return sF(e._delegate)}}class _y{constructor(e,t,n){this._delegate=t,this._persistenceProvider=n,this.INTERNAL={delete:()=>this.terminate()},e instanceof Fr||(this._appCompat=e)}get _databaseId(){return this._delegate._databaseId}settings(e){const t=this._delegate._getSettings();!e.merge&&t.host!==e.host&&Et("You are overriding the original host. If you did not intend to override your settings, use {merge: true}."),e.merge&&(e={...t,...e},delete e.merge),this._delegate._setSettings(e)}useEmulator(e,t,n={}){sS(this._delegate,e,t,n)}enableNetwork(){return oF(this._delegate)}disableNetwork(){return aF(this._delegate)}enablePersistence(e){let t=!1,n=!1;return e&&(t=!!e.synchronizeTabs,n=!!e.experimentalForceOwningTab,P_("synchronizeTabs",t,"experimentalForceOwningTab",n)),t?this._persistenceProvider.enableMultiTabIndexedDbPersistence(this):this._persistenceProvider.enableIndexedDbPersistence(this,n)}clearPersistence(){return this._persistenceProvider.clearIndexedDbPersistence(this)}terminate(){return this._appCompat&&(this._appCompat._removeServiceInstance("firestore-compat"),this._appCompat._removeServiceInstance("firestore")),this._delegate._delete()}waitForPendingWrites(){return iF(this._delegate)}onSnapshotsInSync(e){return FF(this._delegate,e)}get app(){if(!this._appCompat)throw new x("failed-precondition","Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._appCompat}collection(e){try{return new qi(this,ME(this._delegate,e))}catch(t){throw vt(t,"collection()","Firestore.collection()")}}doc(e){try{return new tn(this,fu(this._delegate,e))}catch(t){throw vt(t,"doc()","Firestore.doc()")}}collectionGroup(e){try{return new At(this,iS(this._delegate,e))}catch(t){throw vt(t,"collectionGroup()","Firestore.collectionGroup()")}}runTransaction(e){return TF(this._delegate,t=>e(new Ey(this,t)))}batch(){return wt(this._delegate),new Iy(new yF(this._delegate,e=>ac(this._delegate,e)))}loadBundle(e){return cF(this._delegate,e)}namedQuery(e){return uF(this._delegate,e).then(t=>t?new At(this,t):null)}}class ml extends rf{constructor(e){super(),this.firestore=e}convertBytes(e){return new Sa(new mt(e))}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return tn.forKey(t,this.firestore,null)}}function MF(r){Lb(r)}class Ey{constructor(e,t){this._firestore=e,this._delegate=t,this._userDataWriter=new ml(e)}get(e){const t=ms(e);return this._delegate.get(t).then(n=>new Na(this._firestore,new nn(this._firestore._delegate,this._userDataWriter,n._key,n._document,n.metadata,t.converter)))}set(e,t,n){const s=ms(e);return n?(uf("Transaction.set",n),this._delegate.set(s,t,n)):this._delegate.set(s,t),this}update(e,t,n,...s){const i=ms(e);return arguments.length===2?this._delegate.update(i,t):this._delegate.update(i,t,n,...s),this}delete(e){const t=ms(e);return this._delegate.delete(t),this}}class Iy{constructor(e){this._delegate=e}set(e,t,n){const s=ms(e);return n?(uf("WriteBatch.set",n),this._delegate.set(s,t,n)):this._delegate.set(s,t),this}update(e,t,n,...s){const i=ms(e);return arguments.length===2?this._delegate.update(i,t):this._delegate.update(i,t,n,...s),this}delete(e){const t=ms(e);return this._delegate.delete(t),this}commit(){return this._delegate.commit()}}class xs{constructor(e,t,n){this._firestore=e,this._userDataWriter=t,this._delegate=n}fromFirestore(e,t){const n=new na(this._firestore._delegate,this._userDataWriter,e._key,e._document,e.metadata,null);return this._delegate.fromFirestore(new Oa(this._firestore,n),t??{})}toFirestore(e,t){return t?this._delegate.toFirestore(e,t):this._delegate.toFirestore(e)}static getInstance(e,t){const n=xs.INSTANCES;let s=n.get(e);s||(s=new WeakMap,n.set(e,s));let i=s.get(t);return i||(i=new xs(e,new ml(e),t),s.set(t,i)),i}}xs.INSTANCES=new WeakMap;class tn{constructor(e,t){this.firestore=e,this._delegate=t,this._userDataWriter=new ml(e)}static forPath(e,t,n){if(e.length%2!==0)throw new x("invalid-argument",`Invalid document reference. Document references must have an even number of segments, but ${e.canonicalString()} has ${e.length}`);return new tn(t,new me(t._delegate,n,new z(e)))}static forKey(e,t,n){return new tn(t,new me(t._delegate,n,e))}get id(){return this._delegate.id}get parent(){return new qi(this.firestore,this._delegate.parent)}get path(){return this._delegate.path}collection(e){try{return new qi(this.firestore,ME(this._delegate,e))}catch(t){throw vt(t,"collection()","DocumentReference.collection()")}}isEqual(e){return e=re(e),e instanceof me?GE(this._delegate,e):!1}set(e,t){t=uf("DocumentReference.set",t);try{return t?Gg(this._delegate,e,t):Gg(this._delegate,e)}catch(n){throw vt(n,"setDoc()","DocumentReference.set()")}}update(e,t,...n){try{return arguments.length===1?Ug(this._delegate,e):Ug(this._delegate,e,t,...n)}catch(s){throw vt(s,"updateDoc()","DocumentReference.update()")}}delete(){return NF(this._delegate)}onSnapshot(...e){const t=yy(e),n=wy(e,s=>new Na(this.firestore,new nn(this.firestore._delegate,this._userDataWriter,s._key,s._document,s.metadata,this._delegate.converter)));return my(this._delegate,t,n)}get(e){let t;return(e==null?void 0:e.source)==="cache"?t=vF(this._delegate):(e==null?void 0:e.source)==="server"?t=RF(this._delegate):t=AF(this._delegate),t.then(n=>new Na(this.firestore,new nn(this.firestore._delegate,this._userDataWriter,n._key,n._document,n.metadata,this._delegate.converter)))}withConverter(e){return new tn(this.firestore,e?this._delegate.withConverter(xs.getInstance(this.firestore,e)):this._delegate.withConverter(null))}}function vt(r,e,t){return r.message=r.message.replace(e,t),r}function yy(r){for(const e of r)if(typeof e=="object"&&!sh(e))return e;return{}}function wy(r,e){var n,s;let t;return sh(r[0])?t=r[0]:sh(r[1])?t=r[1]:typeof r[0]=="function"?t={next:r[0],error:r[1],complete:r[2]}:t={next:r[1],error:r[2],complete:r[3]},{next:i=>{t.next&&t.next(e(i))},error:(n=t.error)==null?void 0:n.bind(t),complete:(s=t.complete)==null?void 0:s.bind(t)}}class Na{constructor(e,t){this._firestore=e,this._delegate=t}get ref(){return new tn(this._firestore,this._delegate.ref)}get id(){return this._delegate.id}get metadata(){return this._delegate.metadata}get exists(){return this._delegate.exists()}data(e){return this._delegate.data(e)}get(e,t){return this._delegate.get(e,t)}isEqual(e){return gy(this._delegate,e._delegate)}}class Oa extends Na{data(e){const t=this._delegate.data(e);return this._delegate._converter||kb(t!==void 0,"Document in a QueryDocumentSnapshot should exist"),t}}class At{constructor(e,t){this.firestore=e,this._delegate=t,this._userDataWriter=new ml(e)}where(e,t,n){try{return new At(this.firestore,Cr(this._delegate,BF(e,t,n)))}catch(s){throw vt(s,/(orderBy|where)\(\)/,"Query.$1()")}}orderBy(e,t){try{return new At(this.firestore,Cr(this._delegate,hF(e,t)))}catch(n){throw vt(n,/(orderBy|where)\(\)/,"Query.$1()")}}limit(e){try{return new At(this.firestore,Cr(this._delegate,dF(e)))}catch(t){throw vt(t,"limit()","Query.limit()")}}limitToLast(e){try{return new At(this.firestore,Cr(this._delegate,fF(e)))}catch(t){throw vt(t,"limitToLast()","Query.limitToLast()")}}startAt(...e){try{return new At(this.firestore,Cr(this._delegate,pF(...e)))}catch(t){throw vt(t,"startAt()","Query.startAt()")}}startAfter(...e){try{return new At(this.firestore,Cr(this._delegate,CF(...e)))}catch(t){throw vt(t,"startAfter()","Query.startAfter()")}}endBefore(...e){try{return new At(this.firestore,Cr(this._delegate,gF(...e)))}catch(t){throw vt(t,"endBefore()","Query.endBefore()")}}endAt(...e){try{return new At(this.firestore,Cr(this._delegate,mF(...e)))}catch(t){throw vt(t,"endAt()","Query.endAt()")}}isEqual(e){return UE(this._delegate,e._delegate)}get(e){let t;return(e==null?void 0:e.source)==="cache"?t=PF(this._delegate):(e==null?void 0:e.source)==="server"?t=SF(this._delegate):t=bF(this._delegate),t.then(n=>new ih(this.firestore,new Bn(this.firestore._delegate,this._userDataWriter,this._delegate,n._snapshot)))}onSnapshot(...e){const t=yy(e),n=wy(e,s=>new ih(this.firestore,new Bn(this.firestore._delegate,this._userDataWriter,this._delegate,s._snapshot)));return my(this._delegate,t,n)}withConverter(e){return new At(this.firestore,e?this._delegate.withConverter(xs.getInstance(this.firestore,e)):this._delegate.withConverter(null))}}class GF{constructor(e,t){this._firestore=e,this._delegate=t}get type(){return this._delegate.type}get doc(){return new Oa(this._firestore,this._delegate.doc)}get oldIndex(){return this._delegate.oldIndex}get newIndex(){return this._delegate.newIndex}}class ih{constructor(e,t){this._firestore=e,this._delegate=t}get query(){return new At(this._firestore,this._delegate.query)}get metadata(){return this._delegate.metadata}get size(){return this._delegate.size}get empty(){return this._delegate.empty}get docs(){return this._delegate.docs.map(e=>new Oa(this._firestore,e))}docChanges(e){return this._delegate.docChanges(e).map(t=>new GF(this._firestore,t))}forEach(e,t){this._delegate.forEach(n=>{e.call(t,new Oa(this._firestore,n))})}isEqual(e){return gy(this._delegate,e._delegate)}}class qi extends At{constructor(e,t){super(e,t),this.firestore=e,this._delegate=t}get id(){return this._delegate.id}get path(){return this._delegate.path}get parent(){const e=this._delegate.parent;return e?new tn(this.firestore,e):null}doc(e){try{return e===void 0?new tn(this.firestore,fu(this._delegate)):new tn(this.firestore,fu(this._delegate,e))}catch(t){throw vt(t,"doc()","CollectionReference.doc()")}}add(e){return OF(this._delegate,e).then(t=>new tn(this.firestore,t))}isEqual(e){return GE(this._delegate,e._delegate)}withConverter(e){return new qi(this.firestore,e?this._delegate.withConverter(xs.getInstance(this.firestore,e)):this._delegate.withConverter(null))}}function ms(r){return _e(r,me)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lf{constructor(...e){this._delegate=new xr(...e)}static documentId(){return new lf(Xe.keyField().canonicalString())}isEqual(e){return e=re(e),e instanceof xr?this._delegate._internalPath.isEqual(e._internalPath):!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hs{static serverTimestamp(){const e=hS();return e._methodName="FieldValue.serverTimestamp",new hs(e)}static delete(){const e=BS();return e._methodName="FieldValue.delete",new hs(e)}static arrayUnion(...e){const t=dS(...e);return t._methodName="FieldValue.arrayUnion",new hs(t)}static arrayRemove(...e){const t=fS(...e);return t._methodName="FieldValue.arrayRemove",new hs(t)}static increment(e){const t=pS(e);return t._methodName="FieldValue.increment",new hs(t)}constructor(e){this._delegate=e}isEqual(e){return this._delegate.isEqual(e._delegate)}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const UF={Firestore:_y,GeoPoint:ln,Timestamp:Ie,Blob:Sa,Transaction:Ey,WriteBatch:Iy,DocumentReference:tn,DocumentSnapshot:Na,Query:At,QueryDocumentSnapshot:Oa,QuerySnapshot:ih,CollectionReference:qi,FieldPath:lf,FieldValue:hs,setLogLevel:MF,CACHE_SIZE_UNLIMITED:tF};function HF(r,e){r.INTERNAL.registerComponent(new Nn("firestore-compat",t=>{const n=t.getProvider("app-compat").getImmediate(),s=t.getProvider("firestore").getImmediate();return e(n,s)},"PUBLIC").setServiceProps({...UF}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qF(r){HF(r,(e,t)=>new _y(e,t,new xF)),r.registerVersion(LF,kF)}qF(tt);var jF={};const JF=(()=>{var r;if(typeof process<"u"&&jF)return(r=process.argv)==null?void 0:r.includes("--dev");try{return localStorage.getItem("DEBUG_MODE")==="true"}catch{return!1}})(),Qt=(...r)=>JF&&console.log("[Firestore]",...r),KF={soil:"soilSamples",water:"waterSamples",compost:"compostSamples",heavyMetal:"heavyMetalSamples","heavy-metal":"heavyMetalSamples",pesticide:"pesticideSamples",waterTestResults:"waterTestResults",pesticideTestResults:"pesticideTestResults",compostTestResults:"compostTestResults",heavyMetalTestResults:"heavyMetalTestResults"};function zs(r,e){return`${KF[r]||r}_${e}`}function Dy(r){return r==null?"":String(r)}function zF(r){return Array.isArray(r)?r.map(e=>({...e,id:Dy(e.id)})):r}async function WF(r,e,t,n){var s,i;if(!((s=window.firebaseConfig)!=null&&s.isEnabled()))return!1;try{const o=window.firebaseConfig.getDb();if(!o)return!1;const a=zs(r,e);return await o.collection(a).doc(t).set({...n,updatedAt:tt.firestore.FieldValue.serverTimestamp(),syncedAt:tt.firestore.FieldValue.serverTimestamp()},{merge:!0}),Qt(`저장 완료: ${a}/${t}`),!0}catch(o){return(((i=window.logger)==null?void 0:i.error)||console.error)("Firestore 저장 실패:",o),!1}}async function QF(r,e,t){var n,s;if(!((n=window.firebaseConfig)!=null&&n.isEnabled()))return null;try{const i=window.firebaseConfig.getDb();if(!i)return null;const o=zs(r,e),a=await i.collection(o).doc(t).get();return a.exists?{id:a.id,...a.data()}:null}catch(i){return(((s=window.logger)==null?void 0:s.error)||console.error)("Firestore 조회 실패:",i),null}}async function Ty(r,e,t={}){var n,s,i;if(!((n=window.firebaseConfig)!=null&&n.isEnabled()))return{documents:[],fromCache:!1};try{const o=window.firebaseConfig.getDb();if(!o)return{documents:[],fromCache:!1};const a=zs(r,e),l=await o.collection(a).get(),B=((s=l.metadata)==null?void 0:s.fromCache)===!0,d=[];return l.forEach(p=>{d.push({id:p.id,...p.data()})}),d.length>0&&d.sort((p,g)=>{var M,W,te,ie;const w=((M=p.createdAt)==null?void 0:M.seconds)||((W=p.updatedAt)==null?void 0:W.seconds)||0,N=((te=g.createdAt)==null?void 0:te.seconds)||((ie=g.updatedAt)==null?void 0:ie.seconds)||0;return w-N}),Qt(`조회 완료: ${a} (${d.length}건, fromCache=${B})`),{documents:zF(d),fromCache:B}}catch(o){return(((i=window.logger)==null?void 0:i.error)||console.error)("Firestore 전체 조회 실패:",o),{documents:[],fromCache:!1}}}async function $F(r,e,t={}){const{documents:n}=await Ty(r,e,t);return n}async function YF(r,e,t){var n;if(!((n=window.firebaseConfig)!=null&&n.isEnabled()))return!1;try{const s=window.firebaseConfig.getDb();if(!s)return!1;const i=zs(r,e),o=String(typeof t=="number"?t:t||""),a=parseInt(o,10);if(!o)return!1;const c=s.collection(i).doc(o);if((await c.get()).exists)return await c.delete(),Qt(`삭제 완료: ${i}/${o}`),!0;let B=await s.collection(i).where("id","==",o).get();if(B.empty&&!isNaN(a)&&(B=await s.collection(i).where("id","==",a).get()),B.empty)return Qt(`삭제 대상 없음(멱등 성공): ${i}/${o}`),!0;const d=[];return B.forEach(p=>{d.push(p.ref.delete())}),await Promise.all(d),Qt(`삭제 완료 (쿼리): ${i}/${o} (${B.size}건)`),!0}catch(s){return console.error("Firestore 삭제 실패:",s),!1}}async function Ay(r,e,t){var n,s;if(!((n=window.firebaseConfig)!=null&&n.isEnabled())||!t.length)return!1;try{const i=window.firebaseConfig.getDb();if(!i)return!1;const o=zs(r,e),a=450,c=[];for(let l=0;l<t.length;l+=a)c.push(t.slice(l,l+a));Qt(`배치 저장 시작: ${o} (${t.length}건, ${c.length}개 청크)`);for(let l=0;l<c.length;l++){const B=c[l],d=i.batch();B.forEach(p=>{let g=Dy(p.id).trim();g||(g=vy());const w=i.collection(o).doc(g),N={...p,id:g,updatedAt:tt.firestore.FieldValue.serverTimestamp(),syncedAt:tt.firestore.FieldValue.serverTimestamp()};p.createdAt||(N.createdAt=tt.firestore.FieldValue.serverTimestamp()),d.set(w,N,{merge:!0})}),await d.commit(),Qt(`청크 ${l+1}/${c.length} 완료 (${B.length}건)`)}return Qt(`배치 저장 완료: ${o} (${t.length}건)`),!0}catch(i){return(((s=window.logger)==null?void 0:s.error)||console.error)("Firestore 배치 저장 실패:",i),!1}}async function XF(r,e,t){var n,s,i;if(!((n=window.firebaseConfig)!=null&&n.isEnabled()))return{success:!1,count:0};try{const o=localStorage.getItem(t);if(!o)return Qt("마이그레이션할 데이터가 없습니다."),{success:!0,count:0};let a;try{a=JSON.parse(o)}catch(l){return(((s=window.logger)==null?void 0:s.error)||console.error)(`마이그레이션 JSON 파싱 실패 (${t}):`,l),{success:!1,count:0,message:"JSON 파싱 실패"}}if(!Array.isArray(a)||a.length===0)return{success:!0,count:0};const c=a.map(l=>({...l,id:l.id||ZF()}));return await Ay(r,e,c),Qt(`마이그레이션 완료: ${t} → Firestore (${c.length}건)`),{success:!0,count:c.length}}catch(o){return(((i=window.logger)==null?void 0:i.error)||console.error)("마이그레이션 실패:",o),{success:!1,count:0}}}function vy(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Array.from(crypto.getRandomValues(new Uint8Array(6)),r=>r.toString(36)).join("").substring(0,9)}function ZF(){return vy()}function eL(r,e,t){var n,s;if(!((n=window.firebaseConfig)!=null&&n.isEnabled()))return null;try{const i=window.firebaseConfig.getDb();if(!i)return null;const o=zs(r,e),a=i.collection(o).onSnapshot(c=>{const l=[];c.forEach(B=>{l.push({id:B.id,...B.data()})}),t(l,c.metadata.fromCache)},c=>{var l;(((l=window.logger)==null?void 0:l.error)||console.error)("실시간 동기화 에러:",c)});return Qt(`실시간 동기화 시작: ${o}`),a}catch(i){return(((s=window.logger)==null?void 0:s.error)||console.error)("실시간 동기화 설정 실패:",i),null}}function tL(){var r;return((r=window.firebaseConfig)==null?void 0:r.isEnabled())===!0}function nL(){var r;return((r=window.firebaseConfig)==null?void 0:r.isOfflineSupported())===!0}async function rL(r,e){var t,n;if(!((t=window.firebaseConfig)!=null&&t.isEnabled()))return{success:!1,reason:"disabled"};try{const s=window.firebaseConfig.getDb();if(!s)return{success:!1,reason:"no-db"};const i=new Date().toISOString();return await s.collection("appConfig").doc("cropData").set({data:r,version:e,updatedAt:i}),Qt(`작물 데이터 저장 완료: ${Array.isArray(r)?r.length:0}건`),{success:!0,updatedAt:i}}catch(s){return(((n=window.logger)==null?void 0:n.error)||console.error)("작물 데이터 Firestore 저장 실패:",s),{success:!1,error:s.message}}}async function sL(){var r,e;if(!((r=window.firebaseConfig)!=null&&r.isEnabled()))return null;try{const t=window.firebaseConfig.getDb();if(!t)return null;const n=await t.collection("appConfig").doc("cropData").get();if(n.exists){const s=n.data();return{data:s.data,version:s.version,updatedAt:s.updatedAt}}return null}catch(t){return(((e=window.logger)==null?void 0:e.error)||console.error)("작물 데이터 Firestore 조회 실패:",t),null}}window.firestoreDb={init:async function(){return Qt("firestoreDb.init() 호출됨 (no-op)"),!0},save:WF,get:QF,getAll:$F,getAllWithMeta:Ty,delete:YF,batchSave:Ay,migrate:XF,subscribe:eL,isEnabled:tL,isOfflineEnabled:nL,getCollectionName:zs,saveCropDataConfig:rL,getCropDataConfig:sL};
