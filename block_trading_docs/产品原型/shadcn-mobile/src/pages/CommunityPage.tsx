import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bike,
  CheckCheck,
  ChevronRight,
  Gamepad2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  activities,
  verifiedActivityIds,
  isActivityVisible,
  type ActivityType,
  type ViewerMode,
} from "@/prototype/data"
import { getPostDraftFields } from "@/prototype/post-schema"
import {
  IconButton,
  PageHeader,
  CommunityCard,
} from "@/components/prototype-shell"
import { formatCurrentLocation } from "@/lib/location-display"

const communityArea = formatCurrentLocation({
  district: "滨江区",
  street: "西兴街道",
})

export function CommunityPage({
  onOpenSearch,
  onOpenPostDetail,
  campusMode,
  viewerMode,
}: {
  onOpenSearch: () => void
  onOpenPostDetail: (activityId: string) => void
  campusMode: boolean
  viewerMode: ViewerMode
}) {
  const [communityView, setCommunityView] = useState("发现")
  const [activeType, setActiveType] = useState("全部")
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [communityFilterValues, setCommunityFilterValues] = useState<
    Record<string, string>
  >({})
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<ActivityType>("拼单")
  const [createDraft, setCreateDraft] = useState<Record<string, string>>({})
  const [createAdvancedOpen, setCreateAdvancedOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const [joinedIds] = useState<string[]>(["travel"])
  const [communityPage, setCommunityPage] = useState(1)
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityToast, setCommunityToast] = useState("")
  const communityLoadSentinelRef = useRef<HTMLDivElement>(null)
  const communityLoadTimerRef = useRef<number | null>(null)
  const communityLoadPendingRef = useRef(false)
  const communitySortOptions =
    activeType === "拼单"
      ? ["价格优先", "数量优先", "收货地点距离优先", "综合优先"]
      : activeType === "拼车"
        ? ["上车地点优先", "出行时间优先", "综合优先"]
        : activeType === "线下组队"
          ? ["目的地距离优先", "人均消费优先", "综合优先"]
          : activeType === "线上开黑"
            ? ["开始时间优先", "时长最短", "时长最长", "综合优先"]
            : activeType === "近邻互助"
              ? ["响应时限优先", "距离优先", "报酬优先", "综合优先"]
              : ["综合优先", "距离优先", "截止优先"]
  const communitySort = communityFilterValues.sort || communitySortOptions[0]

  const filteredActivities = useMemo(() => {
    const results = activities.filter((activity) => {
      if (!isActivityVisible(activity, campusMode, viewerMode)) return false
      if (communityView === "我参与的" && !joinedIds.includes(activity.id)) {
        return false
      }
      if (activeType !== "全部" && activity.type !== activeType) return false
      if (activeFilters.includes("5km 内")) {
        const distance = Number.parseFloat(activity.distance)
        if (Number.isNaN(distance) || distance > 5) return false
      }
      if (
        activeFilters.includes("今天") &&
        !activity.detail.includes("今天") &&
        !activity.detail.includes("今晚")
      ) {
        return false
      }
      if (
        activeFilters.includes("仅看已认证") &&
        !verifiedActivityIds.has(activity.id)
      ) {
        return false
      }
      return true
    })

    return [...results].sort((left, right) => {
      if (communitySort.includes("距离") || communitySort.includes("地点")) {
        const leftDistance = Number.parseFloat(left.distance)
        const rightDistance = Number.parseFloat(right.distance)
        return (
          (Number.isNaN(leftDistance)
            ? Number.POSITIVE_INFINITY
            : leftDistance) -
          (Number.isNaN(rightDistance)
            ? Number.POSITIVE_INFINITY
            : rightDistance)
        )
      }
      if (communitySort.includes("时间") || communitySort.includes("截止")) {
        const urgency = (detail: string) =>
          detail.includes("今晚") ? 0 : detail.includes("今天") ? 1 : 2
        return urgency(left.detail) - urgency(right.detail)
      }
      return right.progress - left.progress
    })
  }, [
    activeFilters,
    activeType,
    campusMode,
    communitySort,
    communityView,
    joinedIds,
    viewerMode,
  ])

  const visibleActivities = filteredActivities.slice(0, communityPage * 4)
  const hasMoreActivities = visibleActivities.length < filteredActivities.length

  // 社区列表复用推荐页的触底分页语义，并在查询条件变化时取消旧页请求。
  useEffect(() => {
    const sentinel = communityLoadSentinelRef.current
    if (!sentinel || !hasMoreActivities) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || communityLoadPendingRef.current) return

        communityLoadPendingRef.current = true
        setCommunityLoading(true)
        communityLoadTimerRef.current = window.setTimeout(() => {
          setCommunityPage((page) => page + 1)
          setCommunityLoading(false)
          communityLoadPendingRef.current = false
        }, 700)
      },
      { rootMargin: "0px 0px 120px" }
    )

    observer.observe(sentinel)
    return () => {
      observer.disconnect()
      if (communityLoadTimerRef.current !== null) {
        window.clearTimeout(communityLoadTimerRef.current)
        communityLoadTimerRef.current = null
      }
      communityLoadPendingRef.current = false
    }
  }, [
    activeFilters,
    activeType,
    campusMode,
    communitySort,
    communityView,
    hasMoreActivities,
  ])

  const resetCommunityPagination = () => {
    setCommunityPage(1)
    setCommunityLoading(false)
    communityLoadPendingRef.current = false
  }

  const showCommunityToast = (message: string) => {
    setCommunityToast(message)
    window.setTimeout(() => setCommunityToast(""), 2400)
  }

  const toggleCommunityFilter = (value: string) => {
    setActiveFilters((filters) =>
      filters.includes(value)
        ? filters.filter((filter) => filter !== value)
        : [...filters, value]
    )
    resetCommunityPagination()
  }

  const updateCommunityFilter = (key: string, value: string) => {
    setCommunityFilterValues((current) => ({ ...current, [key]: value }))
  }

  const joinActivity = (id: string) => {
    if (viewerMode === "guest") {
      showCommunityToast("登录后才能参与或响应求助")
      return
    }
    showCommunityToast(
      joinedIds.includes(id) ? "已打开活动进度" : "参与操作将在后续流程接入"
    )
  }

  const createTypes: Array<{ Icon: typeof UsersRound; label: ActivityType }> = [
    { Icon: UsersRound, label: "拼单" },
    { Icon: Bike, label: "拼车" },
    { Icon: UsersRound, label: "线下组队" },
    { Icon: Gamepad2, label: "线上开黑" },
    { Icon: UsersRound, label: "近邻互助" },
  ]
  const createFields = getPostDraftFields(createType)
  const createRequiredFields = createFields.filter(
    (field) => field.required && !field.defaulted
  )
  const createAdvancedFields = createFields.filter((field) => field.advanced)
  const missingCreateFields = createRequiredFields.filter(
    (field) => !createDraft[field.key]?.trim()
  )
  const activityLabel = campusMode ? "校园活动" : "社区活动"

  const updateCreateDraft = (key: string, value: string) => {
    setCreateDraft((draft) => ({ ...draft, [key]: value }))
  }
  return (
    <div className="page-content">
      <PageHeader
        eyebrow={campusMode ? "杭州大学 · 同校活动" : "滨江区 · 27 个活动可参与"}
        title={campusMode ? "校园" : "社区"}
        action={
          <IconButton label="搜索" onClick={onOpenSearch}>
            <Search size={18} />
          </IconButton>
        }
      />

      <div className="mb-4">
        <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
          {["发现", "我参与的"].map((view) => (
            <button
              key={view}
              type="button"
              className={`h-9 rounded-md text-xs font-semibold transition ${communityView === view ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}
              onClick={() => {
                setCommunityView(view)
                resetCommunityPagination()
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {created ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-primary">
          <CheckCheck size={15} /> 草稿已保存，可在“我的”中继续编辑
        </div>
      ) : null}

      {viewerMode === "guest" ? (
        <div className="mb-4 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
          游客模式仅展示 5 km
          内公开的近邻互助，帖子用户信息和留言内容需要登录后查看。
        </div>
      ) : null}

      <div className="hide-scrollbar -mx-4 mb-4 overflow-x-auto overscroll-x-contain px-4 touch-pan-x snap-x snap-mandatory">
        <Tabs
          value={activeType}
          onValueChange={(value) => {
            setActiveType(value)
            resetCommunityPagination()
          }}
          className="w-[116%]"
        >
          <TabsList className="w-full justify-start gap-[2%] bg-muted p-1">
            {[
              "全部",
              "拼单",
              "拼车",
              "线下组队",
              "线上开黑",
              "近邻互助",
            ].map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="h-9 w-1/5 shrink-0 snap-start !flex-none"
              >
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {activeFilters.length ? (
        <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {activeFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-[0.6875rem] font-semibold text-primary"
              onClick={() => toggleCommunityFilter(filter)}
            >
              {filter} · 移除
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="section-title">
            {communityView === "发现" ? "可参与活动" : "我的社区进度"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredActivities.length} 条匹配内容 · {communityArea}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-[0.625rem]"
          onClick={() => setFilterOpen(true)}
        >
          <SlidersHorizontal size={13} /> {communitySort}
        </Button>
      </div>

      {visibleActivities.length ? (
        <div className="space-y-3">
          {visibleActivities.map((activity) => (
            <CommunityCard
              key={activity.id}
              activity={activity}
              verified={verifiedActivityIds.has(activity.id)}
              joined={joinedIds.includes(activity.id)}
              onAction={() => joinActivity(activity.id)}
              onOpenDetail={() => onOpenPostDetail(activity.id)}
              viewerMode={viewerMode}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed bg-white/70 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <UsersRound size={24} className="text-primary" />
            <p className="text-sm font-bold">暂时没有匹配活动</p>
            <p className="text-xs text-muted-foreground">
              清除筛选，或发起一个新的{activityLabel}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveFilters([])
                  setActiveType("全部")
                  resetCommunityPagination()
                }}
              >
                清除筛选
              </Button>
              {viewerMode !== "guest" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  发起活动
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {hasMoreActivities ? (
        <div
          ref={communityLoadSentinelRef}
          className="flex min-h-14 items-center justify-center gap-2 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {communityLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin text-primary" />
              正在加载更多活动
            </>
          ) : (
            "继续向下浏览"
          )}
        </div>
      ) : visibleActivities.length ? (
        <p className="py-5 text-center text-xs text-muted-foreground">
          暂无更多内容
        </p>
      ) : null}

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent
          side="right"
          className="w-[min(92vw,24rem)] overflow-y-auto p-0"
        >
          <SheetHeader>
            <SheetTitle>
              {activeType === "全部" ? activityLabel : activeType}筛选
            </SheetTitle>
            <SheetDescription>
              按业务分类选择排序方式，支持指定地点、价格、时间和游戏类目。
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                排序方式
              </p>
              <div className="grid grid-cols-2 gap-2">
                {communitySortOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={communitySort === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateCommunityFilter("sort", option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            {activeType === "拼单" ? (
              <>
                <Input
                  placeholder="价格阈值，例如：200 元以内"
                  value={communityFilterValues.price || ""}
                  onChange={(event) =>
                    updateCommunityFilter("price", event.target.value)
                  }
                />
                <Input
                  placeholder="收货地点，例如：西兴街道"
                  value={communityFilterValues.receiveLocation || ""}
                  onChange={(event) =>
                    updateCommunityFilter("receiveLocation", event.target.value)
                  }
                />
              </>
            ) : null}
            {activeType === "拼车" ? (
              <>
                <Input
                  placeholder="指定上车地点"
                  value={communityFilterValues.pickup || ""}
                  onChange={(event) =>
                    updateCommunityFilter("pickup", event.target.value)
                  }
                />
                <Input
                  placeholder="指定目的地"
                  value={communityFilterValues.destination || ""}
                  onChange={(event) =>
                    updateCommunityFilter("destination", event.target.value)
                  }
                />
                <Input
                  placeholder="指定出行时间"
                  value={communityFilterValues.travelTime || ""}
                  onChange={(event) =>
                    updateCommunityFilter("travelTime", event.target.value)
                  }
                />
              </>
            ) : null}
            {activeType === "线下组队" ? (
              <>
                <Input
                  placeholder="人均消费阈值，例如：100 元以内"
                  value={communityFilterValues.spend || ""}
                  onChange={(event) =>
                    updateCommunityFilter("spend", event.target.value)
                  }
                />
                <Input
                  placeholder="指定目的地"
                  value={communityFilterValues.destination || ""}
                  onChange={(event) =>
                    updateCommunityFilter("destination", event.target.value)
                  }
                />
                <Input
                  placeholder="指定目的地距离，例如：10 km 内"
                  value={communityFilterValues.distance || ""}
                  onChange={(event) =>
                    updateCommunityFilter("distance", event.target.value)
                  }
                />
              </>
            ) : null}
            {activeType === "线上开黑" ? (
              <>
                <Input
                  placeholder="开始时间或时长阈值，例如：今晚 20:00 / 2 小时内"
                  value={communityFilterValues.gameTime || ""}
                  onChange={(event) =>
                    updateCommunityFilter("gameTime", event.target.value)
                  }
                />
                <Input
                  placeholder="指定游戏类目，例如：MOBA、FPS、桌游"
                  value={communityFilterValues.gameCategory || ""}
                  onChange={(event) =>
                    updateCommunityFilter("gameCategory", event.target.value)
                  }
                />
              </>
            ) : null}
            {activeType === "近邻互助" ? (
              <>
                <Input placeholder="报酬，例如：20 元或可协商" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="需求时间或开始时间" />
                  <Input placeholder="最晚响应时间" />
                </div>
                <Button
                  type="button"
                  variant={
                    activeFilters.includes("加急") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleCommunityFilter("加急")}
                >
                  {activeFilters.includes("加急") ? "已设为加急" : "设为加急"}
                </Button>
              </>
            ) : null}
            {activeType === "全部" ? (
              <div className="grid grid-cols-3 gap-2">
                {["5km 内", "今天", "仅看已认证"].map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={
                      activeFilters.includes(option) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleCommunityFilter(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <SheetFooter>
            <Button
              type="button"
              className="w-full"
              onClick={() => setFilterOpen(false)}
            >
              应用筛选 · 查看 {filteredActivities.length} 条结果
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[82svh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>发起一场{activityLabel}</SheetTitle>
            <SheetDescription>
              默认定位只展示市区；线下帖子可补充并展示精确地点。
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-3">
            <div className="rounded-lg bg-secondary p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">帖子默认可见范围</span>
                <Badge
                  variant="outline"
                  className="border-0 bg-white text-[0.625rem] text-primary"
                >
                  {campusMode ? "仅同校可见" : "公开可见"}
                </Badge>
              </div>
              <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                {campusMode
                  ? "校园版已开启，新帖子默认只向同校用户展示。"
                  : "可在我的偏好设置中开启校园版。"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {createTypes.map(({ Icon, label }) => (
                <Button
                  key={label}
                  type="button"
                  variant={label === createType ? "default" : "outline"}
                  className="h-12 flex-col gap-1 text-xs"
                  onClick={() => {
                    setCreateType(label)
                    setCreateDraft({})
                    setCreateAdvancedOpen(false)
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {createRequiredFields.map((field) => (
                <label key={field.key} className="block space-y-1.5">
                  <span className="text-xs font-semibold">
                    {field.label} <span className="text-[var(--qh-coral)]">*</span>
                  </span>
                  <Input
                    aria-label={field.label}
                    type={field.inputType}
                    placeholder={field.placeholder}
                    value={createDraft[field.key] ?? ""}
                    onChange={(event) =>
                      updateCreateDraft(field.key, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
            <p className="text-[0.6875rem] text-muted-foreground">
              位置默认只展示当前市区；报名或响应截止会按主时间预填，可在更多说明中调整。
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-primary"
              onClick={() => setCreateAdvancedOpen((open) => !open)}
            >
              {createAdvancedOpen ? "收起更多说明" : "更多说明（可选）"}
            </Button>
            {createAdvancedOpen ? (
              <div className="space-y-3 rounded-lg bg-muted p-3">
                {createAdvancedFields.map((field) => (
                  <label key={field.key} className="block space-y-1.5">
                    <span className="text-xs font-semibold">{field.label}</span>
                    <Input
                      aria-label={field.label}
                      type={field.inputType}
                      placeholder={field.placeholder}
                      value={createDraft[field.key] ?? ""}
                      onChange={(event) =>
                        updateCreateDraft(field.key, event.target.value)
                      }
                    />
                  </label>
                ))}
                <p className="text-[0.6875rem] text-muted-foreground">
                  精确地点仅向你选择的可见范围展示，请勿填写家庭住址和联系方式。
                </p>
              </div>
            ) : null}
            {missingCreateFields.length ? (
              <p className="text-[0.6875rem] text-[var(--qh-coral)]">
                还需填写：{missingCreateFields
                  .slice(0, 2)
                  .map((field) => field.label)
                  .join("、")}
              </p>
            ) : null}
            <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              线下活动会默认开启成员隐私保护，联系方式只对已确认成员可见。
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              disabled={missingCreateFields.length > 0}
              onClick={() => {
                setCreateOpen(false)
                setCreated(true)
                showCommunityToast(
                  createDraft.preciseLocation?.trim()
                    ? `${createType}草稿已保存，已包含精确地点`
                    : `${createType}草稿已保存，仅展示当前市区`
                )
              }}
              className="w-full"
            >
              保存为草稿 <ChevronRight size={16} />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {communityToast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {communityToast}
        </div>
      ) : null}
    </div>
  )
}
