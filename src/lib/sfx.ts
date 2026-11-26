import { P } from './store.ts'

let ctx: AudioContext | null = null

export type Meow = 'happy' | 'mew' | 'sad'

/**
 * Pishi's voice, synthesised (no audio files): a buzzy source shaped by two moving "mouth" filters,
 * with a pitch glide, so it sounds like m-e-o-w rather than a beep.
 * - happy: a bright meow for a right answer
 * - mew:   a short, high mew when a pair matches
 * - sad:   a soft falling mrrw for a wrong answer
 */
const SHAPES: Record<Meow, { dur: number; pitch: [number, number, number]; f1: [number, number, number]; f2: [number, number, number]; vol: number }> = {
  happy: { dur: 0.5, pitch: [560, 820, 520], f1: [650, 1150, 700], f2: [1700, 2600, 1500], vol: 0.16 },
  mew: { dur: 0.28, pitch: [780, 1050, 860], f1: [800, 1300, 900], f2: [2100, 3000, 2200], vol: 0.12 },
  sad: { dur: 0.55, pitch: [480, 430, 300], f1: [700, 800, 450], f2: [1600, 1700, 1200], vol: 0.13 },
}

export function meow(kind: Meow = 'happy') {
  if (!P.settings.sfx) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const s = SHAPES[kind]
    const t0 = ctx.currentTime + 0.01
    const mid = t0 + s.dur * 0.3
    const end = t0 + s.dur

    const src = ctx.createOscillator()
    src.type = 'sawtooth'
    src.frequency.setValueAtTime(s.pitch[0], t0)
    src.frequency.exponentialRampToValueAtTime(s.pitch[1], mid)
    src.frequency.exponentialRampToValueAtTime(s.pitch[2], end)

    // A little vibrato makes it sound alive.
    const vib = ctx.createOscillator()
    const vibDepth = ctx.createGain()
    vib.frequency.value = 7
    vibDepth.gain.value = 12
    vib.connect(vibDepth).connect(src.frequency)

    // Two formant filters move like a mouth opening (m → e/a) and closing (→ ow).
    const mouth = [s.f1, s.f2].map((f, i) => {
      const bp = ctx!.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = i === 0 ? 6 : 9
      bp.frequency.setValueAtTime(f[0], t0)
      bp.frequency.exponentialRampToValueAtTime(f[1], mid)
      bp.frequency.exponentialRampToValueAtTime(f[2], end)
      return bp
    })

    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, t0)
    amp.gain.exponentialRampToValueAtTime(s.vol, t0 + 0.04)
    amp.gain.setValueAtTime(s.vol, end - s.dur * 0.35)
    amp.gain.exponentialRampToValueAtTime(0.0001, end)

    const mix = ctx.createGain()
    mix.gain.value = 1.6
    for (const f of mouth) src.connect(f).connect(mix)
    mix.connect(amp).connect(ctx.destination)

    src.start(t0)
    vib.start(t0)
    src.stop(end + 0.05)
    vib.stop(end + 0.05)
  } catch {
    /* audio blocked */
  }
}

/** Right / wrong answer sound. */
export const chime = (ok: boolean) => meow(ok ? 'happy' : 'sad')
