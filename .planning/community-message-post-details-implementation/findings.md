# 实施发现

- `PageKey` 增加 `post-detail`，详情返回页由 `App.tsx` 记录，避免从搜索、社区或消息进入后丢失来源。
- `MessagesPage.tsx` 内部使用 `inbox/system/business/chat` 四种视图，不引入额外路由框架。
- `CommunityCard` 内容区使用语义化按钮进入详情，底部主操作继续承载参与/进度。
