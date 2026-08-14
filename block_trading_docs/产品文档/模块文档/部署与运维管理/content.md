# 部署与运维管理

## 功能定位

本模块为 R1 上线提供可重复、可审计的脚本化部署和最小后台运维能力。部署资产归 `block_trading_deployment`，只消费各业务 `*_boot` 与前端发布产物；后台经版本化管理接口读取部署记录、脱敏日志和归档状态，不直接执行 Kubernetes 命令、不保存数据库密码，也不承载领域业务规则。

归属需求为 `FR-OPS-001`、`FR-OPS-002`、`FR-OPS-003` 与 `FR-OPS-004`，关联测试为 `R1_DEPLOY_001`、`R1_DEPLOY_002`、`R1_DB_DEPLOY_001`、`R1_LOG_001`、`R1_LOG_ARCHIVE_001`、`R1_OBS_001`、`R1_OBS_002` 与 `R1_INCIDENT_001`。

## 部署号与不可变清单

`deployment_no` 是一次部署执行的稳定标识，格式为 `DEP-{yyyyMMdd}-{4位序号}`，例如 `DEP-20260814-0001`。部署号全局唯一、创建后不得换绑环境、制品或数据库目标；修订清单必须创建新部署号。部署清单存放于 `block_trading_deployment/deployments/<deployment_no>.yaml`，进入版本控制前必须通过 Schema 校验与审批。

| 字段 | 必填 | 作用 | 约束 |
|---|---|---|---|
| `deployment_no` | 是 | 部署、迁移、日志与审计关联主键 | 与文件名一致，全局唯一且不可复用 |
| `environment` | 是 | 目标环境 | 允许值：`DEV` 开发、`TEST` 测试、`STAGING` 预发布、`PROD` 生产 |
| `unit` | 是 | 目标部署单元 | 必须对应已建立的 `block_trading_deploy_<unit>` |
| `artifact_version`、`artifact_digest` | 是 | 锁定制品版本与摘要 | 不允许浮动标签；下载后再次校验摘要 |
| `cluster_ref`、`namespace` | 是 | 引用目标集群与命名空间 | 必须属于 environment 白名单 |
| `datasource_ref` | 是 | 引用密钥系统/配置中心中的 Oracle 数据源 | 只保存引用，不保存 JDBC URL、用户名或密码 |
| `service_name`、`schema_name` | 是 | 指定 Oracle 服务与逻辑 schema | 必须属于 datasource_ref 和部署单元白名单 |
| `migration_baseline`、`migration_target` | 是 | 限定允许执行的迁移区间 | 不得倒退；脚本和校验和必须与制品版本匹配 |
| `release_strategy` | 是 | 发布流量策略 | 允许值：`ROLLING`、`BLUE_GREEN`、`CANARY`；涉及 Netty Gateway、协议重大版本或高连接数单元默认 `BLUE_GREEN` |
| `target_slot`、`previous_slot` | `BLUE_GREEN` 必填 | 新旧工作负载槽位 | 允许值：`BLUE`、`GREEN`；两者必须不同，稳定 Service 只指向一个已验证槽位 |
| `drain_timeout_seconds` | 是 | 旧槽位连接排空上限 | 大于最长允许短请求；实时 Gateway 还必须覆盖 `DRAIN` 通知与客户端重连窗口 |
| `previous_deployment_no` | 生产必填 | 指定健康回退基线 | 必须是相同 environment 与 unit 的已验证部署 |
| `config_version`、`secret_refs` | 是 | 锁定配置与密钥引用版本 | 密钥值不进入清单、日志或部署记录 |

environment 是封闭枚举，完整允许值为 `DEV`（开发）、`TEST`（测试）、`STAGING`（预发布）、`PROD`（生产）；创建清单时确定，不允许原地迁移，跨环境发布必须创建新部署号。

数据库解析顺序固定为“deployment_no -> 不可变清单 -> datasource_ref -> service_name/schema_name -> migration_baseline/target -> 密钥系统”。命令行不得接收任意 JDBC URL 或明文凭据。environment、集群、命名空间、数据源、schema、制品摘要或迁移校验和任一不匹配时，必须在数据库变更前失败。

