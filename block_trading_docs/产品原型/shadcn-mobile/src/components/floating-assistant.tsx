import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react"
import { Headphones, HelpCircle, Sparkles, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  type AssistantFeedbackSettings,
  playAssistantSound,
  prepareAssistantFeedback,
  stopAssistantSound,
  vibrateAssistant,
} from "@/lib/assistant-feedback"

export type AssistantAction = "combine" | "team" | "help" | "service"

const ballSize = 64
const ballRadius = ballSize / 2
const menuHeight = 170

const menuItems: Array<{
  action: AssistantAction
  label: string
  icon: typeof Sparkles
}> = [
  { action: "combine", label: "发起拼拼贴", icon: Sparkles },
  { action: "team", label: "我要组队", icon: UsersRound },
  { action: "help", label: "发起求助", icon: HelpCircle },
  { action: "service", label: "在线客服", icon: Headphones },
]

export function AssistantMenu({
  draftActions,
  onSelect,
  className = "",
}: {
  draftActions: AssistantAction[]
  onSelect: (action: AssistantAction) => void
  className?: string
}) {
  return (
    <div
      className={`assistant-menu ${className}`}
      role="menu"
      aria-label="悬浮助手菜单"
    >
      {menuItems.map(({ action, label, icon: Icon }) => (
        <Button
          key={action}
          type="button"
          variant="outline"
          role="menuitem"
          className="assistant-menu-item"
          onClick={() => onSelect(action)}
        >
          <Icon size={18} />
          <span className="min-w-0 flex-1">{label}</span>
          {draftActions.includes(action) ? (
            <span className="assistant-draft-dot" aria-label="有未完成草稿" />
          ) : null}
        </Button>
      ))}
    </div>
  )
}

type DragPosition = { left: number; top: number }

