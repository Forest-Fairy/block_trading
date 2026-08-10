import { useState } from "react"
import { ChevronRight, Search, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  activities,
  isActivityVisible,
  participantSummary,
  products,
  type ViewerMode,
} from "@/prototype/data"

export function SearchPage({
  onBack,
  onOpenPostDetail,
  onOpenProductDetail,
  campusMode,
  viewerMode,
}: {
  onBack: () => void
  onOpenPostDetail: (activityId: string) => void
  onOpenProductDetail: (productId: string) => void
  campusMode: boolean
  viewerMode: ViewerMode
}) {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [scope, setScope] = useState("全部")
  const [toast, setToast] = useState("")
  const recentSearches = ["露营", "机场拼车", "通勤水壶"]
  const hotSearches = ["周末徒步", "山姆拼单", "桌游组队", "城市通勤"]

  const submitSearch = () => {
    if (!query.trim()) {
      setToast("请输入搜索内容")
      window.setTimeout(() => setToast(""), 2200)
      return
    }
    setSubmitted(true)
  }

  const normalizedQuery = query.trim().toLowerCase()
  const activityResults = activities.filter((activity) => {
    if (!isActivityVisible(activity, campusMode, viewerMode)) return false
    if (!submitted || !normalizedQuery) return true
    return `${activity.title}${activity.detail}`
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const productResults = products.filter((product) => {
    if (viewerMode === "guest") return false
    if (!submitted || !normalizedQuery) return true
    return `${product.name}${product.description}`
      .toLowerCase()
      .includes(normalizedQuery)
  })

  return (
    <div className="page-content">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 bg-[var(--background)] px-4 pt-1 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="返回推荐"
          onClick={onBack}
        >
          <ChevronRight className="rotate-180" size={19} />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSubmitted(false)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitSearch()
            }}
            placeholder="搜社区、商品和订单"
            className="h-10 rounded-full bg-white pr-3 pl-9"
          />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          取消
        </Button>
      </div>

      {!submitted ? (
        <div className="space-y-6 pt-3">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title text-base">最近搜索</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-xs text-muted-foreground"
                onClick={() => setQuery("")}
              >
                清空
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground"
                  onClick={() => {
                    setQuery(item)
                    setSubmitted(true)
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title text-base">大家都在搜</h2>
              <Badge
                variant="outline"
                className="border-0 bg-secondary text-[10px] text-primary"
              >
                <Sparkles size={12} /> 热门
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {hotSearches.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-white px-3 text-left text-xs font-semibold"
                  onClick={() => {
                    setQuery(item)
                    setSubmitted(true)
                  }}
                >
                  <span
                    className={`text-sm font-extrabold ${index < 2 ? "text-[var(--qh-coral)]" : "text-muted-foreground"}`}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          </section>
          <Card className="border-0 bg-[#e5efe8] shadow-none">
            <CardContent className="flex items-center gap-3 p-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
                <Search size={17} />
              </span>
              <div>
                <p className="text-sm font-bold">搜到的不只是商品</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  社区活动、商城好物和订单状态都能直接找到
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="pt-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">搜索结果</p>
              <h1 className="mt-1 text-xl font-extrabold">“{query}”</h1>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={submitSearch}
            >
              <Search size={14} /> 再搜一次
            </Button>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {["全部", "社区", "商城"].map((item) => (
              <button
                key={item}
                type="button"
                className={`min-h-8 rounded-md text-xs font-semibold ${scope === item ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setScope(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {scope !== "商城" ? (
            <div className="space-y-3">
              {activityResults.map((activity) => (
                <Card
                  key={activity.id}
                  className="overflow-hidden transition hover:border-primary/40"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenPostDetail(activity.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onOpenPostDetail(activity.id)
                    }
                  }}
                >
                  <div className="flex gap-3 p-3">
                    <div className="size-[76px] shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        className="image-cover"
                        src={activity.image}
                        alt=""
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="outline"
                        className="border-0 bg-secondary text-[10px] text-primary"
                      >
                        {activity.type}
                      </Badge>
                      <h3 className="mt-1 truncate text-sm font-bold">
                        {activity.title}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {activity.detail}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-[var(--qh-coral)]">
                        {participantSummary(activity)} · {activity.distance}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="mt-1 text-muted-foreground"
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
          {scope !== "社区" ? (
            <div
              className={`${scope !== "商城" && activityResults.length ? "mt-5" : ""} space-y-3`}
            >
              {productResults.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenProductDetail(product.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onOpenProductDetail(product.id)
                    }
                  }}
                >
                  <div className="flex gap-3 p-3">
                    <div className="size-[76px] shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img
                        className="image-cover"
                        src={product.image}
                        alt={product.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="outline"
                        className="border-0 bg-[var(--qh-yellow-soft)] text-[10px] text-[#77551c]"
                      >
                        趣汇自营 · {product.tag}
                      </Badge>
                      <h3 className="mt-1 truncate text-sm font-bold">
                        {product.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {product.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-[var(--qh-coral)]">
                          ¥ {product.price}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          aria-label={`查看${product.name}详情`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenProductDetail(product.id)
                          }}
                        >
                          去看看 <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
          {!activityResults.length && !productResults.length ? (
            <Card className="border-dashed bg-white/70 shadow-none">
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <Search size={24} className="text-primary" />
                <p className="text-sm font-bold">没有找到相关内容</p>
                <p className="text-xs text-muted-foreground">
                  试试搜索“露营”“拼车”或“水壶”
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