所有环境均禁用 ORM 自动建表、更新表结构、删除表结构和运行时 DDL。数据库结构的唯一执行来源是已审核、版本化的迁移资产，实体映射、Jimmer 定义和 MyBatis-Flex Mapper 的变化不得由 `migrate` 或应用启动过程推导出 SQL。迁移资产必须登记风险级别：`ADDITIVE`（新增兼容结构）、`TRANSITIONAL`（需扩展、回填、切换、清理的多阶段变更）或 `DESTRUCTIVE`（删除、收窄或不可逆变更）；`TRANSITIONAL` 和 `DESTRUCTIVE` 均需审批引用、备份/恢复证据及兼容性验证，缺失即阻断。

发布策略是封闭枚举：`ROLLING`（同一 Deployment 使用 `maxUnavailable=0` 与 `maxSurge>=1`）、`BLUE_GREEN`（新旧槽位并存，由稳定 Service 或 Gateway 路由一次切流）、`CANARY`（按审批权重逐级放量）。对外端口归稳定 Service/Gateway 所有，脚本不得修改运行中容器的端口映射；新槽位以独立 Pod 启动、通过探针后加入路由，旧槽位通过摘流和排空退出。`BLUE_GREEN` 的槽位为封闭枚举：`BLUE`（蓝槽）、`GREEN`（绿槽），任一时刻只能有一个稳定 Service 目标槽位。

## 部署状态与自动化流程

部署状态完整允许值为：`PLANNED`（已登记）、`VALIDATING`（前置校验中）、`MIGRATING`（数据库迁移中）、`DEPLOYING`（发布中）、`VERIFYING`（健康与冒烟验证中）、`ACTIVE`（当前健康版本）、`FAILED`（失败待处置）、`ROLLING_BACK`（回滚中）、`ROLLED_BACK`（已回滚终态）、`ABORTED`（人工终止终态）。初始值为 `PLANNED`，终态为 `ROLLED_BACK`、`ABORTED`；`ACTIVE` 是成功稳定态，但允许因事故进入 `ROLLING_BACK`。

允许迁移为 `PLANNED -> VALIDATING -> MIGRATING -> DEPLOYING -> VERIFYING -> ACTIVE`；任一执行态可进入 `FAILED`；`FAILED -> VALIDATING` 表示同部署号幂等重试，或进入 `ROLLING_BACK`、`ABORTED`；`ACTIVE -> ROLLING_BACK -> ROLLED_BACK`。不得跳过校验、迁移或验证直接写为 `ACTIVE`。

1. `validate` 校验清单 Schema、审批、制品摘要、环境白名单、集群连通性、数据库目标、迁移校验和、迁移风险级别、备份/回退基线和可用容量；同时检查应用配置未启用 ORM 自动 DDL。
2. `migrate` 只执行清单限定区间；同一 deployment_no 已成功的迁移步骤返回既有结果，禁止重复执行非幂等脚本。
3. `deploy` 应用镜像与 overlay，等待启动/就绪探针，通过最小冒烟测试后切换流量；任一步失败停止继续放量并记录退出码与失败原因。
4. `rollback` 仅回到 previous_deployment_no 的健康制品与配置。破坏性数据库迁移没有经验证的向后兼容方案时，部署前即阻断，不以运行中自动逆向 DDL 冒险回滚。
5. 每一步记录 deployment_no、命令、流水线/操作者、目标、开始结束时间、版本、结果、退出码和证据引用；同一部署号重跑只继续未完成步骤或返回已成功结果。

## 零停机切流与连接排空

