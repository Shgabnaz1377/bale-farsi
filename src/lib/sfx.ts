import { P } from './store.ts'

let ctx: AudioContext | null = null

/** Two short tones: rising for right, falling for wrong. */
export function chime(ok: boolean) {
  if (!P.settings.sfx) return
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime
    const notes = ok ? [660, 990] : [233, 196]
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      const s = t + i * 0.09
      o.type = ok ? 'sine' : 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, s)
      g.gain.exponentialRampToValueAtTime(0.12, s + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.26)
      o.connect(g).connect(ctx!.destination)
      o.start(s)
      o.stop(s + 0.3)
    })
  } catch {
    /* audio blocked */
  }
}
