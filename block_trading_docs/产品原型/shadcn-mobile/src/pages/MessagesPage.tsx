import { useState } from "react"
import { Bell, CheckCheck, ChevronRight, Info, Megaphone } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/prototype-shell"

export function MessagesPage({ onRead }: { onRead: () => void }) {
  const [active, setActive] = useState("全部")
  const messages = [
    {
      title: "林同学",
      desc: "周日径山轻徒步 · 我们在地铁口集合可以吗？",
      time: "刚刚",
      avatar: "林",
    },
    {
      title: "小周",
      desc: "机场拼车还有一个座位，要一起吗？",
      time: "12 分钟前",
      avatar: "周",
    },
    {
      title: "趣汇客服",
      desc: "你的兑换码已经到账，记得在有效期内使用。",
      time: "昨天",
      avatar: "趣",
    },
  ]
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
      <div className="space-y-2">
        <button
          type="button"
          onClick={onRead}
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
          onClick={onRead}
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
      <div className="my-5 flex items-center gap-3">
        <span className="section-title text-base">用户消息</span>
        <Separator className="flex-1" />
      </div>
      <div className="space-y-1">
        {messages.map((message) => (
          <button
            key={message.title}
            type="button"
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
            </span>
            <ChevronRight size={15} className="text-muted-foreground" />
          </button>
        ))}
      </div>
      <Card className="mt-5 border-0 bg-muted shadow-none">
        <CardContent className="flex items-center gap-3 p-3 text-xs text-muted-foreground">
          <Info size={16} className="shrink-0 text-primary" />
          <span>陌生人消息可以在“我的 · 隐私设置”中关闭。</span>
        </CardContent>
      </Card>
    </div>
  )
}
