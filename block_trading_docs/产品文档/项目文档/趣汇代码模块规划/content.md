# 趣汇 DDD、六边形与 TDD 模块规划

## 1. 目标与约束

本文以[趣汇服务领域分析与边界定义](../趣汇服务领域边界设计/content.md)为业务边界，以[趣汇功能测试用例](../趣汇功能测试用例/content.md)为 Agent 编码的测试准入依据，定义 `block_trading` 根工程、`block_trading_bom`、`block_trading_server`、`block_trading_client`、`block_trading_deployment`、后端 DDD 层领域模块、API/Adapter/Boot/Test 边界和 TDD 测试结构。此前删除的是临时旧代码目录与统一 Runtime 示例，不是 `block_trading_*` 目标模块名称或模块边界；独立启动能力归属于具体业务模块内的可选 `*_boot`。

命名和依赖规则：

1. 目标后端使用 Gradle Kotlin DSL 多项目构建，根项目名固定为 `block_trading`，目标根子项目固定为 `block_trading_docs`、`block_trading_bom`、`block_trading_server` 和 `block_trading_deployment`；独立 Node 工程 `block_trading_client` 不进入 Gradle Build。
2. 所有 Gradle project 名称使用小写字母、数字和下划线，目标后端模块沿用 `block_trading_*` 前缀。Kotlin/Java 包继续使用 `io.spray.qh`，不因 project 名使用下划线改变包命名。
3. 父模块只承担继承与聚合，不被业务代码依赖。业务源码跨模块只依赖目标模块的 `*_api`。
4. Adapter 提供本地、远程、消息和 Stub 实现；实际实现选择只发生在具体业务模块的 `*_boot` 或测试装配中，业务 Adapter 不互相依赖。
5. 四个 DDD 层均有测试父模块，测试父模块聚合本层领域测试模块；任何生产模块不得依赖 `*_test`。

## 2. 完整 Gradle Build 与领域关系

```mermaid
flowchart LR
    Root["block_trading"] --> Docs["block_trading_docs"]
    Root --> Bom["block_trading_bom"]
    Root --> Server["block_trading_server"]
    Root -. non-Maven .-> Client["block_trading_client"]
    Root --> Deployment["block_trading_deployment"]
    Deployment --> DeployBase["block_trading_deploy_base"]

    Server --> UI["block_trading_user_interface"]
    Server --> App["block_trading_application"]
    Server --> Domain["block_trading_domain"]
    Server --> Infra["block_trading_infrastructure"]
    Server --> SystemTest["block_trading_system_test"]

    UI --> UiBase["block_trading_ui_base"]
    UI --> UiClient["block_trading_ui_client_gateway"]
    UI --> UiAdmin["block_trading_ui_admin_gateway"]
    UI --> UiWorker["block_trading_ui_worker_endpoint"]
    UI --> UiEdge["block_trading_ui_edge_gateway"]
    UI --> UiRealtime["block_trading_ui_realtime_gateway"]
    UI --> UiCallback["block_trading_ui_provider_callback R2"]
    UI --> UiTestParent["block_trading_ui_test"]

    App --> AppBase["block_trading_a_base"]
    App --> AppSocial["block_trading_a_social"]
    App --> AppGov["block_trading_a_governance_trust"]
    App --> AppCommerce["block_trading_a_commerce"]
    App --> AppGrowth["block_trading_a_growth_data"]
    App --> AppProcess["block_trading_a_process"]
    App --> AppTestParent["block_trading_a_test"]

    Domain --> DomainBase["block_trading_d_base"]
    Domain --> DomainSocial["block_trading_d_social"]
    Domain --> DomainGov["block_trading_d_governance_trust"]
    Domain --> DomainCommerce["block_trading_d_commerce"]
    Domain --> DomainGrowth["block_trading_d_growth_data"]
    Domain --> DomainTestParent["block_trading_d_test"]

    Infra --> InfraCommon["block_trading_i_common"]
    Infra --> InfraRepo["block_trading_i_repository"]
    Infra --> InfraPlugin["block_trading_i_plugin"]
    Infra --> InfraStarter["block_trading_i_starter"]
    Infra --> InfraTestParent["block_trading_i_test"]

    Client --> WebMobile["block_trading_web_mobile"]
    Client --> MiniProgram["block_trading_mini_program"]
    Client --> NativeMobile["block_trading_mobile R3"]
    NativeMobile --> Android["block_trading_mobile_android"]
    NativeMobile --> IOS["block_trading_mobile_ios"]
    Client --> WebPc["block_trading_web_pc"]
    WebPc --> WebPcAdmin["block_trading_web_pc_admin R1 internal"]
    WebPc --> WebPcUser["block_trading_web_pc_user R4"]
    Client --> Tablet["block_trading_tablet R4"]

```

