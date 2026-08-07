# 原型主文件模块化改造

## 目标
依据新的原型规则，将多页面、多流程和共享组件从 `App.tsx` 拆分到独立模块，使主文件只负责页面状态、跨页状态和原型外壳组合，同时保持现有视觉与交互行为。

## 阶段
- [complete] 1. 读取新规则并盘点主文件职责
- [complete] 2. 定义页面、共享组件、数据和状态边界
- [complete] 3. 执行机械拆分并修复模块依赖
- [complete] 4. 同步交互说明与导航摘要
- [complete] 5. lint、typecheck、build 与浏览器截图复核

## 决策
- 沿用现有 `PageKey` 内部状态导航，不为本次规则单独引入路由框架。
- 推荐、搜索、社区、商城、消息、我的分别成为页面模块。
- 通用页面外壳、卡片和静态数据进入共享模块，`App.tsx` 仅保留跨页编排。
- 保持当前所有用户改动、文案、筛选、学生认证与校园版行为。

## 错误记录
| 错误 | 尝试 | 处理 |
|---|---:|---|
| `react-refresh/only-export-components`：共享文件混合数据与组件 | 1 | 继续拆为 `prototype/data.ts` 与 `components/prototype-shell.tsx` |
| `verbatimModuleSyntax` 要求类型导入使用 `type` | 1 | 生成导入时识别 `ActivityType`、`RecommendationItem`、`MiniProgram` 为类型导入 |
| 第二阶段拆分脚本从原型子目录执行，找不到仓库根目录下脚本 | 1 | 回到仓库根目录执行脚本，再在原型目录运行格式化和验证 |
| 导入修复脚本同样从原型子目录调用，未被执行 | 1 | 从仓库根目录执行修复脚本，并单独确认页面文件头部导入 |
| PowerShell 未展开 `rg` 的 `src/pages/*.tsx` 参数 | 1 | 改用 `rg ... src/App.tsx src/pages` 进行结构检查 |
