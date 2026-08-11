import { useEffect, useRef, useState } from "react"
import {
  CheckCheck,
  ChevronRight,
  Clock3,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  QrCode,
  RefreshCw,
  Share2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ThumbsDown,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  type ActivityType,
  imageUrls,
  activities,
  isActivityVisible,
  participantSummary,
  orderUpdates,
  products,
  type RecommendationItem,
  type ViewerMode,
} from "@/prototype/data"
import { IconButton } from "@/components/prototype-shell"

export function RecommendPage({
  onOpenMessages,
  onOpenSearch,
  onOpenPostDetail,
  onOpenProductDetail,
  campusMode,
  viewerMode,
  assistantDocked,
  onReleaseAssistant,
  onMoveReleasedAssistant,
  onEndReleasedAssistant,
}: {
  onOpenMessages: () => void
  onOpenSearch: () => void
  onOpenPostDetail: (activityId: string) => void
  onOpenProductDetail: (productId: string) => void
  campusMode: boolean
  viewerMode: ViewerMode
  assistantDocked: boolean
  onReleaseAssistant: (pointer: { x: number; y: number; pointerId: number }) => void
  onMoveReleasedAssistant: (pointer: { x: number; y: number; pointerId: number }) => void
  onEndReleasedAssistant: (pointer: { x: number; y: number; pointerId: number }) => void
}) {
  const [filter, setFilter] = useState("关注")
  const [scanOpen, setScanOpen] = useState(false)
  const [scanError, setScanError] = useState("")
  const [scanActive, setScanActive] = useState(false)
  const [recommendFilterOpen, setRecommendFilterOpen] = useState(false)
  const [recommendFilters, setRecommendFilters] = useState<
    Record<string, string>
  >({})
  const [city, setCity] = useState("杭州")
  const [cityOpen, setCityOpen] = useState(false)
  const [actionItem, setActionItem] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [undoId, setUndoId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  const [dockPinned, setDockPinned] = useState(false)
  const [dockPinPosition, setDockPinPosition] = useState<{ left: number; top: number } | null>(null)
  const [toast, setToast] = useState("")
  const [dockHolding, setDockHolding] = useState(false)
  const recommendLoadSentinelRef = useRef<HTMLDivElement>(null)
  const recommendLoadTimerRef = useRef<number | null>(null)
  const recommendLoadPendingRef = useRef(false)
  const orderViewportRef = useRef<HTMLDivElement>(null)
  const orderAutoFrameRef = useRef<number | null>(null)
  const orderManualUntilRef = useRef(0)
  const scanVideoRef = useRef<HTMLVideoElement>(null)
  const scanStreamRef = useRef<MediaStream | null>(null)
  const dockHoldTimerRef = useRef<number | null>(null)
  const dockPointerRef = useRef({ x: 0, y: 0, pointerId: 0 })
  const releasedAssistantRef = useRef(false)

  const clearDockHold = () => {
    if (dockHoldTimerRef.current) window.clearTimeout(dockHoldTimerRef.current)
    dockHoldTimerRef.current = null
    setDockHolding(false)
  }

  useEffect(() => () => clearDockHold(), [])

  const startDockHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!assistantDocked || dockHoldTimerRef.current) return
    dockPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDockHolding(true)
    dockHoldTimerRef.current = window.setTimeout(() => {
      dockHoldTimerRef.current = null
      setDockHolding(false)
      releasedAssistantRef.current = true
      onReleaseAssistant(dockPointerRef.current)
    }, 3000)
  }

  const moveReleasedAssistant = (event: React.PointerEvent<HTMLButtonElement>) => {
    dockPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
    if (releasedAssistantRef.current) onMoveReleasedAssistant(dockPointerRef.current)
  }

  const endDockPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!releasedAssistantRef.current) {
      clearDockHold()
      return
    }
    releasedAssistantRef.current = false
    onEndReleasedAssistant({
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    })
  }

  useEffect(() => {
    const orderViewport = orderViewportRef.current

    const scrollNextOrderGroup = () => {
      const viewport = orderViewport
      if (!viewport || Date.now() < orderManualUntilRef.current) return

      const groupHeight = viewport.clientHeight
      const currentGroup = Math.round(viewport.scrollTop / groupHeight)
      if (currentGroup >= 2) viewport.scrollTop = 0

      const startTop = viewport.scrollTop
      const targetTop = startTop + groupHeight
      const startedAt = performance.now()
      viewport.style.scrollSnapType = "none"

      const animate = (now: number) => {
        if (Date.now() < orderManualUntilRef.current) return

        const progress = Math.min((now - startedAt) / 1400, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        viewport.scrollTop = startTop + (targetTop - startTop) * eased

        if (progress < 1) {
          orderAutoFrameRef.current = window.requestAnimationFrame(animate)
          return
        }

        orderAutoFrameRef.current = null
        // 第三组与第一组内容相同，复位后继续保持向下循环且无视觉跳变。
        if (targetTop >= groupHeight * 2 - 1) viewport.scrollTop = 0
        viewport.style.scrollSnapType = ""
      }

      orderAutoFrameRef.current = window.requestAnimationFrame(animate)
    }

    const timer = window.setInterval(scrollNextOrderGroup, 5000)
    return () => {
      window.clearInterval(timer)
      if (orderAutoFrameRef.current !== null) {
        window.cancelAnimationFrame(orderAutoFrameRef.current)
      }
      if (orderViewport) {
        orderViewport.style.scrollSnapType = ""
      }
    }
  }, [])

  useEffect(() => {
    const phoneContent = document.querySelector<HTMLElement>(".phone-content")
    if (!phoneContent) return

    const collapseHeroAfterScroll = () => {
      if (phoneContent.scrollTop > 180) setHeroCollapsed(true)
      const pinned = phoneContent.scrollTop > 18
      setDockPinned(pinned)
      if (!pinned) return
      const shellBounds = phoneContent.closest(".phone-shell")?.getBoundingClientRect()
      if (!shellBounds) return
      setDockPinPosition({ left: shellBounds.left + 76, top: shellBounds.top + 66 })
    }

    collapseHeroAfterScroll()
    phoneContent.addEventListener("scroll", collapseHeroAfterScroll, {
      passive: true,
    })
    window.addEventListener("resize", collapseHeroAfterScroll)
    return () => {
      phoneContent.removeEventListener("scroll", collapseHeroAfterScroll)
      window.removeEventListener("resize", collapseHeroAfterScroll)
    }
  }, [])

  // 扫描面板负责完整相机生命周期，关闭后立即释放摄像头占用。
  useEffect(() => {
    if (!scanOpen) return

    let cancelled = false

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError("当前环境无法打开相机，请使用支持摄像头的设备。")
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        scanStreamRef.current = stream
        if (scanVideoRef.current) {
          scanVideoRef.current.srcObject = stream
          await scanVideoRef.current.play()
        }
        setScanActive(true)
      } catch {
        setScanError("未能打开相机，请检查相机权限后重试。")
      }
    }

    void startCamera()
    return () => {
      cancelled = true
      scanStreamRef.current?.getTracks().forEach((track) => track.stop())
      scanStreamRef.current = null
    }
  }, [scanOpen])

  const pauseOrderAutoScroll = () => {
    orderManualUntilRef.current = Date.now() + 6500
    if (orderAutoFrameRef.current !== null) {
      window.cancelAnimationFrame(orderAutoFrameRef.current)
      orderAutoFrameRef.current = null
    }
    if (orderViewportRef.current) {
      orderViewportRef.current.style.scrollSnapType = ""
    }
  }

  const feedItems: RecommendationItem[] = [
    {
      id: "snacks",
      kind: "community",
      activity: activities[0],
      reason: "距你 1.2 km · 还差 2 人",
    },
    {
      id: "bottle",
      kind: "product",
      product: products[1],
      reason: "最近浏览过通勤用品",
    },
    {
      id: "airport",
      kind: "community",
      activity: activities[1],
      reason: "你关注的出行路线",
    },
    {
      id: "game",
      kind: "community",
      activity: activities[2],
      reason: "今晚开始 · 还差 1 人",
    },
    {
      id: "travel",
      kind: "community",
      activity: activities[3],
      reason: "周末出发 · 距你 18 km",
    },
    {
      id: "racket-help",
      kind: "community",
      activity: activities[6],
      reason: "临时求助 · 距你 1.6 km",
    },
    {
      id: "backpack",
      kind: "product",
      product: products[2],
      reason: "趣汇自营 · 本周上新",
    },
  ]

  const filteredItems = feedItems
    .filter((item) => {
      if (hiddenIds.includes(item.id)) return false
      if (viewerMode === "guest" && item.kind !== "community") return false
      if (
        item.kind === "community" &&
        !isActivityVisible(item.activity, campusMode, viewerMode)
      ) {
        return false
      }
      if (filter === "商城") return item.kind === "product"
      if (
        ["拼单", "拼车", "线下组队", "线上开黑", "近邻互助"].includes(filter)
      ) {
        return item.kind === "community" && item.activity.type === filter
      }
      return true
    })
    .sort((left, right) => {
      if (filter !== "关注") return 0
      const priority: Record<ActivityType, number> = {
        拼单: 0,
        拼车: 1,
        线下组队: 2,
        线上开黑: 3,
        近邻互助: 4,
      }
      const leftRank =
        left.kind === "community" ? priority[left.activity.type] : 10
      const rightRank =
        right.kind === "community" ? priority[right.activity.type] : 10
      return leftRank - rightRank
    })
  const filteredItemCount = filteredItems.length
  const visibleItems = showMore ? filteredItems : filteredItems.slice(0, 4)
  const categoryMeta: Record<
    string,
    { title: string; description: string; sort: string }
  > = {
    关注: {
      title: "为您推荐",
      description: "优先展示你关注的人和已参与业务",
      sort: "拼单优先",
    },
    拼单: {
      title: "一起买更划算",
      description: "正在招募的购物拼单，缺口越小越靠前",
      sort: "价格优先",
    },
    拼车: {
      title: "顺路一起走",
      description: "同城路线和出发时间相近的拼车",
      sort: "出行时间优先",
    },
    线下组队: {
      title: "线下组队",
      description: "露营、徒步和运动活动，按集合时间与距离排列",
      sort: "目的地距离优先",
    },
    线上开黑: {
      title: "线上开黑",
      description: "游戏组队和线上活动，随时加入",
      sort: "开始时间优先",
    },
    近邻互助: {
      title: "近邻互助",
      description: "附近临时需要，按响应时限和距离优先",
      sort: "响应时限优先",
    },
    商城: {
      title: "趣汇自营精选",
      description: "高频生活好物，价格和库存透明",
      sort: "综合优先",
    },
  }
  const currentCategory = categoryMeta[filter]
  const currentRecommendSort = recommendFilters.sort || currentCategory.sort
  const updateRecommendFilter = (key: string, value: string) => {
    setRecommendFilters((current) => ({ ...current, [key]: value }))
  }
  const renderRecommendSortChoices = (choices: string[]) => (
    <div className="grid grid-cols-2 gap-2">
      {choices.map((choice) => (
        <Button
          key={choice}
          type="button"
          size="sm"
          variant={currentRecommendSort === choice ? "default" : "outline"}
          onClick={() => updateRecommendFilter("sort", choice)}
        >
          {choice}
        </Button>
      ))}
    </div>
  )

  // 列表末端进入视口后追加下一页；pending ref 保证同一页只触发一次模拟请求。
  useEffect(() => {
    const sentinel = recommendLoadSentinelRef.current
    if (!sentinel || showMore || filteredItemCount <= 4) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || recommendLoadPendingRef.current) return

        recommendLoadPendingRef.current = true
        setLoadingMore(true)
        recommendLoadTimerRef.current = window.setTimeout(() => {
          setShowMore(true)
          setLoadingMore(false)
          recommendLoadPendingRef.current = false
        }, 700)
      },
      { rootMargin: "0px 0px 120px" }
    )

    observer.observe(sentinel)
    return () => {
      observer.disconnect()
      if (recommendLoadTimerRef.current !== null) {
        window.clearTimeout(recommendLoadTimerRef.current)
        recommendLoadTimerRef.current = null
      }
      recommendLoadPendingRef.current = false
    }
  }, [campusMode, filter, filteredItemCount, showMore, viewerMode])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  const hideItem = (id: string, message: string) => {
    setHiddenIds((items) => [...items, id])
    setUndoId(id)
    setActionItem(null)
    showToast(message)
  }

  const refresh = () => {
    setRefreshing(true)
    setLoadingMore(false)
    recommendLoadPendingRef.current = false
    window.setTimeout(() => {
      setRefreshing(false)
      setShowMore(false)
      showToast("已更新 4 条内容")
    }, 700)
  }

  return (
    <div className="page-content">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">
            星期四 · 8 月 7 日
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-[27px] font-extrabold tracking-[-0.02em]">
              趣汇
            </h1>
            <button
              type="button"
              data-assistant-dock
              className={`assistant-dock-slot ${
                assistantDocked ? "is-docked" : ""
              } ${dockHolding ? "is-holding" : ""} ${
                dockPinned ? "is-pinned" : ""
              }`}
              style={dockPinned && dockPinPosition ? dockPinPosition : undefined}
              aria-label={
                assistantDocked
                  ? "按住三秒弹出悬浮助手"
                  : "悬浮助手原型预置位"
              }
              title={
                assistantDocked
                  ? "按住三秒弹出悬浮助手"
                  : "拖动悬浮助手到这里并停留三秒"
              }
              aria-disabled={!assistantDocked}
              onPointerDown={startDockHold}
              onPointerMove={moveReleasedAssistant}
              onPointerUp={endDockPointer}
              onPointerLeave={() => {
                if (!releasedAssistantRef.current) clearDockHold()
              }}
              onPointerCancel={() => {
                if (!releasedAssistantRef.current) clearDockHold()
              }}
            >
              <Sparkles size={16} />
            </button>
          </div>
          <button
            type="button"
            className="mt-0.5 flex min-h-11 items-center gap-1 text-left text-xs text-muted-foreground"
            onClick={() => setCityOpen(true)}
          >
            <MapPin size={13} className="text-primary" />
            <span>{city} · 今天一起去做点有趣的事</span>
            <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex gap-2">
          <IconButton
            label="扫一扫"
            onClick={() => {
              setScanError("")
              setScanActive(false)
              setScanOpen(true)
            }}
          >
            <QrCode size={18} />
          </IconButton>
          <IconButton label="搜索" onClick={onOpenSearch}>
            <Search size={18} />
          </IconButton>
        </div>
      </div>

      <Card className="mb-4 gap-0 border-0 bg-white/80 py-0 shadow-none">
        <CardContent className="p-1.5">
          <div className="mb-0.5 flex h-5 items-center justify-between px-1">
            <p className="text-xs font-bold text-foreground">订单状态</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 gap-0.5 px-1 text-[9px] font-medium text-primary"
              style={{ fontSize: 9 }}
              onClick={onOpenMessages}
            >
              查看全部 <ChevronRight size={11} />
            </Button>
          </div>
          <div
            ref={orderViewportRef}
            className="hide-scrollbar h-[92px] snap-y snap-mandatory overflow-y-auto overscroll-contain"
            aria-label="订单状态，可上下滚动，每次显示三条"
            aria-live="off"
            tabIndex={0}
            onWheel={pauseOrderAutoScroll}
            onTouchStart={pauseOrderAutoScroll}
            onPointerDown={pauseOrderAutoScroll}
            onKeyDown={pauseOrderAutoScroll}
          >
            {[0, 1, 0].map((groupIndex, copyIndex) => (
              <div
                key={`${groupIndex}-${copyIndex}`}
                className="h-[92px] snap-start space-y-1"
              >
                {[0, 1, 2].map((offset) => {
                  const item = orderUpdates[groupIndex * 3 + offset]
                  const tone = {
                    blue: "bg-[var(--qh-blue-soft)] text-[var(--qh-blue)]",
                    green: "bg-secondary text-primary",
                    yellow: "bg-[var(--qh-yellow-soft)] text-[#77551c]",
                  }[item.tone]
                  const Icon =
                    item.id === "shipping"
                      ? Truck
                      : item.id === "reminder"
                        ? Clock3
                        : PackageCheck
                  return (
                    <button
                      key={`${item.id}-${copyIndex}`}
                      type="button"
                      className="flex h-7 w-full items-center gap-2 rounded-lg bg-muted/40 px-2 py-0.5 text-left transition-colors hover:bg-muted"
                      onClick={onOpenMessages}
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md ${tone}`}
                      >
                        <Icon size={12} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {item.meta}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!hiddenIds.includes("hero") && viewerMode !== "guest" ? (
        heroCollapsed ? (
          <button
            type="button"
            className="sticky top-0 z-10 mb-3 flex w-full items-center justify-between rounded-lg border border-[#cbdccd] bg-[#e5efe8]/95 px-3 py-2 text-left text-xs font-semibold text-primary shadow-sm backdrop-blur"
            onClick={() => setHeroCollapsed(false)}
          >
            今日首推已收起 <ChevronRight size={15} />
          </button>
        ) : (
          <Card className="mb-4 h-[160px] gap-0 overflow-hidden border border-border/70 bg-white py-0 shadow-none">
            <div
              className="relative flex h-full min-h-0"
              role="button"
              tabIndex={0}
              onClick={() => onOpenPostDetail("travel")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onOpenPostDetail("travel")
                }
              }}
            >
              <div className="h-full w-[38.2%] shrink-0 overflow-hidden rounded-l-xl bg-muted">
                <img className="image-cover" src={imageUrls.hike} alt="径山徒步活动" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col py-3 pr-3 pl-3">
                <div className="flex items-center gap-2 text-xs">
                  <p className="font-extrabold text-primary">今日首推</p>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin size={12} /> 距离你 2.8 km
                  </span>
                </div>
                <h2 className="mt-1 line-clamp-2 text-[17px] leading-tight font-extrabold">
                  周日径山轻徒步
                </h2>
                <p className="mt-1 text-xs font-semibold text-primary">
                  还差 2 位同行者
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  周日 08:30 集合 · 人均约 ¥68
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  发起人：林同学 · 已认证
                </p>
                <Button
                  type="button"
                  className="mt-auto h-8 justify-between px-3 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    showToast("参与操作将在后续流程接入")
                  }}
                >
                  去参与
                  <ChevronRight size={15} />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="隐藏今日首推"
                className="absolute top-2 right-2"
                onClick={(event) => {
                  event.stopPropagation()
                  hideItem("hero", "已隐藏这条首推")
                }}
              >
                <MoreHorizontal size={16} />
              </Button>
            </div>
          </Card>
        )
      ) : null}

      <div className="hide-scrollbar mb-5 flex gap-2 overflow-x-auto pb-0.5">
        {[
          "关注",
          "拼单",
          "拼车",
          "线下组队",
          "线上开黑",
          "近邻互助",
          "商城",
        ].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setFilter(item)
              setRecommendFilters({})
              setShowMore(false)
              setLoadingMore(false)
              recommendLoadPendingRef.current = false
              showToast(`已切换到${item}推荐`)
            }}
            className={`min-h-9 shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${filter === item ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:border-primary/40"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-title">{currentCategory.title}</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {currentCategory.description} · {city}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-primary"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "更新中" : "刷新推荐"}
        </Button>
      </div>
      <div className="mb-3 flex min-h-9 items-center justify-between border-y border-border/70 py-2 text-[11px] text-muted-foreground">
        <span>{filteredItems.length} 条匹配内容</span>
        <button
          type="button"
          className="flex min-h-8 items-center gap-1 font-semibold text-foreground"
          onClick={() => setRecommendFilterOpen(true)}
        >
          <SlidersHorizontal size={13} /> {currentRecommendSort} · 筛选
        </button>
      </div>

      {visibleItems.length ? (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            if (item.kind === "community") {
              const categoryLabel = item.activity.type
              const toneClass = {
                green: "bg-secondary text-primary",
                blue: "bg-[var(--qh-blue-soft)] text-[var(--qh-blue)]",
                coral: "bg-[var(--qh-coral-soft)] text-[var(--qh-coral)]",
              }[item.activity.tone]
              return (
                <Card key={item.id} className="overflow-hidden">
                  <div
                    className="flex gap-3 p-3"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenPostDetail(item.activity.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onOpenPostDetail(item.activity.id)
                      }
                    }}
                  >
                    <div className="h-[92px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        className="image-cover"
                        src={item.activity.image}
                        alt=""
                      />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Badge
                          className={`border-0 px-2 py-0.5 text-[10px] ${toneClass}`}
                          variant="outline"
                        >
                          {categoryLabel}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground">
                            {item.reason}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`管理${item.activity.title}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setActionItem(item.id)
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </div>
                      </div>
                      <h3 className="truncate text-sm font-bold">
                        {item.activity.title}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.activity.detail}
                      </p>
                      {viewerMode === "guest" ? (
                        <p className="mt-3 truncate text-[11px] text-muted-foreground">
                          描述：
                          {(
                            item.activity.description ?? item.activity.detail
                          ).slice(0, 30)}
                        </p>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          <Progress
                            value={item.activity.progress}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-[11px] font-semibold whitespace-nowrap text-[var(--qh-coral)]">
                            {participantSummary(item.activity)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {viewerMode === "guest" ? (
                    <div className="flex items-center justify-between border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
                      <span>
                        留言 {item.activity.commentCount ?? 0} · 评论{" "}
                        {(item.activity.commentCount ?? 0) +
                          (item.activity.replyCount ?? 0)}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        onClick={() => onOpenPostDetail(item.activity.id)}
                      >
                        查看详情 <ChevronRight size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} /> 距离截止 6 小时
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        onClick={() => showToast("参与操作将在后续流程接入")}
                      >
                        去参与 <ChevronRight size={14} />
                      </Button>
                    </div>
                  )}
                </Card>
              )
            }
            if (item.kind === "product") {
              return (
                <Card key={item.id} className="overflow-hidden">
                  <div
                    className="flex gap-3 p-3"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenProductDetail(item.product.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onOpenProductDetail(item.product.id)
                      }
                    }}
                  >
                    <div className="relative size-[92px] shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        className="image-cover"
                        src={item.product.image}
                        alt={item.product.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Badge
                          className="border-0 bg-[#fff5d9] px-2 py-0.5 text-[10px] text-[#77551c]"
                          variant="outline"
                        >
                          趣汇自营 · {item.product.tag}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`管理${item.product.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            setActionItem(item.id)
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                      <h3 className="truncate text-sm font-bold">
                        {item.product.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.product.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-extrabold text-[var(--qh-coral)]">
                          ¥ {item.product.price}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenProductDetail(item.product.id)
                          }}
                          aria-label={`查看${item.product.name}详情`}
                        >
                          去看看 <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            }
          })}
        </div>
      ) : (
        <Card className="border-dashed bg-white/70 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Sparkles size={24} className="text-primary" />
            <p className="text-sm font-bold">暂时没有匹配内容</p>
            <p className="text-xs text-muted-foreground">
              换个筛选条件，或切换其他分类
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFilter("拼单")}
            >
              查看拼单活动
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredItems.length > 4 && !showMore ? (
        <div
          ref={recommendLoadSentinelRef}
          className="mt-4 flex min-h-12 items-center justify-center gap-2 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {loadingMore ? (
            <>
              <RefreshCw size={14} className="animate-spin text-primary" />
              正在加载更多内容
            </>
          ) : (
            "继续向下浏览"
          )}
        </div>
      ) : null}
      {showMore && filteredItems.length > 4 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          今天先看到这里
        </p>
      ) : null}

      <Dialog
        open={scanOpen}
        onOpenChange={(open) => {
          setScanOpen(open)
          if (!open) setScanActive(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>扫一扫</DialogTitle>
            <DialogDescription>
              将二维码放入取景框，识别后进入对应的趣汇内容。
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-[#111]">
            <video
              ref={scanVideoRef}
              className="size-full object-cover"
              autoPlay
              muted
              playsInline
              aria-label="扫一扫相机画面"
            />
            <div className="pointer-events-none absolute inset-[15%] border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.38)]" />
            {!scanActive && !scanError ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                正在打开相机...
              </div>
            ) : null}
          </div>
          {scanError ? (
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {scanError}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              对准二维码后保持稳定
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={recommendFilterOpen} onOpenChange={setRecommendFilterOpen}>
        <SheetContent
          side="right"
          className="w-[min(92vw,380px)] overflow-y-auto p-0"
        >
          <SheetHeader className="border-b border-border/70 px-4 py-4">
            <SheetTitle>{filter}筛选</SheetTitle>
            <SheetDescription>
              选择排序方式或补充指定条件，应用后更新当前列表摘要。
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 py-5">
            {filter === "关注" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  关注列表优先级
                </p>
                {renderRecommendSortChoices([
                  "拼单优先",
                  "拼车优先",
                  "线下组队优先",
                  "线上开黑优先",
                ])}
              </div>
            ) : null}
            {filter === "拼单" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    排序方式
                  </p>
                  {renderRecommendSortChoices([
                    "价格优先",
                    "数量优先",
                    "收货地点距离优先",
                    "综合优先",
                  ])}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    指定条件
                  </p>
                  <Input
                    value={recommendFilters.priceThreshold || ""}
                    onChange={(event) =>
                      updateRecommendFilter(
                        "priceThreshold",
                        event.target.value
                      )
                    }
                    placeholder="价格阈值，例如：200 元"
                  />
                  <Input
                    value={recommendFilters.receiveLocation || ""}
                    onChange={(event) =>
                      updateRecommendFilter(
                        "receiveLocation",
                        event.target.value
                      )
                    }
                    placeholder="收货地点，例如：城西"
                  />
                </div>
              </>
            ) : null}
            {filter === "拼车" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    排序方式
                  </p>
                  {renderRecommendSortChoices([
                    "上车地点优先",
                    "出行时间优先",
                    "综合优先",
                  ])}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    指定行程
                  </p>
                  <Input
                    value={recommendFilters.pickup || ""}
                    onChange={(event) =>
                      updateRecommendFilter("pickup", event.target.value)
                    }
                    placeholder="指定上车地点"
                  />
                  <Input
                    value={recommendFilters.destination || ""}
                    onChange={(event) =>
                      updateRecommendFilter("destination", event.target.value)
                    }
                    placeholder="指定目的地"
                  />
                  <Input
                    value={recommendFilters.travelTime || ""}
                    onChange={(event) =>
                      updateRecommendFilter("travelTime", event.target.value)
                    }
                    placeholder="指定出行时间，例如：今天 18:00"
                  />
                </div>
              </>
            ) : null}
            {filter === "线下组队" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    排序方式
                  </p>
                  {renderRecommendSortChoices([
                    "目的地距离优先",
                    "人均消费优先",
                    "综合优先",
                  ])}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    指定条件
                  </p>
                  <Input
                    value={recommendFilters.averageSpend || ""}
                    onChange={(event) =>
                      updateRecommendFilter("averageSpend", event.target.value)
                    }
                    placeholder="人均消费阈值，例如：100 元"
                  />
                  <Input
                    value={recommendFilters.activityDestination || ""}
                    onChange={(event) =>
                      updateRecommendFilter(
                        "activityDestination",
                        event.target.value
                      )
                    }
                    placeholder="指定目的地"
                  />
                  <Input
                    value={recommendFilters.destinationDistance || ""}
                    onChange={(event) =>
                      updateRecommendFilter(
                        "destinationDistance",
                        event.target.value
                      )
                    }
                    placeholder="指定目的地距离，例如：10 km 内"
                  />
                </div>
              </>
            ) : null}
            {filter === "线上开黑" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    排序方式
                  </p>
                  {renderRecommendSortChoices([
                    "开始时间优先",
                    "时长最短",
                    "时长最长",
                    "综合优先",
                  ])}
                </div>
                <Input
                  value={recommendFilters.durationThreshold || ""}
                  onChange={(event) =>
                    updateRecommendFilter(
                      "durationThreshold",
                      event.target.value
                    )
                  }
                  placeholder="时长阈值，例如：2 小时以内"
                />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    游戏类目
                  </p>
                  {renderRecommendSortChoices([
                    "不限游戏",
                    "MOBA",
                    "FPS",
                    "桌游",
                  ])}
                </div>
              </>
            ) : null}
            {filter === "商城" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    商品分类
                  </p>
                  {renderRecommendSortChoices([
                    "全部商品",
                    "实物商品",
                    "会员权益",
                    "服务产品",
                  ])}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="最低价格" />
                  <Input placeholder="最高价格" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {renderRecommendSortChoices(["距离优先", "销量优先"])}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {renderRecommendSortChoices(["全新", "二手"])}
                </div>
              </>
            ) : null}
          </div>
          <SheetFooter className="border-t border-border/70 px-4 py-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setRecommendFilterOpen(false)
                showToast(`已应用${filter}筛选`)
              }}
            >
              应用筛选
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={cityOpen} onOpenChange={setCityOpen}>
        <SheetContent side="bottom" className="max-h-[70svh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>切换推荐城市</SheetTitle>
            <SheetDescription>
              附近内容会根据城市更新，关注内容不受影响。
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            {["杭州", "上海", "宁波", "苏州"].map((item) => (
              <Button
                key={item}
                type="button"
                variant={item === city ? "secondary" : "outline"}
                className="justify-between"
                onClick={() => {
                  setCity(item)
                  setCityOpen(false)
                  showToast(`已切换到${item}`)
                }}
              >
                {item}
                {item === city ? (
                  <CheckCheck size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="justify-start text-primary"
              onClick={() => showToast("定位权限未开启，可手动选择城市")}
            >
              <MapPin size={16} /> 重新定位
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(actionItem)}
        onOpenChange={(open) => !open && setActionItem(null)}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>管理这条推荐</SheetTitle>
            <SheetDescription>
              你的反馈会影响后续推荐，不会影响历史订单或已参与业务。
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() =>
                actionItem && hideItem(actionItem, "已隐藏这条内容")
              }
            >
              <ThumbsDown size={16} /> 不感兴趣
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() =>
                actionItem && hideItem(actionItem, "会减少此类内容")
              }
            >
              <SlidersHorizontal size={16} /> 减少此类内容
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => {
                setActionItem(null)
                showToast("分享链接已准备")
              }}
            >
              <Share2 size={16} /> 分享
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="justify-start"
              onClick={() => {
                setActionItem(null)
                setReportOpen(true)
              }}
            >
              <ShieldCheck size={16} /> 举报内容
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报这条内容</DialogTitle>
            <DialogDescription>
              请选择最符合的原因，趣汇会在后台核查。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setReportOpen(false)
                showToast("已提交举报")
              }}
            >
              信息不实
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setReportOpen(false)
                showToast("已提交举报")
              }}
            >
              骚扰或欺诈
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setReportOpen(false)
                showToast("已提交举报")
              }}
            >
              其他原因
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {undoId ? (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-sm">
          <span>已隐藏一条推荐</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => {
              setHiddenIds((items) => items.filter((id) => id !== undoId))
              setUndoId(null)
              showToast("已撤销隐藏")
            }}
          >
            撤销
          </Button>
        </div>
      ) : null}
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