export function FloatingAssistant({
  docked,
  draftActions,
  onDockChange,
  onSelect,
  releasePointer,
  followPointer,
  followEnd,
  onInteractionComplete,
  feedbackSettings,
}: {
  docked: boolean
  draftActions: AssistantAction[]
  onDockChange: (docked: boolean) => void
  onSelect: (action: AssistantAction) => void
  releasePointer: {
    x: number
    y: number
    pointerId: number
    releasedAt: number
  } | null
  followPointer: { x: number; y: number; pointerId: number } | null
  followEnd: { x: number; y: number; pointerId: number; endedAt: number } | null
  onInteractionComplete: () => void
  feedbackSettings: AssistantFeedbackSettings
}) {
  const [side, setSide] = useState<"left" | "right">("right")
  const [top, setTop] = useState(468)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null)
  const [dockPosition, setDockPosition] = useState<DragPosition | null>(null)
  const [docking, setDocking] = useState(false)
  const [dockStage, setDockStage] = useState<
    "approach" | "center" | "embed" | null
  >(null)
  const [dockScale, setDockScale] = useState(0.56)
  const [dockAnimationKey, setDockAnimationKey] = useState(0)
  const [popping, setPopping] = useState(false)
  const [menuBottomBoundary, setMenuBottomBoundary] = useState(650)
  const pointerStart = useRef<{
    button: HTMLButtonElement
    x: number
    y: number
    pointerId: number
  } | null>(null)
  const draggingRef = useRef(false)
  const ignoreClick = useRef(false)
  const idleTimer = useRef<number | null>(null)
  const dockTimer = useRef<number | null>(null)
  const dockStageTimer = useRef<number | null>(null)
  const dockIdleTimer = useRef<number | null>(null)
  const popTimer = useRef<number | null>(null)
  const dockCandidate = useRef<DragPosition | null>(null)
  const dockPositionRef = useRef<DragPosition | null>(null)
  const suppressDockUntilExit = useRef(false)
  const assistantRef = useRef<HTMLDivElement>(null)
  const skipCollapsedClick = useRef(false)
  const releaseHasMoved = useRef(false)
  const hasDraft = draftActions.length > 0

  const scheduleCollapse = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => {
      setMenuOpen((open) => {
        if (open) {
          playAssistantSound("menu-close", feedbackSettings.soundEnabled)
        }
        return false
      })
      setCollapsed(true)
    }, 2600)
  }, [feedbackSettings.soundEnabled])

  const clearDockTimer = useCallback(() => {
    if (dockTimer.current) window.clearTimeout(dockTimer.current)
    if (dockStageTimer.current) window.clearTimeout(dockStageTimer.current)
    if (dockIdleTimer.current) window.clearTimeout(dockIdleTimer.current)
    dockTimer.current = null
    dockStageTimer.current = null
    dockIdleTimer.current = null
    dockCandidate.current = null
    stopAssistantSound("dock-charge")
    setDocking(false)
    setDockStage(null)
  }, [])

  useEffect(() => {
    scheduleCollapse()
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
      if (dockTimer.current) window.clearTimeout(dockTimer.current)
      if (dockStageTimer.current) window.clearTimeout(dockStageTimer.current)
      if (dockIdleTimer.current) window.clearTimeout(dockIdleTimer.current)
      if (popTimer.current) window.clearTimeout(popTimer.current)
      stopAssistantSound("dock-charge")
    }
  }, [scheduleCollapse])

  useEffect(() => {
    dockPositionRef.current = dockPosition
  }, [dockPosition])

  useEffect(() => {
    const updateMenuBoundary = () => {
      const shell = document.querySelector<HTMLElement>(".phone-shell")
      if (!shell) return
      const shellBounds = shell.getBoundingClientRect()
      const navBounds = shell
        .querySelector(".bottom-nav")
        ?.getBoundingClientRect()
      setMenuBottomBoundary(
        navBounds ? navBounds.top - shellBounds.top : shellBounds.height
      )
    }
    updateMenuBoundary()
    window.addEventListener("resize", updateMenuBoundary)
    return () => window.removeEventListener("resize", updateMenuBoundary)
  }, [])

  const getDragPosition = useCallback(
    (button: HTMLButtonElement, clientX: number, clientY: number) => {
      const shell = button.closest(".phone-shell")
      if (!shell) return null
      const shellBounds = shell.getBoundingClientRect()
      const navBounds = shell
        .querySelector(".bottom-nav")
        ?.getBoundingClientRect()
      const navTop = navBounds
        ? navBounds.top - shellBounds.top
        : shellBounds.height
      const currentBallSize = button.offsetWidth || ballSize
      const currentBallRadius = currentBallSize / 2
      const maxTop = Math.max(0, navTop - currentBallSize)
      return {
        left: Math.max(
          0,
          Math.min(
            clientX - shellBounds.left - currentBallRadius,
            shellBounds.width - currentBallSize
          )
        ),
        top: Math.max(
          0,
          Math.min(clientY - shellBounds.top - currentBallRadius, maxTop)
        ),
      }
    },
    []
  )

  const expand = useCallback(() => {
    setCollapsed(false)
    scheduleCollapse()
  }, [scheduleCollapse])

  const cancelDockingToRight = useCallback(
    (position?: DragPosition) => {
      const currentPosition = position ?? dockPositionRef.current
      clearDockTimer()
      setDockPosition(null)
      setDocking(false)
      setMenuOpen(false)
      setDragPosition(null)
      pointerStart.current = null
      draggingRef.current = false
      setDragging(false)
      if (currentPosition) setTop(currentPosition.top)
      setSide("right")
      scheduleCollapse()
    },
    [clearDockTimer, scheduleCollapse]
  )

  const updateDockCandidate = useCallback(
    (position: DragPosition) => {
      const dockTarget = document.querySelector<HTMLElement>(
        "[data-assistant-dock]"
      )
      const shell = document.querySelector<HTMLElement>(".phone-shell")
      if (!dockTarget || !shell) {
        clearDockTimer()
        setDockPosition(null)
        return false
      }
      const targetBounds = dockTarget.getBoundingClientRect()
      const shellBounds = shell.getBoundingClientRect()
      const currentBallSize =
        assistantRef.current?.querySelector<HTMLButtonElement>(".assistant-ball")
          ?.offsetWidth ?? ballSize
      const currentBallRadius = currentBallSize / 2
      const centerX = shellBounds.left + position.left + currentBallRadius
      const centerY = shellBounds.top + position.top + currentBallRadius
      const withinTolerance =
        Math.abs(centerX - (targetBounds.left + targetBounds.width / 2)) <=
          56 &&
        Math.abs(centerY - (targetBounds.top + targetBounds.height / 2)) <= 56
      if (suppressDockUntilExit.current) {
        if (!withinTolerance) suppressDockUntilExit.current = false
        else {
          clearDockTimer()
          setDockPosition(null)
          return false
        }
      }
      if (!withinTolerance) {
        clearDockTimer()
        setDockPosition(null)
        return false
      }
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
      setCollapsed(false)
      setDockPosition(position)
      clearDockTimer()
      dockCandidate.current = position
      dockIdleTimer.current = window.setTimeout(() => {
        const candidate = dockCandidate.current
        const target = document.querySelector<HTMLElement>(
          "[data-assistant-dock]"
        )
        const currentShell = document.querySelector<HTMLElement>(".phone-shell")
        if (!candidate || !target || !currentShell) return
        const targetRect = target.getBoundingClientRect()
        const shellRect = currentShell.getBoundingClientRect()
        const floatingBallSize =
          currentShell.querySelector<HTMLButtonElement>(".assistant-ball")
            ?.offsetWidth ?? ballSize
        const floatingBallRadius = floatingBallSize / 2
        const targetSize = targetRect.width
        const alignedPosition = {
          left: Math.max(
            0,
            Math.min(
              targetRect.left -
                shellRect.left +
                targetSize / 2 -
                floatingBallRadius,
              shellRect.width - floatingBallSize
            )
          ),
          top: Math.max(
            0,
            targetRect.top - shellRect.top + targetRect.height / 2 - floatingBallRadius
          ),
        }
        setDockScale(targetSize / floatingBallSize)
        const halfwayPosition = {
          left: (candidate.left + alignedPosition.left) / 2,
          top: (candidate.top + alignedPosition.top) / 2,
        }
        dockIdleTimer.current = null
        setDragging(false)
        draggingRef.current = false
        setPopping(false)
        setDockAnimationKey((key) => key + 1)
        setDocking(true)
        setDockStage("approach")
        setDockPosition(halfwayPosition)
        playAssistantSound("dock-charge", feedbackSettings.soundEnabled)
        dockStageTimer.current = window.setTimeout(() => {
          setDockStage("center")
          setDockPosition(alignedPosition)
          dockStageTimer.current = window.setTimeout(() => {
            dockStageTimer.current = null
            setDockStage("embed")
          }, 800)
        }, 800)
        dockTimer.current = window.setTimeout(() => {
          dockTimer.current = null
          stopAssistantSound("dock-charge")
          playAssistantSound("dock-complete", feedbackSettings.soundEnabled)
          setDocking(false)
          setDockStage(null)
          setMenuOpen(false)
          vibrateAssistant(70, feedbackSettings.vibrationEnabled)
          onDockChange(true)
        }, 2400)
      }, 500)
      return true
    },
    [clearDockTimer, feedbackSettings, onDockChange]
  )

  const startDrag = (
    button: HTMLButtonElement,
    clientX: number,
    clientY: number,
    pointerId: number
  ) => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current)
    idleTimer.current = null
    pointerStart.current = { button, x: clientX, y: clientY, pointerId }
    draggingRef.current = false
    ignoreClick.current = false
    setDragging(false)
  }

  const cancelDrag = useCallback(
    (pointerId: number) => {
      const start = pointerStart.current
      if (!start || start.pointerId !== pointerId) return
      const currentPosition = dragPosition
      const shell = start.button.closest(".phone-shell")
      pointerStart.current = null
      if (currentPosition && shell) {
        setTop(currentPosition.top)
        setSide(
          currentPosition.left + ballRadius <
            shell.getBoundingClientRect().width / 2
            ? "left"
            : "right"
        )
      }
      draggingRef.current = false
      releaseHasMoved.current = false
      setDragging(false)
      setDragPosition(null)
      onInteractionComplete()
    },
    [dragPosition, onInteractionComplete]
  )

  useEffect(() => {
    if (!releasePointer || docked) return
    const releaseFrame = window.requestAnimationFrame(() => {
      const ball = document.querySelector<HTMLButtonElement>(".assistant-ball")
      const dockTarget = document.querySelector<HTMLElement>(
        "[data-assistant-dock]"
      )
      if (!ball || !dockTarget) return
      const targetBounds = dockTarget.getBoundingClientRect()
      const releasePosition = getDragPosition(
        ball,
        targetBounds.left + targetBounds.width / 2,
        targetBounds.top + targetBounds.height / 2
      )
      if (!releasePosition) return
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
      pointerStart.current = {
        button: ball,
        x: releasePointer.x,
        y: releasePointer.y,
        pointerId: releasePointer.pointerId,
      }
      releaseHasMoved.current = false
      draggingRef.current = true
      suppressDockUntilExit.current = true
      setDockPosition(null)
      setCollapsed(false)
      setDragging(true)
      setDragPosition(releasePosition)
      setPopping(true)
      if (popTimer.current) window.clearTimeout(popTimer.current)
      popTimer.current = window.setTimeout(() => {
        popTimer.current = null
        setPopping(false)
      }, 560)
    })
    return () => {
      window.cancelAnimationFrame(releaseFrame)
    }
  }, [docked, getDragPosition, releasePointer])

  const moveDrag = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      const start = pointerStart.current
      if (!start || start.pointerId !== pointerId) return
      if (
        Math.abs(clientX - start.x) + Math.abs(clientY - start.y) > 2
      ) {
        releaseHasMoved.current = true
      }
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
      idleTimer.current = null
      const nextPosition = getDragPosition(start.button, clientX, clientY)
      if (docking) {
        clearDockTimer()
        setDockPosition(null)
        setMenuOpen(false)
        setCollapsed(false)
        suppressDockUntilExit.current = true
        draggingRef.current = true
        setDragging(true)
        if (nextPosition) setDragPosition(nextPosition)
        return
      }
      if (
        !draggingRef.current &&
        Math.abs(clientX - start.x) + Math.abs(clientY - start.y) > 8
      ) {
        draggingRef.current = true
        setDragging(true)
        setCollapsed(false)
        setMenuOpen(false)
      }
      if (nextPosition) {
        setDragPosition(nextPosition)
        updateDockCandidate(nextPosition)
      }
    },
    [clearDockTimer, docking, getDragPosition, updateDockCandidate]
  )

  const finishDrag = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      const start = pointerStart.current
      if (!start || start.pointerId !== pointerId) return
      pointerStart.current = null
      if (!draggingRef.current) return
      const releasedFromDock =
        suppressDockUntilExit.current && !releaseHasMoved.current
      const nextPosition =
        !releaseHasMoved.current && dragPosition
          ? dragPosition
          : getDragPosition(start.button, clientX, clientY)
      const shell = start.button.closest(".phone-shell")
      let dockCandidate = false
      if (nextPosition && shell) {
        setTop(nextPosition.top)
        dockCandidate = updateDockCandidate(nextPosition)
        if (!dockCandidate) {
          setSide(
            releasedFromDock
              ? "right"
              : nextPosition.left + ballRadius <
                  shell.getBoundingClientRect().width / 2
                ? "left"
                : "right"
          )
        }
      }
      setDragPosition(null)
      setDragging(false)
      draggingRef.current = false
      releaseHasMoved.current = false
      ignoreClick.current = true
      window.setTimeout(() => {
        ignoreClick.current = false
      }, 0)
      if (!dockCandidate) scheduleCollapse()
      onInteractionComplete()
    },
    [dragPosition, getDragPosition, onInteractionComplete, scheduleCollapse, updateDockCandidate]
  )

  useEffect(() => {
    if (!followPointer || docked) return
    const ball =
      assistantRef.current?.querySelector<HTMLButtonElement>(".assistant-ball")
    if (!ball) return
    const nextPosition = getDragPosition(ball, followPointer.x, followPointer.y)
    if (!nextPosition) return
    if (!pointerStart.current) {
      pointerStart.current = {
        button: ball,
        x: followPointer.x,
        y: followPointer.y,
        pointerId: followPointer.pointerId,
      }
    }
    const start = pointerStart.current
    if (
      start &&
      Math.abs(followPointer.x - start.x) + Math.abs(followPointer.y - start.y) >
        2
    ) {
      releaseHasMoved.current = true
    }
    draggingRef.current = true
    setDragging(true)
    setCollapsed(false)
    setDragPosition(nextPosition)
    updateDockCandidate(nextPosition)
  }, [docked, followPointer, getDragPosition, updateDockCandidate])

  useEffect(() => {
    if (!followEnd || docked) return
    finishDrag(followEnd.x, followEnd.y, followEnd.pointerId)
  }, [docked, finishDrag, followEnd])

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent) =>
      moveDrag(event.clientX, event.clientY, event.pointerId)
    const onPointerUp = (event: globalThis.PointerEvent) =>
      finishDrag(event.clientX, event.clientY, event.pointerId)
    const onPointerCancel = (event: globalThis.PointerEvent) =>
      cancelDrag(event.pointerId)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerCancel)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)
    }
  }, [cancelDrag, finishDrag, moveDrag])

  useEffect(() => {
    if (!docking) return
    const cancelOnNavigation = (event: globalThis.PointerEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest(".bottom-nav")) {
        cancelDockingToRight()
      }
    }
    const cancelOnUserScroll = (event: Event) => {
      const target = event.target
      if (
        pointerStart.current ||
        (target instanceof Element && target.closest(".assistant-ball"))
      )
        return
      cancelDockingToRight()
    }
    document.addEventListener("pointerdown", cancelOnNavigation, true)
    document.addEventListener("touchmove", cancelOnUserScroll, {
      passive: true,
    })
    document.addEventListener("wheel", cancelOnUserScroll, { passive: true })
    return () => {
      document.removeEventListener("pointerdown", cancelOnNavigation, true)
      document.removeEventListener("touchmove", cancelOnUserScroll)
      document.removeEventListener("wheel", cancelOnUserScroll)
    }
  }, [cancelDockingToRight, docking])

  useEffect(() => {
    if (!menuOpen) return
    const closeOutsideMenu = (event: globalThis.PointerEvent) => {
      const target = event.target
      if (target instanceof Node && !assistantRef.current?.contains(target)) {
        playAssistantSound("menu-close", feedbackSettings.soundEnabled)
        setMenuOpen(false)
      }
    }
    document.addEventListener("pointerdown", closeOutsideMenu)
    return () => document.removeEventListener("pointerdown", closeOutsideMenu)
  }, [feedbackSettings.soundEnabled, menuOpen])

  const onClick = () => {
    if (skipCollapsedClick.current) {
      skipCollapsedClick.current = false
      scheduleCollapse()
      return
    }
    if (ignoreClick.current || dragging || dragPosition) return
    if (collapsed) {
      if (top > menuBottomBoundary - ballSize) {
        setTop(Math.max(52, menuBottomBoundary - ballSize))
      }
      expand()
      return
    }
    setMenuOpen((open) => {
      playAssistantSound(
        open ? "menu-close" : "menu-open",
        feedbackSettings.soundEnabled
      )
      return !open
    })
    scheduleCollapse()
  }

  const select = (action: AssistantAction) => {
    playAssistantSound("menu-close", feedbackSettings.soundEnabled)
    setMenuOpen(false)
    setCollapsed(false)
    window.setTimeout(() => onSelect(action), 140)
  }

  const menuBottomAligned = top + menuHeight > menuBottomBoundary
  const positionStyle =
    dragging && dragPosition
      ? { top: dragPosition.top, left: dragPosition.left, right: "auto" }
      : dockPosition
        ? { top: dockPosition.top, left: dockPosition.left, right: "auto" }
        : { top }

  if (docked) return null

  return (
    <div
      ref={assistantRef}
      className={`floating-assistant floating-assistant-${side} ${
        collapsed ? "is-collapsed" : ""
      } ${dragging ? "is-dragging" : ""} ${docking ? "is-docking" : ""} ${
        dockStage ? `is-docking-stage-${dockStage}` : ""
      } ${popping ? "is-popping" : ""} ${menuOpen ? "is-menu-open" : ""} ${hasDraft ? "has-draft" : ""}`}
      style={{
        ...positionStyle,
        "--assistant-embed-scale": dockScale,
      } as unknown as CSSProperties}
    >
      {menuOpen ? (
        <AssistantMenu
          className={menuBottomAligned ? "assistant-menu-bottom-aligned" : ""}
          draftActions={draftActions}
          onSelect={select}
        />
      ) : null}
      <button
        key={`assistant-ball-${dockAnimationKey}`}
        type="button"
        className="assistant-ball"
        aria-label={menuOpen ? "关闭悬浮助手菜单" : "打开悬浮助手菜单"}
        aria-expanded={menuOpen}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          prepareAssistantFeedback()
          event.currentTarget.setPointerCapture(event.pointerId)
          if (collapsed) {
            skipCollapsedClick.current = true
            if (top > menuBottomBoundary - ballSize) {
              setTop(Math.max(52, menuBottomBoundary - ballSize))
            }
            setCollapsed(false)
          }
          startDrag(
            event.currentTarget,
            event.clientX,
            event.clientY,
            event.pointerId
          )
        }}
        onPointerMove={(event: PointerEvent<HTMLButtonElement>) => {
          moveDrag(event.clientX, event.clientY, event.pointerId)
        }}
        onPointerUp={(event: PointerEvent<HTMLButtonElement>) => {
          finishDrag(event.clientX, event.clientY, event.pointerId)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={(event: PointerEvent<HTMLButtonElement>) => {
          cancelDrag(event.pointerId)
        }}
        onClick={onClick}
      >
        <Sparkles size={25} />
      </button>
    </div>
  )
}
