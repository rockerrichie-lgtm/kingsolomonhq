import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLANS: Record<string, {
  name: string
  product: string
  billing_cycle: string
  amount_inr: number
  amount_usd: number
  label: string
}> = {
  insight_iq:  { name: 'Insight', product: 'iq',  billing_cycle: 'one_time',  amount_inr: 5690000,  amount_usd: 59900,  label: "Solomons IQ - Insight report" },
  growth_iq:   { name: 'Growth',  product: 'iq',  billing_cycle: 'biannual',  amount_inr: 34190000, amount_usd: 359900, label: "Solomons IQ - Growth - 6-month tracking" },
  command_iq:  { name: 'Command', product: 'iq',  billing_cycle: 'quarterly', amount_inr: 26590000, amount_usd: 279900, label: "Solomons IQ - Command - Quarterly reports" },
  insight_eye: { name: 'Insight', product: 'eye', billing_cycle: 'one_time',  amount_inr: 14240000, amount_usd: 149900, label: "Solomons Eye - Insight CX audit" },
  growth_eye:  { name: 'Growth',  product: 'eye', billing_cycle: 'biannual',  amount_inr: 56990000, amount_usd: 599900, label: "Solomons Eye - Growth - 2 audits" },
  command_eye: { name: 'Command', product: 'eye', billing_cycle: 'quarterly', amount_inr: 47490000, amount_usd: 499900, label: "Solomons Eye - Command - Quarterly audits" },
}

export async function POST(req: NextRequest) {
  try {
    const { plan_key, email, user_id, currency = 'INR' } = await req.json()

    const plan = PLANS[plan_key]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!email || !user_id) {
      return NextResponse.json({ error: 'Email and user ID required' }, { status: 400 })
    }

    const amount = currency === 'INR' ? plan.amount_inr : plan.amount_usd

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency,
      receipt: `ks_${user_id.slice(0, 8)}_${Date.now()}`,
      notes: {
        plan_key,
        plan_name: plan.name,
        product: plan.product,
        user_id,
        email,
      }
    })

    await supabase.from('orders').insert({
      user_id,
      email,
      plan_name: plan_key,
      product: plan.product,
      amount_usd: plan.amount_usd / 100,
      amount_inr: plan.amount_inr / 100,
      currency,
      razorpay_order_id: razorpayOrder.id,
      billing_cycle: plan.billing_cycle,
      status: 'pending',
      metadata: { plan_label: plan.label }
    })

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan_label: plan.label,
    })

  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}