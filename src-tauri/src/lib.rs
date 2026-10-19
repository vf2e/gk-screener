use calamine::{open_workbook_auto, Data, Reader};
use serde::Serialize;
use std::fs;

#[derive(Serialize)]
struct SheetData {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
}

/// 读取文本文件（CSV/TSV），供浏览器端无法直接读盘时使用
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {e}"))
}

fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::Empty => String::new(),
        Data::String(s) => s.trim().to_string(),
        Data::Float(f) => {
            if f.fract() == 0.0 {
                format!("{}", *f as i64)
            } else {
                format!("{f}")
            }
        }
        Data::Int(i) => format!("{i}"),
        Data::Bool(b) => format!("{b}"),
        other => other.to_string().trim().to_string(),
    }
}

/// 表头行判定：命中足够多的关键列名，且该行有足够多的非空单元格。
/// 只靠“包含职位二字”会误判——简章第 1 行提示语里就同时有“招考职位”“专业”“学历”。
fn is_header_row(row: &[String]) -> bool {
    const KEYS: [&str; 7] = ["部门名称", "用人司局", "招考职位", "职位代码", "招考人数", "专业", "学历"];
    let joined = row.join("");
    let hits = KEYS.iter().filter(|k| joined.contains(*k)).count();
    let non_empty = row.iter().filter(|c| !c.trim().is_empty()).count();
    hits >= 3 && non_empty >= 5
}

/// 解析 .xls / .xlsx，自动跳过说明行定位表头，并合并所有工作表的数据行
#[tauri::command]
fn parse_spreadsheet(path: String) -> Result<SheetData, String> {
    let mut workbook = open_workbook_auto(&path).map_err(|e| format!("打开表格失败: {e}"))?;
    let names = workbook.sheet_names().to_vec();

    let mut merged_headers: Vec<String> = Vec::new();
    let mut merged_rows: Vec<Vec<String>> = Vec::new();

    for name in names {
        let range = match workbook.worksheet_range(&name) {
            Ok(r) => r,
            Err(_) => continue,
        };
        let all: Vec<Vec<String>> = range
            .rows()
            .map(|row| row.iter().map(cell_to_string).collect())
            .collect();
        if all.len() < 2 {
            continue;
        }

        let Some(hi) = all.iter().position(|row| is_header_row(row)) else {
            continue;
        };
        let headers = all[hi].clone();

        // 以第一个命中的工作表为列基准，列数不一致的工作表跳过（避免错位）
        if merged_headers.is_empty() {
            merged_headers = headers.clone();
        } else if headers.len() != merged_headers.len() {
            continue;
        }

        let width = merged_headers.len();
        for mut row in all.into_iter().skip(hi + 1) {
            if row.iter().all(|c| c.trim().is_empty()) {
                continue;
            }
            if row.len() < width {
                row.resize(width, String::new());
            }
            merged_rows.push(row);
        }
    }

    if merged_headers.is_empty() || merged_rows.is_empty() {
        return Err("未找到可识别的职位表（表头需包含“部门名称/用人司局/招考职位/招考人数”等列）".into());
    }

    Ok(SheetData {
        headers: merged_headers,
        rows: merged_rows,
    })
}

