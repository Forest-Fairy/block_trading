# 调研发现

## 当前基线

- 根 POM 只有 `block_trading_docs` 聚合模块，但已使用 `${revision}` 属性。
- 当前没有 `quhui`、业务模块、Maven Wrapper 或源码目录。
- 模块规划规定 R1 的 Runtime 单元为 user API、admin API、worker 和 edge gateway；部署资产属于独立的 `quhui_deployment`。

## 骨架范围

- 新模块只输出 Java 17 可执行 JAR，并通过控制台显示单元身份和骨架状态。
- Spring Boot 4 的具体版本尚未在 POM/BOM 锁定，因此本次不引入其依赖或伪造 Web/健康检查能力。
