'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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

function randEmojis(count: number): string {
  return Array.from({ length: count }, () =>
    CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)]
  ).join('')
}

function maskQQ(qq: string): string {
  const e = randEmojis(3)
  if (qq.length <= 7) return qq.slice(0, 2) + e
  return qq.slice(0, 3) + e + qq.slice(-4)
}

function maskUsername(name: string): string {
  if (name.length <= 2) return name + randEmojis(1)
  return name.slice(0, 2) + randEmojis(3)
}

interface UserCardProps {
  userData: UserData
}

export function UserCard({ userData }: UserCardProps) {
  const ratingStyle = getRatingStyle(userData.rating)
  const trophyGradient = TROPHY_COLORS[userData.trophyColor] ?? TROPHY_COLORS.normal
  const isLxns = userData.api === ApiType.LXNS

  // Random on every mount (= every page refresh), stable through re-renders
  const [maskedId] = useState(() =>
    isLxns
      ? `QQ: ${maskQQ(String(userData.username))}`
      : maskUsername(String(userData.username))
  )

  // Avatar: LXNS provides icon.id → /assets/avatar/{id}
  // DivingFish sets avatarUrl to a static fallback path
  const avatarSrc = userData.avatarUrl || generateAvatarUrl(null)

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
          <img
            src={generatePlateUrl(userData.plateId)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
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
            <div className="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/40 ring-offset-1 ring-offset-transparent">
              <img
                src={avatarSrc}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = generateAvatarUrl(null)
                }}
                alt="avatar"
                className="w-full h-full object-cover"
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
                  <img
                    src={generateCourseRankUrl(userData.rankId)}
                    alt={`段位 ${userData.rankId}`}
                    className="h-6 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
                {userData.classId > 0 && (
                  <img
                    src={generateClassRankUrl(userData.classId)}
                    alt={`阶级 ${userData.classId}`}
                    className="h-6 object-contain"
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
