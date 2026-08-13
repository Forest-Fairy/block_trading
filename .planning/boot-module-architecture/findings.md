# 调研发现

- Seeking-DDD-Parent 的根 Reactor 只聚合 UserInterface、Application、Domain、Infrastructure 四层。
- 参考项目的 `S-Domain-Users-Boot`、`S-App-UserCenter-Boot`、`S-UINTF-Web-Browser` 均位于具体业务模块内部，不存在跨领域 Runtime 父模块。
- 当前 `quhui_runtime_user_api` 仅为社区演示创建，是唯一将 UI、Application、Infrastructure 直接装配到生产 Runtime 的模块；它可删除，System 测试可在测试代码中完成相同装配。
