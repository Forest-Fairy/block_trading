import java.nio.charset.CodingErrorAction
import java.nio.charset.StandardCharsets
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.tasks.InputDirectory
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction

plugins {
    base
}

abstract class ValidateDocsTask : DefaultTask() {
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val docsFiles: ConfigurableFileCollection

    @get:InputDirectory
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val docsRoot: DirectoryProperty

    @TaskAction
    fun validate() {
        val decoder = StandardCharsets.UTF_8.newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
        docsFiles.files.forEach { file -> decoder.reset().decode(java.nio.ByteBuffer.wrap(file.readBytes())) }

        val root = docsRoot.get().asFile
        val moduleRoot = root.resolve("业务开发文档/业务模块文档")
        val requiredContracts = listOf(
            "推荐与内容分发.md",
            "社区协作.md",
            "商城交易.md",
            "消息中心.md",
            "个人中心.md",
            "身份可见性与治理.md",
        )
        requiredContracts.forEach { name ->
            val content = moduleRoot.resolve(name).readText(StandardCharsets.UTF_8)
            check("## 功能接口" in content && "### web 接口" in content) { "R1 接口门禁缺失: $name" }
        }
        check(root.resolve("业务开发文档/接口Schema/r1-openapi.yaml").isFile) { "R1 OpenAPI 缺失" }
        check(root.resolve("业务开发文档/接口Schema/r1-events.schema.json").isFile) { "R1 事件 Schema 缺失" }
        check("V002__r1_reliability.sql" in root.resolve("数据库设计/趣汇核心实体设计.md").readText(StandardCharsets.UTF_8)) {
            "R1 Oracle 迁移门禁缺失"
        }
    }
}

val validateDocs by tasks.registering(ValidateDocsTask::class) {
    group = "verification"
    description = "校验项目文档 UTF-8 编码、R1 接口契约和迁移门禁"
    docsFiles.from(fileTree(projectDir) {
        include("**/*.md", "**/*.csv", "**/*.json", "**/*.yaml", "**/*.yml", "**/*.sql")
        exclude("产品原型/**/node_modules/**", "产品原型/**/dist/**")
    })
    docsRoot.set(layout.projectDirectory)
}

tasks.named("check") {
    dependsOn(validateDocs)
}
