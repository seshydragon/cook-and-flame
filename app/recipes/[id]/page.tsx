'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Recipe } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import { Clock, Users, Flame, Star, Heart, Bookmark, ArrowLeft, Share2 } from 'lucide-react'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchRecipe()
  }, [id])

  async function fetchRecipe() {
    const { data } = await supabase
      .from('recipes')
      .select('*, profiles(display_name, avatar_url)')
      .eq('id', id)
      .single()
    setRecipe(data as Recipe)
    setLoading(false)
  }

  async function toggleLike() {
    if (!user) { router.push('/auth'); return }
    if (liked) {
      await supabase.from('recipe_likes').delete().eq('user_id', user.id).eq('recipe_id', id)
      await supabase.from('recipes').update({ likes_count: (recipe?.likes_count || 1) - 1 }).eq('id', id)
      setRecipe(r => r ? { ...r, likes_count: r.likes_count - 1 } : r)
    } else {
      await supabase.from('recipe_likes').insert({ user_id: user.id, recipe_id: id })
      await supabase.from('recipes').update({ likes_count: (recipe?.likes_count || 0) + 1 }).eq('id', id)
      setRecipe(r => r ? { ...r, likes_count: r.likes_count + 1 } : r)
    }
    setLiked(!liked)
  }

  async function toggleSave() {
    if (!user) { router.push('/auth'); return }
    if (saved) {
      await supabase.from('saved_recipes').delete().eq('user_id', user.id).eq('recipe_id', id)
    } else {
      await supabase.from('saved_recipes').insert({ user_id: user.id, recipe_id: id })
    }
    setSaved(!saved)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-32 bg-gray-100 rounded-2xl" />
    </div>
  )

  if (!recipe) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
      <div className="text-5xl mb-4">🍽️</div>
      <p>Recipe not found.</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-600 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-5 mb-4">
          <div className="text-6xl flex-none">{recipe.emoji}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>{recipe.title}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-orange-50 text-orange-700 text-xs px-2.5 py-0.5 rounded-full font-medium capitalize">{recipe.category}</span>
              {recipe.tags?.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-2.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {recipe.cook_time_minutes && <span className="flex items-center gap-1"><Clock size={14} /> {recipe.cook_time_minutes} min</span>}
              <span className="flex items-center gap-1"><Users size={14} /> {recipe.servings} servings</span>
              {recipe.calories_per_serving && <span className="flex items-center gap-1"><Flame size={14} /> {recipe.calories_per_serving} kcal</span>}
              <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" /> {recipe.likes_count} likes</span>
            </div>
          </div>
        </div>
        {recipe.description && <p className="text-sm text-gray-500 mb-4">{recipe.description}</p>}
        <div className="flex gap-2">
          <button onClick={toggleLike} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border transition-colors ${liked ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {recipe.likes_count}
          </button>
          <button onClick={toggleSave} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border transition-colors ${saved ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button onClick={() => navigator.share?.({ title: recipe.title, url: window.location.href })} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Ingredients + Steps */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-5">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Ingredients</h2>
          <div className="space-y-0">
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-gray-500">{ing.qty}</span>
                <span className="font-medium text-gray-800">{ing.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Method</h2>
          <div className="space-y-4">
            {recipe.steps?.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-none mt-0.5">{i + 1}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nutrition */}
      {(recipe.calories_per_serving || recipe.protein_g) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Nutrition per serving</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', val: recipe.calories_per_serving, unit: 'kcal' },
              { label: 'Protein', val: recipe.protein_g, unit: 'g' },
              { label: 'Carbs', val: recipe.carbs_g, unit: 'g' },
              { label: 'Fat', val: recipe.fat_g, unit: 'g' },
            ].map(({ label, val, unit }) => val ? (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">{val}{unit !== 'kcal' ? unit : ''}</div>
                <div className="text-xs text-gray-400">{label}{unit === 'kcal' ? ' (kcal)' : ''}</div>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  )
}
