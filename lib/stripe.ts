import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '10 saved recipes',
      'Basic macro tracking',
      'Community browsing',
    ],
    limits: { savedRecipes: 10, mealPlanner: false, aiMacros: false },
  },
  pro: {
    name: 'Pro',
    price: 7,
    priceId: process.env.STRIPE_PRICE_PRO,
    features: [
      'Unlimited saved recipes',
      'Advanced macro tracking',
      'AI photo macro analysis',
      'Full meal planner',
      'Shopping list export',
    ],
    limits: { savedRecipes: Infinity, mealPlanner: true, aiMacros: true },
  },
  family: {
    name: 'Family',
    price: 14,
    priceId: process.env.STRIPE_PRICE_FAMILY,
    features: [
      'Everything in Pro',
      'Up to 5 profiles',
      'Shared meal planner',
      'Family grocery lists',
      'Priority support',
    ],
    limits: { savedRecipes: Infinity, mealPlanner: true, aiMacros: true },
  },
}