本图是目标模块架构图，不表示当前所有模块都已创建。当前根 `pom.xml` 只聚合 `block_trading_docs`，属于后端创建前的文档构建入口；创建任一后端生产模块前，必须一次性迁移到根 `settings.gradle.kts` 与 Gradle Wrapper，由根 Build 聚合 `block_trading_bom`、`block_trading_server` 与 `block_trading_deployment`。`block_trading_client` 作为同级独立 Node 工程存在且不进入 Gradle Build。不得为同一后端生产模块并行维护 Maven 与 Gradle 两套权威依赖图。

### 2.1 逐级目录

```text
block_trading/
  block_trading_docs/
  block_trading_bom/
  block_trading_server/
    block_trading_user_interface/
      block_trading_ui_base/
      block_trading_ui_client_gateway/
      block_trading_ui_admin_gateway/
      block_trading_ui_worker_endpoint/
      block_trading_ui_edge_gateway/
      block_trading_ui_realtime_gateway/
      block_trading_ui_provider_callback/             R2
      block_trading_ui_test/
    block_trading_application/
      block_trading_a_base/
      block_trading_a_social/
      block_trading_a_governance_trust/
      block_trading_a_commerce/                       R2
      block_trading_a_growth_data/
      block_trading_a_process/
      block_trading_a_test/
    block_trading_domain/
      block_trading_d_base/
      block_trading_d_social/
      block_trading_d_governance_trust/
      block_trading_d_commerce/                       R2
      block_trading_d_growth_data/
      block_trading_d_test/
    block_trading_infrastructure/
      block_trading_i_common/
      block_trading_i_repository/
      block_trading_i_plugin/
      block_trading_i_starter/
      block_trading_i_test/
    block_trading_system_test/
  block_trading_client/                               非 Gradle Node 工程根
    block_trading_web_mobile/                         R1
    block_trading_mini_program/                       R1
    block_trading_mobile/                             R3
      block_trading_mobile_android/
      block_trading_mobile_ios/
    block_trading_web_pc/
      block_trading_web_pc_admin/                     R1，仅内部运营管理
      block_trading_web_pc_user/                      R4
    block_trading_tablet/                             R4
  block_trading_deployment/                           交付与运维资产根
    deployments/                                      按 deployment_no 保存不可变非密部署清单
    block_trading_deploy_base/                        R1 共享校验、迁移、发布、回滚与日志归档脚本
    block_trading_deploy_base_test/                   R1 清单、脚本幂等与失败恢复测试
    block_trading_deploy_<unit>/                      按已确认部署单元增量建立
```

- 当前根 `pom.xml` 只聚合 `block_trading_docs`；目标根 `settings.gradle.kts` 迁移完成后，`block_trading_bom`、`block_trading_server` 与 `block_trading_deployment` 由 `block_trading` Gradle Build 聚合，后端层模块只能挂在 `block_trading_server` 下。
- `block_trading_bom` 使用 Gradle Java Platform，配合 Version Catalog 统一 Kotlin、KSP、Spring、Jimmer、MyBatis-Flex、Netty、测试库和构建插件版本，不承载生产业务代码或启动逻辑。
- `block_trading_client` 是前端工程边界，不是 Gradle 子项目；各终端应用使用自己的 `package.json`、构建工具和发布产物。
- 各分类父模块仅在有明确领域治理价值时存在；不创建“为了目录整齐”的空父模块。
- `block_trading_*_test` 是层内测试父模块，不是生产能力；`block_trading_system_test` 是 `block_trading_server` 的跨层装配测试根，不是第五个 DDD 层。
- 未来的 `block_trading_deployment` 只负责交付资产，不是 DDD 层、运行时服务或测试父模块；它消费具体 `*_boot` 和 `block_trading_client` 前端工程的发布产物与版本化部署参数，不被领域业务代码依赖。

## 3. 领域模块与层关系

### 3.1 Interface：`block_trading_user_interface`

