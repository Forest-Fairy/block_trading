import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  activities,
  participantSummary,
  type ActivityType,
  type ViewerMode,
} from "@/prototype/data"
import { IconButton, PageHeader } from "@/components/prototype-shell"

const typeMeta: Record<
  ActivityType,
  { summary: string; fields: Array<[string, string]>; description: string }
> = {
  拼单: {
    summary: "一起买更划算，按截止时间完成收货",
    fields: [
      ["商品与规格", "山姆零食组合包 · 12 件装"],
      ["预估人均", "¥ 86 / 人"],
      ["收货地点", "滨江 · 星耀城北门"],
      ["交付方式", "周六 18:00 后自提"],
    ],
    description:
      "发起人已整理好商品清单，大家确认规格后统一下单。成团后会在群聊同步订单和自提提醒。",
  },
  拼车: {
    summary: "同行路线与时间匹配，座位按上限管理",
    fields: [
      ["路线", "萧山机场 → 城西"],
      ["上车地点", "机场 T3 到达层 6 号门"],
      ["出行时间", "周五 19:30"],
      ["费用方式", "预计 ¥ 45 / 人 · AA"],
    ],
    description:
      "行程确认后仅向已确认成员开放精确联系方式。请提前说明行李数量，临时变更需要在群聊中同步。",
  },
  线下组队: {
    summary: "线下活动先确认集合信息，再申请加入",
    fields: [
      ["目的地", "安吉 · 竹海营地"],
      ["集合时间", "周六 07:30"],
      ["人均消费", "约 ¥ 188 / 人"],
      ["参与要求", "自备徒步鞋，接受拼房"],
    ],
    description:
      "本次活动包含轻徒步和露营，费用按实际 AA。发起人会在出发前一天确认天气和装备清单。",
  },
  线上开黑: {
    summary: "线上开黑按最少与最多人数动态成队",
    fields: [
      ["游戏类目", "MOBA · 王者荣耀"],
      ["平台", "微信区 · 语音房"],
      ["开始时间", "今晚 20:00"],
      ["活动时长", "预计 2 小时"],
    ],
    description:
      "达到最少人数即可开局，达到最多人数后停止招募。入队后请提前 5 分钟进语音房，临时缺席可在群聊说明。",
  },
  近邻互助: {
    summary: "附近临时求助，按最晚响应时间完成匹配",
    fields: [
      ["报酬", "¥ 20"],
      ["需求时效性", "时段"],
      ["需求时间", "明日 14:00-16:00"],
      ["最晚响应", "明日 10:00 前"],
      ["是否加急", "普通求助"],
    ],
    description:
      "明天下午有羽毛球课，临时没有球拍。希望借到一副基础球拍，课后当天归还，可支付清洁和借用报酬。",
  },
}

const activityImageSets: Record<ActivityType, string[]> = {
  拼单: [
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=85",
  ],
  拼车: [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85",
  ],
  线下组队: [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=85",
  ],
  线上开黑: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=85",
  ],
  近邻互助: [
    "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1000&q=85",
  ],
}

const galleryCanvasRatio = 16 / 7

type Reply = {
  id: string
  author: string
  time: string
  text: string
  fallback: string
  replies?: Reply[]
}

