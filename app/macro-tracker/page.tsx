'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MacroLog, MacroTargets } from '@/types'
import { Camera, Plus, Trash2, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const DEFAULT_TARGETS: MacroTargets = {
  user_id: '',
  calories: 2000,
  protein_g: 100,
  carbs_g: 250,
  fat_g: 65,
  fiber_g: 25,
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: '#C84B2F',
  lunch: '#185FA5',
  dinner: '#3B6D11',
  snack: '#BA7517',
}

export default function MacroTrackerPage() {
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<MacroLog[]>([])
  const [targets, setTargets] = useState<MacroTargets>(DEFAULT_TARGETS)
  const [today] = useState(new Date().toISOString().split('T')[0])

  // Photo analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // Manual log form
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        fetchLogs(data.user.id)
        fetchTargets(data.user.id)
      }
    })
  }, [])

  async function fetchLogs(userId: string) {
    const { data } = await supabase
      .from('macro_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_at', today)
      .order('created_at', { ascending: true })
    setLogs((data as MacroLog[]) || [])
  }

  async function fetchTargets(userId: string) {
    const { data } = await supabase.from('macro_targets').select('*').eq('user_id', userId).single()
    if (data) setTargets(data as MacroTargets)
  }

  // Totals
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein_g: acc.protein_g + log.protein_g,
      carbs_g: acc.carbs_g + log.carbs_g,
      fat_g: acc.fat_g + log.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  async function analyzePhoto(file: File) {
    setAnalyzing(true)
    setAnalysisError('')
    setAnalysisResult(null)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      const form = new FormData()
      form.append('image', file)

      const res = await fetch('/api/analyze-macros', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysisResult(data)
      // Pre-fill the form
      setFoodName(data.food_name)
      setCalories(String(data.calories))
      setProtein(String(data.protein_g))
      setCarbs(String(data.carbs_g))
      setFat(String(data.fat_g))
    } catch (err: any) {
      setAnalysisError(err.message || 'Could not analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  async function logFood() {
    if (!user || !foodName || !calories) return

    const entry = {
      user_id: user.id,
      logged_at: today,
      food_name: foodName,
      calories: parseInt(calories),
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
      meal_type: mealType,
    }

    const { data } = await supabase.from('macro_logs').insert(entry).select().single()
    if (data) {
      setLogs(prev => [...prev, data as MacroLog])
      setFoodName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
      setAnalysisResult(null)
      setPreviewUrl('')
    }
  }

  async function deleteLog(id: string) {
    await supabase.from('macro_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  async function saveTargets() {
    if (!user) return
    await supabase.from('macro_targets').upsert({ ...targets, user_id: user.id })
  }

  const pct = (val: number, max: number) => Math.min(100, Math.round((val / max) * 100))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
        Macro Tracker
      </h1>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-medium text-gray-800">Today's summary</div>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Calories', val: Math.round(totals.calories), max: targets.calories, unit: 'kcal', color: '#C84B2F' },
            { label: 'Protein', val: Math.round(totals.protein_g), max: targets.protein_g, unit: 'g', color: '#185FA5' },
            { label: 'Carbs', val: Math.round(totals.carbs_g), max: targets.carbs_g, unit: 'g', color: '#639922' },
            { label: 'Fat', val: Math.round(totals.fat_g), max: targets.fat_g, unit: 'g', color: '#BA7517' },
          ].map(({ label, val, max, unit, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-xl font-semibold text-gray-900">{val}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span></div>
              <div className="text-xs text-gray-400 mb-2">{label} / {max}{unit}</div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct(val, max)}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Photo Analysis */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={18} className="text-orange-600" />
          <h2 className="font-semibold text-gray-800">AI Photo Analysis</h2>
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium ml-auto">Pro feature</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Take a photo or upload an image of your food — AI will estimate the macros automatically.
        </p>

        <div className="flex gap-3 mb-4">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => e.target.files?.[0] && analyzePhoto(e.target.files[0])}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && analyzePhoto(e.target.files[0])}
          />
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            <Camera size={15} /> Take Photo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Upload size={15} /> Upload Image
          </button>
        </div>

        {previewUrl && (
          <div className="mb-4">
            <img src={previewUrl} alt="Food preview" className="w-full max-h-52 object-cover rounded-xl border border-gray-200" />
          </div>
        )}

        {analyzing && (
          <div className="flex items-center gap-3 py-4 text-gray-500 text-sm">
            <Loader2 size={18} className="animate-spin text-orange-600" />
            Analyzing your food photo…
          </div>
        )}

        {analysisError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3 mb-4">
            <AlertCircle size={15} /> {analysisError}
          </div>
        )}

        {analysisResult && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={15} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {analysisResult.food_name} — {analysisResult.serving_size}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ml-auto font-medium ${
                analysisResult.confidence === 'high' ? 'bg-green-100 text-green-700' :
                analysisResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {analysisResult.confidence} confidence
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div><div className="font-semibold text-gray-900">{analysisResult.calories}</div><div className="text-xs text-gray-400">kcal</div></div>
              <div><div className="font-semibold text-gray-900">{analysisResult.protein_g}g</div><div className="text-xs text-gray-400">protein</div></div>
              <div><div className="font-semibold text-gray-900">{analysisResult.carbs_g}g</div><div className="text-xs text-gray-400">carbs</div></div>
              <div><div className="font-semibold text-gray-900">{analysisResult.fat_g}g</div><div className="text-xs text-gray-400">fat</div></div>
            </div>
            {analysisResult.notes && <p className="text-xs text-gray-500 mt-2">{analysisResult.notes}</p>}
          </div>
        )}
      </div>

      {/* Log entry form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Log food</h2>
        <div className="space-y-3">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
            placeholder="Food name"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Calories" type="number" value={calories} onChange={e => setCalories(e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Protein (g)" type="number" value={protein} onChange={e => setProtein(e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Carbs (g)" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Fat (g)" type="number" value={fat} onChange={e => setFat(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white"
              value={mealType}
              onChange={e => setMealType(e.target.value as any)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
            <button
              onClick={logFood}
              disabled={!foodName || !calories}
              className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
            >
              <Plus size={15} /> Log
            </button>
          </div>
        </div>
      </div>

      {/* Today's log */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Today's log</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No food logged yet today. Take a photo to get started!</p>
        ) : (
          <div className="space-y-1">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 group">
                <div className="w-2 h-2 rounded-full flex-none" style={{ background: MEAL_COLORS[log.meal_type || 'snack'] || '#888' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{log.food_name}</div>
                  <div className="text-xs text-gray-400">{log.meal_type} · P: {log.protein_g}g · C: {log.carbs_g}g · F: {log.fat_g}g</div>
                </div>
                <div className="text-sm font-medium text-gray-700 flex-none">{log.calories} kcal</div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Targets */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Daily targets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Calories', key: 'calories', unit: 'kcal' },
            { label: 'Protein', key: 'protein_g', unit: 'g' },
            { label: 'Carbs', key: 'carbs_g', unit: 'g' },
            { label: 'Fat', key: 'fat_g', unit: 'g' },
          ].map(({ label, key, unit }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label} ({unit})</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                value={(targets as any)[key]}
                onChange={e => setTargets(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
              />
            </div>
          ))}
        </div>
        <button onClick={saveTargets} className="mt-4 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          Save targets
        </button>
      </div>
    </div>
  )
}
