import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ScoredJob } from "@/lib/types";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 py-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words">{value || "—"}</span>
    </div>
  );
}

export function JobDetailDialog({
  job,
  onClose,
}: {
  job: ScoredJob | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto">
        {job && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Badge
                  variant={
                    job.bucket === "冲" ? "chong" : job.bucket === "稳" ? "wen" : job.bucket === "保" ? "bao" : "muted"
                  }
                >
                  {job.bucket}
                </Badge>
                <span>{job.position}</span>
                <span className="font-mono text-xs text-muted-foreground">{job.code}</span>
              </DialogTitle>
              <DialogDescription>
                {job.dept} · {job.bureau}
              </DialogDescription>
            </DialogHeader>

            {job.excluded.length > 0 && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-600">
                不符合条件：{job.excluded.join("；")}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6">
              <Row label="招录人数" value={`${job.headcount} 人`} />
              <Row label="机构性质" value={job.instType} />
              <Row label="学历要求" value={job.education} />
              <Row label="学位要求" value={job.degree} />
              <Row label="政治面貌" value={job.political} />
              <Row label="基层年限" value={job.grassroots} />
              <Row label="机构层级" value={job.instLevel} />
              <Row label="考试类别" value={job.examCategory} />
              <Row label="职位属性" value={job.positionAttr} />
              <Row label="工作地点" value={job.location} />
              <Row label="服务基层项目" value={job.programs || "无限制"} />
              <Row label="落户地点" value={job.settle} />
            </div>

            <Separator />
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">专业要求</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.major || "—"}</p>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">备注</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {job.remarks || "—"}
              </p>
            </div>

            <Separator />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">竞争压力分拆解</span>
                <span className="font-mono text-sm font-semibold">{job.score}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md bg-muted/50 p-2">
                  招录人数 <span className="float-right font-mono">+{job.breakdown.headcount}</span>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  专业口径 <span className="float-right font-mono">+{job.breakdown.majorWidth}</span>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  基层要求 <span className="float-right font-mono">+{job.breakdown.grassroots}</span>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  机构层级 <span className="float-right font-mono">+{job.breakdown.level}</span>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  工作地点 <span className="float-right font-mono">+{job.breakdown.location}</span>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  英语门槛 <span className="float-right font-mono">{job.breakdown.english}</span>
                </div>
              </div>
              {job.notes.length > 0 && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {job.notes.join(" · ")}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
