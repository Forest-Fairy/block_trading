import { useState } from "react"
import { BottomNav, StatusBar } from "@/components/prototype-shell"
import { type PageKey } from "@/prototype/data"
import { RecommendPage } from "@/pages/RecommendPage"
import { SearchPage } from "@/pages/SearchPage"
import { CommunityPage } from "@/pages/CommunityPage"
import { MallPage } from "@/pages/MallPage"
import { MessagesPage } from "@/pages/MessagesPage"
import { ProfilePage } from "@/pages/ProfilePage"

function App() {
  const [page, setPage] = useState<PageKey>("recommend")
  const [cartCount, setCartCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(8)
  const [studentVerified, setStudentVerified] = useState(false)
  const [campusMode, setCampusMode] = useState(false)
  const toggleCampusPreview = (enabled: boolean) => {
    // 顶部入口是原型预览快捷开关，开启时模拟当前用户已完成学生认证。
    if (enabled) setStudentVerified(true)
    setCampusMode(enabled)
  }
  const openMessages = () => setPage("messages")
  const openSearch = () => setPage("search")
  const content =
    page === "recommend" ? (
      <RecommendPage
        onOpenMessages={openMessages}
        onOpenSearch={openSearch}
        onAddToCart={() => setCartCount((count) => count + 1)}
        unreadCount={unreadCount}
        campusMode={campusMode}
      />
    ) : page === "search" ? (
      <SearchPage
        onBack={() => setPage("recommend")}
        onAddToCart={() => setCartCount((count) => count + 1)}
        campusMode={campusMode}
      />
    ) : page === "community" ? (
      <CommunityPage
        onOpenMessages={openMessages}
        onOpenSearch={openSearch}
        unreadCount={unreadCount}
        campusMode={campusMode}
      />
    ) : page === "mall" ? (
      <MallPage
        cartCount={cartCount}
        onAdd={() => setCartCount((count) => count + 1)}
      />
    ) : page === "messages" ? (
      <MessagesPage onRead={() => setUnreadCount(0)} />
    ) : (
      <ProfilePage
        campusMode={campusMode}
        onCampusModeChange={setCampusMode}
        studentVerified={studentVerified}
        onCompleteStudentVerification={() => setStudentVerified(true)}
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
        {page !== "search" ? (
          <BottomNav
            current={page}
            onChange={setPage}
            unreadCount={unreadCount}
            campusMode={campusMode}
          />
        ) : null}
      </section>
    </div>
  )
}

export default App
