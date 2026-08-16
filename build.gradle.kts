import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension
import org.jetbrains.kotlin.gradle.tasks.KotlinCompilationTask

plugins {
    base
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.spring) apply false
    alias(libs.plugins.spring.boot) apply false
}

group = "io.spray.qh"
version = "1.0.0-r1-SNAPSHOT"

val junitJupiterDependency = libs.junit.jupiter
val assertjDependency = libs.assertj.core
val junitLauncherDependency = libs.junit.platform.launcher

val aggregationProjects = setOf(
    ":block_trading_docs",
    ":block_trading_bom",
    ":block_trading_server",
    ":block_trading_server:block_trading_domain",
    ":block_trading_server:block_trading_application",
    ":block_trading_server:block_trading_infrastructure",
    ":block_trading_server:block_trading_user_interface",
    ":block_trading_deployment",
    ":block_trading_deployment:block_trading_deploy_base",
    ":block_trading_deployment:block_trading_deploy_base_test",
)

subprojects {
    group = rootProject.group
    version = rootProject.version

    if (path !in aggregationProjects) {
        apply(plugin = "org.jetbrains.kotlin.jvm")
    }

    plugins.withId("org.jetbrains.kotlin.jvm") {
        extensions.configure<KotlinJvmProjectExtension> {
            jvmToolchain(21)
        }
        dependencies {
            add("implementation", platform(project(":block_trading_bom")))
            add("testImplementation", junitJupiterDependency)
            add("testImplementation", assertjDependency)
            add("testRuntimeOnly", junitLauncherDependency)
        }
        tasks.withType<KotlinCompilationTask<*>>().configureEach {
            compilerOptions {
                freeCompilerArgs.add("-Xjsr305=strict")
            }
        }
        tasks.withType<Test>().configureEach {
            useJUnitPlatform()
            testLogging {
                events("failed", "skipped")
            }
        }
    }
}

tasks.named("check") {
    dependsOn(subprojects.map { it.tasks.named("check") })
}
