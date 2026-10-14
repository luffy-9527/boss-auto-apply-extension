import { JobFilterConfig } from '../types';

export interface JobCardData {
  title: string;
  company: string;
  salaryText: string;
  tagsText: string;
  buttonText?: string;
  isChated?: boolean;
  element: HTMLElement;
  buttonElement?: HTMLElement;
}

export interface FilterResult {
  pass: boolean;
  reason: string;
}

/**
 * 解析 Boss 直聘薪资文本，例如 "15-25K", "20-35K·14薪", "12-18K"
 * 返回 [minK, maxK]
 */
export function parseSalaryRange(text: string): [number, number] | null {
  if (!text) return null;
  const match = text.match(/(\d+)(?:-(\d+))?[kK]/);
  if (!match) return null;
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  return [min, max];
}

/**
 * 校验岗位是否满足用户配置规则
 * 注意：在 Boss 直聘的双栏列表中，卡片本身没有“立即沟通”按钮，按钮位于右侧详情面板中。
 * 因此此处只针对岗位核心信息进行筛选，沟通状态由详情页真实按钮及卡片状态二次判定。
 */
export function evaluateJob(job: JobCardData, config: JobFilterConfig): FilterResult {
  const normTitle = (job.title || '').toLowerCase();
  const normCompany = (job.company || '').toLowerCase();
  const normTags = (job.tagsText || '').toLowerCase();
  const fullText = `${normTitle} ${normCompany} ${normTags}`;

  // 1. 检查是否已经沟通过
  if (job.isChated) {
    return { pass: false, reason: '已沟通过，跳过' };
  }
  const btnText = (job.buttonText || '').trim();
  if (btnText && btnText.includes('继续沟通')) {
    return { pass: false, reason: '已沟通过，跳过' };
  }

  // 2. 检查黑名单企业
  for (const bl of config.blacklistCompanies) {
    const item = bl.trim().toLowerCase();
    if (item && normCompany.includes(item)) {
      return { pass: false, reason: `命中企业黑名单: ${bl}` };
    }
  }

  // 3. 检查排除关键词（外包、外派、驻场、兼职等）
  for (const ex of config.excludeKeywords) {
    const item = ex.trim().toLowerCase();
    if (item && fullText.includes(item)) {
      return { pass: false, reason: `包含排除关键词: ${ex}` };
    }
  }

  // 4. 检查期望包含关键词（若设置了，则岗位名称或标签必须命中其一）
  if (config.keywords.length > 0) {
    const matched = config.keywords.some((kw) => {
      const item = kw.trim().toLowerCase();
      return item && (normTitle.includes(item) || normTags.includes(item));
    });
    if (!matched) {
      return { pass: false, reason: `未包含目标岗位关键词` };
    }
  }

  // 5. 检查薪资范围
  const salaryRange = parseSalaryRange(job.salaryText);
  if (salaryRange) {
    const [jobMin, jobMax] = salaryRange;
    if (config.minSalary > 0 && jobMax < config.minSalary) {
      return { pass: false, reason: `岗位薪资上限(${jobMax}K)低于期望最低薪资(${config.minSalary}K)` };
    }
    if (config.maxSalary > 0 && jobMin > config.maxSalary) {
      return { pass: false, reason: `岗位起薪(${jobMin}K)高于期望最高薪资(${config.maxSalary}K)` };
    }
  }

  return { pass: true, reason: '符合条件' };
}
