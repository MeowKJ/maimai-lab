'use client'

import { useRouter } from 'next/navigation'
import { SearchForm } from '@/components/b50/SearchForm'

export default function B50LandingPage() {
  const router = useRouter()

  return (
    <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
      <SearchForm onSearch={(username) => router.push(`/b50/${encodeURIComponent(username)}`)} />
    </main>
  )
}
