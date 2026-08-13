# 社区领域服务分层演示切片

## 目标

以 R1 社区活动发布和审核批准为例，构建可运行的 `UI Adapter -> Application -> Domain -> Repository Port -> In-memory Infrastructure -> Runtime` 服务链路，并建立各层测试父模块和跨层 System 测试，验证 Maven 分层与依赖方向。

## 阶段

- [x] 读取 Runtime 骨架、R1 社区规则和领域边界
- [x] 创建社区领域的生产模块、端口和内存适配器
- [x] 接入用户 API Runtime 装配及演示入口
- [x] 创建层测试父模块、领域测试和 System 测试
- [x] 回写业务/产品文档并验证 Reactor、测试与运行链路

## 约束

- 不使用 Spring Boot、数据库、消息或外部中间件；内存仓储仅作为 Infrastructure Adapter。
- Domain 不依赖 Application、UI、Infrastructure 或 Runtime；Application 仅依赖 Domain API；UI 仅依赖 Application API；Runtime 是唯一装配点。
- 用例以 R1_COMMUNITY_002、R1_COMMUNITY_003、R1_MOD_001 为最小演示，不宣称完成全部 R1 业务。

## 错误记录

- 首次直接运行用户 API 普通 JAR 时缺少跨模块依赖，出现 `NoClassDefFoundError`；已改为生成包含 Runtime 装配依赖的自包含演示 JAR。
