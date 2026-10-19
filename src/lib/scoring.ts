import type { Bucket, Job, ScoreBreakdown } from "./types";

/**
 * 竞争压力分规则（全部基于岗位表里可核查的字段，不含任何分数线预测）
 * 分数越高 = 该岗位预计竞争越激烈。
 */
export const SCORE_RULES = {
  headcount: { le1: 30, eq2: 18, eq3: 10, ge4: 4 },
  majorWidth: { wide: 16, medium: 9, narrow: 0 }, // 类目数 >=10 / 6-9 / <=5
  grassrootsUnlimited: 12,
  level: { province: 14, city: 7, county: 0 },
  location: { capital: 30, urban: 8, other: 0 },
  englishGate: -6,
  thresholds: { chong: 55, wen: 38 },
} as const;

export const SCORE_FORMULA_TEXT = [
  "招录人数：1 人 +30 / 2 人 +18 / 3 人 +10 / ≥4 人 +4",
  "专业口径：≥10 类 +16 / 6-9 类 +9 / ≤5 类 +0（口径越窄可报人群越少）",
  "基层要求：无限制 +12 / 有年限要求 +0（有要求可挡掉应届与未就业者）",
  "机构层级：省（副省）级 +14 / 市（地）级 +7 / 县（区）级及以下 +0",
  "工作地点：省会/直辖市 +30 / 市辖区 +8 / 县及县级市 +0",
  "英语门槛：备注要求四六级 -6",
  "分档：≥55 冲；38-54 稳；<38 保",
];

const CAPITALS = [
  "北京", "上海", "天津", "重庆", "石家庄", "太原", "呼和浩特", "沈阳", "长春", "哈尔滨",
  "南京", "杭州", "合肥", "福州", "南昌", "济南", "郑州", "武汉", "长沙", "广州", "南宁",
  "海口", "成都", "贵阳", "昆明", "拉萨", "西安", "兰州", "西宁", "银川", "乌鲁木齐",
];

/** 统计专业要求的"类目"数量：按 、，,；; 切分后去重计数 */
export function countMajorCategories(major: string): number {
  if (!major) return 0;
  const parts = major
    .split(/[、,，;；]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(parts).size;
}

/** 取出专业要求里的"本科段"（形如 "本科：xxx；研究生：yyy" 时只保留本科部分） */
export function bachelorSegment(major: string): string {
  if (!major) return "";
  if (/本科\s*[：:]/.test(major)) {
    return major.split(/研究生\s*[：:]/)[0];
  }
  return major;
}

function locationScore(location: string): { value: number; note?: string } {
  if (!location) return { value: 0 };
  if (CAPITALS.some((c) => location.includes(c))) {
    return { value: SCORE_RULES.location.capital, note: "地点为省会/直辖市" };
  }
  if (/区$/.test(location.trim())) {
    return { value: SCORE_RULES.location.urban, note: "地点为市辖区" };
  }
  return { value: SCORE_RULES.location.other };
}

export function scoreJob(job: Job): {
  score: number;
  bucket: Bucket;
  breakdown: ScoreBreakdown;
  notes: string[];
} {
  const notes: string[] = [];
  const hc = job.headcount || 0;
  let headcount: number = SCORE_RULES.headcount.ge4;
  if (hc <= 1) headcount = SCORE_RULES.headcount.le1;
  else if (hc === 2) headcount = SCORE_RULES.headcount.eq2;
  else if (hc === 3) headcount = SCORE_RULES.headcount.eq3;

  const n = countMajorCategories(job.major);
  let majorWidth: number = SCORE_RULES.majorWidth.narrow;
  if (n >= 10) majorWidth = SCORE_RULES.majorWidth.wide;
  else if (n >= 6) majorWidth = SCORE_RULES.majorWidth.medium;
  notes.push(`专业口径 ${n} 类`);

  const grassroots = job.grassroots.includes("无限制") ? SCORE_RULES.grassrootsUnlimited : 0;
  if (grassroots) notes.push("基层年限无要求（应届可报，竞争更大）");

  let level: number = SCORE_RULES.level.county;
  if (job.instLevel.includes("省")) level = SCORE_RULES.level.province;
  else if (job.instLevel.includes("市")) level = SCORE_RULES.level.city;
  if (level) notes.push(`机构层级 ${job.instLevel}`);

  const loc = locationScore(job.location);
  if (loc.note) notes.push(loc.note);

  const english = /英语|四级|六级/.test(job.remarks) ? SCORE_RULES.englishGate : 0;
  if (english) notes.push("岗位有英语等级门槛（报名人数通常更少）");

  const total = headcount + majorWidth + grassroots + level + loc.value + english;
  const bucket: Bucket =
    total >= SCORE_RULES.thresholds.chong ? "冲" : total >= SCORE_RULES.thresholds.wen ? "稳" : "保";

  return {
    score: total,
    bucket,
    breakdown: { headcount, majorWidth, grassroots, level, location: loc.value, english, total },
    notes,
  };
}
