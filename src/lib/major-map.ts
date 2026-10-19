/**
 * 本科/研究生专业 → 所属类目（专业类）与门类 的映射表。
 * 国考职位表的“专业”栏大多填的是类目（如“计算机类”），只写专业名会全部落空，
 * 因此这里把专业名展开成 [专业名, 类目名, 门类匹配式] 再参与匹配。
 *
 * 数据依据：《普通高等学校本科专业目录（2024 年）》的学科门类 / 专业类划分，
 * 以及《研究生教育学科专业目录（2022 年）》的常见专业学位类别。
 */

type Group = {
  /** 专业类名称，如 "计算机类" */
  category: string;
  /** 学科门类，如 "工学" */
  discipline: string;
  /** 该专业类下的常见专业名 */
  majors: string[];
};

const GROUPS: Group[] = [
  {
    category: "计算机类",
    discipline: "工学",
    majors: [
      "计算机科学与技术", "软件工程", "网络工程", "信息安全", "物联网工程", "数字媒体技术",
      "智能科学与技术", "空间信息与数字技术", "电子与计算机工程", "数据科学与大数据技术",
      "网络空间安全", "人工智能", "区块链工程", "保密技术", "虚拟现实技术", "服务科学与工程",
      "计算机技术", "计算机应用技术", "计算机软件与理论", "计算机系统结构", "软件工程类",
    ],
  },
  {
    category: "电子信息类",
    discipline: "工学",
    majors: [
      "电子信息工程", "电子科学与技术", "通信工程", "微电子科学与工程", "光电信息科学与工程",
      "信息工程", "电子信息科学与技术", "集成电路设计与集成系统", "医学信息工程", "电磁场与无线技术",
      "电波传播与天线", "电信工程及管理", "应用电子技术教育", "水声工程", "海洋信息工程", "柔性电子学",
      "信息与通信工程", "电子与通信工程", "集成电路工程", "新一代电子信息技术",
    ],
  },
  {
    category: "自动化类",
    discipline: "工学",
    majors: ["自动化", "轨道交通信号与控制", "机器人工程", "邮政工程", "核电技术与控制工程", "智能装备与系统", "工业智能", "控制科学与工程", "控制工程"],
  },
  {
    category: "数学类",
    discipline: "理学",
    majors: ["数学与应用数学", "信息与计算科学", "数理基础科学", "数据计算及应用", "数学", "应用数学"],
  },
  {
    category: "统计学类",
    discipline: "理学",
    majors: ["统计学", "应用统计学", "应用统计"],
  },
  {
    category: "管理科学与工程类",
    discipline: "管理学",
    majors: ["管理科学", "信息管理与信息系统", "工程管理", "房地产开发与管理", "工程造价", "保密管理", "大数据管理与应用", "工程审计", "应急管理", "项目管理", "工业工程与管理", "物流工程与管理"],
  },
  {
    category: "工商管理类",
    discipline: "管理学",
    majors: ["工商管理", "市场营销", "会计学", "财务管理", "国际商务", "人力资源管理", "审计学", "资产评估", "物业管理", "文化产业管理", "劳动关系", "财务会计教育", "零售业管理", "会计", "审计"],
  },
  {
    category: "公共管理类",
    discipline: "管理学",
    majors: ["公共事业管理", "行政管理", "劳动与社会保障", "土地资源管理", "城市管理", "海关管理", "交通管理", "海事管理", "公共关系学", "健康服务与管理", "医疗保险"],
  },
  {
    category: "经济学类",
    discipline: "经济学",
    majors: ["经济学", "经济统计学", "国民经济管理", "资源与环境经济学", "商务经济学", "能源经济", "劳动经济学", "数字经济"],
  },
  { category: "财政学类", discipline: "经济学", majors: ["财政学", "税收学", "税务"] },
  {
    category: "金融学类",
    discipline: "经济学",
    majors: ["金融学", "金融工程", "保险学", "投资学", "金融数学", "信用管理", "经济与金融", "精算学", "互联网金融", "金融科技", "金融"],
  },
  {
    category: "经济与贸易类",
    discipline: "经济学",
    majors: ["国际经济与贸易", "贸易经济", "国际经济发展合作"],
  },
  {
    category: "法学类",
    discipline: "法学",
    majors: ["法学", "知识产权", "监狱学", "信用风险管理与法律防控", "国际经贸规则", "司法警察学", "社区矫正", "法律"],
  },
  {
    category: "中国语言文学类",
    discipline: "文学",
    majors: ["汉语言文学", "汉语言", "汉语国际教育", "中国少数民族语言文学", "古典文献学", "应用语言学", "秘书学", "中国语言与文化"],
  },
  {
    category: "新闻传播学类",
    discipline: "文学",
    majors: ["新闻学", "广播电视学", "广告学", "传播学", "编辑出版学", "网络与新媒体", "数字出版", "时尚传播", "国际新闻与传播"],
  },
  {
    category: "外国语言文学类",
    discipline: "文学",
    majors: ["英语", "俄语", "德语", "法语", "西班牙语", "阿拉伯语", "日语", "朝鲜语", "葡萄牙语", "翻译"],
  },
  {
    category: "土木类",
    discipline: "工学",
    majors: ["土木工程", "建筑环境与能源应用工程", "给排水科学与工程", "建筑电气与智能化", "城市地下空间工程", "道路桥梁与渡河工程", "铁道工程", "智能建造", "土木、水利与交通工程", "土木水利"],
  },
  {
    category: "建筑类",
    discipline: "工学",
    majors: ["建筑学", "城乡规划", "风景园林", "历史建筑保护工程", "人居环境科学与技术", "城市设计"],
  },
  {
    category: "机械类",
    discipline: "工学",
    majors: ["机械工程", "机械设计制造及其自动化", "材料成型及控制工程", "机械电子工程", "工业设计", "过程装备与控制工程", "车辆工程", "汽车服务工程", "智能制造工程"],
  },
  {
    category: "电气类",
    discipline: "工学",
    majors: ["电气工程及其自动化", "智能电网信息工程", "光源与照明", "电气工程与智能控制", "电机电器智能化", "电缆工程", "电气工程"],
  },
  { category: "化学类", discipline: "理学", majors: ["化学", "应用化学", "化学生物学", "分子科学与工程", "能源化学"] },
  {
    category: "化工与制药类",
    discipline: "工学",
    majors: ["化学工程与工艺", "制药工程", "资源循环科学与工程", "能源化学工程", "化学工程与工业生物工程"],
  },
  {
    category: "材料类",
    discipline: "工学",
    majors: ["材料科学与工程", "材料物理", "材料化学", "冶金工程", "金属材料工程", "无机非金属材料工程", "高分子材料与工程", "复合材料与工程", "新能源材料与器件"],
  },
  {
    category: "交通运输类",
    discipline: "工学",
    majors: ["交通运输", "交通工程", "航海技术", "轮机工程", "飞行技术", "交通设备与控制工程", "救助与打捞工程", "船舶电子电气工程", "轨道交通电气与控制", "交通运输工程"],
  },
  {
    category: "海洋工程类",
    discipline: "工学",
    majors: ["船舶与海洋工程", "海洋工程与技术", "海洋资源开发技术", "船舶与海洋结构物设计制造"],
  },
  {
    category: "航空航天类",
    discipline: "工学",
    majors: ["航空航天工程", "飞行器设计与工程", "飞行器制造工程", "飞行器动力工程", "航空宇航科学与技术"],
  },
  {
    category: "测绘类",
    discipline: "工学",
    majors: ["测绘工程", "遥感科学与技术", "导航工程", "地理国情监测", "地理空间信息工程"],
  },
  {
    category: "环境科学与工程类",
    discipline: "工学",
    majors: ["环境科学与工程", "环境工程", "环境科学", "环境生态工程", "环保设备工程", "资源环境科学", "水质科学与技术"],
  },
  { category: "生物科学类", discipline: "理学", majors: ["生物科学", "生物技术", "生物信息学", "生态学"] },
  { category: "物理学类", discipline: "理学", majors: ["物理学", "应用物理学", "核物理", "声学", "系统科学与工程"] },
  { category: "地理科学类", discipline: "理学", majors: ["地理科学", "自然地理与资源环境", "人文地理与城乡规划", "地理信息科学", "地理学"] },
  { category: "农业经济管理类", discipline: "管理学", majors: ["农林经济管理", "农村区域发展"] },
  { category: "电子商务类", discipline: "管理学", majors: ["电子商务", "电子商务及法律", "跨境电子商务"] },
  { category: "工业工程类", discipline: "管理学", majors: ["工业工程", "标准化工程", "质量管理工程"] },
  { category: "物流管理与工程类", discipline: "管理学", majors: ["物流管理", "物流工程", "采购管理", "供应链管理"] },
  {
    category: "能源动力类",
    discipline: "工学",
    majors: ["能源与动力工程", "能源与环境系统工程", "新能源科学与工程", "储能科学与工程"],
  },
  {
    category: "安全科学与工程类",
    discipline: "工学",
    majors: ["安全工程", "应急技术与管理", "职业卫生工程", "安全科学与工程"],
  },
  {
    category: "公安学类",
    discipline: "法学",
    majors: ["治安学", "侦查学", "边防管理", "禁毒学", "警犬技术", "经济犯罪侦查", "公安情报学", "犯罪学", "公安管理学", "涉外警务", "国内安全保卫", "警务指挥与战术"],
  },
  {
    category: "教育学类",
    discipline: "教育学",
    majors: ["教育学", "科学教育", "人文教育", "教育技术学", "艺术教育", "学前教育", "小学教育", "特殊教育", "华文教育"],
  },
  { category: "心理学类", discipline: "理学", majors: ["心理学", "应用心理学"] },
  { category: "历史学类", discipline: "历史学", majors: ["历史学", "世界史", "考古学", "文物与博物馆学"] },
  { category: "哲学类", discipline: "哲学", majors: ["哲学", "逻辑学", "宗教学", "伦理学"] },
  {
    category: "政治学类",
    discipline: "法学",
    majors: ["政治学与行政学", "国际政治", "外交学", "国际事务与国际关系", "政治学、经济学与哲学"],
  },
  { category: "社会学类", discipline: "法学", majors: ["社会学", "社会工作", "人类学", "家政学", "老年学"] },
  {
    category: "马克思主义理论类",
    discipline: "法学",
    majors: ["科学社会主义", "中国共产党历史", "思想政治教育", "马克思主义理论"],
  },
  {
    category: "图书情报与档案管理类",
    discipline: "管理学",
    majors: ["图书馆学", "档案学", "信息资源管理"],
  },
  {
    category: "旅游管理类",
    discipline: "管理学",
    majors: ["旅游管理", "酒店管理", "会展经济与管理", "旅游管理与服务教育"],
  },
  { category: "农业工程类", discipline: "工学", majors: ["农业工程", "农业机械化及其自动化", "农业水利工程", "农业电气化"] },
  { category: "水利类", discipline: "工学", majors: ["水利水电工程", "水文与水资源工程", "港口航道与海岸工程", "水务工程", "水利科学与工程"] },
  { category: "矿业类", discipline: "工学", majors: ["采矿工程", "石油工程", "矿物加工工程", "油气储运工程", "智能采矿工程"] },
  { category: "轻工类", discipline: "工学", majors: ["轻化工程", "包装工程", "印刷工程"] },
  { category: "纺织类", discipline: "工学", majors: ["纺织工程", "服装设计与工程", "非织造材料与工程"] },
  { category: "食品科学与工程类", discipline: "工学", majors: ["食品科学与工程", "食品质量与安全", "粮食工程", "乳品工程", "酿酒工程"] },
  { category: "核工程类", discipline: "工学", majors: ["核工程与核技术", "辐射防护与核安全", "工程物理", "核化工与核燃料工程"] },
  { category: "兵器类", discipline: "工学", majors: ["武器系统与工程", "武器发射工程", "探测制导与控制技术", "弹药工程与爆炸技术"] },
  { category: "林业工程类", discipline: "工学", majors: ["森林工程", "木材科学与工程", "林产化工"] },
  { category: "自然保护与环境生态类", discipline: "农学", majors: ["农业资源与环境", "野生动物与自然保护区管理", "水土保持与荒漠化防治"] },
  { category: "植物生产类", discipline: "农学", majors: ["农学", "园艺", "植物保护", "种子科学与工程", "设施农业科学与工程", "茶学"] },
  { category: "动物生产类", discipline: "农学", majors: ["动物科学", "蚕学", "蜂学"] },
  { category: "动物医学类", discipline: "农学", majors: ["动物医学", "动物药学", "动植物检疫"] },
  { category: "林学类", discipline: "农学", majors: ["林学", "园林", "森林保护", "经济林"] },
  { category: "水产类", discipline: "农学", majors: ["水产养殖学", "海洋渔业科学与技术", "水族科学与技术"] },
  { category: "基础医学类", discipline: "医学", majors: ["基础医学", "生物医学", "生物医学科学"] },
  { category: "临床医学类", discipline: "医学", majors: ["临床医学", "麻醉学", "医学影像学", "眼视光医学", "精神医学", "儿科学"] },
  { category: "公共卫生与预防医学类", discipline: "医学", majors: ["预防医学", "食品卫生与营养学", "妇幼保健医学", "卫生监督", "全球健康学"] },
  { category: "药学类", discipline: "医学", majors: ["药学", "药物制剂", "临床药学", "药事管理", "药物分析"] },
  { category: "中医学类", discipline: "医学", majors: ["中医学", "针灸推拿学", "中西医临床医学"] },
  { category: "护理学类", discipline: "医学", majors: ["护理学", "助产学"] },
];

