'use client'

import { useEffect, useState } from 'react'

// Static glow orb — CSS animation, no Framer Motion (Safari perf)
function GlowOrb({
  x, y, size, color, duration, delay,
}: {
  x: number; y: number; size: number; color: string; duration: number; delay: number
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(48px)',
        opacity: 0,
        animation: `orbPulse ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  )
}

// Floating particle — small glowing dot, CSS keyframes
function Particle({
  x, size, color, duration, delay,
}: {
  x: number; size: number; color: string; duration: number; delay: number
}) {
  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        left: `${x}%`,
        bottom: '-20px',
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        opacity: 0,
        animation: `floatUp ${duration}s linear ${delay}s infinite`,
      }}
    />
  )
}

export function MaimaiBackground() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes orbPulse {
          0%   { opacity: 0.3; transform: translate(-50%,-50%) scale(1); }
          50%  { opacity: 0.55; transform: translate(-50%,-50%) scale(1.15); }
          100% { opacity: 0.3; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes floatUp {
          0%   { opacity: 0;   transform: translateY(0)    rotate(0deg); }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.2; }
          100% { opacity: 0;   transform: translateY(-100vh) rotate(360deg); }
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

        {/* ── Main gradient background ── */}
        <div className="absolute inset-0" style={{ background: 'var(--bg-gradient)' }} />

        {/* ── Large ambient glow orbs — vivid so glass cards catch the color ── */}
        <GlowOrb x={8}   y={15}  size={700} color="var(--primary)" duration={6}  delay={0}   />
        <GlowOrb x={88}  y={25}  size={600} color="var(--accent)"  duration={7}  delay={1.5} />
        <GlowOrb x={50}  y={55}  size={550} color="var(--primary)" duration={8}  delay={3}   />
        <GlowOrb x={20}  y={80}  size={500} color="var(--accent)"  duration={6}  delay={2}   />
        <GlowOrb x={75}  y={75}  size={480} color="var(--primary)" duration={9}  delay={0.5} />
        <GlowOrb x={38}  y={10}  size={400} color="var(--accent)"  duration={7}  delay={4}   />

        {/* ── Floating particles ── */}
        {[
          { x: 8,  size: 3, color: 'var(--primary)', duration: 9,  delay: 0   },
          { x: 18, size: 2, color: 'var(--accent)',  duration: 11, delay: 2.5 },
          { x: 30, size: 4, color: 'var(--primary)', duration: 8,  delay: 1   },
          { x: 45, size: 2, color: 'var(--accent)',  duration: 13, delay: 3.5 },
          { x: 58, size: 3, color: 'var(--primary)', duration: 10, delay: 0.8 },
          { x: 70, size: 2, color: 'var(--accent)',  duration: 12, delay: 2   },
          { x: 82, size: 4, color: 'var(--primary)', duration: 9,  delay: 4   },
          { x: 92, size: 3, color: 'var(--accent)',  duration: 11, delay: 1.2 },
        ].map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* ── Subtle dot grid ── */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* ── Vignette edges to make content pop ── */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.15) 100%)',
          }}
        />
      </div>
    </>
  )
}
