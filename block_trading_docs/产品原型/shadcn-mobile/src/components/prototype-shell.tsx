import { type PointerEvent, type ReactNode } from "react"
import {
  ChevronRight,
  GraduationCap,
  Heart,
  Info,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  type PageKey,
  activities,
  participantSummary,
  products,
  navItems,
  type ViewerMode,
} from "@/prototype/data"

export function StatusBar({
  campusMode,
  onCampusModeChange,
}: {
  campusMode: boolean
  onCampusModeChange: (enabled: boolean) => void
}) {
  const campusLabel = campusMode
    ? "退出校园版预览"
    : "开启校园版预览，标识为已认证学生用户"

  return (
    <div className="status-bar" aria-label="系统状态">
      <span>9:41</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          className="status-campus-button"
          data-active={campusMode}
          aria-label={campusLabel}
          aria-pressed={campusMode}
          title={campusLabel}
          onClick={() => onCampusModeChange(!campusMode)}
        >
          <GraduationCap size={12} />
          {campusMode ? "校园中" : "校园版"}
        </button>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="text-[10px]">●●●</span>
          <span className="text-[10px]">Wi-Fi</span>
          <span className="rounded-sm border border-current px-1 text-[9px]">
            100
          </span>
        </span>
      </span>
    </div>
  )
}

export function BottomNav({
  current,
  onChange,
  unreadCount,
  campusMode,
  viewerMode = "member",
}: {
  current: PageKey
  onChange: (page: PageKey) => void
  unreadCount: number
  campusMode: boolean
  viewerMode?: ViewerMode
}) {
  const visibleItems =
    viewerMode === "guest"
      ? navItems.filter(
          ({ key }) =>
            key === "recommend" || key === "community" || key === "profile"
        )
      : navItems
  return (
    <nav className="bottom-nav safe-bottom" aria-label="主导航">
      {visibleItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          className="bottom-nav-item relative"
          data-active={current === key}
          aria-current={current === key ? "page" : undefined}
          onClick={() => onChange(key)}
        >
          <span className="relative">
            <Icon size={20} strokeWidth={current === key ? 2.5 : 1.8} />
            {key === "messages" && unreadCount > 0 ? (
              <span className="unread-dot">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </span>
          <span>{key === "community" && campusMode ? "校园" : label}</span>
        </button>
      ))}
    </nav>
  )
}

export function IconButton({
  label,
  children,
  onClick,
  onPointerDown,
  className,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={className}
    >
      {children}
    </Button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  leading,
  action,
  onAction,
}: {
  eyebrow?: string
  title: ReactNode
  leading?: ReactNode
  action?: ReactNode
  onAction?: () => void
}) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-end gap-2">
        {leading ? <span className="shrink-0 self-end">{leading}</span> : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1 text-xs font-semibold text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="page-title">{title}</h1>
        </div>
      </div>
      {action ? (
        <span onClick={onAction} className="shrink-0">
          {action}
        </span>
      ) : null}
    </header>
  )
}

export function CommunityCard({
  activity,
  compact = false,
  joined = false,
  verified = true,
  onAction,
  onOpenDetail,
  viewerMode = "member",
}: {
  activity: (typeof activities)[number]
  compact?: boolean
  joined?: boolean
  verified?: boolean
  onAction?: () => void
  onOpenDetail?: () => void
  viewerMode?: ViewerMode
}) {
  const toneClass = {
    green: "bg-secondary text-primary",
    blue: "bg-[var(--qh-blue-soft)] text-[var(--qh-blue)]",
    coral: "bg-[var(--qh-coral-soft)] text-[var(--qh-coral)]",
  }[activity.tone]

  return (
    <Card
      className={
        compact ? "overflow-hidden border-0 shadow-none" : "overflow-hidden"
      }
    >
      <button
        type="button"
        className="flex w-full gap-3 p-3 text-left"
        onClick={onOpenDetail}
        aria-label={`查看${activity.title}详情`}
      >
        <div className="h-[92px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-muted">
          <img className="image-cover" src={activity.image} alt="" />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <Badge
              className={`border-0 px-2 py-0.5 text-[10px] ${toneClass}`}
              variant="outline"
            >
              {activity.type}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {verified ? (
                <ShieldCheck size={12} className="text-primary" />
              ) : null}
              {activity.distance}
            </span>
          </div>
          <h3 className="truncate text-sm font-bold">{activity.title}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {activity.detail}
          </p>
          {viewerMode === "guest" ? (
            <p className="mt-3 text-[11px] text-muted-foreground">
              描述：{(activity.description ?? activity.detail).slice(0, 30)}
            </p>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <Progress value={activity.progress} className="h-1.5 flex-1" />
              <span className="text-[11px] font-semibold whitespace-nowrap text-[var(--qh-coral)]">
                {participantSummary(activity)}
              </span>
            </div>
          )}
        </div>
      </button>
      {!compact && viewerMode === "guest" ? (
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
          <span>
            留言 {activity.commentCount ?? 0} · 评论{" "}
            {(activity.commentCount ?? 0) + (activity.replyCount ?? 0)}
          </span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary"
            onClick={onOpenDetail}
          >
            查看详情 <ChevronRight size={14} />
          </Button>
        </div>
      ) : !compact ? (
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {verified ? <ShieldCheck size={13} /> : <Info size={13} />}
            {verified ? "发起人已认证" : "新发起人"}
          </span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary"
            onClick={onAction}
          >
            {joined
              ? "查看进度"
              : activity.type === "拼车"
                ? "申请加入"
                : activity.type === "近邻互助"
                  ? "响应求助"
                  : "去参与"}
            <ChevronRight size={14} />
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

export function ProductCard({
  product,
  onOpenDetail,
}: {
  product: (typeof products)[number]
  onOpenDetail: () => void
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-[0_2px_10px_rgba(28,53,38,0.08)]">
      <button
        type="button"
        className="relative block aspect-square w-full overflow-hidden bg-muted text-left"
        onClick={onOpenDetail}
        aria-label={`查看${product.name}详情`}
      >
        <img className="image-cover" src={product.image} alt={product.name} />
        <Badge
          className="absolute top-2 left-2 border-0 bg-white/90 text-[10px] text-primary"
          variant="outline"
        >
          {product.tag}
        </Badge>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute right-2 bottom-2 rounded-full bg-white/90"
          aria-label={`收藏${product.name}`}
        >
          <Heart size={15} />
        </Button>
      </button>
      <CardContent className="p-3">
        <h3 className="truncate text-sm font-bold">{product.name}</h3>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-base font-extrabold text-[var(--qh-coral)]">
            ¥ {product.price}
          </span>
          <Button type="button" size="sm" onClick={onOpenDetail}>
            去看看 <ChevronRight size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
