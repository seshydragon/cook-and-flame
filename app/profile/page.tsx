'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [myRecipes, setMyRecipes] = useState<any[]>([])
  const [tab, setTab] = useState('my')
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setUser(data.user)
      supabase.from('recipes').select('*').eq('user_id', data.user.id)
        .then(({ data: r }) => setMyRecipes(r || []))
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (p) { setDisplayName(p.display_name || ''); setBio(p.bio || '') }
          setLoading(false)
        })
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName, bio }).eq('id', user.id)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-700">
          {(displayName || user?.email || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-lg">{displayName || 'Home Cook'}</div>
          <div className="text-sm text-gray-400">{user?.email}</div>
          <div className="text-sm text-gray-500 mt-1">{myRecipes.length} recipes</div>
        </div>
        <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 border border-gray-200 px-3 py-1.5 rounded-lg">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {['my', 'settings'].map(id => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === id ? 'border-orange-500 text-orange-700 font-medium' : 'border-transparent text-gray-400'}`}>
            {id === 'my' ? 'My Recipes' : 'Settings'}
          </button>
        ))}
      </div>

      {tab === 'my' && (
        myRecipes.length === 0
          ? (
            <div className="text-center py-12 text-gray-400">
              <p>No recipes yet. <Link href="/add" className="text-orange-600 underline">Add one!</Link></p>
            </div>
          )
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myRecipes.map(r => (
                <Link key={r.id} href={`/recipes/${r.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:-translate-y-0.5 transition-transform">
                  <div className="h-20 bg-orange-50 flex items-center justify-center text-4xl">{r.emoji}</div>
                  <div className="p-2.5 text-sm font-medium text-gray-800 truncate">{r.title}</div>
                </Link>
              ))}
            </div>
          )
      )}

      {tab === 'settings' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Display name</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Bio</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 min-h-20 resize-y" value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          <button onClick={saveProfile} disabled={saving} className="bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}
