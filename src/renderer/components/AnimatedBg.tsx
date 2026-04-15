import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  r: number; alpha: number
}

export default function AnimatedBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => canvas.width
    const H = () => canvas.height
    const COUNT = 55
    const MAX_DIST = 110

    const ps: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.3 + 0.4,
      alpha: Math.random() * 0.45 + 0.15,
    }))

    let raf: number

    const frame = () => {
      ctx.clearRect(0, 0, W(), H())

      for(const p of ps) {
        p.x += p.vx
        p.y += p.vy
        if(p.x < 0) p.x = W()
        if(p.x > W()) p.x = 0
        if(p.y < 0) p.y = H()
        if(p.y > H()) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,155,255,${p.alpha})`
        ctx.fill()
      }

      for(let i = 0; i < ps.length; i++) {
        for(let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x
          const dy = ps[i].y - ps[j].y
          const d = Math.hypot(dx, dy)
          if(d < MAX_DIST) {
            ctx.beginPath()
            ctx.moveTo(ps[i].x, ps[i].y)
            ctx.lineTo(ps[j].x, ps[j].y)
            ctx.strokeStyle = `rgba(130,100,255,${0.14 * (1 - d / MAX_DIST)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <div className="aurora-wrap" aria-hidden>
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
      </div>
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden />
    </>
  )
}
