'use client'
import { useState } from 'react'

const GOLD = '#C9A84C'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#C8C2B6'
const GREEN = '#5fc68a'
const DEEP = '#0F2318'
const GLASS = 'rgba(255,255,255,0.04)'
const GLASS_BORDER = 'rgba(255,255,255,0.08)'

function Dot({ on, color = GOLD }: { on: boolean; color?: string }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      background: on ? color : 'rgba(255,255,255,0.08)',
      border: on ? 'none' : '1px solid rgba(255,255,255,0.12)',
      flexShrink: 0
    }} />
  )
}

function Feature({ text, color = GOLD }: { text: string; color?: string }) {
  return (
    <li style={{ fontSize: 14, color: CREAM_DIM, display: 'flex', gap: 10, lineHeight: 1.6 }}>
      <span style={{ color, flexShrink: 0, marginTop: 2 }}>✦</span>{text}
    </li>
  )
}

function PerReportBox({ label, price, saving, bg, border, labelColor, priceColor, savingColor }: any) {
  return (
    <div style={{ background: bg, border, borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: labelColor, marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: priceColor, lineHeight: 1 }}>
        {price}
      </div>
      <div style={{ fontSize: 12, color: savingColor, marginTop: 4 }}>{saving}</div>
    </div>
  )
}

