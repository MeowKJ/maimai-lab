// All asset URLs route through our own /assets/[...path] Edge Runtime handler
const BASE = '/assets'

export const generateImageUrl = (songId: number) =>
  `${BASE}/cover/${songId}`

export const generateRateUrl = (rate: string) =>
  `${BASE}/rank/${rate}`

export const generateBadgeUrl = (badge: string | null) =>
  `${BASE}/badge/${badge ?? 'blank'}`

export const generatePlateUrl = (plateId: number | null) =>
  `${BASE}/plate/${plateId ?? 0}`

export const generateAvatarUrl = (avatarId: number | null) =>
  `${BASE}/avatar/${avatarId ?? 0}`

export const generateCourseRankUrl = (id: number) =>
  `${BASE}/course_rank/${id}`

export const generateClassRankUrl = (id: number) =>
  `${BASE}/class_rank/${id}`
