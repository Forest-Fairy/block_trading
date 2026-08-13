# Runtime 最小模块骨架

## 目标

创建可编译、可执行的 `quhui_runtime` Maven Reactor 骨架，展示用户 API、管理 API、Worker 和边缘网关的启动装配单元；不提前接入 Spring Boot、领域模块、部署资产或外部中间件。

## 阶段

- [x] 读取现有 POM、模块规划和工作区改动
- [x] 创建根聚合、Runtime 父模块和四个可执行单元
- [x] 补充实际代码结构与启动边界文档
- [x] 编译、运行各启动 JAR 并记录结果

## 决策

- `quhui` 只聚合实际创建的 `quhui_runtime`，后续 DDD、部署与测试模块在对应周期创建后再加入。
- 每个 Runtime 单元独立产出可执行 JAR，暂不依赖 Spring Boot 或其他 Runtime 单元。
- 该骨架用于确定启动装配边界，不能视为业务服务、健康检查或部署实现。

## 错误记录

- 暂无。
