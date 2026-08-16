import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { BottomNav, StatusBar } from "@/components/prototype-shell"
import { PrototypeAccessControl } from "@/components/prototype-access-control"
import {
  getMembershipTier,
  type PageKey,
  type PreferenceKey,
  type ViewerMode,
} from "@/prototype/data"
import { RecommendPage } from "@/pages/RecommendPage"
import { SearchPage } from "@/pages/SearchPage"
import { CommunityPage } from "@/pages/CommunityPage"
import { MallPage } from "@/pages/MallPage"
import { MessagesPage } from "@/pages/MessagesPage"
import { PostDetailPage } from "@/pages/PostDetailPage"
import { ProductDetailPage } from "@/pages/ProductDetailPage"
import { CommerceFlowPage, type CommerceStage } from "@/pages/CommerceFlowPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { MembershipDetailPage } from "@/pages/MembershipDetailPage"
import { PreferenceDetailPage } from "@/pages/PreferenceDetailPage"
import { RegionManagementPage } from "@/pages/RegionManagementPage"
import { AdminConsolePage } from "@/pages/AdminConsolePage"
import {
  AssistantChatPage,
  type AssistantDraft,
} from "@/pages/AssistantChatPage"
import type { AssistantFeedbackSettings } from "@/lib/assistant-feedback"
import {
  FloatingAssistant,
  type AssistantAction,
} from "@/components/floating-assistant"
import {
  canAccessAdminConsole,
  canAccessRegionManagement,
  getManagementSettingsEntry,
  getPrototypeSession,
  type AccessRole,
  type ReleaseIteration,
} from "@/prototype/access"

type RootPageKey = Exclude<
  PageKey,
  | "post-detail"
  | "product-detail"
  | "commerce-flow"
  | "membership-detail"
  | "preference-detail"
  | "assistant-chat"
  | "region-management"
  | "admin-console"
>

type PrimaryPageKey =
  "recommend" | "community" | "mall" | "messages" | "profile"

const primaryPageKeys: PrimaryPageKey[] = [
  "recommend",
  "community",
  "mall",
  "messages",
  "profile",
]

