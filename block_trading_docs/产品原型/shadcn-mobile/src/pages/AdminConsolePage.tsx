import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  FileCheck2,
  FileWarning,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  TicketCheck,
  UserCheck,
  UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AccessRole, ReleaseIteration } from "@/prototype/access"

type QueueRisk = "高风险" | "中风险" | "低风险"
type QueueItem = {
  id: string
  type: string
  title: string
  region: string
  risk: QueueRisk
  status: string
  sla: string
  rule: string
  suggestion: string
}

const iterationQueue: Record<ReleaseIteration, string> = {
  R1: "内容审核、举报与区域工单",
  R2: "交易异常、退款与履约补偿",
  R3: "区域灰度、数据权利与授权到期",
  R4: "风险案件、人工复核与高风险审批",
}

const operationQueues: Record<ReleaseIteration, QueueItem[]> = {
  R1: [
    {
      id: "R1-O-101",
      type: "帖子审核",
      title: "周末露营活动报名说明",
      region: "杭州西湖区",
      risk: "中风险",
      status: "待审核",
      sla: "剩余 42 分钟",
      rule: "联系方式疑似外显",
      suggestion: "建议要求修改后重新提交",
    },
    {
      id: "R1-O-102",
      type: "举报复核",
      title: "拼车费用争议与辱骂举报",
      region: "杭州滨江区",
      risk: "高风险",
      status: "加急",
      sla: "剩余 12 分钟",
      rule: "辱骂词与站外收款命中",
      suggestion: "建议维持临时下架并转人工复核",
    },
    {
      id: "R1-O-103",
      type: "留言审核",
      title: "近邻求助留言包含电话",
      region: "杭州拱墅区",
      risk: "低风险",
      status: "待审核",
      sla: "剩余 2 小时",
      rule: "个人联系方式",
      suggestion: "建议脱敏后放行",
    },
  ],
  R2: [
    {
      id: "R2-O-201",
      type: "退款工单",
      title: "订单取消后退款状态未更新",
      region: "杭州西湖区",
      risk: "高风险",
      status: "需复核",
      sla: "剩余 18 分钟",
      rule: "资金状态不一致",
      suggestion: "建议核对支付事实并升级财务复核",
    },
    {
      id: "R2-O-202",
      type: "物流异常",
      title: "签收回传与用户申诉冲突",
      region: "杭州滨江区",
      risk: "中风险",
      status: "待审核",
      sla: "剩余 55 分钟",
      rule: "履约节点冲突",
      suggestion: "建议保留争议并转履约工单",
    },
  ],
  R3: [
    {
      id: "R3-O-301",
      type: "数据请求",
      title: "用户申请导出个人数据副本",
      region: "全局业务",
      risk: "中风险",
      status: "需复核",
      sla: "剩余 4 小时",
      rule: "数据权利请求",
      suggestion: "建议完成身份复核后进入导出审批",
    },
    {
      id: "R3-O-302",
      type: "灰度反馈",
      title: "区域模板灰度出现投诉上升",
      region: "杭州西湖区",
      risk: "高风险",
      status: "加急",
      sla: "剩余 25 分钟",
      rule: "灰度护栏触发",
      suggestion: "建议暂停放量并通知系统管理员",
    },
  ],
  R4: [
    {
      id: "R4-O-401",
      type: "申诉复核",
      title: "关联风险账号限制申诉",
      region: "全局业务",
      risk: "高风险",
      status: "需复核",
      sla: "剩余 35 分钟",
      rule: "关联风险模型命中",
      suggestion: "建议核验证据并保留人工裁决",
    },
    {
      id: "R4-O-402",
      type: "侵权投诉",
      title: "活动图片著作权投诉",
      region: "杭州滨江区",
      risk: "中风险",
      status: "待审核",
      sla: "剩余 3 小时",
      rule: "版权投诉材料齐全",
      suggestion: "建议转知识产权复核",
    },
  ],
}

