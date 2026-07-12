/**
 * 网格 + 顶部辉光 背景(v2 科技感核心)
 * 全页面 fixed,占用 z-index 0;内容容器 z-10
 */
export function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-grid bg-glow-top"
    />
  );
}