function App() {
  const [page, setPage] = useState<PageKey>("recommend")
  const [cartCount, setCartCount] = useState(0)
  const [commerceStartStage, setCommerceStartStage] =
    useState<CommerceStage>("cart")
  const [pcAdminOpen, setPcAdminOpen] = useState(
    () => window.location.hash === "#pc-admin"
  )
  const [unreadCount, setUnreadCount] = useState(8)
  const [studentVerified, setStudentVerified] = useState(false)
  const [campusMode, setCampusMode] = useState(false)
  const [accessRole, setAccessRole] = useState<AccessRole>("vip")
  const [iteration, setIteration] = useState<ReleaseIteration>("R1")
  const [currentPoints, setCurrentPoints] = useState(4)
  const [earnedPoints, setEarnedPoints] = useState(4)
  const [monthlyInvites, setMonthlyInvites] = useState(2)
  const [checkedIn, setCheckedIn] = useState(false)
  const normalHelpUsed = 1
  const emergencyHelpUsed = 0
  const [selectedActivityId, setSelectedActivityId] = useState("snacks")
  const [selectedProductId, setSelectedProductId] = useState("mug")
  const [selectedPreference, setSelectedPreference] =
    useState<PreferenceKey>("账号与安全")
  const [detailReturnPage, setDetailReturnPage] =
    useState<RootPageKey>("recommend")
  const [assistantAction, setAssistantAction] =
    useState<AssistantAction>("combine")
  const [assistantDrafts, setAssistantDrafts] = useState<
    Partial<Record<AssistantAction, AssistantDraft>>
  >({})
  const [assistantDocked, setAssistantDocked] = useState(false)
  const [assistantFeedback, setAssistantFeedback] =
    useState<AssistantFeedbackSettings>({
      soundEnabled: true,
      vibrationEnabled: true,
    })
  const [assistantMenuOpen, setAssistantMenuOpen] = useState(false)
  const [messageChatOpen, setMessageChatOpen] = useState(false)
  const [pageRefreshes, setPageRefreshes] = useState<
    Partial<Record<PrimaryPageKey, number>>
  >({})
  const [assistantReleasePointer, setAssistantReleasePointer] = useState<{
    x: number
    y: number
    pointerId: number
    releasedAt: number
  } | null>(null)
  const [assistantFollowPointer, setAssistantFollowPointer] = useState<{
    x: number
    y: number
    pointerId: number
  } | null>(null)
  const [assistantFollowEnd, setAssistantFollowEnd] = useState<{
    x: number
    y: number
    pointerId: number
    endedAt: number
  } | null>(null)
  const currentPageRef = useRef<PageKey>(page)
  const contentScrollRef = useRef<HTMLElement | null>(null)
  const pageScrollPositionsRef = useRef<Partial<Record<PageKey, number>>>({})
  const historyReadyRef = useRef(false)
  const skipPageHistoryRef = useRef(false)
  const viewerMode: ViewerMode = accessRole === "guest" ? "guest" : "member"
  const accessSession = getPrototypeSession(accessRole)
  const managementEntry = getManagementSettingsEntry(accessRole)

  // 原型用 history 哨兵模拟移动端系统返回：非首页拦截并回到业务上一层，首页放行系统事件。
  useEffect(() => {
    currentPageRef.current = page
    if (pcAdminOpen) {
      historyReadyRef.current = true
      return
    }
    if (!historyReadyRef.current) {
      window.history.replaceState({ prototypePage: page }, "", `#${page}`)
      historyReadyRef.current = true
      return
    }
    if (skipPageHistoryRef.current) {
      skipPageHistoryRef.current = false
      return
    }
    window.history.pushState({ prototypePage: page }, "", `#${page}`)
  }, [page, pcAdminOpen])

  useEffect(() => {
    const handleSystemBack = () => {
      if (window.location.hash === "#pc-admin") {
        setPcAdminOpen(true)
        return
      }
      if (pcAdminOpen) {
        setPcAdminOpen(false)
        return
      }
      const currentPage = currentPageRef.current
      if (currentPage === "recommend") return

      const targetPage: RootPageKey =
        currentPage === "search"
          ? "recommend"
          : currentPage === "post-detail" ||
              currentPage === "product-detail" ||
              currentPage === "assistant-chat"
            ? detailReturnPage
            : currentPage === "commerce-flow"
              ? "mall"
              : currentPage === "membership-detail" ||
                  currentPage === "preference-detail"
                ? "profile"
                : currentPage === "region-management"
                  ? "profile"
                  : "recommend"
      skipPageHistoryRef.current = true
      window.history.pushState(
        { prototypePage: targetPage },
        "",
        `#${targetPage}`
      )
      setPage(targetPage)
    }

    window.addEventListener("popstate", handleSystemBack)
    return () => window.removeEventListener("popstate", handleSystemBack)
  }, [detailReturnPage, pcAdminOpen])

  const saveCurrentScrollPosition = useCallback(() => {
    const content = contentScrollRef.current
    if (!content || messageChatOpen) return
    pageScrollPositionsRef.current[currentPageRef.current] = content.scrollTop
  }, [messageChatOpen])

  const resetAssistantInteraction = useCallback(() => {
    setAssistantReleasePointer(null)
    setAssistantFollowPointer(null)
    setAssistantFollowEnd(null)
  }, [])
  const navigateToPage = useCallback(
    (targetPage: PageKey) => {
      saveCurrentScrollPosition()
      if (targetPage !== "recommend") resetAssistantInteraction()
      setMessageChatOpen(false)
      setPage(targetPage)
    },
    [resetAssistantInteraction, saveCurrentScrollPosition]
  )

  const refreshCurrentPrimaryPage = useCallback((targetPage: PageKey) => {
    if (!primaryPageKeys.includes(targetPage as PrimaryPageKey)) return
    pageScrollPositionsRef.current[targetPage] = 0
    setMessageChatOpen(false)
    setPageRefreshes((refreshes) => ({
      ...refreshes,
      [targetPage]: (refreshes[targetPage as PrimaryPageKey] ?? 0) + 1,
    }))
  }, [])

  // 页面组件会随路由卸载，滚动容器由 App 保持，因此在此处统一恢复来源页位置。
  useLayoutEffect(() => {
    const content = contentScrollRef.current
    if (!content) return

    const frame = window.requestAnimationFrame(() => {
      if (messageChatOpen) {
        content.scrollTop = content.scrollHeight
        return
      }
      const isDetailPage =
        page === "post-detail" ||
        page === "product-detail" ||
        page === "commerce-flow" ||
        page === "membership-detail" ||
        page === "preference-detail"
      content.scrollTop = isDetailPage
        ? 0
        : (pageScrollPositionsRef.current[page] ?? 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [messageChatOpen, page, pageRefreshes])
  const saveAssistantDraft = useCallback(
    (action: AssistantAction, draft: AssistantDraft | null) => {
      setAssistantDrafts((drafts) => {
        if (draft) return { ...drafts, [action]: draft }
        const nextDrafts = { ...drafts }
        delete nextDrafts[action]
        return nextDrafts
      })
    },
    []
  )
  const saveCurrentAssistantDraft = useCallback(
    (draft: AssistantDraft | null) =>
      saveAssistantDraft(assistantAction, draft),
    [assistantAction, saveAssistantDraft]
  )
  const toggleCampusPreview = (enabled: boolean) => {
    // 顶部入口是原型预览快捷开关，开启时模拟当前用户已完成学生认证。
    if (viewerMode === "guest") return
    if (enabled) setStudentVerified(true)
    setCampusMode(enabled)
  }
  const changeAccessRole = useCallback(
    (nextRole: AccessRole) => {
      resetAssistantInteraction()
      setAccessRole(nextRole)
      setAssistantMenuOpen(false)
      setMessageChatOpen(false)
      if (
        (canAccessAdminConsole(nextRole) ||
          canAccessRegionManagement(nextRole)) &&
        page !== "region-management" &&
        page !== "admin-console"
      ) {
        setPage("profile")
        return
      }
      if (page !== "region-management" && page !== "admin-console") {
        setPage("recommend")
      }
    },
    [page, resetAssistantInteraction]
  )
  const openMessages = () => navigateToPage("messages")
  const openSearch = () => navigateToPage("search")
  const closeAssistantMenu = useCallback(() => setAssistantMenuOpen(false), [])
  const openPostDetail = (activityId: string, returnPage: RootPageKey) => {
    resetAssistantInteraction()
    saveCurrentScrollPosition()
    setSelectedActivityId(activityId)
    setDetailReturnPage(returnPage)
    setMessageChatOpen(false)
    setPage("post-detail")
  }
  const openProductDetail = (productId: string, returnPage: RootPageKey) => {
    resetAssistantInteraction()
    saveCurrentScrollPosition()
    setSelectedProductId(productId)
    setDetailReturnPage(returnPage)
    setMessageChatOpen(false)
    setPage("product-detail")
  }
  const openCommerceFlow = (
    stage: CommerceStage,
    productId = selectedProductId
  ) => {
    resetAssistantInteraction()
    saveCurrentScrollPosition()
    setSelectedProductId(productId)
    setCommerceStartStage(stage)
    setMessageChatOpen(false)
    setPage("commerce-flow")
  }
  const openPcAdmin = () => {
    resetAssistantInteraction()
    setAssistantMenuOpen(false)
    setPcAdminOpen(true)
    window.history.pushState({ prototypePcAdmin: true }, "", "#pc-admin")
  }
  const closePcAdmin = () => {
    skipPageHistoryRef.current = true
    setPcAdminOpen(false)
    setPage("profile")
    window.history.replaceState({ prototypePage: "profile" }, "", "#profile")
  }
  const selectAssistant = useCallback(
    (action: AssistantAction) => {
      resetAssistantInteraction()
      saveCurrentScrollPosition()
      closeAssistantMenu()
      setAssistantAction(action)
      setDetailReturnPage(
        page === "search" ||
          page === "post-detail" ||
          page === "product-detail" ||
          page === "commerce-flow" ||
          page === "membership-detail" ||
          page === "preference-detail" ||
          page === "assistant-chat" ||
          page === "region-management" ||
          page === "admin-console"
          ? "recommend"
          : page
      )
      setPage("assistant-chat")
    },
    [
      closeAssistantMenu,
      page,
      resetAssistantInteraction,
      saveCurrentScrollPosition,
    ]
  )
  const membershipTier = getMembershipTier(earnedPoints)
  const checkIn = () => {
    if (checkedIn) return false
    const points = membershipTier <= 1 ? 3 : membershipTier === 2 ? 2 : 1
    setCurrentPoints((value) => value + points)
    setEarnedPoints((value) => value + points)
    setCheckedIn(true)
    return true
  }
  const inviteMember = () => {
    if (monthlyInvites >= 99) return false
    setMonthlyInvites((value) => value + 1)
    setCurrentPoints((value) => value + 5)
    setEarnedPoints((value) => value + 5)
    return true
  }
  if (pcAdminOpen) {
    return (
      <div className="prototype-stage pc-admin-stage">
        <PrototypeAccessControl
          role={accessRole}
          iteration={iteration}
          onRoleChange={changeAccessRole}
          onIterationChange={setIteration}
          onOpenPcAdmin={openPcAdmin}
        />
        <section className="pc-admin-shell" aria-label="趣汇独立 PC 管理端">
          {accessRole === "region_admin" ? (
            <RegionManagementPage
              key={`pc-region-${iteration}-${accessRole}`}
              allowed={canAccessRegionManagement(accessRole)}
              iteration={iteration}
              regionScope={accessSession.regionScope}
              onBack={closePcAdmin}
              surface="pc"
            />
          ) : (
            <AdminConsolePage
              key={`pc-admin-${iteration}-${accessRole}`}
              allowed={canAccessAdminConsole(accessRole)}
              role={accessRole}
              iteration={iteration}
              onBack={closePcAdmin}
              surface="pc"
            />
          )}
        </section>
      </div>
    )
  }
  const content =
    page === "recommend" ? (
      <RecommendPage
        key={`recommend-${pageRefreshes.recommend ?? 0}`}
        onOpenMessages={openMessages}
        onOpenSearch={openSearch}
        onOpenPostDetail={(activityId) =>
          openPostDetail(activityId, "recommend")
        }
        onOpenProductDetail={(productId) =>
          openProductDetail(productId, "recommend")
        }
        campusMode={campusMode}
        viewerMode={viewerMode}
        assistantDocked={assistantDocked}
        assistantFeedback={assistantFeedback}
        assistantMenuOpen={assistantMenuOpen}
        onToggleAssistantMenu={() => setAssistantMenuOpen((open) => !open)}
        onCloseAssistantMenu={closeAssistantMenu}
        onSelectAssistant={selectAssistant}
        assistantDraftActions={
          Object.keys(assistantDrafts) as AssistantAction[]
        }
        onReleaseAssistant={(pointer) => {
          closeAssistantMenu()
          setAssistantReleasePointer({ ...pointer, releasedAt: Date.now() })
          setAssistantFollowPointer(null)
          setAssistantDocked(false)
        }}
        onMoveReleasedAssistant={setAssistantFollowPointer}
        onEndReleasedAssistant={(pointer) => {
          setAssistantFollowPointer(null)
          setAssistantFollowEnd({ ...pointer, endedAt: Date.now() })
        }}
      />
    ) : page === "search" ? (
      <SearchPage
        onBack={() => setPage("recommend")}
        onOpenPostDetail={(activityId) => openPostDetail(activityId, "search")}
        onOpenProductDetail={(productId) =>
          openProductDetail(productId, "search")
        }
        campusMode={campusMode}
        viewerMode={viewerMode}
      />
    ) : page === "community" ? (
      <CommunityPage
        key={`community-${pageRefreshes.community ?? 0}`}
        onOpenSearch={openSearch}
        onOpenPostDetail={(activityId) =>
          openPostDetail(activityId, "community")
        }
        campusMode={campusMode}
        viewerMode={viewerMode}
      />
    ) : page === "mall" ? (
      <MallPage
        key={`mall-${pageRefreshes.mall ?? 0}`}
        cartCount={cartCount}
        viewerMode={viewerMode}
        onOpenCart={() => openCommerceFlow("cart")}
        onOpenProductDetail={(productId) =>
          openProductDetail(productId, "mall")
        }
      />
    ) : page === "messages" ? (
      <MessagesPage
        key={`messages-${pageRefreshes.messages ?? 0}`}
        onRead={() => setUnreadCount(0)}
        onOpenPostDetail={(activityId) =>
          openPostDetail(activityId, "messages")
        }
        onChatOpenChange={setMessageChatOpen}
        viewerMode={viewerMode}
      />
    ) : page === "post-detail" ? (
      <PostDetailPage
        activityId={selectedActivityId}
        campusMode={campusMode}
        viewerMode={viewerMode}
        onBack={() => navigateToPage(detailReturnPage)}
      />
    ) : page === "product-detail" ? (
      <ProductDetailPage
        productId={selectedProductId}
        viewerMode={viewerMode}
        cartCount={cartCount}
        onBack={() => navigateToPage(detailReturnPage)}
        onOpenCart={() => openCommerceFlow("cart")}
        onAddToCart={() => setCartCount((count) => count + 1)}
        onBuyNow={() => openCommerceFlow("checkout")}
      />
    ) : page === "commerce-flow" ? (
      <CommerceFlowPage
        key={`${selectedProductId}-${commerceStartStage}-${viewerMode}`}
        productId={selectedProductId}
        cartCount={cartCount}
        viewerMode={viewerMode}
        initialStage={commerceStartStage}
        onBack={() => navigateToPage("mall")}
        onCartCountChange={setCartCount}
      />
    ) : page === "membership-detail" ? (
      <MembershipDetailPage
        membershipTier={membershipTier}
        currentPoints={currentPoints}
        earnedPoints={earnedPoints}
        monthlyInvites={monthlyInvites}
        normalHelpUsed={normalHelpUsed}
        emergencyHelpUsed={emergencyHelpUsed}
        checkedIn={checkedIn}
        onCheckIn={checkIn}
        onInviteMember={inviteMember}
        onBack={() => navigateToPage("profile")}
      />
    ) : page === "preference-detail" ? (
      <PreferenceDetailPage
        preference={selectedPreference}
        onBack={() => navigateToPage("profile")}
        assistantFeedback={assistantFeedback}
        onAssistantFeedbackChange={setAssistantFeedback}
      />
    ) : page === "assistant-chat" ? (
      <AssistantChatPage
        action={assistantAction}
        viewerMode={viewerMode}
        initialDraft={assistantDrafts[assistantAction]}
        onClose={() => navigateToPage(detailReturnPage)}
        onSaveDraft={saveCurrentAssistantDraft}
      />
    ) : page === "region-management" ? (
      <RegionManagementPage
        key={`mobile-region-${iteration}-${accessRole}`}
        allowed={canAccessRegionManagement(accessRole)}
        iteration={iteration}
        regionScope={accessSession.regionScope}
        onBack={() => navigateToPage("profile")}
      />
    ) : page === "admin-console" ? (
      <AdminConsolePage
        key={`mobile-admin-${iteration}-${accessRole}`}
        allowed={canAccessAdminConsole(accessRole)}
        role={accessRole}
        iteration={iteration}
        onBack={() => navigateToPage("recommend")}
      />
    ) : (
      <ProfilePage
        key={`profile-${pageRefreshes.profile ?? 0}`}
        campusMode={campusMode}
        onCampusModeChange={setCampusMode}
        studentVerified={studentVerified}
        onCompleteStudentVerification={() => setStudentVerified(true)}
        viewerMode={viewerMode}
        membershipTier={membershipTier}
        checkedIn={checkedIn}
        onCheckIn={checkIn}
        onOpenMembership={() => {
          saveCurrentScrollPosition()
          setPage("membership-detail")
        }}
        onOpenPreferenceDetail={(preference) => {
          setSelectedPreference(preference)
          saveCurrentScrollPosition()
          setPage("preference-detail")
        }}
        managementEntry={managementEntry}
        onOpenManagement={() =>
          navigateToPage(
            managementEntry?.target === "region"
              ? "region-management"
              : "admin-console"
          )
        }
      />
    )
  return (
    <div className="prototype-stage">
      <PrototypeAccessControl
        role={accessRole}
        iteration={iteration}
        onRoleChange={changeAccessRole}
        onIterationChange={setIteration}
        onOpenPcAdmin={openPcAdmin}
      />
      <section className="phone-shell" aria-label="趣汇移动端原型">
        <StatusBar
          campusMode={campusMode}
          onCampusModeChange={toggleCampusPreview}
          campusEnabled={viewerMode !== "guest"}
        />
        <main
          ref={contentScrollRef}
          className="phone-content"
          onScroll={saveCurrentScrollPosition}
        >
          {content}
        </main>
        {page !== "assistant-chat" &&
        page !== "commerce-flow" &&
        page !== "region-management" &&
        page !== "admin-console" ? (
          <FloatingAssistant
            draftActions={Object.keys(assistantDrafts) as AssistantAction[]}
            docked={assistantDocked}
            feedbackSettings={assistantFeedback}
            onDockChange={setAssistantDocked}
            releasePointer={assistantReleasePointer}
            followPointer={assistantFollowPointer}
            followEnd={assistantFollowEnd}
            onInteractionComplete={resetAssistantInteraction}
            onSelect={(action) => {
              selectAssistant(action)
            }}
          />
        ) : null}
        {page !== "search" &&
        page !== "post-detail" &&
        page !== "product-detail" &&
        page !== "commerce-flow" &&
        page !== "membership-detail" &&
        page !== "preference-detail" &&
        page !== "assistant-chat" &&
        page !== "region-management" &&
        page !== "admin-console" &&
        !messageChatOpen ? (
          <BottomNav
            current={page}
            onChange={navigateToPage}
            onRefresh={refreshCurrentPrimaryPage}
            unreadCount={viewerMode === "guest" ? 1 : unreadCount}
            campusMode={campusMode}
            viewerMode={viewerMode}
          />
        ) : null}
      </section>
    </div>
  )
}

export default App
