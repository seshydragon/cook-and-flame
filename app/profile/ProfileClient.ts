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
    if (searchParams.get('upgraded')) alert('🎉 Your plan has been upgraded.')
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setUser(data.user)
      fetchProfile(data.user.id)
    })
  }, [])

  async function fetchProfile(userId: string) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (p) { setProfile(p as Profile); setDisplayName(p.display_name || ''); setBio(p.bio || '') }
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 size={24} className="animate-spin text-orange-600" /></div>

  const PLAN_COLORS: Record<string, string> = { free: 'bg-gray-100 text-gray-600', pro: 'bg-orange-50 text-orange-700', family: 'bg-purple-50 text-purple-700' }

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
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[profile?.plan || 'free']}`}>{profile?.plan || 'free'}</span>
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
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 border border-gray-200 px-3 py-1.5 rounded-lg">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {(['saved', 'my', 'settings'] as const).map(id => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === id ? 'border-orange-500 text-orange-700 font-medium' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {id === 'my' ? 'My Recipes' : id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'saved' && (savedRecipes.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-3">🔖</div><p>No saved recipes. <Link href="/" className="text-orange-600 underline">Browse</Link></p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {savedRecipes.map(r => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:-translate-y-0.5 transition-transform">
              <div className="h-20 bg-orange-50 flex items-center justify-center text-4xl">{r.emoji}</div>
              <div className="p-2.5 text-sm font-medium text-gray-800 truncate">{r.title}</div>
            </Link>
          ))}
        </div>
      ))}

      {tab === 'my' && (myRecipes.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-3">🍳</div><p>No recipes yet. <Link href="/add" className="text-orange-600 underline">Add one!</Link></p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {myRecipes.map(r => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:-translate-y-0.5 transition-transform">
              <div className="h-20 bg-orange-50 flex items-center justify-center text-4xl">{r.emoji}</div>
              <div className="p-2.5 text-sm font-medium text-gray-800 truncate">{r.title}</div>
            </Link>
          ))}
        </div>
      ))}

      {tab === 'settings' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Display name</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Bio</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 min-h-20 resize-y" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-400 bg-gray-50" value={user?.email} disabled />
          </div>
          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />} Save changes
          </button>
        </div>
      )}
    </div>
  )
}
