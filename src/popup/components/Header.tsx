import React from 'react';
import { RunningStatus } from '../../types';

interface HeaderProps {
  status: RunningStatus;
  todayCount: number;
}

export const Header: React.FC<HeaderProps> = ({ status, todayCount }) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'RUNNING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="animate-pulse-dot" />
            投递运行中
          </span>
        );
      case 'PAUSED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#d97706', background: '#fffbeb', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
            已暂停
          </span>
        );
      case 'SECURITY_BLOCKED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            滑块验证中
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
            🎉 达到上限/完成
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500 }}>
            就绪
          </span>
        );
    }
  };

  const handleOpenZhipin = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://www.zhipin.com/web/geek/job' });
    } else {
      window.open('https://www.zhipin.com/web/geek/job', '_blank');
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #00bebd 0%, #0088cc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: 16
        }}>
          B
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            Boss 一键投递助手
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            今日已沟通: <strong style={{ color: '#00bebd' }}>{todayCount}</strong> 人
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {getStatusBadge()}
        <button
          onClick={handleOpenZhipin}
          title="跳转 Boss 直聘职位列表"
          style={{
            padding: '5px 10px',
            fontSize: 11,
            borderRadius: 6,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontWeight: 500
          }}
        >
          打开Boss
        </button>
      </div>
    </header>
  );
};
