# 数据库设计 · scoop-gui

> 文档层级:模块级契约(architect 产出)
> 适用范围:scoop-gui 模块(本项目唯一模块)
> 上游依赖:`docs/prd/modules/scoop-gui.md` 第 4.5 节"本机持久化数据"
> 下游引用:developer(据此实现持久化)/ api-doc(`install_scoop` / `get_settings` 等命令的数据形状)
> 真相源:`src-tauri/src/settings.rs`(如与本文档有出入,以代码为准)

---

## 1. 概述

本产品**不使用传统数据库**(无 SQLite/关系表),唯一的本机持久化对象是一份 JSON 配置文件,
对应 PRD §4.5"本机持久化数据"(界面语言选择 / 协助安装配置项)。所有软件包/桶数据本身不落地
存储,均实时读取自 Scoop CLI(见 `docs/architecture/api/scoop-gui.md` 第 4 节)。

## 2. 物理位置

| 项 | 值 |
| --- | --- |
| 配置文件 | `%APPDATA%\scoop-gui\config.json` |
| 临时工作目录 | `%TEMP%\scoop-gui`(协助安装 runner 脚本落盘用,见 `installer.rs`) |
| 写入方式 | 原子写入:先写 `config.json.tmp`,`remove_file` 旧文件后 `rename` 到位(Windows 上 rename 到已存在目标会失败,故先删) |
| 读取失败降级 | 文件不存在或解析失败 → 返回 `Settings::default()`(全字段 `None`/空),不阻塞启动 |

## 3. 表结构(JSON Schema)

### 3.1 `Settings`(顶层对象,camelCase 序列化)

| 字段 | 类型 | 可空 | 业务含义 | 关联功能 |
| --- | --- | --- | --- | --- |
| `language` | `string`("zh"\|"en") | 是(`None`=尚未选择) | 界面语言选择,`None` 时首启触发 P02 语言选择页 | F13、F14 |
| `theme` | `string`("dark"\|"light"\|"system") | 是 | 界面主题(设计系统默认 dark) | F14 附属;非 PRD 独立编号能力,由 `set_theme` 命令承载 |
| `installConfig` | `InstallConfig`(3.2 节) | 是(`None`=从未确认过安装配置) | 最近一次确认的协助安装配置,供重装复用 | F16 |

### 3.2 `InstallConfig`(内嵌对象,camelCase 序列化,`#[serde(default)]` 逐字段兜底)

严格对齐 `roles.md` §4.3 / `project.md` §3.3"安装可配置项边界"——字段集合与 Scoop 官方
`install.ps1` 暴露的参数一一对应,不引入官方脚本之外的选项(决策 D06)。

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `scoopDir` | `string?` | 安装根目录(`ScoopDir`) |
| `scoopGlobalDir` | `string?` | 全局软件包目录(`ScoopGlobalDir`),需管理员权限场景见 4.3 |
| `scoopCacheDir` | `string?` | 下载缓存目录(`ScoopCacheDir`) |
| `noProxy` | `string?` | 免代理地址(`NoProxy`) |
| `proxy` | `string?` | 代理地址(`Proxy`) |
| `proxyCredentialUser` / `proxyCredentialPassword` | `string?` | 代理凭据(`ProxyCredential`,拆分为用户名/密码两个字段存储) |
| `proxyUseDefaultCredentials` | `bool`(默认 `false`) | 是否使用默认凭据(`ProxyUseDefaultCredentials`) |
| `runAsAdmin` | `bool`(默认 `false`) | 是否以管理员权限运行(`RunAsAdmin`) |

> 备注:`InstallConfig` 同时是 `install_scoop` IPC 命令的入参形状(见 api-doc 第 3.9 节),
> 持久化与 IPC 传输复用同一 Rust 类型,序列化规则(camelCase)在两处保持一致。

## 4. 读写路径

| 操作 | 触发命令(IPC) | 读/写 | 说明 |
| --- | --- | --- | --- |
| 启动读取语言/主题偏好 | 应用启动时 `settings::load()` 直接调用(非 IPC) | 读 | Boot Sequence 用其判定是否进入 P02 |
| `get_settings` | IPC | 读 | 前端启动时获取完整 `Settings` |
| `set_language` | IPC | 写 | 校验值 ∈ {"zh","en"},否则报错;写入后立即 `save` |
| `set_theme` | IPC | 写 | 校验值 ∈ {"dark","light","system"} |
| `install_scoop` | IPC | 写 | 确认安装配置时把 `InstallConfig` 整体写入 `installConfig` 字段;**持久化失败不阻塞安装本身**(flow §1.8 同源原则),仅忽略保存错误 |

## 5. 决策记录(append-only)

| ID | 日期 | 决策摘要 | 理由 |
| --- | --- | --- | --- |
| DB01 | 2026-07-12 | 不引入 SQLite/嵌入式数据库,持久化用单一 JSON 文件 | 数据量小(仅语言/主题/安装配置三个字段),无需关系查询;`use_sqlite_cache` 是 Scoop 自身缓存,不属于本产品持久化范围(见 `modules/scoop-gui.md` 决策 D10) |
| DB02 | 2026-07-12 | `theme` 字段未在 PM 契约中单独编号为能力,但作为 F14 的实现附属项持久化 | 设计系统(`docs/design/systems/web.md`)要求主题可控,`set_theme` 命令与 `set_language` 同构复用,不新增业务能力编号 |

## 6. 文档范围声明

本文件只回答"持久化数据长什么样、存在哪、怎么读写"。不涉及:软件包/桶等 Scoop 自身数据的读取方式(见 api-doc 第 4 节)、IPC 命令参数校验细节(见 api-doc 第 3 节)、UI 层如何使用这些字段(见页面 PRD / developer 实现)。
