// P02 · 首次启动语言选择(F13):中文 / English 二选一,选择后持久化并进入检测
import { ChevronRight, Terminal } from "lucide-react";

import { chooseLanguage } from "@/store";

function Option({
  main,
  sub,
  onClick,
}: {
  main: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-[220px] cursor-pointer flex-col items-start gap-0.5 rounded-lg border border-border bg-card p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_0_1px_var(--primary),0_0_20px_var(--primary-glow)]"
    >
      <span className="font-heading text-xl font-semibold">{main}</span>
      <span className="text-[13px] text-muted-foreground">{sub}</span>
      <ChevronRight className="absolute top-1/2 right-4 size-[18px] -translate-y-1/2 text-subtle group-hover:text-primary" />
    </button>
  );
}

export function LanguagePick() {
  return (
    <div className="bg-grid relative flex h-full items-center justify-center">
      <div className="bg-glow-top pointer-events-none absolute inset-x-0 top-0 bottom-[60%]" />
      <div className="z-[1] flex flex-col items-center gap-1 p-12">
        <div className="mb-4 flex size-16 items-center justify-center rounded-xl border border-[var(--primary-glow)] bg-card text-primary shadow-[0_0_24px_var(--primary-glow)]">
          <Terminal className="size-[26px]" />
        </div>
        <h1 className="text-[32px] font-bold">Scoop GUI</h1>
        {/* 首次选择前无语言偏好,双语并列呈现(此页即语言选择本身) */}
        <p className="mt-2 text-muted-foreground">选择界面语言 · Choose your language</p>
        <p className="mt-0.5 text-xs text-subtle">
          之后可在设置中随时切换 · You can change it anytime in Settings
        </p>
        <div className="mt-8 flex gap-4">
          <Option main="中文" sub="简体中文界面" onClick={() => void chooseLanguage("zh")} />
          <Option main="English" sub="English interface" onClick={() => void chooseLanguage("en")} />
        </div>
      </div>
    </div>
  );
}
