'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Recipe } from '@/types'
import { Search, Clock, Flame, Heart } from 'lucide-react'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Vegetarian']

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [filter, search])

  async function fetchRecipes() {
    setLoading(true)
    let query = supabase
      .from('recipes')
      .select('*, profiles(display_name, avatar_url)')
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .limit(24)

    if (filter !== 'All') query = query.eq('category', filter.toLowerCase())
    if (search) query = query.ilike('title', `%${search}%`)

    const { data } = await query
    setRecipes((data as Recipe[]) || [])
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 flex items-center gap-6">
        <div className="text-6xl">🍳</div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Discover &amp; share<br />culinary creations
          </h1>
          <p className="text-gray-500 mb-4">A vibrant community for home cooks to find inspiration and share recipes.</p>
          <div className="flex gap-3">
            <Link href="/add" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
              + Add Recipe
            </Link>
            <Link href="/meal-planner" className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Plan this week
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
        <Search size={16} className="text-gray-400" />
        <input
          className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
          placeholder="Search recipes, ingredients, cuisines…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === cat
                ? 'bg-orange-600 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        Trending this week 🔥
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-28 bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🍽️</div>
          <p>No recipes found. <Link href="/add" className="text-orange-600 underline">Add the first one!</Link></p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recipes.map(recipe => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:-translate-y-0.5 transition-transform cursor-pointer group"
            >
              <div className="h-28 bg-orange-50 flex items-center justify-center text-5xl group-hover:bg-orange-100 transition-colors">
                {recipe.emoji}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">{recipe.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    {recipe.category}
                  </span>
                  {recipe.cook_time_minutes && (
                    <span className="flex items-center gap-0.5">
                      <Clock size={11} /> {recipe.cook_time_minutes}m
                    </span>
                  )}
                  {recipe.calories_per_serving && (
                    <span className="flex items-center gap-0.5">
                      <Flame size={11} /> {recipe.calories_per_serving}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 ml-auto">
                    <Heart size={11} /> {recipe.likes_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