1. `deploy` 先在不承接稳定流量的目标槽位创建新实例，等待启动/就绪探针连续成功并执行健康、协议、数据库兼容和容量冒烟；未通过时不切流，直接清理目标槽位或保留诊断证据。
2. `switch-traffic` 原子更新稳定 Service Selector 或 Gateway 后端权重，不修改新旧容器端口。切流后记录路由版本、切流时间、目标槽位和存活副本；回滚在旧槽位健康且迁移可兼容时反向执行同一动作。
3. `drain` 使旧槽位立即拒绝新 HTTP/WebSocket 连接，等待已开始 HTTP 请求结束；实时 Gateway 向既有客户端发送 `DRAIN`，客户端按抖动退避重连并以会话确认游标执行 `RESUME`。排空结束、连接达到零或超过 `drain_timeout_seconds` 后，才允许缩容旧槽位；超时强制关闭数必须记录并告警。
4. 不承诺将既有 TCP/WebSocket 连接迁移到新 Pod。任何客户端在重连前未确认的消息均通过持久化 `message_seq` 与确认游标补拉；切流成功不得以“旧连接仍在”或“端口已替换”作为判断条件。

## 运行监控、告警与应急响应

本模块将指标规则、仪表盘、告警规则和 Runbook 作为 `block_trading_deployment` 的版本化非密资产，与 `deployment_no`、`config_version` 和服务制品一起评审、验证和回滚。R1 使用 OpenTelemetry 采集 Trace、Metric 与 Log 关联数据，Prometheus 负责指标抓取和规则计算，Grafana 提供受权限控制的仪表盘；通知和事故记录通过受控告警集成创建，不允许后台页面直接修改生产告警规则或绕过流水线静默告警。

### 指标、目标与仪表盘

| 指标域 | 必采指标与口径 | R1 目标/门槛 | 仪表盘 |
|---|---|---|---|
| HTTP 服务 | 有效请求数、服务端 5xx/超时、`p50/p95/p99` 时延；4xx 单列但不计入服务端可用性失败 | 30 日 HTTP 成功率 `>=99.5%`，服务端 `p95 <=800 ms` | `OPS-SERVICE-HEALTH` |
| 实时 Gateway | 已认证在线连接、认证/`RESUME` 成功与失败、心跳超时、背压拒绝、`DRAIN` 通知、强制关闭与补拉结果 | 30 日连接建立或恢复成功率 `>=99.5%`；发布后强制关闭与恢复失败必须可定位 | `OPS-REALTIME` |
| 异步与存储 | RabbitMQ 就绪/未确认数量、最老消息年龄、死信、重试；Oracle 连接池等待、查询超时、错误数；Redis/MinIO 可用性 | 关键队列最老消息年龄 `<=5 min`；连接池耗尽、死信增长或连续查询超时不得无告警 | `OPS-ASYNC-DATA` |
| 发布与容量 | Pod 存活/就绪、副本数、CPU/内存、磁盘、发布阶段耗时、切流、排空、回滚及 deployment_no | 新槽位连续就绪和冒烟通过前不得切流；排空超时、就绪回退或回滚均须产生事件 | `OPS-RELEASE-CAPACITY` |
| 业务保护 | 审核控制回执失败、可见性拒绝异常、Outbox/Inbox 失败、重要安全降级与人工队列超时 | 任一安全降级、失败任务或人工收口必须可按 request_id、event_id、deployment_no 追踪 | `OPS-BUSINESS-GUARDRAIL` |
| 观测系统自身 | OTel 导出失败、Prometheus 抓取失败、告警规则求值失败、日志索引延迟和存储容量 | 观测数据中断不得被误判为业务健康；采集失败单独告警 | `OPS-OBSERVABILITY-HEALTH` |

Metrics label 只允许 `service`、`environment`、`deployment_no`、`region_code`、`operation`、`result` 和低基数 `error_code`。`user_id`、设备标识、会话 ID、`request_id`、`trace_id`、消息内容、URL 参数、异常原文和任意自由文本不得进入 label；Trace/Log 的采样、脱敏和留存由应用与索引策略控制，不能将 Trace 维度复制为 Metrics 维度。

服务等级目标（SLO）以连续 30 个自然日为统计窗口，使用上表中的有效请求、时延、实时连接恢复和队列年龄计算。计划维护窗口必须事先登记且在仪表盘中显示；外部依赖失败不从用户体验 SLO 中剔除，但可在事故复盘中按依赖归因。每次阈值、采样率、查询窗口、维护窗口或告警路由变更均更新版本化配置并在 deployment_no 记录中保存 `observability_config_version`。

