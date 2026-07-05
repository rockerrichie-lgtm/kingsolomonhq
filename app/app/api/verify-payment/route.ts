import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      await supabase.from('orders').update({ status: 'failed' }).eq('razorpay_order_id', razorpay_order_id)
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid', razorpay_payment_id, razorpay_signature })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })

    return NextResponse.json({
      success: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      plan_name: order?.plan_name,
      product: order?.product,
    })

  } catch (err) {
    console.error('Verify payment error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}