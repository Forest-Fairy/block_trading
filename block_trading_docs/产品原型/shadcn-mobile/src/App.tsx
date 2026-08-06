import { useMemo, useState, type ReactNode } from "react"
import {
  Bell,
  Bike,
  CheckCheck,
  ChevronRight,
  Clock3,
  Compass,
  Edit3,
  Eye,
  Gamepad2,
  Headphones,
  Heart,
  Home,
  Info,
  LockKeyhole,
  LogOut,
  MapPin,
  Megaphone,
  MessageCircle,
  PackageCheck,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  TicketPercent,
  Truck,
  UserRound,
  UsersRound,
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PageKey = "recommend" | "community" | "mall" | "messages" | "profile"
type ActivityType = "拼单" | "拼车" | "凑伙"

const imageUrls = {
  hike: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=85",
  game: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=85",
  car: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85",
  mug: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=85",
  bottle:
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=85",
  backpack:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85",
}

const activities = [
  {
    id: "snacks",
    type: "拼单" as ActivityType,
    title: "周末山姆零食拼单",
    detail: "周六 18:00 截止 · 配送到滨江",
    people: "3 / 5 人",
    progress: 60,
    distance: "1.2 km",
    image: imageUrls.mug,
    tone: "green",
  },
  {
    id: "airport",
    type: "拼车" as ActivityType,
    title: "萧山机场 → 城西拼车",
    detail: "周五 19:30 出发 · 还有 2 个座位",
    people: "2 / 4 人",
    progress: 50,
    distance: "4.8 km",
    image: imageUrls.car,
    tone: "blue",
  },
  {
    id: "game",
    type: "凑伙" as ActivityType,
    title: "周日晚间开黑小队",
    detail: "今晚 20:00 · 线上组队",
    people: "4 / 5 人",
    progress: 80,
    distance: "线上",
    image: imageUrls.game,
    tone: "coral",
  },
]

const products = [
  {
    id: "mug",
    name: "趣汇露营杯",
    description: "轻量保温，周末出发带上它",
    price: 39,
    tag: "新品",
    image: imageUrls.mug,
  },
  {
    id: "bottle",
    name: "城市通勤水壶",
    description: "一键开合，通勤不洒漏",
    price: 59,
    tag: "热卖",
    image: imageUrls.bottle,
  },
  {
    id: "backpack",
    name: "轻行双肩包",
    description: "13 英寸电脑仓，轻装出发",
    price: 129,
    tag: "自营",
    image: imageUrls.backpack,
  },
  {
    id: "gift",
    name: "趣汇周末礼包",
    description: "露营贴纸、杯套和旅行收纳袋",
    price: 79,
    tag: "限量",
    image: imageUrls.mug,
  },
]

const navItems: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: "recommend", label: "推荐", icon: Home },
  { key: "community", label: "社区", icon: UsersRound },
  { key: "mall", label: "商城", icon: ShoppingBag },
  { key: "messages", label: "消息", icon: MessageCircle },
  { key: "profile", label: "我的", icon: UserRound },
]

function StatusBar() {
  return (
    <div className="status-bar" aria-label="系统状态">
      <span>9:41</span>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <span className="text-[10px]">●●●</span>
        <span className="text-[10px]">Wi-Fi</span>
        <span className="rounded-sm border border-current px-1 text-[9px]">
          100
        </span>
      </span>
    </div>
  )
}

