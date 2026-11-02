/** Procedural underwater soundscape. No audio files: everything is synthesised with the Web Audio API. */
class Sound {
  enabled = false
  private ctx: AudioContext | null = null
  private master!: GainNode
  private lp!: BiquadFilterNode
  /** everything ambient passes through here, so depth can turn the whole sea down; UI sounds go straight to master */
  private sea!: GainNode
  private noiseGain!: GainNode
  /** slow rise and fall of the surface noise: waves passing overhead. Fades out with depth. */
  private swellAmt!: GainNode
  private foamGain!: GainNode
  /** sounds from far away (whale song, clicks): dry to master, plus a long reverb that grows with depth */
  private events!: GainNode
  private wet!: GainNode
  private life = 0
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
    this.sea = ctx.createGain()
    this.sea.gain.value = 1
    this.lp.connect(this.sea).connect(this.master).connect(ctx.destination)

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
    this.noiseGain = ng
    noise.connect(ng).connect(this.lp)

    // waves passing overhead: two slow, unrelated swells nudge the noise level up and down (strongest at the surface)
    this.swellAmt = ctx.createGain()
    this.swellAmt.gain.value = 0.4
    ;[0.11, 0.063].forEach((f, i) => {
      const o = ctx.createOscillator()
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = i ? 0.6 : 1
      o.connect(g).connect(this.swellAmt)
      o.start()
    })
    this.swellAmt.connect(ng.gain)

    // surface hiss: white noise above 2 kHz, shaped by the same swell. Only the top few metres have it.
    const wbuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
    const wd = wbuf.getChannelData(0)
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1
    const white = ctx.createBufferSource()
    white.buffer = wbuf
    white.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 2200
    const foamLp = ctx.createBiquadFilter()
    foamLp.type = 'lowpass'
    foamLp.frequency.value = 7000
    this.foamGain = ctx.createGain()
    this.foamGain.gain.value = 0.05
    const foamSwell = ctx.createGain()
    foamSwell.gain.value = 0.03
    this.swellAmt.connect(foamSwell).connect(this.foamGain.gain)
    white.connect(hp).connect(foamLp).connect(this.foamGain).connect(this.sea)
    white.start()

