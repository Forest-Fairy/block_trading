import { useState } from "react"
import {
  BadgeCheck,
  MonitorUp,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  accessRoleDefinitions,
  type AccessRole,
  type ReleaseIteration,
  releaseIterations,
} from "@/prototype/access"

const roles: AccessRole[] = [
  "guest",
  "vip",
  "region_admin",
  "operation_admin",
  "system_admin",
]

const iterations: ReleaseIteration[] = ["R1", "R2", "R3", "R4"]

function PrototypeAccessControls({
  role,
  iteration,
  onRoleChange,
  onIterationChange,
  onOpenPcAdmin,
}: {
  role: AccessRole
  iteration: ReleaseIteration
  onRoleChange: (role: AccessRole) => void
  onIterationChange: (iteration: ReleaseIteration) => void
  onOpenPcAdmin: () => void
}) {
  const roleDefinition = accessRoleDefinitions[role]
  const iterationDefinition = releaseIterations[iteration]
  const managementRole =
    role === "region_admin" ||
    role === "operation_admin" ||
    role === "system_admin"

  return (
    <>
      <div className="flex items-start gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary">权限与迭代原型</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            仅用于验收角色路径和版本能力。
          </p>
        </div>
      </div>

      <section className="mt-4" aria-labelledby="prototype-iteration-label">
        <p id="prototype-iteration-label" className="text-xs font-semibold">
          迭代周期
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {iterations.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={iteration === value ? "default" : "outline"}
              aria-pressed={iteration === value}
              onClick={() => onIterationChange(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          <strong className="font-semibold text-foreground">
            {iterationDefinition.label}
          </strong>
          <br />
          {iterationDefinition.description}
        </p>
      </section>

      <section className="mt-4" aria-labelledby="prototype-role-label">
        <p id="prototype-role-label" className="text-xs font-semibold">
          验收身份
        </p>
        <div className="mt-2 grid gap-1.5">
          {roles.map((value) => {
            const definition = accessRoleDefinitions[value]
            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={role === value ? "secondary" : "outline"}
                className="h-auto min-h-8 justify-start py-1.5 text-left whitespace-normal"
                aria-pressed={role === value}
                onClick={() => onRoleChange(value)}
              >
                {definition.label}
              </Button>
            )
          })}
        </div>
      </section>

      {managementRole ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={onOpenPcAdmin}
        >
          <MonitorUp /> 打开独立 PC 管理端
        </Button>
      ) : null}

      <div className="mt-4 border-t border-border pt-3">
        <Badge variant="secondary" className="gap-1">
          <BadgeCheck size={12} /> {roleDefinition.entry}
        </Badge>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {roleDefinition.description}
        </p>
      </div>
    </>
  )
}

export function PrototypeAccessControl({
  role,
  iteration,
  onRoleChange,
  onIterationChange,
  onOpenPcAdmin,
}: {
  role: AccessRole
  iteration: ReleaseIteration
  onRoleChange: (role: AccessRole) => void
  onIterationChange: (iteration: ReleaseIteration) => void
  onOpenPcAdmin: () => void
}) {
  const [mobileControlOpen, setMobileControlOpen] = useState(false)

  return (
    <>
      <aside className="prototype-access-control" aria-label="原型验收控制区">
        <PrototypeAccessControls
          role={role}
          iteration={iteration}
          onRoleChange={onRoleChange}
          onIterationChange={onIterationChange}
          onOpenPcAdmin={onOpenPcAdmin}
        />
      </aside>
      <div className="prototype-mobile-control">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="打开原型验收控制"
          title="打开原型验收控制"
          onClick={() => setMobileControlOpen(true)}
        >
          <SlidersHorizontal size={16} />
        </Button>
        <Sheet open={mobileControlOpen} onOpenChange={setMobileControlOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[min(72svh,38rem)] overflow-y-auto rounded-t-xl p-0"
          >
            <SheetHeader className="border-b border-border/70">
              <SheetTitle>原型验收控制</SheetTitle>
              <SheetDescription>
                切换身份和迭代以核对权限边界。
              </SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <PrototypeAccessControls
                role={role}
                iteration={iteration}
                onRoleChange={(nextRole) => {
                  onRoleChange(nextRole)
                  setMobileControlOpen(false)
                }}
                onIterationChange={onIterationChange}
                onOpenPcAdmin={() => {
                  setMobileControlOpen(false)
                  onOpenPcAdmin()
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
