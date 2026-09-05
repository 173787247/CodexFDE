# Codex AI 工程交付行动营｜学生学习入口

这套课程只讲一条建设主线：

> **用 Codex 建设个人研发工作台，再通过工作台组织人与 Codex 协同，持续开发 FlowERP。**

四周里，你会先用 Codex 搭出能接收需求、组织执行并运行检查的个人研发工作台，再通过持续开发 FlowERP 验证和改进它。每讲从具体问题推导设计，保留概念的深度，并在需要时解释软件工程基础。

## 先从这里开始

1. 第一次进入仓库：先读 [L00 开篇导读](./courses/L00-课前准备-安装工具与通过环境自检.md)，再按 [L00 任务卡](./courses/tasks/L00-课前准备.md)操作，用 [空白模板](./courses/labs/L00/SUBMISSION.md)保存记录。安装与排错时按需返回详细讲义。
2. 开始学习或课后复习：[L01～L16 讲义阅读导航](./courses/讲义阅读导航.md)；课程名称与正式主题见[极客时间课表](./课表｜Codex%20AI%20工程交付行动营.md)。
3. 核对每讲不可改写的四项合同：[课程大纲](./课程大纲-Codex-FDE行动营-个人研发自动化工作台.md)。
4. 理解四周如何增长：[课程蓝图](./courses/课程蓝图.md)。
5. 课堂学习或复习时打开 [L01～L16 独立课件](./courses/slides/README.md)。
6. 用 VS Code 打开 [课程工作区](./courses/FlowERP-AI研发工作台.code-workspace)，再按讲义和任务卡跟跑。

## 16 讲学习路线

| 阶段 | 讲次 | 你建设的工作台能力 | FlowERP 怎样验真 |
|---|---|---|---|
| 工作台 V0 | L01～L04 | 接管、规则、Spec、受控执行 | 冻结业务基线，L04 首次交付库存导出 |
| 质量证据链 | L05～L08 | Eval、Harness、Hook、CI | 重复入库、可用库存、订单与原子预占 |
| 受控协作 | L09～L12 | Repair Task、Loop、Subagents、Graph | 取消释放、状态迁移、采购申请与人工审批 |
| 产品化与反馈 | L13～L16 | Task API、Web、反馈、冷启动 | 补货任务、操作页、反馈改进与现场新需求 |

L01 的全部资料统一从 [L01 目录](./courses/L01/README.md)进入，包含阅读、实践、提交、提示词、行动卡、课件与图片。其余课次暂沿用 `docs/courses/` 中的讲义及 `slides/`、`tasks/`、`labs/` 分类目录。L01～L16 的标题必须与课表“主题”列逐字一致。

## 每讲怎么学

每讲先理解问题，再用实践检验设计：

1. 阅读具体问题，记录初始判断与待确认条件。
2. 阅读讲义中的机制、仓库代码和错误方案。
3. 在隔离工作区运行正常路径，并主动制造一次失败。
4. 保存命令、退出码、失败后权威状态、范围内 Diff 和复验结果。
5. 回到讲义作第二次判断：批准、退回还是证据不足。

参考仓库已经实现、Agent 自述“完成”、一张绿色截图，都不能替代你亲手留下的红灯、修订和复验记录。

## 三份学生参考资料

- [个人 AI 研发工作台](./reference/个人AI研发工作台.md)：工作台边界、能力增长和 Codex 协作原则。
- [FlowERP 领域模型与业务不变量](./reference/FlowERP领域模型与业务不变量.md)：库存、订单、采购和证据账的权威规则。
- [FlowERP 接口与运行边界](./reference/FlowERP接口与运行边界.md)：API、Web、持久化、冷启动与上线边界。

## 跟跑入口

以下入口供正式课次按任务要求使用。正在做 L00 的同学请继续按上面的任务卡完成环境自检。

在仓库根目录使用项目虚拟环境：

```powershell
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-status
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-contract --lesson 4
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli serve-workbench
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli serve
```

- `:8001` 是个人研发自动化工作台。
- `:8000` 是客户项目 FlowERP。
- `course-status` 只证明课程合同和基线状态，不证明你已经掌握或亲手实现了能力。

## 资料口径

各讲列出一手来源及原核验日期。2026-09-05 重写时再次核对了 Codex 指令、执行、Hooks 与 Subagents 的官方说明，并对照当前仓库区分设计目标与已有实现。工具版本变化后，应复验相关机制；外部资料不改变课程大纲规定的产品增量与通过标准。
