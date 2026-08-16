# 智能检索与推荐

## 文档状态与范围

文档状态：`详细规划完成`。本模块定义 R3 的智能检索能力，不代表已上线或已部署。R1 仍只提供 OpenSearch 关键词/结构化检索与规则排序；R3 功能开关初始值为关闭，未通过离线评估、容量验证和治理审批前不得对用户启用。

本模块只处理公开或已获当前请求主体读取授权的社区内容、公开商品及其可检索摘要。不处理私聊、学生证明、举报证据、审计原文、精确地址、电话、身份材料、未审核内容或任何受法律保留限制但未获查询授权的资产。

## 目标与非目标

目标是让用户以自然语言发现同义或表达方式不同的公开内容，同时保留精确关键词、筛选条件与可解释的退回路径。向量候选只用于检索排序，不输出自动审核、风控、封禁、授信、价格、权益或个性化决策。

非目标包括：建立第二套事实库、用向量索引替代 Oracle 事实或服务端鉴权、RAG 问答、跨用户画像、自动化内容处置及未经审批的模型调用。

## 架构决策

### 向量数据库

R3 使用现有受控 OpenSearch 集群的 `knn_vector` 字段和混合检索能力，不新建 Qdrant、Milvus 或其他独立向量数据库。每个向量字段维度必须与已批准模型的输出维度一致；索引启用 k-NN 后，以关键词与向量双路候选做融合。该决策复用当前索引、部署、观测、备份、访问控制和故障治理面，避免出现第二套数据同步与权限边界。

当前宿主机上存在的停止状态 `qdrant` 容器不属于 `qh-r1` Docker Compose、不是本项目依赖，也不复用其数据或配置。后续若有独立向量数据库需求，必须先通过容量、数据隔离、备份恢复、权限、迁移和成本评审，并更新本模块和 `PROJECT.md`。

### 向量模型与调用边界

应用层只依赖版本化 `EmbeddingProvider` 端口，基础设施 `block_trading_i_plugin_embedding` 负责 HTTP/SDK 适配、批量、超时、熔断和指标；业务代码不得绑定特定模型厂商或把模型密钥写入索引、日志或客户端。

首个评估候选是 `BAAI/bge-m3`，原因是其模型卡声明多语言、1024 维输出和长文本支持；该名称只是候选，不是生产默认。每次启用必须由模型治理域登记 `model_id`、版本/摘要、输出维度、最大切分长度、部署位置、输入字段白名单、评估集、审批记录和停用开关。生产可换成任何通过同一验收的模型，索引必须按新的 embedding profile 重建后再切换别名。

### 索引与一致性

每份搜索文档由 Oracle 事实的可检索投影生成，写入路径为“领域事实提交 -> Outbox -> 索引消费者 -> OpenSearch”。投影包含稳定 `content_id`、`content_type`、标题/公开摘要、区域/校区、可见性快照、状态、更新时间、关键词字段、`embedding_profile` 和向量；不复制禁止索引的原文或敏感字段。

索引命名为 `qh-search-content-v<profile>-<build_no>`，读路径只访问 `qh-search-content-current` 别名。切换时建立新索引、完成校验和抽样评估、原子切换别名，再保留旧索引至回滚窗口结束。索引状态为封闭枚举：`BUILDING`（正在全量或增量构建）、`READY`（可接收对应 profile 查询）、`FAILED`（构建/校验失败，禁止切换）、`RETIRED`（已退出读路径，等待受控清理）；初始状态为 `BUILDING`，终态为 `FAILED` 或 `RETIRED`，允许迁移为 `BUILDING -> READY`、`BUILDING -> FAILED`、`READY -> RETIRED`。

嵌入任务状态为封闭枚举：`PENDING`（等待执行）、`RUNNING`（正在生成）、`SUCCEEDED`（已写入并校验）、`FAILED`（可重试失败）、`SKIPPED`（不满足索引白名单）；初始状态为 `PENDING`，终态为 `SUCCEEDED` 或 `SKIPPED`，允许迁移为 `PENDING -> RUNNING/SKIPPED`、`RUNNING -> SUCCEEDED/FAILED`、`FAILED -> PENDING`。重试使用幂等键 `content_id + content_version + embedding_profile`，删除、下架、权限收紧或审核拒绝必须优先删除/失效对应文档。

## 检索流程与权限

