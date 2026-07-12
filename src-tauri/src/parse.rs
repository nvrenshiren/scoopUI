//! Scoop CLI 文本输出解析(Scoop 无 --json,走文本表格路线,PRD §4)。
//!
//! Scoop 的表格由 PowerShell Format-Table 生成:表头行下是 dash 分隔行,
//! 每个 dash 段的**起始位置**即该列的起始位置(dash 长度只等于表头词长,
//! 不代表列宽;列值可以比 dash 段长,但不会越过下一列起点)。
//! 因此按 dash 段起点切列,能正确处理含空格的值(如 Updated 日期时间)。

use regex::Regex;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    pub name: String,
    pub version: String,
    pub source: String,
    pub updated: String,
    pub info: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StatusEntry {
    pub name: String,
    pub installed_version: String,
    pub latest_version: String,
    pub missing_dependencies: String,
    pub info: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub name: String,
    pub version: String,
    pub source: String,
    pub binaries: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BucketInfo {
    pub name: String,
    pub source: String,
    pub updated: String,
    pub manifests: String,
}

pub fn strip_ansi(text: &str) -> String {
    let re = Regex::new(r"\x1b\[[0-9;]*[A-Za-z]").unwrap();
    re.replace_all(text, "").into_owned()
}

/// 在文本中找到 dash 分隔行,按 dash 段起点把其后的每一行切成列。
/// 返回 (每行的列值数组);列数 = dash 段数。
fn parse_table(text: &str) -> Vec<Vec<String>> {
    let clean = strip_ansi(text);
    let lines: Vec<&str> = clean.lines().collect();

    // 找 dash 分隔行:仅由 '-' 和空格组成,且至少含一个 '-'
    let sep_idx = match lines.iter().position(|l| {
        let t = l.trim_end();
        !t.is_empty() && t.chars().all(|c| c == '-' || c == ' ') && t.contains('-')
    }) {
        Some(i) => i,
        None => return Vec::new(),
    };

    // dash 段起点 = 列起点
    let sep = lines[sep_idx];
    let bytes = sep.as_bytes();
    let mut starts: Vec<usize> = Vec::new();
    let mut in_dash = false;
    for (i, b) in bytes.iter().enumerate() {
        if *b == b'-' && !in_dash {
            starts.push(i);
            in_dash = true;
        } else if *b != b'-' {
            in_dash = false;
        }
    }
    if starts.is_empty() {
        return Vec::new();
    }

    let mut rows = Vec::new();
    for line in lines.iter().skip(sep_idx + 1) {
        if line.trim().is_empty() {
            // 表格结束(scoop 表格后可能还有其它段落)
            break;
        }
        let mut cols = Vec::with_capacity(starts.len());
        for (ci, &start) in starts.iter().enumerate() {
            let end = starts.get(ci + 1).copied().unwrap_or(line.len());
            let start = start.min(line.len());
            let end = end.min(line.len()).max(start);
            cols.push(line[start..end].trim().to_string());
        }
        // 首列为空的行不是数据行
        if cols.first().map(|c| c.is_empty()).unwrap_or(true) {
            continue;
        }
        rows.push(cols);
    }
    rows
}

fn col(row: &[String], i: usize) -> String {
    row.get(i).cloned().unwrap_or_default()
}

pub fn parse_list(text: &str) -> Vec<InstalledApp> {
    parse_table(text)
        .into_iter()
        .map(|r| InstalledApp {
            name: col(&r, 0),
            version: col(&r, 1),
            source: col(&r, 2),
            updated: col(&r, 3),
            info: col(&r, 4),
        })
        .collect()
}

pub fn parse_status(text: &str) -> Vec<StatusEntry> {
    parse_table(text)
        .into_iter()
        .map(|r| StatusEntry {
            name: col(&r, 0),
            installed_version: col(&r, 1),
            latest_version: col(&r, 2),
            missing_dependencies: col(&r, 3),
            info: col(&r, 4),
        })
        .collect()
}

pub fn parse_search(text: &str) -> Vec<SearchResult> {
    parse_table(text)
        .into_iter()
        .map(|r| SearchResult {
            name: col(&r, 0),
            version: col(&r, 1),
            source: col(&r, 2),
            binaries: col(&r, 3),
        })
        .collect()
}

pub fn parse_bucket_list(text: &str) -> Vec<BucketInfo> {
    parse_table(text)
        .into_iter()
        .map(|r| BucketInfo {
            name: col(&r, 0),
            source: col(&r, 1),
            updated: col(&r, 2),
            manifests: col(&r, 3),
        })
        .collect()
}

/// `scoop bucket known`:每行一个桶名。
pub fn parse_known_buckets(text: &str) -> Vec<String> {
    strip_ansi(text)
        .lines()
        .map(|l| l.trim())
        .filter(|l| {
            !l.is_empty()
                && !l.contains(' ')
                && l.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.')
        })
        .map(|l| l.to_string())
        .collect()
}

/// `scoop info <app>`:`Key : Value` 键值对,续行(前导空白)并入上一个值。
pub fn parse_info(text: &str) -> Vec<(String, String)> {
    let clean = strip_ansi(text);
    let re = Regex::new(r"^([A-Za-z][A-Za-z0-9 ]*?)\s*:\s?(.*)$").unwrap();
    let mut pairs: Vec<(String, String)> = Vec::new();
    for line in clean.lines() {
        if line.trim().is_empty() {
            continue;
        }
        if line.starts_with(char::is_whitespace) {
            // 续行 → 追加到上一个键的值
            if let Some(last) = pairs.last_mut() {
                if !last.1.is_empty() {
                    last.1.push('\n');
                }
                last.1.push_str(line.trim());
            }
            continue;
        }
        if let Some(caps) = re.captures(line) {
            pairs.push((caps[1].trim().to_string(), caps[2].trim().to_string()));
        }
    }
    pairs
}

#[cfg(test)]
mod tests {
    use super::*;

    // 以下样例均为本机 Scoop 0.5.3 真实输出
    const LIST_SAMPLE: &str = "Installed apps:\n\nName                  Version          Source                                          Updated             Info        \n----                  -------          ------                                          -------             ----        \n7zip                  26.00            main                                            2026-03-07 20:43:49             \nClashforWindow        0.20.39          apps                                            2024-11-17 01:10:48 Install f...\nclaude                1.20186.1        extras                                          2026-07-11 00:11:01             \n";

    const STATUS_SAMPLE: &str = "WARN  Scoop bucket(s) out of date. Run 'scoop update' to get the latest changes.\n\nName            Installed Version Latest Version Missing Dependencies Info                            \n----            ----------------- -------------- -------------------- ----                            \n7zip            26.00             26.02                                                               \nClashforWindow  0.20.39                                               Install failed, Manifest removed\nchrome-portable 149.0.7827.156    150.0.7871.115                                                      \n";

    const SEARCH_SAMPLE: &str = "Results from local buckets...\n\nName         Version Source Binaries\n----         ------- ------ --------\nyazi         26.5.6  main           \nyazi-nightly dbb0cc0 apps           \n";

    const BUCKET_SAMPLE: &str = "\nName       Source                                             Updated            Manifests\n----       ------                                             -------            ---------\nmain       https://github.com/ScoopInstaller/Main             2026/7/10 22:23:33      1608\nnerd-fonts https://github.com/matthewjberger/scoop-nerd-fonts 2026/6/27 11:09:10       367\n";

    const INFO_SAMPLE: &str = "\nName        : 7zip\nDescription : A multi-format file archiver with high compression ratios.\nVersion     : 26.00 (Update to 26.02 available)\nSource      : main\nWebsite     : https://www.7-zip.org\nNotes       : To register the context menu entry, please execute the following command:\n              reg import \"<root>\\install-context.reg\"\n";

    #[test]
    fn parses_list() {
        let apps = parse_list(LIST_SAMPLE);
        assert_eq!(apps.len(), 3);
        assert_eq!(apps[0].name, "7zip");
        assert_eq!(apps[0].version, "26.00");
        assert_eq!(apps[0].source, "main");
        assert_eq!(apps[0].updated, "2026-03-07 20:43:49");
        assert_eq!(apps[1].info, "Install f...");
        assert_eq!(apps[2].name, "claude");
    }

    #[test]
    fn parses_status() {
        let entries = parse_status(STATUS_SAMPLE);
        assert_eq!(entries.len(), 3);
        assert_eq!(entries[0].name, "7zip");
        assert_eq!(entries[0].installed_version, "26.00");
        assert_eq!(entries[0].latest_version, "26.02");
        assert_eq!(entries[1].latest_version, "");
        assert_eq!(entries[1].info, "Install failed, Manifest removed");
        assert_eq!(entries[2].latest_version, "150.0.7871.115");
    }

    #[test]
    fn parses_search() {
        let results = parse_search(SEARCH_SAMPLE);
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].name, "yazi");
        assert_eq!(results[0].version, "26.5.6");
        assert_eq!(results[0].source, "main");
        assert_eq!(results[1].name, "yazi-nightly");
    }

    #[test]
    fn parses_bucket_list() {
        let buckets = parse_bucket_list(BUCKET_SAMPLE);
        assert_eq!(buckets.len(), 2);
        assert_eq!(buckets[0].name, "main");
        assert_eq!(buckets[0].source, "https://github.com/ScoopInstaller/Main");
        assert_eq!(buckets[0].updated, "2026/7/10 22:23:33");
        assert_eq!(buckets[0].manifests, "1608");
        assert_eq!(buckets[1].manifests, "367");
    }

    #[test]
    fn parses_known_buckets() {
        let known = parse_known_buckets("main\nextras\nversions\nnerd-fonts\n");
        assert_eq!(known, vec!["main", "extras", "versions", "nerd-fonts"]);
    }

    #[test]
    fn parses_info() {
        let pairs = parse_info(INFO_SAMPLE);
        assert_eq!(pairs[0], ("Name".into(), "7zip".into()));
        assert_eq!(pairs[2].0, "Version");
        assert_eq!(pairs[2].1, "26.00 (Update to 26.02 available)");
        let notes = pairs.iter().find(|(k, _)| k == "Notes").unwrap();
        assert!(notes.1.contains("reg import"));
    }

    #[test]
    fn strips_ansi_sequences() {
        assert_eq!(strip_ansi("\x1b[32mgreen\x1b[0m"), "green");
    }
}
