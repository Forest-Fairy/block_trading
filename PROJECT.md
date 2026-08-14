# 项目定义

## 项目架构
### 后端技术栈
 kotlin, gradle kotlin dsl, springboot 4, spring-cloud, spring-embabel, jimmer, mybatis-flex, netty
### 前端技术栈
 vite, react, uniapp(主要用于小程序兼容)
### 中间件
 nacos, redis, rabbitmq, minio
### 外围组件
 libreoffic, sevenzipJbinding
## 项目范围
以 DDD 作为系统架构指导, 六边形架构作为模块分层指导,

## 当前入口与模块状态

- 根目录 `pom.xml` 是当前仅用于 `block_trading_docs` 的过渡构建入口；创建任一后端生产模块前，必须一次性迁移为 Gradle Kotlin DSL 多项目构建。`block_trading_bom`、`block_trading_server`、`block_trading_client` 和 `block_trading_deployment` 是保留名称和边界的目标模块，目录与实现尚未创建。
- 目标根模块固定为 `block_trading_docs`、`block_trading_bom`、`block_trading_server`、`block_trading_client`、`block_trading_deployment`。`block_trading_bom` 使用 Gradle Java Platform 与 Version Catalog 统一后端依赖和插件版本；`block_trading_server` 是 Gradle 后端根；`block_trading_client` 是独立 Node 多端前端根，不进入 Gradle Build；`block_trading_deployment` 只承载镜像、环境清单、版本化数据库迁移、稳定 Service 切流、连接排空、发布回滚和运维脚本。
- `block_trading_server` 下按 `block_trading_user_interface`、`block_trading_application`、`block_trading_domain`、`block_trading_infrastructure` 四层组织生产代码，并分别设置层测试父模块与 `block_trading_system_test`。独立部署服务只在明确的业务模块内创建 `*_boot`，不建立统一 Runtime。
- `block_trading_client` 下按终端划分 `block_trading_web_mobile`、`block_trading_mini_program`（R1）、`block_trading_mobile`（下分 Android、iOS，R3）、`block_trading_web_pc`（下分仅内部使用的 `block_trading_web_pc_admin`，R1，及用户侧 `block_trading_web_pc_user`，R4）和 `block_trading_tablet`（R4）；它们只能通过版本化 UserInterface API 与后端通信。
- 外部 HTTP、WebSocket、RPC、文件和第三方回调只能进入 UserInterface Adapter；当前没有已实现的后端外部入口。
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
