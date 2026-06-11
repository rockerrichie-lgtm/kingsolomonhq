export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

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
              <p style="font-size:32px;margin:0;">👑</p>
              <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C9A84C;margin:16px 0 8px;letter-spacing:0.05em;">KING SOLOMON</h1>
              <p style="font-size:13px;color:#8FA897;margin:0;letter-spacing:0.1em;text-transform:uppercase;">Consumer intelligence that tells you why.</p>
            </div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;" />
            <h2 style="font-size:22px;font-weight:600;color:#F5F0E8;margin:0 0 16px;">You're on the list.</h2>
            <p style="font-size:15px;color:#C8C2B6;line-height:1.7;margin:0 0 16px;">Thank you for joining the King Solomon waitlist. You're among the first to know when we launch.</p>
            <p style="font-size:15px;color:#C8C2B6;line-height:1.7;margin:0 0 24px;">As an early member, you'll get <strong style="color:#C9A84C;">50% off your first year</strong> — locked in for life.</p>
            <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:20px 24px;margin:0 0 24px;">
              <p style="font-size:13px;color:#C9A84C;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">What King Solomon does</p>
              <p style="font-size:14px;color:#C8C2B6;line-height:1.6;margin:0;">Real-time brand intelligence that connects your media investment to Awareness, Consideration, Usage, Imagery and Buzz — with a plain-language verdict on what to do next.</p>
            </div>
            <p style="font-size:14px;color:#C8C2B6;line-height:1.7;margin:0 0 32px;">We'll be in touch soon with early access details. If you have a brand tracking question or want to talk about your brand's health — just reply to this email.</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 24px;" />
            <p style="font-size:12px;color:rgba(197,194,186,0.4);margin:0;text-align:center;">King Solomon · kingsolomonhq.com · Bengaluru, India</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
