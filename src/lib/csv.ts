import type { Job, ScoredJob } from "./types";

/** 极简 CSV 解析器：支持引号包裹、字段内换行与转义引号 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const clean = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === "\t") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim());
  return { headers, rows: nonEmpty };
}

/** 列名别名表：兼容国考职位表中文表头、CLI 字段名、以及常见英文列名 */
const COLUMN_ALIASES: Record<keyof Omit<Job, "id" | "datasetId">, string[]> = {
  code: ["职位代码", "代码", "id", "code", "position_code"],
  dept: ["部门名称", "招录机关", "部门", "dept_name", "dept"],
  bureau: ["用人司局", "司局", "bureau"],
  position: ["招考职位", "职位名称", "职位", "position_name", "position"],
  instType: ["机构性质", "inst_type"],
  instLevel: ["机构层级", "inst_level"],
  examCategory: ["考试类别", "exam_category"],
  positionAttr: ["职位属性", "position_attr"],
  headcount: ["招考人数", "招录人数", "人数", "headcount"],
  education: ["学历", "学历要求", "education"],
  degree: ["学位", "degree"],
  major: ["专业", "专业要求", "major"],
  political: ["政治面貌", "political"],
  grassroots: ["基层工作最低年限", "基层工作年限", "grassroots_years", "grassroots"],
  programs: ["服务基层项目工作经历", "服务基层项目", "programs"],
  location: ["工作地点", "地点", "work_location", "location"],
  settle: ["落户地点", "落户", "settle"],
  remarks: ["备注", "其他条件", "remarks", "remark"],
};

function normalizeHeader(h: string): string {
  return h.replace(/\s|　/g, "").toLowerCase();
}

export function detectColumnMap(headers: string[]): Partial<Record<keyof Omit<Job, "id" | "datasetId">, number>> {
  const normalized = headers.map(normalizeHeader);
  const map: Partial<Record<keyof Omit<Job, "id" | "datasetId">, number>> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [
    keyof typeof COLUMN_ALIASES,
    string[],
  ][]) {
    for (const alias of aliases) {
      const a = normalizeHeader(alias);
      const idx = normalized.findIndex((h) => h === a);
      if (idx >= 0) {
        map[field] = idx;
        break;
      }
    }
    if (map[field] === undefined) {
      for (const alias of aliases) {
        const a = normalizeHeader(alias);
        const idx = normalized.findIndex((h) => h.includes(a));
        if (idx >= 0) {
          map[field] = idx;
          break;
        }
      }
    }
  }
  return map;
}

export function rowsToJobs(
  headers: string[],
  rows: string[][],
  datasetId: string
): { jobs: Job[]; map: ReturnType<typeof detectColumnMap>; skipped: number } {
  const map = detectColumnMap(headers);
  const jobs: Job[] = [];
  let skipped = 0;

  for (const r of rows) {
    const get = (k: keyof typeof map) => (map[k] !== undefined ? (r[map[k]!] ?? "").trim() : "");
    const position = get("position");
    const dept = get("dept");
    if (!position && !dept) {
      skipped++;
      continue;
    }
    const headcountRaw = get("headcount").replace(/[^\d]/g, "");
    const code = get("code");
    jobs.push({
      id: `${datasetId}|${dept}|${code}|${jobs.length}`,
      datasetId,
      code,
      dept,
      bureau: get("bureau"),
      position,
      instType: get("instType"),
      instLevel: get("instLevel"),
      examCategory: get("examCategory"),
      positionAttr: get("positionAttr"),
      headcount: headcountRaw ? Number(headcountRaw) : 1,
      education: get("education"),
      degree: get("degree"),
      major: get("major"),
      political: get("political") || "不限",
      grassroots: get("grassroots") || "无限制",
      programs: get("programs"),
      location: get("location"),
      settle: get("settle"),
      remarks: get("remarks"),
    });
  }
  return { jobs, map, skipped };
}

const EXPORT_HEADERS = [
  "档位",
  "竞争压力分",
  "部门",
  "用人司局",
  "职位",
  "职位代码",
  "招录人数",
  "学历",
  "学位",
  "基层年限",
  "机构层级",
  "考试类别",
  "工作地点",
  "专业",
  "政治面貌",
  "备注",
];

function escapeCsv(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function jobsToCsv(jobs: ScoredJob[]): string {
  const lines = [EXPORT_HEADERS.join(",")];
  for (const j of jobs) {
    lines.push(
      [
        j.bucket,
        j.score,
        j.dept,
        j.bureau,
        j.position,
        j.code,
        j.headcount,
        j.education,
        j.degree,
        j.grassroots,
        j.instLevel,
        j.examCategory,
        j.location,
        j.major,
        j.political,
        j.remarks,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
