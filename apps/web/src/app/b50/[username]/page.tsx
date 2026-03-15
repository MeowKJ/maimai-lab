'use client'

import { use, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, Download } from 'lucide-react'
import { useB50Data } from '@/hooks/useB50Data'
import { SearchForm } from '@/components/b50/SearchForm'
import { UserCard } from '@/components/b50/UserCard'
import { SongGrid } from '@/components/b50/SongGrid'
import { StatsPanel } from '@/components/b50/StatsPanel'
import { captureElement } from '@/lib/capture'
import { ApiError } from '@/lib/api/errors'
import { isValidNumber } from '@/lib/api/dataProvider'

export default function B50Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const decodedUsername = decodeURIComponent(username)
  const router = useRouter()
  const captureRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, isError, error } = useB50Data(decodedUsername)

  const providerText = useMemo(() => {
    return isValidNumber(decodedUsername)
      ? '落雪咖啡屋 (lxns.net)'
      : '水鱼查分器 (diving-fish.com)'
  }, [decodedUsername])

  const errorText = useMemo(() => {
    if (!isError) return null
    if (error instanceof ApiError) {
      if (error.code === 'NOT_FOUND') {
        return `未找到用户 ${decodedUsername}（来源：${providerText}）`
      }
      if (error.code === 'UNAUTHORIZED' || error.code === 'CONFIG') {
        return '服务端未配置或无权访问该数据源'
      }
      if (error.code === 'RATE_LIMITED') {
        return '请求过于频繁，请稍后再试'
      }
      if (error.code === 'NETWORK') {
        return '网络连接失败，请稍后再试'
      }
      return error.message || '查询失败'
    }
    return '查询失败'
  }, [decodedUsername, error, isError, providerText])

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
            <p className="text-muted-foreground text-sm text-center max-w-[520px]">
              {errorText ?? `未找到用户 ${decodedUsername}`}
              {error instanceof ApiError && error.status ? (
                <span className="block mt-1 text-xs text-muted-foreground/70">
                  {error.provider.toUpperCase()} HTTP {error.status}
                </span>
              ) : null}
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

        {/* No data but not error (should be rare) */}
        {!data && !isLoading && !isError && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-3"
          >
            <AlertCircle className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-foreground font-medium">暂无数据</p>
            <p className="text-muted-foreground text-sm">
              请输入正确的用户名或 QQ 号进行查询
            </p>
            <button
              onClick={() => router.push('/b50')}
              className="flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft size={14} /> 返回搜索
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
