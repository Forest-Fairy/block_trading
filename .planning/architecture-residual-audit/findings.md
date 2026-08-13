# 调研发现

- 根 `pom.xml` 当前只聚合 `block_trading_docs`；`quhui` 目录和后端代码不存在。
- 源码中没有 `quhui_runtime_user_api`、`quhui_runtime_worker` 等运行时模块或入口；剩余 Runtime 词汇主要是架构规则和文档概念。
- 项目级文档没有明确“当前无后端可执行入口”；已有 `PROJECT.md` 只说明前端技术栈和原型目录。
- 前端实际只有 `block_trading_docs/产品原型/shadcn-mobile/package.json`，具备 Vite、React、TypeScript 的独立原型入口；尚未规划生产 Web、Mobile、Micro-app 和运营后台的代码模块树。
- 模块规划正文仍把 `quhui` 作为产品代码聚合模块，并保留大量 `quhui_*` 目标模块名称，需要改成直接挂在 `block_trading` 下的目标结构或明确标注为未来模板。