    // a long, dark room for distant sounds. Reverb is what far-off sounds in open water mostly are.
    const irLen = Math.floor(ctx.sampleRate * 4)
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const id = ir.getChannelData(c)
      for (let i = 0; i < irLen; i++) id[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3.2)
    }
    const reverb = ctx.createConvolver()
    reverb.buffer = ir
    this.wet = ctx.createGain()
    this.wet.gain.value = 0.1
    this.events = ctx.createGain()
    this.events.connect(this.master)
    this.events.connect(reverb)
    reverb.connect(this.wet).connect(this.master)
    noise.start()

    // two sub drones that are not in tune with each other, with a slow swell: pressure more than music
    ;[34, 52.3].forEach((f, i) => {
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

    // a faint chord bed in the sunlit water only; deeper than that the sea has no music, just water and pressure
    const layers: { notes: number[]; c: number; w: number; peak: number }[] = [
      { notes: [392, 493.9, 587.3], c: 0.02, w: 0.2, peak: 0.011 },
      { notes: [293.7, 370, 440], c: 0.2, w: 0.2, peak: 0.008 },
      { notes: [220, 261.6, 329.6], c: 0.64, w: 0.18, peak: 0 },
      { notes: [110, 130.8, 164.8], c: 0.97, w: 0.22, peak: 0 },
    ]
    this.pads = layers.map((l) => {
      const g = ctx.createGain()
      g.gain.value = 0
      const pf = ctx.createBiquadFilter()
      pf.type = 'lowpass'
      pf.frequency.value = 1400
      g.connect(pf).connect(this.sea)
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
    clearInterval(this.life)
    if (on) this.life = window.setInterval(() => this.wildlife(), 2500)
  }

  /**
   * Deeper = quieter and darker. Light and noise fade first, the chords thin out, and at the bottom there is
   * only a faint low hum, because the deep sea is nearly silent. depth is 0 (surface) to 1 (seabed).
   * Throttled: it is called every frame.
   */
  setDepth(depth: number) {
    if (!this.ctx || !this.enabled) return
    const now = this.ctx.currentTime
    if (now - this.lastDepthAt < 0.12 || Math.abs(depth - this.lastD) < 0.004) return
    this.lastDepthAt = now
    this.lastD = depth
    const d = Math.min(1, Math.max(0, depth))
    const dim = d * d * (3 - 2 * d) // smoothstep: changes gently at the top and the bottom
    this.sea.gain.setTargetAtTime(1 - 0.82 * dim, now, 0.7) // overall level: full at the surface, a fifth of it at the bottom
    this.lp.frequency.setTargetAtTime(3000 - 2860 * dim, now, 0.5) // muffled: 3 kHz at the surface, 140 Hz at the bottom
    this.noiseGain.gain.setTargetAtTime(0.9 - 0.78 * dim, now, 0.8) // the water noise nearly disappears
    const top = Math.max(0, 1 - d / 0.18) // 1 at the surface, 0 by about 35 m
    this.swellAmt.gain.setTargetAtTime(0.4 * top, now, 1.2) // no waves overhead once you are down
    this.foamGain.gain.setTargetAtTime(0.05 * top, now, 1.2)
    this.wet.gain.setTargetAtTime(0.1 + 0.6 * dim, now, 1.5) // far-off sounds get roomier the deeper you are
    for (const p of this.pads) {
      const w = Math.max(0, 1 - Math.abs(d - p.c) / p.w)
      p.g.gain.setTargetAtTime(p.peak * w * w, now, 0.7)
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
    o.connect(lp).connect(g).connect(this.events)
    o.start(now); vib.start(now)
    o.stop(now + 5.2); vib.stop(now + 5.2)
  }

  /** what lives down there, at roughly the depths it lives: crackle in warm shallows, then clicks and song from a distance */
  private wildlife() {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return
    const d = this.lastD < 0 ? 0 : this.lastD
    const r = Math.random()
    if (d < 0.1 && r < 0.85) this.crackle()
    else if (d > 0.15 && d < 0.95 && r < 0.07) this.clicks()
    else if (d > 0.3 && r > 0.93) this.farSong(d)
  }

  /** snapping shrimp: a dry, quiet crackle of tiny pops, heard only in the sunlit shallows */
  private crackle() {
    const ctx = this.ctx!
    const t0 = ctx.currentTime
    const n = 5 + Math.floor(Math.random() * 10)
    for (let i = 0; i < n; i++) {
      const t = t0 + Math.random() * 2.2
      const len = Math.floor(ctx.sampleRate * 0.006)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let k = 0; k < len; k++) data[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 2)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 3500 + Math.random() * 3500
      bp.Q.value = 1.2
      const g = ctx.createGain()
      g.gain.value = 0.015 + Math.random() * 0.03
      src.connect(bp).connect(g).connect(this.sea)
      src.start(t)
    }
  }

  /** a distant sperm-whale-like click train: slow, muffled, spaced like footsteps */
  private clicks() {
    const ctx = this.ctx!
    const t0 = ctx.currentTime + 0.1
    const n = 7 + Math.floor(Math.random() * 8)
    let t = t0
    for (let i = 0; i < n; i++) {
      const len = Math.floor(ctx.sampleRate * 0.012)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let k = 0; k < len; k++) data[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 1.6)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1100 + Math.random() * 500
      bp.Q.value = 2
      const g = ctx.createGain()
      g.gain.value = 0.05
      src.connect(bp).connect(g).connect(this.events)
      src.start(t)
      t += 0.45 + Math.random() * 0.25
    }
  }

  /** a far-off whale moan, mostly low harmonics (the fundamental is below what a laptop can play), buried in reverb */
  private farSong(d: number) {
    const ctx = this.ctx!
    const now = ctx.currentTime
    const base = 38 + Math.random() * 14
    const dur = 7 + Math.random() * 3
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.04 + 0.03 * d, now + dur * 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    g.connect(lp).connect(this.events)
    ;[1, 2, 3].forEach((h, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(base * h, now)
      o.frequency.linearRampToValueAtTime(base * h * 1.45, now + dur * 0.45)
      o.frequency.linearRampToValueAtTime(base * h * 0.9, now + dur)
      const hg = ctx.createGain()
      hg.gain.value = [0.5, 1, 0.55][i]
      o.connect(hg).connect(g)
      o.start(now)
      o.stop(now + dur + 0.2)
    })
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
    g.gain.exponentialRampToValueAtTime(0.13 * Math.min(1.4, strength) * (1 - 0.6 * Math.max(0, this.lastD)), now + 0.012)
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
    g.gain.value = 0.28 * (1 - 0.5 * Math.max(0, this.lastD))
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