function IQPricing() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, alignItems: 'stretch' }}>

        {/* INSIGHT */}
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Insight</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$599</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>One-time · single report</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,false,false,false].map((on,i) => <Dot key={i} on={on} />)}
          </div>
          <PerReportBox
            label="You pay per report"
            price="$599"
            saving="1 report delivered"
            bg={GLASS}
            border={`1px solid ${GLASS_BORDER}`}
            labelColor="rgba(197,194,186,0.5)"
            priceColor={CREAM}
            savingColor="rgba(197,194,186,0.4)"
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Full brand health snapshot" />
            <Feature text="All 5 KPIs — Awareness, Consideration, Usage, Imagery, Buzz" />
            <Feature text="Competitor landscape included" />
            <Feature text="Solomon's Verdict narrative" />
            <Feature text="PDF + PPT delivered in 5 days" />
            <Feature text="Upgrade credit toward Growth or Command" />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', color: CREAM, border: `1px solid ${GLASS_BORDER}` }}>
            Get a report
          </a>
        </div>

        {/* GROWTH */}
        <div style={{ background: GLASS, border: `2px solid ${GOLD}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: DEEP, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most popular</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Growth</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$3,599</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Billed every 6 months · 2 reports</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,true,false,false].map((on,i) => <Dot key={i} on={on} />)}
          </div>
          <PerReportBox
            label="You pay per report"
            price="$1,799"
            saving="Saves $400 vs 2 × Insight"
            bg="rgba(201,168,76,0.08)"
            border="1px solid rgba(201,168,76,0.2)"
            labelColor="rgba(201,168,76,0.7)"
            priceColor={GOLD}
            savingColor={GREEN}
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Continuous brand tracking for 6 months" />
            <Feature text="Live dashboard access throughout" />
            <Feature text="Unlimited competitors tracked" />
            <Feature text="Month 3 mid-point Verdict check-in" />
            <Feature text="Month 6 full report — PDF + PPT" />
            <Feature text="Campaign attribution tracking" />
            <Feature text="Real-time Buzz and Awareness alerts" />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: GOLD, color: DEEP }}>
            Start tracking
          </a>
        </div>

        {/* COMMAND */}
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'rgba(95,198,138,0.15)', border: '1px solid rgba(95,198,138,0.3)', color: GREEN, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Best value per report</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Command</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$2,799</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Billed per quarter · 4 reports/year</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,true,true,true].map((on,i) => <Dot key={i} on={on} color={GREEN} />)}
          </div>
          <PerReportBox
            label="You pay per report"
            price="$699"
            saving="Saves $1,597 vs 4 × Insight"
            bg="rgba(95,198,138,0.06)"
            border="1px solid rgba(95,198,138,0.2)"
            labelColor="rgba(95,198,138,0.6)"
            priceColor={GREEN}
            savingColor={GREEN}
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Everything in Growth" color={GREEN} />
            <Feature text="Quarterly reports timed to board cycles" color={GREEN} />
            <Feature text="Unlimited competitors tracked" color={GREEN} />
            <Feature text="Annual brand summary — 5th report, free" color={GREEN} />
            <Feature text="Priority Verdict turnaround — 48 hrs" color={GREEN} />
            <Feature text="Quarterly account review call" color={GREEN} />
            <Feature text="Campaign and media attribution included" color={GREEN} />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', color: CREAM, border: `1px solid ${GLASS_BORDER}` }}>
            Get quarterly reporting
          </a>
        </div>

      </div>

      {/* Per report comparison bar */}
      <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 24px', display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(197,194,186,0.4)' }}>Per-report cost:</span>
        <span style={{ fontSize: 13, color: 'rgba(197,194,186,0.5)' }}>Insight — <strong style={{ color: 'rgba(197,194,186,0.7)' }}>$599</strong></span>
        <span style={{ fontSize: 13, color: GOLD }}>Growth — <strong>$1,799</strong></span>
        <span style={{ fontSize: 13, color: GREEN }}>Command — <strong>$699</strong></span>
        <span style={{ fontSize: 12, color: 'rgba(197,194,186,0.3)' }}>· No brand or competitor limits on any plan</span>
      </div>
    </div>
  )
}

function EyePricing() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 14, color: CREAM_DIM, maxWidth: 580, margin: '0 auto', lineHeight: 1.75 }}>
          A manual CX audit of your brand&apos;s customer experience — app flows, purchase journey, support touchpoints, review landscape — delivered as a screen-recorded walkthrough with expert commentary, plus a full written report.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, alignItems: 'stretch' }}>

        {/* EYE INSIGHT */}
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Insight</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$1,499</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>One-time · single audit</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,false,false,false].map((on,i) => <Dot key={i} on={on} />)}
          </div>
          <PerReportBox
            label="You pay per audit"
            price="$1,499"
            saving="1 full CX audit delivered"
            bg={GLASS}
            border={`1px solid ${GLASS_BORDER}`}
            labelColor="rgba(197,194,186,0.5)"
            priceColor={CREAM}
            savingColor="rgba(197,194,186,0.4)"
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Full CX walkthrough — app, web, purchase flow" />
            <Feature text="Support and review landscape analysis" />
            <Feature text="Screen-recorded audit with expert commentary" />
            <Feature text="Written findings report — PDF + PPT" />
            <Feature text="Top 5 friction points identified" />
            <Feature text="Delivered within 7 business days" />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', color: CREAM, border: `1px solid ${GLASS_BORDER}` }}>
            Book a CX audit
          </a>
        </div>

        {/* EYE GROWTH */}
        <div style={{ background: GLASS, border: `2px solid ${GOLD}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: DEEP, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most popular</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Growth</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$5,999</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Billed every 6 months · 2 audits</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,true,false,false].map((on,i) => <Dot key={i} on={on} />)}
          </div>
          <PerReportBox
            label="You pay per audit"
            price="$2,999"
            saving="Saves $999 vs 2 × Insight"
            bg="rgba(201,168,76,0.08)"
            border="1px solid rgba(201,168,76,0.2)"
            labelColor="rgba(201,168,76,0.7)"
            priceColor={GOLD}
            savingColor={GREEN}
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Two full CX audits across 6 months" />
            <Feature text="Tracks improvement between audit 1 and audit 2" />
            <Feature text="Screen-recorded walkthroughs both times" />
            <Feature text="Competitor CX benchmarking included" />
            <Feature text="Friction point resolution tracking" />
            <Feature text="Before and after comparison report" />
            <Feature text="Priority scheduling — 5 day delivery" />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: GOLD, color: DEEP }}>
            Start CX tracking
          </a>
        </div>

        {/* EYE COMMAND */}
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'rgba(95,198,138,0.15)', border: '1px solid rgba(95,198,138,0.3)', color: GREEN, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Best value per audit</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Command</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$4,999</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Billed per quarter · 4 audits/year</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,true,true,true].map((on,i) => <Dot key={i} on={on} color={GREEN} />)}
          </div>
          <PerReportBox
            label="You pay per audit"
            price="$1,249"
            saving="Saves $3,996 vs 4 × Insight"
            bg="rgba(95,198,138,0.06)"
            border="1px solid rgba(95,198,138,0.2)"
            labelColor="rgba(95,198,138,0.6)"
            priceColor={GREEN}
            savingColor={GREEN}
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Everything in Growth" color={GREEN} />
            <Feature text="Quarterly CX audits timed to business reviews" color={GREEN} />
            <Feature text="Annual CX health summary — 5th audit, free" color={GREEN} />
            <Feature text="Full competitor CX benchmarking each quarter" color={GREEN} />
            <Feature text="Priority scheduling — 48 hr delivery" color={GREEN} />
            <Feature text="Quarterly debrief call with findings" color={GREEN} />
            <Feature text="Action plan with each audit delivery" color={GREEN} />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', color: CREAM, border: `1px solid ${GLASS_BORDER}` }}>
            Get quarterly audits
          </a>
        </div>

      </div>

      {/* Per audit comparison bar */}
      <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 24px', display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(197,194,186,0.4)' }}>Per-audit cost:</span>
        <span style={{ fontSize: 13, color: 'rgba(197,194,186,0.5)' }}>Insight — <strong style={{ color: 'rgba(197,194,186,0.7)' }}>$1,499</strong></span>
        <span style={{ fontSize: 13, color: GOLD }}>Growth — <strong>$2,999</strong></span>
        <span style={{ fontSize: 13, color: GREEN }}>Command — <strong>$1,249</strong></span>
        <span style={{ fontSize: 12, color: 'rgba(197,194,186,0.3)' }}>· Includes screen recording and written report on every audit</span>
      </div>
    </div>
  )
}

