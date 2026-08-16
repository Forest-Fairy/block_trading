import { useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileWarning,
  MapPinned,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  TicketCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReleaseIteration } from "@/prototype/access"

const iterationCapabilities: Record<
  ReleaseIteration,
  { title: string; description: string }
> = {
  R1: {
    title: "区域内容与工单",
    description: "处理授权区域的内容待审、举报、公告和服务工单。",
  },
  R2: {
    title: "区域交易收口",
    description: "处理交易异常并保留存量订单、退款、售后和客服入口。",
  },
  R3: {
    title: "灰度与授权范围",
    description: "提交区域模板灰度申请，范围变更立即影响操作资格。",
  },
  R4: {
    title: "风险协同",
    description: "提交区域风险线索；高风险规则仍需全局审批和二次验证。",
  },
}

const regionalQueue: Record<
  ReleaseIteration,
  Array<{ id: string; type: string; title: string; risk: string; sla: string }>
> = {
  R1: [
    {
      id: "REG-R1-201",
      type: "活动举报",
      title: "线下活动集合地点描述不清",
      risk: "中风险",
      sla: "剩余 38 分钟",
    },
    {
      id: "REG-R1-202",
      type: "区域公告",
      title: "校园活动公告需要更新截止时间",
      risk: "低风险",
      sla: "剩余 3 小时",
    },
    {
      id: "REG-R1-203",
      type: "安全线索",
      title: "用户反馈疑似站外收款",
      risk: "高风险",
      sla: "剩余 15 分钟",
    },
  ],
  R2: [
    {
      id: "REG-R2-201",
      type: "交易异常",
      title: "本区域订单配送范围冲突",
      risk: "高风险",
      sla: "剩余 22 分钟",
    },
    {
      id: "REG-R2-202",
      type: "售后工单",
      title: "存量订单退款需要人工核验",
      risk: "中风险",
      sla: "剩余 50 分钟",
    },
  ],
  R3: [
    {
      id: "REG-R3-201",
      type: "灰度申请",
      title: "区域模板灰度扩大至 10%",
      risk: "中风险",
      sla: "剩余 6 小时",
    },
    {
      id: "REG-R3-202",
      type: "授权到期",
      title: "区域公告权限将在 2 天后到期",
      risk: "低风险",
      sla: "剩余 2 天",
    },
  ],
  R4: [
    {
      id: "REG-R4-201",
      type: "风险线索",
      title: "关联账号在本区域重复发布",
      risk: "高风险",
      sla: "剩余 25 分钟",
    },
    {
      id: "REG-R4-202",
      type: "侵权投诉",
      title: "区域活动图片投诉材料待补充",
      risk: "中风险",
      sla: "剩余 4 小时",
    },
  ],
}

