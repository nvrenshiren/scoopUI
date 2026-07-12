# 数据库设计 — scoop-gui(不适用)

> 文档层级:架构(架构师登记)
> 适用范围:scoop-gui 模块
> 关联索引:`docs/architecture/baseline/scoop-gui.md` §3
> 信任状态:draft(占位说明,无需审批)

---

## 1. 结论

scoop-gui 模块**不引入关系数据库**。本文件是 opcflow `wb_plan` 模板自动派发"模块级数据库设计"占位任务(developer claim gate 要求 db-doc artifact 存在)的产物,登记决策、不产出实际库表设计。

## 2. 决策依据

- 数据来源(详见 `docs/prd/modules/scoop-gui.md` §4):
  - **软件包列表 / 状态 / 详情 / 桶列表 / 桶已知清单**:实时调用 `scoop` CLI 命令,文本表格正则解析(`docs/acceptance/scoop-cli-reference.md` §3)。
  - **界面语言 / 协助安装配置项 / 窗口位置**:本机本地存储,单一 JSON 文件 `preferences.json`,zod schema 校验(详见 `ARCHITECTURE.md` §7.1)。
  - **InstallJob 进度**:进程退出即丢,不持久化。
- 不存在需要 ER 图 / 表结构 / 索引设计的关系数据。
- 持久化的全部内容已通过 `preferences.json` + `electron-store` + zod 校验覆盖。

## 3. 关闭原因

| 维度 | 决策 |
| --- | --- |
| 是否需要数据库 | 否 |
| 是否产出占位设计稿 | 否 |
| 是否送审 | 否(draft,仅作 developer claim gate 兼容) |
| 后续触发条件 | 若后续模块引入持久化关系数据,需走 baseline 审批,新派 db-doc 任务 |

## 4. 引用

- `docs/architecture/baseline/scoop-gui.md`(已审批):§3 同样说明不产出数据库文档。
- `ARCHITECTURE.md` §7 持久化设计:仅 `preferences.json`。
- `TECH.md`:无数据库依赖。
