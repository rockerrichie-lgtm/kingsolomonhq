import { NextRequest, NextResponse } from 'next/server'

const VERDICT_SYSTEM_PROMPT = `You are Solomon's Verdict engine — a senior brand strategy consultant writing data-grounded CX audit verdicts for CMOs and brand leaders.

RULES:
- Every statement must be tied to a specific number from the data provided
- Never invent statistics, percentages, or benchmarks not in the data
- Never use hedging language: "appears to", "seems like", "possibly", "may suggest"
- Never use superlatives: "amazing", "terrible", "incredible"
- Consultative tone — direct, commercial, actionable
- No em dashes anywhere
- Active voice only
- Maximum 2 sentences per theme verdict
- Maximum 3 sentences for overall verdict

FOR EACH THEME VERDICT (2 sentences):
Sentence 1: What the signal data shows + the business consequence category it creates
Sentence 2: The single highest-priority action for this theme within a specific time horizon

FOR OVERALL VERDICT (3 sentences):
Sentence 1: The single biggest CX risk and which theme is driving it
Sentence 2: The single biggest CX strength and which theme is driving it  
Sentence 3: The one intervention with highest commercial ROI potential

Respond ONLY with valid JSON in this exact format:
{
  "theme_verdicts": {
    "Product": "Signal: [what data shows]. Action: [specific action + time horizon].",
    "Experience": "Signal: [what data shows]. Action: [specific action + time horizon].",
    "Customer Service": "Signal: [what data shows]. Action: [specific action + time horizon].",
    "Pricing": "Signal: [what data shows]. Action: [specific action + time horizon].",
    "Collections": "Signal: [what data shows]. Action: [specific action + time horizon]."
  },
  "overall_verdict": "Risk: [biggest risk + theme]. Strength: [biggest strength + theme]. Priority: [highest ROI intervention]."
}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { audit, themes, brand_name, benchmark } = body

    if (!audit || !themes || !brand_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build context for AI
    const totalSignals = themes.reduce((sum: number, t: any) => sum + (t.signal_count || 0), 0)
    const totalNeg = themes.reduce((sum: number, t: any) => sum + (t.negative_signal_count || 0), 0)

    const themeContext = themes.map((t: any) => {
      const negPct = totalNeg > 0 ? Math.round((t.negative_signal_count || 0) / totalNeg * 100) : 0
      return `${t.theme}:
  NPS: ${t.nps_score} vs benchmark ${benchmark}
  Signals: ${t.signal_count} total (${t.positive_signal_count || 0} positive, ${t.negative_signal_count || 0} negative)
  Contribution to overall negative: ${negPct}% of all negative signals
  Sentiment: ${t.sentiment}
  Top negative keywords: ${t.negative_keywords || 'none'}
  Top positive keywords: ${t.positive_keywords || 'none'}
  Dropout rate: ${t.dropout_rate}%`
    }).join('\n\n')

    const userPrompt = `Brand: ${brand_name}
Overall CX NPS: ${audit.overall_cx_nps} vs benchmark ${benchmark}
Total signals: ${totalSignals} (${totalNeg} negative)
Category type: ${audit.category_type}

THEME DATA:
${themeContext}

Generate verdicts for each theme and an overall verdict. Follow the format exactly.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: VERDICT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON response
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ success: true, verdicts: parsed })
  } catch (error) {
    console.error('Verdict generation error:', error)
    return NextResponse.json({ error: 'Failed to generate verdict' }, { status: 500 })
  }
}