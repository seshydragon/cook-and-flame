export interface Profile {
  id: string
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'family'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description?: string
  emoji: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'vegetarian' | 'snack'
  cook_time_minutes?: number
  servings: number
  calories_per_serving?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  is_public: boolean
  likes_count: number
  created_at: string
  profiles?: Profile
  user_has_liked?: boolean
  user_has_saved?: boolean
}

export interface Ingredient {
  qty: string
  name: string
}

export interface Step {
  step: string
}

export interface MacroLog {
  id: string
  user_id: string
  logged_at: string
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  created_at: string
}

export interface MacroTargets {
  user_id: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface MealPlan {
  id: string
  user_id: string
  plan_date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe_id?: string
  custom_meal_name?: string
  recipes?: Recipe
}

export interface MacroAnalysis {
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  serving_size: string
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}