/** 门类 → 职位表里可能出现的门类写法（正则片段） */
const DISCIPLINE_PATTERNS: Record<string, string[]> = {
  工学: ["工学类", "工学门类", "08工学", "08\\s*工学"],
  理学: ["理学类", "理学门类", "07理学", "07\\s*理学"],
  管理学: ["管理学类", "管理学门类", "12管理学", "12\\s*管理学"],
  经济学: ["经济学门类", "02经济学", "02\\s*经济学"],
  法学: ["法学门类", "03法学", "03\\s*法学"],
  文学: ["文学门类", "05文学", "05\\s*文学"],
  教育学: ["教育学门类", "04教育学"],
  历史学: ["历史学门类", "06历史学"],
  哲学: ["哲学门类", "01哲学"],
  农学: ["农学门类", "09农学"],
  医学: ["医学门类", "10医学"],
  军事学: ["军事学门类", "11军事学"],
  艺术学: ["艺术学门类", "13艺术学"],
};

const MAJOR_INDEX = new Map<string, Group>();
for (const g of GROUPS) {
  for (const m of g.majors) {
    if (!MAJOR_INDEX.has(m)) MAJOR_INDEX.set(m, g);
  }
}

export interface MajorExpansion {
  /** 原始关键词 */
  raw: string;
  /** 命中映射的类目（可能为空） */
  category?: string;
  /** 命中映射的门类（可能为空） */
  discipline?: string;
  /** 用于 includes 匹配的关键词（含专业名与类目名） */
  keywords: string[];
  /** 门类匹配用的正则 */
  disciplinePatterns: RegExp[];
}

