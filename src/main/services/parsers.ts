/**
 * Scoop CLI 输出文本解析器
 * 严格依据 `docs/acceptance/scoop-cli-reference.md` §3 给出的样本与正则建议
 * 错误返回:IPCResult 壳 + ErrorCode.E_SCOOP_PARSE_FAILED
 */

import { type IPCResult, ok, err } from '../../shared/ipc-result';
import { ErrorCode } from '../../shared/enums';
import type {
  AppInfo,
  BucketInfo,
  KnownBucket,
  AppDetail,
} from '../../shared/ipc-contract';

// ── scoop list(§3.3)───────────────────────────────────────────────
export function parseListOutput(text: string): IPCResult<AppInfo[]> {
  const lines = text.split(/\r?\n/);
  const dataRows: AppInfo[] = [];
  let foundHeader = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!foundHeader) {
      // 列头行锚:Name 多空格 Version 多空格 Source...
      if (/^Name\s+Version\s+Source\s+Updated\s+Info\s*$/.test(line)) {
        foundHeader = true;
        continue;
      }
      continue;
    }
    if (!line.trim() || line.startsWith('----')) continue;
    // 数据行:^(\S+)\s+(\S+)\s+(\S+)\s+(\S+\s\S+)(?:\s+(.*))?$
    const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+\s+\S+)(?:\s+(.*))?$/.exec(line);
    if (!m) continue;
    const [, name, version, source, updated, info] = m;
    if (!name) continue;
    dataRows.push({
      name,
      version: version ?? '',
      source: source ?? '',
      updated: updated ?? '',
      ...(info !== undefined ? { info } : {}),
    });
  }

  if (!foundHeader) {
    return err(ErrorCode.ScoopParseFailed, 'scoop list 输出缺少列头', text.slice(0, 200));
  }
  return ok(dataRows);
}

// ── scoop status(§3.4)─────────────────────────────────────────────
export interface OutdatedApp {
  name: string;
  installed: string;
  latest: string;
  info: string;
  isOutdated: boolean;
}

export function parseStatusOutput(text: string): IPCResult<OutdatedApp[]> {
  const lines = text.split(/\r?\n/);
  const out: OutdatedApp[] = [];
  let foundHeader = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!foundHeader) {
      // 列头:Name ... Installed Version ... Latest Version ... Missing Dependencies Info
      if (/^Name\s+Installed Version\s+Latest Version\s+Missing Dependencies\s+Info/.test(line)) {
        foundHeader = true;
        continue;
      }
      continue;
    }
    if (!line.trim() || line.startsWith('----')) continue;
    // 4 列定宽:Name(可空)Installed Latest Info
    // 用双空格分隔(Name 是单 token,Installed/Latest 可含空格)
    const tokens = line.split(/\s{2,}/);
    if (tokens.length < 3) continue;
    const [name, installed, latest, info] = tokens;
    if (!name) continue;
    // latest 为空表示已不在桶中(Install failed / Manifest removed),不视为过期
    const isOutdated = !!(latest && latest.trim() && latest.trim() !== (installed ?? '').trim());
    out.push({
      name,
      installed: installed ?? '',
      latest: latest ?? '',
      info: info ?? '',
      isOutdated,
    });
  }

  if (!foundHeader) {
    return err(ErrorCode.ScoopParseFailed, 'scoop status 输出缺少列头', text.slice(0, 200));
  }
  return ok(out);
}

// ── scoop bucket list(§3.5)───────────────────────────────────────
export function parseBucketListOutput(text: string): IPCResult<BucketInfo[]> {
  const lines = text.split(/\r?\n/);
  const out: BucketInfo[] = [];
  let foundHeader = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!foundHeader) {
      if (/^Name\s+Source\s+Updated\s+Manifests\s*$/.test(line)) {
        foundHeader = true;
        continue;
      }
      continue;
    }
    if (!line.trim() || line.startsWith('----')) continue;
    // 4 列:Name Source Updated Manifests
    const m = /^(\S+)\s+(\S+)\s+(\S+\s\S+)\s+(\d+)\s*$/.exec(line);
    if (!m) continue;
    const [, name, source, updated, manifests] = m;
    if (!name || !source) continue;
    let url: URL | null = null;
    try {
      url = new URL(source);
    } catch {
      continue;
    }
    out.push({
      name,
      source: url.toString(),
      updated: updated ?? '',
      manifests: manifests ? Number(manifests) : 0,
    });
  }

  if (!foundHeader) {
    return err(ErrorCode.ScoopParseFailed, 'scoop bucket list 输出缺少列头', text.slice(0, 200));
  }
  return ok(out);
}