| 领域模块 | 角色 | 首次周期 | 主要调用的应用 API | 测试模块 |
|---|---|---:|---|---|
| `block_trading_ui_base_api` | 稳定请求上下文、错误、分页契约 | R1 | `block_trading_i_common_api` | `block_trading_ui_base_test` |
| `block_trading_ui_client_gateway_api/adapter` | 用户端 BFF、HTTP DTO 与命令转换 | R1 | social、commerce、growth_data | `block_trading_ui_client_gateway_test` |
| `block_trading_ui_admin_gateway_api/adapter` | 三类管理员后台、MFA 入口与管理 DTO | R1 | governance_trust、moderation、region_policy | `block_trading_ui_admin_gateway_test` |
| `block_trading_ui_worker_endpoint_api/adapter` | Worker、MQ 消费、任务入站协议 | R1 | process、moderation、discovery、engagement | `block_trading_ui_worker_endpoint_test` |
| `block_trading_ui_edge_gateway_api/adapter` | 路由、认证前置、限流、灰度与上下文 | R1 | 受控 UI API | `block_trading_ui_edge_gateway_test` |
| `block_trading_ui_realtime_gateway_api/adapter` | Netty WebSocket、Channel Pipeline、心跳、连接限流、摘流与重连协议 | R1 建底座；按产品周期开放会话 | engagement、identity、visibility、trust_safety | `block_trading_ui_realtime_gateway_test` |
| `block_trading_ui_provider_callback_api/adapter` | 支付/物流回调签名和事件去重 | R2 | commerce、fulfillment | `block_trading_ui_provider_callback_test` |

`block_trading_ui_test` 聚合上表全部测试模块，验证协议、认证入口、DTO 映射、错误映射和入口幂等；UI Adapter 不可依赖 Application、Domain 或 Infrastructure 的具体 Adapter。

### 3.2 Application：`block_trading_application`

| 分类父模块 | 领域模块 | 关键用例 | 首次周期 | 测试模块 |
|---|---|---|---:|---|
| `block_trading_a_social` | `block_trading_a_identity_api/adapter` | 身份、隐私、校园、关系 | R1 | `block_trading_a_identity_test` |
| `block_trading_a_social` | `block_trading_a_community_api/adapter` | 发帖、参与、取消、内容控制 | R1 | `block_trading_a_community_test` |
| `block_trading_a_social` | `block_trading_a_moderation_api/adapter` | 举报、审核链、申诉、控制回执 | R1 | `block_trading_a_moderation_test` |
| `block_trading_a_social` | `block_trading_a_visibility_api/adapter` | 召回约束、读写裁决、失效 | R1 | `block_trading_a_visibility_test` |
| `block_trading_a_social` | `block_trading_a_discovery_api/adapter` | 已授权搜索、信息流、反馈 | R1 | `block_trading_a_discovery_test` |
| `block_trading_a_social` | `block_trading_a_engagement_api/adapter` | 通知、客服、会话消息、确认游标、补拉与关键送达 | R1 | `block_trading_a_engagement_test` |
| `block_trading_a_governance_trust` | `block_trading_a_region_policy_api/adapter` | 区域、RBAC、策略、路由 | R1 | `block_trading_a_region_policy_test` |
| `block_trading_a_governance_trust` | `block_trading_a_trust_safety_api/adapter` | 风险挑战、安全事件、账号处置 | R1/R4 | `block_trading_a_trust_safety_test` |
| `block_trading_a_governance_trust` | `block_trading_a_governance_api/adapter` | 审批、审计、数据请求、法律保留 | R1/R3 | `block_trading_a_governance_test` |
| `block_trading_a_governance_trust` | `block_trading_a_model_governance_api/adapter` | 模型版本准入与停用 | R1/R4 | `block_trading_a_model_governance_test` |
| `block_trading_a_commerce` | `block_trading_a_commerce_api/adapter` | 可售、预占、订单、支付、退款、商品控制 | R2 | `block_trading_a_commerce_test` |
| `block_trading_a_commerce` | `block_trading_a_fulfillment_api/adapter` | 物流、售后、履约状态报告 | R2 | `block_trading_a_fulfillment_test` |
| `block_trading_a_growth_data` | `block_trading_a_growth_benefits_api/adapter` | 邀请、权益账本、配额 | R1 | `block_trading_a_growth_benefits_test` |
| `block_trading_a_growth_data` | `block_trading_a_analytics_api/adapter` | 事件、实验、指标 | R1/R3 | `block_trading_a_analytics_test` |
| `block_trading_a_process` | `block_trading_a_process_content_publication_api/adapter` | 审核控制与内容发布补偿 | R1 | `block_trading_a_process_content_publication_test` |
| `block_trading_a_process` | `block_trading_a_process_group_buy_settlement_api/adapter` | 拼单资格、预占、支付、退款投影 | R2 | `block_trading_a_process_group_buy_settlement_test` |
| `block_trading_a_process` | `block_trading_a_process_trade_fulfillment_api/adapter` | 支付后履约、退款补偿 | R2 | `block_trading_a_process_trade_fulfillment_test` |
| `block_trading_a_process` | `block_trading_a_process_region_rollout_api/adapter` | 灰度、护栏、回滚 | R3 | `block_trading_a_process_region_rollout_test` |
| `block_trading_a_process` | `block_trading_a_process_account_enforcement_api/adapter` | 封禁、豁免、申诉与解除 | R4 | `block_trading_a_process_account_enforcement_test` |

