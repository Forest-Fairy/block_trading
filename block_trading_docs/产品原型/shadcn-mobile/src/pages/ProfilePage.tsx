import { useEffect, useRef, useState } from "react"
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Edit3,
  Eye,
  GraduationCap,
  Headphones,
  Info,
  LockKeyhole,
  LogOut,
  QrCode,
  Settings,
  ShieldCheck,
  TicketPercent,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  type MiniProgram,
  miniProgramCatalog,
  MINI_PROGRAM_ONLY_CURRENT_GENDER,
} from "@/prototype/data"
import { IconButton, PageHeader } from "@/components/prototype-shell"

export function ProfilePage({
  campusMode,
  onCampusModeChange,
  studentVerified,
  onCompleteStudentVerification,
}: {
  campusMode: boolean
  onCampusModeChange: (enabled: boolean) => void
  studentVerified: boolean
  onCompleteStudentVerification: () => void
}) {
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [studentVerifyOpen, setStudentVerifyOpen] = useState(false)
  const [studentSchool, setStudentSchool] = useState("杭州大学")
  const [studentNumber, setStudentNumber] = useState("")
  const [code, setCode] = useState("")
  const [redeemed, setRedeemed] = useState(false)
  const [miniProgramToast, setMiniProgramToast] = useState("")
  const [miniPrograms, setMiniPrograms] = useState<MiniProgram[]>([])
  const [miniProgramQueriedAt, setMiniProgramQueriedAt] = useState<
    number | null
  >(null)
  const miniProgramQueryAtRef = useRef(0)
  const currentGender: MiniProgram["genderScope"] = "female"

  useEffect(() => {
    const queryMiniPrograms = () => {
      const now = Date.now()
      if (now - miniProgramQueryAtRef.current < 60_000) return

      // 一分钟内复用已查询列表，避免同一页面重复请求小程序列表接口。
      miniProgramQueryAtRef.current = now
      const response = miniProgramCatalog
        .filter(
          (item) =>
            !MINI_PROGRAM_ONLY_CURRENT_GENDER ||
            item.genderScope === "all" ||
            item.genderScope === currentGender
        )
        .sort((left, right) => {
          if (left.favorite !== right.favorite) {
            return left.favorite ? -1 : 1
          }
          const leftOrder = left.sortOrder ?? Number.POSITIVE_INFINITY
          const rightOrder = right.sortOrder ?? Number.POSITIVE_INFINITY
          if (leftOrder !== rightOrder) return leftOrder - rightOrder
          if (left.usageFrequency !== right.usageFrequency) {
            return right.usageFrequency - left.usageFrequency
          }
          return right.trafficHeat - left.trafficHeat
        })
      setMiniPrograms(response)
      setMiniProgramQueriedAt(now)
    }

    const initialQuery = window.setTimeout(queryMiniPrograms, 0)
    const refreshTimer = window.setInterval(queryMiniPrograms, 60_000)
    return () => {
      window.clearTimeout(initialQuery)
      window.clearInterval(refreshTimer)
    }
  }, [])

  const miniProgramQueryLabel = miniProgramQueriedAt
    ? `最近查询 ${new Date(miniProgramQueriedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
    : "正在查询"
  const settings = [
    [LockKeyhole, "账号与安全", "登录设备、验证方式"],
    [Eye, "隐私设置", "位置、推荐和陌生人消息"],
    [Bell, "消息通知", "接收方式和提醒时段"],
    [Settings, "通用设置", "主题、语言和缓存"],
    [Headphones, "帮助与客服", "常见问题和在线支持"],
    [Info, "关于趣汇", "版本 1.0.0"],
  ] as const
  return (
    <div className="page-content">
      <PageHeader
        eyebrow="管理你的趣汇生活"
        title="我的"
        action={
          <IconButton label="编辑个人资料">
            <Edit3 size={17} />
          </IconButton>
        }
      />
      <Card className="mb-4 overflow-hidden border-0 bg-[#e5efe8] shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="size-14 after:border-white">
              <AvatarImage
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
                alt="林知夏"
              />
              <AvatarFallback>林</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">林知夏</h2>
                <Badge
                  className="border-0 bg-white/80 text-[10px] text-primary"
                  variant="outline"
                >
                  <ShieldCheck size={11} /> 已认证
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                杭州 · 让每次相遇都变得有趣
              </p>
            </div>
            <ChevronRight size={18} className="text-primary" />
          </div>
          <div className="mt-5 grid grid-cols-4 divide-x divide-[#cbdccd] text-center">
            <div>
              <strong className="block text-lg">6</strong>
              <span className="text-[10px] text-muted-foreground">
                我发起的
              </span>
            </div>
            <div>
              <strong className="block text-lg">12</strong>
              <span className="text-[10px] text-muted-foreground">
                我参与的
              </span>
            </div>
            <div>
              <strong className="block text-lg">4</strong>
              <span className="text-[10px] text-muted-foreground">
                商城订单
              </span>
            </div>
            <div>
              <strong className="block text-lg">18</strong>
              <span className="text-[10px] text-muted-foreground">收藏</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <section className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">更多趣汇小程序</h2>
          <button
            type="button"
            className="flex min-h-8 items-center gap-0.5 text-xs text-muted-foreground"
            onClick={() => {
              setMiniProgramToast("小程序列表将在一分钟后自动更新")
              window.setTimeout(() => setMiniProgramToast(""), 2200)
            }}
          >
            探索更多 <ChevronRight size={14} />
          </button>
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">
          {miniProgramQueryLabel} · 当前性别适用
        </p>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {miniPrograms.map(({ Icon, label, description }) => (
            <button
              key={label}
              type="button"
              className="flex min-h-[92px] w-[112px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-white px-2 py-3 text-center transition hover:border-primary/40"
              onClick={() => {
                setMiniProgramToast(`已打开${label}`)
                window.setTimeout(() => setMiniProgramToast(""), 2200)
              }}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon size={17} />
              </span>
              <span>
                <strong className="block text-xs">{label}</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <button
        type="button"
        onClick={() => setRedeemOpen(true)}
        className="mb-6 flex w-full items-center gap-3 rounded-lg border border-[#f1d99a] bg-[var(--qh-yellow-soft)] p-3 text-left transition hover:border-[#d4aa45]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f3bf54] text-[#644b18]">
          <TicketPercent size={19} />
        </span>
        <span className="flex-1">
          <strong className="block text-sm">兑换码</strong>
          <span className="mt-1 block text-xs text-muted-foreground">
            输入兑换码，领取你的专属权益
          </span>
        </span>
        <ChevronRight size={17} className="text-[#9b741d]" />
      </button>
      <div className="mb-3">
        <h2 className="section-title">偏好设置</h2>
      </div>
      <Card className="overflow-hidden border-0 shadow-none">
        {settings.map(([Icon, label, description], index) => (
          <button
            key={label}
            type="button"
            className={`flex w-full items-center gap-3 px-3 py-3.5 text-left transition hover:bg-muted ${index !== settings.length - 1 ? "border-b border-border/60" : ""}`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <Icon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">{label}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">
                {description}
              </span>
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
      </Card>
      <section className="mt-5 mb-5 rounded-lg border border-border bg-white p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <GraduationCap size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">学生认证</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              {studentVerified ? "杭州大学 · 已认证" : "认证后可开启校园版"}
            </span>
          </span>
          <Button
            type="button"
            variant={studentVerified ? "secondary" : "outline"}
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => {
              if (studentVerified) {
                setMiniProgramToast("学生认证信息仅你自己可见")
                window.setTimeout(() => setMiniProgramToast(""), 2200)
                return
              }
              setStudentVerifyOpen(true)
            }}
          >
            {studentVerified ? "仅自己可见" : "去认证"}
          </Button>
        </div>
        <div className="mt-3 border-t border-border/70 pt-3">
          <label className="flex items-center justify-between gap-3">
            <span>
              <strong className="block text-sm">校园版</strong>
              <span className="mt-1 block text-xs text-muted-foreground">
                {studentVerified
                  ? "按校区优化内容可见范围"
                  : "完成学生认证后可开启"}
              </span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={campusMode}
                disabled={!studentVerified}
                aria-label="开启校园版"
                onChange={(event) => {
                  onCampusModeChange(event.target.checked)
                  setMiniProgramToast(
                    event.target.checked ? "校园版已开启" : "校园版已关闭"
                  )
                  window.setTimeout(() => setMiniProgramToast(""), 2200)
                }}
              />
              <span className="block h-6 w-11 rounded-full bg-muted-foreground/30 transition peer-checked:bg-primary peer-disabled:opacity-50" />
              <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </span>
          </label>
          <p className="mt-3 rounded-lg bg-muted p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            学生认证仅自身可见。开启校园版后，新发帖子默认仅同校可见；内容列表除本人和关注用户发布外，仅展示同校区内容。
          </p>
        </div>
      </section>
      <Button
        type="button"
        variant="ghost"
        className="mb-5 w-full text-muted-foreground"
      >
        <LogOut size={16} /> 退出登录
      </Button>
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>兑换专属权益</DialogTitle>
            <DialogDescription>
              兑换成功后，权益会自动绑定到当前账号。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="输入 12 位兑换码"
              maxLength={12}
            />
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <QrCode size={16} className="text-primary" />{" "}
              也可以扫描活动方提供的二维码
            </div>
            {redeemed ? (
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-xs font-semibold text-primary">
                <CheckCheck size={16} /> 兑换成功：周末礼包已加入你的账户
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRedeemOpen(false)}
            >
              稍后再说
            </Button>
            <Button
              type="button"
              disabled={code.length < 6}
              onClick={() => setRedeemed(true)}
            >
              确认兑换
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={studentVerifyOpen} onOpenChange={setStudentVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>学生认证</DialogTitle>
            <DialogDescription>
              认证信息仅用于校园身份核验，认证结果只对你本人可见。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={studentSchool}
              onChange={(event) => setStudentSchool(event.target.value)}
              placeholder="学校名称"
            />
            <Input
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              placeholder="学生证号"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStudentVerifyOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={
                !studentSchool.trim() || studentNumber.trim().length < 4
              }
              onClick={() => {
                onCompleteStudentVerification()
                setStudentVerifyOpen(false)
                setMiniProgramToast("学生认证已完成")
                window.setTimeout(() => setMiniProgramToast(""), 2200)
              }}
            >
              完成认证
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {miniProgramToast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {miniProgramToast}
        </div>
      ) : null}
    </div>
  )
}
