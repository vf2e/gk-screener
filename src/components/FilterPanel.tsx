import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_FILTERS } from "@/lib/filter";
import { describeExpansion, expandMajors } from "@/lib/major-map";
import type { EducationLevel, FilterState, Gender, PoliticalStatus } from "@/lib/types";

const LEVEL_OPTIONS = [
  { value: "省（副省）级", label: "省（副省）级" },
  { value: "市（地）级", label: "市（地）级" },
  { value: "县（区）级及以下", label: "县（区）级及以下" },
];

const CATEGORY_OPTIONS = [
  { value: "中央机关及其省级直属机构综合管理类", label: "省级以上·综合管理" },
  { value: "市（地）级及以下直属机构综合管理类", label: "市地级以下·综合管理" },
  { value: "行政执法类", label: "行政执法类" },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CheckGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="space-y-1.5">
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-xs text-foreground/90">
          <Checkbox checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function FilterPanel({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
  totalCount: number;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r bg-card/40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          筛选条件
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
          <RotateCcw className="h-3.5 w-3.5" />
          重置
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="space-y-3.5 p-4">
          <Field label="我的学历">
            <Select
              value={filters.education}
              onValueChange={(v) => set("education", v as EducationLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="大专">大专</SelectItem>
                <SelectItem value="本科">本科</SelectItem>
                <SelectItem value="硕士">硕士研究生</SelectItem>
                <SelectItem value="博士">博士研究生</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="我的专业（多个用空格/逗号分隔）">
            <Input
              placeholder="如：软件工程 计算机类"
              value={filters.majorQuery}
              onChange={(e) => set("majorQuery", e.target.value)}
            />
            {filters.majorQuery.trim() && (
              <p className="text-[11px] leading-relaxed text-primary/80">
                {expandMajors(filters.majorQuery).map(describeExpansion).join("；")}
              </p>
            )}
          </Field>

          <Field label="专业匹配范围">
            <Select
              value={filters.majorMatchMode}
              onValueChange={(v) => set("majorMatchMode", v as "loose" | "strict")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">严格：只比对本科专业段</SelectItem>
                <SelectItem value="loose">宽松：全文比对（含研究生段）</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Separator />
          <Field label="政治面貌">
            <Select value={filters.political} onValueChange={(v) => set("political", v as PoliticalStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="群众">群众（非党员非团员）</SelectItem>
                <SelectItem value="共青团员">共青团员</SelectItem>
                <SelectItem value="中共党员">中共党员</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="基层工作经历">
            <Select
              value={String(filters.grassrootsYears)}
              onValueChange={(v) => set("grassrootsYears", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">无</SelectItem>
                <SelectItem value="1">1 年</SelectItem>
                <SelectItem value="2">2 年及以上</SelectItem>
                <SelectItem value="3">3 年及以上</SelectItem>
                <SelectItem value="5">5 年及以上</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="性别">
              <Select value={filters.gender} onValueChange={(v) => set("gender", v as Gender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="男">男</SelectItem>
                  <SelectItem value="女">女</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="英语等级">
              <Select
                value={filters.englishLevel}
                onValueChange={(v) => set("englishLevel", v as "无" | "四级" | "六级")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="无">无</SelectItem>
                  <SelectItem value="四级">四级</SelectItem>
                  <SelectItem value="六级">六级</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator />
          <Field label="工作地点关键词">
            <Input
              placeholder="如：武汉 / 宜昌 / 区"
              value={filters.regionQuery}
              onChange={(e) => set("regionQuery", e.target.value)}
            />
          </Field>

          <Field label="关键词（部门/职位/备注）">
            <Input
              placeholder="如：税务 / 海关 / 计算机"
              value={filters.keyword}
              onChange={(e) => set("keyword", e.target.value)}
            />
          </Field>

          <Field label="最少招录人数">
            <Input
              type="number"
              min={1}
              value={filters.minHeadcount}
              onChange={(e) => set("minHeadcount", Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>

          <Field label="机构层级（不选=全部）">
            <CheckGroup
              options={LEVEL_OPTIONS}
              value={filters.levels}
              onChange={(v) => set("levels", v)}
            />
          </Field>

          <Field label="考试类别（不选=全部）">
            <CheckGroup
              options={CATEGORY_OPTIONS}
              value={filters.examCategories}
              onChange={(v) => set("examCategories", v)}
            />
          </Field>

          <Separator />
          <div className="space-y-2.5">
            <label className="flex items-center justify-between text-xs">
              <span>排除限应届毕业生岗位</span>
              <Switch
                checked={filters.excludeFreshOnly}
                onCheckedChange={(v) => set("excludeFreshOnly", v)}
              />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>我有服务基层项目经历</span>
              <Switch
                checked={filters.hasProgramExperience}
                onCheckedChange={(v) => set("hasProgramExperience", v)}
              />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>只看专业不限岗位</span>
              <Switch checked={filters.onlyOpenMajor} onCheckedChange={(v) => set("onlyOpenMajor", v)} />
            </label>
          </div>
        </div>
      </ScrollArea>
      <Separator />
      <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
        <span>符合条件</span>
        <span className="font-mono text-sm text-foreground">
          {resultCount} / {totalCount}
        </span>
      </div>
    </aside>
  );
}
