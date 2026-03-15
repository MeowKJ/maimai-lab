'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { UserData } from '@/lib/api/types'
import { ApiType } from '@/lib/api/enum'
import {
  generateAvatarUrl,
  generatePlateUrl,
  generateCourseRankUrl,
  generateClassRankUrl,
} from '@/lib/assets'
import {
  getRatingStyle,
  TROPHY_COLORS,
} from '@/lib/ratingCode'

const CUTE_EMOJIS = ['🌸', '🍓', '🎀', '🍬', '💫', '🍑', '🌙', '🌺', '🎵', '🍡', '🍰', '🌷', '💕', '✨', '🍒', '🦋', '🌻', '🎊', '🍮', '🌈']

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededEmojis(seed: string, count: number): string {
  const rnd = mulberry32(fnv1a32(seed))
  let out = ''
  for (let i = 0; i < count; i++) {
    out += CUTE_EMOJIS[Math.floor(rnd() * CUTE_EMOJIS.length)]
  }
  return out
}

function maskQQ(qq: string): string {
  const e = seededEmojis(`qq:${qq}`, 3)
  if (qq.length <= 7) return qq.slice(0, 2) + e
  return qq.slice(0, 3) + e + qq.slice(-4)
}

function maskUsername(name: string): string {
  if (name.length <= 2) return name + seededEmojis(`name:${name}`, 1)
  return name.slice(0, 2) + seededEmojis(`name:${name}`, 3)
}

interface UserCardProps {
  userData: UserData
}

export function UserCard({ userData }: UserCardProps) {
  const ratingStyle = getRatingStyle(userData.rating)
  const trophyGradient = TROPHY_COLORS[userData.trophyColor] ?? TROPHY_COLORS.normal
  const isLxns = userData.api === ApiType.LXNS

  // Deterministic mask to avoid SSR/CSR hydration mismatch.
  const maskedId = useMemo(() => {
    return isLxns
      ? `QQ: ${maskQQ(String(userData.username))}`
      : maskUsername(String(userData.username))
  }, [isLxns, userData.username])

  // Avatar: LXNS provides icon.id → /assets/avatar/{id}
  // DivingFish sets avatarUrl to a static fallback path
  const [avatarSrc, setAvatarSrc] = useState(() => userData.avatarUrl || generateAvatarUrl(null))
  useEffect(() => {
    setAvatarSrc(userData.avatarUrl || generateAvatarUrl(null))
  }, [userData.avatarUrl])

  return (
    <motion.div
      className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-3xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Plate / ambient background */}
      {userData.plateId > 0 ? (
        <>
          <Image
            src={generatePlateUrl(userData.plateId)}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 130% 130% at 15% 50%, var(--primary) 0%, transparent 60%),' +
              'radial-gradient(ellipse 100% 100% at 90% 30%, var(--accent) 0%, transparent 55%)',
            filter: 'blur(48px)',
            transform: 'scale(1.3)',
            opacity: 0.5,
          }}
        />
      )}

      {/* Frosted glass body */}
      <div className="relative z-10 bg-white/40 dark:bg-black/52 backdrop-blur-2xl border border-white/30 dark:border-white/12 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 p-4 sm:gap-5 sm:p-6">

          {/* Avatar */}
          <motion.div
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div className="relative w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/40 ring-offset-1 ring-offset-transparent">
              <Image
                src={avatarSrc}
                alt="avatar"
                fill
                sizes="88px"
                className="object-cover"
                unoptimized
                onError={() => setAvatarSrc(generateAvatarUrl(null))}
              />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 px-2 py-[3px] rounded-full text-[10px] font-extrabold bg-black/55 backdrop-blur-sm text-white border border-white/25 leading-none">
              {isLxns ? '落雪' : '水鱼'}
            </div>
          </motion.div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            {userData.trophyName && (
              <div
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-white mb-2 shadow-md"
                style={{ background: trophyGradient }}
              >
                <span className="truncate max-w-[200px]">{userData.trophyName}</span>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-black text-foreground truncate leading-tight drop-shadow-sm">
              {userData.nickname}
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">{maskedId}</p>

            {/* 段位 / 阶级 badge images */}
            {(userData.rankId > 0 || userData.classId > 0) && (
              <div className="flex items-center gap-2 mt-2">
                {userData.rankId > 0 && (
                  <Image
                    src={generateCourseRankUrl(userData.rankId)}
                    alt={`段位 ${userData.rankId}`}
                    width={96}
                    height={24}
                    className="h-6 w-auto object-contain"
                    unoptimized
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
                {userData.classId > 0 && (
                  <Image
                    src={generateClassRankUrl(userData.classId)}
                    alt={`阶级 ${userData.classId}`}
                    width={96}
                    height={24}
                    className="h-6 w-auto object-contain"
                    unoptimized
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] font-semibold text-foreground/45 mb-0.5 uppercase tracking-widest">
              Rating
            </p>
            <motion.div
              className="text-[38px] sm:text-[44px] font-black tabular-nums leading-none"
              style={ratingStyle}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.22, type: 'spring', bounce: 0.32 }}
            >
              {userData.rating.toLocaleString()}
            </motion.div>
          </div>

        </div>
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  )
}
