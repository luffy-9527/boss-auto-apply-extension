(function(){"use strict";const g={keywords:["前端","Web","React"],excludeKeywords:["外包","外派","驻场","兼职","实习生","培训"],minSalary:0,maxSalary:0,blacklistCompanies:["某某人力","劳务派遣"],minDelay:3,maxDelay:7,maxApplyPerRun:25,autoScroll:!0,sayHiMessage:""},f={status:"IDLE",appliedCount:0,targetCount:25,filteredCount:0};function y(d){if(!d)return null;const t=d.match(/(\d+)(?:-(\d+))?[kK]/);if(!t)return null;const e=parseInt(t[1],10),a=t[2]?parseInt(t[2],10):e;return[e,a]}function b(d,t){const e=(d.title||"").toLowerCase(),a=(d.company||"").toLowerCase(),o=(d.tagsText||"").toLowerCase(),i=`${e} ${a} ${o}`;if(d.isChated)return{pass:!1,reason:"已沟通过，跳过"};const s=(d.buttonText||"").trim();if(s&&s.includes("继续沟通"))return{pass:!1,reason:"已沟通过，跳过"};for(const r of t.blacklistCompanies){const n=r.trim().toLowerCase();if(n&&a.includes(n))return{pass:!1,reason:`命中企业黑名单: ${r}`}}for(const r of t.excludeKeywords){const n=r.trim().toLowerCase();if(n&&i.includes(n))return{pass:!1,reason:`包含排除关键词: ${r}`}}if(t.keywords.length>0&&!t.keywords.some(n=>{const c=n.trim().toLowerCase();return c&&(e.includes(c)||o.includes(c))}))return{pass:!1,reason:"未包含目标岗位关键词"};const l=y(d.salaryText);if(l){const[r,n]=l;if(t.minSalary>0&&n<t.minSalary)return{pass:!1,reason:`岗位薪资上限(${n}K)低于期望最低薪资(${t.minSalary}K)`};if(t.maxSalary>0&&r>t.maxSalary)return{pass:!1,reason:`岗位起薪(${r}K)高于期望最高薪资(${t.maxSalary}K)`}}return{pass:!0,reason:"符合条件"}}class x{constructor(){this.config={...g},this.state={...f},this.isRunning=!1,this.isPaused=!1,this.abortController=null,this.rootContainer=null,this.shadowRoot=null,this.todayCount=0,this.processedKeys=new Set,this.init()}async init(){console.log("[BossAutoApply] 投递助手内容脚本已加载"),await this.loadConfigAndState(),this.createFloatingUI(),this.listenMessages(),this.listenStorageChanges()}async loadConfigAndState(){try{const t=await chrome.storage.local.get(["config","state","todayCount","lastDate"]);t.config&&(this.config={...g,...t.config});const e=new Date().toISOString().slice(0,10);let a=t.todayCount||0;t.lastDate!==e&&(a=0,await chrome.storage.local.set({todayCount:0,lastDate:e})),this.todayCount=a,this.state={...f,targetCount:this.config.maxApplyPerRun,appliedCount:0,filteredCount:0},this.updateFloatingUI()}catch(t){console.error("[BossAutoApply] 加载本地存储失败:",t)}}listenMessages(){chrome.runtime.onMessage.addListener((t,e,a)=>((async()=>t.action==="START"?(await this.start(),a({success:!0,state:this.state})):t.action==="PAUSE"?(this.pause(),a({success:!0,state:this.state})):t.action==="RESUME"?(this.resume(),a({success:!0,state:this.state})):t.action==="STOP"?(this.stop(),a({success:!0,state:this.state})):t.action==="GET_STATE"&&a({success:!0,state:this.state,config:this.config}))(),!0))}listenStorageChanges(){chrome.storage.onChanged.addListener((t,e)=>{e==="local"&&t.config&&(this.config={...this.config,...t.config.newValue},this.state.targetCount=this.config.maxApplyPerRun,this.updateFloatingUI())})}async addLog(t){const e={id:Math.random().toString(36).substring(2,9),time:new Date().toLocaleTimeString("zh-CN",{hour12:!1}),...t};try{const{logs:a=[]}=await chrome.storage.local.get("logs"),o=[e,...a].slice(0,100);await chrome.storage.local.set({logs:o})}catch(a){console.warn("[BossAutoApply] 记录日志失败:",a)}this.updateFloatingUI(e.reason)}async sleep(t){return new Promise(e=>setTimeout(e,t))}getRandomDelay(){const t=Math.max(1,this.config.minDelay)*1e3,e=Math.max(t,this.config.maxDelay*1e3);return Math.floor(Math.random()*(e-t+1))+t}extractJobCards(){const t=[".job-card-wrapper","li.job-card-box",".job-card-box",'[class*="job-card-wrapper"]',"ul.job-list-box > li",".job-list-container li"];let e=[];for(const a of t){const o=Array.from(document.querySelectorAll(a));if(o.length>0){e=o;break}}if(e.length===0){const a=Array.from(document.querySelectorAll('.job-name, .job-title, [class*="job-name"]'));e=Array.from(new Set(a.map(o=>o.closest('li, .job-card-wrapper, div[class*="card"]')).filter(o=>!!o)))}return e.map(a=>{var c,h,u,p,m;const o=a.querySelector('.job-name, .job-title, [class*="job-name"], .job-title-box'),i=a.querySelector('.salary, [class*="salary"]'),s=a.querySelector('.company-name, [class*="company-name"], .company-info'),l=a.querySelector('.tag-list, .job-info, [class*="tag-list"], .job-desc'),r=!!(a.querySelector('.chated, .has-chated, .is-chated, [class*="chated"]')||a.innerText.includes("已沟通")||a.innerText.includes("继续沟通")),n=a.querySelector('.btn-startchat, [class*="btn-startchat"], a[ka*="start_chat"], button[ka*="start_chat"]');return{title:((c=o==null?void 0:o.innerText)==null?void 0:c.trim())||"",company:((h=s==null?void 0:s.innerText)==null?void 0:h.trim())||"",salaryText:((u=i==null?void 0:i.innerText)==null?void 0:u.trim())||"",tagsText:((p=l==null?void 0:l.innerText)==null?void 0:p.trim())||"",buttonText:((m=n==null?void 0:n.innerText)==null?void 0:m.trim())||"",isChated:r,element:a,buttonElement:n||void 0}})}findChatButton(){const t=Array.from(document.querySelectorAll(".job-detail-box, .job-detail-container, .job-banner, .detail-content, .job-sider, .job-detail-header"));for(const o of t){const s=Array.from(o.querySelectorAll("a, button, div.btn, span.btn, .btn")).find(l=>{var n;const r=(n=l.innerText)==null?void 0:n.trim();return(r==="立即沟通"||r==="继续沟通"||r==="打招呼")&&l.offsetParent!==null});if(s)return s}const e=document.querySelector('.btn-startchat, [class*="btn-startchat"], a[ka*="startchat"], a[ka*="start_chat"], button[ka*="startchat"]');return e&&e.offsetParent!==null?e:Array.from(document.querySelectorAll('a, button, span, div[role="button"]')).find(o=>{var s;if(o.closest("#boss-auto-apply-pill-host"))return!1;const i=(s=o.innerText)==null?void 0:s.trim();return(i==="立即沟通"||i==="继续沟通")&&o.offsetParent!==null})||null}scrollJobList(t){t&&t.scrollIntoView({behavior:"smooth",block:"center"});let e=(t==null?void 0:t.parentElement)||null,a=!1;for(;e&&e!==document.body;){const i=window.getComputedStyle(e).overflowY;if(["auto","scroll"].includes(i)&&e.scrollHeight>e.clientHeight){e.scrollBy({top:600,behavior:"smooth"}),a=!0;break}e=e.parentElement}document.querySelectorAll(".job-list-box, .job-tab-box, .job-card-box-scroll, ul.job-list-box, .job-list-container").forEach(i=>{i.scrollHeight>i.clientHeight&&(i.scrollBy({top:600,behavior:"smooth"}),a=!0)}),a||window.scrollBy({top:600,behavior:"smooth"})}checkPopupsAndDialogs(){const t=document.querySelector('.geetest_radar, .geetest_popup, [class*="geetest"], [class*="captcha-box"], [class*="dialog-box"][class*="verify"]');if(t&&t.getBoundingClientRect().width>0)return{isBlocked:!0,isLimitReached:!1,hasGreetConfirm:null};const e=Array.from(document.querySelectorAll('.dialog-wrap, .dialog-container, .boss-dialog, [role="dialog"]'));for(const a of e){const o=a.innerText||"";if(o.includes("今日沟通人数已达上限")||o.includes("今日沟通已达上限")||o.includes("沟通次数达上限"))return{isBlocked:!1,isLimitReached:!0,hasGreetConfirm:null}}for(const a of e){const o=Array.from(a.querySelectorAll("button, .btn, a")).find(i=>{var l;const s=(l=i.innerText)==null?void 0:l.trim();return s==="确定"||s==="发送"||s==="打招呼"||s==="发消息"});if(o)return{isBlocked:!1,isLimitReached:!1,hasGreetConfirm:o}}return{isBlocked:!1,isLimitReached:!1,hasGreetConfirm:null}}async start(){this.isRunning||((this.state.status==="COMPLETED"||this.state.appliedCount>=this.state.targetCount)&&(this.state.appliedCount=0,this.state.filteredCount=0,this.state.targetCount=this.config.maxApplyPerRun,this.processedKeys.clear()),this.isRunning=!0,this.isPaused=!1,this.abortController=new AbortController,this.state.status="RUNNING",this.state.message="🚀 批量投递运行中...",this.updateFloatingUI(),await this.syncStateToStorage(),await this.executeLoop())}pause(){this.isRunning&&(this.isPaused=!0,this.state.status="PAUSED",this.state.message="⏸ 任务已暂停",this.updateFloatingUI(),this.syncStateToStorage())}resume(){!this.isRunning||!this.isPaused||(this.isPaused=!1,this.state.status="RUNNING",this.state.message="🚀 投递继续运行中...",this.updateFloatingUI(),this.syncStateToStorage())}stop(){this.isRunning=!1,this.isPaused=!1,this.abortController&&(this.abortController.abort(),this.abortController=null),this.state.status="IDLE",this.state.message="已停止",this.updateFloatingUI(),this.syncStateToStorage()}async executeLoop(){var e,a;let t=0;for(;this.isRunning;){for(;this.isPaused&&this.isRunning;)await this.sleep(1e3);if(!this.isRunning)break;if(this.state.appliedCount>=this.state.targetCount){this.state.status="COMPLETED",this.state.message=`🎉 已达到设定投递上限 (${this.state.targetCount} 个)，任务完成`,this.isRunning=!1,await this.addLog({jobTitle:"-",company:"-",salary:"-",status:"SUCCESS",reason:`已达成单次投递目标: ${this.state.targetCount} 个`});break}const o=this.extractJobCards();if(o.length===0){if(this.state.message="未检测到岗位列表，正在滚动加载...",this.updateFloatingUI(),this.scrollJobList(),await this.sleep(2500),t++,t>6){this.state.message="未在当前页面找到可识别岗位列表，请确认是否处于岗位列表页",this.stop();break}continue}let i=0;for(const s of o){if(!this.isRunning)break;for(;this.isPaused&&this.isRunning;)await this.sleep(1e3);if(this.state.appliedCount>=this.state.targetCount)break;const l=`${s.company}_${s.title}_${s.salaryText}`.trim();if(this.processedKeys.has(l))continue;this.processedKeys.add(l),i++;const r=b(s,this.config);if(!r.pass){r.reason.includes("已沟通")||(this.state.filteredCount++,await this.addLog({jobTitle:s.title||"未知岗位",company:s.company||"未知企业",salary:s.salaryText||"面议",status:"SKIPPED",reason:r.reason}));continue}this.state.currentJobName=s.title,this.state.currentCompany=s.company,this.state.message=`正在查看: ${s.company} · ${s.title}`,this.updateFloatingUI(),this.scrollJobList(s.element),await this.sleep(600),(s.element.querySelector("a, .job-name, .job-title")||s.element).click(),await this.sleep(1e3+Math.random()*500);const c=this.findChatButton();if(!c){console.warn("[BossAutoApply] 未找到沟通按钮:",s.title);continue}const h=((e=c.innerText)==null?void 0:e.trim())||"";if(h.includes("继续沟通")){await this.addLog({jobTitle:s.title,company:s.company,salary:s.salaryText,status:"SKIPPED",reason:"详情显示已沟通过，跳过"});continue}if(h.includes("立即沟通")||h.includes("打招呼"))try{this.state.message=`正在发起沟通: ${s.company} · ${s.title}`,this.updateFloatingUI(),c.click(),await this.sleep(1500);const u=this.checkPopupsAndDialogs();if(u.isBlocked){this.state.status="SECURITY_BLOCKED",this.state.message="⚠️ 触发安全滑块验证，已自动暂停！请手动在页面完成验证。",this.isPaused=!0,await this.addLog({jobTitle:s.title,company:s.company,salary:s.salaryText,status:"WARN",reason:"触发安全验证码，自动化紧急熔断暂停"}),this.updateFloatingUI();break}if(u.isLimitReached){this.state.status="COMPLETED",this.state.message="🛑 触发Boss直聘官方每日打招呼上限，已自动终止。",this.isRunning=!1,await this.addLog({jobTitle:s.title,company:s.company,salary:s.salaryText,status:"WARN",reason:"已达到Boss平台今日沟通上限"}),this.updateFloatingUI();break}u.hasGreetConfirm&&(u.hasGreetConfirm.click(),await this.sleep(1e3)),this.state.appliedCount++,await this.addLog({jobTitle:s.title,company:s.company,salary:s.salaryText,status:"SUCCESS",reason:"已成功发起沟通"}),await this.incrementTodayCount();const p=this.getRandomDelay();this.state.message=`✅ 成功沟通！防封等待 ${(p/1e3).toFixed(1)} 秒...`,this.updateFloatingUI(),await this.sleep(p)}catch(u){console.error("[BossAutoApply] 点击异常:",u)}}if(this.isRunning&&this.state.appliedCount<this.state.targetCount)if(this.config.autoScroll){this.state.message="正在加载更多岗位...",this.updateFloatingUI();const s=(a=o[o.length-1])==null?void 0:a.element;this.scrollJobList(s);const l=document.querySelector(".ui-icon-arrow-right, a.next:not(.disabled), .pagination-area .next");if(l?(l.click(),await this.sleep(2500)):await this.sleep(2e3),i===0){if(t++,t>=4){this.state.message="已无更多新岗位，投递完成",this.stop();break}}else t=0}else{this.state.message="当前列表已处理完毕（未启用自动加载），任务结束",this.stop();break}}this.updateFloatingUI(),await this.syncStateToStorage()}async incrementTodayCount(){const{todayCount:t=0}=await chrome.storage.local.get("todayCount"),e=new Date().toISOString().slice(0,10);this.todayCount=t+1,await chrome.storage.local.set({todayCount:this.todayCount,lastDate:e})}async syncStateToStorage(){try{await chrome.storage.local.set({state:this.state})}catch(t){console.warn("[BossAutoApply] 同步状态失败:",t)}}createFloatingUI(){if(this.rootContainer)return;this.rootContainer=document.createElement("div"),this.rootContainer.id="boss-auto-apply-pill-host",this.rootContainer.style.position="fixed",this.rootContainer.style.bottom="24px",this.rootContainer.style.right="24px",this.rootContainer.style.zIndex="999999",document.body.appendChild(this.rootContainer),this.shadowRoot=this.rootContainer.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent=`
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .pill-container {
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0,0,0,0.08);
        border: 1px solid rgba(0, 190, 189, 0.25);
        width: 320px;
        overflow: hidden;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .pill-header {
        background: linear-gradient(135deg, #00bebd 0%, #008fcc 100%);
        color: #ffffff;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
      }
      .pill-body {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-size: 12px;
        color: #333333;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        background: #f7fafc;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #edf2f7;
      }
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }
      .stat-num {
        font-size: 14px;
        font-weight: 700;
        color: #00bebd;
      }
      .stat-label {
        font-size: 11px;
        color: #718096;
      }
      .msg-banner {
        font-size: 12px;
        color: #4a5568;
        background: #edf2f7;
        padding: 6px 10px;
        border-radius: 6px;
        line-height: 1.4;
        word-break: break-all;
        min-height: 28px;
      }
      .btn-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .btn {
        padding: 8px 10px;
        border-radius: 6px;
        border: none;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
      }
      .btn-primary {
        background: #00bebd;
        color: white;
      }
      .btn-primary:hover { background: #00a8a7; }
      .btn-secondary {
        background: #edf2f7;
        color: #4a5568;
      }
      .btn-secondary:hover { background: #e2e8f0; }
      .btn-danger {
        background: #fed7d7;
        color: #c53030;
      }
      .btn-danger:hover { background: #feb2b2; }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
        background: #a0aec0;
      }
      .status-dot.active { background: #48bb78; animation: pulse 1.5s infinite; }
      .status-dot.warn { background: #ecc94b; }
      .status-dot.danger { background: #f56565; }
      @keyframes pulse {
        0% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(0.95); opacity: 0.8; }
      }
      .collapsed .pill-body { display: none; }
    `;const e=document.createElement("div");e.className="pill-container",e.innerHTML=`
      <div class="pill-header" id="pill-toggle">
        <div style="display: flex; align-items: center;">
          <span class="status-dot" id="pill-dot"></span>
          <span>Boss 一键投递</span>
        </div>
        <span style="font-size: 11px; opacity: 0.85;" id="pill-status-text">就绪</span>
      </div>
      <div class="pill-body">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-num" id="stat-applied">0</span>
            <span class="stat-label">本次投递</span>
          </div>
          <div class="stat-item">
            <span class="stat-num" id="stat-target">25</span>
            <span class="stat-label">单次限额</span>
          </div>
          <div class="stat-item">
            <span class="stat-num" id="stat-today">0</span>
            <span class="stat-label">今日总计</span>
          </div>
          <div class="stat-item">
            <span class="stat-num" id="stat-filtered">0</span>
            <span class="stat-label">已过滤</span>
          </div>
        </div>

        <div class="msg-banner" id="pill-msg">点击下方按钮开始按规则投递</div>

        <div class="btn-group">
          <button class="btn btn-primary" id="btn-main-action">🚀 开始投递</button>
          <button class="btn btn-secondary" id="btn-pause-action">⏸ 暂停</button>
        </div>
        <button class="btn btn-danger" style="width: 100%;" id="btn-stop-action">⏹ 终止投递</button>
      </div>
    `,this.shadowRoot.appendChild(t),this.shadowRoot.appendChild(e);const a=this.shadowRoot.getElementById("pill-toggle");a==null||a.addEventListener("click",()=>{e.classList.toggle("collapsed")});const o=this.shadowRoot.getElementById("btn-main-action");o==null||o.addEventListener("click",()=>{this.isRunning?this.isPaused&&this.resume():this.start()});const i=this.shadowRoot.getElementById("btn-pause-action");i==null||i.addEventListener("click",()=>{this.isRunning&&(this.isPaused?this.resume():this.pause())});const s=this.shadowRoot.getElementById("btn-stop-action");s==null||s.addEventListener("click",()=>{this.stop()})}updateFloatingUI(t){if(!this.shadowRoot)return;const e=this.shadowRoot.getElementById("pill-dot"),a=this.shadowRoot.getElementById("pill-status-text"),o=this.shadowRoot.getElementById("stat-applied"),i=this.shadowRoot.getElementById("stat-target"),s=this.shadowRoot.getElementById("stat-today"),l=this.shadowRoot.getElementById("stat-filtered"),r=this.shadowRoot.getElementById("pill-msg"),n=this.shadowRoot.getElementById("btn-main-action"),c=this.shadowRoot.getElementById("btn-pause-action");if(o&&(o.textContent=String(this.state.appliedCount)),i&&(i.textContent=String(this.state.targetCount)),s&&(s.textContent=String(this.todayCount)),l&&(l.textContent=String(this.state.filteredCount)),r&&(r.textContent=t||this.state.message||"就绪"),e&&a&&n&&c)switch(e.className="status-dot",this.state.status){case"RUNNING":e.classList.add("active"),a.textContent="运行中",n.textContent="正在投递...",c.textContent="⏸ 暂停";break;case"PAUSED":e.classList.add("warn"),a.textContent="已暂停",n.textContent="▶ 继续",c.textContent="▶ 继续";break;case"SECURITY_BLOCKED":e.classList.add("danger"),a.textContent="安全验证",n.textContent="▶ 完成验证后继续";break;case"COMPLETED":e.classList.add("active"),a.textContent="已完成",n.textContent="🚀 再次开始";break;default:a.textContent="就绪",n.textContent="🚀 开始投递",c.textContent="⏸ 暂停"}}}window.location.hostname.includes("zhipin.com")&&new x})();