`block_trading_a_test` 聚合所有应用测试模块，测试用例以端口 Stub 驱动，验证事务意图、授权、幂等、补偿和事件输出；不启动完整 Spring Boot。

### 3.3 Domain：`block_trading_domain`

| 分类父模块 | 领域模块 | 聚合/事实所有权 | 测试模块 |
|---|---|---|---|
| `block_trading_d_social` | `block_trading_d_identity_api/adapter` | 账户、认证、关系、年龄/监护 | `block_trading_d_identity_test` |
| `block_trading_d_social` | `block_trading_d_community_api/adapter` | 帖子、参与、内容状态 | `block_trading_d_community_test` |
| `block_trading_d_social` | `block_trading_d_visibility_api/adapter` | 可见性约束、裁决、失效 | `block_trading_d_visibility_test` |
| `block_trading_d_social` | `block_trading_d_discovery_api/adapter` | 候选、排序、反馈读模型 | `block_trading_d_discovery_test` |
| `block_trading_d_social` | `block_trading_d_engagement_api/adapter` | 通知、会话、成员、消息序号、投递/已读游标、客服 | `block_trading_d_engagement_test` |
| `block_trading_d_governance_trust` | `block_trading_d_region_policy_api/adapter` | 区域、角色、策略、路由 | `block_trading_d_region_policy_test` |
| `block_trading_d_governance_trust` | `block_trading_d_moderation_api/adapter` | 举报、审核案件、措施、申诉 | `block_trading_d_moderation_test` |
| `block_trading_d_governance_trust` | `block_trading_d_trust_safety_api/adapter` | 挑战、风险、封禁、侵权 | `block_trading_d_trust_safety_test` |
| `block_trading_d_governance_trust` | `block_trading_d_governance_api/adapter` | 数据资产、审计、审批、留存 | `block_trading_d_governance_test` |
| `block_trading_d_governance_trust` | `block_trading_d_model_governance_api/adapter` | 模型目录、版本、准入 | `block_trading_d_model_governance_test` |
| `block_trading_d_commerce` | `block_trading_d_commerce_api/adapter` | 商品、预占、订单、支付、拼单结算 | `block_trading_d_commerce_test` |
| `block_trading_d_commerce` | `block_trading_d_fulfillment_api/adapter` | 配送、异常、售后、评价争议 | `block_trading_d_fulfillment_test` |
| `block_trading_d_growth_data` | `block_trading_d_growth_benefits_api/adapter` | 邀请、权益账本、配额 | `block_trading_d_growth_benefits_test` |
| `block_trading_d_growth_data` | `block_trading_d_analytics_api/adapter` | 事件、实验、指标 | `block_trading_d_analytics_test` |

`block_trading_d_test` 聚合所有领域测试模块。领域测试必须是最快的反馈层：不启 Spring、不连接 Oracle/MQ，覆盖聚合不变量、状态机、值对象、版本兼容和领域事件。

### 3.4 Infrastructure：`block_trading_infrastructure`

