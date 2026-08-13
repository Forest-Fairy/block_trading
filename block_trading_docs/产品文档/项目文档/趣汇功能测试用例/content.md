# 趣汇功能模块测试用例

## 1. 使用方式

本文是 Agent 编码的 TDD 用例基线。每个需求、缺陷或重构必须先引用至少一个用例 ID，在对应 `*_test` 模块实现失败测试，再最小化实现并完成层测试和必要的 System 测试。新增功能先增加用例，不能以人工点击替代自动化测试。

测试层级：`D` 为领域测试，`A` 为应用测试，`I` 为基础设施/适配器测试，`U` 为接口测试，`S` 为跨层 System 测试。测试模块命名遵循[代码模块规划](../趣汇代码模块规划/content.md)。

## 2. 周期测试执行规则

每个发布周期的用例集按四类风险执行：主业务闭环、权限和人工收口、异步或外部失败、发布和回退。每个功能至少覆盖其适用的成功路径与拒绝/失败路径；涉及状态变化、外部回调或人工处置时，还必须覆盖幂等、乱序、补偿、审计或恢复之一。`S` 用例在受控运行时执行，`D/A/I/U` 用例优先在所属领域或适配器模块执行。

`quhui_*_test` 与 `quhui_system_test` 只聚合当前已启用周期和既往回归用例。未来周期用例可以先登记在本文，但不得进入当前周期 Reactor、CI 或发布门禁；到该周期启用时，先实现其失败测试并接入父测试模块。

## 3. R1 受控内测用例

