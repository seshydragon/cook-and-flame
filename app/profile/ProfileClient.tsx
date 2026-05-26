
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile, Recipe } from '@/types'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BadgeCheck, LogOut, Loader2 } from 'lucide-react'

export default function ProfileClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [tab, setTab] = useState<'saved' | 'my' | 'settings'>('saved')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setUser(data.user)
      fetchProfile(data.user.id)
    })
  }, [])

  async function fetchProfile(userId: string) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (p) {
      setProfile(p as Profile)
      setDisplayName(p.display_name || '')
      setBio(p.bio || '')
    }
    const { data: saved } = await supabase.from('saved_recipes').select('recipes(*)').eq('user_id', userId)
    setSavedRecipes(saved?.map((s: any) => s.recipes).filter(Boolean) || [])
    const { data: mine } = await supabase.from('recipes').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setMyRecipes((mine as Recipe[]) || [])
    setLoading(false)
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName, bio }).eq('id', user.id)
    setProfile(prev => prev ? { ...prev, display_name: displayName, bio } : prev)
    setSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

 if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin text-orange-600" />
      </div>
    )
  }

  const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    pro: 'bg-orange-50 text-orange-700',
    family: 'bg-purple-50 text-purple-700'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-700 flex-none">
            {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile?.display_name || 'Home Cook'}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[profile?.plan || 'free']}`}>
                {profile?.plan || 'free'}
              </span>
              {profile?.plan !== 'free' && <BadgeCheck size={16} className="text-orange-600" />}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            {profile?.bio && <p className="text-sm text-gray-600 mt-1.5">{profile.bio}</p>}
            <div className="flex gap-5 mt-3">
              {[{ val: myRecipes.length, label: 'Recipes' }, { val: savedRecipes.length, label: 'Saved' }].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{val}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div