| 领域模块 | 实现范围 | 测试模块 |
|---|---|---|
| `block_trading_i_common_api` | 稳定错误、时间、上下文、加密引用 | `block_trading_i_common_test` |
| `block_trading_i_repository_oracle` | 组合 Jimmer KSqlClient/DAO 与 MyBatis-Flex Mapper 的领域 Repository、ContextSnapshot、Outbox/Inbox、显式 Oracle SQL | `block_trading_i_repository_oracle_test` |
| `block_trading_i_plugin_redis` | 缓存、限流、幂等、锁 | `block_trading_i_plugin_redis_test` |
| `block_trading_i_plugin_rabbitmq` | 领域事件、重试、死信、Inbox 去重 | `block_trading_i_plugin_rabbitmq_test` |
| `block_trading_i_plugin_minio` | 数据资产、签名访问、保留对象 | `block_trading_i_plugin_minio_test` |
| `block_trading_i_plugin_opensearch` | 搜索索引与受限召回约束 | `block_trading_i_plugin_opensearch_test` |
| `block_trading_i_plugin_embabel` | 模型调用、摘要、版本引用 | `block_trading_i_plugin_embabel_test` |
| `block_trading_i_plugin_payment` | 支付签名、回调、对账适配 | `block_trading_i_plugin_payment_test` |
| `block_trading_i_plugin_logistics` | 物流回调、节点去重、异常适配 | `block_trading_i_plugin_logistics_test` |
| `block_trading_i_starter_*` | Oracle、Redis、MQ、安全、观测自动配置 | `block_trading_i_starter_test` |

`block_trading_i_test` 聚合全部基础设施测试模块。该层允许 Testcontainers 或受控 Stub，验证真实 SQL、索引映射、序列化、签名、重试、死信、TTL 和外部错误映射。

### 3.5 双 ORM 组合 Repository 实现基线

领域与 Application 只定义并依赖 `ConversationRepository` 等业务接口。Oracle Infrastructure 可在一个实现类中注入两类 DAO：Jimmer DAO 负责关联图、按场景裁剪的查询或被明确分配的聚合保存；MyBatis-Flex DAO 负责显式 Oracle SQL、乐观锁更新、批量操作和被明确分配的 Outbox 写入。禁止 Application 直接拼接两个 DAO 的调用。

```kotlin
class OracleConversationRepository(
    private val conversationQueryDao: JimmerConversationQueryDao,
    private val conversationCommandDao: MyBatisConversationCommandDao,
    private val outboxDao: MyBatisOutboxDao,
    private val cacheInvalidator: ConversationCacheInvalidator,
) : ConversationRepository {

    override fun querySnapshot(id: ConversationId): ConversationSnapshot? =
        conversationQueryDao.querySnapshot(id.value)

    @Transactional
    override fun appendMessage(command: AppendMessage): StoredMessage {
        val stored = conversationCommandDao.insertMessageAndAdvanceSequence(command)
        outboxDao.insertOnce(stored.toEvent())
        cacheInvalidator.evictAfterCommit(stored.conversationId)
        return stored.toDomain()
    }
}
```

组合实现的约束是“一个 Repository Port、一个应用事务、每个写动作一个明确 DAO 责任”，不是“一个实现只能使用一个 ORM”。两个 DAO 必须共享同一个 Oracle DataSource 和 Spring TransactionManager；同一次业务操作不得分别通过两个 DAO 重复更新同一状态或重复写 Outbox；MyBatis-Flex 写入影响 Jimmer 缓存时必须在提交后失效；乐观锁影响行数为零必须映射为领域并发冲突；Jimmer Entity、Mapper 和 DAO 类型不得越过 Infrastructure。

测试父模块按发布周期增量聚合：当前周期只纳入已实施领域、既往回归模块和本期 System 场景。后续周期模块可预留 artifactId、版本化 API 契约和默认关闭的 Stub，但不得创建为当前 Gradle Build/CI 的必需模块，更不得要求当前周期连接尚未启用的供应商或运行时。

## 4. 前端工程边界

前端不进入 Gradle Build，但必须进入项目模块架构，使用独立 Node 工程管理依赖、开发服务器、类型检查、Lint、构建和发布产物。当前只有原型工程，生产前端模块按实际启用周期创建。

| 前端模块 | 目标形态 | 当前状态 | 入口与职责 |
|---|---|---|---|
| `block_trading_web_mobile` | 移动浏览器 Web | R1；原型阶段 | 对应 Vite 原型，完成五入口移动端交互 |
| `block_trading_mini_program` | UniApp/小程序 | R1；未创建 | 优先适配分享、授权、参团与支付 |
| `block_trading_web_pc_admin` | PC 内部运营管理 Web | R1；未创建 | 三类管理员后台；独立于用户端，调用后台 UserInterface API |
| `block_trading_mobile` | 原生移动端根，按操作系统分发 | R3；未创建 | 管理 Android、iOS 的原生工程与终端发布 |
| `block_trading_mobile_android` | Android 原生移动端 | R3；未创建 | 独立构建、签名、推送与系统能力适配 |
| `block_trading_mobile_ios` | iOS 原生移动端 | R3；未创建 | 独立构建、签名、推送与系统能力适配 |
| `block_trading_web_pc` | PC 端工程边界 | R1/R4；未创建 | 聚合内部运营后台与用户侧 PC 应用，不承载共享业务逻辑 |
| `block_trading_web_pc_user` | 用户侧 PC 浏览器 Web | R4；未创建 | 面向信息密度更高的浏览、发布和管理操作 |
| `block_trading_tablet` | 平板端 | R4；未创建 | 按平板交互与分屏能力独立适配 |

