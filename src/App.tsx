import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { FilterPanel } from "@/components/FilterPanel";
import { JobDetailDialog } from "@/components/JobDetailDialog";
import { ResultTable } from "@/components/ResultTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadText, jobsToCsv, parseCsv, rowsToJobs } from "@/lib/csv";
import {
  PROVINCES,
  YEARS,
  loadProvinceJobs,
  provinceName,
  type YearKey,
} from "@/lib/datasets";
import { DEFAULT_FILTERS, applyFilters, summarize } from "@/lib/filter";
import { SCORE_FORMULA_TEXT } from "@/lib/scoring";
import type { Dataset, FilterState, Job, ScoredJob } from "@/lib/types";

const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

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

export default function App() {
  const [year, setYear] = useState<YearKey>("2027");
  const [province, setProvince] = useState("hubei");
  const [builtinJobs, setBuiltinJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [imported, setImported] = useState<Dataset[]>([]);
  const [activeImportedId, setActiveImportedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<ScoredJob | null>(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 内置数据按 年份 + 省份 懒加载
  useEffect(() => {
    if (activeImportedId) return;
    let cancelled = false;
    setLoading(true);
    loadProvinceJobs(year, province)
      .then((jobs) => {
        if (cancelled) return;
        setBuiltinJobs(jobs);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setBuiltinJobs([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, province, activeImportedId]);

  const activeImported = useMemo(
    () => (activeImportedId ? imported.find((d) => d.id === activeImportedId) : undefined),
    [activeImportedId, imported]
  );

  const currentJobs = activeImported ? activeImported.jobs : builtinJobs;
  const currentName = activeImported
    ? activeImported.name
    : `${year} 国考 · ${provinceName(province)}`;

  const scored = useMemo(() => applyFilters(currentJobs, filters), [currentJobs, filters]);
  const passed = useMemo(() => scored.filter((j) => j.excluded.length === 0), [scored]);
  const excluded = useMemo(() => scored.filter((j) => j.excluded.length > 0), [scored]);
  const stats = useMemo(() => summarize(scored), [scored]);

  const tabJobs = useMemo(() => {
    if (tab === "excluded") return [...excluded].sort((a, b) => a.score - b.score);
    if (tab === "all") return [...passed].sort((a, b) => b.score - a.score);
    return passed.filter((j) => j.bucket === tab).sort((a, b) => b.score - a.score);
  }, [tab, passed, excluded]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const addDataset = useCallback((jobs: Job[], name: string) => {
    const id = `import-${Date.now()}`;
    const ds: Dataset = {
      id,
      name,
      description: `导入的数据集，共 ${jobs.length} 条`,
      jobs: jobs.map((j) => ({ ...j, datasetId: id })),
      imported: true,
    };
    setImported((prev) => [...prev, ds]);
    setActiveImportedId(id);
  }, []);

  const importFromText = useCallback(
    (text: string, name: string) => {
      const { headers, rows } = parseCsv(text);
      if (!headers.length) {
        flash("文件为空或无法识别表头");
        return;
      }
      const { jobs, map } = rowsToJobs(headers, rows, "tmp");
      if (!jobs.length) {
        flash("没有解析到有效岗位行，请检查列名");
        return;
      }
      if (map.position === undefined) {
        flash("未能识别“招考职位/职位名称”列，请确认是国考职位表格式");
        return;
      }
      addDataset(jobs, name);
      flash(`已导入 ${jobs.length} 条岗位`);
    },
    [addDataset, flash]
  );

  const handleImport = useCallback(async () => {
    if (isTauri()) {
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: "岗位表", extensions: ["xlsx", "xls", "csv", "tsv", "txt"] }],
      });
      if (!selectedPath || typeof selectedPath !== "string") return;
      const baseName = selectedPath.split(/[\\/]/).pop() ?? "导入数据";
      try {
        if (/\.(csv|tsv|txt)$/i.test(selectedPath)) {
          const text = await invoke<string>("read_text_file", { path: selectedPath });
          importFromText(text, baseName);
        } else {
          const sheet = await invoke<{ headers: string[]; rows: string[][] }>("parse_spreadsheet", {
            path: selectedPath,
          });
          const { jobs, map } = rowsToJobs(sheet.headers, sheet.rows, "tmp");
          if (!jobs.length || map.position === undefined) {
            flash("表格解析失败：未找到职位列");
            return;
          }
          addDataset(jobs, baseName);
          flash(`已从 ${baseName} 导入 ${jobs.length} 条岗位`);
        }
      } catch (err) {
        flash(`导入失败：${String(err)}`);
      }
      return;
    }
    fileInputRef.current?.click();
  }, [addDataset, flash, importFromText]);

  const handleFilePicked = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
        flash("浏览器模式只支持 CSV/TSV；桌面版可解析 .xls/.xlsx");
        return;
      }
      const text = await file.text();
      importFromText(text, file.name);
    },
    [flash, importFromText]
  );

  const buildRows = useCallback(
    (list: ScoredJob[]) =>
      list.map((j) => [
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
      ]),
    []
  );

  const handleExport = useCallback(async () => {
    if (!tabJobs.length) {
      flash("当前列表为空，没有可导出的内容");
      return;
    }
    if (isTauri()) {
      const target = await save({
        defaultPath: `岗位筛选结果-${currentName.replace(/[\\/:*?"<>|]/g, "_")}.xlsx`,
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
      });
      if (!target) return;
      try {
        await invoke("export_xlsx", {
          path: target,
          headers: EXPORT_HEADERS,
          rows: buildRows(tabJobs),
        });
        flash(`已导出 ${tabJobs.length} 条到 ${target.split(/[\\/]/).pop()}`);
      } catch (err) {
        flash(`导出失败：${String(err)}`);
      }
      return;
    }
    downloadText("岗位筛选结果.csv", jobsToCsv(tabJobs));
    flash(`已导出 ${tabJobs.length} 条 CSV`);
  }, [buildRows, currentName, flash, tabJobs]);

  const cards = [
    { label: "岗位总数", value: currentJobs.length, tone: "text-foreground" },
    { label: "符合条件", value: stats.passed, tone: "text-primary" },
    { label: "冲", value: stats.chong, tone: "text-rose-500" },
    { label: "稳", value: stats.wen, tone: "text-amber-500" },
    { label: "保", value: stats.bao, tone: "text-emerald-600" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/60 px-4">
        <div className="flex items-center gap-2.5">
          <BriefcaseBusiness className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">岗位筛选器</span>
          <Badge variant="secondary" className="font-normal">
            {currentName}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={year}
            onValueChange={(v) => {
              setActiveImportedId(null);
              setYear(v as YearKey);
            }}
          >
            <SelectTrigger className="h-8 w-[118px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y.key} value={y.key} className="text-xs">
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={province}
            onValueChange={(v) => {
              setActiveImportedId(null);
              setProvince(v);
            }}
          >
            <SelectTrigger className="h-8 w-[132px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>选择报考省份</SelectLabel>
                {PROVINCES.map((p) => (
                  <SelectItem key={p.pinyin} value={p.pinyin} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {imported.length > 0 && (
            <Select
              value={activeImportedId ?? "__builtin__"}
              onValueChange={(v) => setActiveImportedId(v === "__builtin__" ? null : v)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="导入的数据" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__builtin__" className="text-xs">
                  内置数据（{year} · {provinceName(province)}）
                </SelectItem>
                {imported.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {d.name}（{d.jobs.length}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-3.5 w-3.5" />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowScoreInfo(true)} title="分档规则">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={stats.passed}
          totalCount={currentJobs.length}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 gap-2 px-4 pt-3">
            {cards.map((c) => (
              <div key={c.label} className="flex-1 rounded-lg border bg-card px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{c.label}</div>
                <div className={`font-mono text-lg font-semibold ${c.tone}`}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 pt-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">全部可报</TabsTrigger>
                <TabsTrigger value="冲">冲 · {stats.chong}</TabsTrigger>
                <TabsTrigger value="稳">稳 · {stats.wen}</TabsTrigger>
                <TabsTrigger value="保">保 · {stats.bao}</TabsTrigger>
                <TabsTrigger value="excluded">已排除 · {excluded.length}</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">
              点击任意行查看岗位完整要求与分档拆解
            </span>
          </div>

          <div className="mt-2 flex-1 overflow-hidden px-4 pb-3">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载 {year} 年 {provinceName(province)} 职位数据…
              </div>
            ) : (
              <div className="h-full rounded-lg border bg-card">
                <ResultTable
                  key={`${currentName}-${tab}`}
                  jobs={tabJobs}
                  showExcluded={tab === "excluded"}
                  onSelect={setSelected}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <JobDetailDialog job={selected} onClose={() => setSelected(null)} />

      <Dialog open={showScoreInfo} onOpenChange={setShowScoreInfo}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" />
              分档规则说明
            </DialogTitle>
            <DialogDescription>
              压力分只使用岗位表里可核查的字段，不含任何分数线预测。
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ul className="space-y-1.5 text-sm">
            {SCORE_FORMULA_TEXT.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-primary">·</span>
                <span className="text-foreground/90">{line}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <p className="text-xs leading-relaxed text-muted-foreground">
            本工具不内置国考逐岗进面分与报录比数据（官方与第三方均未完整公布），因此“冲/稳/保”
            是对岗位竞争条件的量化代理指标，不是录取概率预测。报考前请以招录机关发布的简章与电话答复为准。
          </p>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        className="hidden"
        onChange={(e) => {
          void handleFilePicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {toast && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border bg-card px-3 py-2 text-xs shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
