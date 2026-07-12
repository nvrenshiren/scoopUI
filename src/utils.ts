/**
 * 规范化 scoop 输出中的"来源桶"值。
 * scoop info / list 的 Source 有时是 manifest 完整路径
 * (如 `D:\Scoop\user\buckets\main\bucket\opencode.json`),
 * 此时提取路径中的桶名(`main`);其余情况原样返回。
 */
export function bucketNameOf(source: string): string {
  const match = /[\\/]buckets[\\/]([^\\/]+)[\\/]/i.exec(source);
  return match ? match[1] : source;
}
