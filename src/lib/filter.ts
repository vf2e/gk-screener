import { expandMajors } from "./major-map";
import { bachelorSegment, scoreJob } from "./scoring";
import type { EducationLevel, FilterState, Job, PoliticalStatus, ScoredJob } from "./types";

const LEVEL_ORDER: Record<EducationLevel, number> = { 大专: 1, 本科: 2, 硕士: 3, 博士: 4 };

export const DEFAULT_FILTERS: FilterState = {
  education: "本科",
  majorQuery: "",
  majorMatchMode: "strict",
  political: "群众",
  grassrootsYears: 2,
  regionQuery: "",
  minHeadcount: 1,
  levels: [],
  examCategories: [],
  excludeFreshOnly: true,
  gender: "男",
  englishLevel: "无",
  hasProgramExperience: false,
  onlyOpenMajor: false,
  keyword: "",
};

/** 学历是否可报。严格遵循国考"以最高学历报考"规则：仅限本科的岗位，硕士不能以本科学历报考。 */
export function checkEducation(user: EducationLevel, req: string): string | null {
  const r = (req || "").trim();
  if (!r) return null;
  const u = LEVEL_ORDER[user];
  if (/仅限博士/.test(r)) return u === 4 ? null : "岗位仅限博士";
  if (/仅限硕士(研究生)?/.test(r)) return u === 3 ? null : "岗位仅限硕士研究生";
  if (/仅限本科/.test(r)) return u === 2 ? null : "岗位仅限本科（硕士及以上不能以本科学历报考）";
  if (/仅限大专|仅限专科/.test(r)) return u === 1 ? null : "岗位仅限大专";
  if (/大专或本科|专科或本科/.test(r)) return u === 1 || u === 2 ? null : "岗位限大专或本科";
  if (/本科或硕士/.test(r)) return u === 2 || u === 3 ? null : "岗位限本科或硕士研究生";
  if (/博士研究生|研究生（仅限博士）/.test(r)) return u >= 4 ? null : "岗位要求博士研究生";
  if (/硕士研究生及以上|硕士研究生以上|研究生（硕士及以上）/.test(r))
    return u >= 3 ? null : "岗位要求硕士研究生及以上";
  if (/本科及以上|本科以上|大学本科及以上/.test(r)) return u >= 2 ? null : "岗位要求本科及以上";
  if (/大专及以上|专科及以上|大专以上|大学专科及以上/.test(r)) return u >= 1 ? null : "岗位要求大专及以上";
  if (/^研究生$/.test(r)) return u >= 3 ? null : "岗位要求研究生学历";
  return null;
}

export function checkPolitical(user: PoliticalStatus, req: string): string | null {
  const r = (req || "不限").trim();
  if (r === "" || r.includes("不限")) return null;
  if (user === "中共党员") return r.includes("党员") ? null : "岗位要求非中共党员身份";
  if (user === "共青团员") return r.includes("共青团员") ? null : "岗位要求中共党员";
  // 群众
  return r.includes("群众") ? null : "岗位要求中共党员/共青团员";
}

export function checkGrassroots(userYears: number, req: string): string | null {
  const r = (req || "无限制").trim();
  if (!r || r.includes("无限制")) return null;
  if (/五年|5年/.test(r)) return userYears >= 5 ? null : "岗位要求五年以上基层工作经历";
  if (/三年|3年/.test(r)) return userYears >= 3 ? null : "岗位要求三年基层工作经历";
  if (/二年|2年|两年/.test(r)) return userYears >= 2 ? null : "岗位要求二年基层工作经历";
  if (/一年|1年/.test(r)) return userYears >= 1 ? null : "岗位要求一年基层工作经历";
  return null;
}

const OPEN_MAJOR_RE = /^\s*(不限|专业不限|不限专业)\s*$/;

