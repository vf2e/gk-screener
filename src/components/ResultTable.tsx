import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScoredJob } from "@/lib/types";

const PAGE_SIZE = 60;

function bucketVariant(b: ScoredJob["bucket"]) {
  if (b === "冲") return "chong" as const;
  if (b === "稳") return "wen" as const;
  if (b === "保") return "bao" as const;
  return "muted" as const;
}

function truncate(text: string, n: number) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
}

export function ResultTable({
  jobs,
  showExcluded,
  onSelect,
}: {
  jobs: ScoredJob[];
  showExcluded: boolean;
  onSelect: (job: ScoredJob) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageJobs = useMemo(
    () => jobs.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [jobs, safePage]
  );

  if (!jobs.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        没有符合条件的岗位，试着放宽筛选条件
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-14">档位</TableHead>
              <TableHead className="w-14 text-right">压力分</TableHead>
              <TableHead className="min-w-[180px]">部门 / 用人司局</TableHead>
              <TableHead className="min-w-[150px]">职位</TableHead>
              <TableHead className="w-14 text-right">招录</TableHead>
              <TableHead className="w-24">学历</TableHead>
              <TableHead className="w-20">基层</TableHead>
              <TableHead className="w-28">层级</TableHead>
              <TableHead className="w-32">工作地点</TableHead>
              <TableHead className="min-w-[200px]">专业要求</TableHead>
              <TableHead className="min-w-[220px]">{showExcluded ? "被排除原因" : "备注"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageJobs.map((job) => (
              <TableRow
                key={job.id}
                className="cursor-pointer"
                onClick={() => onSelect(job)}
              >
                <TableCell>
                  {showExcluded ? (
                    <Badge variant="muted">排除</Badge>
                  ) : (
                    <Badge variant={bucketVariant(job.bucket)}>{job.bucket}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{job.score}</TableCell>
                <TableCell>
                  <div className="text-xs font-medium leading-tight">{job.dept}</div>
                  <div className="text-[11px] text-muted-foreground">{job.bureau}</div>
                </TableCell>
                <TableCell className="text-xs">{job.position}</TableCell>
                <TableCell className="text-right font-mono text-xs">{job.headcount}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{job.education}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{job.grassroots}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{job.instLevel}</TableCell>
                <TableCell className="text-[11px]">{job.location}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{truncate(job.major, 70)}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {showExcluded ? (
                    <span className="text-rose-600">{job.excluded.join("；")}</span>
                  ) : (
                    truncate(job.remarks, 80)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          共 {jobs.length} 条 · 第 {safePage + 1}/{totalPages} 页
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
