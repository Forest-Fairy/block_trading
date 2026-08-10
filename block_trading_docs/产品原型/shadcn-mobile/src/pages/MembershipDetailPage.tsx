import { useState } from "react"
import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  Crown,
  Gift,
  UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  membershipTiers,
  type MembershipTier,
} from "@/prototype/data"
import { IconButton, PageHeader } from "@/components/prototype-shell"

export function MembershipDetailPage({
  membershipTier,
  currentPoints,
  earnedPoints,
  monthlyInvites,
  normalHelpUsed,
  emergencyHelpUsed,
  checkedIn,
  onCheckIn,
  onInviteMember,
  onBack,
}: {
  membershipTier: MembershipTier
  currentPoints: number
  earnedPoints: number
  monthlyInvites: number
  normalHelpUsed: number
  emergencyHelpUsed: number
  checkedIn: boolean
  onCheckIn: () => boolean
  onInviteMember: () => boolean
  onBack: () => void
}) {
  const [toast, setToast] = useState("")
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2200)
  }
  const checkIn = () => {
    if (!onCheckIn()) {
      showToast("今日已签到")
      return
    }
    showToast(
      `签到成功，积分+${membershipTiers[membershipTier].dailyCheckInPoints}`
    )
  }
  const invite = () => {
    if (!onInviteMember()) {
      showToast("本月邀请人数已达 99 人上限")
      return
    }
    showToast("邀请链接已生成，成功邀请可得 5 积分")
  }

  return (
    <div className="page-content">
      <PageHeader
        title="会员等级"
        leading={
          <IconButton label="返回" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
        }
      />

      <Card className="overflow-hidden border-0 bg-[#e5efe8] shadow-none">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-lg bg-white text-primary">
                <Crown size={24} />
              </span>
              <div>
                <p className="text-xs font-semibold text-primary">当前等级</p>
                <h2 className="mt-1 text-2xl font-extrabold">VIP {membershipTier}</h2>
              </div>
            </div>
            <Badge className="border-0 bg-white text-primary">累计 EC {earnedPoints}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[#cbdccd] text-center">
            <div>
              <strong className="block text-lg">{currentPoints}</strong>
              <span className="text-[10px] text-muted-foreground">当前积分</span>
            </div>
            <div>
              <strong className="block text-lg">{monthlyInvites}/99</strong>
              <span className="text-[10px] text-muted-foreground">本月邀请</span>
            </div>
            <div>
              <strong className="block text-sm">
                N {membershipTiers[membershipTier].normalQuota - normalHelpUsed} · E {membershipTiers[membershipTier].emergencyQuota - emergencyHelpUsed}
              </strong>
              <span className="text-[10px] text-muted-foreground">本月剩余</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              className={
                checkedIn
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-[#d9a321] text-white hover:bg-[#c28f17]"
              }
              onClick={checkIn}
            >
              {checkedIn
                ? "今日已签到"
                : `签到 +${membershipTiers[membershipTier].dailyCheckInPoints}`}
            </Button>
            <Button type="button" variant="outline" onClick={invite}>
              <UsersRound size={16} /> 邀请新人
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <Gift size={18} className="text-primary" />
          <h3 className="section-title text-base">各等级权益</h3>
        </div>
        <div className="space-y-2">
          {(Object.keys(membershipTiers).map(Number) as MembershipTier[]).map(
            (tier) => {
              const item = membershipTiers[tier]
              const current = tier === membershipTier
              return (
                <Card
                  key={tier}
                  className={`border shadow-none ${
                    current ? "border-primary bg-secondary" : "border-border bg-white"
                  }`}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white font-extrabold text-primary">
                      V{tier}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm">
                        VIP {tier} {current ? "· 当前等级" : ""}
                      </strong>
                      <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">
                        EC ≥ {item.minEc} · 每日签到 +{item.dailyCheckInPoints} · 每月普通求助 {item.normalQuota} 次 · 加急求助 {item.emergencyQuota} 次
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              )
            }
          )}
        </div>
      </section>

      {toast ? (
        <div className="recommend-toast" role="status" aria-live="polite">
          <CheckCheck size={15} /> {toast}
        </div>
      ) : null}
    </div>
  )
}
