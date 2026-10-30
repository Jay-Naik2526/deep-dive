/**
 * One decision, made once at startup: how much work this device should be asked to do.
 *  - touch: phones and tablets (coarse pointer). No hover effects, no cursor, native scrolling.
 *  - lite:  touch devices and low-end machines get a lighter scene: cheaper water shader, a 30fps WebGL cap,
 *           fewer jellyfish and particles, no per-frame font animation while scrolling.
 * Override for testing with ?q=lite or ?q=high.
 */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()
const force = params.get('q')
const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined

const touch = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || ((nav?.maxTouchPoints ?? 0) > 0 && innerWidth < 1024))
const lowEnd = (nav?.deviceMemory ?? 8) <= 4 || (nav?.hardwareConcurrency ?? 8) <= 4

export const quality = {
  touch,
  lite: force === 'lite' ? true : force === 'high' ? false : touch || lowEnd,
}

if (typeof document !== 'undefined') document.documentElement.dataset.quality = quality.lite ? 'lite' : 'high'
