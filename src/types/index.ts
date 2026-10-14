export interface JobFilterConfig {
  /** 期望包含关键词（任意一个命中即可，空表示不限） */
  keywords: string[];
  /** 必须排除的关键词（命中任何一个即跳过） */
  excludeKeywords: string[];
  /** 最低薪资要求（K），0 表示不限 */
  minSalary: number;
  /** 最高薪资（K），0 表示不限 */
  maxSalary: number;
  /** 企业黑名单（命中任意一个即跳过） */
  blacklistCompanies: string[];
  /** 每次投递最小等待时间（秒） */
  minDelay: number;
  /** 每次投递最大等待时间（秒） */
  maxDelay: number;
  /** 单次批处理投递数量上限 */
  maxApplyPerRun: number;
  /** 是否自动滚动页面加载更多岗位 */
  autoScroll: boolean;
  /** 自定义打招呼语（留空使用 Boss 默认招呼语） */
  sayHiMessage: string;
}

export type RunningStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'SECURITY_BLOCKED' | 'COMPLETED';

export interface ApplyState {
  status: RunningStatus;
  appliedCount: number;
  targetCount: number;
  filteredCount: number;
  currentJobName?: string;
  currentCompany?: string;
  message?: string;
}

export interface ApplyLog {
  id: string;
  time: string;
  jobTitle: string;
  company: string;
  salary: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'WARN';
  reason: string;
}

export interface StorageData {
  config: JobFilterConfig;
  state: ApplyState;
  logs: ApplyLog[];
  todayCount: number;
  lastDate: string;
}

export const DEFAULT_CONFIG: JobFilterConfig = {
  keywords: ['前端', 'Web', 'React'],
  excludeKeywords: ['外包', '外派', '驻场', '兼职', '实习生', '培训'],
  minSalary: 0,
  maxSalary: 0,
  blacklistCompanies: ['某某人力', '劳务派遣'],
  minDelay: 3,
  maxDelay: 7,
  maxApplyPerRun: 25,
  autoScroll: true,
  sayHiMessage: '',
};

export const DEFAULT_STATE: ApplyState = {
  status: 'IDLE',
  appliedCount: 0,
  targetCount: 25,
  filteredCount: 0,
};
