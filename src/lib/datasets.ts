import metaJson from "../data/meta.json";
import type { Job } from "./types";

export interface ProvinceMeta {
  name: string;
  count: number;
  size: number;
}

export type YearKey = "2026" | "2027";

const META = metaJson as unknown as Record<string, Record<string, ProvinceMeta>>;

export const YEARS: { key: YearKey; label: string; note: string }[] = [
  { key: "2026", label: "2026 年度", note: "2026 年度国考职位表（20714 个职位）" },
  { key: "2027", label: "2027 年度", note: "2027 年度招考简章（19426 个职位）" },
];

/** 省份列表：顺序沿用 meta.json 的写入顺序（华北→西南→西北） */
export const PROVINCES: { pinyin: string; name: string }[] = Object.entries(META["2026"]).map(
  ([pinyin, m]) => ({ pinyin, name: m.name })
);

export function provinceMeta(year: YearKey, pinyin: string): ProvinceMeta | undefined {
  return META[year]?.[pinyin];
}

export function provinceName(pinyin: string): string {
  return PROVINCES.find((p) => p.pinyin === pinyin)?.name ?? pinyin;
}

/**
 * 按年份 + 省份动态加载内置数据集。
 * 数据文件按省份拆分，Vite 会为每个 JSON 生成独立 chunk，切换省份时才下载。
 */
export async function loadProvinceJobs(year: YearKey, pinyin: string): Promise<Job[]> {
  const mod =
    year === "2026"
      ? await import(`../data/2026/${pinyin}.json`)
      : await import(`../data/2027/${pinyin}.json`);

  const raw = ((mod as { default?: unknown }).default ?? mod) as Omit<Job, "id" | "datasetId">[];
  if (!Array.isArray(raw)) return [];

  return raw.map((r, i) => ({
    ...r,
    id: `builtin-${year}-${pinyin}|${i}`,
    datasetId: `builtin-${year}-${pinyin}`,
    headcount: Number(r.headcount) || 1,
    political: r.political || "不限",
    grassroots: r.grassroots || "无限制",
  }));
}
