'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const EMOJIS = ['🍝', '🥗', '🍕', '🍜', '🥩', '🥞', '🍣', '🍰', '🥘', '🌮', '🍛', '🥦', '🍲', '🍵', '🫙', '🍋']
const CATEGORIES = ['dinner', 'breakfast', 'lunch', 'dessert', 'vegetarian', 'snack']

export default function AddRecipePage() {
  const router = useRouter()
  const [emoji, setEmoji] = useState('🍝')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('dinner')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('4')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [ingredients, setIngredients] = useState([{ qty: '', name: '' }, { qty: '', name: '' }])
  const [steps, setSteps] = useState(['', ''])
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!title) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data, error: err } = await supabase.from('recipes').insert({
      user_id: user.id,
      title,
      description,
      emoji,
      category,
      cook_time_minutes: parseInt(cookTime) || null,
      servings: parseInt(servings) || 4,
      calories_per_serving: parseInt(calories) || null,
      protein_g: parseFloat(protein) || null,
      carbs_g: parseFloat(carbs) || null,
      fat_g: parseFloat(fat) || null,
      ingredients: ingredients.filter(i => i.name),
      steps: steps.filter(s => s).map(s => ({ step: s })),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      is_public: true,
    }).select().single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push(`/recipes/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Add a recipe</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        {/* Emoji */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Cover icon</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`text-2xl p-1.5 rounded-lg border-2 transition-colors ${emoji === e ? 'border-orange-400 bg-orange-50' : 'border-transparent hover:border-gray-200'}`}
              >{e}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Recipe name *</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="e.g. Creamy Tuscan Pasta" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
          <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 min-h-20 resize-y" placeholder="What makes this recipe special?" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white capitalize" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Cook time (min)</label>
            <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="30" value={cookTime} onChange={e => setCookTime(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Servings</label>
            <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="4" value={servings} onChange={e => setServings(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Calories</label>
            <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="450" value={calories} onChange={e => setCalories(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Protein (g)</label>
            <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="25" value={protein} onChange={e => setProtein(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Fat (g)</label>
            <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="15" value={fat} onChange={e => setFat(e.target.value)} />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input className="w-20 flex-none border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-400" placeholder="Qty" value={ing.qty} onChange={e => { const n = [...ingredients]; n[i].qty = e.target.value; setIngredients(n) }} />
                <input className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-400" placeholder="Ingredient" value={ing.name} onChange={e => { const n = [...ingredients]; n[i].name = e.target.value; setIngredients(n) }} />
                <button onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setIngredients([...ingredients, { qty: '', name: '' }])} className="mt-2 w-full border border-dashed border-gray-200 rounded-lg py-2 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-600 transition-colors flex items-center justify-center gap-1">
            <Plus size={14} /> Add ingredient
          </button>
        </div>

        {/* Steps */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Steps</label>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-none mt-2">{i + 1}</div>
                <input className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-400" placeholder={`Step ${i + 1}…`} value={step} onChange={e => { const n = [...steps]; n[i] = e.target.value; setSteps(n) }} />
                <button onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors mt-2"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setSteps([...steps, ''])} className="mt-2 w-full border border-dashed border-gray-200 rounded-lg py-2 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-600 transition-colors flex items-center justify-center gap-1">
            <Plus size={14} /> Add step
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Tags (comma-separated)</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Italian, quick, pasta" value={tags} onChange={e => setTags(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!title || loading}
          className="w-full bg-orange-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Publish Recipe 🚀
        </button>
      </div>
    </div>
  )
}
