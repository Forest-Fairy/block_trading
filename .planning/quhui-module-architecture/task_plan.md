# 趣汇模块架构规划

## 目标

仅更新架构规划文档：以 `block_trading` 为根，保留 `block_trading_docs`、`quhui_bom`、`quhui_server`、`quhui_client` 的目标模块边界；明确后端 DDD 四层与测试结构、客户端终端划分和系统入口。

## 阶段

- [x] 复核指定 Codex 会话和现有架构文档
- [x] 定义根模块、服务端与客户端边界
- [x] 对齐架构文档中的模块标识与导航摘要
- [x] 验证文档关系和当前构建事实
- [x] 执行用户授权的单次关机

## 决策

- 删除的是临时 `quhui` 物理代码目录，不是 `quhui_*` 目标模块名称。
- `quhui_client` 是根级独立 Node 工程，不加入 Maven Reactor。
- `quhui_server` 是后端 Maven 根，四层与测试模块均在其下。
