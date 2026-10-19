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

/// 解析 .xls / .xlsx，自动跳过说明行定位表头
#[tauri::command]
fn parse_spreadsheet(path: String) -> Result<SheetData, String> {
    let mut workbook = open_workbook_auto(&path).map_err(|e| format!("打开表格失败: {e}"))?;
    let names = workbook.sheet_names().to_vec();

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

        // 找表头行：同时包含"职位"与（部门 / 用人 / 学历）的那一行
        let header_index = all.iter().position(|row| {
            let joined = row.join("");
            joined.contains("职位") && (joined.contains("部门") || joined.contains("用人") || joined.contains("学历"))
        });

        let Some(hi) = header_index else { continue };

        let headers = all[hi].clone();
        let mut rows: Vec<Vec<String>> = all
            .into_iter()
            .skip(hi + 1)
            .filter(|row| row.iter().any(|c| !c.trim().is_empty()))
            .collect();

        if rows.is_empty() {
            continue;
        }

        // 对齐列宽，避免短行导致索引越界
        let width = headers.len();
        for row in rows.iter_mut() {
            if row.len() < width {
                row.resize(width, String::new());
            }
        }

        return Ok(SheetData { headers, rows });
    }

    Err("未找到可识别的职位表（表头需包含“职位”以及“部门/用人司局/学历”等列）".into())
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
    fn parses_real_guokao_xls() {
        let Some(path) = sample_xls() else {
            eprintln!("跳过：未找到示例 xls 文件");
            return;
        };
        let data = parse_spreadsheet(path).expect("解析简体职位表失败");
        assert!(data.headers.iter().any(|h| h.contains("职位")), "表头应包含职位列");
        assert!(data.rows.len() > 1000, "应当解析出上千行职位，实际 {}", data.rows.len());
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
