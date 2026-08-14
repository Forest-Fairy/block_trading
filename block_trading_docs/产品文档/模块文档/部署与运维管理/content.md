# 部署与运维管理

## 功能定位

本模块为 R1 上线提供可重复、可审计的脚本化部署和最小后台运维能力。部署资产归 `block_trading_deployment`，只消费各业务 `*_boot` 与前端发布产物；后台经版本化管理接口读取部署记录、脱敏日志和归档状态，不直接执行 Kubernetes 命令、不保存数据库密码，也不承载领域业务规则。

归属需求为 `FR-OPS-001` 与 `FR-OPS-002`，关联测试为 `R1_DEPLOY_001`、`R1_DB_DEPLOY_001`、`R1_LOG_001`、`R1_LOG_ARCHIVE_001`。

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
| `previous_deployment_no` | 生产必填 | 指定健康回退基线 | 必须是相同 environment 与 unit 的已验证部署 |
| `config_version`、`secret_refs` | 是 | 锁定配置与密钥引用版本 | 密钥值不进入清单、日志或部署记录 |

environment 是封闭枚举，完整允许值为 `DEV`（开发）、`TEST`（测试）、`STAGING`（预发布）、`PROD`（生产）；创建清单时确定，不允许原地迁移，跨环境发布必须创建新部署号。

数据库解析顺序固定为“deployment_no -> 不可变清单 -> datasource_ref -> service_name/schema_name -> migration_baseline/target -> 密钥系统”。命令行不得接收任意 JDBC URL 或明文凭据。environment、集群、命名空间、数据源、schema、制品摘要或迁移校验和任一不匹配时，必须在数据库变更前失败。

## 部署状态与自动化流程

部署状态完整允许值为：`PLANNED`（已登记）、`VALIDATING`（前置校验中）、`MIGRATING`（数据库迁移中）、`DEPLOYING`（发布中）、`VERIFYING`（健康与冒烟验证中）、`ACTIVE`（当前健康版本）、`FAILED`（失败待处置）、`ROLLING_BACK`（回滚中）、`ROLLED_BACK`（已回滚终态）、`ABORTED`（人工终止终态）。初始值为 `PLANNED`，终态为 `ROLLED_BACK`、`ABORTED`；`ACTIVE` 是成功稳定态，但允许因事故进入 `ROLLING_BACK`。

允许迁移为 `PLANNED -> VALIDATING -> MIGRATING -> DEPLOYING -> VERIFYING -> ACTIVE`；任一执行态可进入 `FAILED`；`FAILED -> VALIDATING` 表示同部署号幂等重试，或进入 `ROLLING_BACK`、`ABORTED`；`ACTIVE -> ROLLING_BACK -> ROLLED_BACK`。不得跳过校验、迁移或验证直接写为 `ACTIVE`。

1. `validate` 校验清单 Schema、审批、制品摘要、环境白名单、集群连通性、数据库目标、迁移校验和、备份/回退基线和可用容量。
2. `migrate` 只执行清单限定区间；同一 deployment_no 已成功的迁移步骤返回既有结果，禁止重复执行非幂等脚本。
3. `deploy` 应用镜像与 overlay，等待启动/就绪探针，通过最小冒烟测试后切换流量；任一步失败停止继续放量并记录退出码与失败原因。
4. `rollback` 仅回到 previous_deployment_no 的健康制品与配置。破坏性数据库迁移没有经验证的向后兼容方案时，部署前即阻断，不以运行中自动逆向 DDL 冒险回滚。
5. 每一步记录 deployment_no、命令、流水线/操作者、目标、开始结束时间、版本、结果、退出码和证据引用；同一部署号重跑只继续未完成步骤或返回已成功结果。

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

### 控制台接口

