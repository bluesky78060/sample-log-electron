class h{constructor(t){this.searchBtn=t.searchBtn,this.postcodeInput=t.postcodeInput,this.roadInput=t.roadInput,this.detailInput=t.detailInput,this.hiddenInput=t.hiddenInput,this.modal=t.modal,this.closeBtn=t.closeBtn,this.container=t.container,this._page=1,this._pageSize=10,this._lastKeyword="",this._total=0,this._items=[],this._searching=!1,this._uiReady=!1,this.init()}init(){if(this.closeBtn&&this.closeBtn.addEventListener("click",()=>this.closeModal()),this.modal){const t=this.modal.querySelector(".modal-overlay");t&&t.addEventListener("click",()=>this.closeModal())}if(this.searchBtn&&this.searchBtn.addEventListener("click",()=>this.openSearch()),!this._delegateBound){this._delegateBound=!0;const t=this.searchBtn,i=t&&t.id||"searchAddressBtn";document.addEventListener("click",s=>{s.target&&s.target.closest&&s.target.closest("#"+i)&&(this.modal&&!this.modal.classList.contains("hidden")||this.openSearch())})}this.detailInput&&this.detailInput.addEventListener("input",()=>this.updateFullAddress())}openSearch(){var t;if(!this.container){alert("주소 검색 컨테이너가 존재하지 않습니다.");return}if(!window.JusoService||!((t=window.electronAPI)!=null&&t.jusoSearch)){alert("juso 주소 검색은 데스크톱(Electron) 환경에서만 사용 가능합니다.");return}this.modal&&this.modal.classList.remove("hidden"),this._renderSearchUI(),setTimeout(()=>{const i=this.container.querySelector(".juso-search-input");i&&i.focus()},50)}_renderSearchUI(){if(this._uiReady&&this.container.querySelector(".juso-search-input"))return;const t="juso-"+Math.random().toString(36).slice(2,8);this.container.innerHTML=`
            <div class="juso-search-wrap" data-id="${t}">
                <div class="juso-search-row">
                    <input type="text" class="juso-search-input"
                        placeholder="도로명/지번/건물명 검색 (예: 봉화읍 봉성로 1)"
                        autocomplete="off" maxlength="80">
                    <button type="button" class="juso-search-btn">검색</button>
                </div>
                <div class="juso-search-hint">예: <em>봉화읍 봉성로</em>, <em>봉화군 삼계리</em>, <em>봉화초등학교</em></div>
                <div class="juso-search-status" aria-live="polite"></div>
                <ul class="juso-search-results"></ul>
                <div class="juso-search-pager">
                    <button type="button" class="juso-page-prev" disabled>← 이전</button>
                    <span class="juso-page-info">0 건</span>
                    <button type="button" class="juso-page-next" disabled>다음 →</button>
                </div>
            </div>
        `;const i=this.container.querySelector(".juso-search-input"),s=this.container.querySelector(".juso-search-btn"),a=this.container.querySelector(".juso-search-results"),n=this.container.querySelector(".juso-page-prev"),r=this.container.querySelector(".juso-page-next"),e=(o=1)=>{const d=(i.value||"").trim();d&&(this._lastKeyword=d,this._page=o,this._runSearch())};s.addEventListener("click",()=>e(1)),i.addEventListener("keydown",o=>{o.key==="Enter"&&(o.preventDefault(),e(1))}),n.addEventListener("click",()=>{this._page>1&&e(this._page-1)}),r.addEventListener("click",()=>{const o=Math.max(1,Math.ceil(this._total/this._pageSize));this._page<o&&e(this._page+1)}),a.addEventListener("click",o=>{const d=o.target.closest("li[data-idx]");if(!d)return;const c=Number(d.dataset.idx),l=this._items[c];l&&this._onJusoSelected(l)}),a.addEventListener("keydown",o=>{if(o.key!=="Enter")return;const d=document.activeElement;if(d&&d.dataset&&d.dataset.idx!==void 0){o.preventDefault();const c=Number(d.dataset.idx),l=this._items[c];l&&this._onJusoSelected(l)}}),this._uiReady=!0}async _runSearch(){if(this._searching)return;const t=this.container.querySelector(".juso-search-status"),i=this.container.querySelector(".juso-search-results"),s=this.container.querySelector(".juso-page-prev"),a=this.container.querySelector(".juso-page-next"),n=this.container.querySelector(".juso-page-info"),r=this.container.querySelector(".juso-search-btn");this._searching=!0,r&&(r.disabled=!0),t.textContent="검색 중...",i.innerHTML="",s.disabled=!0,a.disabled=!0;try{const e=await window.JusoService.search(this._lastKeyword,{page:this._page,size:this._pageSize});if(!e.ok){t.textContent=`오류: ${e.error||"검색 실패"}`,n.textContent="0 건",this._items=[],this._total=0;return}if(this._items=e.items||[],this._total=Number(e.total)||0,this._items.length===0){t.textContent="검색 결과가 없습니다.",n.textContent="0 건";return}t.textContent="",this._renderResults(i);const o=Math.max(1,Math.ceil(this._total/this._pageSize));n.textContent=`${this._total.toLocaleString()} 건 (${this._page}/${o})`,s.disabled=this._page<=1,a.disabled=this._page>=o}catch(e){t.textContent=`오류: ${(e==null?void 0:e.message)||"알 수 없는 오류"}`}finally{this._searching=!1,r&&(r.disabled=!1)}}_renderResults(t){var a;const i=((a=window.sanitize)==null?void 0:a.escapeHTML)||(n=>String(n??"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])),s=this._items.map((n,r)=>{const e=i(n.roadAddr||n.roadAddrPart1||""),o=i(n.jibunAddr||""),d=i(n.zipNo||""),c=i(n.bdNm||"");return`
                <li data-idx="${r}" tabindex="0">
                    <div class="juso-item-road">
                        <span class="juso-zip">[${d}]</span>
                        <strong>${e}</strong>
                        ${c?`<span class="juso-bdnm">(${c})</span>`:""}
                    </div>
                    <div class="juso-item-jibun">지번: ${o}</div>
                </li>
            `}).join("");t.innerHTML=s}_onJusoSelected(t){const i=String(t.bdKdcd||"")==="1",s={zonecode:t.zipNo||"",roadAddress:t.roadAddr||t.roadAddrPart1||"",jibunAddress:t.jibunAddr||"",bname:t.liNm||t.emdNm||"",buildingName:t.bdNm||"",apartment:i?"Y":"N",sido:t.siNm||"",sigungu:t.sggNm||""};this.onAddressSelected(s)}onAddressSelected(t){const i=t.roadAddress||"";let s="";t.bname&&/[동로가]$/.test(t.bname)&&(s+=t.bname),t.buildingName&&t.apartment==="Y"&&(s+=s!==""?", "+t.buildingName:t.buildingName),s!==""&&(s=" ("+s+")"),this.postcodeInput&&(this.postcodeInput.value=t.zonecode||""),this.roadInput&&(this.roadInput.value=i+s),this.detailInput&&this.detailInput.focus(),this.updateFullAddress(),this.closeModal()}closeModal(){this.modal&&this.modal.classList.add("hidden"),setTimeout(()=>{this.container&&(this.container.innerHTML=""),this._uiReady=!1,this._items=[],this._page=1,this._total=0,this._lastKeyword=""},100)}updateFullAddress(){var a,n,r;if(!this.hiddenInput)return;const t=((a=this.postcodeInput)==null?void 0:a.value)||"",i=((n=this.roadInput)==null?void 0:n.value)||"",s=((r=this.detailInput)==null?void 0:r.value)||"";t&&i?this.hiddenInput.value=`(${t}) ${i}${s?" "+s:""}`:this.hiddenInput.value=""}clear(){this.postcodeInput&&(this.postcodeInput.value=""),this.roadInput&&(this.roadInput.value=""),this.detailInput&&(this.detailInput.value=""),this.hiddenInput&&(this.hiddenInput.value="")}setValue(t,i,s){this.postcodeInput&&(this.postcodeInput.value=t||""),this.roadInput&&(this.roadInput.value=i||""),this.detailInput&&(this.detailInput.value=s||""),this.updateFullAddress()}}(function(){if(typeof document>"u"||document.getElementById("juso-search-style"))return;const t=document.createElement("style");t.id="juso-search-style",t.textContent=`
        .juso-search-wrap { display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
        .juso-search-row { display: flex; gap: 6px; }
        .juso-search-input { flex: 1; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; }
        .juso-search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .juso-search-btn { padding: 8px 14px; background: #2563eb; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .juso-search-btn:hover { background: #1d4ed8; }
        .juso-search-hint { font-size: 12px; color: #6b7280; }
        .juso-search-hint em { font-style: normal; color: #2563eb; }
        .juso-search-status { min-height: 18px; font-size: 12px; color: #6b7280; }
        .juso-search-results { list-style: none; padding: 0; margin: 0; max-height: 360px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 6px; }
        .juso-search-results:empty { border: 0; }
        .juso-search-results li { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; cursor: pointer; outline: none; }
        .juso-search-results li:last-child { border-bottom: 0; }
        .juso-search-results li:hover, .juso-search-results li:focus { background: #eff6ff; }
        .juso-item-road { font-size: 14px; color: #111827; }
        .juso-item-road strong { font-weight: 600; }
        .juso-zip { display: inline-block; min-width: 50px; color: #2563eb; font-size: 12px; margin-right: 4px; }
        .juso-bdnm { color: #6b7280; font-size: 12px; margin-left: 4px; }
        .juso-item-jibun { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .juso-search-pager { display: flex; justify-content: space-between; align-items: center; padding-top: 4px; font-size: 13px; }
        .juso-search-pager button { padding: 4px 10px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }
        .juso-search-pager button:disabled { opacity: 0.4; cursor: not-allowed; }
        .juso-page-info { color: #6b7280; }
        /* 다크 모드 */
        [data-theme="dark"] .juso-search-input { background: #1f2937; color: #f9fafb; border-color: #374151; }
        [data-theme="dark"] .juso-search-input:focus { border-color: #60a5fa; }
        [data-theme="dark"] .juso-search-hint, [data-theme="dark"] .juso-search-status, [data-theme="dark"] .juso-page-info, [data-theme="dark"] .juso-item-jibun, [data-theme="dark"] .juso-bdnm { color: #9ca3af; }
        [data-theme="dark"] .juso-search-results { border-color: #374151; }
        [data-theme="dark"] .juso-search-results li { border-color: #1f2937; color: #e5e7eb; }
        [data-theme="dark"] .juso-search-results li:hover, [data-theme="dark"] .juso-search-results li:focus { background: #1e3a8a; }
        [data-theme="dark"] .juso-item-road { color: #f9fafb; }
        [data-theme="dark"] .juso-search-pager button { background: #1f2937; border-color: #374151; color: #e5e7eb; }
        [data-theme="dark"] .juso-zip { color: #60a5fa; }
    `,document.head.appendChild(t)})();window.AddressManager=h;function p(u){if(!u||u==="-")return{sido:"",sigungu:"",eupmyeondong:"",rest:""};u=u.replace(/^\(\d{5}\)\s*/,"").trim();const t=["서울특별시","부산광역시","대구광역시","인천광역시","광주광역시","대전광역시","울산광역시","세종특별자치시","경기도","강원특별자치도","강원도","충청북도","충청남도","전라북도","전북특별자치도","전라남도","경상북도","경상남도","제주특별자치도"],i={서울:"서울특별시",부산:"부산광역시",대구:"대구광역시",인천:"인천광역시",광주:"광주광역시",대전:"대전광역시",울산:"울산광역시",세종:"세종특별자치시",경기:"경기도",강원:"강원특별자치도",충북:"충청북도",충남:"충청남도",전북:"전북특별자치도",전남:"전라남도",경북:"경상북도",경남:"경상남도",제주:"제주특별자치도"};let s="",a="",n="",r="";const e=u.split(/\s+/);if(e.length>0){const o=e[0];t.includes(o)?(s=o,e.shift()):i[o]&&(s=i[o],e.shift())}return e.length>0&&/(시|군|구)$/.test(e[0])&&(a=e.shift(),e.length>0&&/구$/.test(e[0])&&(a+=" "+e.shift())),e.length>0&&/(읍|면|동|리|가)$/.test(e[0])&&(n=e.shift()),r=e.join(" "),{sido:s,sigungu:a,eupmyeondong:n,rest:r}}window.parseAddressParts=p;