export function RegionManagementPage({
  allowed,
  iteration,
  regionScope,
  onBack,
  surface = "mobile",
}: {
  allowed: boolean
  iteration: ReleaseIteration
  regionScope: string[]
  onBack: () => void
  surface?: "mobile" | "pc"
}) {
  const [selectedRegion, setSelectedRegion] = useState(
    regionScope[0] ?? "未授权区域"
  )
  const [queueStates, setQueueStates] = useState<Record<string, string>>({})
  const [ticketState, setTicketState] = useState("待接单")
  const [announcement, setAnnouncement] = useState("")
  const [publishedAnnouncement, setPublishedAnnouncement] = useState("")
  const [toast, setToast] = useState("")
  const capability = iterationCapabilities[iteration]
  const queue = regionalQueue[iteration]

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }

  if (!allowed) {
    return (
      <div className="page-content pt-5">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} /> 返回我的
        </Button>
        <Card className="mt-5 border-destructive/30 bg-destructive/5 py-0">
          <CardContent className="p-4 text-center">
            <ShieldAlert className="mx-auto text-destructive" size={28} />
            <h1 className="mt-3 text-base font-bold">无区域管理权限</h1>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              此入口需要有效的 REGION_ADMIN
              角色授权和区域数据范围。当前会话未通过服务端权限裁决。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className={`page-content region-console-page pt-4 ${surface === "pc" ? "is-pc" : "is-mobile"}`}
    >
      <header className="admin-console-header">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="返回我的"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary">
            {surface === "pc" ? "独立 PC 管理端" : "客户端设置入口"}
          </p>
          <h1 className="text-lg font-bold">区域管理</h1>
        </div>
        <Badge variant="secondary">{iteration}</Badge>
        <Badge variant="outline" className="hidden sm:inline-flex">
          REGION_ADMIN · REGION
        </Badge>
      </header>

      <section className="admin-session-strip" aria-label="当前区域授权">
        <ShieldCheck size={17} className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">区域授权有效 · {selectedRegion}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            仅可处理 regionScope
            返回的区域；切换身份、到期或服务端拒绝后立即不可操作
          </p>
        </div>
        <Badge variant="outline">ACTIVE</Badge>
      </section>

      <section className="mt-4" aria-labelledby="region-switch-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="region-switch-title" className="text-sm font-bold">
            授权区域
          </h2>
          <span className="text-xs text-muted-foreground">
            数据范围：REGION
          </span>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {regionScope.map((region) => (
            <Button
              key={region}
              type="button"
              size="sm"
              variant={selectedRegion === region ? "default" : "outline"}
              onClick={() => setSelectedRegion(region)}
            >
              <MapPinned />
              {region}
            </Button>
          ))}
        </div>
      </section>

      <Tabs defaultValue="overview" className="mt-4 flex-col">
        <TabsList className="admin-tabs w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">
            <ClipboardCheck />
            总览
          </TabsTrigger>
          <TabsTrigger value="queue">
            <FileWarning />
            区域队列
          </TabsTrigger>
          <TabsTrigger value="operations">
            <Megaphone />
            公告与工单
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <section className="admin-metric-grid region-metric-grid">
            {[
              {
                label: "待处理",
                value: queue.filter((item) => !queueStates[item.id]).length,
                icon: ClipboardCheck,
              },
              {
                label: "高风险",
                value: queue.filter(
                  (item) => item.risk === "高风险" && !queueStates[item.id]
                ).length,
                icon: ShieldAlert,
              },
              { label: "SLA 风险", value: 1, icon: Clock3 },
              {
                label: "今日完成",
                value: 9 + Object.keys(queueStates).length,
                icon: CheckCircle2,
              },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="py-0 shadow-none">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                    <Icon size={16} className="text-primary" />
                  </div>
                  <strong className="mt-2 block text-2xl">{value}</strong>
                  <span className="mt-1 block text-[0.6875rem] text-muted-foreground">
                    {selectedRegion}
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>
          <Card className="py-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <ClipboardCheck size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-bold">{capability.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {capability.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                区域停用、全局规则、权限变更和资金操作不在当前角色能力内；紧急事件只能提交线索或升级。
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">{selectedRegion} · 区域队列</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                切换区域后重新按授权范围查询，不复用跨区域缓存。
              </p>
            </div>
            <Badge variant="outline">{queue.length} 条</Badge>
          </div>
          <div className="space-y-2">
            {queue.map((item) => {
              const result = queueStates[item.id]
              return (
                <Card key={item.id} className="py-0 shadow-none">
                  <CardContent className="admin-queue-row p-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge
                          variant={
                            item.risk === "高风险" ? "destructive" : "secondary"
                          }
                        >
                          {item.risk}
                        </Badge>
                        <span className="text-[0.6875rem] text-muted-foreground">
                          {item.id}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold">{item.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedRegion} · {item.sla}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={result ? "outline" : "default"}
                      onClick={() => {
                        setQueueStates((states) => ({
                          ...states,
                          [item.id]: "已提交区域处置",
                        }))
                        showToast(`${item.id} 已提交区域处置`)
                      }}
                    >
                      {result ?? "处理"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="operations" className="mt-4 space-y-3">
          <Card className="py-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 shrink-0 text-primary" size={19} />
                <div>
                  <h2 className="text-sm font-bold">发布区域公告</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    公告范围固定为 {selectedRegion}
                    ，不能发布全局公告或降低全局保护要求。
                  </p>
                </div>
              </div>
              <Input
                className="mt-3"
                value={announcement}
                onChange={(event) => setAnnouncement(event.target.value)}
                placeholder="输入公告标题或简要内容"
              />
              <Button
                type="button"
                className="mt-2 w-full"
                disabled={!announcement.trim()}
                onClick={() => {
                  setPublishedAnnouncement(announcement.trim())
                  setAnnouncement("")
                  showToast("区域公告已进入审核队列")
                }}
              >
                <BellRing />
                提交公告审核
              </Button>
              {publishedAnnouncement ? (
                <p className="mt-3 rounded-md bg-secondary p-2 text-xs text-primary">
                  待审核公告：{publishedAnnouncement}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card className="py-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TicketCheck
                  className="mt-0.5 shrink-0 text-[var(--qh-blue)]"
                  size={19}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">
                    REG-TKT-0816 · 活动现场安全咨询
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {selectedRegion} · P2 · 当前状态：{ticketState}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTicketState("当前管理员处理中")}
                >
                  接单
                </Button>
                <Button
                  type="button"
                  onClick={() => setTicketState("已升级至运营管理员")}
                >
                  升级
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <AlertTriangle
              className="mt-0.5 shrink-0 text-[#b4771d]"
              size={15}
            />
            涉及跨区域、安全事件或全局策略时必须升级，区域管理员不能自行扩大处置范围。
          </p>
        </TabsContent>
      </Tabs>
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
