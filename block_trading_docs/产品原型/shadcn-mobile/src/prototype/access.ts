export type ReleaseIteration = "R1" | "R2" | "R3" | "R4"

export type AccessRole =
  "guest" | "vip" | "region_admin" | "operation_admin" | "system_admin"

export type PrototypeSession = {
  role: AccessRole
  userId: string | null
  membershipTier: "VIP_1" | null
  regionScope: string[]
  backendAccess: boolean
}

export type ManagementSettingsEntry = {
  title: "区域管理" | "运营管理" | "系统管理"
  description: string
  target: "region" | "admin"
}

type AccessRoleDefinition = {
  label: string
  shortLabel: string
  description: string
  entry: string
}

export const releaseIterations: Record<
  ReleaseIteration,
  { label: string; description: string }
> = {
  R1: {
    label: "R1 基础能力",
    description: "游客预览、VIP、RBAC、校园资格与商城基础交易",
  },
  R2: { label: "R2 交易收口", description: "订单、退款与运营处置范围" },
  R3: { label: "R3 区域治理", description: "多区域灰度、授权到期与回滚" },
  R4: { label: "R4 风险治理", description: "高风险审批、人工复核与审计" },
}

export const accessRoleDefinitions: Record<AccessRole, AccessRoleDefinition> = {
  guest: {
    label: "游客",
    shortLabel: "游客",
    description: "仅浏览明确公开的信息，不创建 qh_user。",
    entry: "公开浏览",
  },
  vip: {
    label: "VIP 用户",
    shortLabel: "VIP",
    description: "所有已登录用户默认从 VIP_1 开始，权益不替代角色权限。",
    entry: "客户端",
  },
  region_admin: {
    label: "区域管理员",
    shortLabel: "区域",
    description: "可从客户端设置或独立 PC 管理端进入，仅管理被授权区域。",
    entry: "移动设置 + PC 管理",
  },
  operation_admin: {
    label: "运营管理员",
    shortLabel: "运营",
    description: "可从客户端设置或独立 PC 后台处理业务队列，不拥有系统级配置。",
    entry: "移动设置 + PC 后台",
  },
  system_admin: {
    label: "系统管理员",
    shortLabel: "系统",
    description: "可从客户端设置或独立 PC 后台管理高风险规则、审计与角色授权。",
    entry: "移动设置 + PC 后台",
  },
}

export function getPrototypeSession(role: AccessRole): PrototypeSession {
  if (role === "guest") {
    return {
      role,
      userId: null,
      membershipTier: null,
      regionScope: [],
      backendAccess: false,
    }
  }

  return {
    role,
    userId: "qh_user_demo_001",
    membershipTier: "VIP_1",
    regionScope: role === "region_admin" ? ["杭州西湖区", "杭州拱墅区"] : [],
    backendAccess: role === "operation_admin" || role === "system_admin",
  }
}

export function canAccessRegionManagement(role: AccessRole) {
  return role === "region_admin"
}

export function canAccessAdminConsole(role: AccessRole) {
  return role === "operation_admin" || role === "system_admin"
}

export function getManagementSettingsEntry(
  role: AccessRole
): ManagementSettingsEntry | null {
  if (role === "region_admin") {
    return {
      title: "区域管理",
      description: "仅管理已授权区域，访问时重新校验范围",
      target: "region",
    }
  }
  if (role === "operation_admin") {
    return {
      title: "运营管理",
      description: "进入后台处理业务队列与运营处置",
      target: "admin",
    }
  }
  if (role === "system_admin") {
    return {
      title: "系统管理",
      description: "进入后台管理角色授权、审计与高风险规则",
      target: "admin",
    }
  }
  return null
}