### 告警、值班与事故状态

告警严重度完整允许值为 `P1`（核心入口不可用、数据安全/完整性风险或受控内测全局阻断，15 分钟内确认、60 分钟内止损或升级）、`P2`（SLO 快速消耗、关键积压、发布后错误率上升或长连接恢复失败，30 分钟内确认、4 小时内缓解）和 `P3`（容量趋势、单节点或非关键降级，工作时间内受理并排入修复）。每条规则必须定义：稳定 rule_id、表达式、评估窗口、连续触发时长、去重键、静默/维护条件、恢复条件、目标仪表盘、Runbook、通知目标和责任角色；告警规则没有这些字段不得进入 `PROD`。

事故状态完整允许值为 `OPEN`（告警已建档，初始值）、`ACKNOWLEDGED`（值班确认）、`MITIGATING`（正在止损或恢复）、`RESOLVED`（恢复完成终态）和 `REVIEWED`（复盘确认终态）。允许迁移为 `OPEN -> ACKNOWLEDGED -> MITIGATING -> RESOLVED -> REVIEWED`；任何未终态状态在恢复证据充分时可进入 `RESOLVED`。重复告警按 rule_id、环境、服务和影响范围去重，恢复通知只关闭同一事故，不得自动删除操作和证据。

| 角色 | 职责 | 处置权限边界 |
|---|---|---|
| 值班主责 | 确认告警、执行首轮 Runbook、更新事故状态与证据 | 可执行已审批的摘流、扩容、功能开关和消费者暂停，不可修改领域数据或跳过迁移审批 |
| 事故指挥 | 判断影响范围、升级、协调发布/回滚和用户沟通 | 可批准已定义的紧急降级或回滚；破坏性数据操作仍需既有审批与恢复证据 |
| 领域负责人 | 判断业务影响、执行应用级降级、补偿或人工收口 | 不直接修改集群、告警规则或数据库结构 |
| 系统管理员 | 维护基础设施、密钥引用、观测权限和证据保全 | 不以管理员权限绕过审计、脱敏或 RBAC |

R1 必备 Runbook 为：`RB-HTTP-ERROR`（HTTP 错误率/时延）、`RB-REALTIME-RESUME`（连接恢复与排空）、`RB-QUEUE-BACKLOG`（积压/死信）、`RB-DATABASE-EXHAUSTION`（连接池/查询超时）、`RB-RELEASE-ROLLBACK`（发布与切流失败）、`RB-OBSERVABILITY-GAP`（采集/规则/索引中断）和 `RB-SECURITY-PRESERVE`（安全事件证据保全）。每份 Runbook 至少包含触发条件、确认查询、低风险止损动作、禁止动作、升级条件、恢复验证和证据位置；R1 仅把 Runbook 作为受控脚本和文档交付，不承诺自动替代人工事故决策。

## 日志追踪、筛选与安全

应用日志采用逐行 JSON，必备字段为 `timestamp`、`level`、`service`、`environment`、`deployment_no`、`node_or_pod`、`request_id`、`trace_id`、`logger`、`message`、`error_code`。level 是封闭枚举：`TRACE`（最细诊断）、`DEBUG`（调试）、`INFO`（正常事实）、`WARN`（可恢复异常）、`ERROR`（处理失败）、`FATAL`（服务不可继续）；生产默认写入阈值为 `INFO`，临时调高必须限定服务和有效期并留审计。

后台支持按开始/结束时间、level、service、environment、deployment_no、node_or_pod、关键字、request_id、trace_id、error_code 组合筛选；默认最近 15 分钟、按时间倒序分页，单次时间范围默认不超过 7 天，扩大范围必须具备额外权限。request_id/trace_id 追踪结果按时间展示跨服务节点、持续时间、状态与关联 deployment_no，并明确缺失片段，不能把没有上报解释为成功。

