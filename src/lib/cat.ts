/**
 * Pishi (پیشی, "kitty"), the PersianMeow mascot: a cream Persian cat with a flat face, copper eyes,
 * a big ruff and a turquoise collar with a saffron eight-point star tag.
 * Pure SVG strings so the same drawing serves the app, the favicon and the store icons.
 */
export type Mood = 'idle' | 'happy' | 'cheer' | 'sad' | 'think' | 'sleep' | 'wave'

const C = {
  fur: '#FFF8EE',
  shade: '#F0E2CC',
  line: '#3D3047',
  pink: '#F2A0AE',
  iris: '#E0962A',
  pupil: '#2A1F2E',
  mouth: '#B8405A',
  collar: '#0A7B7A',
  tag: '#E2A21B',
  tear: '#7EC8E3',
}

/** A fluffy outline: an ellipse whose edge is a ring of small outward bumps. */
function fluff(cx: number, cy: number, rx: number, ry: number, n: number, from = 0, to = 360): string {
  const pts: [number, number][] = []
  const span = to - from
  const steps = span === 360 ? n : n
  for (let i = 0; i <= steps; i++) {
    const a = ((from + (span * i) / steps) * Math.PI) / 180
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  const chord = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1])
  const r = (chord * 0.62).toFixed(1)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) d += ` A${r} ${r} 0 0 1 ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`
  return d + (span === 360 ? ' Z' : '')
}

