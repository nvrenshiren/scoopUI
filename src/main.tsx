import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { boot } from "./store";

// WebView2 在桌面应用中保留浏览器右键菜单不符合原生体验，全局禁用
document.addEventListener("contextmenu", (e) => e.preventDefault());

// 禁止普通界面通过 Ctrl+A / Cmd+A 选中内容,输入控件保留原生全选行为。
document.addEventListener("keydown", (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "a") return;

  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) return;

  event.preventDefault();
}, true);

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void boot();