| 用例 ID | 功能模块 | 场景与断言 | 最低测试层 | 所属测试模块 |
|---|---|---|---|---|
| R1_ID_001 | identity | 未完成学生认证时不能开启校园模式；认证撤销后现有校园范围立即失效 | D/A/S | `quhui_d_identity_test`、`quhui_a_identity_test`、`quhui_system_test` |
| R1_ID_002 | identity/visibility | 任一方向存在有效拉黑时，双方不能读取资料、内容、互动或消息 | D/A/S | `quhui_d_visibility_test`、`quhui_a_visibility_test`、`quhui_system_test` |
| R1_REGION_001 | region_policy | 区域管理员只能操作授权区域；区域关闭不关闭已完成订单的售后入口 | D/A/U/S | `quhui_d_region_policy_test`、`quhui_a_region_policy_test`、`quhui_ui_admin_gateway_test`、`quhui_system_test` |
| R1_COMMUNITY_001 | community | 参与人数不超过上限；退出/取消符合帖子状态机；状态流水可追溯 | D/A | `quhui_d_community_test`、`quhui_a_community_test` |
| R1_MOD_001 | moderation/community | 新帖默认待审不可见；高危临时措施得到社区控制回执，否则安全降级不可见/不可互动 | D/A/S | `quhui_d_moderation_test`、`quhui_a_process_content_publication_test`、`quhui_system_test` |
| R1_MOD_002 | moderation | 规则 -> 模型 -> 人工阶段可追溯；模型结果不可独立形成最终处罚 | D/A/I | `quhui_d_moderation_test`、`quhui_a_moderation_test`、`quhui_i_plugin_embabel_test` |
| R1_VIS_001 | visibility/discovery | 可见性约束先于索引召回与候选生成；返回前逐项复核，排序/计数不泄露不可见对象 | D/A/I/S | `quhui_d_visibility_test`、`quhui_a_discovery_test`、`quhui_i_plugin_opensearch_test`、`quhui_system_test` |
| R1_ENGAGE_001 | engagement | 通知内容与收件人状态分离；拉黑/范围变动使待发消息和未读摘要失效 | D/A/I | `quhui_d_engagement_test`、`quhui_a_engagement_test`、`quhui_i_plugin_rabbitmq_test` |
| R1_GROWTH_001 | growth_benefits | 权益账本只追加；冲正可追溯；会员投影可由账本重建 | D/A/S | `quhui_d_growth_benefits_test`、`quhui_a_growth_benefits_test`、`quhui_system_test` |
| R1_TRUST_001 | trust_safety | 风险挑战失败仅限制高风险动作，不自动形成永久封禁；安全事件路由到区域应急责任 | D/A/S | `quhui_d_trust_safety_test`、`quhui_a_trust_safety_test`、`quhui_system_test` |
| R1_GOV_001 | governance | 审批记录不直接写区域策略；审批完成后才可生成策略生效版本 | D/A/S | `quhui_d_governance_test`、`quhui_a_governance_test`、`quhui_system_test` |
| R1_EVENT_001 | outbox/inbox | 业务事实与本域 ContextSnapshot/Outbox 原子写入；重复消息不重复改变状态 | A/I/S | `quhui_a_process_content_publication_test`、`quhui_i_repository_oracle_test`、`quhui_i_plugin_rabbitmq_test`、`quhui_system_test` |
| R1_COMMUNITY_002 | community/moderation/engagement | 草稿提交后默认待审；人工通过后方可参与；参与、退出、取消均生成对应状态通知和不可变状态流水 | D/A/U/S | `quhui_d_community_test`、`quhui_a_process_content_publication_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R1_COMMUNITY_003 | community | 拼车、组队、线上开黑和近邻互助分别校验时间、人数、报名截止、加急/时段字段；非法组合或结束时间早于开始时间被拒绝 | D/A/U | `quhui_d_community_test`、`quhui_a_community_test`、`quhui_ui_client_gateway_test` |
| R1_COMMUNITY_004 | community | 并发参与最后一个名额时只有一个请求成功；冲突请求不产生重复参与、重复通知或错误人数 | D/A/I/S | `quhui_d_community_test`、`quhui_a_community_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R1_ID_003 | identity/governance | 未满足年龄门槛或未确认当前隐私/社区规则版本时拒绝高风险发布；撤回非必要同意后停止对应非必要处理并保留审计 | D/A/U/S | `quhui_d_identity_test`、`quhui_a_identity_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R1_AUTH_001 | identity/trust_safety | 登录、发布、举报、邀请和审核提交达到频率或设备风险阈值时限制高风险动作；验证通过或人工放行后按策略恢复，正常用户不被永久封禁 | A/I/U/S | `quhui_a_trust_safety_test`、`quhui_i_plugin_redis_test`、`quhui_ui_edge_gateway_test`、`quhui_system_test` |
| R1_ADMIN_001 | region_policy/governance | 管理员 MFA 或敏感操作二次验证缺失时拒绝规则发布、区域关闭、权限变更和导出；成功操作记录操作者、目的、区域和审批链 | D/A/U/S | `quhui_d_governance_test`、`quhui_a_governance_test`、`quhui_ui_admin_gateway_test`、`quhui_system_test` |
| R1_VIS_002 | visibility/discovery/engagement | 拉黑、校园或区域范围变更后，搜索、推荐、详情、深链、分享落地、缓存恢复、消息卡片和待发通知均拒绝或失效，不泄露计数和摘要 | D/A/I/U/S | `quhui_d_visibility_test`、`quhui_a_visibility_test`、`quhui_i_plugin_opensearch_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R1_MEDIA_001 | governance/community | 未完成数据资产登记、审核未通过或签名 URL 过期的媒体不能展示；授权撤销后旧 URL 和派生索引均不能继续访问 | A/I/U/S | `quhui_a_governance_test`、`quhui_i_plugin_minio_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R1_ENGAGE_002 | engagement | 通知消费者重复、失败或超过重试上限时不重复发送；进入死信和人工工单后可按事件 ID 重放并只产生一次有效投递 | D/A/I/S | `quhui_d_engagement_test`、`quhui_a_engagement_test`、`quhui_i_plugin_rabbitmq_test`、`quhui_system_test` |
| R1_SUPPORT_001 | engagement/governance | 举报、客服和人身安全事件按区域路由到责任队列；超出处理时限升级并保留证据、处理人和用户通知记录 | A/I/U/S | `quhui_a_engagement_test`、`quhui_i_repository_oracle_test`、`quhui_ui_admin_gateway_test`、`quhui_system_test` |
| R1_EVENT_002 | outbox/inbox | 发布失败、消费者乱序或不可恢复消息时，已提交业务事实不被覆盖；失败任务可检索、重试或人工终止，并关联 `request_id`、`event_id` 和用例 ID | A/I/S | `quhui_a_process_content_publication_test`、`quhui_i_repository_oracle_test`、`quhui_i_plugin_rabbitmq_test`、`quhui_system_test` |
| R1_RELEASE_001 | region_policy/moderation | 关闭单一区域、审核类型或异步消费者后阻止新高风险动作；已有案件、客服和已提交任务保留可查询的恢复条件与人工收口 | A/U/S | `quhui_a_region_policy_test`、`quhui_ui_admin_gateway_test`、`quhui_system_test` |
| R1_ACCESS_001 | user_interface | 登录、发布、审核状态、权限不足和失败恢复页面具有可读名称、键盘可达焦点、动态状态播报和非颜色状态表达 | U/S | `quhui_ui_client_gateway_test`、`quhui_system_test` |
| R1_OBS_001 | observability | 发布、参与、审核和消息链路可通过同一 `request_id` 关联日志、指标、Outbox 和审计；核心错误率或队列积压越阈值产生可执行告警 | I/S | `quhui_i_starter_test`、`quhui_system_test` |

## 4. R2 单区域交易履约用例

| 用例 ID | 功能模块 | 场景与断言 | 最低测试层 | 所属测试模块 |
|---|---|---|---|---|
| R2_COMMERCE_001 | commerce | 库存预占以幂等键去重，超时可释放；订单金额引用不可变价格快照 | D/A/I | `quhui_d_commerce_test`、`quhui_a_commerce_test`、`quhui_i_repository_oracle_test` |
| R2_COMMERCE_002 | commerce/moderation | 商品高危合规控制由 commerce 幂等执行，并回传执行/拒绝结果 | D/A/S | `quhui_d_commerce_test`、`quhui_a_commerce_test`、`quhui_system_test` |
| R2_GROUP_001 | group_buy_settlement | 拼单的订单、预占、支付、退款唯一归 commerce；社区参与只保存可追溯资格投影 | D/A/I/S | `quhui_d_commerce_test`、`quhui_a_process_group_buy_settlement_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R2_PAYMENT_001 | provider_callback | 渠道回调先落原始事实，以 provider event ID 幂等，再改变订单/支付状态 | U/A/I/S | `quhui_ui_provider_callback_test`、`quhui_a_commerce_test`、`quhui_i_plugin_payment_test`、`quhui_system_test` |
| R2_FULFILL_001 | fulfillment | 物流节点按供应商事件去重且不回退；履约状态报告带来源版本，commerce 幂等更新订单投影 | D/A/I/S | `quhui_d_fulfillment_test`、`quhui_a_fulfillment_test`、`quhui_i_plugin_logistics_test`、`quhui_system_test` |
| R2_AFTERSALE_001 | fulfillment/commerce | 售后证据具备权限与留存；退款经 commerce API 执行，评价争议不承担反刷处罚 | D/A/S | `quhui_d_fulfillment_test`、`quhui_a_fulfillment_test`、`quhui_system_test` |
| R2_COMMERCE_003 | commerce/region_policy | 商品可售、营业时间、配送范围或区域交易开关不满足时拒绝创建订单；关闭交易区域后停止新收款，但订单查询、退款、售后和客服入口持续可用 | D/A/U/S | `quhui_d_commerce_test`、`quhui_a_commerce_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R2_PAYMENT_002 | provider_callback/commerce | 回调签名、商户、金额、币种和订单绑定任一不匹配即仅保留原始事实并拒绝状态变更；验证失败记录可审计原因且不泄露密钥 | A/I/U/S | `quhui_a_commerce_test`、`quhui_i_plugin_payment_test`、`quhui_ui_provider_callback_test`、`quhui_system_test` |
| R2_PAYMENT_003 | commerce | 同一支付的成功、失败、退款回调重复或乱序到达时按可接受状态迁移处理；不能由迟到失败回调覆盖已确认支付或退款结果 | D/A/I/S | `quhui_d_commerce_test`、`quhui_a_commerce_test`、`quhui_i_plugin_payment_test`、`quhui_system_test` |
| R2_PAYMENT_004 | commerce/engagement | 对账发现渠道事实与订单不一致时创建责任工单、冻结自动完成并通知用户；人工裁决后只通过幂等补偿改变订单投影 | A/I/S | `quhui_a_commerce_test`、`quhui_i_plugin_payment_test`、`quhui_i_plugin_rabbitmq_test`、`quhui_system_test` |
| R2_FULFILL_002 | fulfillment | 物流超时、异常节点或供应商不可用时不将订单标记完成；创建履约工单、按区域时效升级，并允许受控重试或人工状态报告 | D/A/I/S | `quhui_d_fulfillment_test`、`quhui_a_fulfillment_test`、`quhui_i_plugin_logistics_test`、`quhui_system_test` |
| R2_AFTERSALE_002 | fulfillment/commerce | 取消、价格变动、库存预占超时和履约失败分别触发正确退款或释放补偿；重复补偿不重复退款、不丢失证据 | D/A/I/S | `quhui_d_commerce_test`、`quhui_a_process_trade_fulfillment_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R2_ENGAGE_001 | engagement/commerce | 支付、退款、取消和安全通知保存独立投递尝试；站内投递失败时按策略重试、备用触达或进入人工队列，已读不等于送达成功 | A/I/S | `quhui_a_engagement_test`、`quhui_i_plugin_rabbitmq_test`、`quhui_system_test` |
| R2_GROUP_002 | community/commerce | 拼单资格撤销、库存不足、支付超时或退款完成时，社区只更新可追溯资格投影；不得写入订单金额、支付流水或退款状态 | D/A/I/S | `quhui_d_community_test`、`quhui_a_process_group_buy_settlement_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R2_RELEASE_001 | commerce/fulfillment | 资金、履约或内容风险触发区域交易关闭时，停止下单/支付并保留现有订单、退款、售后和客服可用；恢复前验证未处理补偿与队列积压 | A/U/S | `quhui_a_commerce_test`、`quhui_ui_admin_gateway_test`、`quhui_system_test` |

## 5. R3 跨区域扩张用例

| 用例 ID | 功能模块 | 场景与断言 | 最低测试层 | 所属测试模块 |
|---|---|---|---|---|
| R3_ANALYTICS_001 | analytics | 实验分桶不等于实际曝光；指标可按区域/渠道/版本重算 | D/A/I/S | `quhui_d_analytics_test`、`quhui_a_analytics_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R3_GOV_001 | governance | 法律保留阻止删除；数据请求保留每个领域的处理证据 | D/A/S | `quhui_d_governance_test`、`quhui_a_governance_test`、`quhui_system_test` |
| R3_REGION_001 | region_rollout | 灰度策略必须先审批；护栏触发可暂停并回滚，不改变历史快照 | A/S | `quhui_a_process_region_rollout_test`、`quhui_system_test` |
| R3_REGION_002 | region_policy/governance | 区域模板的定时生效、审批、撤销和回滚只影响目标区域与目标版本；并发配置发布不能跳过审批或覆盖已生效历史快照 | D/A/I/S | `quhui_d_region_policy_test`、`quhui_a_process_region_rollout_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R3_REGION_003 | region_rollout | 新区域灰度期间举报率、履约时效、错误率或单位服务成本触发护栏时停止放量并回退受控运营；已完成订单和既有服务承诺不受影响 | A/I/S | `quhui_a_process_region_rollout_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R3_ANALYTICS_002 | analytics | 缺失 R1/R2 可选历史字段的记录标记为未归因，不阻塞新区域的指标计算；同一事件重放不会重复计入指标 | D/A/I/S | `quhui_d_analytics_test`、`quhui_a_analytics_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R3_ENGAGE_001 | engagement | 用户退订、免打扰或频控命中后停止非关键触达；安全、退款和取消等关键通知仍遵循受控送达和审计策略 | D/A/I/S | `quhui_d_engagement_test`、`quhui_a_engagement_test`、`quhui_i_plugin_rabbitmq_test`、`quhui_system_test` |
| R3_MINI_001 | user_interface/commerce | 小程序分享深链在授权失效、区域不可用或支付结果延迟时恢复至安全页面；只在重新鉴权和状态核验后展示参与或订单结果 | A/U/S | `quhui_a_commerce_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R3_GOV_002 | governance | 数据导出/删除请求跨领域执行时逐域记录授权、处理结果和失败原因；法律保留、订单/审计留存冲突时拒绝物理删除并返回可解释状态 | D/A/I/S | `quhui_d_governance_test`、`quhui_a_governance_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R3_RECOVERY_001 | governance/infrastructure | 从受控备份恢复后，业务事实、Outbox/Inbox 幂等记录、区域策略版本和对象引用保持一致；恢复演练产生结果、差异和人工签收记录 | A/I/S | `quhui_a_governance_test`、`quhui_i_repository_oracle_test`、`quhui_i_plugin_minio_test`、`quhui_system_test` |
| R3_INCIDENT_001 | governance/trust_safety | 数据泄露或区域服务故障演练可关闭受影响功能、保全证据、通知责任人并记录恢复步骤；演练不能向真实用户或生产供应商发出通知 | A/I/S | `quhui_a_governance_test`、`quhui_i_starter_test`、`quhui_system_test` |

## 6. R4 规模化优化用例
| R4_MODEL_001 | model_governance | 只有获准入模型可用于业务场景；停用不覆盖已有决策记录 | D/A/I | `quhui_d_model_governance_test`、`quhui_a_model_governance_test`、`quhui_i_plugin_embabel_test` |
| R4_TRUST_001 | trust_safety | 永久封禁需人工审批和不同人员复核；单一风险信号不能永久封禁 | D/A/S | `quhui_d_trust_safety_test`、`quhui_a_trust_safety_test`、`quhui_system_test` |
| R4_TRUST_002 | account_enforcement | 封禁后仍可访问订单、退款/售后、申诉、隐私和注销；限制执行有回执 | A/S | `quhui_a_process_account_enforcement_test`、`quhui_system_test` |
| R4_IP_001 | moderation/trust_safety | 侵权投诉、反通知和下架均保留证据、人工复核和审计链 | D/A/S | `quhui_d_moderation_test`、`quhui_a_trust_safety_test`、`quhui_system_test` |
| R4_MODEL_002 | model_governance/discovery/trust_safety | 模型超时、不可用、版本停用或护栏越阈值时降级到规则排序/人工队列；关闭开关后不再调用模型且保留已发生决策 | D/A/I/S | `quhui_d_model_governance_test`、`quhui_a_model_governance_test`、`quhui_i_plugin_embabel_test`、`quhui_system_test` |
| R4_MODEL_003 | model_governance | 自动推荐或风控决定必须关联模型版本、输入摘要、策略版本和原因；人工覆盖后可重放并解释最终结果，不覆盖原始记录 | D/A/I/S | `quhui_d_model_governance_test`、`quhui_a_model_governance_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R4_TRUST_003 | trust_safety/account_enforcement | 关联风险命中只限制对应高风险动作；误伤经人工复核后恢复权限、通知用户并保留纠正审计，不自动扩大为永久封禁 | D/A/I/S | `quhui_d_trust_safety_test`、`quhui_a_process_account_enforcement_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R4_DISCOVERY_001 | discovery/analytics | 个性化排序实验对受保护区域/用户群的曝光、点击和负反馈可比较；越过公平或质量护栏时回滚至规则排序 | D/A/I/S | `quhui_d_discovery_test`、`quhui_a_analytics_test`、`quhui_i_plugin_opensearch_test`、`quhui_system_test` |
| R4_DISCOVERY_002 | discovery/identity | 用户关闭个性化、撤回非必要画像授权或请求查看排序原因后，后续召回遵循偏好并提供可解释摘要；缓存和候选及时失效 | D/A/I/U/S | `quhui_d_visibility_test`、`quhui_a_discovery_test`、`quhui_i_plugin_redis_test`、`quhui_ui_client_gateway_test`、`quhui_system_test` |
| R4_BENEFIT_001 | growth_benefits/trust_safety | 积分、优惠和邀请的异常关联命中后冻结可疑奖励而不覆盖不可变账本；人工裁决以冲正或恢复流水处理并防止重复补贴 | D/A/I/S | `quhui_d_growth_benefits_test`、`quhui_a_growth_benefits_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R4_IP_002 | moderation/trust_safety | 侵权下架、反通知、恢复或维持下架遵循期限、权限和证据完整性；重复投诉和过期反通知不能改变已生效裁决 | D/A/I/S | `quhui_d_moderation_test`、`quhui_a_trust_safety_test`、`quhui_i_repository_oracle_test`、`quhui_system_test` |
| R4_RELEASE_001 | model_governance/region_policy | 自动化策略按区域或场景小流量启用；容量、成本、错误率或风险护栏触发时暂停放量、回滚版本并保留未完成用户请求的人工收口 | A/I/S | `quhui_a_process_region_rollout_test`、`quhui_i_starter_test`、`quhui_system_test` |

