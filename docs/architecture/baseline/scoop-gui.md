# 技术基线索引

> 文档层级:架构基线索引(架构师登记)
> 适用范围:scoop-gui 项目全部代码产物
> 上游依赖:`docs/prd/project.md`(已审批)、`docs/prd/modules/scoop-gui.md`(已审批)、`docs/prd/flows/scoop-gui.md`(已审批)
> 下游引用:`docs/architecture/api/electron/scoop-gui.md`(task 2 产出)

---

## 1. 任务定位

本任务是 wb_plan 自动派发的"模块级数据库设计"占位任务(任务内容文案:设计 scoop-gui 模块数据库)。
但 scoop-gui 是**纯本机桌面应用**,**不引入关系数据库**(参见 `ARCHITECTURE.md` §7 持久化设计 —— 仅 `preferences.json` 一个 JSON 文件,zod 校验)。

故本任务的实际交付为**项目级技术基线登记**:

| 产物 | 路径 | 审批状态 |
| --- | --- | --- |
| 系统架构 | `ARCHITECTURE.md`(项目根) | ✅ 已审批(artifact #22) |
| 技术硬约束 | `TECH.md`(项目根) | ✅ 已审批(artifact #23) |

不再单独产出 `docs/architecture/database/scoop-gui.md`,理由见 §3。

---

## 2. 基线要点索引

下游契约(developer / qa / designer)引用基线时,按本节定位到具体条款即可,**不必**复读基线原文。

| 主题 | 出处 | 关键要点 |
| --- | --- | --- |
| 进程拓扑 | `ARCHITECTURE.md` §2 | 三进程(main / preload / renderer)+ contextBridge 边界 |
| 模块边界 | `ARCHITECTURE.md` §4 | scoop-service / command-runner / parsers / ipc-router 各司其职 |
| 持久化 | `ARCHITECTURE.md` §7 | 仅 `preferences.json`(zod 校验),其余实时探测 |
| IPC 错误形态 | `ARCHITECTURE.md` §8.1 + `TECH.md` §4.1 | `IPCResult<T>` + `IPCError` |
| 错误码命名 | `ARCHITECTURE.md` §8.2 + `TECH.md` §4.2 | `E_<DOMAIN>_<ACTION>_<REASON>` |
| IPC 通道命名 | `TECH.md` §6 | `scoop:<domain>:<action>[:vN]` |
| 共享枚举入口 | `TECH.md` §5 | 唯一 `src/shared/enums.ts`,**仅架构师可改** |
| 平台约束 | `TECH.md` §11 | 仅 Windows,启动时校验 |
| 安全约束 | `TECH.md` §12 | contextIsolation / nodeIntegration / sandbox 强制 |
| 跨层禁止 | `TECH.md` §10 | renderer 禁 `import 'electron'` 等 |

---

## 3. 为什么没有数据库文档

scoop-gui 的数据来源(详见 `docs/prd/modules/scoop-gui.md` §4):

- **软件包列表 / 状态 / 详情 / 桶列表 / 桶已知清单**:实时调用 `scoop` CLI 命令,文本表格正则解析(`docs/acceptance/scoop-cli-reference.md` §3)。
- **界面语言 / 协助安装配置项 / 窗口位置**:本机本地存储,单一 JSON 文件 `preferences.json`,zod schema 校验(详见 `ARCHITECTURE.md` §7.1)。
- **InstallJob 进度**:进程退出即丢,不持久化。

**不存在**任何需要 ER 图 / 表结构 / 索引设计的关系数据。wb_plan 模板自动派发的"数据库设计"任务在本项目下是占位项,登记本文档后关闭。

---

## 4. 与后续任务的关系

| 后续任务 | 与基线的关系 |
| --- | --- |
| task 2(API 契约) | 直接基于 `ARCHITECTURE.md` §8(错误处理)+ §9(IPC 契约总览)+ `TECH.md` §6(通道命名)产出 `docs/architecture/api/electron/scoop-gui.md` |
| developer build | 全部代码产物须遵守 `ARCHITECTURE.md` §1(目录)+ `TECH.md` §1~3(TS 配置 / 命名 / 风格) |
| qa 验收 | 基于 `ARCHITECTURE.md` §10(测试架构)+ `TECH.md` §4(错误码)+ `docs/acceptance/scoop-cli-reference.md`(CLI 解析样本)做架构符合性检查 |

---

## 5. 文档范围声明

本文件是技术基线的索引登记,**不**重复基线原文。任何契约细节以 `ARCHITECTURE.md` / `TECH.md` 为准;本文件仅说明:

- 任务 1 的实际交付物(基线登记 + 占位说明);
- 下游角色引用基线时的定位指引;
- 为什么跳过数据库文档这一占位产出。

如后续阶段需要新增 baseline 约束(枚举 / 错误码 / 协议升级),流程为:架构师更新 `ARCHITECTURE.md` 或 `TECH.md` → 走 baseline 审批 → 同步更新本索引。