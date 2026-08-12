export type CurrentLocation = {
  district?: string | null
  street?: string | null
}

export function formatCurrentLocation({
  district,
  street,
}: CurrentLocation) {
  return district?.trim() || street?.trim() || "附近"
}
