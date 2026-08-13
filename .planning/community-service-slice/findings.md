# 调研发现

## 选择的演示链路

- 社区领域拥有帖子状态与人数等事实；新帖子先进入待审核，审核批准才可进入招募。
- 审核领域在完整业务中拥有案件和结论；本演示只将“批准”作为应用层受控命令，不伪造审核领域实现。
- 仓储端口应定义在 Domain，内存实现位于 Infrastructure，Runtime 负责将实现注入应用服务。

## 模块范围

- 生产：community 的 Domain、Application、UI Adapter、内存 Repository、用户 API Runtime。
- 验证：Domain、Application、UI、Infrastructure 四个层测试父模块及跨层 System 测试。