export function expandMajor(profession: string): MajorExpansion {
  const raw = profession.trim();
  const group = MAJOR_INDEX.get(raw);
  const keywords = new Set<string>([raw]);
  const patterns: RegExp[] = [];

  if (group) {
    keywords.add(group.category);
    const pats = DISCIPLINE_PATTERNS[group.discipline] ?? [];
    for (const p of pats) patterns.push(new RegExp(p));
    return { raw, category: group.category, discipline: group.discipline, keywords: [...keywords], disciplinePatterns: patterns };
  }

  // 用户可能直接输入类目名（如“计算机类”“工商管理类”）
  const asCategory = GROUPS.find((g) => g.category === raw || g.category === `${raw}类`);
  if (asCategory) {
    keywords.add(asCategory.category);
    return { raw, category: asCategory.category, discipline: asCategory.discipline, keywords: [...keywords], disciplinePatterns: patterns };
  }

  // 输入门类名（如“管理学”“工学”）
  const disciplineName = Object.keys(DISCIPLINE_PATTERNS).find((d) => d === raw || d === raw.replace(/类$|门类$/, ""));
  if (disciplineName) {
    return {
      raw,
      discipline: disciplineName,
      keywords: [...keywords],
      disciplinePatterns: (DISCIPLINE_PATTERNS[disciplineName] ?? []).map((p) => new RegExp(p)),
    };
  }

  return { raw, keywords: [...keywords], disciplinePatterns: patterns };
}

export function expandMajors(query: string): MajorExpansion[] {
  return query
    .split(/[\s,，、;；]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(expandMajor);
}

/** 供 UI 展示：某个专业展开后覆盖的类目/门类描述 */
export function describeExpansion(exp: MajorExpansion): string {
  if (exp.category && exp.discipline) return `${exp.raw} → ${exp.discipline} / ${exp.category}`;
  if (exp.category) return `${exp.raw} → ${exp.category}`;
  if (exp.discipline) return `${exp.raw} → ${exp.discipline}门类`;
  return `${exp.raw}（未收录，按字面匹配）`;
}
