export interface Job {
  id: string;
  datasetId: string;
  code: string;
  dept: string;
  bureau: string;
  position: string;
  instType: string;
  instLevel: string;
  examCategory: string;
  positionAttr: string;
  headcount: number;
  education: string;
  degree: string;
  major: string;
  political: string;
  grassroots: string;
  programs: string;
  location: string;
  settle: string;
  remarks: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  jobs: Job[];
  imported?: boolean;
}

export type Bucket = "冲" | "稳" | "保" | "已排除";

export interface ScoreBreakdown {
  headcount: number;
  majorWidth: number;
  grassroots: number;
  level: number;
  location: number;
  english: number;
  total: number;
}

export interface ScoredJob extends Job {
  score: number;
  bucket: Bucket;
  breakdown: ScoreBreakdown;
  /** 被排除的原因，空数组表示通过全部筛选 */
  excluded: string[];
  /** 加分/减分说明，用于详情展示 */
  notes: string[];
}

export type EducationLevel = "大专" | "本科" | "硕士" | "博士";
export type PoliticalStatus = "群众" | "共青团员" | "中共党员";
export type Gender = "男" | "女";

export interface FilterState {
  education: EducationLevel;
  majorQuery: string;
  majorMatchMode: "loose" | "strict";
  political: PoliticalStatus;
  grassrootsYears: number;
  regionQuery: string;
  minHeadcount: number;
  levels: string[];
  examCategories: string[];
  excludeFreshOnly: boolean;
  gender: Gender;
  englishLevel: "无" | "四级" | "六级";
  hasProgramExperience: boolean;
  onlyOpenMajor: boolean;
  keyword: string;
}
