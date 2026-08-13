# Boot 模块架构调整

## 目标

参照 Seeking-DDD-Parent，取消跨领域的 `quhui_runtime` 聚合与临时用户 API 演示模块；将启动装配定义为所属业务模块的可选 `*_boot`，并明确外部请求和跨领域访问规则。

## 阶段

- [x] 对照参考项目和当前 Reactor，确认统一 Runtime 与目标架构冲突
- [x] 将服务启动和跨领域访问规则写入项目规则
- [x] 删除 `quhui_runtime` 与运行时演示耦合，调整 System 测试装配
- [x] 更新 Maven Reactor、DDD 模块规划、系统架构和社区业务开发文档
- [x] 执行全量构建与架构引用检查

## 决策

- 独立运行是部署单元的属性，不是每个 DDD 层模块的强制属性。
- `*_boot` 归属具体领域、应用或 UserInterface 业务模块，只在对应服务实际需要独立部署时创建。
- 外部请求只能进入 UserInterface；内部跨领域调用使用版本化 API 的进程内实现、REST/Feign 或 Outbox/MQ 事件，禁止访问他域实现或持久化。

## 错误记录

- 已删除 Runtime 源码和 Reactor 声明；清理 Maven 旧 `target` 二进制目录时被环境安全策略拦截。该目录不参与源码构建和版本化模块关系，未继续绕过策略删除。
