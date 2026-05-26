import { Suspense } from 'react'
import dynamic from 'next/dynamic'

export const dynamic_export = 'force-dynamic'

const ProfileClient = dynamic(() => import('./ProfileClient'), { ssr: false })

export default function ProfilePage() {
  return <ProfileClient />
}