const commentsByType: Record<ActivityType, Reply[]> = {
  拼单: [
    {
      id: "snacks-1",
      author: "小周",
      time: "10 分钟前",
      text: "收货地点可以改到星耀城北门吗？",
      fallback: "周",
      replies: [
        {
          id: "snacks-1-1",
          author: "林同学",
          time: "刚刚",
          text: "可以，成团后我会在群里同步取货时间。",
          fallback: "林",
          replies: [
            {
              id: "snacks-1-1-1",
              author: "小周",
              time: "刚刚",
              text: "收到，谢谢！",
              fallback: "周",
            },
          ],
        },
      ],
    },
    {
      id: "snacks-2",
      author: "林同学",
      time: "刚刚",
      text: "可以，成团后我会在群里同步取货时间。",
      fallback: "林",
    },
  ],
  拼车: [
    {
      id: "airport-1",
      author: "小周",
      time: "12 分钟前",
      text: "我有一个 24 寸行李箱，后备箱方便放吗？",
      fallback: "周",
      replies: [
        {
          id: "airport-1-1",
          author: "陈同学",
          time: "8 分钟前",
          text: "可以放下，出发前再确认一次。",
          fallback: "陈",
        },
      ],
    },
    {
      id: "airport-2",
      author: "陈同学",
      time: "8 分钟前",
      text: "可以放下，出发前再确认一次。",
      fallback: "陈",
    },
  ],
  线下组队: [
    {
      id: "travel-1",
      author: "阿宁",
      time: "20 分钟前",
      text: "第一次去竹海，装备清单会提前发吗？",
      fallback: "宁",
      replies: [
        {
          id: "travel-1-1",
          author: "林知夏",
          time: "刚刚",
          text: "会的，出发前一天会在群里发完整清单。",
          fallback: "林",
        },
      ],
    },
    {
      id: "travel-2",
      author: "林知夏",
      time: "刚刚",
      text: "会的，出发前一天会在群里发完整清单。",
      fallback: "林",
    },
  ],
  线上开黑: [
    {
      id: "game-1",
      author: "Alex",
      time: "6 分钟前",
      text: "今晚语音房还是微信区吗？",
      fallback: "A",
      replies: [
        {
          id: "game-1-1",
          author: "林知夏",
          time: "刚刚",
          text: "是的，开局前 5 分钟进语音房集合。",
          fallback: "林",
        },
      ],
    },
    {
      id: "game-2",
      author: "林知夏",
      time: "刚刚",
      text: "是的，开局前 5 分钟进语音房集合。",
      fallback: "林",
    },
  ],
  近邻互助: [
    {
      id: "racket-1",
      author: "小周",
      time: "5 分钟前",
      text: "我有一副备用球拍，明早可以在小区门口交给你。",
      fallback: "周",
      replies: [
        {
          id: "racket-1-1",
          author: "莫雨",
          time: "刚刚",
          text: "太好了，报酬和归还时间我都可以配合。",
          fallback: "莫",
        },
      ],
    },
    {
      id: "racket-2",
      author: "阿宁",
      time: "2 分钟前",
      text: "如果需要第二副，我也可以帮忙问问邻居。",
      fallback: "宁",
    },
  ],
}

