import React, { useState } from 'react';
import { JobFilterConfig } from '../../types';

interface ConfigTabProps {
  config: JobFilterConfig;
  onSaveConfig: (newConfig: JobFilterConfig) => void;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<JobFilterConfig>(config);
  const [newKw, setNewKw] = useState('');
  const [newExKw, setNewExKw] = useState('');
  const [newBl, setNewBl] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const updateConfig = (partial: Partial<JobFilterConfig>) => {
    const updated = { ...formData, ...partial };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedToast();
  };

  const showSavedToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1500);
  };

  // 添加包含关键词
  const handleAddKeyword = () => {
    const trimmed = newKw.trim();
    if (trimmed && !formData.keywords.includes(trimmed)) {
      updateConfig({ keywords: [...formData.keywords, trimmed] });
      setNewKw('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    updateConfig({ keywords: formData.keywords.filter((k) => k !== kw) });
  };

  // 添加排除关键词
  const handleAddExclude = () => {
    const trimmed = newExKw.trim();
    if (trimmed && !formData.excludeKeywords.includes(trimmed)) {
      updateConfig({ excludeKeywords: [...formData.excludeKeywords, trimmed] });
      setNewExKw('');
    }
  };

  const handleRemoveExclude = (ex: string) => {
    updateConfig({ excludeKeywords: formData.excludeKeywords.filter((k) => k !== ex) });
  };

  // 添加黑名单企业
  const handleAddBlacklist = () => {
    const trimmed = newBl.trim();
    if (trimmed && !formData.blacklistCompanies.includes(trimmed)) {
      updateConfig({ blacklistCompanies: [...formData.blacklistCompanies, trimmed] });
      setNewBl('');
    }
  };

  const handleRemoveBlacklist = (comp: string) => {
    updateConfig({ blacklistCompanies: formData.blacklistCompanies.filter((c) => c !== comp) });
  };

  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 自动保存浮动提示 */}
      {saveToast && (
        <div style={{
          position: 'fixed',
          top: 65,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#ffffff',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          zIndex: 99,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          ✓ 设置已自动保存并同步
        </div>
      )}

      {/* 包含关键词 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            🎯 目标职位关键词 (留空表示不限)
          </label>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>命中其一即可投递</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            placeholder="输入如：前端、React、全栈"
            style={{
              flex: 1,
              padding: '7px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none'
            }}
          />
          <button
            onClick={handleAddKeyword}
            style={{
              padding: '7px 14px',
              background: '#00bebd',
              color: 'white',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            添加
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 28 }}>
          {formData.keywords.map((kw) => (
            <span
              key={kw}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#e6f9f8',
                color: '#008b8a',
                border: '1px solid #b2efee',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500
              }}
            >
              {kw}
              <button
                onClick={() => handleRemoveKeyword(kw)}
                style={{ background: 'transparent', color: '#008b8a', fontWeight: 'bold', fontSize: 12 }}
              >
                ×
              </button>
            </span>
          ))}
          {formData.keywords.length === 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>无限制，只要符合其他条件均可投递</span>
          )}
        </div>
      </section>

      {/* 排除关键词 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            🚫 过滤排除词 (命中任何一项直接跳过)
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newExKw}
            onChange={(e) => setNewExKw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExclude()}
            placeholder="输入如：外包、外派、兼职"
            style={{
              flex: 1,
              padding: '7px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none'
            }}
          />
          <button
            onClick={handleAddExclude}
            style={{
              padding: '7px 14px',
              background: '#ef4444',
              color: 'white',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            添加
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {formData.excludeKeywords.map((ex) => (
            <span
              key={ex}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 12
              }}
            >
              {ex}
              <button
                onClick={() => handleRemoveExclude(ex)}
                style={{ background: 'transparent', color: '#b91c1c', fontWeight: 'bold', fontSize: 12 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* 黑名单企业 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
          🏢 企业黑名单 (排除指定公司名称)
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newBl}
            onChange={(e) => setNewBl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBlacklist()}
            placeholder="输入公司全称或部分关键词"
            style={{
              flex: 1,
              padding: '7px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none'
            }}
          />
          <button
            onClick={handleAddBlacklist}
            style={{
              padding: '7px 14px',
              background: '#64748b',
              color: 'white',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            添加
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {formData.blacklistCompanies.map((comp) => (
            <span
              key={comp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 12
              }}
            >
              {comp}
              <button
                onClick={() => handleRemoveBlacklist(comp)}
                style={{ background: 'transparent', color: '#64748b', fontWeight: 'bold', fontSize: 12 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* 薪资范围 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
          💰 薪资范围要求 (K)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>最低薪资 (0为不限)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.minSalary}
              onChange={(e) => updateConfig({ minSalary: Number(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 12
              }}
            />
          </div>
          <span style={{ color: '#94a3b8', marginTop: 14 }}>至</span>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>最高薪资 (0为不限)</span>
            <input
              type="number"
              min="0"
              max="200"
              value={formData.maxSalary}
              onChange={(e) => updateConfig({ maxSalary: Number(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 12
              }}
            />
          </div>
        </div>
      </section>

      {/* 防封拟人延时与执行限制 */}
      <section style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
          🛡️ 防封策略与执行上限
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>单次投递上限 (个)</span>
            <input
              type="number"
              min="5"
              max="100"
              value={formData.maxApplyPerRun}
              onChange={(e) => updateConfig({ maxApplyPerRun: Number(e.target.value) || 20 })}
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 12
              }}
            />
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>随机延时 (秒)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.minDelay}
                onChange={(e) => updateConfig({ minDelay: Number(e.target.value) || 3 })}
                style={{ width: '45%', padding: '7px 6px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
              />
              <span style={{ color: '#94a3b8' }}>~</span>
              <input
                type="number"
                min="2"
                max="30"
                value={formData.maxDelay}
                onChange={(e) => updateConfig({ maxDelay: Number(e.target.value) || 7 })}
                style={{ width: '45%', padding: '7px 6px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>自动翻页滚动</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>当前页投完后自动触发翻页或触底加载</div>
          </div>
          <input
            type="checkbox"
            checked={formData.autoScroll}
            onChange={(e) => updateConfig({ autoScroll: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#00bebd' }}
          />
        </div>
      </section>
    </div>
  );
};