## 7. 测试数据与隔离

1. 领域测试使用构造器/Fixture，不访问网络、数据库或时钟全局状态；时间通过 `Clock` 端口固定。
2. 应用测试使用本地 Stub，显式断言端口调用、Outbox 意图和幂等结果。
3. 基础设施测试用 Testcontainers 或可重复初始化的本地替身；每个用例独立数据命名空间和事件 ID。
4. System 测试用专用区域、校区、用户、订单和设备测试数据；不得访问生产 Nacos、支付、物流或模型凭据。
5. 任一失败用例必须能从日志中的 `request_id`、`event_id`、聚合 ID 和用例 ID 关联到具体领域事实。

## 8. 测试验收

- 新功能、缺陷修复、API/事件变更和状态机调整均有新增或修改用例 ID。
- Red 阶段必须存在失败测试证据；Green 阶段执行所属领域测试、层测试和必要 System 测试。
- 合并前不得跳过失败测试、删除回归测试或以降低断言代替修复。
- R1 关键链路的 System 测试失败即阻断发布；R2-R4 新能力未具备对应测试用例不得开启功能开关。
- 周期发布前，必须完成本期主业务闭环、权限与人工收口、异步/外部失败、发布与回退四类用例；仅在文档登记而未实现失败测试的用例不得计入通过。
