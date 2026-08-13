# 调研发现

## 当前项目基线

- 后端技术栈为 Spring Boot 4、Spring Cloud、Spring Embabel、MyBatis-Flex。
- 系统架构已确定 R1 模块化单体 + 异步 Worker，R2-R4 按交易履约、运营分析、搜索推荐和风控模型渐进拆分。

## 参考项目结构

- 根工程包含 BOM、主聚合工程和文档工程。
- 主工程按 `Infrastructure`、`Domain`、`Application`、`UserInterface` 聚合。
- 领域模块包含 API、适配器和 Boot；应用模块包含 API、适配器和 Boot；基础设施另有 Repository、Starters、Commons、Plugins。
- 领域仓储端口定义在 Domain API，MyBatis-Flex 持久化适配器位于 Infrastructure Repository，实现依赖倒置。

## 参考项目取舍

- 参考工程约有 80 个 Maven POM，其中 Application 20、Domain 26、Infrastructure 20、UserInterface 14；对趣汇 R1 直接复制会产生过多空 API/Rest/Feign/Boot 模块。
- 保留父工程、BOM、端口/适配器和独立装配思想；业务模块改为按限界上下文组织。
- 参考实现存在 Rest 适配器直接调用 Repository 端口的路径，趣汇禁止该做法，所有入站请求必须经过应用用例和事务/授权/幂等编排。
- 参考 BOM 的 Boot 3.x 与 Cloud 里程碑版本不属于趣汇 Boot 4 技术基线，只参考结构，不复制版本。

## 趣汇模块决策

- 默认每个限界上下文使用 `core + adapter` 两个 Maven 模块；核心内再以 package 区分 domain/application。
- R1 运行时为 Gateway、用户 API、管理 API、Worker；Boot 模块对应部署单元，不对应每个领域。
- 跨域长流程使用独立 process 模块；跨域事件使用统一的版本化集成事件信封。
- 同步契约或供应商适配器只在真实独立发布、隔离或多实现需求出现时继续拆分。

## 正式文档

- 已新增 `产品文档/项目文档/趣汇代码模块规划/content.md`，覆盖上下文、Maven 树、依赖规则、运行时、分期和验收。
