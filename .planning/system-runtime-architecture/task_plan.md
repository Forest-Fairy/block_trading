# 系统运行架构规划

## 目标

完成零停机发布、Kotlin/Gradle/Jimmer 与 MyBatis-Flex 组合持久化、Netty 实时通信、受控数据库结构迁移，以及可验收的运行监控与运维排期规划回写。

## 阶段

- [x] 建立计划并核对现有架构、部署与领域边界。
- [x] 设计并写入零停机发布与长连接排空流程。
- [x] 设计并写入 Kotlin/Gradle 构建迁移和双 ORM Repository 规则。
- [x] 设计并写入 Netty 实时通信领域边界、会话与投递规则。
- [x] 刷新导航并完成文档/构建校验。
- [x] 核对既有可观测性、发布运维和项目排期入口，界定新增规划边界。
- [x] 补充 SLI/SLO、仪表盘、告警分级、值班升级、Runbook 与证据保全规则。
- [x] 将监控运维实施拆分到 R1 排期，并补齐测试和验收门禁。
- [x] 刷新导航并完成文档一致性校验。

## 约束

- 当前仓库没有可运行后端；本轮只交付架构、模块和运维规划，不虚构生产代码。
- 所有环境禁止 ORM 自动同步 Oracle 结构；结构变更只使用版本化迁移。
- 外部 HTTP、WebSocket、RPC 和回调只进入 UserInterface Adapter。
- 领域对 Application 只暴露 Repository Port；其 Infrastructure 实现可组合 Jimmer 与 MyBatis-Flex DAO。

## 错误记录

| 错误 | 处理 |
|---|---|
| 无 | 暂无 |
