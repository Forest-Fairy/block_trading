export type AssistantSound =
  | "menu-open"
  | "menu-close"
  | "hold"
  | "double"
  | "pop"
  | "dock-charge"
  | "dock-complete"

type Tone = {
  frequency: number
  endFrequency?: number
  duration: number
  delay?: number
  gain?: number
  waveform?: OscillatorType
  attackDuration?: number
  releaseDuration?: number
}

const soundTones: Record<AssistantSound, Tone[]> = {
  "menu-open": [{ frequency: 1024, endFrequency: 1320, duration: 0.18, gain: 0.035 }],
  "menu-close": [{ frequency: 880, endFrequency: 620, duration: 0.16, gain: 0.035 }],
  hold: Array.from({ length: 20 }, (_, index) => ({
    frequency: index % 2 ? 760 : 680,
    duration: 0.1,
    delay: index * 0.14,
    gain: 0.04,
  })),
  double: [
    { frequency: 620, duration: 0.12, gain: 0.035 },
    { frequency: 900, duration: 0.13, delay: 0.1, gain: 0.04 },
  ],
  pop: [
    { frequency: 420, duration: 0.08, gain: 0.04 },
    { frequency: 760, duration: 0.16, delay: 0.07, gain: 0.045 },
  ],
  "dock-charge": [
    {
      frequency: 620,
      endFrequency: 1600,
      duration: 2.6,
      gain: 0.035,
      waveform: "triangle",
      attackDuration: 0.8,
    },
  ],
  "dock-complete": [
    { frequency: 1342, duration: 1.2, gain: 0.055, waveform: "sine" },
  ],
}

let audioContext: AudioContext | null = null
const assistantSoundVolume = 6
const activeChargeOscillators = new Set<OscillatorNode>()
const activeSoundOscillators = new Map<AssistantSound, Set<OscillatorNode>>()
const soundSessions = new Map<AssistantSound, number>()

export type AssistantFeedbackSettings = {
  soundEnabled: boolean
  vibrationEnabled: boolean
}

function getAudioContext() {
  if (typeof window === "undefined" || !window.AudioContext) return null
  if (!audioContext) {
    try {
      audioContext = new window.AudioContext()
    } catch {
      return null
    }
  }
  return audioContext
}

export function prepareAssistantFeedback() {
  const context = getAudioContext()
  if (context?.state === "suspended") void context.resume()
}

export function playAssistantSound(
  sound: AssistantSound,
  enabled = true
) {
  if (!enabled) return
  const context = getAudioContext()
  if (!context) return
  const session = (soundSessions.get(sound) ?? 0) + 1
  soundSessions.set(sound, session)

  const play = () => {
    if (soundSessions.get(sound) !== session) return
    const now = context.currentTime
    soundTones[sound].forEach(
      ({
        frequency,
        endFrequency,
        duration,
        delay = 0,
        gain = 0.04,
        waveform = "sine",
        attackDuration = 0.012,
        releaseDuration = 0,
      }) => {
        const oscillator = context.createOscillator()
        const volume = context.createGain()
        const startAt = now + delay
        const releaseAt = startAt + duration - releaseDuration
        oscillator.type = waveform
        oscillator.frequency.setValueAtTime(frequency, startAt)
        if (endFrequency) {
          oscillator.frequency.linearRampToValueAtTime(
            endFrequency,
            startAt + duration
          )
        }
        volume.gain.setValueAtTime(0.0001, startAt)
        volume.gain.exponentialRampToValueAtTime(
          gain * assistantSoundVolume,
          startAt + attackDuration
        )
        if (releaseDuration) {
          volume.gain.setValueAtTime(gain * assistantSoundVolume, releaseAt)
        }
        volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
        oscillator.connect(volume)
        volume.connect(context.destination)
        if (sound === "dock-charge") {
          activeChargeOscillators.add(oscillator)
          oscillator.addEventListener("ended", () => {
            activeChargeOscillators.delete(oscillator)
          })
        }
        const soundOscillators = activeSoundOscillators.get(sound) ?? new Set<OscillatorNode>()
        soundOscillators.add(oscillator)
        activeSoundOscillators.set(sound, soundOscillators)
        oscillator.addEventListener("ended", () => soundOscillators.delete(oscillator))
        oscillator.start(startAt)
        oscillator.stop(startAt + duration + 0.02)
      }
    )
  }

  if (context.state === "suspended") {
    void context.resume().then(play)
    return
  }
  play()
}

export function stopAssistantSound(sound: AssistantSound) {
  soundSessions.set(sound, (soundSessions.get(sound) ?? 0) + 1)
  const oscillators = new Set([
    ...(activeSoundOscillators.get(sound) ?? []),
    ...(sound === "dock-charge" ? activeChargeOscillators : []),
  ])
  oscillators.forEach((oscillator) => {
    try {
      oscillator.stop()
    } catch {
      // A completed oscillator does not need another stop call.
    }
  })
  activeSoundOscillators.delete(sound)
  if (sound === "dock-charge") activeChargeOscillators.clear()
}

export function vibrateAssistant(
  pattern: number | number[],
  enabled = true
) {
  if (
    enabled &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(pattern)
  }
}