export function PostDetailPage({
  activityId,
  campusMode,
  viewerMode,
  onBack,
}: {
  activityId: string
  campusMode: boolean
  viewerMode: ViewerMode
  onBack: () => void
}) {
  const activity =
    activities.find((item) => item.id === activityId) ?? activities[0]
  const [joined, setJoined] = useState(activity.id === "travel")
  const [toast, setToast] = useState("")
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [galleryPreviewOpen, setGalleryPreviewOpen] = useState(false)
  const [galleryImageRatios, setGalleryImageRatios] = useState<
    Record<string, number>
  >({})
  const [commentMenuTarget, setCommentMenuTarget] = useState<Reply | null>(
    null
  )
  const [reportTarget, setReportTarget] = useState<Reply | null>(null)
  const [reportReason, setReportReason] = useState("不当内容")
  const [reportNote, setReportNote] = useState("")
  const galleryPointerStartX = useRef<number | null>(null)
  const gallerySwipeHandledRef = useRef(false)
  const galleryControlUsedRef = useRef(false)
  const galleryAutoPausedRef = useRef(false)
  const galleryPauseTimerRef = useRef<number | null>(null)
  const meta = typeMeta[activity.type]
  const isGuest = viewerMode === "guest"
  const activityDescription = activity.description ?? meta.description
  const gallery = [activity.image, ...activityImageSets[activity.type]].filter(
    (image, index, images) => images.indexOf(image) === index
  )
  const activeImage = gallery[activeImageIndex]
  const activeImageRatio = galleryImageRatios[activeImage]
  const imageUsesSideGutters =
    activeImageRatio !== undefined && activeImageRatio < galleryCanvasRatio
  const foregroundImageStyle = activeImageRatio
    ? activeImageRatio >= galleryCanvasRatio
      ? { width: "100%", height: `${(galleryCanvasRatio / activeImageRatio) * 100}%` }
      : { width: `${(activeImageRatio / galleryCanvasRatio) * 100}%`, height: "100%" }
    : undefined
  const comments = commentsByType[activity.type]
  const commentCount = activity.commentCount ?? comments.length
  const replyCount =
    activity.replyCount ??
    comments.reduce(
      (total, comment) => total + (comment.replies?.length ?? 0),
      0
    )

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }

  useEffect(() => {
    if (isGuest || gallery.length < 2) return

    const timer = window.setInterval(() => {
      if (galleryAutoPausedRef.current) return
      setActiveImageIndex((index) => (index + 1) % gallery.length)
    }, 5000)
    return () => {
      window.clearInterval(timer)
      if (galleryPauseTimerRef.current !== null) {
        window.clearTimeout(galleryPauseTimerRef.current)
      }
    }
  }, [gallery.length, isGuest])

  const handlePrimaryAction = () => {
    if (joined) {
      showToast("已打开参与进度")
      return
    }
    setJoined(true)
    showToast(
      activity.type === "拼车"
        ? "申请已提交，等待发起人确认"
        : activity.type === "近邻互助"
          ? "响应已提交，等待发起人确认"
          : "已加入活动"
    )
  }

  const pauseGalleryAuto = () => {
    galleryAutoPausedRef.current = true
    if (galleryPauseTimerRef.current !== null) {
      window.clearTimeout(galleryPauseTimerRef.current)
    }
    galleryPauseTimerRef.current = window.setTimeout(() => {
      galleryAutoPausedRef.current = false
      galleryPauseTimerRef.current = null
    }, 6000)
  }

  const changeImage = (direction: -1 | 1) => {
    pauseGalleryAuto()
    setActiveImageIndex(
      (index) => (index + direction + gallery.length) % gallery.length
    )
  }

  const selectImage = (index: number) => {
    pauseGalleryAuto()
    setActiveImageIndex(index)
  }

  const handleGalleryPointerDown = (clientX: number) => {
    if (isGuest) return
    gallerySwipeHandledRef.current = false
    galleryPointerStartX.current = clientX
  }

  const handleGalleryPointerUp = (clientX: number) => {
    if (isGuest || galleryPointerStartX.current === null) return
    const offset = clientX - galleryPointerStartX.current
    galleryPointerStartX.current = null
    if (Math.abs(offset) < 36) return
    gallerySwipeHandledRef.current = true
    changeImage(offset > 0 ? -1 : 1)
  }

  const handleGalleryPointerMove = (clientX: number) => {
    if (isGuest || galleryPointerStartX.current === null) return
    const offset = clientX - galleryPointerStartX.current
    if (Math.abs(offset) < 36) return
    galleryPointerStartX.current = null
    gallerySwipeHandledRef.current = true
    changeImage(offset > 0 ? -1 : 1)
  }

  const openGalleryPreview = () => {
    if (isGuest || gallerySwipeHandledRef.current || galleryControlUsedRef.current) {
      gallerySwipeHandledRef.current = false
      galleryControlUsedRef.current = false
      return
    }
    pauseGalleryAuto()
    setGalleryPreviewOpen(true)
  }

  const stopGalleryGesture = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    galleryPointerStartX.current = null
    galleryControlUsedRef.current = true
  }

  const renderReply = (reply: Reply, depth = 0): ReactNode => (
    <div
      key={reply.id}
      className={depth ? "ml-5 border-l border-border pl-3" : ""}
    >
      <div className="flex items-start gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-muted text-xs font-bold text-primary">
            {reply.fallback}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 rounded-lg bg-muted/70 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{reply.author}</span>
            <span className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {reply.time}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${reply.author}的留言菜单`}
                onClick={() => setCommentMenuTarget(reply)}
              >
                <MoreHorizontal size={14} />
              </Button>
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {reply.text}
          </p>
          <button
            type="button"
            className="mt-1 text-[10px] font-semibold text-primary"
            onClick={() => showToast(`正在回复${reply.author}`)}
          >
            回复
          </button>
        </div>
      </div>
      {reply.replies?.length ? (
        <div className="mt-2 space-y-2">
          {reply.replies.map((child) => renderReply(child, depth + 1))}
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="page-content">
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-2">
            <span className="inline-flex shrink-0 items-center rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-primary">
              {activity.type}
            </span>
            {!isGuest ? (
              <span className="truncate">{activity.title}</span>
            ) : null}
          </span>
        }
        leading={
          <IconButton label="返回" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        }
      />
      <Card className="gap-0 overflow-hidden border-0 py-0 shadow-none">
        <div
          className="relative aspect-[16/7] w-full touch-pan-y overflow-hidden bg-muted"
          tabIndex={isGuest ? undefined : 0}
          aria-label={isGuest ? undefined : "帖子图片轮播，可左右滑动切换"}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            handleGalleryPointerDown(event.clientX)
          }}
          onPointerMove={(event) => handleGalleryPointerMove(event.clientX)}
          onPointerUp={(event) => {
            handleGalleryPointerUp(event.clientX)
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
          onPointerCancel={() => {
            galleryPointerStartX.current = null
          }}
          onClick={openGalleryPreview}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") changeImage(-1)
            if (event.key === "ArrowRight") changeImage(1)
          }}
        >
          <img
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-100 object-cover brightness-90 saturate-100 blur-9xl opacity-90"
            src={activeImage}
            alt=""
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-black/15 backdrop-blur-s"
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <div
              className="h-full overflow-hidden"
              style={
                imageUsesSideGutters
                  ? {
                      ...foregroundImageStyle,
                      WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                      maskImage:
                        "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                    }
                  : foregroundImageStyle
              }
            >
              <img
                className="block h-full w-full select-none object-contain"
                src={activeImage}
                alt={`${activity.title}图片 ${activeImageIndex + 1}`}
                draggable={false}
                onLoad={(event) => {
                  const { naturalHeight, naturalWidth } = event.currentTarget
                  if (!naturalHeight || !naturalWidth) return
                  setGalleryImageRatios((ratios) => ({
                    ...ratios,
                    [activeImage]: naturalWidth / naturalHeight,
                  }))
                }}
              />
            </div>
          </div>
          {!isGuest ? (
            <IconButton
              label="上一张图片"
              className="absolute top-1/2 left-2 z-20 -translate-y-1/2 bg-black/45 text-white hover:bg-black/60"
              onClick={() => changeImage(-1)}
              onPointerDown={stopGalleryGesture}
            >
              <ChevronLeft size={18} />
            </IconButton>
          ) : null}
          {!isGuest ? (
            <IconButton
              label="下一张图片"
              className="absolute top-1/2 right-2 z-20 -translate-y-1/2 bg-black/45 text-white hover:bg-black/60"
              onClick={() => changeImage(1)}
              onPointerDown={stopGalleryGesture}
            >
              <ChevronRight size={18} />
            </IconButton>
          ) : null}
          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2">
            {!isGuest ? (
              <Badge
                className="border-0 bg-black/55 text-[10px] text-white"
                variant="outline"
              >
                {campusMode ? "仅同校可见" : "公开可见"}
              </Badge>
            ) : null}
            {!isGuest ? (
              <span className="rounded-full bg-black/55 px-2 py-1 text-[10px] text-white">
                {activeImageIndex + 1} / {gallery.length}
              </span>
            ) : null}
          </div>
          {!isGuest ? (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`查看第 ${index + 1} 张图片`}
                  aria-current={activeImageIndex === index}
                  onPointerDown={() => {
                    galleryControlUsedRef.current = true
                  }}
                  className={`size-2 rounded-full border border-white transition-colors ${
                    activeImageIndex === index ? "bg-white" : "bg-transparent"
                  }`}
                  onClick={() => selectImage(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
        <CardContent className="space-y-5 p-4 pt-[0.2em]">
          {isGuest ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {activityDescription.slice(0, 30)}
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-center text-xs">
                <div>
                  <strong className="block text-sm text-primary">
                    {activity.distance}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    距离
                  </span>
                </div>
                <div>
                  <strong className="block text-sm text-primary">
                    {commentCount}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    留言数
                  </span>
                </div>
                <div>
                  <strong className="block text-sm text-primary">
                    {commentCount + replyCount}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    评论数
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {meta.summary}
                </p>
              </div>
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-secondary font-bold text-primary">
                      林
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      林知夏 <ShieldCheck size={14} className="text-primary" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      发起人 · 已完成 12 次活动
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => showToast("已关注发起人")}
                  >
                    关注
                  </Button>
                </div>
                <div className="rounded-lg bg-secondary/70 p-3">
                  <p className="text-xs font-semibold text-primary">
                    发起人备注
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {activityDescription}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold">参与进度</span>
                    <span className="font-bold text-[var(--qh-coral)]">
                      {participantSummary(activity)}
                    </span>
                  </div>
                  <Progress value={activity.progress} className="mt-3 h-2" />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    最少 {activity.minParticipants} 人成行，最多{" "}
                    {activity.maxParticipants} 人；达到上限后停止加入。
                  </p>
                </div>
              </section>
              <section>
                <h3 className="section-title text-base">详细信息</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted p-3">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CalendarDays
                      size={14}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    {activity.detail}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    {activity.distance === "线上"
                      ? "线上活动"
                      : `距离 ${activity.distance}`}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <UsersRound
                      size={14}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    {participantSummary(activity)}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Clock3
                      size={14}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    报名进行中
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  {meta.fields.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"
                    >
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {label}
                      </span>
                      <strong className="text-right text-xs">{value}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
                <WalletCards
                  size={15}
                  className="mt-0.5 shrink-0 text-primary"
                />
                参与前请确认费用、时间和可见范围；线下活动的精确联系方式仅对确认成员开放。
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => showToast("已复制分享链接")}
                >
                  <Share2 size={14} />
                  分享
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => showToast("已提交举报")}
                >
                  <Flag size={14} />
                  举报
                </Button>
                <Button
                  type="button"
                  className="ml-auto"
                  onClick={handlePrimaryAction}
                >
                  {joined
                    ? "查看进度"
                    : activity.type === "拼车"
                      ? "申请加入"
                      : activity.type === "近邻互助"
                        ? "响应求助"
                        : "去参与"}
                </Button>
              </div>
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="section-title text-base">留言列表</h3>
                  <span className="text-xs text-muted-foreground">
                    留言 {commentCount} · 评论 {commentCount + replyCount}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {comments.map((comment) => renderReply(comment))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => showToast("留言功能将在后续流程接入")}
                  >
                    <MessageCircle size={14} />
                    写留言
                  </Button>
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>
      <Sheet
        open={commentMenuTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCommentMenuTarget(null)
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>留言操作</SheetTitle>
            <SheetDescription>
              正在操作 {commentMenuTarget?.author ?? "这条留言"} 的内容。
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-[var(--qh-coral)]"
              onClick={() => {
                setReportTarget(commentMenuTarget)
                setCommentMenuTarget(null)
              }}
            >
              <Flag size={16} /> 举报
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog
        open={galleryPreviewOpen}
        onOpenChange={setGalleryPreviewOpen}
      >
        <DialogContent
          showCloseButton={false}
          className="gallery-preview-dialog fixed inset-0 max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-black p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">图片预览</DialogTitle>
          <div className="relative flex h-full w-full items-center justify-center p-5">
            <img
              className="max-h-full max-w-full select-none object-contain"
              src={activeImage}
              alt={`${activity.title}图片 ${activeImageIndex + 1}预览`}
              draggable={false}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/45 text-white hover:bg-black/65 hover:text-white"
              aria-label="关闭图片预览"
              onClick={() => setGalleryPreviewOpen(false)}
            >
              <X size={20} />
            </Button>
            {gallery.length > 1 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65 hover:text-white"
                  aria-label="预览上一张图片"
                  onClick={() => changeImage(-1)}
                >
                  <ChevronLeft size={22} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65 hover:text-white"
                  aria-label="预览下一张图片"
                  onClick={() => changeImage(1)}
                >
                  <ChevronRight size={22} />
                </Button>
              </>
            ) : null}
            <span className="absolute right-1/2 bottom-5 translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs">
              {activeImageIndex + 1} / {gallery.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={reportTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报留言</DialogTitle>
            <DialogDescription>
              请选择原因，平台会尽快核查处理。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {["不当内容", "骚扰辱骂", "广告引流", "虚假信息"].map(
                (reason) => (
                  <Button
                    key={reason}
                    type="button"
                    variant={reportReason === reason ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReportReason(reason)}
                  >
                    {reason}
                  </Button>
                )
              )}
            </div>
            <Input
              value={reportNote}
              onChange={(event) => setReportNote(event.target.value)}
              placeholder="补充说明（可选）"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportTarget(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                setReportTarget(null)
                setReportNote("")
                showToast("举报已受理，感谢你的反馈")
              }}
            >
              提交举报
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