function BottomNav({
  current,
  onChange,
  unreadCount,
}: {
  current: PageKey
  onChange: (page: PageKey) => void
  unreadCount: number
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
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function IconButton({
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

function PageHeader({
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

function CommunityCard({
  activity,
  compact = false,
}: {
  activity: (typeof activities)[number]
  compact?: boolean
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
            <span className="text-[11px] text-muted-foreground">
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
              {activity.people}
            </span>
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock3 size={13} /> 距离截止 6 小时
          </span>
          <Button variant="link" size="sm" className="h-auto p-0 text-primary">
            查看详情 <ChevronRight size={14} />
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

function ProductCard({
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

function RecommendPage({ onOpenMessages }: { onOpenMessages: () => void }) {
  const [filter, setFilter] = useState("关注")
  const [liked, setLiked] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  return (
    <div className="page-content">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">
            星期三 · 8 月 6 日
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.02em]">
            趣汇
          </h1>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} /> 杭州 · 今天一起去做点有趣的事
          </p>
        </div>
        <div className="flex gap-2">
          <IconButton
            label="搜索"
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search size={18} />
          </IconButton>
          <IconButton label="查看消息" onClick={onOpenMessages}>
            <Bell size={18} />
          </IconButton>
        </div>
      </div>
      {searchOpen ? (
        <Input
          autoFocus
          placeholder="搜索社区、商品或通知"
          className="mb-4 h-10 bg-white"
        />
      ) : null}
      <button
        type="button"
        onClick={onOpenMessages}
        className="mb-5 flex w-full items-center gap-3 rounded-xl border border-[#d6e3ef] bg-[var(--qh-blue-soft)] p-3 text-left transition hover:border-primary/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--qh-blue)] text-white">
          <Megaphone size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm">你的周末拼单已成团</strong>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            3 条业务通知待查看
          </span>
        </span>
        <ChevronRight size={18} className="text-[var(--qh-blue)]" />
      </button>
      <div className="hide-scrollbar mb-5 flex gap-2 overflow-x-auto pb-0.5">
        {["关注", "附近", "拼单", "凑伙", "商城"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${filter === item ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:border-primary/40"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <Card className="mb-5 overflow-hidden border-0 bg-[#e5efe8] shadow-none">
        <div className="grid grid-cols-[0.92fr_1.08fr]">
          <div className="min-h-[216px] overflow-hidden">
            <img
              className="image-cover"
              src={imageUrls.hike}
              alt="径山徒步活动"
            />
          </div>
          <div className="flex flex-col justify-center p-4">
            <Badge
              className="mb-3 w-fit border-0 bg-primary/10 text-[10px] text-primary"
              variant="outline"
            >
              <Compass size={12} /> 娱乐凑伙 · 附近
            </Badge>
            <h2 className="text-[19px] leading-tight font-extrabold">
              周日径山轻徒步
              <br />
              还差 2 位同行者
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              08:30 集合 · 人均约 ¥68
              <br />
              发起人：林同学 · 已认证
            </p>
            <Button
              type="button"
              className="mt-4 h-9 justify-between px-3 text-xs"
              onClick={() => setLiked(true)}
            >
              {liked ? "已加入行程" : "去参与"}
              <Heart size={15} fill={liked ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      </Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">为你推荐</h2>
        <button type="button" className="text-xs font-semibold text-primary">
          刚刚更新
        </button>
      </div>
      <div className="space-y-3">
        <CommunityCard activity={activities[0]} />
        <Card className="border-0 bg-[var(--qh-yellow-soft)] shadow-none">
          <CardContent className="flex items-center gap-3 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f3bf54] text-[#604713]">
              <Clock3 size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#77551c]">活动提醒</p>
              <p className="mt-1 truncate text-sm font-bold">
                今晚 20:00 · 游戏小队准时开局
              </p>
            </div>
            <ChevronRight size={16} className="text-[#a3751f]" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CommunityPage() {
  const [activeType, setActiveType] = useState("全部")
  const [filterOpen, setFilterOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const visibleActivities = useMemo(
    () =>
      activeType === "全部"
        ? activities
        : activities.filter((activity) => activity.type === activeType),
    [activeType]
  )
  const communityCategories: Array<{
    Icon: typeof UsersRound
    label: string
    count: string
    tone: string
  }> = [
    {
      Icon: UsersRound,
      label: "购物拼单",
      count: "12 个进行中",
      tone: "bg-secondary text-primary",
    },
    {
      Icon: Bike,
      label: "出行拼车",
      count: "6 条顺路",
      tone: "bg-[var(--qh-blue-soft)] text-[var(--qh-blue)]",
    },
    {
      Icon: Gamepad2,
      label: "娱乐凑伙",
      count: "9 个今晚",
      tone: "bg-[var(--qh-coral-soft)] text-[var(--qh-coral)]",
    },
  ]
  const createTypes: Array<{ Icon: typeof UsersRound; label: string }> = [
    { Icon: UsersRound, label: "拼单" },
    { Icon: Bike, label: "拼车" },
    { Icon: Gamepad2, label: "凑伙" },
  ]
  return (
    <div className="page-content">
      <PageHeader
        eyebrow="一起做成一件事"
        title="社区"
        action={
          <IconButton label="发布社区活动" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
          </IconButton>
        }
      />
      {created ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-primary">
          <CheckCheck size={15} /> 草稿已保存，可在“我的”中继续编辑
        </div>
      ) : null}
      <div className="mb-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="h-10 bg-white pl-9"
            placeholder="搜索活动、地点或主题"
          />
        </div>
        <IconButton
          label="筛选活动"
          onClick={() => setFilterOpen((value) => !value)}
        >
          <SlidersHorizontal size={17} />
        </IconButton>
      </div>
      {filterOpen ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-border bg-white p-3">
          <Badge
            variant="outline"
            className="cursor-pointer bg-secondary text-primary"
          >
            附近 5 km
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            今天
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            人数优先
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            仅看已认证
          </Badge>
        </div>
      ) : null}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {communityCategories.map(({ Icon, label, count, tone }) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              setActiveType(
                label === "购物拼单"
                  ? "拼单"
                  : label === "出行拼车"
                    ? "拼车"
                    : "凑伙"
              )
            }
            className={`flex min-h-[88px] flex-col justify-between rounded-lg p-3 text-left transition hover:-translate-y-0.5 ${tone}`}
          >
            <span>
              <Icon size={19} />
            </span>
            <span>
              <strong className="block text-xs">{label}</strong>
              <span className="mt-1 block text-[10px] opacity-75">{count}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-title">附近活动</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            找到和你顺路、同趣的人
          </p>
        </div>
        <span className="text-xs font-semibold text-primary">
          {visibleActivities.length} 条
        </span>
      </div>
      <Tabs value={activeType} onValueChange={setActiveType} className="mb-3">
        <TabsList className="w-full bg-muted">
          <TabsTrigger value="全部">全部</TabsTrigger>
          <TabsTrigger value="拼单">拼单</TabsTrigger>
          <TabsTrigger value="拼车">拼车</TabsTrigger>
          <TabsTrigger value="凑伙">凑伙</TabsTrigger>
        </TabsList>
        <TabsContent value={activeType} className="mt-3 space-y-3">
          {visibleActivities.map((activity) => (
            <CommunityCard key={activity.id} activity={activity} />
          ))}
        </TabsContent>
      </Tabs>
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[82svh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>发起一场社区活动</SheetTitle>
            <SheetDescription>
              选择你要聚集的人，再补充时间、地点和人数。
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {createTypes.map(({ Icon, label }) => (
                <Button
                  key={label}
                  type="button"
                  variant={label === "拼单" ? "default" : "outline"}
                  className="h-12 flex-col gap-1 text-xs"
                >
                  <Icon size={16} />
                  {label}
                </Button>
              ))}
            </div>
            <Input placeholder="活动标题，例如：周末一起去露营" />
            <Input placeholder="时间、地点或线上房间" />
            <Input placeholder="目标人数，例如：5" type="number" />
            <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              线下活动会默认开启成员隐私保护，联系方式只对已确认成员可见。
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              onClick={() => {
                setCreateOpen(false)
                setCreated(true)
              }}
              className="w-full"
            >
              保存为草稿 <ChevronRight size={16} />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function MallPage({
  cartCount,
  onAdd,
}: {
  cartCount: number
  onAdd: () => void
}) {
  const [category, setCategory] = useState("推荐")
  const categories = ["推荐", "实物商品", "会员权益", "服务产品"]
  return (
    <div className="page-content">
      <PageHeader
        eyebrow="趣汇自营 · 正品保障"
        title="商城"
        action={
          <span className="relative">
            <IconButton label="查看购物车">
              <ShoppingCart size={18} />
            </IconButton>
            {cartCount > 0 ? (
              <span className="unread-dot">{cartCount}</span>
            ) : null}
          </span>
        }
      />
      <div className="relative mb-5">
        <Search
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          className="h-10 bg-white pl-9"
          placeholder="搜一件让周末更有趣的东西"
        />
      </div>
      <Card className="mb-5 overflow-hidden border-0 bg-[#e9efe7] shadow-none">
        <div className="grid min-h-[150px] grid-cols-[1.12fr_0.88fr]">
          <div className="flex flex-col justify-center p-4">
            <Badge
              className="mb-2 w-fit border-0 bg-white/80 text-[10px] text-primary"
              variant="outline"
            >
              <Sparkles size={12} /> 本周上新
            </Badge>
            <h2 className="text-[19px] leading-tight font-extrabold">
              把周末装进
              <br />
              一只轻行包
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              会员首单包邮 · 仅限 200 件
            </p>
            <Button type="button" size="sm" className="mt-3 w-fit text-xs">
              去看看 <ChevronRight size={14} />
            </Button>
          </div>
          <div className="overflow-hidden">
            <img
              className="image-cover"
              src={imageUrls.backpack}
              alt="轻行双肩包"
            />
          </div>
        </div>
      </Card>
      <div className="hide-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${category === item ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-title">精选好物</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            公司自营，售后更省心
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-1 text-xs text-primary"
        >
          查看全部 <ChevronRight size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-primary" /> 正品保障
        </span>
        <span className="flex items-center gap-1">
          <Truck size={13} className="text-primary" /> 7 天售后
        </span>
        <span className="flex items-center gap-1">
          <PackageCheck size={13} className="text-primary" /> 及时发货
        </span>
      </div>
    </div>
  )
}

function MessagesPage({ onRead }: { onRead: () => void }) {
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

function ProfilePage() {
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [code, setCode] = useState("")
  const [redeemed, setRedeemed] = useState(false)
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">系统设置</h2>
        <span className="text-xs text-muted-foreground">账户偏好</span>
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
      <Button
        type="button"
        variant="ghost"
        className="mt-5 w-full text-muted-foreground"
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
    </div>
  )
}

function App() {
  const [page, setPage] = useState<PageKey>("recommend")
  const [cartCount, setCartCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(8)
  const openMessages = () => setPage("messages")
  const content =
    page === "recommend" ? (
      <RecommendPage onOpenMessages={openMessages} />
    ) : page === "community" ? (
      <CommunityPage />
    ) : page === "mall" ? (
      <MallPage
        cartCount={cartCount}
        onAdd={() => setCartCount((count) => count + 1)}
      />
    ) : page === "messages" ? (
      <MessagesPage onRead={() => setUnreadCount(0)} />
    ) : (
      <ProfilePage />
    )
  return (
    <div className="prototype-stage">
      <section className="phone-shell" aria-label="趣汇移动端原型">
        <StatusBar />
        <main className="phone-content">{content}</main>
        <BottomNav
          current={page}
          onChange={setPage}
          unreadCount={unreadCount}
        />
      </section>
    </div>
  )
}

export default App