const systemQueues: Record<ReleaseIteration, QueueItem[]> = {
  R1: [
    {
      id: "R1-S-101",
      type: "规则发布",
      title: "未成年人保护规则 v1.3",
      region: "全局",
      risk: "高风险",
      status: "待审批",
      sla: "剩余 30 分钟",
      rule: "全局规则变更",
      suggestion: "需二次验证并确认回滚条件",
    },
    {
      id: "R1-S-102",
      type: "区域应急",
      title: "滨江区临时关闭陌生人私信",
      region: "杭州滨江区",
      risk: "高风险",
      status: "需复核",
      sla: "剩余 8 分钟",
      rule: "区域安全事件 P1",
      suggestion: "确认保留客服、申诉和既有订单入口",
    },
    {
      id: "R1-S-103",
      type: "审计导出",
      title: "内容处置审计记录导出申请",
      region: "全局",
      risk: "中风险",
      status: "待审批",
      sla: "剩余 6 小时",
      rule: "敏感数据导出",
      suggestion: "核对目的、字段范围和有效期",
    },
  ],
  R2: [
    {
      id: "R2-S-201",
      type: "资金审批",
      title: "批量退款异常补偿申请",
      region: "杭州西湖区",
      risk: "高风险",
      status: "待审批",
      sla: "剩余 20 分钟",
      rule: "批量资金操作",
      suggestion: "需财务复核与二次验证",
    },
    {
      id: "R2-S-202",
      type: "区域开关",
      title: "暂停新增交易并保留存量售后",
      region: "杭州滨江区",
      risk: "高风险",
      status: "需复核",
      sla: "剩余 15 分钟",
      rule: "区域交易应急",
      suggestion: "确认存量订单、退款和客服不受影响",
    },
  ],
  R3: [
    {
      id: "R3-S-301",
      type: "灰度审批",
      title: "西湖区区域模板扩大至 20%",
      region: "杭州西湖区",
      risk: "中风险",
      status: "待审批",
      sla: "剩余 2 小时",
      rule: "区域灰度变更",
      suggestion: "核对护栏、版本与回滚快照",
    },
    {
      id: "R3-S-302",
      type: "授权到期",
      title: "区域管理员授权即将到期",
      region: "杭州拱墅区",
      risk: "低风险",
      status: "待处理",
      sla: "剩余 2 天",
      rule: "角色有效期",
      suggestion: "先确认岗位责任再决定续期",
    },
  ],
  R4: [
    {
      id: "R4-S-401",
      type: "高风险审批",
      title: "永久封禁案件 SYS-401",
      region: "全局",
      risk: "高风险",
      status: "待审批",
      sla: "剩余 45 分钟",
      rule: "永久限制与证据保全",
      suggestion: "必须完成人工复核并保留申诉入口",
    },
    {
      id: "R4-S-402",
      type: "模型关闭",
      title: "关联风险模型误伤率超阈值",
      region: "全局",
      risk: "高风险",
      status: "加急",
      sla: "剩余 10 分钟",
      rule: "模型护栏触发",
      suggestion: "建议暂停自动处置并切换人工复核",
    },
  ],
}

const auditRecords = [
  {
    id: "AUD-0816-01",
    actor: "运营管理员 · 林知夏",
    action: "要求修改",
    target: "帖子 R1-O-088",
    scope: "全局业务",
    result: "成功",
    time: "10:42",
  },
  {
    id: "AUD-0816-02",
    actor: "系统管理员 · 周明",
    action: "发布规则",
    target: "minor-protect-v1.2",
    scope: "ALL",
    result: "审批通过",
    time: "10:18",
  },
  {
    id: "AUD-0816-03",
    actor: "区域管理员 · 陈晓",
    action: "维持下架",
    target: "举报 REP-302",
    scope: "杭州西湖区",
    result: "成功",
    time: "09:56",
  },
  {
    id: "AUD-0816-04",
    actor: "系统管理员 · 周明",
    action: "查询日志",
    target: "request_id=req-8f21",
    scope: "生产脱敏",
    result: "成功",
    time: "09:31",
  },
]

