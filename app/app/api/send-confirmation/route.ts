import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, name, brand, product } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi,'
  const brandLine = brand ? `<p style="font-size:14px;color:#C8C2B6;line-height:1.75;margin:0 0 16px;">We have noted your interest for <strong style="color:#F5F0E8;">${brand}</strong>${product ? ` and will come prepared with some early signals on ${product}` : ''}.</p>` : ''

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
        subject: "Your King Solomon discovery call — what to expect",
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#0F2318;color:#F5F0E8;padding:48px 40px;border-radius:12px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C9A84C;margin:16px 0 8px;letter-spacing:0.05em;">KING SOLOMON</h1>
              <p style="font-size:13px;color:#8FA897;margin:0;letter-spacing:0.1em;text-transform:uppercase;">Consumer intelligence that tells you why.</p>
            </div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 28px;" />
            <p style="font-size:18px;font-weight:600;color:#F5F0E8;margin:0 0 16px;">${greeting}</p>
            <p style="font-size:14px;color:#C8C2B6;line-height:1.75;margin:0 0 16px;">Thank you for reaching out. We have received your details and will be in touch shortly.</p>
            ${brandLine}
            <p style="font-size:14px;color:#C8C2B6;line-height:1.75;margin:0 0 24px;">If you have not already booked a time, you can <a href="https://calendly.com/hello-kingsolomonhq/30min" style="color:#C9A84C;font-weight:600;text-decoration:none;">pick a slot on Calendly</a>. The call is 30 minutes — we will walk you through what we find about your brand before you spend a rupee.</p>
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