// ── scoop bucket known(§3.6)───────────────────────────────────────
export function parseKnownBucketsOutput(text: string): IPCResult<KnownBucket[]> {
  const lines = text.split(/\r?\n/);
  const out: KnownBucket[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!/^\S+$/.test(line)) continue;
    out.push({ name: line });
  }
  return ok(out);
}

// ── scoop search(本期保守实现,从 search 输出解析)──────────────────
// 实际 scoop CLI 输出列头:`Name Version Source Binaries`(部分 bucket 可能带 Info)
// 数据行可空 bin 列:`Name<TAB>Version<TAB>Source` 或 `Name<TAB>Version<TAB>Source<TAB>...`
export function parseSearchOutput(text: string): IPCResult<AppInfo[]> {
  const lines = text.split(/\r?\n/);
  const out: AppInfo[] = [];
  let foundHeader = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!foundHeader) {
      // 接受 `Name ... Source ...` 的多种列头
      if (/^Name\s+.*\s+Source\s+/.test(line) && /Source\s+Binaries/.test(line)) {
        foundHeader = true;
        continue;
      }
      // 兜底:`Name Source Info`(旧 bucket 输出)
      if (/^Name\s+Source\s+Info\s*$/.test(line)) {
        foundHeader = true;
        continue;
      }
      continue;
    }
    if (!line.trim() || line.startsWith('----')) continue;
    const cols = line.split(/\s{2,}/);
    if (cols.length < 2) continue;
    const [name, version, source] = cols;
    if (!name) continue;
    out.push({
      name,
      version: version ?? '',
      source: source ?? '',
      ...(cols[3] !== undefined ? { info: cols[3] } : {}),
    });
  }

  if (!foundHeader) {
    return err(ErrorCode.ScoopParseFailed, 'scoop search 输出缺少列头', text.slice(0, 200));
  }
  return ok(out);
}

// ── scoop info <name>(§3.7)────────────────────────────────────────
// 实际输出:`Field : Value`(冒号两侧空格分隔,多行 Value 缩进)
// 例:
//   Name        : 7zip
//   Description : ...
//   Version     : 26.00 (Update to 26.02 available)
//   Notes       : line1
//                 line2(缩进续行)
export function parseInfoOutput(text: string): IPCResult<AppDetail | null> {
  const lines = text.split(/\r?\n/);
  const fields: Record<string, string> = {};
  let currentKey: string | null = null;
  for (const raw of lines) {
    // 匹配 `Key : Value`
    const m = /^([A-Za-z][A-Za-z ]+?)\s*:\s*(.*)$/.exec(raw.trimEnd());
    if (m) {
      const key = (m[1] ?? '').trim();
      const value = (m[2] ?? '').trim();
      if (key) {
        currentKey = key;
        fields[key] = value;
      }
    } else if (currentKey && raw.trim().length > 0) {
      // 缩进续行:合并到当前字段
      fields[currentKey] = `${fields[currentKey]}\n${raw.trim()}`;
    }
  }

  const name = fields['Name'];
  if (!name) return err(ErrorCode.ScoopParseFailed, 'scoop info 输出缺少 Name 字段', text.slice(0, 200));

  // `Version : 26.00 (Update to 26.02 available)` 解析 installed 和 latest
  const versionStr = fields['Version'] ?? '';
  const versionMatch = /^(\S+)\s*(?:\(Update to (\S+) available\))?/.exec(versionStr);
  const installed = versionMatch?.[1] ?? '';
  const latest = versionMatch?.[2] ?? '';
  // 单独 `Installed : 26.00` 覆盖(更新过)
  const installedField = fields['Installed'];

  const binaries = fields['Binaries']
    ? fields['Binaries'].split('|').map((s) => s.trim()).filter(Boolean)
    : [];

  return ok({
    name,
    version: installed || installedField || versionStr,
    source: fields['Source'] ?? '',
    description: fields['Description'] ?? '',
    homepage: fields['Website'] ?? '',
    info: latest ? `(Update to ${latest} available)` : fields['Notes'],
  });
}
