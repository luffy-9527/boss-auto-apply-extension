import {
  JobFilterConfig,
  ApplyState,
  ApplyLog,
  DEFAULT_CONFIG,
  DEFAULT_STATE,
  StorageData,
} from '../types';
import { evaluateJob, JobCardData } from './filter';

class BossAutoApplyManager {
  private config: JobFilterConfig = { ...DEFAULT_CONFIG };
  private state: ApplyState = { ...DEFAULT_STATE };
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private abortController: AbortController | null = null;
  private rootContainer: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  /** 已处理过的岗位唯一标识集合（防止单轮或多轮循环中重复比对与计数） */
  private processedKeys: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    console.log('[BossAutoApply] 投递助手内容脚本已加载');
    await this.loadConfigAndState();
    this.createFloatingUI();
    this.listenMessages();
    this.listenStorageChanges();
  }

  /**
   * 从 chrome.storage.local 加载配置
   */
  private async loadConfigAndState() {
    try {
      const data = (await chrome.storage.local.get([
        'config',
        'state',
        'todayCount',
        'lastDate',
      ])) as Partial<StorageData>;

      if (data.config) {
        this.config = { ...DEFAULT_CONFIG, ...data.config };
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      let todayCount = data.todayCount || 0;
      if (data.lastDate !== todayStr) {
        todayCount = 0;
        await chrome.storage.local.set({ todayCount: 0, lastDate: todayStr });
      }

      this.state = {
        ...DEFAULT_STATE,
        targetCount: this.config.maxApplyPerRun,
        appliedCount: todayCount,
      };

      this.updateFloatingUI();
    } catch (e) {
      console.error('[BossAutoApply] 加载本地存储失败:', e);
    }
  }

  private listenMessages() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      (async () => {
        if (message.action === 'START') {
          await this.start();
          sendResponse({ success: true, state: this.state });
        } else if (message.action === 'PAUSE') {
          this.pause();
          sendResponse({ success: true, state: this.state });
        } else if (message.action === 'RESUME') {
          this.resume();
          sendResponse({ success: true, state: this.state });
        } else if (message.action === 'STOP') {
          this.stop();
          sendResponse({ success: true, state: this.state });
        } else if (message.action === 'GET_STATE') {
          sendResponse({ success: true, state: this.state, config: this.config });
        }
      })();
      return true;
    });
  }

  private listenStorageChanges() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.config) {
          this.config = { ...this.config, ...changes.config.newValue };
          this.state.targetCount = this.config.maxApplyPerRun;
          this.updateFloatingUI();
        }
      }
    });
  }

  private async addLog(log: Omit<ApplyLog, 'id' | 'time'>) {
    const newLog: ApplyLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      ...log,
    };

    try {
      const { logs = [] } = (await chrome.storage.local.get('logs')) as { logs?: ApplyLog[] };
      const updatedLogs = [newLog, ...logs].slice(0, 100);
      await chrome.storage.local.set({ logs: updatedLogs });
    } catch (err) {
      console.warn('[BossAutoApply] 记录日志失败:', err);
    }

    this.updateFloatingUI(newLog.reason);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getRandomDelay(): number {
    const min = Math.max(1, this.config.minDelay) * 1000;
    const max = Math.max(min, this.config.maxDelay * 1000);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 提取当前页面左侧列表中的所有岗位卡片
   */
  private extractJobCards(): JobCardData[] {
    const cardSelectors = [
      '.job-card-wrapper',
      'li.job-card-box',
      '.job-card-box',
      '[class*="job-card-wrapper"]',
      'ul.job-list-box > li',
      '.job-list-container li',
    ];

    let elements: HTMLElement[] = [];
    for (const sel of cardSelectors) {
      const found = Array.from(document.querySelectorAll<HTMLElement>(sel));
      if (found.length > 0) {
        elements = found;
        break;
      }
    }

    // 后备方案：通过 job-name 向上反查卡片外层
    if (elements.length === 0) {
      const nameEls = Array.from(document.querySelectorAll<HTMLElement>('.job-name, .job-title, [class*="job-name"]'));
      elements = Array.from(
        new Set(
          nameEls
            .map((el) => el.closest<HTMLElement>('li, .job-card-wrapper, div[class*="card"]'))
            .filter((el): el is HTMLElement => Boolean(el))
        )
      );
    }

    return elements.map((element) => {
      const titleEl = element.querySelector<HTMLElement>('.job-name, .job-title, [class*="job-name"], .job-title-box');
      const salaryEl = element.querySelector<HTMLElement>('.salary, [class*="salary"]');
      const companyEl = element.querySelector<HTMLElement>('.company-name, [class*="company-name"], .company-info');
      const tagsEl = element.querySelector<HTMLElement>('.tag-list, .job-info, [class*="tag-list"], .job-desc');

      // 检查卡片是否已标记为已沟通
      const isChated = Boolean(
        element.querySelector('.chated, .has-chated, .is-chated, [class*="chated"]') ||
        element.innerText.includes('已沟通') ||
        element.innerText.includes('继续沟通')
      );

      // 单卡片内如果自带按钮（如某些旧版视图）
      const btnEl = element.querySelector<HTMLElement>(
        '.btn-startchat, [class*="btn-startchat"], a[ka*="start_chat"], button[ka*="start_chat"]'
      );

      return {
        title: titleEl?.innerText?.trim() || '',
        company: companyEl?.innerText?.trim() || '',
        salaryText: salaryEl?.innerText?.trim() || '',
        tagsText: tagsEl?.innerText?.trim() || '',
        buttonText: btnEl?.innerText?.trim() || '',
        isChated,
        element,
        buttonElement: btnEl || undefined,
      };
    });
  }

  /**
   * 查找页面（特别是右侧详情面板）中的“立即沟通”或“继续沟通”按钮
   */
  private findChatButton(): HTMLElement | null {
    // 1. 优先在右侧职位详情区查找
    const detailAreas = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.job-detail-box, .job-detail-container, .job-banner, .detail-content, .job-sider, .job-detail-header'
      )
    );

    for (const area of detailAreas) {
      const btns = Array.from(area.querySelectorAll<HTMLElement>('a, button, div.btn, span.btn, .btn'));
      const found = btns.find((b) => {
        const txt = b.innerText?.trim();
        return (txt === '立即沟通' || txt === '继续沟通' || txt === '打招呼') && b.offsetParent !== null;
      });
      if (found) return found;
    }

    // 2. 直接根据 Class 与属性选择器查找
    const directBtn = document.querySelector<HTMLElement>(
      '.btn-startchat, [class*="btn-startchat"], a[ka*="startchat"], a[ka*="start_chat"], button[ka*="startchat"]'
    );
    if (directBtn && directBtn.offsetParent !== null) {
      return directBtn;
    }

    // 3. 全局查找包含“立即沟通”或“继续沟通”的可见元素（过滤掉插件自身的浮窗元素）
    const allCandidates = Array.from(document.querySelectorAll<HTMLElement>('a, button, span, div[role="button"]'));
    return (
      allCandidates.find((el) => {
        if (el.closest('#boss-auto-apply-pill-host')) return false;
        const txt = el.innerText?.trim();
        return (txt === '立即沟通' || txt === '继续沟通') && el.offsetParent !== null;
      }) || null
    );
  }

  /**
   * 智能滚动列表容器（适配 Boss 直聘双栏布局下的左侧列表容器滚动）
   */
  private scrollJobList(targetCard?: HTMLElement) {
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 查找左侧列表的滚动父容器
    let parent = targetCard?.parentElement || null;
    let foundScrollParent = false;

    while (parent && parent !== document.body) {
      const overflow = window.getComputedStyle(parent).overflowY;
      if (['auto', 'scroll'].includes(overflow) && parent.scrollHeight > parent.clientHeight) {
        parent.scrollBy({ top: 600, behavior: 'smooth' });
        foundScrollParent = true;
        break;
      }
      parent = parent.parentElement;
    }

    // 尝试常见的容器类名
    const listContainers = document.querySelectorAll<HTMLElement>(
      '.job-list-box, .job-tab-box, .job-card-box-scroll, ul.job-list-box, .job-list-container'
    );
    listContainers.forEach((el) => {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollBy({ top: 600, behavior: 'smooth' });
        foundScrollParent = true;
      }
    });

    if (!foundScrollParent) {
      window.scrollBy({ top: 600, behavior: 'smooth' });
    }
  }

  /**
   * 检测是否有风控、滑块验证或打招呼确认弹窗
   */
  private checkPopupsAndDialogs(): {
    isBlocked: boolean;
    isLimitReached: boolean;
    hasGreetConfirm: HTMLElement | null;
  } {
    // 1. 检查滑块验证码
    const geetest = document.querySelector(
      '.geetest_radar, .geetest_popup, [class*="geetest"], [class*="captcha-box"], [class*="dialog-box"][class*="verify"]'
    );
    if (geetest && geetest.getBoundingClientRect().width > 0) {
      return { isBlocked: true, isLimitReached: false, hasGreetConfirm: null };
    }

    // 2. 检查当日沟通上限弹窗
    const dialogs = Array.from(
      document.querySelectorAll<HTMLElement>('.dialog-wrap, .dialog-container, .boss-dialog, [role="dialog"]')
    );
    for (const dlg of dialogs) {
      const text = dlg.innerText || '';
      if (text.includes('今日沟通人数已达上限') || text.includes('今日沟通已达上限') || text.includes('沟通次数达上限')) {
        return { isBlocked: false, isLimitReached: true, hasGreetConfirm: null };
      }
    }

    // 3. 检查快捷打招呼弹窗（确认发送按钮）
    for (const dlg of dialogs) {
      const confirmBtn = Array.from(dlg.querySelectorAll<HTMLElement>('button, .btn, a')).find((b) => {
        const txt = b.innerText?.trim();
        return txt === '确定' || txt === '发送' || txt === '打招呼' || txt === '发消息';
      });
      if (confirmBtn) {
        return { isBlocked: false, isLimitReached: false, hasGreetConfirm: confirmBtn };
      }
    }

    return { isBlocked: false, isLimitReached: false, hasGreetConfirm: null };
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();
    this.processedKeys.clear(); // 新一轮启动时重置处理记录

    this.state.status = 'RUNNING';
    this.state.message = '🚀 批量投递运行中...';
    this.updateFloatingUI();
    await this.syncStateToStorage();

    await this.executeLoop();
  }

  public pause() {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.state.status = 'PAUSED';
    this.state.message = '⏸ 任务已暂停';
    this.updateFloatingUI();
    this.syncStateToStorage();
  }

  public resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.state.status = 'RUNNING';
    this.state.message = '🚀 投递继续运行中...';
    this.updateFloatingUI();
    this.syncStateToStorage();
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.state.status = 'IDLE';
    this.state.message = '已停止';
    this.updateFloatingUI();
    this.syncStateToStorage();
  }

  /**
   * 投递自动化主循环
   */
  private async executeLoop() {
    let emptyRounds = 0;

    while (this.isRunning) {
      while (this.isPaused && this.isRunning) {
        await this.sleep(1000);
      }
      if (!this.isRunning) break;

      // 检查投递上限
      if (this.state.appliedCount >= this.state.targetCount) {
        this.state.status = 'COMPLETED';
        this.state.message = `🎉 已达到设定投递上限 (${this.state.targetCount} 个)，任务完成`;
        this.isRunning = false;
        await this.addLog({
          jobTitle: '-',
          company: '-',
          salary: '-',
          status: 'SUCCESS',
          reason: `已达成单次投递目标: ${this.state.targetCount} 个`,
        });
        break;
      }

      // 提取页面卡片
      const cards = this.extractJobCards();
      if (cards.length === 0) {
        this.state.message = '未检测到岗位列表，正在滚动加载...';
        this.updateFloatingUI();
        this.scrollJobList();
        await this.sleep(2500);
        emptyRounds++;
        if (emptyRounds > 6) {
          this.state.message = '未在当前页面找到可识别岗位列表，请确认是否处于岗位列表页';
          this.stop();
          break;
        }
        continue;
      }

      let newlyHandledInThisRound = 0;

      for (const card of cards) {
        if (!this.isRunning) break;
        while (this.isPaused && this.isRunning) {
          await this.sleep(1000);
        }
        if (this.state.appliedCount >= this.state.targetCount) break;

        // 生成唯一标识（公司名 + 岗位名 + 薪资），避免同一卡片反复比对
        const cardKey = `${card.company}_${card.title}_${card.salaryText}`.trim();
        if (this.processedKeys.has(cardKey)) {
          continue; // 本轮已处理过，跳过
        }
        this.processedKeys.add(cardKey);
        newlyHandledInThisRound++;

        // 规则初筛（关键词/薪资/黑名单）
        const evaluation = evaluateJob(card, this.config);
        if (!evaluation.pass) {
          if (!evaluation.reason.includes('已沟通')) {
            this.state.filteredCount++;
            await this.addLog({
              jobTitle: card.title || '未知岗位',
              company: card.company || '未知企业',
              salary: card.salaryText || '面议',
              status: 'SKIPPED',
              reason: evaluation.reason,
            });
          }
          continue;
        }

        // 岗位初筛通过，准备在页面上激活该岗位
        this.state.currentJobName = card.title;
        this.state.currentCompany = card.company;
        this.state.message = `正在查看: ${card.company} · ${card.title}`;
        this.updateFloatingUI();

        // 平滑滚动并点击卡片，使右侧详情面板载入
        this.scrollJobList(card.element);
        await this.sleep(600);

        // 点击卡片上的链接或自身
        const clickTarget = card.element.querySelector<HTMLElement>('a, .job-name, .job-title') || card.element;
        clickTarget.click();
        await this.sleep(1000 + Math.random() * 500);

        // 在右侧详情面板中查找沟通按钮
        const chatBtn = this.findChatButton();
        if (!chatBtn) {
          console.warn('[BossAutoApply] 未找到沟通按钮:', card.title);
          continue;
        }

        const btnText = chatBtn.innerText?.trim() || '';
        if (btnText.includes('继续沟通')) {
          await this.addLog({
            jobTitle: card.title,
            company: card.company,
            salary: card.salaryText,
            status: 'SKIPPED',
            reason: '详情显示已沟通过，跳过',
          });
          continue;
        }

        if (btnText.includes('立即沟通') || btnText.includes('打招呼')) {
          try {
            this.state.message = `正在发起沟通: ${card.company} · ${card.title}`;
            this.updateFloatingUI();

            // 点击沟通按钮
            chatBtn.click();
            await this.sleep(1500);

            // 检查弹窗状态（滑块/上限/二次打招呼确认框）
            const popupStatus = this.checkPopupsAndDialogs();

            if (popupStatus.isBlocked) {
              this.state.status = 'SECURITY_BLOCKED';
              this.state.message = '⚠️ 触发安全滑块验证，已自动暂停！请手动在页面完成验证。';
              this.isPaused = true;
              await this.addLog({
                jobTitle: card.title,
                company: card.company,
                salary: card.salaryText,
                status: 'WARN',
                reason: '触发安全验证码，自动化紧急熔断暂停',
              });
              this.updateFloatingUI();
              break;
            }

            if (popupStatus.isLimitReached) {
              this.state.status = 'COMPLETED';
              this.state.message = '🛑 触发Boss直聘官方每日打招呼上限，已自动终止。';
              this.isRunning = false;
              await this.addLog({
                jobTitle: card.title,
                company: card.company,
                salary: card.salaryText,
                status: 'WARN',
                reason: '已达到Boss平台今日沟通上限',
              });
              this.updateFloatingUI();
              break;
            }

            if (popupStatus.hasGreetConfirm) {
              popupStatus.hasGreetConfirm.click();
              await this.sleep(1000);
            }

            // 投递成功
            this.state.appliedCount++;
            await this.addLog({
              jobTitle: card.title,
              company: card.company,
              salary: card.salaryText,
              status: 'SUCCESS',
              reason: '已成功发起沟通',
            });

            await this.incrementTodayCount();

            // 防封拟人延时
            const delay = this.getRandomDelay();
            this.state.message = `✅ 成功沟通！防封等待 ${(delay / 1000).toFixed(1)} 秒...`;
            this.updateFloatingUI();
            await this.sleep(delay);
          } catch (clickErr) {
            console.error('[BossAutoApply] 点击异常:', clickErr);
          }
        }
      }

      // 如果当前可视区域的卡片均已处理，滚动加载更多
      if (this.isRunning && this.state.appliedCount < this.state.targetCount) {
        if (this.config.autoScroll) {
          this.state.message = '正在加载更多岗位...';
          this.updateFloatingUI();

          const lastCard = cards[cards.length - 1]?.element;
          this.scrollJobList(lastCard);

          // 尝试查找下一页按钮（如果页面为分页模式）
          const nextBtn = document.querySelector<HTMLElement>(
            '.ui-icon-arrow-right, a.next:not(.disabled), .pagination-area .next'
          );
          if (nextBtn) {
            nextBtn.click();
            await this.sleep(2500);
          } else {
            await this.sleep(2000);
          }

          if (newlyHandledInThisRound === 0) {
            emptyRounds++;
            if (emptyRounds >= 4) {
              this.state.message = '已无更多新岗位，投递完成';
              this.stop();
              break;
            }
          } else {
            emptyRounds = 0;
          }
        } else {
          this.state.message = '当前列表已处理完毕（未启用自动加载），任务结束';
          this.stop();
          break;
        }
      }
    }

    this.updateFloatingUI();
    await this.syncStateToStorage();
  }

  private async incrementTodayCount() {
    const { todayCount = 0 } = (await chrome.storage.local.get('todayCount')) as { todayCount?: number };
    const todayStr = new Date().toISOString().slice(0, 10);
    await chrome.storage.local.set({
      todayCount: todayCount + 1,
      lastDate: todayStr,
    });
  }

  private async syncStateToStorage() {
    try {
      await chrome.storage.local.set({ state: this.state });
    } catch (err) {
      console.warn('[BossAutoApply] 同步状态失败:', err);
    }
  }

  /**
   * 页面右下角悬浮胶囊控制台 (原生 Shadow DOM 隔离)
   */
  private createFloatingUI() {
    if (this.rootContainer) return;

    this.rootContainer = document.createElement('div');
    this.rootContainer.id = 'boss-auto-apply-pill-host';
    this.rootContainer.style.position = 'fixed';
    this.rootContainer.style.bottom = '24px';
    this.rootContainer.style.right = '24px';
    this.rootContainer.style.zIndex = '999999';
    document.body.appendChild(this.rootContainer);

    this.shadowRoot = this.rootContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
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
    `;

    const container = document.createElement('div');
    container.className = 'pill-container';
    container.innerHTML = `
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
            <span class="stat-label">已投递</span>
          </div>
          <div class="stat-item">
            <span class="stat-num" id="stat-target">25</span>
            <span class="stat-label">目标限额</span>
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
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);

    const toggleEl = this.shadowRoot.getElementById('pill-toggle');
    toggleEl?.addEventListener('click', () => {
      container.classList.toggle('collapsed');
    });

    const btnMain = this.shadowRoot.getElementById('btn-main-action');
    btnMain?.addEventListener('click', () => {
      if (!this.isRunning) {
        this.start();
      } else if (this.isPaused) {
        this.resume();
      }
    });

    const btnPause = this.shadowRoot.getElementById('btn-pause-action');
    btnPause?.addEventListener('click', () => {
      if (this.isRunning) {
        if (this.isPaused) {
          this.resume();
        } else {
          this.pause();
        }
      }
    });

    const btnStop = this.shadowRoot.getElementById('btn-stop-action');
    btnStop?.addEventListener('click', () => {
      this.stop();
    });
  }

  private updateFloatingUI(customReason?: string) {
    if (!this.shadowRoot) return;

    const dot = this.shadowRoot.getElementById('pill-dot');
    const statusText = this.shadowRoot.getElementById('pill-status-text');
    const statApplied = this.shadowRoot.getElementById('stat-applied');
    const statTarget = this.shadowRoot.getElementById('stat-target');
    const statFiltered = this.shadowRoot.getElementById('stat-filtered');
    const pillMsg = this.shadowRoot.getElementById('pill-msg');
    const btnMain = this.shadowRoot.getElementById('btn-main-action');
    const btnPause = this.shadowRoot.getElementById('btn-pause-action');

    if (statApplied) statApplied.textContent = String(this.state.appliedCount);
    if (statTarget) statTarget.textContent = String(this.state.targetCount);
    if (statFiltered) statFiltered.textContent = String(this.state.filteredCount);

    if (pillMsg) {
      pillMsg.textContent = customReason || this.state.message || '就绪';
    }

    if (dot && statusText && btnMain && btnPause) {
      dot.className = 'status-dot';

      switch (this.state.status) {
        case 'RUNNING':
          dot.classList.add('active');
          statusText.textContent = '运行中';
          btnMain.textContent = '正在投递...';
          btnPause.textContent = '⏸ 暂停';
          break;
        case 'PAUSED':
          dot.classList.add('warn');
          statusText.textContent = '已暂停';
          btnMain.textContent = '▶ 继续';
          btnPause.textContent = '▶ 继续';
          break;
        case 'SECURITY_BLOCKED':
          dot.classList.add('danger');
          statusText.textContent = '安全验证';
          btnMain.textContent = '▶ 完成验证后继续';
          break;
        case 'COMPLETED':
          dot.classList.add('active');
          statusText.textContent = '已完成';
          btnMain.textContent = '🚀 再次开始';
          break;
        default:
          statusText.textContent = '就绪';
          btnMain.textContent = '🚀 开始投递';
          btnPause.textContent = '⏸ 暂停';
      }
    }
  }
}

if (window.location.hostname.includes('zhipin.com')) {
  new BossAutoApplyManager();
}