function GuidePricing() {
  const PURPLE = '#9F8FEF'
  const PURPLE_BG = 'rgba(159,143,239,0.06)'
  const PURPLE_BORDER = '1px solid rgba(159,143,239,0.2)'
  const PURPLE_DIM = 'rgba(159,143,239,0.6)'

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 14, color: CREAM_DIM, maxWidth: 580, margin: '0 auto', lineHeight: 1.75 }}>
          A personal strategic advisory retainer. John works with you through your entire setup or growth journey — fully embedded, on-call, and invested in your outcome. Billed quarterly with a 3-month minimum.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, alignItems: 'stretch' }}>

        {/* CLARITY */}
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, marginBottom: 12 }}>Clarity</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$2,997</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Per quarter · 3-month minimum</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,false,false].map((on,i) => <Dot key={i} on={on} color={PURPLE} />)}
          </div>
          <PerReportBox
            label="Per session cost"
            price="$500"
            saving="6 sessions per quarter"
            bg={GLASS}
            border={`1px solid ${GLASS_BORDER}`}
            labelColor="rgba(197,194,186,0.5)"
            priceColor={CREAM}
            savingColor="rgba(197,194,186,0.4)"
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="2 structured strategy sessions per month" color={PURPLE} />
            <Feature text="WhatsApp async access between sessions" color={PURPLE} />
            <Feature text="One strategy document per quarter" color={PURPLE} />
            <Feature text="Session notes and action items after every call" color={PURPLE} />
            <Feature text="Brand, growth, or GTM — whatever the priority" color={PURPLE} />
            <Feature text="Auto-renews quarterly" color={PURPLE} />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', color: CREAM, border: `1px solid ${GLASS_BORDER}` }}>
            Start with Clarity
          </a>
        </div>

        {/* GROWTH */}
        <div style={{ background: GLASS, border: `2px solid ${GOLD}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: DEEP, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most popular</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, marginBottom: 12 }}>Growth</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$7,497</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Per quarter · 3-month minimum</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,true,false].map((on,i) => <Dot key={i} on={on} color={PURPLE} />)}
          </div>
          <PerReportBox
            label="Per session cost"
            price="$625"
            saving="12 sessions per quarter + full async"
            bg="rgba(201,168,76,0.08)"
            border="1px solid rgba(201,168,76,0.2)"
            labelColor="rgba(201,168,76,0.7)"
            priceColor={GOLD}
            savingColor={GREEN}
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="4 sessions per month (12 per quarter)" color={PURPLE} />
            <Feature text="Full async — WhatsApp, email, voice notes" color={PURPLE} />
            <Feature text="Monthly strategy review document" color={PURPLE} />
            <Feature text="Campaign, NPD, and brand advisory" color={PURPLE} />
            <Feature text="Deck and document reviews included" color={PURPLE} />
            <Feature text="Pitch decks, briefs, proposals — all covered" color={PURPLE} />
            <Feature text="Auto-renews quarterly" color={PURPLE} />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: GOLD, color: DEEP }}>
            Start with Growth
          </a>
        </div>

        {/* COMMAND */}
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: PURPLE_BG, border: PURPLE_BORDER, color: PURPLE, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Fully embedded</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: GOLD, marginBottom: 12 }}>Command</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 48, fontWeight: 700, color: CREAM, lineHeight: 1, marginBottom: 6 }}>$14,997</div>
          <div style={{ fontSize: 14, color: CREAM_DIM, marginBottom: 24 }}>Per quarter · 3-month minimum</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {[true,true,true].map((on,i) => <Dot key={i} on={on} color={PURPLE} />)}
          </div>
          <PerReportBox
            label="Per session cost"
            price="$1,154"
            saving="13 sessions per quarter · on-call access"
            bg={PURPLE_BG}
            border={PURPLE_BORDER}
            labelColor={PURPLE_DIM}
            priceColor={PURPLE}
            savingColor={GREEN}
          />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
            <Feature text="Weekly sessions — 13 per quarter" color={PURPLE} />
            <Feature text="On-call access · priority response within 4 hours" color={PURPLE} />
            <Feature text="Unlimited strategy documents and reviews" color={PURPLE} />
            <Feature text="Board-level strategy included" color={PURPLE} />
            <Feature text="Direct input on hiring, agency briefs, media" color={PURPLE} />
            <Feature text="Quarterly business review with written output" color={PURPLE} />
            <Feature text="Auto-renews quarterly" color={PURPLE} />
          </ul>
          <a href="/connect" style={{ display: 'block', padding: 13, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', color: CREAM, border: `1px solid ${GLASS_BORDER}` }}>
            Start with Command
          </a>
        </div>

      </div>

      {/* Per session comparison bar */}
      <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 24px', display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(197,194,186,0.4)' }}>Per-session cost:</span>
        <span style={{ fontSize: 13, color: 'rgba(197,194,186,0.5)' }}>Clarity — <strong style={{ color: 'rgba(197,194,186,0.7)' }}>$500</strong></span>
        <span style={{ fontSize: 13, color: GOLD }}>Growth — <strong>$625</strong></span>
        <span style={{ fontSize: 13, color: PURPLE }}>Command — <strong>$1,154</strong></span>
        <span style={{ fontSize: 12, color: 'rgba(197,194,186,0.3)' }}>· Command clients are buying a strategic partner, not sessions</span>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'iq' | 'eye' | 'guide'>('iq')

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0F2318; color: #F5F0E8; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 48px',background:'rgba(15,35,24,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <svg width="28" height="22" viewBox="0 0 56 44" fill="none"><path d="M4 36L12 14L22 26L28 6L34 26L44 14L52 36H4Z" fill="#C9A84C"/><rect x="4" y="36" width="48" height="6" rx="2" fill="#A07830"/></svg>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#F5F0E8',letterSpacing:'0.1em'}}>KING SOLOMON</span>
            <span style={{fontSize:10,color:'#C9A84C',letterSpacing:'0.08em'}}>Consumer intelligence that tells you why.</span>
          </div>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <a href="/" style={{color:CREAM_DIM,fontSize:14,textDecoration:'none'}}>Home</a>
          <a href="/pricing" style={{color:GOLD,fontSize:14,fontWeight:600,textDecoration:'none'}}>Pricing</a>
          <a href="/connect" style={{background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'10px 22px',borderRadius:6,textDecoration:'none'}}>Connect with Us!</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:'140px 24px 60px',textAlign:'center'}}>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:GOLD,marginBottom:20}}>Pricing</p>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(32px,5vw,56px)',fontWeight:800,color:CREAM,lineHeight:1.1,marginBottom:20}}>
          Simple pricing.<br/>Real intelligence.
        </h1>
        <p style={{fontSize:14,fontWeight:300,color:CREAM_DIM,maxWidth:500,margin:'0 auto',lineHeight:1.75}}>
          Start with a single report to see what we find. Stay for the intelligence that keeps your brand ahead.
        </p>
      </section>

      {/* TABS */}
      <section style={{padding:'0 24px 80px',maxWidth:1100,margin:'0 auto'}}>

        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:4,maxWidth:580,margin:'0 auto 48px'}}>
          {([['iq',"Solomon's IQ",'Brand intelligence'],['eye',"Solomon's Eye",'CX audit'],['guide',"Solomon's Guide",'Strategic advisory']] as const).map(([tab, name, sub]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex:1, padding:'10px 12px', borderRadius:8, border:'none', cursor:'pointer',
                background: activeTab === tab ? GOLD : 'transparent',
                color: activeTab === tab ? DEEP : CREAM_DIM,
                fontSize:12, fontWeight:600, transition:'all 0.15s',
                display:'flex', flexDirection:'column', alignItems:'center', gap:2
              }}
            >
              <span>{name}</span>
              <span style={{fontSize:10,fontWeight:400,opacity:0.7}}>{sub}</span>
            </button>
          ))}
        </div>

        {activeTab === 'iq' ? <IQPricing /> : activeTab === 'eye' ? <EyePricing /> : <GuidePricing />}

      </section>

      {/* FAQ */}
      <section style={{padding:'0 24px 100px',maxWidth:720,margin:'0 auto'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:36,fontWeight:700,color:CREAM,marginBottom:40,textAlign:'center'}}>Common questions</h2>
        {(activeTab === 'iq' ? [
          ['What is a report?', "A report is a full brand health analysis — all 5 KPI scores, competitor comparison, Solomon's Verdict narrative, recommended action, and risk flags. Delivered as PDF + PPT."],
          ["What's the difference between Insight and Growth?", 'Insight is a point-in-time snapshot. Growth gives you 6 months of continuous tracking plus two reports — one at month 3 and one at month 6. You see movement, not just a moment.'],
          ['Why is Command cheaper per report than Insight?', 'Four Insight reports would cost $2,396. Command costs $11,196/year and includes live tracking, unlimited competitors, quarterly board-ready reports, and a free annual summary.'],
          ['Do all plans include competitor tracking?', 'Yes. Every plan — including Insight — includes a full competitor landscape. There are no brand or competitor limits on any plan.'],
          ['Can I upgrade from Insight?', 'Yes. After your Insight report is delivered, you can upgrade to Growth or Command and the cost of your Insight report is credited toward your first period.'],
        ] : activeTab === 'eye' ? [
          ['What exactly is a CX audit?', "A full walkthrough of your brand's customer experience — app flows, website, purchase journey, support touchpoints, and review landscape. Delivered as a screen recording with live expert commentary plus a written PDF + PPT report."],
          ['Who conducts the audit?', 'Every audit is conducted personally by our founder, John Richard — 9 years of brand and consumer research expertise. This is not automated output.'],
          ['How is Eye different from IQ?', "IQ tracks brand health scores (Awareness, Consideration, Buzz etc.) over time. Eye audits the actual customer experience — what it feels like to be your customer. Both products complement each other."],
          ['What does the screen recording include?', "A narrated walkthrough of your brand's digital touchpoints — app, website, checkout flow, customer support experience — with real-time commentary on what works and what creates friction."],
          ['Can I upgrade from Eye Insight?', 'Yes. The cost of your Insight audit is credited toward your first Growth or Command period.'],
        ] : [
          ['What does fully embedded mean?', "It means John is genuinely part of your decision-making process — not just an advisor you call once a month. On-call access, document reviews, strategic input on real decisions as they happen."],
          ['Why is the per-session cost higher at Command?', "You're not paying for sessions at Command. You're paying for a strategic partner who is invested in your outcome. The session count is just a way to frame the commitment level."],
          ['What kinds of decisions does Guide cover?', 'Brand strategy, GTM planning, NPD advisory, campaign direction, agency brief reviews, hiring decisions, market entry — anything that affects how your brand grows.'],
          ['Is there a minimum commitment?', 'Yes — all Guide tiers have a 3-month minimum. Strategic advisory takes at least 90 days to show results. After the first quarter, it auto-renews unless you cancel.'],
          ['Can I combine Guide with IQ or Eye?', 'Yes, and many clients do. Guide clients who also subscribe to IQ get their brand data reviewed as part of every session — the intelligence feeds directly into the advisory.'],
        ]).map(([q, a]) => (
          <div key={q} style={{borderBottom:'1px solid rgba(255,255,255,0.06)',paddingBottom:24,marginBottom:24}}>
            <div style={{fontSize:15,fontWeight:600,color:CREAM,marginBottom:10}}>✦ {q}</div>
            <div style={{fontSize:14,color:CREAM_DIM,lineHeight:1.75}}>{a}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{padding:'80px 24px 100px',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(28px,4vw,46px)',fontWeight:700,color:CREAM,marginBottom:16}}>
          {activeTab === 'guide' ? <>Not sure which tier fits?<br/>Let&apos;s talk it through.</> : <>Start with one report.<br/>Stay for the intelligence.</>}
        </h2>
        <p style={{fontSize:14,fontWeight:300,color:CREAM_DIM,maxWidth:480,margin:'0 auto 36px',lineHeight:1.75}}>
          {activeTab === 'guide'
            ? "Book a 30-minute call and we'll figure out the right level of engagement for where you are right now."
            : "Book a 30-minute call and we'll show you what we find about your brand — before you spend a rupee."
          }
        </p>
        <a href="/connect" style={{display:'inline-block',background:GOLD,color:DEEP,fontSize:14,fontWeight:600,padding:'16px 36px',borderRadius:8,textDecoration:'none'}}>
          Connect with Us!
        </a>
        <p style={{marginTop:16,fontSize:12,color:'rgba(197,194,186,0.35)'}}>Discovery call is free. No commitment.</p>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'40px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:CREAM,letterSpacing:'0.08em'}}>KING SOLOMON</div>
        <div style={{fontSize:12,color:'rgba(197,194,186,0.35)'}}>© 2026 King Solomon · kingsolomonhq.com · Bengaluru, India</div>
      </footer>
    </>
  )
}
