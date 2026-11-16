import { Package, Search } from "lucide-react";

import { t } from "@/i18n";
import { useApp, useLang } from "@/store";
import type { PackageTab } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstalledView } from "@/pages/InstalledView";
import { BrowseView } from "@/pages/BrowseView";

export function PackagesView() {
  useLang();
  const tab = useApp((s) => s.packageTab);
  const installedCount = useApp((s) => s.installed.length);
  const availableCount = useApp((s) => s.available.length);

  function selectTab(next: string) {
    useApp.setState({ packageTab: next as PackageTab });
  }

  return (
    <Tabs value={tab} onValueChange={selectTab} className="flex h-full min-w-0 flex-col">
      <div className="shrink-0 px-8 pt-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <Package className="size-3.5" aria-hidden="true" />
            {t("packages.eyebrow")}
          </div>
          <h1 className="mb-1 text-2xl font-semibold tracking-[-0.035em]">{t("packages.title")}</h1>
          <p className="mb-0 text-sm text-muted-foreground">{t("packages.desc")}</p>
        </div>

        <TabsList aria-label={t("packages.title")} className="mt-5 h-auto w-fit gap-1 rounded-none border-b border-border/75 bg-transparent p-0">
          <TabsTrigger
            value="catalog"
            className="h-11 rounded-none border-b-2 px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Search className="size-3.5" aria-hidden="true" />
            {t("packages.tab.catalog")}
            {availableCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {availableCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="installed"
            className="h-11 rounded-none border-b-2 px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            {t("packages.tab.installed")}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {installedCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="catalog" className="min-h-0 flex-1">
        <BrowseView embedded />
      </TabsContent>
      <TabsContent value="installed" className="min-h-0 flex-1">
        <InstalledView embedded />
      </TabsContent>
    </Tabs>
  );
}