const ticketsByIteration: Record<
  ReleaseIteration,
  Array<{
    id: string
    title: string
    kind: string
    priority: string
    owner: string
  }>
> = {
  R1: [
    {
      id: "TKT-1201",
      title: "高危举报需要人工复核",
      kind: "内容安全",
      priority: "P1",
      owner: "待接单",
    },
    {
      id: "TKT-1202",
      title: "区域公告误包含过期时间",
      kind: "区域运营",
      priority: "P2",
      owner: "陈晓",
    },
    {
      id: "TKT-1203",
      title: "用户反馈登录验证码频繁",
      kind: "客服升级",
      priority: "P2",
      owner: "林知夏",
    },
  ],
  R2: [
    {
      id: "TKT-2201",
      title: "退款回调超过 SLA",
      kind: "交易异常",
      priority: "P1",
      owner: "待接单",
    },
    {
      id: "TKT-2202",
      title: "物流节点长时间未更新",
      kind: "履约工单",
      priority: "P2",
      owner: "履约组",
    },
  ],
  R3: [
    {
      id: "TKT-3201",
      title: "数据导出请求等待身份复核",
      kind: "数据权利",
      priority: "P2",
      owner: "合规组",
    },
    {
      id: "TKT-3202",
      title: "灰度区域投诉率触发护栏",
      kind: "灰度处置",
      priority: "P1",
      owner: "待接单",
    },
  ],
  R4: [
    {
      id: "TKT-4201",
      title: "永久封禁申诉等待证据复核",
      kind: "风险案件",
      priority: "P1",
      owner: "风险组",
    },
    {
      id: "TKT-4202",
      title: "侵权投诉材料需要补充",
      kind: "侵权投诉",
      priority: "P2",
      owner: "待接单",
    },
  ],
}

function riskTone(risk: QueueRisk) {
  if (risk === "高风险")
    return "border-destructive/25 bg-destructive/5 text-destructive"
  if (risk === "中风险")
    return "border-[#d59b31]/30 bg-[var(--qh-yellow-soft)] text-[#77551c]"
  return "border-primary/20 bg-secondary text-primary"
}

