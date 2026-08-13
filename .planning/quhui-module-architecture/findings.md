# 调研发现

- 指定会话在收到用户纠正后确认要保留 `quhui` 模块名称，但其后续规划仍错误地将四层模块直接放在 `block_trading` 下。
- 当前仓库只有 `block_trading_docs` 目录，根 POM 只聚合该模块；后端和生产客户端尚未创建。
- 当前 Vite 工程位于 `block_trading_docs/产品原型/shadcn-mobile`，仅作为 `quhui_web_mobile` 的产品原型参考。
- 项目规则禁止统一 Runtime；具体业务 `*_boot` 仍是未来部署组合根。
- 迭代规划要求 R1 的内部运营后台独立 Web 构建，不能被 R4 用户侧 PC 端替代；现改为 `quhui_web_pc` 下的 `quhui_web_pc_admin`（R1）和 `quhui_web_pc_user`（R4）。
