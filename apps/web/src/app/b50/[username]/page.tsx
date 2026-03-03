'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, Download } from 'lucide-react'
import { useB50Data } from '@/hooks/useB50Data'
import { SearchForm } from '@/components/b50/SearchForm'
import { UserCard } from '@/components/b50/UserCard'
import { SongGrid } from '@/components/b50/SongGrid'
import { StatsPanel } from '@/components/b50/StatsPanel'
import { captureElement } from '@/lib/capture'
import { useRef } from 'react'

export default function B50Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const decodedUsername = decodeURIComponent(username)
  const router = useRouter()
  const captureRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, isError } = useB50Data(decodedUsername)

  return (
    <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Search bar */}
      <div className="relative z-10 flex justify-center">
        <SearchForm
          initialValue={decodedUsername}
          isLoading={isLoading}
          onSearch={(u) => router.push(`/b50/${encodeURIComponent(u)}`)}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <p className="text-muted-foreground text-sm">正在加载 {decodedUsername} 的成绩…</p>
          </motion.div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-3"
          >
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-foreground font-medium">查询失败</p>
            <p className="text-muted-foreground text-sm">
              未找到用户 <strong>{decodedUsername}</strong>，请检查用户名或 QQ 号
            </p>
            <button
              onClick={() => router.push('/b50')}
              className="flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft size={14} /> 重新搜索
            </button>
          </motion.div>
        )}

        {/* Data */}
        {data && !isLoading && (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div ref={captureRef} className="space-y-8">
              <UserCard userData={data.userData} />
              <SongGrid
                b15={data.best50SongsData.b15}
                b35={data.best50SongsData.b35}
              />
              <StatsPanel
                b15={data.best50SongsData.b15}
                b35={data.best50SongsData.b35}
              />
            </div>

            <div className="flex justify-center pb-8">
              <motion.button
                onClick={() =>
                  captureRef.current &&
                  captureElement(captureRef.current, `${decodedUsername}-b50.png`)
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Download size={15} />
                保存截图
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
