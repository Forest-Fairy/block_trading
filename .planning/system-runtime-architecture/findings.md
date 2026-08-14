# 调研发现

## 现有基线

- 正式架构采用 Docker 镜像、Kubernetes、健康检查、灰度与回滚；部署清单以 `deployment_no` 锁定目标环境、制品和迁移区间。
- 代码模块规划当前固定 Maven Reactor，目标后端模块尚未创建。
- 产品有私聊、活动群聊、通知和离线恢复需求；外部 WebSocket 必须进入 UserInterface Adapter。
- 现已增加：禁用 ORM 自动 DDL、版本化迁移风险分类、Jimmer/MyBatis-Flex 可在同一 Repository Infrastructure 实现内组合。
- 代码模块规划仍以 Maven Reactor 为唯一权威入口，且 `*_boot` 只负责启动装配；Gradle 迁移必须完整替换该构建入口并同步修订 BOM、测试门禁与部署制品路径。
- 消息产品规划要求私聊、活动群聊、在线状态、离线缓存、失败重试、举报、拉黑和受限状态；R1 产品范围不包含开放式私聊/群聊，因此实时连接底座可以 R1 建立，但开放用户会话能力仍按产品周期受控。
- 现有部署单元规划提供 Kubernetes base/overlay、探针、灰度、回滚和迁移执行位置，可承接连接摘流与零停机发布规则。
- UserInterface 当前已有 client/admin/worker/edge/provider-callback Gateway，但没有实时连接 Gateway；应新增 `block_trading_ui_realtime_gateway`，而不是把 Netty 放入 Domain。
- engagement 当前只明确通知、投递、客服和用户会话元数据；数据库设计已经存在 `qh_chat_room`、`qh_chat_member`、`qh_chat_message` 与媒体实体，因此可将会话消息事实、投递序号和已读游标补充为 engagement 所有权，内容裁决仍归 moderation。
- 双 ORM 组合 Repository 应落在 Infrastructure 的 Oracle 适配器内；Application/Domain 不依赖 Jimmer、MyBatis-Flex、Mapper 或 DAO 类型。

## 外部依据

- Kubernetes RollingUpdate 能通过 `maxSurge` 与 `maxUnavailable` 控制新旧副本的扩缩顺序；实际服务连续性还取决于就绪、摘流和连接排空。
- Spring Boot 同时支持 Maven 与 Gradle；Kotlin 的 Gradle 集成需统一 JVM toolchain 与 Kotlin/Gradle 插件版本。
- Jimmer 的 Kotlin 模式使用 KSP 生成代码；其数据库校验不是实体自动 DDL。
- Kubernetes 在 Pod 终止时会将端点标记为不就绪，并为应用提供 `preStop` 和 `terminationGracePeriodSeconds`；慢终止服务仍需自行完成连接排空，不能假设现有 WebSocket 会被平台迁移。
- Gradle 的多项目构建由一个 `settings.gradle.kts` 定义根项目和子项目，适合替换目标后端的 Maven Reactor。
- Netty 使用 `ChannelInitializer` 装配每条连接的 `ChannelPipeline`；认证、心跳、限流、协议解码和消息派发可以拆分为独立 Handler。

## 待定细节

- Gradle 迁移须采用一次性切换，不能让同一后端 Reactor 同时作为 Maven 和 Gradle 的权威构建入口。
- Netty Gateway 与业务领域之间的具体内部协议在实施期确定；规划先限定契约、鉴权和可靠投递语义。

## 运行监控与运维增补发现

- 现有文档已选定 `OpenTelemetry + Prometheus + Grafana + 结构化日志索引`，并定义 deployment_no、发布状态、切流排空、日志归档和受控后台查询。
- 现有测试只有 `R1_OBS_001` 的通用“错误率或积压越阈值告警”要求，未登记服务等级目标、指标窗口、告警严重度、通知与升级时限、Runbook 或告警抑制/恢复规则。
- 实施排期应写入既有“趣汇功能需求与排期”项目文档，且与部署运维模块、系统架构和测试用例双向追溯；当前仓库没有后端或部署模块，不应把规划项标记为已实现。

## 错误记录

| 错误 | 尝试 | 处理 |
|---|---:|---|
| PowerShell 单行 `Import-Csv` 结果没有 `.Count`，导致 CSV 非空校验误报 | 1 | 使用 `@(...)` 将结果规范为数组后重新校验。 |