export function checkMajor(query: string, job: Job, mode: "loose" | "strict"): string | null {
  const q = (query || "").trim();
  const text = mode === "strict" ? bachelorSegment(job.major) : job.major;
  if (OPEN_MAJOR_RE.test(text.trim())) return null;
  if (!q) return null;
  const expansions = expandMajors(q);
  if (!expansions.length) return null;
  const hit = expansions.some(
    (exp) =>
      exp.keywords.some((k) => text.includes(k)) ||
      exp.disciplinePatterns.some((re) => re.test(text))
  );
  return hit ? null : "专业不符";
}

const FRESH_RE = /限应届|应届高校毕业生|应届毕业生|应届生|\d{4}届/;

export function isFreshOnly(remarks: string): boolean {
  if (!remarks) return false;
  if (/非应届/.test(remarks)) return false;
  return FRESH_RE.test(remarks);
}

export function genderBlocked(remarks: string, user: "男" | "女"): boolean {
  if (!remarks) return false;
  if (user === "男") return /限女性|仅限女性|限招女性|女性/.test(remarks);
  if (/适合男性|男性优先/.test(remarks)) return false;
  return /限男性|仅限男性|限招男性|男性/.test(remarks);
}

export function englishBlocked(remarks: string, level: "无" | "四级" | "六级"): boolean {
  if (!remarks) return false;
  const needsSix = /六级|CET-?6|CET6/i.test(remarks);
  const needsFour = /四级|CET-?4|CET4/i.test(remarks);
  if (level === "六级") return false;
  if (level === "四级") return needsSix;
  return needsSix || needsFour;
}

export function applyFilters(jobs: Job[], f: FilterState): ScoredJob[] {
  const out: ScoredJob[] = [];
  for (const job of jobs) {
    const { score, bucket, breakdown, notes } = scoreJob(job);
    const excluded: string[] = [];

    const edu = checkEducation(f.education, job.education);
    if (edu) excluded.push(edu);

    const pol = checkPolitical(f.political, job.political);
    if (pol) excluded.push(pol);

    const gr = checkGrassroots(f.grassrootsYears, job.grassroots);
    if (gr) excluded.push(gr);

    const mj = checkMajor(f.majorQuery, job, f.majorMatchMode);
    if (mj) excluded.push(mj);

    if (f.onlyOpenMajor && !OPEN_MAJOR_RE.test((job.major || "").trim())) {
      excluded.push("仅保留专业不限岗位");
    }

    if (f.excludeFreshOnly && isFreshOnly(job.remarks)) excluded.push("限应届毕业生");

    if (genderBlocked(job.remarks, f.gender)) excluded.push(`限${f.gender === "男" ? "女" : "男"}性`);

    if (englishBlocked(job.remarks, f.englishLevel)) excluded.push("有英语等级门槛");

    if (!f.hasProgramExperience && job.programs && !/无限制/.test(job.programs)) {
      excluded.push("要求服务基层项目经历");
    }

    if (job.headcount < f.minHeadcount) excluded.push(`招录人数少于 ${f.minHeadcount}`);

    if (f.regionQuery.trim()) {
      const rq = f.regionQuery.trim();
      const hit = job.location.includes(rq) || (job.settle || "").includes(rq);
      if (!hit) excluded.push("工作地点不符");
    }

    if (f.levels.length && !f.levels.some((l) => job.instLevel.includes(l))) {
      excluded.push("机构层级不符");
    }

    if (f.examCategories.length && !f.examCategories.some((c) => job.examCategory.includes(c))) {
      excluded.push("考试类别不符");
    }

    if (f.keyword.trim()) {
      const kw = f.keyword.trim();
      const hay = `${job.dept}${job.bureau}${job.position}${job.location}${job.remarks}`;
      if (!hay.includes(kw)) excluded.push("关键词不匹配");
    }

    out.push({ ...job, score, bucket, breakdown, excluded, notes });
  }
  return out;
}

export function summarize(results: ScoredJob[]) {
  const passed = results.filter((r) => r.excluded.length === 0);
  return {
    total: results.length,
    passed: passed.length,
    chong: passed.filter((r) => r.bucket === "冲").length,
    wen: passed.filter((r) => r.bucket === "稳").length,
    bao: passed.filter((r) => r.bucket === "保").length,
  };
}
