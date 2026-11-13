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
      className="group relative flex min-h-[104px] w-[220px] cursor-pointer flex-col items-start justify-center gap-1 rounded-xl border border-border/80 bg-background p-5 text-left transition-all duration-150 hover:border-primary/60 hover:bg-accent hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="font-heading text-xl font-semibold tracking-[-0.02em]">{main}</span>
      <span className="text-sm text-muted-foreground">{sub}</span>
      <ChevronRight className="absolute top-1/2 right-4 size-[18px] -translate-y-1/2 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

export function LanguagePick() {
  return (
    <div className="app-shell relative flex h-full items-center justify-center overflow-auto px-6 py-8">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-[1] flex w-full max-w-[640px] flex-col items-center rounded-xl border border-border/80 bg-card px-8 py-10 shadow-xl sm:px-12">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary text-primary shadow-sm">
          <Terminal className="size-[26px]" />
        </div>
        <h1 className="mb-0 text-[30px] font-semibold tracking-[-0.035em]">scoopUI</h1>
        {/* 首次选择前无语言偏好,双语并列呈现(此页即语言选择本身) */}
        <p className="mt-3 mb-0 text-sm text-muted-foreground">选择界面语言 · Choose your language</p>
        <p className="mt-1 text-xs text-subtle">
          之后可在设置中随时切换 · You can change it anytime in Settings
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Option main="中文" sub="简体中文界面" onClick={() => void chooseLanguage("zh")} />
          <Option main="English" sub="English interface" onClick={() => void chooseLanguage("en")} />
        </div>
      </div>
    </div>
  );
}