export function AdminConsolePage({
  allowed,
  role,
  iteration,
  onBack,
  surface = "mobile",
}: {
  allowed: boolean
  role: AccessRole
  iteration: ReleaseIteration
  onBack: () => void
  surface?: "mobile" | "pc"
}) {
  const isSystemAdmin = role === "system_admin"
  const sourceQueue = isSystemAdmin
    ? systemQueues[iteration]
    : operationQueues[iteration]
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [riskFilter, setRiskFilter] = useState<"全部" | QueueRisk>("全部")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decision, setDecision] = useState("")
  const [reason, setReason] = useState("")
  const [reviewResults, setReviewResults] = useState<Record<string, string>>({})
  const [ticketStates, setTicketStates] = useState<Record<string, string>>({})
  const [auditQuery, setAuditQuery] = useState("")
  const [exportPrepared, setExportPrepared] = useState(false)
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const [grantRole, setGrantRole] = useState("REGION_ADMIN")
  const [grantRequested, setGrantRequested] = useState(false)
  const [toast, setToast] = useState("")

  const selectedItem =
    sourceQueue.find((item) => item.id === selectedId) ?? null
  const visibleQueue = sourceQueue.filter((item) => {
    const matchesRisk = riskFilter === "全部" || item.risk === riskFilter
    const keyword = query.trim().toLowerCase()
    return (
      matchesRisk &&
      (!keyword ||
        `${item.title}${item.type}${item.region}${item.id}`
          .toLowerCase()
          .includes(keyword))
    )
  })
  const visibleAudit = auditRecords.filter((item) => {
    const keyword = auditQuery.trim().toLowerCase()
    return (
      !keyword ||
      `${item.id}${item.actor}${item.action}${item.target}${item.scope}`
        .toLowerCase()
        .includes(keyword)
    )
  })
  const completedCount = Object.keys(reviewResults).length
  const pendingCount = Math.max(0, sourceQueue.length - completedCount)
  const urgentCount = sourceQueue.filter(
    (item) => item.risk === "高风险" && !reviewResults[item.id]
  ).length
  const metrics = useMemo(
    () => [
      {
        label: isSystemAdmin ? "待审批" : "待审核",
        value: pendingCount,
        note: iterationQueue[iteration],
        icon: ListChecks,
      },
      {
        label: "高风险",
        value: urgentCount,
        note: "需要优先人工处理",
        icon: ShieldAlert,
      },
      {
        label: "SLA 风险",
        value: urgentCount ? 1 : 0,
        note: "30 分钟内到期",
        icon: Clock3,
      },
      {
        label: "今日已处理",
        value: 18 + completedCount,
        note: "所有操作写入审计",
        icon: CheckCircle2,
      },
    ],
    [completedCount, isSystemAdmin, iteration, pendingCount, urgentCount]
  )

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }
  const openQueueItem = (id: string) => {
    setSelectedId(id)
    setDecision("")
    setReason("")
  }
  const submitDecision = () => {
    if (!selectedItem || !decision || !reason) return
    setReviewResults((results) => ({ ...results, [selectedItem.id]: decision }))
    setSelectedId(null)
    showToast(`${selectedItem.id} 已提交：${decision}`)
  }

  if (!allowed) {
    return (
      <div className="page-content pt-5">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} /> 返回客户端
        </Button>
        <Card className="mt-5 border-destructive/30 bg-destructive/5 py-0">
          <CardContent className="p-4 text-center">
            <LockKeyhole className="mx-auto text-destructive" size={28} />
            <h1 className="mt-3 text-base font-bold">后台访问被拒绝</h1>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              后台仅接受 OPERATION_ADMIN 或 SYSTEM_ADMIN 的有效 RBAC 授权。普通
              VIP 和区域管理员不能通过客户端入口绕过该校验。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const decisions = isSystemAdmin
    ? ["批准变更", "退回补充", "保持冻结"]
    : ["通过", "要求修改", "维持下架", "升级复核"]
  const reasons = isSystemAdmin
    ? ["审批材料完整", "缺少影响评估", "未满足回滚条件"]
    : ["内容符合规范", "个人信息需脱敏", "风险证据充分", "需要上级复核"]

  return (
    <div
      className={`page-content admin-console-page pt-4 ${surface === "pc" ? "is-pc" : "is-mobile"}`}
    >
      <header className="admin-console-header">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="返回客户端"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary">
            {surface === "pc" ? "独立 PC 后台" : "客户端设置入口"}
          </p>
          <h1 className="text-lg font-bold">
            {isSystemAdmin ? "系统管理" : "运营管理"}
          </h1>
        </div>
        <Badge variant="secondary">{iteration}</Badge>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {isSystemAdmin ? "SYSTEM_ADMIN · ALL" : "OPERATION_ADMIN · BUSINESS"}
        </Badge>
      </header>

      <section className="admin-session-strip" aria-label="当前管理会话">
        <ShieldCheck size={17} className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">qh_user_demo_001 · 能力清单已同步</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            授权事实版本 28 · Casbin 投影版本 28 ·
            高风险操作需二次验证并写入审计
          </p>
        </div>
        <Badge className="shrink-0" variant="outline">
          ACTIVE
        </Badge>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-4 flex-col"
      >
        <TabsList className="admin-tabs w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">
            <LayoutDashboard />
            总览
          </TabsTrigger>
          <TabsTrigger value="queue">
            <ListChecks />
            {isSystemAdmin ? "审批队列" : "审核队列"}
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <TicketCheck />
            工单
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileWarning />
            审计
          </TabsTrigger>
          <TabsTrigger value="access">
            <UsersRound />
            权限
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <section className="admin-metric-grid" aria-label="工作台指标">
            {metrics.map(({ label, value, note, icon: Icon }) => (
              <Card key={label} className="py-0 shadow-none">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                    <Icon size={16} className="text-primary" />
                  </div>
                  <strong className="mt-2 block text-2xl">{value}</strong>
                  <span className="mt-1 block truncate text-[0.6875rem] text-muted-foreground">
                    {note}
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>
          <section className="admin-overview-grid">
            <Card className="py-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CircleGauge
                    className="mt-0.5 shrink-0 text-primary"
                    size={19}
                  />
                  <div>
                    <h2 className="text-sm font-bold">当前迭代工作重点</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {iterationQueue[iteration]}
                      。服务端按资源、动作、范围、有效期和策略版本逐请求裁决。
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setActiveTab("queue")}
                >
                  查看优先队列 <ChevronRight />
                </Button>
              </CardContent>
            </Card>
            <Card className="py-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ServerCog
                    className="mt-0.5 shrink-0 text-[var(--qh-blue)]"
                    size={19}
                  />
                  <div>
                    <h2 className="text-sm font-bold">
                      {isSystemAdmin ? "系统与策略状态" : "业务服务状态"}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {isSystemAdmin
                        ? "策略投影同步正常，生产部署号 DEP-20260816-03，未发现待回滚变更。"
                        : "审核队列和客服升级通道正常；基础设施日志不可见。"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <span className="rounded-md bg-secondary p-2 font-semibold text-primary">
                    策略正常
                  </span>
                  <span className="rounded-md bg-[var(--qh-blue-soft)] p-2 font-semibold text-[var(--qh-blue)]">
                    队列正常
                  </span>
                  <span className="rounded-md bg-[var(--qh-yellow-soft)] p-2 font-semibold text-[#77551c]">
                    1 项关注
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="queue" className="mt-4">
          <div className="admin-toolbar">
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="搜索编号、标题、类型或区域"
              />
            </div>
            <div className="flex shrink-0 gap-1 overflow-x-auto">
              {(["全部", "高风险", "中风险", "低风险"] as const).map((risk) => (
                <Button
                  key={risk}
                  type="button"
                  size="sm"
                  variant={riskFilter === risk ? "default" : "outline"}
                  onClick={() => setRiskFilter(risk)}
                >
                  {risk}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {visibleQueue.map((item) => {
              const result = reviewResults[item.id]
              return (
                <Card key={item.id} className="py-0 shadow-none">
                  <CardContent className="admin-queue-row p-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge
                          variant="outline"
                          className={riskTone(item.risk)}
                        >
                          {item.risk}
                        </Badge>
                        <span className="text-[0.6875rem] text-muted-foreground">
                          {item.id} · {item.region}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold">{item.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        规则：{item.rule} · {item.sla}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={result ? "secondary" : "outline"}>
                        {result ?? item.status}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openQueueItem(item.id)}
                      >
                        {result ? "查看结果" : "处理"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {!visibleQueue.length ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
                没有匹配的队列项
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">工单与交接</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                接单、升级和完成均保留负责人、时间与用户通知记录。
              </p>
            </div>
            <Badge variant="outline">
              {ticketsByIteration[iteration].length} 条
            </Badge>
          </div>
          <div className="space-y-2">
            {ticketsByIteration[iteration].map((ticket) => {
              const state = ticketStates[ticket.id] ?? ticket.owner
              return (
                <Card key={ticket.id} className="py-0 shadow-none">
                  <CardContent className="admin-queue-row p-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            ticket.priority === "P1" ? "destructive" : "outline"
                          }
                        >
                          {ticket.priority}
                        </Badge>
                        <span className="text-[0.6875rem] text-muted-foreground">
                          {ticket.id} · {ticket.kind}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold">{ticket.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        当前负责人：{state}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTicketStates((items) => ({
                            ...items,
                            [ticket.id]: "当前管理员处理中",
                          }))
                        }
                      >
                        接单
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setTicketStates((items) => ({
                            ...items,
                            [ticket.id]: "已升级至上级队列",
                          }))
                        }
                      >
                        升级
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="admin-toolbar">
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                value={auditQuery}
                onChange={(event) => setAuditQuery(event.target.value)}
                className="pl-9"
                placeholder="搜索操作者、动作、对象或范围"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportPrepared(true)}
            >
              <FileCheck2 />
              {exportPrepared ? "导出审批待处理" : "发起导出审批"}
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border bg-white">
            {visibleAudit.map((record) => (
              <div key={record.id} className="admin-audit-row">
                <div className="min-w-0">
                  <p className="text-xs font-bold">
                    {record.action} · {record.target}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                    {record.actor} · {record.scope} · {record.id}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant="secondary">{record.result}</Badge>
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                    今天 {record.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            导出不会直接下载数据；系统将重新校验字段范围、目的、二次验证和审批有效期。
          </p>
        </TabsContent>

        <TabsContent value="access" className="mt-4 space-y-3">
          <Card className="py-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 shrink-0 text-primary" size={19} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">当前授权</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    qh_user_demo_001 ·{" "}
                    {isSystemAdmin
                      ? "SYSTEM_ADMIN · ALL"
                      : "OPERATION_ADMIN · BUSINESS"}{" "}
                    · 有效期至 2026-12-31
                  </p>
                </div>
                <Badge variant="outline">版本 28</Badge>
              </div>
            </CardContent>
          </Card>
          {isSystemAdmin ? (
            <Card className="py-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <UserCheck
                    className="mt-0.5 shrink-0 text-[var(--qh-blue)]"
                    size={19}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold">角色授权变更</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      变更写入 qh_admin_role_grant，审批通过后生成新的 Casbin
                      投影版本；同步失败时失败关闭。
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={() => {
                    setGrantRequested(false)
                    setGrantDialogOpen(true)
                  }}
                >
                  发起授权变更
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed py-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    className="mt-0.5 shrink-0 text-muted-foreground"
                    size={19}
                  />
                  <div>
                    <h2 className="text-sm font-bold">权限配置不可用</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      运营管理员只能查看自身岗位授权，不能修改角色、区域归属、系统密钥或全局规则。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-xl">
          {selectedItem ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedItem.type} · {selectedItem.id}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem.title} · {selectedItem.region} ·{" "}
                  {selectedItem.sla}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-bold">规则与模型摘要</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    规则命中：{selectedItem.rule}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    模型建议：{selectedItem.suggestion}
                  </p>
                </div>
                <section>
                  <p className="mb-2 text-xs font-bold">处置动作</p>
                  <div className="grid grid-cols-2 gap-2">
                    {decisions.map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant={decision === item ? "default" : "outline"}
                        onClick={() => setDecision(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-bold">原因分类</p>
                  <div className="grid gap-2">
                    {reasons.map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant={reason === item ? "secondary" : "outline"}
                        className="justify-start whitespace-normal"
                        onClick={() => setReason(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </section>
                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <AlertTriangle
                    className="mt-0.5 shrink-0 text-[#b4771d]"
                    size={15}
                  />
                  提交前服务端仍会重新校验角色、动作、范围、授权版本和二次验证状态。
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedId(null)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  disabled={!decision || !reason}
                  onClick={submitDecision}
                >
                  提交处置
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发起角色授权变更</DialogTitle>
            <DialogDescription>
              本操作只生成审批请求，不直接修改授权事实。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {["REGION_ADMIN", "OPERATION_ADMIN", "SYSTEM_ADMIN"].map((item) => (
              <Button
                key={item}
                type="button"
                variant={grantRole === item ? "secondary" : "outline"}
                className="justify-start"
                onClick={() => setGrantRole(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="rounded-lg bg-[var(--qh-yellow-soft)] p-3 text-xs leading-5 text-[#77551c]">
            需要二次验证、审批人与发起人分离，并明确数据范围、有效期和回滚条件。
          </div>
          {grantRequested ? (
            <p className="text-xs font-semibold text-primary">
              授权变更审批请求已生成：{grantRole}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGrantDialogOpen(false)}
            >
              关闭
            </Button>
            <Button type="button" onClick={() => setGrantRequested(true)}>
              生成审批请求
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
