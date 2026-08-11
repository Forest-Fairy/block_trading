import { useState } from "react"
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  ChevronRight,
  Info,
  Megaphone,
  MoreHorizontal,
  Paperclip,
  Send,
  UsersRound,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, IconButton } from "@/components/prototype-shell"

type MessageView = "inbox" | "chat"

const systemNotifications = [
  {
    title: "账号安全提醒",
    body: "检测到你的账号已完成一次新设备登录，请确认设备信息。",
    time: "今天 09:18",
    tag: "安全",
    unread: true,
  },
  {
    title: "社区规则更新",
    body: "拼车和线下组队的联系方式仅对确认成员开放，请勿发布敏感信息。",
    time: "昨天 18:30",
    tag: "规则",
    unread: true,
  },
  {
    title: "学生认证说明",
    body: "学生认证信息仅自身可见，校园版内容默认仅同校用户可见。",
    time: "周一 14:02",
    tag: "公告",
    unread: false,
  },
]

const businessNotifications = [
  {
    title: "周末山姆零食拼单已成团",
    body: "已达到最少人数，订单进入统一下单准备。",
    time: "刚刚",
    tag: "拼单",
    activityId: "snacks",
  },
  {
    title: "萧山机场拼车已确认",
    body: "发起人已确认你的申请，周五 19:30 准时出发。",
    time: "12 分钟前",
    tag: "拼车",
    activityId: "airport",
  },
  {
    title: "城市通勤水壶订单已发货",
    body: "订单 QH-20260809-0042 · 物流单号已生成，预计明日送达。",
    time: "昨天",
    tag: "商城",
    orderId: "QH-20260809-0042",
    orderStatus: "已发货",
  },
  {
    title: "轻行双肩包订单已签收",
    body: "订单 QH-20260807-0018 · 商品已送达，记得确认收货。",
    time: "周一",
    tag: "商城",
    orderId: "QH-20260807-0018",
    orderStatus: "已签收",
  },
  {
    title: "今晚线上开黑小队即将开始",
    body: "活动将在 20:00 开始，提前进入语音房。",
    time: "昨天",
    tag: "提醒",
    activityId: "game",
  },
]

const conversations = [
  {
    id: "lin",
    title: "林同学",
    desc: "周日径山轻徒步 · 我们在地铁口集合可以吗？",
    time: "刚刚",
    avatar: "林",
    kind: "私聊",
    detail: "在线",
  },
  {
    id: "weekend",
    title: "周末山友群",
    desc: "小周：明早 7:30 在地铁口集合",
    time: "12 分钟前",
    avatar: "群",
    kind: "群聊",
    detail: "8 人",
  },
  {
    id: "zhou",
    title: "小周",
    desc: "机场拼车还有一个座位，要一起吗？",
    time: "昨天",
    avatar: "周",
    kind: "私聊",
    detail: "昨天在线",
  },
]