前端工程只能通过版本化 UserInterface API 访问后端；不得直接访问 Application、Domain、Repository 或 Infrastructure。当前 Vite 原型的应用入口是 `block_trading_docs/产品原型/shadcn-mobile/src/App.tsx`，它作为 Web 移动、小程序、Android 与 iOS 的统一移动交互参考；各生产工程在对应周期创建后再登记入口。

## 5. API、Adapter、Boot、Test 关系

每个可独立复用的领域能力按以下结构组织：

```text
block_trading_<layer>_<capability>/                         聚合 Gradle project，不被生产代码依赖
  block_trading_<layer>_<capability>_api/                   跨模块唯一编译期契约
  block_trading_<layer>_<capability>_adapter/               实现聚合，不决定最终实现选择
    block_trading_<layer>_<capability>_v1_service/          本地/进程内实现
    block_trading_<layer>_<capability>_v1_remote/           可选：拆服务后的同步实现
    block_trading_<layer>_<capability>_v1_mq/               可选：Outbox/Inbox 异步实现
    block_trading_<layer>_<capability>_v1_stub/             可选：契约与故障替身
  block_trading_<layer>_<capability>_test/                  单领域测试装配，可选
```

启动模块同样使用下划线：当前不建立统一 Runtime；只有出现明确业务入口、独立部署单元和测试需求时，才在所属 UserInterface、Application 或 Domain 业务模块内新增 `*_boot`。

### 5.1 Boot 与 Deployment 边界

`*_boot` 只负责所属业务单元的启动装配：选择领域 API 的 `v1_service`、`v1_remote`、`v1_mq` 或 `v1_stub` 实现，产出可执行 JAR、健康检查和运行所需的配置绑定。Boot 不承载领域规则，不成为跨领域业务逻辑的集中入口，也不保存 Dockerfile、Kubernetes 清单或环境密钥。

当前社区协作只规划四层生产模块和层测试父模块，最小跨层链路在 `block_trading_system_test` 的测试装配中验证，不创建生产 Boot。该切片只覆盖提交审核、受控审核通过和状态查询，用于验证层间依赖方向和 TDD 测试；它不是完整 R1 社区服务，也未接入 Spring Boot、HTTP 路由、消息消费者、Oracle、Redis 或 MQ。未来需要独立部署时，应在具体业务模块内部新增 `*_boot`，而不是恢复统一 Runtime。

当前根工程仍可用 `mvn -q -pl block_trading_docs verify` 验证文档模块；这不代表目标后端采用 Maven。后端建立前先完成 Gradle Wrapper、`settings.gradle.kts`、根 `build.gradle.kts`、Version Catalog 和文档 `check` 任务迁移，此后统一使用 `./gradlew :block_trading_docs:check`。`block_trading_system_test` 尚未创建，不能宣称当前已具备跨层测试。

`block_trading_deployment` 只负责交付和运维资产：每个已建立的 `block_trading_deploy_<unit>` 消费对应 `*_boot` JAR，维护镜像构建配置、`k8s/base`、各环境 overlay、资源/探针/网络策略、密钥引用、迁移执行顺序、灰度发布、回滚和运维脚本。部署模块不得编写领域逻辑、不得选择业务 Adapter 实现、不得保存明文密钥；当前未建立部署资产聚合模块，实施时先建立 R1 的 `block_trading_deploy_base`。

