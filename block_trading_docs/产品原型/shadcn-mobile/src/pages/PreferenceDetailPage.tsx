import { useState } from "react"
import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconButton, PageHeader } from "@/components/prototype-shell"
import type { PreferenceKey } from "@/prototype/data"

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <span className="min-w-0">
        <strong className="block text-sm">{label}</strong>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="block h-6 w-11 rounded-full bg-muted-foreground/30 transition peer-checked:bg-primary" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export function PreferenceDetailPage({
  preference,
  onBack,
}: {
  preference: PreferenceKey
  onBack: () => void
}) {
  const [toast, setToast] = useState("")
  const [privacy, setPrivacy] = useState({ location: true, recommendation: true, stranger: false })
  const [notifications, setNotifications] = useState({ system: true, business: true, chat: true })
  const [theme, setTheme] = useState("跟随系统")
  const [wifiOnly, setWifiOnly] = useState(false)
  const [feedback, setFeedback] = useState("")
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }

  const content =
    preference === "账号与安全" ? (
      <Card className="border-0 shadow-none"><CardContent className="space-y-3 p-0">
        <div className="flex items-center justify-between px-3 py-3"><span><strong className="block text-sm">绑定手机</strong><span className="text-xs text-muted-foreground">138 **** 6621</span></span><Button variant="outline" size="sm" onClick={() => showToast("手机号验证流程将在后续接入")}>更换</Button></div>
        <div className="border-y border-border/60 px-3 py-3"><strong className="block text-sm">登录设备</strong><p className="mt-1 text-xs text-muted-foreground">Windows · 当前设备 · 杭州</p><Button className="mt-2" variant="outline" size="sm" onClick={() => showToast("其他设备已下线")}>下线其他设备</Button></div>
        <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left" onClick={() => showToast("修改密码页面将在后续接入")}>修改密码 <ChevronRight size={16} className="text-muted-foreground" /></button>
        <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left text-[var(--qh-coral)]" onClick={() => showToast("已打开账号注销说明")}>账号注销 <ChevronRight size={16} /></button>
      </CardContent></Card>
    ) : preference === "隐私设置" ? (
      <Card className="border-0 shadow-none"><CardContent className="p-3">
        <ToggleRow label="显示大致位置" description="只展示街区级位置" checked={privacy.location} onChange={(checked) => setPrivacy((value) => ({ ...value, location: checked }))} />
        <ToggleRow label="个性化推荐" description="使用浏览和互动偏好优化推荐" checked={privacy.recommendation} onChange={(checked) => setPrivacy((value) => ({ ...value, recommendation: checked }))} />
        <ToggleRow label="允许陌生人消息" description="未关注用户可发起一次会话" checked={privacy.stranger} onChange={(checked) => setPrivacy((value) => ({ ...value, stranger: checked }))} />
      </CardContent></Card>
    ) : preference === "消息通知" ? (
      <Card className="border-0 shadow-none"><CardContent className="space-y-3 p-3">
        <ToggleRow label="系统通知" description="账号、安全和平台公告" checked={notifications.system} onChange={(checked) => setNotifications((value) => ({ ...value, system: checked }))} />
        <ToggleRow label="业务通知" description="拼单、订单和活动进度" checked={notifications.business} onChange={(checked) => setNotifications((value) => ({ ...value, business: checked }))} />
        <ToggleRow label="私聊和群聊" description="新消息和@提醒" checked={notifications.chat} onChange={(checked) => setNotifications((value) => ({ ...value, chat: checked }))} />
        <div className="rounded-lg bg-muted p-3"><strong className="block text-sm">免打扰时段</strong><div className="mt-2 grid grid-cols-2 gap-2"><Input type="time" defaultValue="23:00" aria-label="免打扰开始时间" /><Input type="time" defaultValue="08:00" aria-label="免打扰结束时间" /></div></div>
      </CardContent></Card>
    ) : preference === "通用设置" ? (
      <Card className="border-0 shadow-none"><CardContent className="space-y-4 p-3">
        <div><strong className="block text-sm">主题</strong><div className="mt-2 grid grid-cols-3 gap-2">{["跟随系统", "浅色", "深色"].map((item) => <Button key={item} type="button" variant={theme === item ? "default" : "outline"} size="sm" onClick={() => setTheme(item)}>{item}</Button>)}</div></div>
        <div className="flex items-center justify-between border-t border-border/60 pt-3"><span><strong className="block text-sm">清理缓存</strong><span className="text-xs text-muted-foreground">当前占用 36 MB</span></span><Button variant="outline" size="sm" onClick={() => showToast("缓存已清理")}>清理</Button></div>
        <ToggleRow label="仅 Wi-Fi 加载原图" description="节省移动网络流量" checked={wifiOnly} onChange={(checked) => { setWifiOnly(checked); showToast("图片网络偏好已保存") }} />
      </CardContent></Card>
    ) : preference === "帮助与客服" ? (
      <Card className="border-0 shadow-none"><CardContent className="space-y-3 p-3">
        {["如何参与社区活动？", "如何申请退款？", "学生认证如何保护隐私？"].map((question) => <button key={question} type="button" className="flex w-full items-center justify-between border-b border-border/60 py-2 text-left text-sm" onClick={() => showToast("已展开常见问题说明")}>{question}<ChevronRight size={16} className="text-muted-foreground" /></button>)}
        <Input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="输入你的意见或问题" />
        <Button className="w-full" type="button" disabled={!feedback.trim()} onClick={() => { setFeedback(""); showToast("反馈已提交") }}>提交反馈</Button>
        <Button className="w-full" type="button" variant="outline" onClick={() => showToast("正在发起在线客服会话")}>在线客服</Button>
      </CardContent></Card>
    ) : (
      <Card className="border-0 shadow-none"><CardContent className="space-y-3 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-secondary p-3"><ShieldCheck className="text-primary" size={20} /><span><strong className="block text-sm">趣汇 1.0.0</strong><span className="text-xs text-muted-foreground">已是最新版本</span></span></div>
        <Button className="w-full" type="button" variant="outline" onClick={() => showToast("当前已是最新版本")}>检查更新</Button>
        <button type="button" className="flex w-full items-center justify-between py-2 text-left text-sm" onClick={() => showToast("已打开服务协议说明")}>服务协议 <ChevronRight size={16} /></button>
        <button type="button" className="flex w-full items-center justify-between py-2 text-left text-sm" onClick={() => showToast("已打开隐私政策说明")}>隐私政策 <ChevronRight size={16} /></button>
      </CardContent></Card>
    )

  return (
    <div className="page-content">
      <PageHeader title={preference} leading={<IconButton label="返回" onClick={onBack}><ArrowLeft size={18} /></IconButton>} />
      <p className="mb-4 text-xs leading-5 text-muted-foreground">设置会即时保存到当前账号，并在变更后给出反馈。</p>
      {content}
      {toast ? <div className="recommend-toast" role="status" aria-live="polite"><CheckCheck size={15} /> {toast}</div> : null}
    </div>
  )
}