请求模式为封闭枚举：`LEXICAL`（关键词与结构化筛选）、`SEMANTIC`（仅向量候选，仍受筛选与复核）、`HYBRID`（关键词和向量候选融合）。R3 首次灰度只允许 `LEXICAL` 与 `HYBRID`；`SEMANTIC` 仅供受控评估，不向普通用户开放。默认模式为 `LEXICAL`，任何未知模式返回参数错误而不做隐式降级。

1. UserInterface 接收版本化搜索请求，Application 先计算主体、区域、校区、可见性、拉黑和内容状态约束。
2. `LEXICAL` 走 OpenSearch 关键词/过滤查询；`HYBRID` 在同一约束下并行执行关键词和 k-NN 候选查询，再由固定版本的 RRF 或经审批的加权融合器合并。
3. Application 以 Oracle/可见性服务对每个候选再次复核，移除权限已变化、已下架或已被拉黑的对象。
4. 仅返回标题、公开摘要、价格/人数等既有可见字段，以及低风险解释标签，例如“匹配搜索词”或“语义相近”；不得返回向量、原始模型分数、用户画像或敏感推断。

向量、关键词、索引或融合器任一环节不可用、超时、状态非 `READY` 或命中率低于门槛时，`HYBRID` 必须退回相同过滤条件下的 `LEXICAL` 结果，并记录低基数降级原因。权限复核异常时失败关闭，不返回候选。错误码为封闭枚举：`SEARCH_MODE_INVALID`（模式不支持）、`SEARCH_INDEX_UNAVAILABLE`（基础索引不可用）、`EMBEDDING_UNAVAILABLE`（向量生成不可用）、`SEARCH_AUTHORIZATION_FAILED`（权限复核失败）和 `SEARCH_QUERY_INVALID`（输入不合法）。

## 数据安全、治理与可观测性

- Embedding 输入只来自已登记字段，入队前做长度截断、HTML/富文本归一化和敏感数据剔除；不得以日志记录原始查询、文本、向量或授权上下文。
- 查询和索引事件携带 `request_id`、`deployment_no`、`embedding_profile`、索引别名版本及脱敏内容类型；模型治理记录批准、暂停、回滚和评估证据。
- Metrics 只允许 `service`、`environment`、`deployment_no`、`operation`、`mode`、`result`、`fallback_reason`、`embedding_profile` 和已登记低基数错误码；不得使用 user_id、搜索词、内容 ID、request_id、trace_id 或模型原始输出作 label。
- 必采指标为请求量、`p50/p95/p99` 时延、关键词/向量/融合失败、降级率、索引积压、任务成功率、模型调用错误、k-NN 内存/断路器和别名版本。超过容量或质量阈值时只暂停 `HYBRID` 开关，不影响 `LEXICAL`。

## 分期与验收

R3 按以下顺序实施：先建立评估集、相关性人工标注和敏感数据排除清单；再实现 `EmbeddingProvider`、Outbox 索引任务和灰度开关；随后构建独立向量索引、完成回填/回滚演练；最后进行小范围 `HYBRID` 灰度。所有跨边界 HTTP、事件和管理接口必须在 R3 业务模块文档的 `## 功能接口` 先登记后实现，产品模块只在接口生效后回写。

验收至少包括：

1. 关键词、向量和混合请求均先后通过相同的区域、校区、可见性和拉黑测试，权限收紧后不再返回旧索引候选。
2. 更换模型或维度只能创建新 profile 索引；未完成回填、抽样校验和别名切换时不能读取新索引。
3. 模型、向量索引或融合失败时，`HYBRID` 自动退回 `LEXICAL`；权限复核失败时不返回数据。
4. 中文同义检索在冻结评估集上相对 `LEXICAL` 达到预先批准的 NDCG/Recall 门槛，且精确品牌、价格、区域和分类查询不因融合回退。
5. 索引、模型、输入字段、开关、别名切换、审批和回滚均有审计记录；指标和日志不包含原始查询、向量或高基数敏感标签。

## 选型依据

- [OpenSearch k-NN 向量字段](https://docs.opensearch.org/latest/mappings/supported-field-types/knn-vector/)：向量字段需声明与模型输出匹配的维度，可用于 k-NN 查询。
- [OpenSearch 混合检索](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/)：关键词与语义检索可在搜索管道中归一化、融合和重排。
- [BAAI/bge-m3 模型卡](https://huggingface.co/BAAI/bge-m3)：候选模型的多语言、维度和上下文长度声明，实际使用仍需项目评估与治理批准。
