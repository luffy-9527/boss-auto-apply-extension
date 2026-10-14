import React, { useState, useEffect, useCallback } from 'react';
import {
  JobFilterConfig,
  ApplyState,
  ApplyLog,
  DEFAULT_CONFIG,
  DEFAULT_STATE,
} from '../types';
import {
  getStorageItem,
  setStorageItem,
  sendExtensionMessage,
  isExtension,
} from '../utils/storage';
import { Header } from './components/Header';
import { ControlTab } from './components/ControlTab';
import { ConfigTab } from './components/ConfigTab';
import { LogsTab } from './components/LogsTab';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'control' | 'config' | 'logs'>('control');
  const [config, setConfig] = useState<JobFilterConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<ApplyState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<ApplyLog[]>([]);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isBossTab, setIsBossTab] = useState<boolean>(true);

  // 初始化加载
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const storedConfig = await getStorageItem('config', DEFAULT_CONFIG);
      const storedState = await getStorageItem('state', DEFAULT_STATE);
      const storedLogs = await getStorageItem<ApplyLog[]>('logs', []);
      const storedToday = await getStorageItem<number>('todayCount', 0);

      if (isMounted) {
        setConfig(storedConfig);
        setState(storedState);
        setLogs(storedLogs);
        setTodayCount(storedToday);
      }

      // 检测当前标签页是否在 Boss 直聘
      if (isExtension && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (isMounted) {
          setIsBossTab(Boolean(tab?.url?.includes('zhipin.com')));
        }
      }
    }

    loadInitialData();

    // 监听 storage 变更，实时更新状态
    if (isExtension && chrome.storage?.onChanged) {
      const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
        if (area === 'local' && isMounted) {
          if (changes.state) setState(changes.state.newValue || DEFAULT_STATE);
          if (changes.config) setConfig(changes.config.newValue || DEFAULT_CONFIG);
          if (changes.logs) setLogs(changes.logs.newValue || []);
          if (changes.todayCount) setTodayCount(changes.todayCount.newValue || 0);
        }
      };

      chrome.storage.onChanged.addListener(listener);
      return () => {
        isMounted = false;
        chrome.storage.onChanged.removeListener(listener);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStart = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'RUNNING', message: '正在启动投递...' }));
    await sendExtensionMessage({ action: 'START' });
  }, []);

  const handlePause = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'PAUSED', message: '已请求暂停' }));
    await sendExtensionMessage({ action: 'PAUSE' });
  }, []);

  const handleResume = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'RUNNING', message: '正在继续投递...' }));
    await sendExtensionMessage({ action: 'RESUME' });
  }, []);

  const handleStop = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'IDLE', message: '已停止' }));
    await sendExtensionMessage({ action: 'STOP' });
  }, []);

  const handleSaveConfig = useCallback(async (newConfig: JobFilterConfig) => {
    setConfig(newConfig);
    await setStorageItem('config', newConfig);
  }, []);

  const handleClearLogs = useCallback(async () => {
    setLogs([]);
    await setStorageItem('logs', []);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f8fafc' }}>
      <Header status={state.status} todayCount={todayCount} />

      {/* 顶部选项卡切换 */}
      <nav style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        padding: '0 18px',
        position: 'sticky',
        top: 61,
        zIndex: 10
      }}>
        {[
          { key: 'control', label: '🎯 投递控制' },
          { key: 'config', label: '⚙️ 规则设置' },
          { key: 'logs', label: `📜 明细日志 (${logs.length})` },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #00bebd' : '2px solid transparent',
                color: active ? '#00bebd' : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 选项卡内容区 */}
      <main style={{ flex: 1 }}>
        {activeTab === 'control' && (
          <ControlTab
            state={state}
            config={config}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            isBossTab={isBossTab}
          />
        )}
        {activeTab === 'config' && (
          <ConfigTab config={config} onSaveConfig={handleSaveConfig} />
        )}
        {activeTab === 'logs' && (
          <LogsTab logs={logs} onClearLogs={handleClearLogs} />
        )}
      </main>
    </div>
  );
};
