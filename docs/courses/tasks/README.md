# Codex AI 工程交付行动营｜任务卡入口

> **工作台是主体，FlowERP 是验证场，Codex 是底座。**

本目录包含 L00 课前准备卡和 L01～L16 行动卡。任务卡只负责“做什么、运行什么、交什么”；机制、案例、代码解读和延伸阅读请回到对应学生讲义。四项合同以[课程大纲](../../课程大纲-Codex-FDE行动营-个人研发自动化工作台.md)为准，16 个标题以[极客时间课表](../../课表｜Codex%20AI%20工程交付行动营.md)为准。

## 使用顺序

1. 阅读对应讲义的问题与机制部分，记录初始判断，再按卡片开展实验。
2. 打开 [FlowERP-AI研发工作台.code-workspace](../FlowERP-AI研发工作台.code-workspace)。
3. 运行“课程/02 查看本讲合同”，核对工作台增量、FlowERP 验证点和允许写集。
4. 进入隔离工作区，先留下本讲稳定红灯，再授权 Codex 做范围内修改。
5. 使用同一 Eval 复验，检查失败后权威状态和实际 Diff。
6. 让非执行者复验，最后回到讲义完成第二次判断。

## 逐讲入口

| 讲次 | 极客时间主题 | 讲义 | 任务卡 | 实验 |
|---:|---|---|---|---|
| L00 | 课前准备：装好工具，跑通第一次环境自检 | [讲义](../L00-课前准备-安装工具与通过环境自检.md) | [任务卡](./L00-课前准备.md) | — |
| L01 | 以终为始：一次可验证的 AI 交付怎样完成？ | [讲义](../L01/阅读讲义.md) | [任务卡](../L01/行动卡.md) | [实验](../L01) |
| L02 | 把仓库规则写进 `AGENTS.md` | [讲义](../L02-把仓库规则写进AGENTS.md.md) | [任务卡](./L02-AGENTS项目约束.md) | [实验](../labs/L02) |
| L03 | 把模糊需求变成可验收 Spec | [讲义](../L03-把模糊需求变成可验收Spec.md) | [任务卡](./L03-Spec驱动.md) | [实验](../labs/L03) |
| L04 | 委托 Codex 执行一次最小变更 | [讲义](../L04-委托Codex执行一次最小变更.md) | [任务卡](./L04-Codex最小变更.md) | [实验](../labs/L04) |
| L05 | 先设计失败，再编写 Eval | [讲义](../L05-先设计失败再编写Eval.md) | [任务卡](./L05-失败优先Eval.md) | [实验](../labs/L05) |
| L06 | 用 Harness 汇总证据和等级 | [讲义](../L06-用Harness汇总证据和等级.md) | [任务卡](./L06-Harness证据汇总.md) | [实验](../labs/L06) |
| L07 | 用 Codex Hooks 建立本地护栏 | [讲义](../L07-用Codex-Hooks建立本地护栏.md) | [任务卡](./L07-Codex-Hook.md) | [实验](../labs/L07) |
| L08 | 把同一套 Eval 接入 CI | [讲义](../L08-把同一套Eval接入CI.md) | [任务卡](./L08-CI远程复验.md) | [实验](../labs/L08) |
| L09 | 把失败报告翻译成修复任务 | [讲义](../L09-把失败报告翻译成修复任务.md) | [任务卡](./L09-失败转修复任务.md) | [实验](../labs/L09) |
| L10 | 建立有停止条件的修复 Loop | [讲义](../L10-建立有停止条件的修复Loop.md) | [任务卡](./L10-有界Loop.md) | [实验](../labs/L10) |
| L11 | 用 Codex 原生 Subagents 并行处理独立任务 | [讲义](../L11-用Codex-Subagents并行独立任务.md) | [任务卡](./L11-Subagents并行.md) | [实验](../labs/L11) |
| L12 | 用 Graph 显式表达状态、回退和人工审核 | [讲义](../L12-用Graph表达状态回退和人工审核.md) | [任务卡](./L12-Graph与人工审核.md) | [实验](../labs/L12) |
| L13 | 把执行链路封装成任务 API | [讲义](../L13-把执行链路封装成任务API.md) | [任务卡](./L13-任务API.md) | [实验](../labs/L13) |
| L14 | 让交付状态在 Web 面板可见 | [讲义](../L14-让交付状态在Web面板可见.md) | [任务卡](./L14-Web状态面板.md) | [实验](../labs/L14) |
| L15 | 生成交付摘要并采集真实反馈 | [讲义](../L15-生成交付摘要并采集真实反馈.md) | [任务卡](./L15-摘要与反馈.md) | [实验](../labs/L15) |
| L16 | 冷启动发布与工程答辩 | [讲义](../L16-冷启动发布与工程答辩.md) | [任务卡](./L16-冷启动答辩.md) | [实验](../labs/L16) |

## 统一命令入口

在仓库根目录使用 `.venv`。任务名称不因资料迁移而改变：

```powershell
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-status
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-contract --lesson 8
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-prepare --lesson 8
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-spec --lesson 8
.\.venv\Scripts\python.exe -X utf8 -m workbench.cli course-eval --lesson 8
```

L04 起，真实写入使用 `course-submit --execute-code`；`--verify-only` 只能复验当前候选，不能证明学生亲手完成实现。逐讲标签缺失时，`baseline_semantics=progression_gate` 只允许预习，不能宣称已经完成渐进式红→绿。

L15/L16 的反馈或现场需求必须使用本次需求专属动态 Eval。旧的 blocking 全绿只能作为回归证据，不能代替本次红灯。

## 统一提交包

```text
lesson-NN-submission/
├── 01-first-judgement.md
├── 02-contract/
├── 03-failure/
├── 04-change/
├── 05-verification/
├── 06-peer-feedback.md
├── 07-revision.md
├── 08-transfer.md
└── 09-authorship.md
```

最低通过证据：首次判断、已签署合同、执行前稳定红灯、范围内 Diff、同案绿灯、失败后状态不变、具名复验和剩余风险。覆盖失败记录、提交运行数据库/密钥，或用 Agent 自述替代退出码，直接退回。

