import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

/** Spring-following lens cursor. Elements opt in with data-cursor="Label". */
export function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 520, damping: 40, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 520, damping: 40, mass: 0.5 })
  const [label, setLabel] = useState('')
  const [down, setDown] = useState(false)
  const [hover, setHover] = useState(false)
  const [fine] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches)

  useEffect(() => {
    if (!fine) return
    document.body.classList.add('no-cursor')
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null
      const el = t?.closest<HTMLElement>('[data-cursor]')
      setLabel(el?.dataset.cursor ?? '')
      setHover(!!t?.closest('a,button,[role=button],[data-cursor]'))
    }
    const dn = () => setDown(true)
    const up = () => setDown(false)
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerover', over, { passive: true })
    addEventListener('pointerdown', dn)
    addEventListener('pointerup', up)
    return () => {
      document.body.classList.remove('no-cursor')
      removeEventListener('pointermove', move)
      removeEventListener('pointerover', over)
      removeEventListener('pointerdown', dn)
      removeEventListener('pointerup', up)
    }
  }, [fine, x, y])

  if (!fine) return null
  const big = !!label
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} />
      <motion.div
        className="cursor-ring"
        style={{ x: sx, y: sy }}
        animate={{ width: big ? 92 : hover ? 54 : 34, height: big ? 92 : hover ? 54 : 34, scale: down ? 0.82 : 1, backgroundColor: big ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,0)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        <motion.span animate={{ opacity: big ? 1 : 0, scale: big ? 1 : 0.6 }} transition={{ duration: 0.2 }}>
          {label}
        </motion.span>
      </motion.div>
    </>
  )
}