| 部署模块 | 发布产物 | 首次周期 | 管理范围 |
|---|---|---:|---|
| `block_trading_deploy_base` | 共享部署规范与脚本 | R1 | 部署号清单 Schema、镜像标签、通用标签、资源/探针基线、数据库目标解析、部署前校验、迁移、发布、验证、回滚和日志归档 |
| `block_trading_deploy_base_test` | 部署资产测试 | R1 | 清单 Schema、跨环境/错库阻断、迁移幂等、部署失败收口、回滚和归档恢复测试；不承载生产脚本 |
| 后续新增的 `block_trading_deploy_<unit>` | 对应业务模块的 `*_boot` JAR | 待定 | 仅在业务入口、运行边界和测试准入明确后建立 |
| `block_trading_deploy_commerce`、`block_trading_deploy_fulfillment` | 对应业务 `*_boot` JAR | R2 | 支付/履约独立部署后的隔离、扩缩、发布与回滚 |
| `block_trading_deploy_analytics`、`block_trading_deploy_discovery` | 对应业务 `*_boot` JAR | R3 | 分析与读模型任务的独立资源池、灰度与重建作业 |
| `block_trading_deploy_trust_safety` | 对应领域 `*_boot` JAR | R4 | 风控隔离、模型凭据引用、案件服务发布与回滚 |

部署资产统一为下列目录，不将环境特定值写入 `*_boot` 或领域模块：

```text
block_trading_deployment/
  build.gradle.kts                     部署资产聚合入口
  deployments/<deployment_no>.yaml     不可变部署清单，不保存明文密钥
  block_trading_deploy_base/
    build.gradle.kts                   脚本与清单 Schema 校验入口
    schemas/deployment-manifest.json   部署号清单结构与字段约束
    scripts/validate.(sh|ps1)          环境、制品、数据源、schema 与迁移校验
    scripts/migrate.(sh|ps1)           按部署号解析目标库并执行幂等迁移
    scripts/deploy.(sh|ps1)            发布、健康检查与失败收口
    scripts/switch-traffic.(sh|ps1)    切换稳定 Service/Gateway 路由，不修改容器端口
    scripts/drain.(sh|ps1)             旧槽位摘流、连接排空和超时记录
    scripts/rollback.(sh|ps1)          回退至清单记录的上一个健康版本
    scripts/archive-logs.(sh|ps1)      月度归档、校验和保留策略执行
  block_trading_deploy_base_test/      脚本 Fixture、容器化目标与失败注入测试
  block_trading_deploy_<unit>/
    build.gradle.kts                   对应部署单元的镜像构建入口
    Dockerfile                         仅复制对应 `*_boot` JAR
    k8s/base/                          无环境特定值的工作负载、Service、策略与探针
    k8s/overlays/<environment>/        开发、测试、预发布、生产的受控差异
```

部署脚本统一只接收 `deployment_no`、环境、部署单元、制品版本和 `dry_run` 等非密参数。数据库目标由 `deployments/<deployment_no>.yaml` 中的 `datasource_ref`、`service_name`、`schema_name` 与 `migration_baseline` 解析，实际凭据只从密钥系统引用；脚本必须校验部署号与环境、集群、命名空间和数据库白名单一致，不提供任意 JDBC URL 直传入口。同一部署号重跑必须幂等，迁移校验和变化或基线倒退直接失败。

依赖方向：外部请求 `-> UserInterface Adapter -> Application API -> Domain API`；Infrastructure 实现 Domain 输出端口；具体业务 `*_boot` 选择 `v1_service`、`v1_remote`、`v1_mq` 或 `v1_stub`；不同领域之间通过版本化 API 或 Outbox/Inbox 事件协作；Deployment 仅消费 `*_boot` 发布产物。测试模块可依赖被测模块 API/Adapter 与测试基础设施，生产模块绝不可反向依赖 Test。

## 6. TDD 执行与测试父模块

### 6.1 TDD 强制流程

每次 Agent 修改任何业务行为，必须按“Red -> Green -> Refactor”执行：

1. 先在所属 `*_test` 中新增或更新可失败的最小测试，用例 ID 引用[功能测试用例文档](../趣汇功能测试用例/content.md)。
2. 只实现通过该测试所需的最小生产代码；不得先写大量未被测试覆盖的分支。
3. 执行本领域测试、所属层测试父模块和受影响的跨领域/System 测试；失败不得进入下一实现步骤。
4. 通过后才重构，并重新执行同一测试集合。修改 API、事件 Schema、权限、状态机、补偿或数据迁移时，必须补充回归用例。

### 6.2 测试父模块职责

| 测试父模块 | 聚合范围 | 必须执行的测试 |
|---|---|---|
| `block_trading_ui_test` | 所有 UI 领域测试 | HTTP/回调协议、认证入口、参数校验、DTO 映射、错误映射、入口幂等 |
| `block_trading_a_test` | 所有 Application 领域和 Process 测试 | 用例编排、权限、事务意图、幂等、Outbox 意图、补偿与回执 |
| `block_trading_d_test` | 所有 Domain 领域测试 | 聚合不变量、状态机、值对象、领域事件、版本/快照规则 |
| `block_trading_i_test` | 所有 Infrastructure 测试 | Oracle/索引/消息/缓存/对象/模型/供应商适配与异常映射 |
| `block_trading_system_test` | 关键跨层、跨领域、启动装配测试 | 权限穿透、审核链、交易履约、拼单补偿、封禁豁免、灾备/重放冒烟 |

