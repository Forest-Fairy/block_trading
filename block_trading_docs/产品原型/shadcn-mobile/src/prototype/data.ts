import {
  Gamepad2,
  Home,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react"

export type PageKey =
  | "recommend"
  | "search"
  | "community"
  | "mall"
  | "messages"
  | "post-detail"
  | "product-detail"
  | "commerce-flow"
  | "profile"
  | "membership-detail"
  | "preference-detail"
  | "assistant-chat"
  | "region-management"
  | "admin-console"
export type ActivityType =
  "拼单" | "拼车" | "线下组队" | "线上开黑" | "近邻互助"
export type ViewerMode = "member" | "guest"

export type PreferenceKey =
  | "账号与安全"
  | "隐私设置"
  | "消息通知"
  | "通用设置"
  | "帮助与客服"
  | "关于趣汇"

export type MembershipTier = 1 | 2 | 3 | 4 | 5 | 6

export const membershipTiers: Record<
  MembershipTier,
  {
    minEc: number
    dailyCheckInPoints: number
    normalQuota: number
    emergencyQuota: number
  }
> = {
  1: { minEc: 0, dailyCheckInPoints: 3, normalQuota: 8, emergencyQuota: 3 },
  2: { minEc: 6, dailyCheckInPoints: 2, normalQuota: 12, emergencyQuota: 5 },
  3: { minEc: 36, dailyCheckInPoints: 1, normalQuota: 16, emergencyQuota: 10 },
  4: { minEc: 82, dailyCheckInPoints: 1, normalQuota: 24, emergencyQuota: 16 },
  5: { minEc: 132, dailyCheckInPoints: 1, normalQuota: 32, emergencyQuota: 28 },
  6: { minEc: 216, dailyCheckInPoints: 1, normalQuota: 64, emergencyQuota: 58 },
}

export function getMembershipTier(ec: number): MembershipTier {
  const tiers = Object.keys(membershipTiers)
    .map(Number)
    .sort((left, right) => right - left) as MembershipTier[]
  return tiers.find((tier) => ec >= membershipTiers[tier].minEc) ?? 1
}

export type Activity = {
  id: string
  type: ActivityType
  title: string
  detail: string
  currentParticipants: number
  minParticipants: number
  maxParticipants: number
  progress: number
  distance: string
  image: string
  tone: "green" | "blue" | "coral"
  authorId: string
  campusId: string
  authorFollowed: boolean
  description?: string
  reward?: string
  helpTiming?: "即时" | "时段"
  neededAt?: string
  neededWindow?: string
  latestResponseAt?: string
  urgent?: boolean
  isPublic?: boolean
  commentCount?: number
  replyCount?: number
  details?: ActivityDetails
}

export type ActivityDetails = {
  productName?: string
  specification?: string
  estimatedUnitAmountCent?: number
  targetQuantity?: number
  quantityUnit?: string
  fulfillmentMode?: string
  tripRole?: "车主" | "乘客"
  originName?: string
  destinationName?: string
  pickupLocation?: string
  fareMode?: "免费" | "AA" | "固定金额"
  fareAmountCent?: number
  luggageRule?: string
  activityCategory?: string
  estimatedAmountCent?: number
  participantRequirement?: string
  gameCategory?: string
  gameName?: string
  platform?: string
  durationMinutes?: number
  skillRequirement?: string
  voiceRequirement?: string
  helpCategory?: string
}

export const imageUrls = {
  hike: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=85",
  game: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=85",
  car: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85",
  mug: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=85",
  bottle:
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=85",
  backpack:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85",
}

export const activities: Activity[] = [
  {
    id: "snacks",
    type: "拼单",
    title: "周末山姆零食拼单",
    detail: "周六 18:00 截止 · 配送到滨江区",
    currentParticipants: 3,
    minParticipants: 5,
    maxParticipants: 5,
    progress: 60,
    distance: "1.2 km",
    image: imageUrls.mug,
    tone: "green",
    authorId: "lin-zhi-xia",
    campusId: "hangzhou-university",
    authorFollowed: false,
    details: {
      productName: "山姆零食组合包",
      specification: "12 件装",
      estimatedUnitAmountCent: 8600,
      targetQuantity: 5,
      quantityUnit: "人份",
      fulfillmentMode: "周六 18:00 后自提",
    },
  },
  {
    id: "airport",
    type: "拼车",
    title: "萧山机场 → 西兴街道拼车",
    detail: "周五 19:30 出发 · 还有 2 个座位",
    currentParticipants: 2,
    minParticipants: 2,
    maxParticipants: 4,
    progress: 50,
    distance: "4.8 km",
    image: imageUrls.car,
    tone: "blue",
    authorId: "zhou-tong-xue",
    campusId: "zhejiang-university",
    authorFollowed: true,
    details: {
      tripRole: "乘客",
      originName: "萧山机场",
      destinationName: "西兴街道",
      pickupLocation: "T3 到达层 6 号门",
      fareMode: "AA",
      fareAmountCent: 4500,
      luggageRule: "可放 24 寸行李箱",
    },
  },
  {
    id: "game",
    type: "线上开黑",
    title: "周日晚间开黑小队",
    detail: "今晚 20:00 · 线上组队",
    currentParticipants: 4,
    minParticipants: 3,
    maxParticipants: 5,
    progress: 80,
    distance: "线上",
    image: imageUrls.game,
    tone: "coral",
    authorId: "alex",
    campusId: "hangzhou-university",
    authorFollowed: false,
    details: {
      gameCategory: "MOBA",
      gameName: "王者荣耀",
      platform: "微信区 · 语音房",
      durationMinutes: 120,
      skillRequirement: "黄金以上，可听麦",
    },
  },
  {
    id: "travel",
    type: "线下组队",
    title: "周末安吉露营组队",
    detail: "周六 07:30 集合 · 人均约 ¥188",
    currentParticipants: 5,
    minParticipants: 8,
    maxParticipants: 8,
    progress: 62,
    distance: "18 km",
    image: imageUrls.hike,
    tone: "green",
    authorId: "chen-yu",
    campusId: "hangzhou-normal-university",
    authorFollowed: false,
    details: {
      activityCategory: "露营 + 轻徒步",
      destinationName: "安吉 · 竹海营地",
      estimatedAmountCent: 18800,
      participantRequirement: "自备徒步鞋，接受拼房",
    },
  },
  {
    id: "groceries",
    type: "拼单",
    title: "邻里有机蔬菜拼单",
    detail: "今天 16:00 截止 · 小区门口自提",
    currentParticipants: 6,
    minParticipants: 8,
    maxParticipants: 8,
    progress: 75,
    distance: "0.8 km",
    image: imageUrls.bottle,
    tone: "green",
    authorId: "xiao-zhou",
    campusId: "hangzhou-university",
    authorFollowed: false,
    details: {
      productName: "邻里有机蔬菜箱",
      specification: "时令组合",
      estimatedUnitAmountCent: 3200,
      targetQuantity: 8,
      quantityUnit: "份",
      fulfillmentMode: "小区门口自提",
    },
  },
  {
    id: "badminton",
    type: "线下组队",
    title: "滨江羽毛球双打缺 2 人",
    detail: "今晚 19:30 · 星耀城运动馆",
    currentParticipants: 2,
    minParticipants: 4,
    maxParticipants: 4,
    progress: 50,
    distance: "2.1 km",
    image: imageUrls.game,
    tone: "coral",
    authorId: "momo",
    campusId: "hangzhou-university",
    authorFollowed: false,
    details: {
      activityCategory: "羽毛球双打",
      destinationName: "星耀城运动馆",
      estimatedAmountCent: 3500,
      participantRequirement: "自备球拍，初学友好",
    },
  },
  {
    id: "racket-help",
    type: "近邻互助",
    title: "明天下午借一副羽毛球拍上课",
    detail: "明日 14:00-16:00 · 最晚 10:00 前响应",
    currentParticipants: 1,
    minParticipants: 1,
    maxParticipants: 1,
    progress: 0,
    distance: "1.6 km",
    image:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=85",
    tone: "blue",
    authorId: "mo-yu",
    campusId: "hangzhou-university",
    authorFollowed: false,
    description:
      "明天下午有羽毛球课，临时没有球拍。希望借到一副基础球拍，课后当天归还，可支付清洁和借用报酬。",
    reward: "¥ 20",
    helpTiming: "时段",
    neededWindow: "明日 14:00-16:00",
    latestResponseAt: "明日 10:00 前",
    urgent: false,
    isPublic: true,
    commentCount: 3,
    replyCount: 4,
    details: {
      helpCategory: "借用",
    },
  },
]

function yuan(cents: number) {
  return `¥ ${cents / 100}`
}

export function getActivityDetailFields(
  activity: Activity
): Array<[string, string]> {
  const details = activity.details ?? {}
  switch (activity.type) {
    case "拼单":
      return [
        [
          "商品与规格",
          [details.productName, details.specification]
            .filter(Boolean)
            .join(" · "),
        ],
        [
          "预估人均",
          details.estimatedUnitAmountCent
            ? `${yuan(details.estimatedUnitAmountCent)} / 人`
            : "待协商",
        ],
        [
          "目标数量",
          details.targetQuantity
            ? `${details.targetQuantity} ${details.quantityUnit ?? "份"}`
            : "待确认",
        ],
        ["交付方式", details.fulfillmentMode ?? "待确认"],
      ]
    case "拼车":
      return [
        [
          "路线",
          [details.originName, details.destinationName]
            .filter(Boolean)
            .join(" → "),
        ],
        ["上车地点", details.pickupLocation ?? "报名后确认"],
        [
          "费用方式",
          details.fareAmountCent
            ? `${yuan(details.fareAmountCent)} / 人 · ${details.fareMode ?? "固定金额"}`
            : (details.fareMode ?? "待协商"),
        ],
        ["行李限制", details.luggageRule ?? "未说明"],
      ]
    case "线下组队":
      return [
        ["活动类型", details.activityCategory ?? "线下活动"],
        ["目的地", details.destinationName ?? "待确认"],
        [
          "预估人均",
          details.estimatedAmountCent
            ? `${yuan(details.estimatedAmountCent)} / 人`
            : "待协商",
        ],
        ["参与要求", details.participantRequirement ?? "未说明"],
      ]
    case "线上开黑":
      return [
        [
          "游戏类目",
          [details.gameCategory, details.gameName].filter(Boolean).join(" · "),
        ],
        ["平台", details.platform ?? "待确认"],
        [
          "活动时长",
          details.durationMinutes
            ? `预计 ${details.durationMinutes} 分钟`
            : "待确认",
        ],
        [
          "段位/语音",
          details.skillRequirement ?? details.voiceRequirement ?? "不限",
        ],
      ]
    case "近邻互助":
      return [
        ["求助类型", details.helpCategory ?? "临时协助"],
        ["报酬", activity.reward ?? "无报酬/协商"],
        ["需求时效性", activity.helpTiming ?? "即时"],
        ["需求时间", activity.neededWindow ?? activity.neededAt ?? "尽快"],
        ["最晚响应", activity.latestResponseAt ?? "待确认"],
        ["是否加急", activity.urgent ? "加急" : "普通求助"],
      ]
  }
}

export const verifiedActivityIds = new Set([
  "snacks",
  "airport",
  "travel",
  "groceries",
])

export const CURRENT_USER_ID = "lin-zhi-xia"
export const CURRENT_CAMPUS_ID = "hangzhou-university"

export function isActivityVisible(
  activity: Activity,
  campusMode: boolean,
  viewerMode: ViewerMode = "member"
) {
  if (viewerMode === "guest") {
    const distance = Number.parseFloat(activity.distance)
    return (
      activity.type === "近邻互助" &&
      activity.isPublic === true &&
      !Number.isNaN(distance) &&
      distance <= 5
    )
  }
  if (!campusMode) return true
  return (
    activity.authorId === CURRENT_USER_ID ||
    activity.authorFollowed ||
    activity.campusId === CURRENT_CAMPUS_ID
  )
}

export function participantSummary(activity: Activity) {
  if (activity.type === "近邻互助") {
    return activity.currentParticipants
      ? `${activity.currentParticipants} 人响应`
      : "等待响应"
  }
  const limit =
    activity.minParticipants === activity.maxParticipants
      ? `${activity.maxParticipants}`
      : `${activity.minParticipants}-${activity.maxParticipants}`
  return `${activity.currentParticipants} / ${limit} 人`
}

export const orderUpdates = [
  {
    id: "formed",
    title: "周末山姆零食拼单已成团",
    meta: "待查看",
    tone: "blue",
  },
  {
    id: "shipping",
    title: "城市通勤水壶已发货",
    meta: "预计明日到",
    tone: "green",
  },
  {
    id: "reminder",
    title: "今晚 20:00 线上开黑小队即将开始",
    meta: "还有 3 小时",
    tone: "yellow",
  },
  {
    id: "car-confirmed",
    title: "萧山机场拼车已确认",
    meta: "周五出发",
    tone: "blue",
  },
  {
    id: "backpack-delivered",
    title: "轻行双肩包已签收",
    meta: "待评价",
    tone: "green",
  },
  {
    id: "mug-payment",
    title: "趣汇露营杯拼单待付款",
    meta: "剩余 28 分钟",
    tone: "yellow",
  },
]

export const products = [
  {
    id: "mug",
    name: "趣汇露营杯",
    description: "轻量保温，周末出发带上它",
    price: 39,
    tag: "新品",
    image: imageUrls.mug,
  },
  {
    id: "bottle",
    name: "城市通勤水壶",
    description: "一键开合，通勤不洒漏",
    price: 59,
    tag: "热卖",
    image: imageUrls.bottle,
  },
  {
    id: "backpack",
    name: "轻行双肩包",
    description: "13 英寸电脑仓，轻装出发",
    price: 129,
    tag: "自营",
    image: imageUrls.backpack,
  },
  {
    id: "gift",
    name: "趣汇周末礼包",
    description: "露营贴纸、杯套和旅行收纳袋",
    price: 79,
    tag: "限量",
    image: imageUrls.mug,
  },
]

export type MiniProgram = {
  id: string
  Icon: typeof ShoppingBag
  label: string
  description: string
  group: string
  genderScope: "all" | "female" | "male"
  favorite: boolean
  sortOrder: number | null
  usageFrequency: number
  trafficHeat: number
}

// 模拟小程序列表接口响应，字段覆盖当前性别适用、收藏和排序所需的服务端数据。
export const miniProgramCatalog: MiniProgram[] = [
  {
    id: "market",
    Icon: ShoppingBag,
    label: "趣汇集市",
    description: "社区好物",
    group: "default",
    genderScope: "all",
    favorite: true,
    sortOrder: 1,
    usageFrequency: 96,
    trafficHeat: 91,
  },
  {
    id: "weekend",
    Icon: UsersRound,
    label: "周末组局",
    description: "线下活动",
    group: "default",
    genderScope: "all",
    favorite: false,
    sortOrder: null,
    usageFrequency: 82,
    trafficHeat: 88,
  },
  {
    id: "gaming",
    Icon: Gamepad2,
    label: "开黑助手",
    description: "线上组队",
    group: "default",
    genderScope: "all",
    favorite: true,
    sortOrder: 2,
    usageFrequency: 90,
    trafficHeat: 86,
  },
  {
    id: "female-care",
    Icon: Sparkles,
    label: "轻养助手",
    description: "仅女生适用",
    group: "default",
    genderScope: "female",
    favorite: false,
    sortOrder: 3,
    usageFrequency: 74,
    trafficHeat: 79,
  },
]
export const MINI_PROGRAM_ONLY_CURRENT_GENDER = true

export type RecommendationItem =
  | {
      id: string
      kind: "community"
      activity: (typeof activities)[number]
      reason: string
    }
  | {
      id: string
      kind: "product"
      product: (typeof products)[number]
      reason: string
    }

export const navItems: Array<{
  key: PageKey
  label: string
  icon: typeof Home
}> = [
  { key: "recommend", label: "推荐", icon: Home },
  { key: "community", label: "社区", icon: UsersRound },
  { key: "mall", label: "商城", icon: ShoppingBag },
  { key: "messages", label: "消息", icon: MessageCircle },
  { key: "profile", label: "我的", icon: UserRound },
]
