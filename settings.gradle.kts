pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
}

rootProject.name = "block_trading"

include(
    ":block_trading_docs",
    ":block_trading_bom",
    ":block_trading_server",
    ":block_trading_server:block_trading_domain",
    ":block_trading_server:block_trading_domain:block_trading_d_r1_api",
    ":block_trading_server:block_trading_domain:block_trading_d_r1_service",
    ":block_trading_server:block_trading_domain:block_trading_d_r1_test",
    ":block_trading_server:block_trading_application",
    ":block_trading_server:block_trading_application:block_trading_a_r1_api",
    ":block_trading_server:block_trading_application:block_trading_a_r1_service",
    ":block_trading_server:block_trading_application:block_trading_a_r1_test",
    ":block_trading_server:block_trading_infrastructure",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_common_api",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_repository_oracle",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_plugin_redis",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_plugin_rabbitmq",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_plugin_minio",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_plugin_opensearch",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_plugin_payment",
    ":block_trading_server:block_trading_infrastructure:block_trading_i_r1_test",
    ":block_trading_server:block_trading_user_interface",
    ":block_trading_server:block_trading_user_interface:block_trading_ui_base_api",
    ":block_trading_server:block_trading_user_interface:block_trading_ui_client_gateway_adapter",
    ":block_trading_server:block_trading_user_interface:block_trading_ui_admin_gateway_adapter",
    ":block_trading_server:block_trading_user_interface:block_trading_ui_provider_callback_adapter",
    ":block_trading_server:block_trading_user_interface:block_trading_ui_client_gateway_boot",
    ":block_trading_server:block_trading_user_interface:block_trading_ui_r1_test",
    ":block_trading_server:block_trading_system_test",
    ":block_trading_deployment",
    ":block_trading_deployment:block_trading_deploy_base",
    ":block_trading_deployment:block_trading_deploy_base_test",
)

project(":block_trading_docs").projectDir = file("block_trading_docs")
project(":block_trading_bom").projectDir = file("block_trading_bom")
project(":block_trading_server").projectDir = file("block_trading_server")
project(":block_trading_deployment").projectDir = file("block_trading_deployment")