function star(cx: number, cy: number, R: number, r: number): string {
  const p: string[] = []
  for (let k = 0; k < 16; k++) {
    const a = ((-90 + k * 22.5) * Math.PI) / 180
    const rad = k % 2 ? r : R
    p.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`)
  }
  return p.join(' ')
}

const line = (w = 4) => `stroke="${C.line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
const stroke = line()

function eyes(mood: Mood): string {
  const open = (dx: number, dy: number) =>
    [80, 120]
      .map(
        (x) => `<g class="eye">
  <circle cx="${x}" cy="86" r="13" fill="${C.iris}" ${stroke}/>
  <circle cx="${x + dx}" cy="${86 + dy}" r="7.5" fill="${C.pupil}"/>
  <circle cx="${x + dx - 3.5}" cy="${86 + dy - 4}" r="3" fill="#fff"/>
</g>`,
      )
      .join('')
  switch (mood) {
    case 'happy':
    case 'cheer':
      return `<path d="M69 90 Q80 77 91 90 M109 90 Q120 77 131 90" fill="none" ${line(5)}/>`
    case 'sleep':
      return `<path d="M69 87 Q80 95 91 87 M109 87 Q120 95 131 87" fill="none" ${line(5)}/>`
    case 'sad':
      return open(0, 3) + `<path d="M67 76 L89 69 M133 76 L111 69" fill="none" ${stroke}/>`
    case 'think':
      return open(-3, -4)
    default:
      return open(0, 0)
  }
}

function mouth(mood: Mood): string {
  switch (mood) {
    case 'happy':
    case 'cheer':
      return `<path d="M91 104 Q100 120 109 104 Z" fill="${C.mouth}" ${line(3)}/>`
    case 'sad':
      return `<path d="M93 113 Q100 106 107 113" fill="none" ${line(3)}/>`
    case 'think':
      return `<path d="M95 109 L105 108" fill="none" ${line(3)}/>`
    case 'wave':
      return `<path d="M100 103 Q99 110 92 110 M100 103 Q101 110 108 110" fill="none" ${line(3)}/>`
    default:
      return `<path d="M100 103 Q99 109 94 109 M100 103 Q101 109 106 109" fill="none" ${line(3)}/>`
  }
}

function extras(mood: Mood): string {
  switch (mood) {
    case 'cheer':
      return `<g class="sparkles" fill="${C.tag}">
  <polygon points="${star(30, 46, 9, 4)}"/><polygon points="${star(172, 40, 11, 5)}"/>
  <polygon points="${star(178, 86, 6, 3)}"/><polygon points="${star(22, 92, 6, 3)}"/></g>`
    case 'sad':
      return `<path class="tear" d="M70 100 Q66 108 70 111 Q74 108 70 100 Z" fill="${C.tear}"/>`
    case 'sleep':
      return `<g class="zzz" fill="${C.line}" font-family="Segoe UI, sans-serif" font-weight="800">
  <text x="146" y="42" font-size="18">z</text><text x="160" y="28" font-size="14">z</text><text x="171" y="17" font-size="10">z</text></g>`
    case 'think':
      return `<text x="150" y="40" font-family="Segoe UI, sans-serif" font-weight="800" font-size="28" fill="${C.collar}">?</text>`
    default:
      return ''
  }
}

function paws(mood: Mood): string {
  const paw = (cx: number, cy: number, rx = 13, ry = 10) =>
    `<path d="${fluff(cx, cy, rx, ry, 7)}" fill="${C.fur}" ${stroke}/>`
  const feet = paw(80, 186) + paw(120, 186)
  if (mood === 'cheer') return feet + `<g class="arms">${paw(48, 112, 12, 14)}${paw(152, 112, 12, 14)}</g>`
  if (mood === 'wave') return feet + `<g class="wave-paw">${paw(154, 96, 12, 14)}</g>`
  if (mood === 'think') return feet + paw(116, 124, 12, 10)
  return feet
}

/** The collar: turquoise for PersianMeow, the Italian tricolour for Bego Ciao. */
function collar(style: 'persian' | 'italian'): string {
  const d = 'M64 128 Q100 146 136 128'
  if (style === 'persian') return `<path d="${d}" fill="none" stroke="${C.collar}" stroke-width="8" stroke-linecap="round"/>`
  const seg = 26.5
  return ['#1E8A4C', '#FFFFFF', '#CD2E3A']
    .map((c, i) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="${i === 1 ? 'butt' : 'round'}" stroke-dasharray="${seg} 200" stroke-dashoffset="${-seg * i}"/>`)
    .join('')
}

export function catSvg(mood: Mood = 'idle', opts: { face?: boolean; title?: string; collar?: 'persian' | 'italian' } = {}): string {
  const view = opts.face ? '30 16 140 140' : '0 0 200 200'
  const title = opts.title ? `<title>${opts.title}</title>` : ''
  const body = opts.face
    ? ''
    : `<path class="tail" d="M138 174 C186 176 196 128 172 108 C164 102 154 108 159 117 C172 136 166 160 138 160 Z" fill="${C.fur}" ${stroke}/>
<path d="${fluff(100, 152, 56, 38, 16)}" fill="${C.fur}" ${stroke}/>
<path d="${fluff(100, 136, 36, 18, 10)}" fill="${C.shade}" opacity="0.7"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" class="cat cat-${mood}" role="img"${opts.title ? '' : ' aria-hidden="true"'}>${title}
${body}
<g class="head">
<path d="M56 62 L58 28 L88 44 Z" fill="${C.fur}" ${stroke}/>
<path d="M144 62 L142 28 L112 44 Z" fill="${C.fur}" ${stroke}/>
<path d="M62 52 L63 36 L78 45 Z" fill="${C.pink}"/>
<path d="M138 52 L137 36 L122 45 Z" fill="${C.pink}"/>
<path d="${fluff(100, 86, 56, 50, 20)}" fill="${C.fur}" ${stroke}/>
<path d="${fluff(100, 40, 14, 7, 6, 180, 360)}" fill="${C.fur}" ${line(3)}/>
<ellipse cx="69" cy="104" rx="8" ry="5" fill="${C.pink}" opacity="0.55"/>
<ellipse cx="131" cy="104" rx="8" ry="5" fill="${C.pink}" opacity="0.55"/>
${eyes(mood)}
<path d="M94 97 Q100 94 106 97 L100 103 Z" fill="${C.pink}" ${line(2.5)}/>
${mouth(mood)}
<path d="M80 103 L54 99 M80 108 L55 112 M120 103 L146 99 M120 108 L145 112" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
</g>
${collar(opts.collar ?? 'persian')}
<polygon points="${star(100, 141, 9, 7)}" fill="${C.tag}" stroke="${C.line}" stroke-width="2"/>
${opts.face ? '' : paws(mood)}
${extras(mood)}
</svg>`
}
