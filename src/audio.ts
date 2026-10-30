/** Procedural underwater soundscape. No audio files: everything is synthesised with the Web Audio API. */
class Sound {
  enabled = false
  private ctx: AudioContext | null = null
  private master!: GainNode
  private lp!: BiquadFilterNode
  private lastBubble = 0
  private pads: { g: GainNode; c: number; w: number; peak: number }[] = []
  private lastDepthAt = 0
  private lastD = -1

  private build() {
    const ctx = new AudioContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.lp = ctx.createBiquadFilter()
    this.lp.type = 'lowpass'
    this.lp.frequency.value = 900
    this.lp.Q.value = 0.7
    this.lp.connect(this.master).connect(ctx.destination)

    // brown-ish noise bed = water rumble
    const len = ctx.sampleRate * 4
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.2
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const ng = ctx.createGain()
    ng.gain.value = 0.9
    noise.connect(ng).connect(this.lp)
    noise.start()

    // two detuned sub drones with a slow swell
    ;[55, 82.6].forEach((f, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = i ? 0.05 : 0.08
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.07 + i * 0.05
      const lg = ctx.createGain()
      lg.gain.value = 0.03
      lfo.connect(lg).connect(g.gain)
      o.connect(g).connect(this.lp)
      o.start()
      lfo.start()
    })

    // four chord layers that crossfade with depth: bright and airy at the surface, dark and heavy at the bottom
    const layers: { notes: number[]; c: number; w: number; peak: number }[] = [
      { notes: [392, 493.9, 587.3], c: 0.04, w: 0.3, peak: 0.018 },
      { notes: [293.7, 370, 440], c: 0.34, w: 0.3, peak: 0.022 },
      { notes: [220, 261.6, 329.6], c: 0.64, w: 0.3, peak: 0.026 },
      { notes: [110, 130.8, 164.8], c: 0.96, w: 0.3, peak: 0.04 },
    ]
    this.pads = layers.map((l) => {
      const g = ctx.createGain()
      g.gain.value = 0
      const pf = ctx.createBiquadFilter()
      pf.type = 'lowpass'
      pf.frequency.value = 1400
      g.connect(pf).connect(this.master)
      l.notes.forEach((f, i) => {
        const o = ctx.createOscillator()
        o.type = i === 1 ? 'triangle' : 'sine'
        o.frequency.value = f
        o.detune.value = (i - 1) * 6
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 0.05 + i * 0.03
        const lg = ctx.createGain()
        lg.gain.value = 3
        lfo.connect(lg).connect(o.detune)
        o.connect(g)
        o.start()
        lfo.start()
      })
      return { g, c: l.c, w: l.w, peak: l.peak }
    })
  }

  async toggle(on = !this.enabled) {
    if (on && !this.ctx) this.build()
    if (!this.ctx) return
    if (on) await this.ctx.resume()
    this.enabled = on
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.linearRampToValueAtTime(on ? 0.5 : 0, t + 0.8)
  }

  /** deeper = darker; also crossfades the chord layers. Throttled: it's called every frame. */
  setDepth(depth: number) {
    if (!this.ctx || !this.enabled) return
    const now = this.ctx.currentTime
    if (now - this.lastDepthAt < 0.12 || Math.abs(depth - this.lastD) < 0.004) return
    this.lastDepthAt = now
    this.lastD = depth
    this.lp.frequency.setTargetAtTime(1100 - depth * 820, now, 0.4)
    for (const p of this.pads) {
      const w = Math.max(0, 1 - Math.abs(depth - p.c) / p.w)
      p.g.gain.setTargetAtTime(p.peak * w * w, now, 0.6)
    }
  }

  /** a slow whale call: glides up and back down with a wide vibrato */
  whale() {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(95, now)
    o.frequency.exponentialRampToValueAtTime(240, now + 2.2)
    o.frequency.exponentialRampToValueAtTime(150, now + 4.6)
    const vib = ctx.createOscillator()
    vib.frequency.value = 5.5
    const vg = ctx.createGain()
    vg.gain.value = 9
    vib.connect(vg).connect(o.frequency)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.16, now + 1.4)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 5)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 520
    o.connect(lp).connect(g).connect(this.master)
    o.start(now); vib.start(now)
    o.stop(now + 5.2); vib.stop(now + 5.2)
  }

  /** bright rising chime for the secret trench */
  chime() {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime
    ;[523.3, 659.3, 784, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const g = ctx.createGain()
      const t = now + i * 0.16
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
      o.connect(g).connect(this.master)
      o.start(t)
      o.stop(t + 1.7)
    })
  }

  bubble(strength = 1) {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime
    if (now - this.lastBubble < 0.07) return
    this.lastBubble = now
    const o = ctx.createOscillator()
    o.type = 'sine'
    const f = 380 + Math.random() * 520
    o.frequency.setValueAtTime(f, now)
    o.frequency.exponentialRampToValueAtTime(f * 2.1, now + 0.09)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.13 * Math.min(1.4, strength), now + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    o.connect(g).connect(this.master)
    o.start(now)
    o.stop(now + 0.2)
  }

  /** filtered-noise sweep for transitions; dir>0 rises, dir<0 falls */
  whoosh(dir = 1, dur = 0.7) {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const len = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.4
    bp.frequency.setValueAtTime(dir > 0 ? 300 : 2400, now)
    bp.frequency.exponentialRampToValueAtTime(dir > 0 ? 2400 : 300, now + dur)
    const g = ctx.createGain()
    g.gain.value = 0.28
    src.connect(bp).connect(g).connect(this.master)
    src.start(now)
  }

  /** tiny UI tick for hovers */
  tick(freq = 1200) {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
    o.connect(g).connect(this.master)
    o.start(now)
    o.stop(now + 0.08)
  }

  /** soft sonar ping, used by the radar */
  ping(freq = 740) {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.09, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
    o.connect(g).connect(this.master)
    o.start(now)
    o.stop(now + 1)
  }
}

export const sound = new Sound()