令牌、Cookie、密码、验证码、密钥、身份证件、电话、精确地址、银行卡与未授权请求体字段必须在写入前脱敏或不记录。系统管理员需具备 `operations:log:read` 权限；普通运营管理员和区域管理员默认无权读取基础设施原始日志。每次查询和归档下载都记录操作者、目的、条件、结果数量、时间与审批引用。

## 切片、月归档与清理

在线文件在自然日边界或文件达到 `LOG_ROLLING_MAX_SIZE_MIB` 时滚动，任一条件先满足即关闭当前切片。默认上限 100 MiB，文件名为 `<service>-<yyyy-MM-dd>.<index>.jsonl`；切片关闭后只读，不允许追加或改写。

次月首日归档上月全部已关闭切片，归档名为 `<service>-<yyyy-MM>.tar.gz`，同时生成包含源文件名、字节数、SHA-256 和 deployment_no 范围的 manifest。默认在线保留 30 天、归档保留 12 个月；环境可收紧存储上限，但审计、支付、安全事件、法律保留和证据保全策略优先，清理不得提前删除相关日志。

归档状态完整允许值为：`PENDING`（待执行，初始值）、`RUNNING`（归档中）、`SUCCEEDED`（校验成功终态）、`FAILED`（失败待重试）、`ABORTED`（人工终止终态）。允许迁移为 `PENDING -> RUNNING -> SUCCEEDED`，执行错误进入 `FAILED`，`FAILED -> RUNNING` 可幂等重试，或进入 `ABORTED`。只有归档文件与 manifest 校验成功且不受保留策略阻止时，源切片才可进入清理；失败、校验不一致或目标存储不可用时不得删除源文件。

## 功能接口

以下接口为 v1 规划契约。CLI 由 CI/CD 流水线或获授权系统管理员调用，以 deployment_no 作为幂等键；Web 接口仅供内部管理后台，经 MFA、RBAC、用途审计和服务端查询限制访问。接口实现前必须回填实际代码文件、方法名、错误码和 OpenAPI/CLI Schema。

### 启动参数

| 参数英文 | 参数中文 | 类型 | 作用 | 取值示例 |
|---|---|---|---|---|
| `DEPLOYMENT_NO` | 部署号 | `String` | 将运行实例、日志与部署记录关联到不可变清单 | `DEP-20260814-0001` |
| `APP_ENVIRONMENT` | 运行环境 | `Enum` | 运行时二次校验清单环境 | `PROD` |
| `LOG_ROLLING_MAX_SIZE_MIB` | 日志单片上限 | `Integer` | 达到该大小即滚动，默认 100 MiB | `100` |
| `LOG_ONLINE_RETENTION_DAYS` | 在线保留天数 | `Integer` | 控制已归档且无保留阻塞的在线切片清理，默认 30 | `30` |
| `LOG_ARCHIVE_RETENTION_MONTHS` | 归档保留月数 | `Integer` | 控制无额外治理要求的归档保留，默认 12 | `12` |
| `LOG_ARCHIVE_TARGET_REF` | 归档目标引用 | `String` | 引用归档对象存储，不含密钥 | `minio://ops-log-archive` |
| `OTEL_SERVICE_NAME` | 观测服务名 | `String` | 固定服务维度，不接受用户或实例随机值 | `community` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTel 导出端点引用 | `String` | 指向受控 Collector，不含认证密钥 | `http://otel-collector:4317` |
| `OBSERVABILITY_CONFIG_VERSION` | 观测配置版本 | `String` | 关联指标、SLO、告警与仪表盘配置版本 | `obs-r1-v1` |

### 控制台接口

