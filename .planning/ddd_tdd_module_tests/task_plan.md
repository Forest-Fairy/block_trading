# DDD Maven 模块与 TDD 测试规划

## 目标

将趣汇代码模块规划调整为 `block_trading` 根 Maven 坐标与全下划线 artifactId 命名；在 Reactor 图中展开四个 DDD 层及每个领域模块关系；为 Interface、Application、Domain、Infrastructure 四层建立测试父模块和按领域测试模块；新增功能模块测试用例文档，使 Agent 编码迭代以 TDD 测试为准入门槛。

## 阶段

- [x] 读取当前模块规划、POM 坐标、领域边界和活动计划
- [x] 定义全下划线 Reactor、领域层关系和测试模块命名
- [x] 重写模块 API 规划并补充各层测试父模块与领域测试模块
- [x] 新增功能模块测试用例文档并接入导航
- [x] 同步 POM 坐标、验证命名/链接/Maven Reactor 并记录结果

## 决策原则

- 根 Maven artifactId 固定为 `block_trading`；所有规划中的 Maven artifactId 均使用小写下划线，Java 包保持 `io.spray.qh`。
- 业务模块的 API/Adapter/Boot/Test 边界不变；测试父模块只聚合测试模块，不被生产代码依赖。
- 每层测试模块按该层领域模块映射；跨层、跨领域与端到端场景置于明确的测试装配模块。
- TDD 的红/绿/重构、测试失败门禁、测试数据隔离和用例所有权必须写入正式文档，而非仅作团队口头约定。
- 本轮规划不创建空 Maven 目录或 Java 测试代码，Maven POM 仅同步实际已有根/文档工程坐标。
- 当前真实 Reactor 只有 `block_trading` 与 `block_trading_docs`；规划中的 `block_trading_bom` 与 `quhui` 需在对应目录和 POM 实现时再加入根聚合，避免空模块破坏构建。

## 错误记录

- 暂无。
