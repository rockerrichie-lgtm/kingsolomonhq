import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer re_dsu3i1yc_LB44DyLXJew9ZdeFbQhf6fWP`
      },
      body: JSON.stringify({
        from: 'King Solomon <hello@kingsolomonhq.com>',
        to: [email],
        subject: "You're on the King Solomon waitlist 👑",
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#0F2318;color:#F5F0E8;padding:48px 40px;border-radius:12px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C9A84C;margin:16px 0 8px;letter-spacing:0.05em;">KING SOLOMON</h1>
              <p style="font-size:13px;color:#8FA897;margin:0;letter-spacing:0.1em;text-transform:uppercase;">Consumer intelligence that tells you why.</p>
            </div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;" />
            <h2 style="font-size:22px;font-weight:600;color:#F5F0E8;margin:0 0 16px;">You're on the list.</h2>
            <p style="font-size:15px;color:#C8C2B6;line-height:1.7;margin:0 0 16px;">Thank you for joining the King Solomon waitlist. You're among the first to know when we launch.</p>
            <p style="font-size:15px;color:#C8C2B6;line-height:1.7;margin:0 0 24px;">As an early member, you'll get <strong style="color:#C9A84C;">50% off your first year</strong> — locked in for life.</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;" />
            <p style="font-size:12px;color:rgba(197,194,186,0.4);margin:0;text-align:center;">King Solomon · kingsolomonhq.com · Bengaluru, India</p>
          </div>
        `
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}