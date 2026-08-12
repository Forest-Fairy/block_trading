import type { ActivityType } from "./data"

export type PostDraftInputType = "text" | "number" | "datetime-local"

export type PostDraftField = {
  key: string
  label: string
  placeholder: string
  inputType: PostDraftInputType
  required: boolean
  advanced?: boolean
  defaulted?: boolean
}

const commonFields: PostDraftField[] = [
  {
    key: "title",
    label: "主题",
    placeholder: "一句话说清楚你想发起什么",
    inputType: "text",
    required: true,
  },
  {
    key: "primaryOccursAt",
    label: "时间",
    placeholder: "选择开始、出发或需求时间",
    inputType: "datetime-local",
    required: true,
  },
  {
    key: "signupDeadlineAt",
    label: "报名/响应截止",
    placeholder: "默认按活动时间预填",
    inputType: "datetime-local",
    required: true,
    advanced: true,
    defaulted: true,
  },
  {
    key: "preciseLocation",
    label: "精确地点",
    placeholder: "可选，例如：星耀城北门",
    inputType: "text",
    required: false,
    advanced: true,
  },
]

const schemas: Record<ActivityType, PostDraftField[]> = {
  拼单: [
    ...commonFields,
    { key: "productName", label: "商品/服务", placeholder: "例如：山姆零食组合包", inputType: "text", required: true },
    { key: "estimatedUnitAmountCent", label: "预估人均（元）", placeholder: "例如：86", inputType: "number", required: true },
    { key: "targetQuantity", label: "目标数量", placeholder: "例如：5", inputType: "number", required: true },
    { key: "fulfillmentMode", label: "交付方式", placeholder: "配送 / 自提 / 现场核销", inputType: "text", required: true },
    { key: "specification", label: "规格（可选）", placeholder: "例如：12 件装", inputType: "text", required: false, advanced: true },
    { key: "content", label: "补充说明（可选）", placeholder: "退款、替代方案或参与须知", inputType: "text", required: false, advanced: true },
  ],
  拼车: [
    ...commonFields,
    { key: "originName", label: "出发地", placeholder: "例如：萧山机场", inputType: "text", required: true },
    { key: "destinationName", label: "目的地", placeholder: "例如：西兴街道", inputType: "text", required: true },
    { key: "minParticipants", label: "最少同行人数", placeholder: "例如：2", inputType: "number", required: true },
    { key: "maxParticipants", label: "最多座位", placeholder: "例如：4", inputType: "number", required: true },
    { key: "fareMode", label: "费用方式", placeholder: "免费 / AA / 固定金额", inputType: "text", required: true },
    { key: "fareAmountCent", label: "每人费用（元，可选）", placeholder: "固定金额时填写", inputType: "number", required: false, advanced: true },
    { key: "luggageRule", label: "行李限制（可选）", placeholder: "例如：可放 24 寸行李箱", inputType: "text", required: false, advanced: true },
  ],
  线下组队: [
    ...commonFields,
    { key: "activityCategory", label: "活动类型", placeholder: "例如：露营、徒步、羽毛球", inputType: "text", required: true },
    { key: "destinationName", label: "目的地/场地", placeholder: "例如：安吉竹海营地", inputType: "text", required: true },
    { key: "minParticipants", label: "最少人数", placeholder: "例如：2", inputType: "number", required: true },
    { key: "maxParticipants", label: "最多人数", placeholder: "例如：8", inputType: "number", required: true },
    { key: "estimatedAmountCent", label: "预估人均（元，可选）", placeholder: "例如：188", inputType: "number", required: false, advanced: true },
    { key: "participantRequirement", label: "参与要求（可选）", placeholder: "例如：自备徒步鞋，接受拼房", inputType: "text", required: false, advanced: true },
  ],
  线上开黑: [
    ...commonFields,
    { key: "gameCategory", label: "游戏类目", placeholder: "例如：MOBA、FPS、桌游", inputType: "text", required: true },
    { key: "gameName", label: "游戏名称", placeholder: "例如：王者荣耀", inputType: "text", required: true },
    { key: "platform", label: "平台/区服", placeholder: "例如：微信区 · 语音房", inputType: "text", required: true },
    { key: "durationMinutes", label: "预计时长（分钟）", placeholder: "例如：120", inputType: "number", required: true },
    { key: "minParticipants", label: "最少人数", placeholder: "例如：3", inputType: "number", required: true },
    { key: "maxParticipants", label: "最多人数", placeholder: "例如：5", inputType: "number", required: true },
    { key: "skillRequirement", label: "段位/语音要求（可选）", placeholder: "例如：黄金以上，可听麦", inputType: "text", required: false, advanced: true },
  ],
  近邻互助: [
    ...commonFields,
    { key: "helpCategory", label: "求助类型", placeholder: "例如：借用、代取、临时协助", inputType: "text", required: true },
    { key: "content", label: "需要什么帮助", placeholder: "尽量说清物品、动作和归还方式", inputType: "text", required: true },
    { key: "timeliness", label: "需求时效", placeholder: "即时 / 时段", inputType: "text", required: true },
    { key: "neededWindow", label: "需求时间段", placeholder: "例如：明日 14:00-16:00", inputType: "text", required: true },
    { key: "latestResponseAt", label: "最晚响应时间", placeholder: "例如：明日 10:00 前", inputType: "text", required: true },
    { key: "rewardAmountCent", label: "报酬（元，可选）", placeholder: "无报酬可留空", inputType: "number", required: false, advanced: true },
    { key: "urgent", label: "是否加急", placeholder: "是 / 否", inputType: "text", required: false, advanced: true },
  ],
}

export function getPostDraftFields(type: ActivityType) {
  return schemas[type]
}

export function getPostDraftFieldLabel(type: ActivityType, key: string) {
  return schemas[type].find((field) => field.key === key)?.label ?? key
}

export function getPostDraftRequiredFields(type: ActivityType) {
  return schemas[type].filter((field) => field.required)
}
