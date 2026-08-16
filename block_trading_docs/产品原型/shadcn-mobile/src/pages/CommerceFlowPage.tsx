import { useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconButton, PageHeader } from "@/components/prototype-shell"
import { products, type ViewerMode } from "@/prototype/data"

export type CommerceStage = "cart" | "checkout" | "paid"

export function CommerceFlowPage({
  productId,
  cartCount,
  viewerMode,
  initialStage,
  onBack,
  onCartCountChange,
}: {
  productId: string
  cartCount: number
  viewerMode: ViewerMode
  initialStage: CommerceStage
  onBack: () => void
  onCartCountChange: (count: number) => void
}) {
  const product = products.find((item) => item.id === productId) ?? products[0]
  const [stage, setStage] = useState<CommerceStage>(initialStage)
  const [quantity, setQuantity] = useState(
    initialStage === "checkout" ? Math.max(1, cartCount) : cartCount
  )
  const [toast, setToast] = useState("")
  const total = (Number(product.price) * Math.max(1, quantity)).toFixed(2)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }

  const confirmOrder = () => {
    const nextQuantity = Math.max(1, quantity)
    setQuantity(nextQuantity)
    onCartCountChange(nextQuantity)
    setStage("checkout")
  }

  const pay = () => {
    onCartCountChange(0)
    setStage("paid")
  }

  if (viewerMode === "guest") {
    return (
      <div className="page-content">
        <PageHeader
          eyebrow="游客预览 · 不产生交易事实"
          title="交易流程预览"
          leading={
            <IconButton label="返回商城" onClick={onBack}>
              <ArrowLeft size={18} />
            </IconButton>
          }
        />
        <Card className="border-primary/20 bg-secondary/60 py-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold">商城和交易步骤可预览</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  当前不会创建购物车、订单或支付记录，也不会展示任何真实用户订单。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="commerce-step-strip" aria-label="交易步骤">
          {["购物车", "确认订单", "支付结果"].map((label, index) => (
            <span key={label}>
              <b>{index + 1}</b>
              {label}
            </span>
          ))}
        </div>
        <Card className="mt-4 py-0">
          <CardContent className="flex gap-3 p-3">
            <img
              className="size-20 rounded-md object-cover"
              src={product.image}
              alt={product.name}
            />
            <div className="min-w-0 flex-1">
              <Badge variant="outline">公开商品示例</Badge>
              <h2 className="mt-2 truncate text-sm font-bold">
                {product.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                价格快照、配送地址和支付能力将在认证后确认。
              </p>
            </div>
          </CardContent>
        </Card>
        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => showToast("请先完成身份信息认证，认证后自动入会")}
        >
          <LockKeyhole /> 完成认证后入会
        </Button>
        {toast ? (
          <div className="recommend-toast" role="status">
            {toast}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="R1 基础交易 · 白名单验证"
        title={
          stage === "cart"
            ? "购物车"
            : stage === "checkout"
              ? "确认订单"
              : "支付结果"
        }
        leading={
          <IconButton label="返回商城" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        }
      />
      <div className="commerce-step-strip" aria-label="交易进度">
        {["购物车", "确认订单", "支付结果"].map((label, index) => {
          const activeIndex =
            stage === "cart" ? 0 : stage === "checkout" ? 1 : 2
          return (
            <span key={label} data-active={index <= activeIndex}>
              <b>{index + 1}</b>
              {label}
            </span>
          )
        })}
      </div>

      {stage === "paid" ? (
        <Card className="mt-4 border-primary/20 bg-secondary/50 py-0">
          <CardContent className="p-5 text-center">
            <CheckCircle2 className="mx-auto text-primary" size={38} />
            <h2 className="mt-3 text-lg font-bold">白名单支付成功</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              订单 QH-R1-20260816-001 已进入待发货。当前为 R1
              支付结果原型，不连接真实资金渠道。
            </p>
            <Button type="button" className="mt-4" onClick={onBack}>
              返回商城
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mt-4 py-0">
            <CardContent className="flex gap-3 p-3">
              <img
                className="size-20 rounded-md object-cover"
                src={product.image}
                alt={product.name}
              />
              <div className="min-w-0 flex-1">
                <Badge variant="outline">趣汇自营</Badge>
                <h2 className="mt-2 truncate text-sm font-bold">
                  {product.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  标准款 · 库存充足
                </p>
                <p className="mt-2 font-extrabold text-[var(--qh-coral)]">
                  ¥ {product.price}
                </p>
              </div>
            </CardContent>
          </Card>

          {stage === "cart" ? (
            quantity > 0 ? (
              <div className="mt-4 flex items-center justify-between rounded-lg border bg-white p-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag size={17} />
                  购买数量
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="减少数量"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                  >
                    -
                  </Button>
                  <strong>{quantity}</strong>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="增加数量"
                    onClick={() => setQuantity((value) => value + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="mt-4 py-0">
                <CardContent className="p-4 text-center text-xs text-muted-foreground">
                  购物车为空，请先从商品详情加入商品。
                </CardContent>
              </Card>
            )
          ) : (
            <div className="mt-4 space-y-3">
              <Card className="py-0">
                <CardContent className="flex items-start gap-3 p-3">
                  <MapPin className="mt-0.5 shrink-0 text-primary" size={17} />
                  <div>
                    <p className="text-sm font-bold">配送地址</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      杭州市滨江区西兴街道 · 会员认证地址
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="flex items-start gap-3 p-3">
                  <CreditCard
                    className="mt-0.5 shrink-0 text-primary"
                    size={17}
                  />
                  <div>
                    <p className="text-sm font-bold">价格快照</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      确认订单后冻结本次商品单价和数量，支付前不静默替换。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-5 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>商品数量</span>
              <span>x {Math.max(1, quantity)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <strong>应付合计</strong>
              <strong className="text-lg text-[var(--qh-coral)]">
                ¥ {total}
              </strong>
            </div>
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={stage === "cart" && quantity === 0}
            onClick={stage === "cart" ? confirmOrder : pay}
          >
            {stage === "cart" ? "确认订单" : "白名单支付"}
          </Button>
        </>
      )}
    </div>
  )
}
