import { useRef, useState } from "react"
import { ChevronRight } from "lucide-react"

const profileContent = {
  我发起的: [
    ["周末山姆零食拼单", "招募中 · 3/5 人"],
    ["明日下午借羽毛球拍", "等待响应 · 普通求助"],
  ],
  我参与的: [
    ["周日晚间开黑小队", "今晚 20:00 开始"],
    ["萧山机场至城西拼车", "周五 19:30 出发"],
  ],
  评论评价: [
    ["给林同学的活动评价", "好评 · 2 天前"],
    ["回复：取货时间可以调整吗？", "社区留言 · 昨天"],
  ],
  商城订单: [
    ["趣汇露营杯", "待发货 · ¥ 79"],
    ["城市通勤水壶", "已发货 · 预计明日送达"],
  ],
  我的收藏: [
    ["周末安吉露营组队", "线下组队 · 距你 18 km"],
    ["轻行双肩包", "商城商品 · ¥ 129"],
  ],
  趣汇空间: [
    ["收藏的周末灵感", "4 条内容"],
    ["我的活动相册", "12 张图片"],
  ],
} as const

type ProfileContentKey = keyof typeof profileContent

const profileContentCounts: Record<ProfileContentKey, number> = {
  我发起的: 6,
  我参与的: 12,
  评论评价: 24,
  商城订单: 3,
  我的收藏: 16,
  趣汇空间: 8,
}

export function ProfileContentPanel() {
  const [activeContent, setActiveContent] = useState<ProfileContentKey>("我发起的")
  const [toast, setToast] = useState("")
  const tabStripRef = useRef<HTMLDivElement | null>(null)
  const tabDragRef = useRef<{ clientX: number; scrollLeft: number } | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }

  const beginTabDrag = (clientX: number) => {
    if (!tabStripRef.current) return
    tabDragRef.current = {
      clientX,
      scrollLeft: tabStripRef.current.scrollLeft,
    }
  }

  const moveTabDrag = (clientX: number) => {
    if (!tabStripRef.current || !tabDragRef.current) return
    tabStripRef.current.scrollLeft =
      tabDragRef.current.scrollLeft + tabDragRef.current.clientX - clientX
  }

  return (
    <section className="mb-5">
      <div
        ref={tabStripRef}
        className="hide-scrollbar flex cursor-grab touch-pan-y gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-muted p-1 active:cursor-grabbing"
        role="tablist"
        aria-label="个人内容分类"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          beginTabDrag(event.clientX)
        }}
        onPointerMove={(event) => moveTabDrag(event.clientX)}
        onPointerUp={(event) => {
          tabDragRef.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={() => {
          tabDragRef.current = null
        }}
      >
        {(Object.keys(profileContent) as ProfileContentKey[]).map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={activeContent === label}
            className={`min-w-[100px] shrink-0 whitespace-nowrap rounded-md px-2 py-2 text-[11px] transition ${
              activeContent === label
                ? "bg-white font-semibold text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveContent(label)}
          >
            {label} <strong>{profileContentCounts[label]}</strong>
          </button>
        ))}
      </div>
      <div
        className="mt-3 space-y-2"
        role="tabpanel"
        aria-label={`${activeContent}内容列表`}
      >
        {profileContent[activeContent].map(([title, detail]) => (
          <button
            key={title}
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-3 text-left transition hover:border-primary/40"
            onClick={() => showToast(`已打开${title}`)}
          >
            <span className="min-w-0">
              <strong className="block truncate text-sm">{title}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </section>
  )
}
