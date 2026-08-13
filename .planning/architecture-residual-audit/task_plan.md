# 架构残留审计

## 目标

在删除临时 `quhui` 代码聚合和 Runtime 示例后，检查 Runtime/启动入口残留，明确当前系统入口，并将前端工程纳入项目模块架构说明但不误列为 Maven 模块。

## 阶段

- [x] 核对当前目录、根 Maven Reactor 和实际前端工程
- [ ] 清理 Runtime、quhui 聚合和过时启动入口文档残留
- [ ] 补充系统入口和前端模块架构规划
- [ ] 执行文档、模块引用和 Maven/前端验证

## 结论边界

- 当前根 Maven Reactor 只有 `block_trading_docs`，没有可执行后端服务模块。
- 未来后端四层模块直接挂在 `block_trading` 下；独立服务在具体业务模块内创建 `*_boot`，不建立统一 Runtime。
- 当前 `block_trading_docs/产品原型/shadcn-mobile` 是 React/Vite 原型工程，不是生产前端模块，也不应进入 Maven Reactor。
