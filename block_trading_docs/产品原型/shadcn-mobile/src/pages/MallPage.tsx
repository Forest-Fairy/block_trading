import { useState } from "react"
import {
  ChevronRight,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { imageUrls, products } from "@/prototype/data"
import {
  IconButton,
  PageHeader,
  ProductCard,
} from "@/components/prototype-shell"

export function MallPage({
  cartCount,
  onAdd,
}: {
  cartCount: number
  onAdd: () => void
}) {
  const [category, setCategory] = useState("推荐")
  const [mallFilterOpen, setMallFilterOpen] = useState(false)
  const [mallFilters, setMallFilters] = useState<Record<string, string>>({})
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
          className="gap-1 px-1 text-xs text-primary"
          onClick={() => setMallFilterOpen(true)}
        >
          <SlidersHorizontal size={14} /> 筛选
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
      <Sheet open={mallFilterOpen} onOpenChange={setMallFilterOpen}>
        <SheetContent
          side="right"
          className="w-[min(92vw,380px)] overflow-y-auto p-0"
        >
          <SheetHeader>
            <SheetTitle>商城筛选</SheetTitle>
            <SheetDescription>
              按常见电商条件筛选商品，再应用到当前商城列表。
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                商品分类
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["全部商品", "实物商品", "会员权益", "服务产品"].map(
                  (option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={
                        mallFilters.category === option ? "default" : "outline"
                      }
                      onClick={() =>
                        setMallFilters((current) => ({
                          ...current,
                          category: option,
                        }))
                      }
                    >
                      {option}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="最低价格"
                value={mallFilters.minPrice || ""}
                onChange={(event) =>
                  setMallFilters((current) => ({
                    ...current,
                    minPrice: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="最高价格"
                value={mallFilters.maxPrice || ""}
                onChange={(event) =>
                  setMallFilters((current) => ({
                    ...current,
                    maxPrice: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                排序
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["综合优先", "销量优先", "价格从低到高", "距离优先"].map(
                  (option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={
                        mallFilters.sort === option ? "default" : "outline"
                      }
                      onClick={() =>
                        setMallFilters((current) => ({
                          ...current,
                          sort: option,
                        }))
                      }
                    >
                      {option}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                商品状态
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["全新", "二手", "有货", "包邮"].map((option) => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={
                      mallFilters.status === option ? "default" : "outline"
                    }
                    onClick={() =>
                      setMallFilters((current) => ({
                        ...current,
                        status: option,
                      }))
                    }
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              className="w-full"
              onClick={() => setMallFilterOpen(false)}
            >
              应用筛选
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
