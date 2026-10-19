# 岗位筛选器（JobScreener）

国考 / 省考职位表的**桌面端筛选与分档工具**。导入职位表后，按学历、专业、政治面貌、基层年限、地区等条件筛选，并按岗位自身属性算出「竞争压力分」，给出冲 / 稳 / 保分档。

> 技术栈：Tauri 2 + React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui（Radix）+ Rust（calamine / rust_xlsxwriter）

## 功能

- **内置数据集**：2026 年度国考（20714 个职位）与 2027 年度招考简章（19426 个职位）**全量**，按 31 个省份拆分打包，切换省份时才按需加载对应的数据块
- **报考省份切换**：顶栏「年份 + 省份」两个下拉，默认 **2027 年度 · 湖北**
- **导入自己的职位表**：支持 `.xls / .xlsx / .csv / .tsv`，自动跳过说明行定位表头，按中文列名（部门名称 / 用人司局 / 招考职位 / 专业 / 学历 …）映射字段
- **多维筛选**
  - 学历（严格遵循「以最高学历报考」：仅限本科的岗位，硕士不能以本科学历报考）
  - 专业（**自动展开到所属专业类与学科门类**，如「软件工程」→ 工学 / 计算机类，解决职位表只写「计算机类」的匹配问题）
  - 政治面貌、基层工作年限、性别、英语等级、服务基层项目经历
  - 工作地点、关键词、最少招录人数、机构层级、考试类别
  - 一键排除「限应届」「限性别」「有英语门槛」的岗位
- **冲 / 稳 / 保分档**：基于招录人数、专业口径宽度、基层要求、机构层级、工作地点、英语门槛六项可核查字段打分
- **导出**：桌面版直接导出 `.xlsx`（Rust 侧 rust_xlsxwriter），浏览器模式降级为 CSV（带 BOM，Excel 可直接打开）
- **详情面板**：单个岗位的完整要求 + 压力分拆解 + 被排除原因

## 分档规则

| 维度 | 取值 |
| --- | --- |
| 招录人数 | 1 人 +30 / 2 人 +18 / 3 人 +10 / ≥4 人 +4 |
| 专业口径 | ≥10 类 +16 / 6-9 类 +9 / ≤5 类 +0 |
| 基层要求 | 无限制 +12 / 有年限要求 +0 |
| 机构层级 | 省（副省）级 +14 / 市（地）级 +7 / 县（区）级及以下 +0 |
| 工作地点 | 省会/直辖市 +30 / 市辖区 +8 / 县及县级市 +0 |
| 英语门槛 | 备注要求四六级 −6 |

分档阈值：**≥55 冲**、**38–54 稳**、**<38 保**。

## 数据来源与边界

- 内置数据集来自 `npx @ha7ch/kaogong-pro@latest`（2026 年度国考职位表，原始来源：国家公务员局 bm.scs.gov.cn）+ 本地《中央机关及其直属机构 2027 年度考试录用公务员招考简章》。
- **本工具不含任何国考逐岗进面分与逐岗报录比**（官方与第三方均未完整公布）。「冲 / 稳 / 保」是岗位竞争条件的量化代理指标，**不是录取概率或分数线预测**。
- 报考前请以招录机关发布的简章与电话答复为准。

## 主题与图标

- 界面默认**浅色主题**（`index.html` 不带 `dark` class）。`src/index.css` 里保留了 `.dark` 变量组，需要深色时给 `<html>` 加上 `class="dark"` 即可。
- 图标源文件是项目根目录的 **`eye-exam.png`**。要换图标，替换该文件后执行：

```bash
npx tauri icon eye-exam.png
```

会重新生成 `src-tauri/icons/` 下的全部尺寸（`icon.ico`、`icon.icns`、Windows Square 系列等）。

> ⚠️ 注意：`tauri-build` 不会因为图标文件变化而自动重新生成 Windows 资源，换图后如果直接 `npm run tauri build`，exe 里仍是旧图标。必须强制重建一次主 crate：
>
> ```bash
> cd src-tauri && cargo clean -p job-screener && cd ..
> npm run tauri build
> ```

## 开发

```bash
npm install
npm run dev          # 仅前端（浏览器模式，可筛可导出 CSV）
npm run tauri dev    # 桌面开发模式
npm run tauri build  # 打包安装包
```

首次 `tauri build` 会编译 Rust 依赖，约 2–5 分钟。

## 目录结构

```
src/
  App.tsx                    主界面与数据流
  components/
    FilterPanel.tsx          左侧筛选面板
    ResultTable.tsx          结果表格（分页）
    JobDetailDialog.tsx      岗位详情 + 分数拆解
    ui/                       shadcn/ui 组件（Radix 封装）
  lib/
    types.ts                 数据模型
    datasets.ts              内置数据集装载
    filter.ts                筛选引擎（学历/专业/政治面貌/基层/备注）
    major-map.ts             专业 → 专业类 / 学科门类 映射
    scoring.ts               竞争压力分与分档
    csv.ts                   CSV 解析、列名映射、导出
  data/                      内置数据集 JSON
src-tauri/
  src/lib.rs                 Rust 命令：表格解析、xlsx 导出、文本读取
  tauri.conf.json            窗口与打包配置
```