| 命令名 | 命令 | 参数及说明 | 对应代码文件和方法名 | 调用示例 |
|---|---|---|---|---|
| 部署前校验 | `scripts/validate.sh` | `--deployment-no` 必填；`--dry-run` 可选；Windows 包装器为 `scripts/validate.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/validate.sh --deployment-no DEP-20260814-0001 --dry-run` |
| 数据库迁移 | `scripts/migrate.sh` | `--deployment-no` 必填；数据库目标只从清单解析；Windows 包装器为 `scripts/migrate.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/migrate.sh --deployment-no DEP-20260814-0001` |
| 自动部署 | `scripts/deploy.sh` | `--deployment-no` 必填；串行执行校验、迁移、发布与验证；Windows 包装器为 `scripts/deploy.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/deploy.sh --deployment-no DEP-20260814-0001` |
| 流量切换 | `scripts/switch-traffic.sh` | `--deployment-no` 必填；仅对已验证目标槽位切换稳定 Service/Gateway 路由；Windows 包装器为 `scripts/switch-traffic.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/switch-traffic.sh --deployment-no DEP-20260814-0001` |
| 连接排空 | `scripts/drain.sh` | `--deployment-no` 必填；对 previous_slot 摘流并等待 `drain_timeout_seconds`；Windows 包装器为 `scripts/drain.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/drain.sh --deployment-no DEP-20260814-0001` |
| 回滚 | `scripts/rollback.sh` | `--deployment-no` 必填；回到清单的 previous_deployment_no；Windows 包装器为 `scripts/rollback.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/rollback.sh --deployment-no DEP-20260814-0001` |
| 月度日志归档 | `scripts/archive-logs.sh` | `--month`、`--service` 必填；`--dry-run` 可选；Windows 包装器为 `scripts/archive-logs.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/archive-logs.sh --month 2026-07 --service community` |
| 观测配置校验 | `scripts/verify-observability.sh` | `--deployment-no` 必填；校验采集、标签、仪表盘、SLO、告警路由和 Runbook 引用；Windows 包装器为 `scripts/verify-observability.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/verify-observability.sh --deployment-no DEP-20260814-0001` |
| 受控演练 | `scripts/drill.sh` | `--deployment-no`、`--scenario` 必填；scenario 允许 `HTTP_ERROR`、`QUEUE_BACKLOG`、`REALTIME_DRAIN`、`OBSERVABILITY_GAP`；只允许 TEST/STAGING 或经审批的生产演练 | `block_trading_deploy_base` 待实现 | `./scripts/drill.sh --deployment-no DEP-20260814-0001 --scenario REALTIME_DRAIN` |

### web 接口

| 接口名 | 接口路径 | 接口类型 | 参数及说明 | 对应的代码文件和方法名 | 参数示例 | 返回值示例 |
|---|---|---|---|---|---|---|
| 部署记录查询 | `/api/admin/v1/operations/deployments` | `GET` | `deploymentNo`、`environment`、`unit`、`status`、时间范围与分页；不返回密钥 | Admin Gateway -> Operations Application Port 待实现 | `?deploymentNo=DEP-20260814-0001` | `{"items":[{"deploymentNo":"DEP-20260814-0001","environment":"PROD","schemaName":"QH_COMMUNITY","status":"ACTIVE"}]}` |
| 日志筛选 | `/api/admin/v1/operations/logs` | `GET` | 开始/结束时间必填；可选 level、service、environment、deploymentNo、nodeOrPod、keyword、requestId、traceId、errorCode 与分页 | Admin Gateway -> Observability Adapter 待实现 | `?from=2026-08-14T10:00:00%2B08:00&to=2026-08-14T10:15:00%2B08:00&deploymentNo=DEP-20260814-0001&level=ERROR` | `{"items":[{"timestamp":"2026-08-14T10:03:12+08:00","level":"ERROR","service":"community","requestId":"req-01","message":"downstream timeout"}],"nextCursor":"c2"}` |
| 链路追踪 | `/api/admin/v1/operations/logs/traces/{traceId}` | `GET` | traceId 路径参数；可选 deploymentNo 与时间范围防止误关联 | Admin Gateway -> Observability Adapter 待实现 | `/api/admin/v1/operations/logs/traces/trace-01?deploymentNo=DEP-20260814-0001` | `{"traceId":"trace-01","spans":[{"service":"gateway","status":"OK"},{"service":"community","status":"ERROR"}],"partial":false}` |
| 归档记录查询 | `/api/admin/v1/operations/log-archives` | `GET` | month、service、status 与分页；返回 manifest 校验、大小、保留期限和失败原因 | Admin Gateway -> Operations Application Port 待实现 | `?month=2026-07&service=community` | `{"items":[{"month":"2026-07","service":"community","status":"SUCCEEDED","sha256":"...","retentionUntil":"2027-07-31"}]}` |
| 运行概览查询 | `/api/admin/v1/operations/health/summary` | `GET` | `environment`、`service`、`deploymentNo` 与时间窗口；只返回脱敏聚合健康、SLO、告警和仪表盘链接 | Admin Gateway -> Observability Adapter 待实现 | `?environment=PROD&service=community&window=30d` | `{"service":"community","sloStatus":"AT_RISK","activeIncidents":1,"dashboardRef":"OPS-SERVICE-HEALTH"}` |
| 事故记录查询 | `/api/admin/v1/operations/incidents` | `GET` | `status`、`severity`、`service`、`deploymentNo`、时间范围与分页；只读，不提供绕过告警路由的建单/关闭操作 | Admin Gateway -> Operations Application Port 待实现 | `?severity=P2&status=MITIGATING` | `{"items":[{"incidentId":"INC-01","severity":"P2","status":"MITIGATING","runbookId":"RB-QUEUE-BACKLOG"}]}` |

