import React, { useState } from 'react';
import { ApplyLog } from '../../types';

interface LogsTabProps {
  logs: ApplyLog[];
  onClearLogs: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'SUCCESS' | 'SKIPPED' | 'WARN'>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'WARN') return log.status === 'WARN' || log.status === 'FAILED';
    return log.status === filterType;
  });

  const getStatusBadge = (status: ApplyLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
            已投递
          </span>
        );
      case 'SKIPPED':
        return (
          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#64748b' }}>
            已过滤
          </span>
        );
      case 'WARN':
      case 'FAILED':
        return (
          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>
            提示/告警
          </span>
        );
    }
  };

  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 顶部过滤条与清空按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'SUCCESS', 'SKIPPED', 'WARN'] as const).map((type) => {
            const labels = {
              ALL: '全部',
              SUCCESS: '成功投递',
              SKIPPED: '已过滤',
              WARN: '告警/风控',
            };
            const active = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  background: active ? '#00bebd' : '#f1f5f9',
                  color: active ? '#ffffff' : '#64748b',
                }}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              color: '#94a3b8',
              background: 'transparent',
              textDecoration: 'underline'
            }}
          >
            清空日志
          </button>
        )}
      </div>

      {/* 记录列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
        {filteredLogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#94a3b8',
            fontSize: 12
          }}>
            暂无相关投递明细记录
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {log.company} · {log.jobTitle}
                </span>
                {getStatusBadge(log.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                <span style={{ color: '#00bebd', fontWeight: 600 }}>{log.salary}</span>
                <span>{log.time}</span>
              </div>

              <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '4px 6px', borderRadius: 4, marginTop: 2 }}>
                原因: {log.reason}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