#[tauri::command]
fn export_xlsx(path: String, headers: Vec<String>, rows: Vec<Vec<String>>) -> Result<(), String> {
    use rust_xlsxwriter::Workbook;

    let mut workbook = Workbook::new();
    let sheet = workbook.add_worksheet();
    sheet.set_name("筛选结果").map_err(|e| e.to_string())?;

    for (c, h) in headers.iter().enumerate() {
        sheet
            .write_string(0, c as u16, h)
            .map_err(|e| format!("写入表头失败: {e}"))?;
    }
    for (r, row) in rows.iter().enumerate() {
        for (c, v) in row.iter().enumerate() {
            sheet
                .write_string((r + 1) as u32, c as u16, v)
                .map_err(|e| format!("写入第 {} 行失败: {e}", r + 2))?;
        }
    }

    sheet
        .set_freeze_panes(1, 0)
        .map_err(|e| e.to_string())?;
    sheet.set_column_width(0, 8.0).map_err(|e| e.to_string())?;
    sheet.set_column_width(1, 12.0).map_err(|e| e.to_string())?;
    sheet.set_column_width(13, 60.0).map_err(|e| e.to_string())?;
    sheet.set_column_width(15, 60.0).map_err(|e| e.to_string())?;

    workbook
        .save(&path)
        .map_err(|e| format!("保存失败: {e}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            parse_spreadsheet,
            export_xlsx
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn sample_xls() -> Option<String> {
        // 工作目录下的真实《2027 年度招考简章》，用于验证 .xls 解析链路
        let p = Path::new("../中央机关及其直属机构2027年度考试录用公务员招考简章.xls");
        if p.exists() {
            Some(p.to_string_lossy().to_string())
        } else {
            None
        }
    }

    #[test]
    fn header_row_detection_ignores_notice_line() {
        // 简章第 1 行是说明文字，含“招考职位”“专业”“学历”，不能被当成表头
        let notice = vec![
            "招考职位由招录机关编报，招录专业、学历等与职位资格条件相关的问题，由招录机关负责解释。".to_string(),
        ];
        assert!(!is_header_row(&notice), "说明行被误判为表头");

        let header: Vec<String> = [
            "部门代码", "部门名称", "用人司局", "机构性质", "招考职位", "职位属性", "职位分布",
            "职位简介", "职位代码", "机构层级", "考试类别", "招考人数", "专业", "学历", "学位",
            "政治面貌", "基层工作最低年限", "服务基层项目工作经历", "是否在面试阶段组织专业能力测试",
            "面试人员比例", "工作地点", "落户地点", "备注", "部门网站", "咨询电话1", "咨询电话2",
            "咨询电话3",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();
        assert!(is_header_row(&header), "标准表头未被识别");
    }

    #[test]
    fn parses_real_guokao_xls() {
        let Some(path) = sample_xls() else {
            eprintln!("跳过：未找到示例 xls 文件");
            return;
        };
        let data = parse_spreadsheet(path).expect("解析简体职位表失败");

        // 表头必须落在真正的列名行上，而不是第 1 行的说明文字
        assert!(
            data.headers.len() >= 20,
            "表头列数异常（可能是说明行被当成表头）：{}",
            data.headers.len()
        );
        for key in ["部门名称", "用人司局", "招考职位", "职位代码", "招考人数", "专业"] {
            assert!(
                data.headers.iter().any(|h| h.contains(key)),
                "表头缺少关键列：{key}"
            );
        }
        assert_eq!(data.headers.first().map(|s| s.as_str()), Some("部门代码"));

        // 首行数据应当是真实岗位，不能再出现列名
        assert!(
            !data.rows[0].iter().any(|c| c == "用人司局"),
            "首行数据仍是表头，说明表头行定位偏移"
        );
        assert!(data.rows.len() > 19000, "应当合并全部工作表（约 19426 行），实际 {}", data.rows.len());
        assert!(data.rows.iter().any(|r| r.iter().any(|c| c.contains("税务局"))));
        eprintln!("解析成功：{} 列 / {} 行", data.headers.len(), data.rows.len());
    }

    #[test]
    fn exports_xlsx() {
        let dir = std::env::temp_dir();
        let path = dir.join("job-screener-test.xlsx");
        let path_str = path.to_string_lossy().to_string();
        let headers = vec!["档位".to_string(), "部门".to_string(), "职位".to_string()];
        let rows = vec![
            vec!["冲".to_string(), "国家税务总局".to_string(), "一级行政执法员".to_string()],
            vec!["保".to_string(), "武汉海关".to_string(), "四级主管".to_string()],
        ];
        export_xlsx(path_str, headers, rows).expect("导出 xlsx 失败");
        let meta = std::fs::metadata(&path).expect("产物不存在");
        assert!(meta.len() > 0, "导出文件不应为空");
        let _ = std::fs::remove_file(&path);
    }
}
