'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'
import { Check, X, Loader2 } from 'lucide-react'

export default function PricingPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase.from('profiles').select('plan').eq('id', data.user.id).single()
          .then(({ data: p }) => setProfile(p))
      }
    })
  }, [])

  async function handleUpgrade(plan: 'pro' | 'family') {
    if (!user) {
      window.location.href = '/auth'
      return
    }

    const priceId = PLANS[plan].priceId
    if (!priceId) {
      alert('Price ID not configured. Add STRIPE_PRICE_PRO or STRIPE_PRICE_FAMILY to your .env.local')
      return
    }

    setLoading(plan)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ priceId, plan }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(null)
    }
  }

  const currentPlan = profile?.plan || 'free'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Choose a plan
        </h1>
        <p className="text-gray-500">Start free, upgrade when you're ready.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Free */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium mb-4">Free</div>
          <div className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            $0 <span className="text-base font-normal text-gray-400">/ mo</span>
          </div>
          <p className="text-sm text-gray-500 mb-5">Perfect for casual home cooks getting started.</p>
          <ul className="space-y-2 mb-6">
            {[
              { t: '10 saved recipes', ok: true },
              { t: 'Basic macro tracking', ok: true },
              { t: 'Community browsing', ok: true },
              { t: 'Meal planner', ok: false },
              { t: 'AI photo macro analysis', ok: false },
              { t: 'Shopping lists', ok: false },
            ].map(({ t, ok }) => (
              <li key={t} className="flex items-center gap-2 text-sm text-gray-500">
                {ok ? <Check size={14} className="text-orange-600 flex-none" /> : <X size={14} className="text-gray-300 flex-none" />}
                {t}
              </li>
            ))}
          </ul>
          <button
            disabled={currentPlan === 'free'}
            className="w-full border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {currentPlan === 'free' ? 'Current plan' : 'Downgrade'}
          </button>
        </div>

        {/* Pro */}
        <div className="bg-white border-2 border-orange-400 rounded-2xl p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most popular</span>
          </div>
          <div className="inline-block bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium mb-4">Pro</div>
          <div className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            $7 <span className="text-base font-normal text-gray-400">/ mo</span>
          </div>
          <p className="text-sm text-gray-500 mb-5">For serious home cooks who want the full experience.</p>
          <ul className="space-y-2 mb-6">
            {[
              'Unlimited saved recipes',
              'Advanced macro tracking',
              'AI photo macro analysis',
              'Full meal planner',
              'Shopping list export',
            ].map(t => (
              <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={14} className="text-orange-600 flex-none" /> {t}
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm text-gray-400">
              <X size={14} className="text-gray-300 flex-none" /> Team collaboration
            </li>
          </ul>
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={currentPlan === 'pro' || !!loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'pro' ? <Loader2 size={15} className="animate-spin" /> : null}
            {currentPlan === 'pro' ? 'Current plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Family */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium mb-4">Family</div>
          <div className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            $14 <span className="text-base font-normal text-gray-400">/ mo</span>
          </div>
          <p className="text-sm text-gray-500 mb-5">Share the kitchen with up to 5 family members.</p>
          <ul className="space-y-2 mb-6">
            {[
              'Everything in Pro',
              'Up to 5 profiles',
              'Shared meal planner',
              'Family grocery lists',
              'Priority support',
            ].map(t => (
              <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={14} className="text-orange-600 flex-none" /> {t}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleUpgrade('family')}
            disabled={currentPlan === 'family' || !!loading}
            className="w-full border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'family' ? <Loader2 size={15} className="animate-spin" /> : null}
            {currentPlan === 'family' ? 'Current plan' : 'Get Family'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        Payments are processed securely by Stripe. Cancel anytime from your profile.
      </p>
    </div>
  )
}
