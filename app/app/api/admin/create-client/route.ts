import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://alrwyeenxeuxgkcskkes.supabase.co'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = 'KS'
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const resendKey = process.env.RESEND_API_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Server is missing SUPABASE_SERVICE_KEY.' }, { status: 500 })
  }

  // 1. Verify the caller is an admin
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const whoRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: anonKey || '', Authorization: `Bearer ${token}` },
  })
  if (!whoRes.ok) {
    return NextResponse.json({ error: 'Session expired. Sign out and sign in again.' }, { status: 401 })
  }
  const who = await whoRes.json()
  if (who?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  // 2. Read the request
  let body: { email?: string; brand_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  const brandName = (body.brand_name || '').trim()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // 3. Create the account
  const tempPassword = generatePassword()

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: { role: 'client', must_change_password: true },
    }),
  })

  const created = await createRes.json()

  if (!createRes.ok) {
    const detail = created?.msg || created?.message || created?.error_description || 'Could not create the account.'
    const friendly = String(detail).toLowerCase().includes('already')
      ? 'An account with that email already exists.'
      : detail
    return NextResponse.json({ error: friendly }, { status: 400 })
  }

  // 4. Send the welcome email
  let emailSent = false
  let emailError = ''

  if (resendKey) {
    const greeting = brandName ? `Welcome, ${brandName}` : 'Welcome to King Solomon'
    const html = `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#C9A84C;margin-bottom:8px">King Solomon</div>
        <h1 style="font-size:22px;font-weight:700;margin:0 0 16px">${greeting}</h1>
        <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#444;margin:0 0 20px">
          Your account is ready. Sign in with the details below and you will be asked to set your own password straight away.
        </p>
        <div style="background:#FDFAF3;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:18px 20px;margin-bottom:20px;font-family:Arial,sans-serif">
          <div style="font-size:12px;color:#888;margin-bottom:4px">Email</div>
          <div style="font-size:15px;color:#1a1a1a;margin-bottom:14px">${email}</div>
          <div style="font-size:12px;color:#888;margin-bottom:4px">Temporary password</div>
          <div style="font-size:18px;font-family:monospace;color:#1a1a1a;letter-spacing:0.05em">${tempPassword}</div>
        </div>
        <a href="https://kingsolomonhq.com/login" style="display:inline-block;background:#C9A84C;color:#0F2318;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 26px;border-radius:8px;text-decoration:none">Sign in</a>
        <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#888;margin:24px 0 0">
          This password is temporary and will stop working once you set your own. If you did not expect this email, please ignore it.
        </p>
        <div style="border-top:1px solid #f0f0f0;margin-top:24px;padding-top:16px;font-family:Arial,sans-serif;font-size:12px;color:#aaa">
          John Richard, King Solomon<br/>hello@kingsolomonhq.com
        </div>
      </div>
    `

    try {
      const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'King Solomon <hello@kingsolomonhq.com>',
          to: [email],
          subject: 'Your King Solomon account is ready',
          html,
        }),
      })
      const mailData = await mailRes.json()
      emailSent = mailRes.ok
      if (!mailRes.ok) emailError = mailData?.message || 'Resend rejected the message.'
    } catch {
      emailError = 'Could not reach Resend.'
    }
  } else {
    emailError = 'RESEND_API_KEY is not set on the server.'
  }

  return NextResponse.json({
    success: true,
    user_id: created.id,
    email,
    temp_password: tempPassword,
    email_sent: emailSent,
    email_error: emailError,
  })
}