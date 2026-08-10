import { useState } from "react"
import { BottomNav, StatusBar } from "@/components/prototype-shell"
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
import { ProfilePage } from "@/pages/ProfilePage"
import { MembershipDetailPage } from "@/pages/MembershipDetailPage"
import { PreferenceDetailPage } from "@/pages/PreferenceDetailPage"

type RootPageKey = Exclude<
  PageKey,
  | "post-detail"
  | "product-detail"
  | "membership-detail"
  | "preference-detail"
>

function App() {
  const [page, setPage] = useState<PageKey>("recommend")
  const [cartCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(8)
  const [studentVerified, setStudentVerified] = useState(false)
  const [campusMode, setCampusMode] = useState(false)
  const [viewerMode] = useState<ViewerMode>("member")
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
  const toggleCampusPreview = (enabled: boolean) => {
    // 顶部入口是原型预览快捷开关，开启时模拟当前用户已完成学生认证。
    if (enabled) setStudentVerified(true)
    setCampusMode(enabled)
  }
  const openMessages = () => setPage("messages")
  const openSearch = () => setPage("search")
  const openPostDetail = (activityId: string, returnPage: RootPageKey) => {
    setSelectedActivityId(activityId)
    setDetailReturnPage(returnPage)
    setPage("post-detail")
  }
  const openProductDetail = (productId: string, returnPage: RootPageKey) => {
    setSelectedProductId(productId)
    setDetailReturnPage(returnPage)
    setPage("product-detail")
  }
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
  const content =
    page === "recommend" ? (
      <RecommendPage
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
        onOpenSearch={openSearch}
        onOpenPostDetail={(activityId) =>
          openPostDetail(activityId, "community")
        }
        campusMode={campusMode}
        viewerMode={viewerMode}
      />
    ) : page === "mall" ? (
      <MallPage
        cartCount={cartCount}
        onOpenProductDetail={(productId) =>
          openProductDetail(productId, "mall")
        }
      />
    ) : page === "messages" ? (
      <MessagesPage
        onRead={() => setUnreadCount(0)}
        onOpenPostDetail={(activityId) =>
          openPostDetail(activityId, "messages")
        }
      />
    ) : page === "post-detail" ? (
      <PostDetailPage
        activityId={selectedActivityId}
        campusMode={campusMode}
        viewerMode={viewerMode}
        onBack={() => setPage(detailReturnPage)}
      />
    ) : page === "product-detail" ? (
      <ProductDetailPage
        productId={selectedProductId}
        onBack={() => setPage(detailReturnPage)}
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
        onBack={() => setPage("profile")}
      />
    ) : page === "preference-detail" ? (
      <PreferenceDetailPage
        preference={selectedPreference}
        onBack={() => setPage("profile")}
      />
    ) : (
      <ProfilePage
        campusMode={campusMode}
        onCampusModeChange={setCampusMode}
        studentVerified={studentVerified}
        onCompleteStudentVerification={() => setStudentVerified(true)}
        viewerMode={viewerMode}
        membershipTier={membershipTier}
        checkedIn={checkedIn}
        onCheckIn={checkIn}
        onOpenMembership={() => {
          setPage("membership-detail")
        }}
        onOpenPreferenceDetail={(preference) => {
          setSelectedPreference(preference)
          setPage("preference-detail")
        }}
      />
    )
  return (
    <div className="prototype-stage">
      <section className="phone-shell" aria-label="趣汇移动端原型">
        <StatusBar
          campusMode={campusMode}
          onCampusModeChange={toggleCampusPreview}
        />
        <main className="phone-content">{content}</main>
        {page !== "search" &&
        page !== "post-detail" &&
        page !== "product-detail" &&
        page !== "membership-detail" &&
        page !== "preference-detail" ? (
          <BottomNav
            current={page}
            onChange={setPage}
            unreadCount={unreadCount}
            campusMode={campusMode}
            viewerMode={viewerMode}
          />
        ) : null}
      </section>
    </div>
  )
}

export default App
