'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Flame, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <Flame size={24} className="text-orange-600" />
          <span className="text-xl font-bold text-orange-700" style={{ fontFamily: 'Georgia, serif' }}>Cook &amp; Flame</span>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-3">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full mt-4 bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  )
}
