import { useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  PackageCheck,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { products } from "@/prototype/data"
import { IconButton, PageHeader } from "@/components/prototype-shell"
import { formatCurrentLocation } from "@/lib/location-display"

export function ProductDetailPage({
  productId,
  onBack,
}: {
  productId: string
  onBack: () => void
}) {
  const product = products.find((item) => item.id === productId) ?? products[0]
  const [toast, setToast] = useState("")

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="趣汇自营 · 商品详情"
        title="商品详情"
        leading={
          <IconButton label="返回商城" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        }
        action={
          <IconButton
            label="分享商品"
            onClick={() => showToast("已复制商品分享链接")}
          >
            <Share2 size={17} />
          </IconButton>
        }
      />
      <Card className="overflow-hidden border-0 shadow-none">
        <div className="aspect-square overflow-hidden bg-muted">
          <img className="image-cover" src={product.image} alt={product.name} />
        </div>
        <CardContent className="space-y-5 p-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <Badge
                variant="outline"
                className="border-0 bg-[var(--qh-yellow-soft)] text-[0.625rem] text-[#77551c]"
              >
                趣汇自营 · {product.tag}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`收藏${product.name}`}
                onClick={() => showToast("已收藏商品")}
              >
                <Heart size={17} />
              </Button>
            </div>
            <h2 className="mt-3 text-xl leading-tight font-extrabold">
              {product.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {product.description}
            </p>
            <p className="mt-3 text-2xl font-extrabold text-[var(--qh-coral)]">
              ¥ {product.price}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-center text-[0.6875rem] text-muted-foreground">
            <span className="flex flex-col items-center gap-1">
              <ShieldCheck size={15} className="text-primary" />
              正品保障
            </span>
            <span className="flex flex-col items-center gap-1">
              <Truck size={15} className="text-primary" />
              及时发货
            </span>
            <span className="flex flex-col items-center gap-1">
              <PackageCheck size={15} className="text-primary" />7 天售后
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 size={16} className="text-primary" />
              商品信息
            </div>
            <div className="space-y-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <p>规格：标准款 · 当前库存充足</p>
              <p className="flex items-center gap-1">
                <MapPin size={13} className="text-primary" />
                配送范围：{formatCurrentLocation({ district: "滨江区", street: "西兴街道" })}，预计 1-2 个工作日送达
              </p>
              <p>售后：签收后 7 天内支持质量问题退换</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div>
              <p className="text-xs font-semibold">想进一步了解？</p>
              <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                查看规格与配送说明后再决定
              </p>
            </div>
            <Button type="button" onClick={() => showToast("已打开购买说明")}>
              去看看
            </Button>
          </div>
        </CardContent>
      </Card>
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
