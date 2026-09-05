# 交互 1｜写出 CI_GATE_SPEC 并暴露 Run A

请先读取 `AGENTS.md`、本讲讲义和本文件。先写门禁合同，再碰 YAML。不要修 L08 原子预占缺陷。

贯穿案例：A 假绿 = 坏门禁 + 原子预占缺陷。FlowERP 提供事故，工作台吸收能力。本讲不扩建 ERP。

执行顺序：

1. 写出 `CI_GATE_SPEC.md`：何为假绿、Evidence Envelope 必填字段、Run A/B/C 各自证明什么；
2. 保留会忽略失败或缺少报告仍绿的 Workflow，使 Job 绿而报告不可信，并明确这是 Run A；
3. 不要修复 `flowerp/service.py`，不要伪造远端 Runner。

评分至少 80% 在门禁与信封。只交 Run C 的作业从这里就会被退回。

完成后停下，等待我审查或授权。需要扩权、口径未知或数据边界不清时立即停止。不得编造命令、退出码或签字。
