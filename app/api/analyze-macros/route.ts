import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Analyze this food image and estimate its nutritional content. 
              
              Return ONLY valid JSON (no markdown, no explanation) in this exact format:
              {
                "food_name": "name of the food/dish",
                "serving_size": "estimated portion size (e.g. 1 cup, 200g, 1 plate)",
                "calories": number,
                "protein_g": number,
                "carbs_g": number,
                "fat_g": number,
                "fiber_g": number,
                "confidence": "high" | "medium" | "low",
                "notes": "any relevant notes about the estimate"
              }
              
              Be as accurate as possible based on visual cues like portion size, visible ingredients, and cooking method. If you cannot identify the food, set confidence to "low".`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Parse JSON from response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(cleaned)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Macro analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    )
  }
}

export const config = { api: { bodyParser: false } }
