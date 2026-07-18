import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { boot } from "./store";

// WebView2 在桌面应用中保留浏览器右键菜单不符合原生体验，全局禁用
document.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void boot();
