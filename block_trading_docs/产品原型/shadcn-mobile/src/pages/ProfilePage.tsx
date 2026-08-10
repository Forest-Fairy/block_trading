import { type CSSProperties, useEffect, useRef, useState } from "react"
import {
  Bell,
  Camera,
  CheckCheck,
  ChevronRight,
  Eye,
  Edit3,
  GraduationCap,
  GripVertical,
  Headphones,
  Info,
  LockKeyhole,
  LogOut,
  MapPin,
  Plus,
  QrCode,
  Save,
  Settings,
  ShieldCheck,
  Star,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  type MiniProgram,
  miniProgramCatalog,
  MINI_PROGRAM_ONLY_CURRENT_GENDER,
  membershipTiers,
  type MembershipTier,
  type ViewerMode,
  type PreferenceKey,
} from "@/prototype/data"
import { IconButton } from "@/components/prototype-shell"
import { ProfileContentPanel } from "@/components/profile-content-panel"

type MiniProgramGroup = {
  group: string
  label: string
  labelVisible: boolean
  apps: string[]
}

function ProfileSummaryMarquee({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  const containerRef = useRef<HTMLSpanElement | null>(null)
  const [scrollDistance, setScrollDistance] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const updateDistance = () => {
      setScrollDistance(Math.max(0, container.scrollWidth - container.clientWidth))
    }
    const animationFrame = window.requestAnimationFrame(updateDistance)
    const resizeObserver = new ResizeObserver(updateDistance)
    resizeObserver.observe(container)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [children])

  return (
    <span ref={containerRef} className={`profile-summary-marquee ${className ?? ""}`}>
      <span
        className={scrollDistance ? "profile-summary-marquee-track" : "whitespace-nowrap"}
        style={
          scrollDistance
            ? ({ "--profile-scroll-distance": `-${scrollDistance}px` } as CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </span>
  )
}

export function ProfilePage({
  campusMode,
  onCampusModeChange,
  studentVerified,
  onCompleteStudentVerification,
  viewerMode,
  membershipTier,
  checkedIn,
  onCheckIn,
  onOpenMembership,
  onOpenPreferenceDetail,
}: {
  campusMode: boolean
  onCampusModeChange: (enabled: boolean) => void
  studentVerified: boolean
  onCompleteStudentVerification: () => void
  viewerMode: ViewerMode
  membershipTier: MembershipTier
  checkedIn: boolean
  onCheckIn: () => boolean
  onOpenMembership: () => void
  onOpenPreferenceDetail: (preference: PreferenceKey) => void
}) {
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [studentVerifyOpen, setStudentVerifyOpen] = useState(false)
  const [studentSchool, setStudentSchool] = useState("杭州大学")
  const [studentNumber, setStudentNumber] = useState("")
  const [code, setCode] = useState("")
  const [redeemed, setRedeemed] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false)
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState("")
  const [profileDisplayName, setProfileDisplayName] = useState("林知夏")
  const [profileUsername, setProfileUsername] = useState("linzhixia")
  const [profileBio, setProfileBio] = useState("让每次相遇都变得有趣")
  const [profileDraftName, setProfileDraftName] = useState("林知夏")
  const [profileDraftUsername, setProfileDraftUsername] = useState("linzhixia")
  const [profileDraftBio, setProfileDraftBio] = useState("让每次相遇都变得有趣")
  const [profileAvatar, setProfileAvatar] = useState(
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=85"
  )
  const [profileDraftAvatar, setProfileDraftAvatar] = useState(profileAvatar)
  const [miniProgramToast, setMiniProgramToast] = useState("")
  const [miniPrograms, setMiniPrograms] = useState<MiniProgram[]>([])
  const [miniProgramDrawerOpen, setMiniProgramDrawerOpen] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [miniProgramLayoutMode, setMiniProgramLayoutMode] = useState(false)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryLabel, setNewCategoryLabel] = useState("")
  const miniProgramLongPressRef = useRef<number | null>(null)
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null)
  const [miniProgramGroups, setMiniProgramGroups] = useState<MiniProgramGroup[]>([
    {
      group: "default",
      label: "默认分组",
      labelVisible: false,
      apps: miniProgramCatalog.map((item) => item.id),
    },
  ])
  const [, setMiniProgramQueriedAt] = useState<number | null>(null)
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

  const showToast = (message: string) => {
    setMiniProgramToast(message)
    window.setTimeout(() => setMiniProgramToast(""), 2200)
  }
  const handleCheckIn = () => {
    if (!onCheckIn()) {
      showToast("今日已签到")
      return
    }
    showToast(
      `签到成功，积分+${membershipTiers[membershipTier].dailyCheckInPoints}`
    )
  }

  const openProfileEditor = () => {
    setProfileDraftName(profileDisplayName)
    setProfileDraftUsername(profileUsername)
    setProfileDraftBio(profileBio)
    setProfileDraftAvatar(profileAvatar)
    setProfileEditOpen(true)
  }

  const openAvatarPreview = (src: string) => {
    setAvatarPreviewSrc(src)
    setAvatarPreviewOpen(true)
  }

  const selectProfileAvatar = (file?: File) => {
    if (!file) return
    setProfileDraftAvatar(URL.createObjectURL(file))
  }

  const saveProfileSummary = () => {
    const name = profileDraftName.trim().slice(0, 20)
    const username = profileDraftUsername.trim().replace(/^@/, "").slice(0, 30)
    const bio = profileDraftBio.trim().slice(0, 80)
    if (!name || !username) {
      setMiniProgramToast("请填写用户昵称和用户名")
      window.setTimeout(() => setMiniProgramToast(""), 2200)
      return
    }
    setProfileDisplayName(name)
    setProfileUsername(username)
    setProfileBio(bio)
    setProfileAvatar(profileDraftAvatar)
    setProfileEditOpen(false)
    setMiniProgramToast("个人资料已保存")
    window.setTimeout(() => setMiniProgramToast(""), 2200)
  }
  const beginMiniProgramLongPress = () => {
    if (miniProgramLayoutMode) return
    miniProgramLongPressRef.current = window.setTimeout(() => {
      setMiniProgramLayoutMode(true)
      showToast("已进入布局模式，可调整小程序分类和顺序")
    }, 550)
  }
  const cancelMiniProgramLongPress = () => {
    if (miniProgramLongPressRef.current !== null) {
      window.clearTimeout(miniProgramLongPressRef.current)
      miniProgramLongPressRef.current = null
    }
  }
  const toggleMiniProgramFavorite = (id: string) => {
    setMiniPrograms((items) =>
      items.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    )
  }
  const moveMiniProgramToGroup = (id: string, targetGroup: string) => {
    setMiniProgramGroups((groups) =>
      groups.map((group) => ({
        ...group,
        apps:
          group.group === targetGroup
            ? [...group.apps.filter((appId) => appId !== id), id]
            : group.apps.filter((appId) => appId !== id),
      }))
    )
  }
  const shiftMiniProgram = (id: string, direction: -1 | 1) => {
    setMiniProgramGroups((groups) =>
      groups.map((group) => {
        const index = group.apps.indexOf(id)
        if (index < 0) return group
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= group.apps.length) return group
        const apps = [...group.apps]
        ;[apps[index], apps[targetIndex]] = [apps[targetIndex], apps[index]]
        return { ...group, apps }
      })
    )
  }
  const saveMiniProgramLayout = () => {
    const appMap = new Map(miniPrograms.map((item) => [item.id, item]))
    const orderedIds = miniProgramGroups.flatMap((group) => group.apps)
    const ordered: MiniProgram[] = orderedIds.flatMap((id, index) => {
      const item = appMap.get(id)
      return item
        ? [
            {
              ...item,
              group:
                miniProgramGroups.find((group) => group.apps.includes(id))
                  ?.group ?? item.group,
              sortOrder: index + 1,
            },
          ]
        : []
    })
    setMiniPrograms(ordered)
    setMiniProgramLayoutMode(false)
    showToast("小程序布局已保存")
  }
  const addMiniProgramCategory = () => {
    const label = newCategoryLabel.trim()
    if (!label) return
    setMiniProgramGroups((groups) => [
      ...groups,
      { group: `custom-${Date.now()}`, label, labelVisible: true, apps: [] },
    ])
    setNewCategoryLabel("")
    setNewCategoryOpen(false)
    showToast(`已新增分类：${label}`)
  }
  const settings = [
    [LockKeyhole, "账号与安全", "登录设备、验证方式"],
    [Eye, "隐私设置", "位置、推荐和陌生人消息"],
    [Bell, "消息通知", "接收方式和提醒时段"],
    [Settings, "通用设置", "主题、语言和缓存"],
    [Headphones, "帮助与客服", "常见问题和在线支持"],
    [Info, "关于趣汇", "版本 1.0.0"],
  ] as const
  const favoriteMiniPrograms = miniPrograms.filter((item) => item.favorite)
  return (
    <div className="page-content">
      <section className="relative mb-4 pt-[2.75rem]">
        <p className="absolute top-0 left-0 z-10 text-sm leading-5 font-semibold text-primary whitespace-nowrap">
          趣汇，让生活充满品味
        </p>
        {viewerMode === "member" ? (
          <div className="absolute top-0 right-3 z-10">
            <IconButton
              label="打开设置"
              className="size-[1.65rem] border-0 bg-white/85 text-primary hover:bg-white"
              onClick={() => setSettingsPanelOpen(true)}
            >
              <Settings size={14} />
            </IconButton>
          </div>
        ) : null}
        <Card className="relative gap-0 overflow-visible rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[1.35rem] right-0 bottom-0 left-0 z-0 rounded-xl bg-[#e5efe8] ring-1 ring-foreground/10"
          />
          <button
            type="button"
            aria-label="预览头像"
            className="absolute left-[0.4rem] z-20 flex size-[4.7rem] items-center justify-center"
            style={{ top: "-0.15rem" }}
            onClick={() => openAvatarPreview(profileAvatar)}
          >
            <Avatar className="size-full after:border-white">
              <AvatarImage src={profileAvatar} alt={profileDisplayName} />
              <AvatarFallback>林</AvatarFallback>
            </Avatar>
          </button>
          <CardContent className="relative z-10 px-0 pt-[1.35rem] pb-[3px]">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] grid-rows-[3.2rem_auto_auto] gap-x-2">
              <div className="col-start-2 row-start-1 flex min-w-0 self-stretch flex-col justify-end">
                <h2 className="text-lg font-extrabold leading-tight">
                  <ProfileSummaryMarquee>
                    {viewerMode === "guest" ? "游客" : profileDisplayName}
                  </ProfileSummaryMarquee>
                </h2>
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                  <ProfileSummaryMarquee>{profileUsername}</ProfileSummaryMarquee>
                </p>
              </div>
              {viewerMode === "member" ? (
                <div className="col-start-3 row-start-1 flex items-end justify-end pr-3" onClick={(event) => event.stopPropagation()}>
                  <IconButton
                    label="编辑个人资料"
                    className="size-8 border-0 bg-white/85 text-primary hover:bg-white"
                    onClick={openProfileEditor}
                  >
                    <Edit3 size={15} />
                  </IconButton>
                </div>
              ) : null}
              <div className="col-start-1 row-start-2 flex flex-col items-center gap-1 pt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5 whitespace-nowrap">
                  <Star size={10} className="fill-[#f3bf54] text-[#c48a13]" /> 好评率 98%
                </span>
                <span className="flex items-center gap-0.5 whitespace-nowrap">
                  <MapPin size={10} className="text-primary" /> 杭州 · 西湖区
                </span>
                <div className="flex flex-wrap justify-center gap-1">
                  {viewerMode === "member" && studentVerified ? (
                    <Badge className="border-0 bg-white/80 text-[10px] text-primary" variant="outline">
                      <ShieldCheck size={11} /> 杭州大学 · 西湖校区
                    </Badge>
                  ) : null}
                </div>
              </div>
              <p className="col-span-2 col-start-2 row-start-2 min-w-0 self-start pt-2 text-xs leading-4 text-muted-foreground">
                <ProfileSummaryMarquee>
                  {viewerMode === "guest" ? "附近公开内容预览" : profileBio}
                </ProfileSummaryMarquee>
              </p>
                <div className="col-span-3 row-start-3 mt-1 flex items-center gap-2 border-t border-[#cbdccd] px-3 py-2">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={(event) => {
                event.stopPropagation()
                onOpenMembership()
              }}
            >
              <span>
                <span className="block text-xs font-semibold text-primary">会员等级</span>
                <strong className="mt-1 block text-base">VIP {membershipTier}</strong>
              </span>
            </button>
            {viewerMode === "member" ? (
              <Button
                type="button"
                size="sm"
                className={`h-8 min-w-[5.6rem] px-2 text-[10px] whitespace-nowrap ${
                  checkedIn
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-[#d9a321] text-white hover:bg-[#c28f17]"
                }`}
                onClick={(event) => {
                  event.stopPropagation()
                  handleCheckIn()
                }}
              >
                {checkedIn
                  ? "今日已签到"
                  : `签到 +${membershipTiers[membershipTier].dailyCheckInPoints}`}
              </Button>
            ) : null}
            <button
              type="button"
              className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground transition hover:text-primary"
              onClick={(event) => {
                event.stopPropagation()
                onOpenMembership()
              }}
            >
              查看等级权益 <ChevronRight size={15} className="text-primary" />
            </button>
                </div>
            </div>
          </CardContent>
        </Card>
      </section>
      {viewerMode === "member" ? (
        <>
          <section className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">更多趣汇小程序</h2>
              <button
                type="button"
                className="flex min-h-8 items-center gap-0.5 text-xs text-muted-foreground"
                onClick={() => setMiniProgramDrawerOpen(true)}
              >
                探索更多 <ChevronRight size={14} />
              </button>
            </div>
            {favoriteMiniPrograms.length ? (
              <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                {favoriteMiniPrograms.map(({ Icon, label, description }) => (
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
            ) : null}
          </section>
          <Sheet
            open={miniProgramDrawerOpen}
            onOpenChange={(open) => {
              setMiniProgramDrawerOpen(open)
              if (!open) setMiniProgramLayoutMode(false)
            }}
          >
            <SheetContent
              side="right"
              className="w-[min(94vw,420px)] overflow-y-auto p-0"
            >
              <SheetHeader className="border-b border-border/70">
                <div className="flex items-center justify-between gap-2 pr-8">
                  <div>
                    <SheetTitle>探索更多</SheetTitle>
                    <SheetDescription>
                      收藏常用小程序，长按可进入布局模式。
                    </SheetDescription>
                  </div>
                  {miniProgramLayoutMode ? (
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 px-2 text-[10px]"
                        onClick={() => setNewCategoryOpen(true)}
                      >
                        <Plus size={13} /> 新增分类
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-1 px-2 text-[10px]"
                        onClick={saveMiniProgramLayout}
                      >
                        <Save size={13} /> 保存
                      </Button>
                    </div>
                  ) : null}
                </div>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6 pt-4">
                {miniProgramGroups.map((group) => {
                  const items = group.apps
                    .map((id) => miniPrograms.find((item) => item.id === id))
                    .filter((item): item is MiniProgram => item !== undefined)
                  if (!items.length) return null
                  return (
                    <section key={group.group}>
                      {group.labelVisible || miniProgramLayoutMode ? (
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary">
                            {group.label}
                          </span>
                          {miniProgramLayoutMode ? (
                            <span className="text-[10px] text-muted-foreground">
                              {items.length} 个小程序
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="grid grid-cols-2 gap-2">
                        {items.map(({ Icon, id, label, description, favorite }) => {
                          const currentGroup = miniProgramGroups.find((item) =>
                            item.apps.includes(id)
                          )?.group
                          return (
                            <div
                              key={id}
                              className={`relative rounded-lg border bg-white p-3 transition ${miniProgramLayoutMode ? "border-primary/40 ring-1 ring-primary/10" : "border-border"}`}
                              onPointerDown={beginMiniProgramLongPress}
                              onPointerUp={cancelMiniProgramLongPress}
                              onPointerLeave={cancelMiniProgramLongPress}
                              onPointerCancel={cancelMiniProgramLongPress}
                            >
                              {miniProgramLayoutMode ? (
                                <GripVertical
                                  size={14}
                                  className="absolute left-2 top-2 text-primary"
                                />
                              ) : null}
                              <button
                                type="button"
                                className="absolute right-2 top-2 flex items-center gap-0.5 text-[10px] text-muted-foreground"
                                aria-label={favorite ? `取消收藏${label}` : `收藏${label}`}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => toggleMiniProgramFavorite(id)}
                              >
                                <Star
                                  size={14}
                                  className={
                                    favorite
                                      ? "fill-[#f3bf54] text-[#bd8a24]"
                                      : "text-muted-foreground"
                                  }
                                />
                                <span>{favorite ? "取消收藏" : "收藏"}</span>
                              </button>
                              <button
                                type="button"
                                className="flex w-full flex-col items-center gap-2 pt-3 text-center"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => showToast(`已打开${label}`)}
                              >
                                <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                                  <Icon size={20} />
                                </span>
                                <span>
                                  <strong className="block text-xs">{label}</strong>
                                  <span className="mt-1 block text-[10px] text-muted-foreground">
                                    {description}
                                  </span>
                                </span>
                              </button>
                              {miniProgramLayoutMode ? (
                                <div className="mt-3 space-y-2 border-t border-border/70 pt-2">
                                  <select
                                    value={currentGroup}
                                    aria-label={`${label}所属分类`}
                                    className="h-8 w-full rounded-md border border-border bg-white px-2 text-[10px]"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onChange={(event) =>
                                      moveMiniProgramToGroup(id, event.target.value)
                                    }
                                  >
                                    {miniProgramGroups.map((option) => (
                                      <option key={option.group} value={option.group}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="grid grid-cols-2 gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[10px]"
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onClick={() => shiftMiniProgram(id, -1)}
                                    >
                                      上移
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[10px]"
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onClick={() => shiftMiniProgram(id, 1)}
                                    >
                                      下移
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
              <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新增分类</DialogTitle>
                    <DialogDescription>保存后可在布局模式中移动小程序。</DialogDescription>
                  </DialogHeader>
                  <Input
                    value={newCategoryLabel}
                    onChange={(event) => setNewCategoryLabel(event.target.value)}
                    placeholder="例如：生活服务"
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setNewCategoryOpen(false)}>
                      取消
                    </Button>
                    <Button type="button" disabled={!newCategoryLabel.trim()} onClick={addMiniProgramCategory}>
                      新增分类
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </SheetContent>
          </Sheet>
          <Sheet open={settingsPanelOpen} onOpenChange={setSettingsPanelOpen}>
            <SheetContent side="right" className="w-[min(92vw,400px)] overflow-y-auto p-0">
              <SheetHeader className="border-b border-border/70">
                <SheetTitle>设置</SheetTitle>
                <SheetDescription>管理账号、隐私和应用偏好。</SheetDescription>
              </SheetHeader>
              <div className="p-3">
                <Card className="gap-0 overflow-hidden border-0 py-0 shadow-none">
                  <CardContent className="p-0">
                    {settings.map(([Icon, label, description], index) => (
                      <button
                        key={label}
                        type="button"
                        className={`flex w-full items-center gap-3 px-3 py-3.5 text-left transition hover:bg-muted ${index !== settings.length - 1 ? "border-b border-border/60" : ""}`}
                        onClick={() => {
                          setSettingsPanelOpen(false)
                          onOpenPreferenceDetail(label)
                        }}
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
                  </CardContent>
                </Card>
                <section className="mt-3 rounded-lg border border-border bg-white p-3">
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
                  className="mt-3 w-full text-muted-foreground"
                  onClick={() => {
                    setSettingsPanelOpen(false)
                    setMiniProgramToast("已退出登录（原型预览）")
                    window.setTimeout(() => setMiniProgramToast(""), 2200)
                  }}
                >
                  <LogOut size={16} /> 退出登录
                </Button>
              </div>
            </SheetContent>
          </Sheet>
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
          <ProfileContentPanel />
          <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑个人资料</DialogTitle>
                <DialogDescription>更新后会同步显示在“我的”个人信息卡。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <button
                    type="button"
                    aria-label="预览编辑头像"
                    className="shrink-0"
                    onClick={() => openAvatarPreview(profileDraftAvatar)}
                  >
                    <Avatar className="size-16 after:border-white">
                      <AvatarImage src={profileDraftAvatar} alt={profileDraftName} />
                      <AvatarFallback>林</AvatarFallback>
                    </Avatar>
                  </button>
                  <div>
                    <p className="text-sm font-semibold">头像</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => profileAvatarInputRef.current?.click()}
                    >
                      <Camera size={15} /> 更换头像
                    </Button>
                    <input
                      ref={profileAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="选择头像图片"
                      onChange={(event) => selectProfileAvatar(event.target.files?.[0])}
                    />
                  </div>
                </div>
                <label className="block space-y-1">
                  <span className="text-[10px] text-muted-foreground">用户昵称</span>
                  <Input
                    value={profileDraftName}
                    maxLength={20}
                    aria-label="用户昵称"
                    placeholder="用户昵称"
                    onChange={(event) => setProfileDraftName(event.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] text-muted-foreground">用户名</span>
                  <Input
                    value={profileDraftUsername}
                    maxLength={30}
                    aria-label="用户名"
                    placeholder="用户名"
                    onChange={(event) => setProfileDraftUsername(event.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] text-muted-foreground">个性签名</span>
                  <Input
                    value={profileDraftBio}
                    maxLength={80}
                    aria-label="个性签名"
                    placeholder="个性签名"
                    onChange={(event) => setProfileDraftBio(event.target.value)}
                  />
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProfileEditOpen(false)}>
                  取消
                </Button>
                <Button type="button" onClick={saveProfileSummary}>
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={avatarPreviewOpen} onOpenChange={setAvatarPreviewOpen}>
            <DialogContent className="max-w-[min(92vw,360px)] overflow-hidden p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>头像预览</DialogTitle>
              </DialogHeader>
              <img
                src={avatarPreviewSrc}
                alt="头像预览"
                className="aspect-square w-full object-cover"
              />
            </DialogContent>
          </Dialog>
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
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
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
                  申请认证
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {miniProgramToast ? (
            <div className="recommend-toast" role="status" aria-live="polite">
              {miniProgramToast}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
