# 调研发现

## 当前基线

- 根 POM 和 `block_trading_docs` parent 当前均使用 `block_trading`，符合用户最新根模块命名要求。
- 当前真实 Reactor 仅聚合 `block_trading_docs`，其 artifactId 也为下划线命名；尚不存在 `block_trading_bom`、`quhui` 或业务代码模块目录。
- 现有规划含四层模块与业务模块清单，但 Reactor 图只展示四个层父节点，未展开领域模块关系。
- 现有 artifactId 示例大多使用连字符，且仅有 `qh_i_test_support`，没有 Interface/Application/Domain/Infrastructure 四层测试父模块与按领域测试模块。

## TDD 规划目标

- 测试模块将按层和领域聚合，生产模块不得依赖测试模块。
- 功能用例文档需覆盖 R1 至 R4 的领域关键路径、权限、幂等、事件、补偿和回归门禁。
- `mvn -q -DskipTests validate` 已通过；Maven/JDK 仅输出 Jansi 与 `Unsafe` 的运行时弃用警告，未出现构建错误。
