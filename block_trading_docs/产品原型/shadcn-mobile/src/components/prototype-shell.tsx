import { type ReactNode } from "react"
import {
  ChevronRight,
  GraduationCap,
  Heart,
  Info,
  Plus,
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
}: {
  current: PageKey
  onChange: (page: PageKey) => void
  unreadCount: number
  campusMode: boolean
}) {
  return (
    <nav className="bottom-nav safe-bottom" aria-label="主导航">
      {navItems.map(({ key, label, icon: Icon }) => (
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
}: {
  label: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
  onAction?: () => void
}) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="page-title">{title}</h1>
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
}: {
  activity: (typeof activities)[number]
  compact?: boolean
  joined?: boolean
  verified?: boolean
  onAction?: () => void
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
      <div className="flex gap-3 p-3">
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
          <div className="mt-3 flex items-center gap-2">
            <Progress value={activity.progress} className="h-1.5 flex-1" />
            <span className="text-[11px] font-semibold whitespace-nowrap text-[var(--qh-coral)]">
              {participantSummary(activity)}
            </span>
          </div>
        </div>
      </div>
      {!compact ? (
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
  onAdd,
}: {
  product: (typeof products)[number]
  onAdd: () => void
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-[0_2px_10px_rgba(28,53,38,0.08)]">
      <div className="relative aspect-square overflow-hidden bg-muted">
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
      </div>
      <CardContent className="p-3">
        <h3 className="truncate text-sm font-bold">{product.name}</h3>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-base font-extrabold text-[var(--qh-coral)]">
            ¥ {product.price}
          </span>
          <Button
            type="button"
            size="icon-sm"
            className="rounded-full"
            onClick={onAdd}
            aria-label={`加入购物车：${product.name}`}
          >
            <Plus size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
