import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import {
  ArrowLeft,
  Check,
  Headphones,
  ImagePlus,
  Mic,
  Send,
  Sparkles,
  Undo2,
} from "lucide-react"
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
import type { AssistantAction } from "@/components/floating-assistant"

type DraftFields = Record<string, string>
export type CreateType =
  | "拼单"
  | "拼车"
  | "线下组队"
  | "线上开黑"
  | "普通求助"
  | "紧急求助"
export type AssistantDraft = { createType: CreateType | null; form: DraftFields }

const actionTitle: Record<AssistantAction, string> = {
  combine: "智能建帖",
  team: "智能建帖",
  help: "发起求助",
  service: "在线客服",
}

const options: Record<Exclude<AssistantAction, "service">, CreateType[]> = {
  combine: ["拼单", "拼车"],
  team: ["线下组队", "线上开黑"],
  help: ["普通求助", "紧急求助"],
}

const posters = ["#dbece4", "#dfeafb", "#f7e3cf", "#f5e2e8"]
const requiredFields = ["主题", "时间", "地点或线上方式", "人数规则", "费用或报酬"]

function guidanceFor(type: CreateType) {
  const copy: Record<CreateType, string> = {
    拼单: "已选择拼单。请一次说清商品或服务、预算、目标人数、截止时间和交付方式。",
    拼车: "已选择拼车。请一次说清出发地、目的地、时间、同行人数和费用方式。",
    线下组队: "已选择线下组队。请一次说清活动、集合时间、地点、人数、费用和参与要求。",
    线上开黑: "已选择线上开黑。请一次说清游戏、平台、开局时间、人数和段位或语音要求。",
    普通求助: "已选择普通求助。请一次说清需要什么帮助、时间、地点、报酬和最晚响应时间。",
    紧急求助: "已选择紧急求助。如遇人身危险请优先拨打当地紧急电话；再描述需要的帮助、地点、时效和最晚响应时间。",
  }
  return copy[type]
}

