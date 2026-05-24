'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, X } from 'lucide-react'
import { MealPlan } from '@/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const

function getWeekStart(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function MealPlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [plan, setPlan] = useState<MealPlan[]>([])
  const [user, setUser] = useState<any>(null)
  const [adding, setAdding] = useState<{ date: string; meal: string } | null>(null)
  const [mealInput, setMealInput] = useState('')
  const [recipes, setRecipes] = useState<any[]>([])

  const weekStart = getWeekStart(weekOffset)
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return fmt(d)
  })
  const today = fmt(new Date())

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchPlan(data.user.id)
    })
    supabase.from('recipes').select('id, title, emoji').limit(20).then(({ data }) => setRecipes(data || []))
  }, [weekOffset])

  async function fetchPlan(userId: string) {
    const { data } = await supabase
      .from('meal_plan')
      .select('*, recipes(title, emoji)')
      .eq('user_id', userId)
      .gte('plan_date', weekDates[0])
      .lte('plan_date', weekDates[6])
    setPlan((data as MealPlan[]) || [])
  }

  function getMeal(date: string, meal: string) {
    return plan.find(p => p.plan_date === date && p.meal_type === meal)
  }

  async function addMeal(date: string, meal: string, name: string) {
    if (!user || !name) return
    const existing = getMeal(date, meal)
    if (existing) {
      await supabase.from('meal_plan').update({ custom_meal_name: name }).eq('id', existing.id)
    } else {
      await supabase.from('meal_plan').insert({ user_id: user.id, plan_date: date, meal_type: meal, custom_meal_name: name })
    }
    setAdding(null)
    setMealInput('')
    fetchPlan(user.id)
  }

  async function removeMeal(id: string) {
    await supabase.from('meal_plan').delete().eq('id', id)
    setPlan(prev => prev.filter(p => p.id !== id))
  }

  const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : weekOffset === 1 ? 'Next week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`

  const totalMeals = plan.length
  const MEAL_COLORS: Record<string, string> = { breakfast: 'bg-orange-50 text-orange-700', lunch: 'bg-blue-50 text-blue-700', dinner: 'bg-green-50 text-green-700' }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"><ChevronLeft size={16} /></button>
        <h1 className="text-xl font-bold text-gray-900 flex-1" style={{ fontFamily: 'Georgia, serif' }}>{weekLabel}</h1>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"><ChevronRight size={16} /></button>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          <ShoppingCart size={14} /> Shopping list
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Meals planned', val: totalMeals },
          { label: 'Days covered', val: weekDates.filter(d => plan.some(p => p.plan_date === d)).length },
          { label: 'Recipes used', val: new Set(plan.map(p => p.custom_meal_name)).size },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-semibold text-gray-900">{val}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const date = weekDates[i]
          const isToday = date === today
          return (
            <div key={day} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className={`px-2 py-2 text-center text-xs font-semibold border-b border-gray-100 ${isToday ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>
                <div>{day}</div>
                <div className={`text-xs font-normal ${isToday ? 'text-orange-100' : 'text-gray-300'}`}>{new Date(date + 'T12:00').getDate()}</div>
              </div>
              <div className="p-1.5 space-y-1.5">
                {MEAL_TYPES.map(meal => {
                  const entry = getMeal(date, meal)
                  return (
                    <div key={meal}>
                      <div className="text-[9px] text-gray-300 uppercase tracking-wide mb-0.5 pl-0.5 capitalize">{meal}</div>
                      {entry ? (
                        <div className={`flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] font-medium group ${MEAL_COLORS[meal]}`}>
                          <span className="flex-1 truncate">{entry.recipes?.emoji} {entry.custom_meal_name || entry.recipes?.title}</span>
                          <button onClick={() => removeMeal(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><X size={9} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAdding({ date, meal }); setMealInput('') }}
                          className="w-full border border-dashed border-gray-200 rounded text-[10px] text-gray-300 py-1 hover:border-orange-300 hover:text-orange-400 transition-colors"
                        >+</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add meal modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4" onClick={() => setAdding(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1 capitalize">{adding.meal}</h3>
            <p className="text-xs text-gray-400 mb-4">{new Date(adding.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 mb-3"
              placeholder="Meal name…"
              value={mealInput}
              onChange={e => setMealInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMeal(adding.date, adding.meal, mealInput)}
            />
            {recipes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Or pick from your recipes:</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {recipes.map(r => (
                    <button key={r.id} onClick={() => addMeal(adding.date, adding.meal, `${r.emoji} ${r.title}`)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                      {r.emoji} {r.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setAdding(null)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => addMeal(adding.date, adding.meal, mealInput)} disabled={!mealInput} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