| 命令名 | 命令 | 参数及说明 | 对应代码文件和方法名 | 调用示例 |
|---|---|---|---|---|
| 部署前校验 | `scripts/validate.sh` | `--deployment-no` 必填；`--dry-run` 可选；Windows 包装器为 `scripts/validate.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/validate.sh --deployment-no DEP-20260814-0001 --dry-run` |
| 数据库迁移 | `scripts/migrate.sh` | `--deployment-no` 必填；数据库目标只从清单解析；Windows 包装器为 `scripts/migrate.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/migrate.sh --deployment-no DEP-20260814-0001` |
| 自动部署 | `scripts/deploy.sh` | `--deployment-no` 必填；串行执行校验、迁移、发布与验证；Windows 包装器为 `scripts/deploy.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/deploy.sh --deployment-no DEP-20260814-0001` |
| 回滚 | `scripts/rollback.sh` | `--deployment-no` 必填；回到清单的 previous_deployment_no；Windows 包装器为 `scripts/rollback.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/rollback.sh --deployment-no DEP-20260814-0001` |
| 月度日志归档 | `scripts/archive-logs.sh` | `--month`、`--service` 必填；`--dry-run` 可选；Windows 包装器为 `scripts/archive-logs.ps1` | `block_trading_deploy_base` 待实现 | `./scripts/archive-logs.sh --month 2026-07 --service community` |

### web 接口

| 接口名 | 接口路径 | 接口类型 | 参数及说明 | 对应的代码文件和方法名 | 参数示例 | 返回值示例 |
|---|---|---|---|---|---|---|
| 部署记录查询 | `/api/admin/v1/operations/deployments` | `GET` | `deploymentNo`、`environment`、`unit`、`status`、时间范围与分页；不返回密钥 | Admin Gateway -> Operations Application Port 待实现 | `?deploymentNo=DEP-20260814-0001` | `{"items":[{"deploymentNo":"DEP-20260814-0001","environment":"PROD","schemaName":"QH_COMMUNITY","status":"ACTIVE"}]}` |
| 日志筛选 | `/api/admin/v1/operations/logs` | `GET` | 开始/结束时间必填；可选 level、service、environment、deploymentNo、nodeOrPod、keyword、requestId、traceId、errorCode 与分页 | Admin Gateway -> Observability Adapter 待实现 | `?from=2026-08-14T10:00:00%2B08:00&to=2026-08-14T10:15:00%2B08:00&deploymentNo=DEP-20260814-0001&level=ERROR` | `{"items":[{"timestamp":"2026-08-14T10:03:12+08:00","level":"ERROR","service":"community","requestId":"req-01","message":"downstream timeout"}],"nextCursor":"c2"}` |
| 链路追踪 | `/api/admin/v1/operations/logs/traces/{traceId}` | `GET` | traceId 路径参数；可选 deploymentNo 与时间范围防止误关联 | Admin Gateway -> Observability Adapter 待实现 | `/api/admin/v1/operations/logs/traces/trace-01?deploymentNo=DEP-20260814-0001` | `{"traceId":"trace-01","spans":[{"service":"gateway","status":"OK"},{"service":"community","status":"ERROR"}],"partial":false}` |
| 归档记录查询 | `/api/admin/v1/operations/log-archives` | `GET` | month、service、status 与分页；返回 manifest 校验、大小、保留期限和失败原因 | Admin Gateway -> Operations Application Port 待实现 | `?month=2026-07&service=community` | `{"items":[{"month":"2026-07","service":"community","status":"SUCCEEDED","sha256":"...","retentionUntil":"2027-07-31"}]}` |

## 验收标准

1. 仅提供 deployment_no 即可加载受审批清单并解析环境、制品、集群、数据库 service/schema 与迁移区间；命令行无法传入任意 JDBC URL 或明文密钥。
2. 部署号与环境、集群、命名空间、数据源或 schema 不匹配时，在数据库和集群变更前失败并返回非零退出码。
3. 同一部署号重跑不重复执行已成功迁移或重复放量；失败步骤、退出码和证据可追溯，回滚只使用 previous_deployment_no 的健康版本。
4. 系统管理员能组合时间、级别、服务、deployment_no、节点、关键字、request_id、trace_id 和 error_code 筛选日志，并从 request_id/trace_id 查看跨服务时间线。
5. 日志在写入前脱敏；无 `operations:log:read` 权限的管理员被服务端拒绝，查询条件与目的进入审计。
6. 自然日变化或单片达到配置大小时立即滚动，文件名、索引和 JSON 行结构稳定；两个条件同时发生不产生丢失、覆盖或重复切片。
7. 次月首日可幂等归档上月切片并生成 manifest 与 SHA-256；失败或校验不一致时不删除源切片，恢复后可重试成功。
8. 在线与归档保留策略可按环境配置，法律保留、支付/审计证据和安全事件保全优先于普通清理计划。