### 6.3 构建门禁

1. 已实施领域的测试和架构测试必须在每次提交执行；任何失败阻断合并。未启用的后续领域测试不进入当前周期 Gradle Build、层测试父模块或 CI。
2. 修改单一领域时，至少执行该领域的 Domain、Application、UI/Infrastructure（适用时）和关联 Process 测试。
3. 修改共享 API、事件 Schema、可见性、审核、支付、库存、封禁或数据治理时，必须执行对应 `block_trading_system_test` 场景。
4. R1 使用 Stub 与 Testcontainers 组合；支付、物流、模型供应商禁止依赖生产凭据完成自动化测试。
5. Gradle 依赖约束/自定义架构校验和 ArchUnit 同时检查：`*_api` 不依赖 `*_adapter`/`*_boot`；非 Boot 不依赖其他领域 Adapter；生产模块不依赖 `*_test`；UI 外部入口不绕过 UI Adapter；Domain/Application 不依赖 Jimmer、MyBatis-Flex、Netty 或 KSP 生成类型。

## 7. R1-R4 测试模块引入

| 周期 | 必须进入层测试父模块的领域测试 | System 测试重点 |
|---|---|---|
| R1 | identity、region_policy、community、moderation、visibility、discovery、engagement、growth_benefits、trust_safety、governance、analytics、model_governance、content_publication_process、realtime_gateway | 三段审核控制回执/安全降级、校园/拉黑召回前过滤、区域管理员隔离、Outbox/Inbox 重试、风险挑战、权益账本、Netty 鉴权/频控与 `DRAIN -> RESUME` |
| R2 | commerce、fulfillment、group_buy_settlement_process、trade_fulfillment_process、provider_callback | 预占/释放、拼单交易唯一性和资格投影、支付/物流回调幂等、商品合规控制回执、履约状态回传、售后退款补偿 |
| R3 | region_rollout_process、analytics 完整实现、OpenAPI/CLI（启用时） | 灰度与回滚、实验实际曝光、指标重算、法律保留、数据请求与恢复演练 |
| R4 | account_enforcement_process、trust_safety 处置、model_governance 多场景、discovery 模型排序 | 封禁豁免、人工覆盖/关闭模型、关联风险、侵权反通知、模型版本可重放 |

## 8. 验收标准

1. 全部 Gradle project 均为下划线命名；根项目为 `block_trading`，目标根子项目为 `block_trading_docs`、`block_trading_bom`、`block_trading_server`、`block_trading_deployment`；`block_trading_client` 是同级非 Gradle 工程，不建立统一 Runtime，也不并行维护 Maven 后端构建。
2. Gradle Build 图和目录能定位 `block_trading_server` 下的四层、实时 Gateway、层内分类、领域模块、测试父模块、系统测试根，`block_trading_client` 下的多端边界，以及 `block_trading_deployment` 下的部署号清单、共享脚本和按单元交付资产。
3. 每个已实施领域至少有一个与层测试父模块关联的 `*_test` 模块和功能用例文档条目；后续领域在其启用周期补齐模块和用例。
4. 每次 Agent 迭代都能从功能用例 ID 定位到领域测试、应用测试、适配器测试和必要的 System 测试。
5. 任何违反依赖方向、测试失败、权限绕过、幂等失效或关键状态机回归的提交都被构建门禁阻断。
6. 自动化部署能只凭 deployment_no 解析受控数据库目标，完成前置校验、迁移、发布、健康验证和失败回滚；跨环境、非白名单 schema、迁移校验和变化和重复非幂等执行均被阻断。
7. Oracle Repository 的组合实现可在同一 Spring 事务内使用 Jimmer 与 MyBatis-Flex DAO，且测试证明乐观锁冲突、Outbox 唯一写入、事务回滚、提交后缓存失效和 ORM 类型边界正确。
8. Netty 实时 Gateway 的认证、心跳、限流、发送幂等、确认游标、跨节点投递、离线补拉和蓝绿排空均有 UI/Application/Infrastructure/System 分层测试。
