import React from 'react';
import { ApplyState, JobFilterConfig } from '../../types';

interface ControlTabProps {
  state: ApplyState;
  config: JobFilterConfig;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isBossTab: boolean;
}

export const ControlTab: React.FC<ControlTabProps> = ({
  state,
  config,
  onStart,
  onPause,
  onResume,
  onStop,
  isBossTab,
}) => {
  const isRunning = state.status === 'RUNNING';
  const isPaused = state.status === 'PAUSED';
  const isBlocked = state.status === 'SECURITY_BLOCKED';

  // 计算进度百分比 (正交衍生状态，非冗余存储)
  const target = Math.max(1, state.targetCount || config.maxApplyPerRun);
  const progressPercent = Math.min(100, Math.round((state.appliedCount / target) * 100));

  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 提示条（若不在 Boss 直聘页面） */}
      {!isBossTab && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 12,
          color: '#92400e'
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div>
            <strong>提示：当前未在 Boss 直聘求职页</strong>
            <p style={{ marginTop: 2, color: '#b45309' }}>
              请先在浏览器打开并登录 Boss直聘的职位列表页（如搜索前端岗位的页面），再点击下方开始。
            </p>
          </div>
        </div>
      )}

      {/* 核心指标卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 14px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#00bebd' }}>
            {state.appliedCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            本次已沟通
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 14px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#334155' }}>
            {target}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            设定目标上限
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 14px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>
            {state.filteredCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            已过滤排除
          </div>
        </div>
      </div>

      {/* 进度条与实时状态展示 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: '#334155' }}>投递执行进度</span>
          <span style={{ color: '#00bebd' }}>{progressPercent}%</span>
        </div>

        {/* 进度条轨道 */}
        <div style={{
          height: 8,
          background: '#f1f5f9',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #00bebd 0%, #008fcc 100%)',
            borderRadius: 4,
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* 实时状态文本 */}
        <div style={{
          background: '#f8fafc',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 12,
          color: isBlocked ? '#dc2626' : '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 36
        }}>
          <span>{isBlocked ? '⚠️' : isRunning ? '⚡' : '📌'}</span>
          <span style={{ flex: 1, wordBreak: 'break-all' }}>
            {state.message || '系统准备就绪，配置完成后可一键开始投递'}
          </span>
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>防封延时: {config.minDelay}s ~ {config.maxDelay}s 随机等待</span>
          <span>自动翻页: {config.autoScroll ? '已启用' : '未启用'}</span>
        </div>
      </div>

      {/* 控制操作按钮组 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        {!isRunning ? (
          <button
            onClick={onStart}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #00bebd 0%, #00a4a3 100%)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0, 190, 189, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span>🚀</span>
            <span>{state.status === 'COMPLETED' ? '开启新一轮批量投递' : '一键开始批量投递'}</span>
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {isPaused || isBlocked ? (
              <button
                onClick={onResume}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>▶</span>
                <span>恢复继续</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>⏸</span>
                <span>暂停投递</span>
              </button>
            )}

            <button
              onClick={onStop}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span>⏹</span>
              <span>终止任务</span>
            </button>
          </div>
        )}
      </div>

      {/* 快捷说明 */}
      <div style={{
        fontSize: 11,
        color: '#94a3b8',
        lineHeight: 1.6,
        padding: '0 4px'
      }}>
        🛡️ <strong>安全保障原则</strong>：
        本插件采用本地直接渲染模式，完全复用您本地真实的浏览器指纹与 Boss 登录态，单次投递设有随机真人延时，绝不调用任何第三方违规接口，最大限度保障账号安全。
      </div>
    </div>
  );
};
