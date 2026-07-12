# Scoop CLI 技术参考(QA 调试 / 解析器编写)

> 文档定位:QA 调试参考 + 解析器编写依据
> 数据来源:本机已安装的 Scoop `0.5.3`(commit `b588a06e`)+ 官方仓库 [ScoopInstaller/Scoop](https://github.com/ScoopInstaller/Scoop) / [ScoopInstaller/Install](https://github.com/ScoopInstaller/Install)
> 数据采集时间:2026-07-11
> 适用范围:scoop-gui 项目所有与 `scoop` CLI 交互的模块

---

## 1. 环境信息

| 项 | 值 |
| --- | --- |
| CLI 版本 | `0.5.3`(commit `b588a06e chore(release): Bump to version 0.5.3`) |
| 默认安装根目录 | `D:\Scoop` |
| 默认全局目录 | `D:\Scoop\GlobalApps`(需管理员) |
| 默认缓存目录 | `D:\Scoop\cache` |
| PATH 注入位置 | `D:\Scoop\shims`(用户级) |
| 已添加桶 | main / extras / nerd-fonts / apps |
| 主仓库 | https://github.com/ScoopInstaller/Scoop |
| 安装脚本仓库 | https://github.com/ScoopInstaller/Install |

> **重要**:上述版本/路径/桶列表会随本机状态变化而漂移。Scoop 自身通过 `scoop update` 自更新;本产品不主动升级 Scoop。

---

## 2. 全量命令清单(共 25 个)

按字母排序,**[GUI]** 标记表示 MVP 阶段一会用到。

| # | 命令 | 用途 | GUI 范围 |
| ---: | --- | --- | --- |
| 1 | `alias` | 管理 Scoop 自定义别名 | 后续阶段 |
| 2 | `bucket` | 桶管理(add / list / known / rm) | **[GUI]** |
| 3 | `cache` | 显示或清理下载缓存 | 后续阶段 |
| 4 | `cat` | 展示某个 manifest 的内容 | 不在范围 |
| 5 | `checkup` | 诊断潜在问题 | 不在范围 |
| 6 | `cleanup` | 清理旧版本 | 后续阶段(备份还原相关) |
| 7 | `config` | 读写 Scoop 配置 | 后续阶段(配置编辑) |
| 8 | `create` | 创建自定义 manifest | 不在范围 |
| 9 | `depends` | 列出依赖顺序 | 不在范围 |
| 10 | `download` | 仅下载,不安装 | 不在范围 |
| 11 | `export` | 导出已装应用清单为 JSON | 后续阶段(备份还原) |
| 12 | `help` | 命令帮助 | — |
| 13 | `hold` | 锁定应用以禁用更新 | 后续阶段 |
| 14 | `home` | 打开应用主页 | 不在范围 |
| 15 | `import` | 从 JSON 导入并安装 | 后续阶段(备份还原) |
| 16 | `info` | 显示应用信息 | **[GUI]** |
| 17 | `install` | 安装应用 | **[GUI]** |
| 18 | `list` | 列出已装应用 | **[GUI]** |
| 19 | `prefix` | 返回应用路径 | 调试用(不暴露 UI) |
| 20 | `reset` | 重置应用以解决冲突 | 不在范围 |
| 21 | `search` | 搜索应用 | **[GUI]** |
| 22 | `shim` | 管理 shims | 后续阶段(shims 管理) |
| 23 | `status` | 显示过期状态 | **[GUI]** |
| 24 | `unhold` | 解除锁定 | 后续阶段 |
| 25 | `uninstall` | 卸载应用 | **[GUI]** |
| 26 | `update` | 更新应用或 Scoop 自身 | **[GUI]** |
| 27 | `virustotal` | 在 VirusTotal 上查询哈希 | 不在范围 |
| 28 | `which` | 定位 shim/可执行文件 | 调试用(不暴露 UI) |

---

## 3. 关键发现(写解析器必看)

### 3.1 Scoop 不直接支持 `--json` 输出

- `scoop list --json` 实际行为:把 `--json` 当作**查询字符串**过滤应用名,返回 `Installed apps matching '--json':`(空结果),**不是** JSON 输出。
- `scoop info --json`、`scoop status --json` 同样不生效。
- `scoop export` 是唯一原生 JSON 输出(导到文件/管道)。

**结论**:所有解析器必须走**文本/表格正则路线**,不能依赖 `--json` 参数。

### 3.2 输出格式特征

- **表格**:有列头(列名间含多空格对齐),数据行紧随其后,空行结尾。
- **进度**:install / uninstall / update 输出非结构化文本,逐行 `Downloading...`、`Extracting...`、`Installing...` 等提示。
- **错误**:命令失败时 stderr 输出 `ERROR  ...` 前缀(具体前缀格式需样本验证,见 §6)。
- **退出码**:成功 = 0;参数/执行错误视具体命令而定(virustotal 文档化退出码见 §5)。

### 3.3 `scoop list` 默认输出样本

```
Installed apps:

Name                  Version          Source                                          Updated             Info
----                  -------          ------                                          -------             ----
7zip                  26.00            main                                            2026-03-07 20:43:49
7zip19.00-helper      19.00            main                                            2026-03-07 20:43:57
android-studio        2025.3.2.6       extras                                          2026-03-29 05:53:35
claude                1.20186.1        extras                                          2026-07-11 00:11:01
```

**正则建议**(以列为锚点):
- 列头行锚:`^Name\s+Version\s+Source\s+Updated\s+Info\s*$`
- 数据行:`^(?<name>\S+)\s+(?<version>\S+)\s+(?<source>\S+)\s+(?<updated>\S+\s\S+)(?:\s+(?<info>.*))?$`
- 表格前会有 `Installed apps:` 或 `Installed apps matching '<query>':` 单行。

### 3.4 `scoop status` 输出样本

```
Scoop is up to date.

Name            Installed Version Latest Version Missing Dependencies Info
----            ----------------- -------------- -------------------- ----
7zip            26.00             26.02
android-studio  2025.3.2.6        2026.1.1.10
ClashforWindow  0.20.39                                               Install failed, Manifest removed
```

**正则建议**:
- 列头行锚:`^Name\s+Installed Version\s+Latest Version.*$`
- 数据行:`^(?<name>\S+)\s+(?<installed>\S+)\s+(?<latest>\S*)\s*(?<missing>\S*)\s+(?<info>.*)$`
- "Manifest removed" 之类的失败标记在 `info` 列。

### 3.5 `scoop bucket list` 输出样本

```
Name       Source                                             Updated            Manifests
----       ------                                             -------            ---------
main       https://github.com/ScoopInstaller/Main             2026/7/10 22:23:33      1608
extras     https://github.com/ScoopInstaller/Extras           2026/7/10 22:23:53      2344
apps       https://github.com/kkzzhizhou/scoop-apps           2026/7/10 23:32:53     16888
```

**正则建议**:列头锚 `^Name\s+Source\s+Updated\s+Manifests\s*$`,数据行 4 列。

### 3.6 `scoop bucket known` 输出样本

```
main
extras
versions
nirsoft
sysinternals
php
nerd-fonts
nonportable
java
games
```

**格式**:每行一个桶名,无表头。`^\S+$` 即可。

### 3.7 `scoop info <name>` 输出样本(待补)

> **待采集**:安装一个测试应用或选一个轻量应用运行 `scoop info <name>` 抓取实际输出。
> 预期输出:表格含 Name / Description / Version / Bucket / Updated 等列。

---

## 4. GUI 涉及命令的详细参数

### 4.1 `scoop install <app> [options]`

| 选项 | 简写 | 含义 |
| --- | --- | --- |
| `--global` | `-g` | 全局安装(写到 `ScoopGlobalDir`,需管理员) |
| `--independent` | `-i` | 不自动安装依赖 |
| `--no-cache` | `-k` | 不使用下载缓存 |
| `--skip-hash-check` | `-s` | 跳过哈希校验(慎用) |
| `--no-update-scoop` | `-u` | 不在安装前升级 Scoop |
| `--arch` | `-a` | 指定架构:`32bit` / `64bit` / `arm64` |

支持的 `<app>` 形态:
- `scoop install git`
- `scoop install gh@2.7.0`(指定版本)
- `scoop install https://...bucket/app.json`(URL manifest)
- `scoop install \path\to\app.json`(本地 manifest)

### 4.2 `scoop uninstall <app> [options]`

| 选项 | 简写 | 含义 |
| --- | --- | --- |
| `--global` | `-g` | 卸载全局应用 |
| `--purge` | `-p` | 同时清除持久数据 |

### 4.3 `scoop update [app|*] [options]`

- `scoop update`:更新 Scoop 自身
- `scoop update <app>`:更新单个应用
- `scoop update *` 或 `scoop update --all`:更新所有过期应用

| 选项 | 简写 | 含义 |
| --- | --- | --- |
| `--force` | `-f` | 强制更新(无新版本也更新) |
| `--global` | `-g` | 更新全局应用 |
| `--independent` | `-i` | 不自动安装依赖 |
| `--no-cache` | `-k` | 不使用下载缓存 |
| `--skip-hash-check` | `-s` | 跳过哈希校验 |
| `--quiet` | `-q` | 静默模式 |
| `--all` | `-a` | 更新所有(等价于 `*`) |

### 4.4 `scoop search <query>`

- 无查询参数:列出所有可用应用
- 有查询参数:
  - 启用 `use_sqlite_cache` 时,匹配应用名 / 二进制 / 快捷方式
  - 未启用时,作为正则匹配应用名 / 二进制

### 4.5 `scoop info <app> [options]`

| 选项 | 简写 | 含义 |
| --- | --- | --- |
| `--verbose` | `-v` | 显示完整路径与 URL |

### 4.6 `scoop list [query]`

- 无查询参数:列出所有已装应用
- 有查询参数:按应用名过滤

### 4.7 `scoop status [options]`

| 选项 | 简写 | 含义 |
| --- | --- | --- |
| `--local` | `-l` | 仅本地检查,禁用远程获取(快速模式) |

### 4.8 `scoop bucket add|list|known|rm [<args>]`

| 子命令 | 形式 | 含义 |
| --- | --- | --- |
| `add` | `scoop bucket add <name> [<repo>]` | 添加桶;已知桶可省略 repo |
| `list` | `scoop bucket list` | 列出已添加桶 |
| `known` | `scoop bucket known` | 列出 Scoop 已知桶 |
| `rm` | `scoop bucket rm <name>` | 移除桶 |

---

## 5. 退出码约定(已文档化部分)

仅 `virustotal` 子命令官方文档化了退出码:

| 退出码 | 含义 |
| ---: | --- |
| 0 | 成功 |
| 1 | 参数解析错误 |
| 2 | 至少一个包被 VirusTotal 标记为不安全 |
| 4 | 查询时发生异常 |
| 8 | 至少一个包查询失败(manifest 找不到) |
| 16 | VirusTotal API key 未配置 |
| (组合) | 2/4/8 可按位组合,例如 6 = 2 + 4 |

**其它命令**的退出码未在官方文档明确列出,需通过实测归纳。建议的兜底策略:

- `exitCode === 0`:成功
- `exitCode === 1`:通用错误(scoop 通用约定)
- `exitCode < 0`:本产品自定义(命令未找到、IPC 自身错误)
- 其它:解析 stderr 内容做业务化错误提示

---

## 6. 待补样本 / 待确认

QA 调试阶段需补抓的样本(开发阶段可一并补):

- [ ] `scoop info <app>` 实际输出(选一个轻量应用,如 `7zip`)
- [ ] `scoop install <app>` 进度文本样本(下载链接/百分比格式)
- [ ] `scoop uninstall <app>` 进度文本样本
- [ ] `scoop update <app>` / `scoop update *` 进度文本样本
- [ ] `scoop bucket add extras` 实际输出
- [ ] `scoop bucket rm <name>` 实际输出
- [ ] 典型错误输出样本(找不到包、权限不足、网络失败)
- [ ] `SCOOP_NOT_FOUND` 行为(不存在的命令 vs 没安装 scoop)
- [ ] 单实例约束在 scoop 自身是否有并发保护(同机并发调用 `scoop install` 会出现什么)

---

## 7. 安装脚本可配置项(`install.ps1`)

来源:https://github.com/ScoopInstaller/Install/blob/master/install.ps1

| 参数 | 业务含义 | 默认值 |
| --- | --- | --- |
| `ScoopDir` | Scoop 根目录 | `$env:USERPROFILE\scoop`(`C:\Users\<USER>\scoop`) |
| `ScoopGlobalDir` | 全局软件包目录(需管理员) | `$env:ProgramData\scoop`(`C:\ProgramData\scoop`) |
| `ScoopCacheDir` | 下载缓存目录 | `$ScoopDir\cache` |
| `NoProxy` | 跳过代理(开关) | 不启用 |
| `Proxy` | 代理 URL(形如 `http://user:pass@host:port`) | 系统默认 |
| `ProxyCredential` | 代理凭据对象 | 无 |
| `ProxyUseDefaultCredentials` | 使用当前用户凭据(开关) | 不启用 |
| `RunAsAdmin` | 以管理员权限运行(开关) | 不启用 |

执行方式(在 PowerShell 中):
```powershell
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

需先设置执行策略(用户级):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**注意事项**:
- `ScoopGlobalDir` 与 `RunAsAdmin` 联动:用户选了全局目录通常也需要管理员权限提权
- `ProxyCredential` 在 GUI 中需用明文 + 用户名 + 密码分别填写(避免序列化凭据对象跨进程)
- 这些配置项在 GUI 中的填写时机:**执行安装前一次性确认**,安装过程中不改动;确认后持久化到本机,供后续重新安装时复用

---

## 8. QA 调试速查表

### 8.1 快速验证 Scoop 环境

```powershell
scoop --version                                  # 查看 CLI 版本与 commit
scoop status                                     # 查看过期应用
scoop list | head -20                            # 列出已装应用
scoop bucket list                                # 列出已添加桶
scoop config                                     # 查看全部配置
where scoop                                      # 确认 PATH 中 scoop 可达
```

### 8.2 模拟 GUI 命令路径

GUI 主进程通过 `child_process.spawn('scoop', [...args], { env })` 调用,**不使用** shell。调试等价命令:

```powershell
# 等价 GUI 列出已装
scoop list

# 等价 GUI 搜索
scoop search git

# 等价 GUI 安装
scoop install git

# 等价 GUI 桶列表
scoop bucket list

# 等价 GUI 添加已知桶
scoop bucket add extras

# 等价 GUI 状态(过期检查)
scoop status
```

### 8.3 PATH 注入问题

GUI 主进程启动时需确保 `D:\Scoop\shims` 在 PATH 中,否则 `spawn('scoop', ...)` 会失败。建议:

- 启动时读 `process.env.PATH`,若未包含 `ScoopDir\shims` 则追加
- 调用前做 `where scoop` 等价探测,失败时返回明确错误(走"未检测到 Scoop"流程)

### 8.4 解析器调试小工具

QA 可用以下脚本快速把 scoop 表格输出转换为结构化数据(便于验证 GUI 解析器):

```bash
# scoop list → 仅保留数据行(去列头/分隔线/标题)
scoop list | sed -n '/^---$/!p' | tail -n +3

# scoop bucket known → 每行一个桶名
scoop bucket known
```

---

## 9. 文档维护说明

- 本文件由**主对话模式 / 任何人**补充;不归入 opcflow 工作流管道,所有 agent 都可以引用。
- Scoop 自更新可能改变命令行为(命令清单、参数、输出格式)。每次更新后应重抓样本并同步更新本文件。
- 重大输出格式变化(例如 scoop 改用 JSON 输出)需通知 architect,可能引发解析器重构。