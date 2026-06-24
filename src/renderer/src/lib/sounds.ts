import { Howl } from 'howler'

export type SoundId =
  | 'none'
  | 'vuvuzela' | 'goalhorn' | 'airhorn' | 'roar' | 'drumroll' | 'whistle' | 'whistle3'
  | 'chime' | 'fanfare' | 'trumpet' | 'ding' | 'ping' | 'buzz' | 'alert'

export interface SoundGroup {
  label: string
  ids: SoundId[]
}

export const SOUND_GROUPS: SoundGroup[] = [
  { label: '⚽ Football', ids: ['vuvuzela', 'goalhorn', 'airhorn', 'roar', 'drumroll', 'whistle', 'whistle3'] },
  { label: '🎵 Tones',    ids: ['chime', 'fanfare', 'trumpet', 'ding', 'ping', 'buzz', 'alert'] },
  { label: '—',           ids: ['none'] },
]

export const SOUND_LABELS: Record<SoundId, string> = {
  none:      'None',
  vuvuzela:  'Vuvuzela',
  goalhorn:  'Goal Horn',
  airhorn:   'Air Horn',
  roar:      'Crowd Roar',
  drumroll:  'Drum Roll',
  whistle:   'Whistle',
  whistle3:  'Triple Whistle',
  chime:     'Chime',
  fanfare:   'Fanfare',
  trumpet:   'Trumpet Stab',
  ding:      'Ding',
  ping:      'Ping',
  buzz:      'Buzz',
  alert:     'Alert',
}

export const SOUND_IDS: SoundId[] = SOUND_GROUPS.flatMap(g => g.ids)

// ── Helpers ───────────────────────────────────────────────────────────────────

let whistleHowl: Howl | null = null
function getWhistle(): Howl {
  if (!whistleHowl) whistleHowl = new Howl({ src: ['/sounds/whistle.wav'], volume: 0.85 })
  return whistleHowl
}

function ac(): AudioContext {
  type W = Window & { webkitAudioContext?: typeof AudioContext }
  const w = window as W
  return new (w.AudioContext ?? w.webkitAudioContext!)()
}

function noise(ctx: AudioContext, dur: number): AudioBufferSourceNode {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  return src
}

// ── Football sounds ───────────────────────────────────────────────────────────

function playVuvuzela() {
  const ctx = ac()
  const dur = 1.5
  const root = 233.08 // Bb3 — the vuvuzela fundamental
  ;[1, 2, 3, 4].forEach((h, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.value = root * h
    const vol = [0.2, 0.1, 0.06, 0.03][i]
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(vol, ctx.currentTime + dur - 0.25)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
    if (i === 3) osc.onended = () => ctx.close()
  })
}

function playGoalHorn() {
  const ctx = ac()
  const dur = 2.0
  const freqs = [87.3, 110] // F2 + A2 — deep stadium blast
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.04)
    gain.gain.setValueAtTime(0.28, ctx.currentTime + dur - 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
    if (i === freqs.length - 1) osc.onended = () => ctx.close()
  })
}

function playAirhorn() {
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(155, ctx.currentTime + 0.75)
  gain.gain.setValueAtTime(0.35, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75)
  osc.start(); osc.stop(ctx.currentTime + 0.75)
  osc.onended = () => ctx.close()
}

function playCrowdRoar() {
  const ctx = ac()
  const dur = 2.2
  const src = noise(ctx, dur)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.4
  const gain = ctx.createGain()
  src.connect(bp); bp.connect(gain); gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.5)
  gain.gain.setValueAtTime(0.5, ctx.currentTime + dur - 0.6)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  src.start(); src.stop(ctx.currentTime + dur)
  src.onended = () => ctx.close()
}

function playDrumroll() {
  const ctx = ac()
  const total = 0.9
  const hits = 20
  for (let i = 0; i < hits; i++) {
    const t = ctx.currentTime + (i / hits) * total
    const s = noise(ctx, 0.06)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 150
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08 + (i / hits) * 0.28, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    s.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
    s.start(t); s.stop(t + 0.06)
    if (i === hits - 1) s.onended = () => ctx.close()
  }
}

function playWhistle3() {
  const h = getWhistle()
  h.play()
  setTimeout(() => h.play(), 480)
  setTimeout(() => h.play(), 960)
}

// ── Tone sounds ───────────────────────────────────────────────────────────────

function playChime() {
  const ctx = ac()
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = ctx.currentTime + i * 0.2
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.3, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85)
    osc.start(t); osc.stop(t + 0.85)
    if (i === notes.length - 1) osc.onended = () => ctx.close()
  })
}

function playFanfare() {
  const ctx = ac()
  const notes = [392, 523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const t = ctx.currentTime + i * 0.1
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    osc.start(t); osc.stop(t + 0.22)
    if (i === notes.length - 1) osc.onended = () => ctx.close()
  })
}

function playTrumpet() {
  const ctx = ac()
  const stabs = [{ f: 523.25, t: 0 }, { f: 659.25, t: 0.15 }, { f: 783.99, t: 0.28 }]
  stabs.forEach(({ f, t }, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.value = f
    const at = ctx.currentTime + t
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.28, at + 0.015)
    gain.gain.setValueAtTime(0.28, at + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18)
    osc.start(at); osc.stop(at + 0.18)
    if (i === stabs.length - 1) osc.onended = () => ctx.close()
  })
}

function playDing() {
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85)
  osc.start(); osc.stop(ctx.currentTime + 0.85)
  osc.onended = () => ctx.close()
}

function playPing() {
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = 1318.5
  gain.gain.setValueAtTime(0.28, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.start(); osc.stop(ctx.currentTime + 0.3)
  osc.onended = () => ctx.close()
}

function playBuzz() {
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'square'
  osc.frequency.value = 180
  gain.gain.setValueAtTime(0.22, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38)
  osc.start(); osc.stop(ctx.currentTime + 0.38)
  osc.onended = () => ctx.close()
}

function playAlert() {
  const ctx = ac()
  const tones = [440, 329.63, 440, 329.63]
  tones.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = freq
    const t = ctx.currentTime + i * 0.13
    gain.gain.setValueAtTime(0.18, t)
    gain.gain.setValueAtTime(0.001, t + 0.11)
    osc.start(t); osc.stop(t + 0.11)
    if (i === tones.length - 1) osc.onended = () => ctx.close()
  })
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function playSound(soundId: SoundId | string) {
  switch (soundId) {
    case 'vuvuzela': playVuvuzela(); break
    case 'goalhorn': playGoalHorn(); break
    case 'airhorn':  playAirhorn(); break
    case 'roar':     playCrowdRoar(); break
    case 'drumroll': playDrumroll(); break
    case 'whistle':  getWhistle().play(); break
    case 'whistle3': playWhistle3(); break
    case 'chime':    playChime(); break
    case 'fanfare':  playFanfare(); break
    case 'trumpet':  playTrumpet(); break
    case 'ding':     playDing(); break
    case 'ping':     playPing(); break
    case 'buzz':     playBuzz(); break
    case 'alert':    playAlert(); break
    case 'none':     break
  }
}