function NotificationList({
  kind,
  onOpenPostDetail,
}: {
  kind: "system" | "business"
  onOpenPostDetail: (activityId: string) => void
}) {
  const items = kind === "system" ? systemNotifications : businessNotifications
  const [toast, setToast] = useState("")
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.title} className="border-0 shadow-none">
          <CardContent className="space-y-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">{item.title}</h2>
                  <Badge
                    variant="outline"
                    className="border-0 bg-secondary text-[10px] text-primary"
                  >
                    {item.tag}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.time}
                </p>
              </div>
              {kind === "system" && "unread" in item && item.unread ? (
                <span
                  className="size-2 shrink-0 rounded-full bg-[var(--qh-coral)]"
                  aria-label="未读"
                />
              ) : null}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>
            {kind === "business" && "activityId" in item && item.activityId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenPostDetail(item.activityId)}
              >
                查看关联详情 <ChevronRight size={14} />
              </Button>
            ) : null}
            {kind === "business" && "orderId" in item ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  showToast(`${item.orderId} · ${item.orderStatus}`)
                }
              >
                查看订单 <ChevronRight size={14} />
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function ChatView({
  conversationId,
  onBack,
}: {
  conversationId: string
  onBack: () => void
}) {
  const conversation =
    conversations.find((item) => item.id === conversationId) ?? conversations[0]
  const [draft, setDraft] = useState("")
  const [sent, setSent] = useState<string[]>([])
  const isGroup = conversation.kind === "群聊"

  const sendMessage = () => {
    const value = draft.trim()
    if (!value) return
    setSent((messages) => [...messages, value])
    setDraft("")
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        eyebrow={isGroup ? "活动群聊" : "用户消息"}
        title={conversation.title}
        leading={
          <IconButton label="返回消息列表" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        }
        action={
          <IconButton label="更多会话操作">
            <MoreHorizontal size={18} />
          </IconButton>
        }
      />
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        {isGroup ? (
          <UsersRound size={14} className="text-primary" />
        ) : (
          <Info size={14} className="text-primary" />
        )}
        {isGroup
          ? `${conversation.detail} · 仅活动成员可见`
          : `${conversation.detail} · 陌生人消息可在我的 · 隐私设置中关闭`}
      </div>
      <div className="flex-1 space-y-3 pb-4">
        <div className="flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
            今天
          </span>
        </div>
        <div className="flex items-end gap-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-secondary text-primary">
              {conversation.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm leading-5 shadow-sm">
            {isGroup
              ? "明早 7:30 在地铁口集合，大家记得带水。"
              : "周日径山轻徒步 · 我们在地铁口集合可以吗？"}
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-5 text-primary-foreground">
            好的，我会提前十分钟到。
          </div>
        </div>
        {isGroup ? (
          <div className="flex justify-center">
            <span className="rounded-lg bg-secondary px-3 py-2 text-[11px] text-primary">
              系统提示：活动地点仅对已确认成员可见
            </span>
          </div>
        ) : null}
        {sent.map((message, index) => (
          <div key={`${message}-${index}`} className="flex justify-end">
            <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-5 text-primary-foreground">
              {message}
            </div>
          </div>
        ))}
      </div>
      <div className="safe-bottom sticky bottom-0 -mx-4 border-t border-border bg-[#f7faf7] px-4 py-3">
        <div className="flex items-center gap-2">
          <IconButton label="添加附件">
            <Paperclip size={17} />
          </IconButton>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage()
            }}
            placeholder="输入消息"
            className="h-9 flex-1 bg-white"
          />
          <Button
            type="button"
            size="icon"
            aria-label="发送消息"
            onClick={sendMessage}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MessagesPage({
  onRead,
  onOpenPostDetail,
}: {
  onRead: () => void
  onOpenPostDetail: (activityId: string) => void
}) {
  const [active, setActive] = useState("全部")
  const [view, setView] = useState<MessageView>("inbox")
  const [conversationId, setConversationId] = useState("lin")

  if (view === "chat")
    return (
      <ChatView
        conversationId={conversationId}
        onBack={() => setView("inbox")}
      />
    )
  return (
    <div className="page-content">
      <PageHeader
        eyebrow="保持连接，及时响应"
        title="消息"
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRead}
            className="px-1 text-xs text-primary"
          >
            <CheckCheck size={15} /> 全部已读
          </Button>
        }
      />
      <Tabs value={active} onValueChange={setActive} className="mb-4">
        <TabsList className="w-full bg-transparent p-0">
          <TabsTrigger value="全部" className="h-9">
            全部
          </TabsTrigger>
          <TabsTrigger value="系统" className="h-9">
            系统
          </TabsTrigger>
          <TabsTrigger value="业务" className="h-9">
            业务
          </TabsTrigger>
          <TabsTrigger value="用户" className="h-9">
            用户
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {active === "全部" ? (
        <div className="mb-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setActive("系统")}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--qh-blue-soft)] text-[var(--qh-blue)]">
              <Bell size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">系统通知</strong>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                账号安全、平台公告和规则更新
              </span>
            </span>
            <Badge
              className="border-0 bg-[var(--qh-coral)] text-[10px] text-white"
              variant="outline"
            >
              3
            </Badge>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setActive("业务")}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Megaphone size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">业务通知</strong>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                成团、发货、退款和活动状态
              </span>
            </span>
            <Badge
              className="border-0 bg-[var(--qh-coral)] text-[10px] text-white"
              variant="outline"
            >
              5
            </Badge>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      ) : null}
      {active === "系统" ? (
        <section className="mb-5">
          <div className="mb-2 flex items-center gap-3">
            <span className="section-title text-base">系统通知</span>
            <Separator className="flex-1" />
          </div>
          <NotificationList kind="system" onOpenPostDetail={onOpenPostDetail} />
        </section>
      ) : null}
      {active === "业务" ? (
        <section className="mb-5">
          <div className="mb-2 flex items-center gap-3">
            <span className="section-title text-base">业务通知</span>
            <Separator className="flex-1" />
          </div>
          <NotificationList kind="business" onOpenPostDetail={onOpenPostDetail} />
        </section>
      ) : null}
      {active === "全部" || active === "用户" ? (
        <section className="mb-5">
          <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="section-title text-base">用户消息</span>
          <Separator className="flex-1" />
        </div>
        <Card size="sm" className="border-0 bg-muted shadow-none">
          <CardContent className="flex items-center gap-3 p-3 text-xs text-muted-foreground">
            <Info size={16} className="shrink-0 text-primary" />
            <span>陌生人消息可以在“我的 · 隐私设置”中关闭。</span>
          </CardContent>
        </Card>
          </div>
      <div className="mt-2 space-y-1">
        {conversations.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() => {
              setConversationId(message.id)
              setView("chat")
            }}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-white"
          >
            <Avatar size="lg">
              <AvatarFallback className="bg-secondary font-bold text-primary">
                {message.avatar}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <strong className="text-sm">{message.title}</strong>
                <span className="text-[10px] text-muted-foreground">
                  {message.time}
                </span>
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {message.desc}
              </span>
              <span className="mt-1 block text-[10px] text-primary">
                {message.kind} · {message.detail}
              </span>
            </span>
            <ChevronRight size={15} className="text-muted-foreground" />
          </button>
        ))}
      </div>
        </section>
      ) : null}
    </div>
  )
}
