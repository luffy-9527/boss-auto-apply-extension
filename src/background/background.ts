import { DEFAULT_CONFIG, DEFAULT_STATE } from '../types';

// 监听扩展安装/更新，初始化配置
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[BossAutoApply] 扩展已安装/更新:', details.reason);
  const data = await chrome.storage.local.get(['config', 'state', 'todayCount', 'lastDate']);

  const todayStr = new Date().toISOString().slice(0, 10);
  const updates: Record<string, unknown> = {};

  if (!data.config) {
    updates.config = DEFAULT_CONFIG;
  }
  if (!data.state) {
    updates.state = DEFAULT_STATE;
  }
  if (!data.lastDate || data.lastDate !== todayStr) {
    updates.todayCount = 0;
    updates.lastDate = todayStr;
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }

  // 设置徽标背景色
  await chrome.action.setBadgeBackgroundColor({ color: '#00bebd' });
});

// 监听存储变化，动态更新插件徽标数字
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.todayCount) {
    const count = changes.todayCount.newValue || 0;
    const text = count > 0 ? String(count) : '';
    await chrome.action.setBadgeText({ text });
  }
});

// 监听跨脚本消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.action === 'OPEN_ZHIPIN') {
      const tab = await chrome.tabs.create({ url: 'https://www.zhipin.com/web/geek/job' });
      sendResponse({ success: true, tabId: tab.id });
    }
  })();
  return true;
});
