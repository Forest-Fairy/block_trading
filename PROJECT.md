# 项目定义

## 项目架构
### 后端技术栈
 Kotlin, Gradle Kotlin DSL, Spring Boot 4, Spring Cloud, Spring Embabel, Jimmer, MyBatis-Flex, Netty, OpenSearch Java Client
### 前端技术栈
 vite, react, uniapp(主要用于小程序兼容)
### 中间件
 Oracle Free, Redis, RabbitMQ, MinIO, OpenSearch
### 观测与交付
 OpenTelemetry Collector, Prometheus, Grafana, Docker Compose, Docker
### 智能检索（R3 规划，默认关闭）
 OpenSearch k-NN 向量索引与混合检索；通过可替换 Embedding Provider 调用经模型治理批准的多语言向量模型。当前 R1 仅启用关键词/结构化检索，不部署独立向量数据库或模型运行时。
### 外围组件
 LibreOffice, sevenzipJBinding；Nacos 为既有服务治理技术选型，未纳入当前 R1 Docker Compose 运行栈。
## 项目范围
以 DDD 作为系统架构指导, 六边形架构作为模块分层指导,

## 当前入口与模块状态

- 根目录已经迁移为 Gradle Kotlin DSL 多项目构建，权威入口为 Gradle Wrapper、`settings.gradle.kts`、根 `build.gradle.kts` 与 Version Catalog；原 Maven 过渡构建已移除。统一检查命令为 `./gradlew check`，文档门禁为 `./gradlew :block_trading_docs:check`。
- 根模块固定为 `block_trading_docs`、`block_trading_bom`、`block_trading_server`、独立 Node 根 `block_trading_client` 和 `block_trading_deployment`。`block_trading_bom`、四层后端、R1 Boot/Test 与 deployment 聚合已创建；生产代码、生产客户端与部署资产按 R1 里程碑持续补齐。`block_trading_client` 不进入 Gradle Build。
- `block_trading_server` 固定保留 `block_trading_user_interface`、`block_trading_application`、`block_trading_domain`、`block_trading_infrastructure` 四个生产一级层和 `block_trading_system_test`；各层内部继续使用 `api/adapter/service/test/boot` 接口形态，并按已审查限界上下文拆分当前 `block_trading_d_r1_*`、`block_trading_a_r1_*`、`block_trading_i_r1_test` 等周期聚合模块。禁止把领域平铺到 server 一级，也禁止继续新增 `*_rN_*` 模块。
- `block_trading_client` 下按终端划分 `block_trading_web_mobile`、`block_trading_mini_program`（R1）、`block_trading_mobile`（下分 Android、iOS，R3）、`block_trading_web_pc`（下分仅内部使用的 `block_trading_web_pc_admin`，R1，及用户侧 `block_trading_web_pc_user`，R4）和 `block_trading_tablet`（R4）；它们只能通过版本化 UserInterface API 与后端通信。
- 外部 HTTP、WebSocket、RPC、文件和第三方回调只能进入 UserInterface Adapter；R1 版本化接口契约已写入业务模块文档，生产实现处于实施中。
- 当前可运行的前端入口是 `block_trading_docs/产品原型/shadcn-mobile`：执行 `npm run dev` 启动 Vite 原型。该目录是 Web 移动、小程序、Android 与 iOS 的统一移动交互参考，不等同于尚未创建的 `block_trading_client` 生产工程。

## 模块架构入口

- 后端模块与 Boot 规划：`block_trading_docs/产品文档/项目文档/趣汇代码模块规划/navigator.csv`
- 系统入口、前后端边界与部署规划：`block_trading_docs/产品文档/项目文档/趣汇系统架构设计/navigator.csv`
- 前端产品与应用边界：`block_trading_docs/产品文档/功能文档/移动端产品设计/navigator.csv`

## 产品文档入口
`block_trading_docs/产品文档/项目文档/趣汇产品规划/navigator.csv`

## 业务开发文档入口
`block_trading_docs/业务开发文档/业务需求文档/趣汇移动端首期规划.md`

## 原型入口
- 移动端交互原型: `block_trading_docs/产品原型/shadcn-mobile/`
- 原型技术: React、TypeScript、Tailwind CSS、shadcn/ui

## 前端内容验收
- 前端内容验收只需打开目标页面、模拟关键点击，并确认浏览器控制台没有报错；不要求截图验证。