export function AssistantChatPage({
  action,
  initialDraft,
  onClose,
  onSaveDraft,
}: {
  action: AssistantAction
  initialDraft?: AssistantDraft
  onClose: () => void
  onSaveDraft: (draft: AssistantDraft | null) => void
}) {
  const [createType, setCreateType] = useState<CreateType | null>(
    initialDraft?.createType ?? null
  )
  const [input, setInput] = useState("")
  const [draft, setDraft] = useState<DraftFields>(initialDraft?.form ?? {})
  const [messages, setMessages] = useState<string[]>(
    action === "service"
      ? ["你好，我是趣汇在线客服。请描述遇到的问题，我会协助你处理。"]
      : initialDraft?.createType
        ? ["已恢复未完成草稿。你可以继续补充，或返回类型选择。", guidanceFor(initialDraft.createType)]
        : ["你好，我会把你的描述整理成可编辑的发帖草稿。先选择明确类型。"]
  )
  const [manual, setManual] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [round, setRound] = useState(Object.keys(initialDraft?.form ?? {}).length ? 1 : 0)
  const [manualFields, setManualFields] = useState<string[]>([])
  const [candidates, setCandidates] = useState<DraftFields>({})
  const [images, setImages] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [recordCancel, setRecordCancel] = useState(false)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const streamTimers = useRef<number[]>([])
  const recordStart = useRef<number | null>(null)
  const isService = action === "service"
  const missing = useMemo(
    () => requiredFields.filter((field) => !draft[field]),
    [draft]
  )
  const completed = !isService && createType !== null && missing.length === 0

  useEffect(() => {
    if (!isService && (createType || Object.keys(draft).length)) {
      onSaveDraft({ createType, form: draft })
    }
  }, [createType, draft, isService, onSaveDraft])

  useEffect(() => () => {
    streamTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const chooseType = (type: CreateType) => {
    setDirty(true)
    setCreateType(type)
    setMessages((items) => [...items, `已选择：${type}`, guidanceFor(type)])
  }

  const returnToType = () => {
    setDirty(true)
    setCreateType(null)
    setDraft({})
    setCandidates({})
    setManualFields([])
    setRound(0)
    setMessages((items) => [...items, "已返回类型选择，请重新选择帖子类型。"])
  }

  const send = () => {
    const message = input.trim()
    if (!message || streaming) return
    setInput("")
    setMessages((items) => [...items, `你：${message}`])
    if (isService) {
      streamTimers.current.push(
        window.setTimeout(() => {
          setMessages((items) => [...items, "已收到。为更快定位，请补充订单号或相关帖子标题。"])
        }, 450)
      )
      return
    }

    setStreaming(true)
    const force = /改|改成|改为|换成/.test(message) ? ["时间"] : []
    const patches = round === 0
      ? [
          ["主题", createType === "拼车" ? "周五晚虹桥至苏州拼车" : createType === "线上开黑" ? "周末双排组队" : createType?.includes("求助") ? "临时求助" : "周末一起发起"],
          ["时间", force.length ? "周六 19:00" : "本周六 14:00"],
          ["地点或线上方式", createType === "线上开黑" ? "线上语音房" : "虹桥附近"],
        ]
      : [
          ["人数规则", "2 人起，最多 4 人"],
          ["费用或报酬", createType?.includes("求助") ? "50 元" : "每人约 80 元"],
        ]

    patches.forEach(([field, value], index) => {
      streamTimers.current.push(
        window.setTimeout(() => {
          const canForce = force.includes(field)
          if (manualFields.includes(field) && !canForce) {
            setCandidates((values) => ({ ...values, [field]: value }))
          } else {
            setDraft((values) => ({ ...values, [field]: value }))
          }
          if (index === patches.length - 1) {
            setRound((valueRound) => valueRound + 1)
            setStreaming(false)
            setMessages((items) => [
              ...items,
              force.length
                ? "已根据你的明确修改更新对应字段。"
                : round === 0
                  ? "我已回填可识别的信息。请补充人数规则和费用或报酬。"
                  : "必填信息已整理完成。请预览帖子，再补充图片或手动调整。",
            ])
          }
        }, 420 * (index + 1))
      )
    })
  }

  const useVoice = () => {
    setDirty(true)
    setInput("周六下午在虹桥附近，需要两位同行，预算每人 80 元")
  }

  const startRecording = (event: PointerEvent<HTMLButtonElement>) => {
    recordStart.current = event.clientY
    setRecording(true)
    setRecordCancel(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveRecording = (event: PointerEvent<HTMLButtonElement>) => {
    if (recordStart.current !== null && event.clientY < recordStart.current - 52) {
      setRecordCancel(true)
    }
  }

  const finishRecording = () => {
    if (!recording) return
    if (recordCancel) {
      setMessages((items) => [...items, "已取消本次语音录入。"])
    } else {
      setInput("我想咨询订单状态，订单号是 QH20260811001")
    }
    recordStart.current = null
    setRecording(false)
    setRecordCancel(false)
  }

  const leave = () => {
    if (!isService && dirty) {
      setSaveConfirmOpen(true)
      return
    }
    onClose()
  }

  const discardDraft = () => {
    onSaveDraft(null)
    onClose()
  }

  const saveDraftAndLeave = () => {
    onSaveDraft({ createType, form: draft })
    onClose()
  }

  const updateManualField = (field: string, value: string) => {
    setDirty(true)
    setDraft((values) => ({ ...values, [field]: value }))
    setManualFields((fields) => (fields.includes(field) ? fields : [...fields, field]))
  }

  const adoptCandidate = (field: string) => {
    setDraft((values) => ({ ...values, [field]: candidates[field] }))
    setCandidates((values) => {
      const next = { ...values }
      delete next[field]
      return next
    })
  }

  const title = draft["主题"] || createType || "趣汇新帖子"
  const posterIndex = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % posters.length

  return (
    <div className="assistant-chat-page">
      <header className="assistant-chat-header">
        <Button type="button" variant="ghost" size="icon" aria-label="返回" onClick={leave}>
          <ArrowLeft />
        </Button>
        {!isService ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setManual((value) => !value)}>
            {manual ? "继续对话" : "手动填写"}
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">趣汇助手</p>
          <h1 className="truncate text-base font-bold">{actionTitle[action]}</h1>
        </div>
        {isService ? <Headphones className="mr-2 text-primary" size={21} /> : null}
      </header>

      {manual && !isService ? (
        <section className="assistant-manual-page">
          <div className="assistant-image-picker">
            {images.length ? (
              images.map((name, index) => <div className="assistant-image-item" key={name}><span>{name}</span>{index === 0 ? <b>封面</b> : null}</div>)
            ) : (
              <div className="assistant-poster" style={{ background: posters[posterIndex] }}><span>{title}</span></div>
            )}
            <label className="assistant-add-image" htmlFor="assistant-images"><ImagePlus size={20} />添加图片</label>
            <input id="assistant-images" className="sr-only" type="file" multiple accept="image/*" onChange={(event) => { setDirty(true); setImages(Array.from(event.target.files ?? []).map((file) => file.name)) }} />
          </div>
          <p className="mb-3 text-xs text-muted-foreground">第一张图片自动作为帖子封面；未上传时使用随机封面。</p>
          {requiredFields.map((field) => <Input key={field} className="mb-2" value={draft[field] ?? ""} placeholder={field} onChange={(event) => updateManualField(field, event.target.value)} />)}
        </section>
      ) : (
        <section className="assistant-chat-scroll" aria-live="polite">
          {isService ? <ServiceHint /> : createType ? (
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={returnToType}><Undo2 />返回类型选择</Button>
          ) : (
            <div className="assistant-type-options">
              {options[action as Exclude<AssistantAction, "service">].map((type) => (
                <Button key={type} type="button" variant="outline" onClick={() => chooseType(type)}>{type}</Button>
              ))}
            </div>
          )}
          {messages.map((message, index) => <p key={`${message}-${index}`} className={message.startsWith("你：") ? "assistant-user-message" : "assistant-bot-message"}>{message}</p>)}
          {!isService && Object.keys(draft).length ? (
            <Card className="assistant-draft-card">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-xs font-bold"><Sparkles size={14} className="text-primary" />{streaming ? "正在回填草稿" : "建帖草稿"}</span><span className="text-[11px] text-muted-foreground">{`{ form, force }`}</span></div>
                {Object.entries(draft).map(([field, value]) => <div className="assistant-draft-field" key={field}><span>{field}</span><strong>{value}</strong></div>)}
                {Object.entries(candidates).map(([field, value]) => <div className="assistant-candidate" key={field}><span>{field} 建议改为“{value}”</span><Button type="button" size="xs" onClick={() => adoptCandidate(field)}>采用</Button></div>)}
                {missing.length ? <p className="mt-2 text-xs text-[var(--qh-coral)]">待补充：{missing.slice(0, 2).join("、")}</p> : <p className="mt-2 flex items-center gap-1 text-xs text-primary"><Check size={14} />必填信息已齐全</p>}
              </CardContent>
            </Card>
          ) : null}
          {completed ? <Button type="button" className="w-full" onClick={() => setManual(true)}>预览帖子</Button> : null}
        </section>
      )}

      {!manual ? (
        <section className="assistant-input-bar">
          <Input value={input} disabled={!isService && !createType} placeholder={isService ? "输入要咨询的问题" : createType ? "一次说清你想创建的所有信息" : "请先选择创建类型"} onChange={(event) => { setDirty(true); setInput(event.target.value) }} onKeyDown={(event) => { if (event.key === "Enter") send() }} />
          {isService ? (
            <Button type="button" variant={recording ? "destructive" : "outline"} size="icon" aria-label="按住语音输入" title="按住录音，上划取消，松开转文字" onPointerDown={startRecording} onPointerMove={moveRecording} onPointerUp={finishRecording} onPointerCancel={finishRecording}><Mic /></Button>
          ) : <Button type="button" variant="outline" size="icon" aria-label="语音输入" title="语音输入，转写后需确认" onClick={useVoice}><Mic /></Button>}
          <Button type="button" size="icon" aria-label="发送" onClick={send} disabled={!input.trim() || (!isService && !createType) || streaming}><Send /></Button>
        </section>
      ) : null}
      {recording ? <div className="assistant-recording-state"><Mic size={18} />{recordCancel ? "松开取消录音" : "正在录音，上划取消，松开转文字"}</div> : null}
      <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>是否保存草稿？</DialogTitle>
            <DialogDescription>保存后可从悬浮助手的对应功能继续编辑。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={discardDraft}>暂不保存</Button>
            <Button type="button" onClick={saveDraftAndLeave}>保存草稿</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ServiceHint() {
  return <Card className="border-[var(--qh-blue)]/20 bg-[var(--qh-blue-soft)]"><CardContent className="flex gap-2 p-3 text-xs text-[var(--qh-blue)]"><Headphones size={17} className="shrink-0" />客服回复以会话消息和站内通知为准，请勿在聊天中发送身份证、支付密码等敏感信息。</CardContent></Card>
}