## 验收标准

1. 仅提供 deployment_no 即可加载受审批清单并解析环境、制品、集群、数据库 service/schema 与迁移区间；命令行无法传入任意 JDBC URL 或明文密钥。
2. 部署号与环境、集群、命名空间、数据源或 schema 不匹配时，在数据库和集群变更前失败并返回非零退出码。
3. 同一部署号重跑不重复执行已成功迁移或重复放量；失败步骤、退出码和证据可追溯，回滚只使用 previous_deployment_no 的健康版本。
4. 应用配置未启用 ORM 自动 DDL；每项数据库变更均可定位至已审核迁移版本、校验和和风险级别。`TRANSITIONAL`、`DESTRUCTIVE` 迁移缺少审批、兼容或恢复证据时，发布被阻断。
5. `BLUE_GREEN` 仅在目标槽位连续就绪、协议/数据库兼容冒烟通过后切换稳定 Service/Gateway 路由；脚本不会修改运行中容器端口，失败可在旧槽位健康时切回。
6. 旧槽位在摘流后不接收新 HTTP/WebSocket 连接；短请求完成、长连接 `DRAIN -> RESUME`、排空超时关闭数和客户端补拉均可追溯，任何未确认消息不因切流丢失。
7. 系统管理员能组合时间、级别、服务、deployment_no、节点、关键字、request_id、trace_id 和 error_code 筛选日志，并从 request_id/trace_id 查看跨服务时间线。
8. 日志在写入前脱敏；无 `operations:log:read` 权限的管理员被服务端拒绝，查询条件与目的进入审计。
9. 自然日变化或单片达到配置大小时立即滚动，文件名、索引和 JSON 行结构稳定；两个条件同时发生不产生丢失、覆盖或重复切片。
10. 次月首日可幂等归档上月切片并生成 manifest 与 SHA-256；失败或校验不一致时不删除源切片，恢复后可重试成功。
11. 在线与归档保留策略可按环境配置，法律保留、支付/审计证据和安全事件保全优先于普通清理计划。
12. 六类仪表盘均从版本化配置生成；Metrics 不含高基数或敏感 label，采集、规则求值或索引中断会被独立识别和告警，不能显示为业务成功。
13. HTTP、实时连接、队列、数据库和发布指标能计算并展示 R1 SLO；每条 `P1`、`P2`、`P3` 规则均具备触发/恢复条件、去重键、值班目标、仪表盘与 Runbook，告警恢复不会删除事故证据。
14. 受控演练至少覆盖 HTTP 错误率、队列积压、`DRAIN -> RESUME` 和观测中断；演练记录包含确认、止损、恢复、SLO 影响和复盘结论。未完成演练或 `P1`/`P2` 告警链路验证时不得开启 R1 生产灰度。
