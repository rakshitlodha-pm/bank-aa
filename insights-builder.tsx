/* ============================================================================
   Insights tab — "Build your user"
   Next.js App Router page. Drop in as `app/insights/page.tsx`
   (or `pages/insights.tsx` — it is a client component either way).

   Self-contained: no imports beyond React, no CSS modules, no UI library.
   Design tokens are lifted from Figma file fgrzarARcLLVjIabtxAe65.
   Fixtures come from bankaadump8527379520.json — one consented AA deposits dump.
   One user is one user: every percentage here is a target, not a measurement.

   Ported 1:1 from insights-builder.html (design pass 5).
   ========================================================================== */

'use client'

import React, { useState } from 'react'

/* ==========================================================================
   TYPES
   ========================================================================== */

type AxisId = 'budget' | 'famA' | 'famB' | 'rail' | 'cashflow'
type Cfg = Record<string, string>

type LedgerRow = { group: string; id: string; state: string; name: string; why: string }

type Period = {
  label: string; chip: string; inn: number; inv: number; spent: number
  months: number; days: number; elapsed: number
  note: string | null; cause: string | null
  comp?: { committed: number; disc: number; parts: string }
}

type Cat = { n: string; a: number; c: string; kind: string; sensitive?: boolean; sub?: string }
type Fund = { n: string; c: string; ini: string; st: string; k: string; r: string }
type StoryView = { kicker: string; big: string; sub: string; meta: string; cta: string | null; none?: string }
type Story = { lbl: string; ini: string; c: string; merchant: boolean; id: string; why: string; v: StoryView }

type Handlers = {
  openStory: (i: number) => void
  navStory: (d: number) => void
  closeAll: () => void
  openSheet: (s: string) => void
}

/* ==========================================================================
   FIXTURES
   ========================================================================== */

const ACCOUNTS: Record<string, { bank: string; mask: string; bal: number; c: string; ini: string }> = {
  icici: { bank: 'ICICI',   mask: '4589', bal: 1297750, c: '#f47b20', ini: 'IC' },
  axis:  { bank: 'Axis',    mask: '7712', bal:   57536, c: '#a02f4a', ini: 'AX' },
  fed:   { bank: 'Federal', mask: '0031', bal:      39, c: '#0f7b6c', ini: 'FD' },
  hdfc:  { bank: 'HDFC',    mask: '9004', bal:  210400, c: '#1f4e8c', ini: 'HD' },
  sbi:   { bank: 'SBI',     mask: '5678', bal:   88120, c: '#1e63a8', ini: 'SB' },
}

const MEDIAN6 = 206592                  // median monthly expenses, 6 complete months (PRD §4.1)
const COVER_TARGET = MEDIAN6 * 6        // computed, never quoted
const LIQUID = ACCOUNTS.icici.bal + ACCOUNTS.axis.bal + ACCOUNTS.fed.bal
/* PRD §14 quotes ₹13,55,326 and ₹12,39,554; the components give ₹13,55,325 and
   ₹12,39,552. Both are computed here so nothing on screen contradicts anything else. */

const PERIODS: Record<string, Period> = {
  aug: {
    label: 'August', chip: 'Aug 2026', inn: 417358, inv: 145335, spent: 312581,
    months: 1, days: 31, elapsed: 31, note: null,
    cause: '<b>Two card statements landed in the same calendar month</b> — ₹1,05,164 on the 1st and ₹21,656 on the 31st.',
  },
}

const CATS_FULL: Cat[] = [
  { n: 'Credit card bills',  a: 126820, c: '#ff9d45', kind: 'noMerchant' },
  { n: 'Rent',               a:  40006, c: '#3cd3fe', kind: 'noSector' },
  { n: 'Health',             a:  38293, c: '#f3a9b4', kind: 'listed', sensitive: true },
  { n: 'People & transfers', a:  35650, c: '#00c3d0', kind: 'noSector', sub: '27 payees' },
  { n: 'Travel',             a:  20998, c: '#91ffbb', kind: 'sector' },
  { n: 'Groceries',          a:  12850, c: '#cdff82', kind: 'listed' },
  { n: 'Food delivery',      a:   9420, c: '#ffb870', kind: 'listed' },
  { n: 'Shopping',           a:   8960, c: '#e58a98', kind: 'sector' },
  { n: 'Utilities',          a:   6310, c: '#409dff', kind: 'noSector' },
  { n: 'Fuel',               a:   4780, c: '#8b8c8c', kind: 'sector' },
  { n: 'Subscriptions',      a:   3441, c: '#e1ffb4', kind: 'noSector' },
  { n: 'Other',              a:   2873, c: '#4a4b4d', kind: 'noSector' },
  { n: 'Entertainment',      a:   2180, c: '#6bb8e8', kind: 'sector' },
]

/* Top merchants — recomputed off the dump, mapped to the listed parent.
   PAYTM is deliberately absent: its 235 narrations are the rail, not a merchant,
   and 30 of them are Blinkit orders already counted under Eternal. */
const MERCHANTS = [
  { n: 'ICICI Bank',   parent: 'ICICI Bank Ltd',       a: 317971, c: '#f47b20', ini: 'IC', listed: true  },
  { n: 'Eternal',      parent: 'Eternal Ltd',          a: 150606, c: '#ef4f5f', ini: 'ET', listed: true  },
  { n: 'SBI',          parent: 'State Bank of India',  a:  82680, c: '#22409a', ini: 'SB', listed: true  },
  { n: 'MakeMyTrip',   parent: 'MakeMyTrip Ltd',       a:  51428, c: '#e0234e', ini: 'MM', listed: true  },
  { n: 'Aditya Birla', parent: 'Aditya Birla Capital', a:  30397, c: '#c8102e', ini: 'AB', listed: true  },
  { n: 'Tata 1mg',     parent: 'no listed entity',     a:  22363, c: '#486aae', ini: 'TA', listed: false },
]

/* Returns below are ILLUSTRATIVE placeholders — live prices are not modelled (§2.2). */
const FUNDS: Record<string, Fund[]> = {
  liquid: [
    { n: 'ICICI Pru Liquid Fund',       c: '#f47b20', ini: 'IP', st: '5★', k: 'Liquid', r: '+7.0%' },
    { n: 'HDFC Liquid Fund',            c: '#004c8f', ini: 'HD', st: '4★', k: 'Liquid', r: '+6.9%' },
    { n: 'SBI Liquid Fund',             c: '#22409a', ini: 'SB', st: '4★', k: 'Liquid', r: '+6.9%' },
  ],
  arb: [
    { n: 'Kotak Equity Arbitrage',      c: '#ed232a', ini: 'KO', st: '5★', k: 'Arbitrage', r: '+7.4%' },
    { n: 'ICICI Pru Equity Arbitrage',  c: '#f47b20', ini: 'IP', st: '4★', k: 'Arbitrage', r: '+7.2%' },
    { n: 'Tata Arbitrage Fund',         c: '#486aae', ini: 'TA', st: '4★', k: 'Arbitrage', r: '+7.1%' },
  ],
  index: [
    { n: 'Nippon India Nifty 50 Index', c: '#e11b22', ini: 'NI', st: '4★', k: 'Index', r: '+12.8%' },
    { n: 'UTI Nifty 50 Index Fund',     c: '#00639c', ini: 'UT', st: '5★', k: 'Index', r: '+12.6%' },
    { n: 'Motilal Nifty Midcap 150',    c: '#f5a623', ini: 'MO', st: '4★', k: 'Index', r: '+18.2%' },
  ],
}

const STORIES: Record<string, Story> = {
  blinkit: {
    lbl: 'Eternal', ini: 'ET', c: '#ef4f5f', merchant: true, id: 'S1',
    why: 'Blinkit 91 orders + Zomato · ₹1,50,606/12mo · parent Eternal, listed',
    v: { kicker: 'Your most-used merchant', big: '₹1,50,606',
         sub: '125 payments across Blinkit and Zomato in twelve months. More than any other merchant you use.',
         meta: 'Both are Eternal Ltd, which is listed.', cta: 'View Eternal' },
  },
  cards: {
    lbl: 'Your cards', ini: 'CC', c: '#ff9d45', merchant: false, id: 'S2',
    why: '₹3,72,041 of bills across three issuers · no merchant behind any of it',
    v: { kicker: 'Credit card bills', big: '₹3,72,041',
         sub: 'Across three issuers in twelve months. ICICI ₹3,17,971, Aditya Birla ₹30,397, and a card ending 7465 at ₹24,673 the narration never names.',
         meta: 'We can see the bill. We cannot see what is inside it — card statements are a separate consent.',
         cta: 'See the issuers' },
  },
  mmt: {
    lbl: 'Travel', ini: 'MM', c: '#e0234e', merchant: true, id: 'S3',
    why: 'MakeMyTrip ₹51,428/12mo · sector claim only, not a stock claim',
    v: { kicker: 'Travel', big: '₹51,428', sub: 'Five bookings this year, all through MakeMyTrip.',
         meta: 'You are MakeMyTrip’s customer. Nobody else in the sector can claim you.', cta: 'Explore travel' },
  },
  subs: {
    lbl: '12 subs', ini: '12', c: '#cdff82', merchant: true, id: 'S5',
    why: '12 recurring services · ₹41,294/yr · no listed Indian parent',
    v: { kicker: 'Subscriptions', big: '₹41,294',
         sub: 'Twelve services, ₹3,441 a month. A year of it is a decision; a month of it is not.',
         meta: 'None of the twelve has a listed Indian parent.', cta: null,
         none: 'There is nothing to buy here.' },
  },
  rent: {
    lbl: 'Your rent', ini: 'RT', c: '#00c3d0', merchant: false, id: 'S8',
    why: 'stable payee, paid 1st–7th, deposit detected at a near-integer multiple',
    v: { kicker: 'Rent', big: '₹40,006',
         sub: 'Every month, paid between the 1st and the 7th, thirteen months running.',
         meta: 'Paid to a person, so there is no company behind it. We will not guess why.', cta: null,
         none: 'No action on this one.' },
  },
  idle: {
    lbl: 'Idle cash', ini: '₹', c: '#20f572', merchant: false, id: 'S6',
    why: 'needs balance and history only — one of the two floor slots',
    v: { kicker: 'Sitting in savings', big: '₹13,55,325',
         sub: '6.6 months of your spending, in accounts paying about 3%.',
         meta: '₹1,15,773 of it is above a six-month buffer.', cta: 'Explore arbitrage funds' },
  },
  year: {
    lbl: 'Your year', ini: '26', c: '#3cd3fe', merchant: false, id: 'S7',
    why: 'needs balance and history only — the second floor slot',
    v: { kicker: 'Your year', big: '₹24,68,900',
         sub: 'Spent across 1,265 transactions and thirteen months. Your quietest month was ₹74,601, your loudest ₹4,79,465.',
         meta: 'Two-thirds of it we can count but cannot name.', cta: null,
         none: 'Nothing to act on. Just the shape of your year.' },
  },
  emi: {
    lbl: 'EMI due', ini: 'EM', c: '#8b8c8c', merchant: false, id: 'S9',
    why: '₹6,360 × 13 months, zero variation — tagged income tax by the bank, which is wrong',
    v: { kicker: 'Loan EMI', big: '₹6,360',
         sub: 'Identical for thirteen months. Your bank files this as income tax; it is an SBI loan repayment.',
         meta: 'We do not trust the bank’s own labels.', cta: null,
         none: 'Nothing to buy. Just worth knowing.' },
  },
}

const RAILS: Record<string, string[]> = {
  rich:    ['blinkit', 'cards', 'mmt', 'subs', 'rent', 'idle', 'year'],
  mixed:   ['cards', 'blinkit', 'idle', 'rent', 'year', 'emi'],
  nonmerc: ['idle', 'rent', 'year', 'emi'],
  floor:   ['idle', 'year'],
}

/* ==========================================================================
   AXES — the five things a reviewer can change
   ========================================================================== */

const AXES: { id: AxisId; label: string; ref: string; warn?: boolean; opts: [string, string][]; note?: string }[] = [
  { id: 'budget', label: 'Budget', ref: '§1.3', warn: true,
    opts: [['off', 'Not set'], ['ontrack', 'Set · on track'], ['over', 'Set · over']],
    note: 'REVERSED 7 Sep. Tap the card on screen to open the sheet. §1.3/§2.2/§7.3 removed user-set budgets because a budget is a target the user can fail, mute and abandon.' },

  { id: 'famA', label: 'Emergency fund', ref: '§7.1',
    opts: [['A1', 'Nothing set aside'], ['A2', 'Short'], ['A3', 'Nearly there'],
           ['A4', 'Covered'], ['A5', 'Covered, big surplus']],
    note: 'A1–A3 have a shortfall, A4–A5 a surplus. Also moves the balance card — cover is a function of what you hold.' },

  { id: 'famB', label: 'Investing', ref: '§7.2', warn: true,
    opts: [['B2', 'Never started'], ['B3', 'Steady'], ['off', 'Silent']],
    note: 'REMOVED 7 Sep: B1. It was the family’s reference case, so the dump user gets no investing nudge at all.' },

  { id: 'rail', label: 'Story rail', ref: '§5.2',
    opts: [['rich', 'Merchant-rich'], ['mixed', 'Mixed'], ['nonmerc', 'Non-merchant'], ['floor', 'Floor · 2']],
    note: 'Tap a bubble to open its card. The rail must never render empty.' },

  { id: 'cashflow', label: 'Cashflow', ref: '§5.3', warn: true,
    opts: [['auto', 'August'], ['zero', 'Zero income'], ['outlier', 'Outlier ≥ 3×']],
    note: 'REVERSED 7 Sep: Left over removed. That also deletes the negative bar and the partial-period withhold, and makes §13.4 moot.' },
]

const BASE: Cfg = {
  budget: 'off', famA: 'A4', famB: 'off', rail: 'rich', cashflow: 'auto',
  /* fixed — no longer exposed as controls */
  period: 'aug', accounts: 'three', actions: 'both', breakup: 'auto',
  cats: 'full', merch: 'six', badges: 'comp', blocklist: 'on', slots: '3',
}

const BUDGET_AMT: Record<string, number> = { ontrack: 350000, over: 185000 }
const HELD_BY_STATE: Record<string, number> = { A1: 41200, A2: 355000, A3: 1060000, A4: LIQUID, A5: 1950000 }

/* ==========================================================================
   HELPERS
   ========================================================================== */

const inr = (n: number) => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN')
const pcs = (a: number, b: number) => (b ? (a / b) * 100 : 0)

/** The like-for-like comparison base (§4.4): whole months for a complete period,
 *  the same N days for a partial one — never a whole month against a partial one. */
function medianBase(p: Period) {
  if (p.elapsed < p.days) return Math.round(MEDIAN6 * (p.elapsed / 30))
  return MEDIAN6 * p.months
}

const Html = ({ h, className }: { h: string; className?: string }) =>
  <span className={className} dangerouslySetInnerHTML={{ __html: h }} />

const Caret = () => (
  <svg className="chev" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M5 7.5L9 11.5L13 7.5" stroke="#8b8c8c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Eye = ({ off }: { off?: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M1.5 9S4.5 3.5 9 3.5 16.5 9 16.5 9 13.5 14.5 9 14.5 1.5 9 1.5 9Z"
      stroke={off ? '#8b8c8c' : '#ebecee'} strokeWidth="1.3" />
    {off
      ? <path d="M3 15L15 3" stroke="#8b8c8c" strokeWidth="1.3" />
      : <circle cx="9" cy="9" r="2.3" stroke="#ebecee" strokeWidth="1.3" />}
  </svg>
)
const SyncIcon = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M15 4v4h-4M3 14v-4h4" stroke="#ebecee" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M3.6 10.5a5.6 5.6 0 0 0 9.6 2.2M14.4 7.5A5.6 5.6 0 0 0 4.8 5.3" stroke="#ebecee" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
const Pawn = () => (
  <svg viewBox="0 0 48 58" width="40" height="48" fill="#7fd8c4" opacity=".92" aria-hidden>
    <circle cx="24" cy="12" r="8.5" />
    <rect x="13" y="21.5" width="22" height="5" rx="2.5" />
    <path d="M18 28h12c0 8.5 3.2 12.6 5.4 15.6H12.6C14.8 40.6 18 36.5 18 28Z" />
    <rect x="7.5" y="45" width="33" height="7.5" rx="3.75" />
  </svg>
)
const Anno = ({ r }: { r: string }) => <span className="anno">{r}</span>

/* ==========================================================================
   PAGE BUILDER
   A pure function: same config in, same markup and same ledger out.
   The ledger is collected locally, so nothing mutates module state.
   ========================================================================== */

function buildPage(S: Cfg, openStory: number | null, sheet: string | null, railSeen: boolean, on: Handlers) {
  const ledger: LedgerRow[] = []
  const log = (group: string, id: string, state: string, name: string, why: string) =>
    ledger.push({ group, id, state, name, why })

  const p = PERIODS[S.period]

  /* ---------------------------------------------------------------- §5.1 */
  function balanceCard() {
    const setMap: Record<string, string[]> = {
      three: ['icici', 'axis', 'fed'], one: ['icici'],
      five: ['icici', 'axis', 'fed', 'hdfc', 'sbi'],
      stale: ['icici', 'axis', 'fed'], expired: ['icici', 'axis', 'fed'], hidden: ['icici', 'axis', 'fed'],
    }
    const keys = setMap[S.accounts]
    const natural = keys.reduce((t, k) => t + ACCOUNTS[k].bal, 0)
    const total = HELD_BY_STATE[S.famA]
    const f = total / natural
    const bal = (k: string) => Math.max(1, Math.round(ACCOUNTS[k].bal * f))
    const hidden = S.accounts === 'hidden'
    const stale = S.accounts === 'stale' ? 'axis' : null
    const expired = S.accounts === 'expired' ? 'icici' : null

    log('Structure', '—', 'always', 'Balance card', 'universal — needs no merchant match')
    log('Rule', '4.1', '—', 'Liquid balance ' + inr(total),
      'cover = ' + (total / MEDIAN6).toFixed(1) + ' median months → state ' + S.famA)
    if (keys.includes('fed')) log('Edge', '5.1c', 'met', inr(bal('fed')) + ' account kept',
      'it funds an investing app — itself a signal')

    return (
      <div className="card balance">
        <Anno r="§5.1" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="cap">Your total account balance</span><Caret />
        </div>
        <div className="amt num">{hidden ? '₹ • • • • • •' : inr(total)}</div>
        <div className="tools">
          <button className="iconbtn"><Eye off={hidden} /></button>
          <button className="iconbtn"><SyncIcon /></button>
        </div>
        <div className="chips">
          {keys.map(k => {
            const a = ACCOUNTS[k]; const fl = k === stale || k === expired
            return (
              <div key={k} className={'chip' + (fl ? ' stale' : '')} title={inr(bal(k))}>
                <span className="lg" style={{ background: a.c }}>{a.ini}</span>
                <span className="m">{a.bank} ··{a.mask}</span>
                {fl && <span className="fd" />}
              </div>
            )
          })}
        </div>
        <button className="addacct">＋ Add account</button>
      </div>
    )
  }

  /* ---------------------------------------------------------------- §5.2 */
  function storyRail() {
    const keys = RAILS[S.rail]
    log('Structure', '—', 'always', 'Story rail', 'never empty; tap opens the story card')
    keys.forEach(k => log('Slot · rail', STORIES[k].id, 'fired', STORIES[k].lbl, STORIES[k].why))
    Object.keys(STORIES).forEach(k => {
      if (!keys.includes(k)) log('Slot · rail', STORIES[k].id, 'held', STORIES[k].lbl,
        STORIES[k].merchant ? 'merchant not matched in this fixture' : 'not in this rail set')
    })
    if (S.rail === 'floor') log('Rule', '5.2', 'met', 'Floor held',
      'last two slots reserved for balance + history insights')

    return (
      <div className="card flat">
        <Anno r="§5.2" />
        <div className="rail">
          {keys.map((k, i) => {
            const s = STORIES[k]
            const nm = !s.merchant && (S.rail === 'nonmerc' || S.rail === 'floor')
            return (
              <button key={k} className={'story' + (railSeen ? ' seen' : '') + (nm ? ' nm' : '')}
                onClick={() => on.openStory(i)}>
                <span className="ring"><span className="inner">
                  <span className="gl" style={{ background: s.c }}>{s.ini}</span>
                </span></span>
                <span className="lb">{s.lbl}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ------------------------------------------- §5.3 — three bars, no Left over */
  function cashflowCard() {
    let inn = p.inn, spent = p.spent, note = p.note
    let outlier = false
    if (S.cashflow === 'zero') { inn = 0; note = 'No credit has landed in this period yet.' }
    if (S.cashflow === 'outlier') {
      spent = Math.max(spent, p.inv * 3.2); outlier = true
      note = 'Credit-card bills at ' + inr(spent * 0.57) +
        ' are 3.2× the next largest flow. The scale is true; the month is not typical.'
    }
    const bars = [
      { n: 'Income',   v: inn,    g: 'linear-gradient(180deg,#20f572,#0f8f45)' },
      { n: 'Invested', v: p.inv,  g: 'linear-gradient(180deg,#5bb4ff,#1b5fa8)' },
      { n: 'Expenses', v: spent,  g: 'linear-gradient(180deg,#ff6b5c,#a12a1e)' },
    ]
    const scale = Math.max(bars[0].v, bars[1].v, bars[2].v, 1)
    const POS = 138

    log('Structure', '—', 'always', 'Cashflow chart · 3 bars', 'one scale, set by the largest value in the period')
    log('PRD clash', '5.3', 'reversed', 'Left over bar removed',
      'Rakshit, 7 Sep. §5.3 specifies <b>four</b> bars. Removing it also deletes the negative-below-axis state and ' +
      'the partial-period withhold, and makes §13.4 moot. Needs a written ruling.')
    if (inn === 0) log('State', '5.3', 'zero-income', 'Income renders as a labelled ₹0 stub', 'the bar is never hidden')
    if (outlier) log('State', '5.3', 'outlier', 'True scale kept + caption', 'clipping would hide the year’s biggest event')

    return (
      <div className="card">
        <Anno r="§5.3" />
        <div className="hd">
          <h4>How your money moves</h4>
          <button className="periodchip">{p.chip} <Caret /></button>
        </div>
        <div className="chart">
          <div className="cols">
            {bars.map(b => {
              const h = Math.max(3, (b.v / scale) * POS), z = b.v === 0
              return (
                <div className="col" key={b.n}>
                  <span className="v">{z ? '₹0' : inr(b.v)}</span>
                  <div className="plot" style={{ height: POS }}>
                    <div className={'bar' + (z ? ' stub' : '')} style={{ height: h, background: b.g }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="axisline" />
          <div className="names">{bars.map(b => <span key={b.n}>{b.n}</span>)}</div>
        </div>
        {note && <div className="chartcap">{note}</div>}
      </div>
    )
  }

  /* -------------------------------------- budget card + investor tier badge */
  function budgetAndBadge() {
    const spent = p.spent
    const isSet = S.budget !== 'off'
    const amt = BUDGET_AMT[S.budget] || 0
    const over = isSet && spent > amt
    const pcUsed = isSet ? Math.min(100, (spent / amt) * 100) : 0

    log('PRD clash', '1.3', 'restored', 'Set your budget',
      'Rakshit, 7 Sep. §1.3, §2.2 and §7.3 removed user-set budgets: <b>a budget is a target the user can fail, ' +
      'mute and abandon</b>, and nudges measured against the user’s own median need no configuration. Restoring it ' +
      'reopens who owns the number when a budget and a median-based nudge disagree.')
    if (isSet) log('State', '1.3', over ? 'over' : 'on track', 'Budget ' + inr(amt),
      inr(spent) + ' spent · ' + (over ? inr(spent - amt) + ' over' : inr(amt - spent) + ' left') +
      ' · the sheet seeds itself from the median, so the default is still engine-derived')
    else log('State', '1.3', 'not set', 'Budget', 'tap the card to open the sheet')
    log('Slot · row', '1.3b', 'fired', 'Investor tier badge',
      'one badge, tier + percentile. The percentile needs the §8.2 cohort, so it is marked assumed.')

    return (
      <div className="card flat">
        <Anno r="§1.3 restored · §8.2" />
        <div className="pair">
          <button className="pcard" onClick={() => on.openSheet('budget')}>
            <div className="plab">Monthly budget</div>
            <div className="pval">{isSet ? inr(amt) : 'Not set'}</div>
            {isSet ? (
              <>
                <div className="pbar">
                  <i style={{
                    width: pcUsed + '%',
                    background: over ? 'linear-gradient(90deg,#a12a1e,#ff6b5c)'
                                     : 'linear-gradient(90deg,#1b7a45,#20f572)',
                  }} />
                </div>
                <div className={'pst ' + (over ? 'neg' : 'pos')}>
                  {over ? inr(spent - amt) + ' over' : inr(amt - spent) + ' left'}
                </div>
                <div className="pst" style={{ color: 'var(--t-med)' }}>{inr(spent)} spent</div>
              </>
            ) : (
              <>
                <div className="pst" style={{ color: 'var(--t-med)', marginTop: 6 }}>
                  Your median month is {inr(MEDIAN6)}
                </div>
                <div className="cta2">Set your budget →</div>
              </>
            )}
          </button>

          <button className="pcard badge">
            <Pawn />
            <span className="tier">ADVANCED</span>
            <span className="who">Top 1% investor</span>
            <span className="whos">on Paytm Money <span className="assumed">assumed</span></span>
          </button>
        </div>
      </div>
    )
  }

  /* ------------------------------------ what "Set your budget" opens (§1.3) */
  function budgetSheet() {
    if (sheet !== 'budget') return null
    const cur = BUDGET_AMT[S.budget] || MEDIAN6
    const opts = [
      { l: 'Your median month', v: MEDIAN6 },
      { l: '10% less', v: Math.round((MEDIAN6 * 0.9) / 500) * 500 },
      { l: '20% less', v: Math.round((MEDIAN6 * 0.8) / 500) * 500 },
    ]
    log('Sheet', '1.3', 'open', 'Set a monthly budget',
      'Seeded from the user’s own median so the default is still engine-derived. The user can override it — which ' +
      'is exactly the thing §7.3 was written to avoid.')

    return (
      <div className="sheet">
        <div className="panel">
          <div className="grab" />
          <h4>Set a monthly budget</h4>
          <div className="sh">We will measure it against your own spending, not a number we picked for you.</div>
          <div className="amt2 num">{inr(cur)}</div>
          <div className="qch">
            {opts.map(o => (
              <button key={o.l} className={o.v === cur ? 'on' : ''}>{o.l}<b>{inr(o.v)}</b></button>
            ))}
          </div>
          <div className="note2">
            You will see where you stand from day 8 of each month. Before that there is not enough of a month to
            judge — on this account, day two has run anywhere from 0.3% to 54% of the month’s spend.
          </div>
          <button className="pill" onClick={on.closeAll}>Set budget</button>
          <button className="later2" onClick={on.closeAll}>Not now</button>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- §5.4 */
  function actionCards() {
    const show = ({ both: ['sync', 'funds'], sync: ['sync'], funds: ['funds'], none: [] } as Record<string, string[]>)[S.actions]
    if (!show.length) {
      log('Slot · action', '5.4', 'held', 'Both dismissed', '`Later` hides for the session only — both return')
      return null
    }
    const held = HELD_BY_STATE[S.famA]
    if (show.includes('sync')) log('Slot · action', '5.4a', 'fired', 'Account out of sync',
      'names the stake in the user’s own numbers, not just “out of sync”')
    if (show.includes('funds')) log('Slot · action', '5.4b', 'fired', 'Track external mutual funds',
      'highest-leverage item on the page — holdings gate every buy button (§12.1)')

    return (
      <div className="card flat" style={{ marginTop: 10 }}>
        <div className="arow">
          {show.includes('sync') && (
            <div className="acard">
              <Anno r="§5.4a" />
              <button className="x">×</button>
              <div className="lg2" style={{ background: 'var(--not-weak)', color: 'var(--not)' }}>↻</div>
              <div className="eb not">Sync needed</div>
              <div className="tt">ICICI ··4589</div>
              <div className="rule" />
              <div className="ft"><span>96% of {inr(held)}</span><button className="pill">Fix now</button></div>
            </div>
          )}
          {show.includes('funds') && (
            <div className="acard">
              <Anno r="§5.4b" />
              <button className="x">×</button>
              <div className="lg2" style={{ background: 'var(--pri-weak)', color: 'var(--pri)' }}>↗</div>
              <div className="eb pri">Not tracked</div>
              <div className="tt">Funds held elsewhere</div>
              <div className="rule" />
              <div className="ft"><span>₹1,45,000 on the 1st</span><button className="pill">Import</button></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ------------------------------------------- §6.1 / §6.2 — donut + rows */
  function expensesCard() {
    const partial = p.elapsed < p.days
    const total = p.spent
    const base = medianBase(p)
    const mult = base ? total / base : 0
    const basis = partial ? 'the same ' + p.elapsed + ' days of your median month'
                          : (p.months > 1 ? p.months + ' median months' : 'your median month')

    log('Structure', '—', 'always', 'Expense total', 'compared to the user’s own median — never to last month')

    let cats = CATS_FULL.slice().sort((a, b) => b.a - a.a)
    if (S.blocklist === 'off') cats = cats.map(c => ({ ...c, sensitive: false }))
    const sum = cats.reduce((t, c) => t + c.a, 0)

    /* the pie only works if the tail is folded — 40.6% next to 1.2% is unreadable */
    const NAMED = 4
    const named = cats.slice(0, NAMED), tail = cats.slice(NAMED)
    const tailSum = tail.reduce((t, c) => t + c.a, 0)
    const slices: { n: string; a: number; c: string }[] = named.map(c => ({ n: c.n, a: c.a, c: c.c }))
    if (tailSum > 0) slices.push({ n: 'Others', a: tailSum, c: '#5c6169' })
    const smallest = Math.min(...slices.map(s => pcs(s.a, sum)))

    log('PRD clash', '6.2', 'reversed', 'Donut, not ranked bars',
      'Rakshit, 7 Sep. §1.3 rejected the pie because the top category is 40.6% and the 12th is 1.2%. Mitigated by ' +
      'naming the top four and folding ' + tail.length + ' into <b>Others</b>, so no rendered slice is below ' +
      smallest.toFixed(1) + '%. The ranked rows are kept underneath.')

    const R = 54, C = 2 * Math.PI * R
    let off = 0
    const arcs = slices.map(s => {
      const len = (pcs(s.a, sum) / 100) * C
      const dash = Math.max(0, len - 1.6)
      const el = (
        <circle key={s.n} r={R} cx="63" cy="63" fill="none" stroke={s.c} strokeWidth="15"
          strokeDasharray={dash + ' ' + (C - dash)} strokeDashoffset={-off} />
      )
      off += len
      return el
    })

    const shown = S.slots === 'all' ? cats : cats.slice(0, 4)
    log('Structure', '—', 'always', 'Ranked category rows',
      'kept under the donut — the donut answers shape, the rows answer size')
    const sens = cats.find(c => c.sensitive)
    if (S.blocklist === 'on') {
      if (sens) log('Rule', 'E1', 'held silently', 'Health kept in true rank',
        inr(sens.a) + ' · real number, real rank, identical styling · no nudge, no frame, no button, no card explaining it')
      log('OPEN', '13.1', 'rule ON', 'Sensitive blocklist', 'flip to see the same page with the rule gone')
    } else {
      log('OPEN', '13.1', 'rule OFF', 'Sensitive blocklist',
        'health re-enters the slot queue as an ordinary category with a button')
    }
    log('OPEN', '13.2', S.slots === 'all' ? 'all stacked' : '4 + expander',
      'Rows before the expander', 'currently specified as three')

    return (
      <div className="card">
        <Anno r="§6.1 · §6.2" />
        <div className="hd">
          <div><h4>Your expenses</h4><div className="sub">{p.label} · all accounts</div></div>
          <button className="periodchip">{p.chip} <Caret /></button>
        </div>
        <div className="etotal num">{inr(total)}</div>
        <div className="ecmp">
          <b className={mult >= 1 ? 'neg' : 'pos'}>{mult.toFixed(2)}×</b> {basis} of {inr(base)}.
        </div>

        <div className="donut-wrap">
          <div className="donut">
            <svg width="126" height="126">
              <circle r={R} cx="63" cy="63" fill="none" stroke="#ffffff0d" strokeWidth="15" />
              {arcs}
            </svg>
            <div className="mid"><b>{inr(sum)}</b><span>{slices.length} groups</span></div>
          </div>
          <div className="dleg">
            {slices.map(s => (
              <button key={s.n}>
                <span className="sw" style={{ background: s.c }} />
                <span className="nm">{s.n}</span>
                <span className="pc">{pcs(s.a, sum).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 4, borderTop: '1px solid var(--bd-weak)' }} />

        {shown.map(c => (
          <button className="crow" key={c.n}>
            <span className="sw" style={{ background: c.c }} />
            <span className="nm">{c.n}{c.sub && <i> · {c.sub}</i>}</span>
            <span className="am">{inr(c.a)}</span>
            <span className="pcs">{pcs(c.a, sum).toFixed(1)}%</span>
            <Caret />
          </button>
        ))}
        {S.slots !== 'all' && cats.length > 4 &&
          <button className="viewall">View all {cats.length} categories</button>}

        <div className="disclose">
          Categories are worked out by us from your bank narration. They cannot be corrected, here or anywhere.
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- §7.1 */
  function emergencyCard() {
    const T = COVER_TARGET, held = HELD_BY_STATE[S.famA]
    const surplus = Math.max(0, held - T), shortfall = Math.max(0, T - held)
    const D = ({
      A1: { verdict: 'About <b>six days</b> of cover. Start at <b>₹5,000 a month</b> — the six-month number is not something anyone can act on from here.',
            funds: 'liquid', ftitle: 'Where to start', why: 'cover < 1 month → a starting amount, never the target' },
      A2: { verdict: 'About <b>1.7 months</b> of cover. <b>' + inr(Math.round(shortfall / 24)) + ' a month</b> closes it over two years.',
            funds: 'liquid', ftitle: 'Where to put it', why: '1 ≤ cover < 5 → shortfall ÷ 24, framed over two years' },
      A3: { verdict: '<b>5.1 months</b>. You have added ₹42,000 a month across the last three months. At that observed rate you are covered by <b>February 2027</b>.',
            funds: 'liquid', ftitle: 'Where to put it', why: '5 ≤ cover < 6 → the only forecasting state, and only from a measured rate' },
      A4: { verdict: '<b>6.6 months</b> — covered. The ' + inr(surplus) + ' above the buffer is earning about ₹3,400 a year where it sits.',
            funds: 'arb', ftitle: 'Put the ' + inr(surplus) + ' to work', why: 'cover ≥ 6, surplus < 3× median → arbitrage or liquid' },
      A5: { verdict: '<b>9.4 months</b> — covered three months over. ' + inr(surplus) + ' sits above the buffer.',
            funds: 'index', ftitle: 'Put the ' + inr(surplus) + ' to work', why: 'cover ≥ 6, surplus ≥ 3× median → index/ETF, plus a keep-liquid option' },
    } as Record<string, { verdict: string; funds: string; ftitle: string; why: string }>)[S.famA]

    log('Structure', '—', 'always', 'Emergency fund',
      'speaks in every situation, including when the fund is finished')
    log('Slot · nudge', S.famA, 'fired', 'Emergency fund', D.why)
    log('PRD clash', '7.1', 'moved', 'Emergency fund under the donut',
      'Rakshit, 7 Sep. §7.1 put family A in the nudge stack; it is now a card in Section 2 whose action routes into ' +
      'a fund shortlist. The CTA stays <b>Explore</b>, so §12.1 still holds.')
    log('PRD clash', '10.2', 'check', '1Y returns on the fund rows',
      'A fund’s trailing return is published product data, not a claim about the user’s money, so this reads as ' +
      'compatible with §10.2 (“never you would have made X”). <b>The figures here are illustrative placeholders</b> — ' +
      'live prices are not modelled. Needs a ruling and a real source.')

    const fillPc = Math.min(100, (held / Math.max(held, T)) * 100)
    const targetPos = Math.min(100, (T / Math.max(held, T)) * 100)

    return (
      <div className="card ef">
        <Anno r={'§7.1 ' + S.famA} />
        <div className="hd">
          <div>
            <h4>Based on your last 6 months worth of expenses</h4>
            <div className="sub">You should hold {inr(T)} — six median months of {inr(MEDIAN6)}</div>
          </div>
        </div>
        <div className="goalbar">
          <i style={{ width: fillPc + '%' }} />
          <u style={{ left: targetPos + '%' }} />
        </div>
        <div className="glab">
          <span>Held <b>{inr(held)}</b></span>
          <span>{surplus
            ? <>Surplus <b className="pos">{inr(surplus)}</b></>
            : <>Shortfall <b className="neg">{inr(shortfall)}</b></>}</span>
        </div>
        <Html className="verdict" h={D.verdict} />
        <div className="fundhd">{D.ftitle}</div>
        {FUNDS[D.funds].map(fd => (
          <button className="frow" key={fd.n}>
            <span className="fl" style={{ background: fd.c }}>{fd.ini}</span>
            <span className="fm">
              <b>{fd.n}</b>
              <span><span className="st">{fd.st}</span>{fd.k} Fund</span>
            </span>
            <span className="fr"><b>{fd.r}</b><span>1Y returns</span></span>
            <Caret />
          </button>
        ))}
        {S.famA === 'A5' ? (
          <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
            <button className="viewall" style={{ margin: 0 }}>Explore all mutual funds</button>
            <button className="viewall" style={{ margin: 0, color: 'var(--t-mod)' }}>Keep {inr(MEDIAN6)} liquid</button>
          </div>
        ) : (
          <button className="viewall">Explore all mutual funds</button>
        )}
        <div className="disclose">
          Returns shown are illustrative 1-year figures for the fund, not a projection of your money.
          Past performance is not indicative of future returns.
        </div>
      </div>
    )
  }

  /* ------------------------------------ top merchants (added 7 Sep, not in PRD) */
  function merchantsCard() {
    if (S.merch === 'none') {
      log('Slot · card', 'M', 'held', 'Top merchants',
        'no merchant clears the ₹10,000 / 12-month floor in this fixture')
      return null
    }
    const list = S.merch === 'three' ? MERCHANTS.slice(0, 3) : MERCHANTS
    log('Slot · card', 'M', 'fired', 'Top merchants',
      list.length + ' merchants over the 12-month window, each with its listed parent')
    log('PRD clash', '—', 'added', 'Top merchants card',
      'Rakshit, 7 Sep. Not in the PRD. <b>Paytm is deliberately excluded:</b> its 235 narrations are the rail, not ' +
      'a merchant, and 30 of them are Blinkit orders already counted under Eternal — including it would double-count. ' +
      'That is §4.5’s payment-aggregator trap.')

    return (
      <div className="card">
        <Anno r="top merchants" />
        <div className="hd">
          <div>
            <h4>Top merchants</h4>
            <div className="sub">Last 12 months · a green dot means the parent is listed</div>
          </div>
        </div>
        <div className="mrow">
          {list.map(m => (
            <button className="mtile" key={m.n} title={m.parent}>
              <span className="ml" style={{ background: m.c }}>{m.ini}</span>
              <span className="mn">{m.n}</span>
              <span className="ma">{m.listed && <span className="lst" />}{inr(m.a)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- §7.2 */
  function investingNudge() {
    if (S.famB === 'off') {
      log('Slot · nudge', 'B', 'held', 'Investing',
        'no trigger met. B1 was this user’s case and was removed on 7 Sep.')
      return null
    }
    const D = ({
      B2: { h: 'Nothing invested that we can see',
            p: 'Your median leftover is ₹42,000 a month. We only see this bank — <b>some of it may be invested somewhere we cannot see.</b>',
            cta: ['Explore', 'Add funds I hold elsewhere'], cls: 'cool',
            why: 'zero investment outflow + leftover > 10% of income · must hedge, because deposits data cannot see a direct-plan investor' },
      B3: { h: '₹1,45,000 a month, eight months running',
            p: 'Less than 5% variation. Nothing to do here.', cta: [] as string[], cls: 'good',
            why: '≥ 6 months, < 5% variation · exists so the family is not only bad news' },
    } as Record<string, { h: string; p: string; cta: string[]; cls: string; why: string }>)[S.famB]

    log('Slot · nudge', S.famB, 'fired', 'Investing', D.why)

    return (
      <div className={'card nz ' + D.cls}>
        <Anno r={'§7.2 ' + S.famB} />
        <div className="eb">Investing</div>
        <h4>{D.h}</h4>
        <p><Html h={D.p} /></p>
        {D.cta.length > 0 && (
          <div className="ctas">
            {D.cta.map((c, i) => (
              <button key={c} className={'pill' + (i ? ' ghost' : '')} style={{ flex: 1 }}>{c}</button>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ---------------------------------------------------------------- §8.2 */
  function badgesRow() {
    log('Structure', '—', 'always', 'Badge row',
      'needs no AA consent — this is the reason to connect an account (§8.1)')
    log('State', '8.2', S.badges, 'Badge tiles',
      'investing cohort exists; the spending tile stays locked behind the 5,000-account gate')

    return (
      <>
        <div className="badges">
          <div className="badge-t hot">
            <Anno r="§8.2" />
            <div className="g2">↗</div>
            <div className="big">Top 3%</div>
            <div className="c2">of Paytm Money investors your age</div>
            <div className="ft2">Band median ₹18,400/mo · you ₹1,45,000 <span className="assumed">assumed</span></div>
          </div>
          <div className="badge-t">
            <Anno r="§8.2" />
            <div className="g2">🔒</div>
            <div className="big">1,340</div>
            <div className="c2">of 5,000 connected accounts</div>
            <div className="lb2"><i style={{ width: '26.8%' }} /></div>
            <div className="ft2">Spending comparisons switch on at 5,000. <span className="assumed">assumed</span></div>
          </div>
        </div>
        <div className="disclose" style={{ border: 0 }}>
          Tap a tile for who you are compared to — your figure, the cohort median, the band, the cohort size and the window.
        </div>
      </>
    )
  }

  /* ------------------------------------- story L2 — the card behind a bubble */
  function storyViewer() {
    if (openStory === null) return null
    const keys = RAILS[S.rail]
    const i = Math.min(openStory, keys.length - 1)
    const s = STORIES[keys[i]], v = s.v

    log('Story open', s.id, 'fired', s.lbl + ' · L2',
      'full-screen card: your number → what it is made of → the route out (§9.1)')
    if (!v.cta) log('Rule', '5.2', 'met', 'This story ends with no action',
      'if every bubble routes to a buy, the rail becomes advertising (§5.2)')

    return (
      <div className="viewer">
        <div className="segs">
          {keys.map((k, j) => <i key={k} className={j < i ? 'done' : (j === i ? 'now' : '')} />)}
        </div>
        <div className="vh">
          <span className="gl" style={{ background: s.c }}>{s.ini}</span>
          <span className="vt"><b>{s.lbl}</b><span>Last 12 months</span></span>
          <button className="vx" onClick={on.closeAll}>×</button>
        </div>
        <div className="vbody">
          <div className="glow" style={{
            background: 'radial-gradient(420px 260px at 20% 40%,' + s.c + '1f,transparent 70%)',
          }} />
          <div className="vk">{v.kicker}</div>
          <div className="vbig num">{v.big}</div>
          <div className="vsub">{v.sub}</div>
          <div className="vmeta">{v.meta}</div>
          <div className="taps">
            <button onClick={() => on.navStory(-1)} aria-label="previous" />
            <button onClick={() => on.navStory(1)} aria-label="next" />
          </div>
        </div>
        <div className="vft">
          {v.cta
            ? <button className="pill">{v.cta}</button>
            : <div className="vnone">{v.none}</div>}
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------- assemble */
  const node = (
    <div className="ph">
      <div className="statusbar">
        <span>9:41</span>
        <span className="icons">
          <i style={{ width: 3, height: 6 }} /><i style={{ width: 3, height: 9 }} /><i style={{ width: 3, height: 12 }} />
          <i style={{ width: 9, height: 9, borderRadius: '50%', marginLeft: 4 }} />
          <i style={{ width: 21, height: 10, borderRadius: 3, marginLeft: 4 }} />
        </span>
      </div>
      <div className="navbar">
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M12.5 4L6.5 10L12.5 16" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="ttl">Your money</span>
      </div>
      <div className="tabs">
        <button className="on">Insights</button><button>Transactions</button><button>My accounts</button>
      </div>
      <div className="scroll">
        <div className="sec">
          <div className="sec-hd"><span className="n">1</span><h3>Your bank</h3></div>
          {balanceCard()}{storyRail()}{cashflowCard()}{budgetAndBadge()}{actionCards()}
        </div>
        <div className="sec">
          <div className="sec-hd"><span className="n">2</span><h3>Your expenses</h3></div>
          {expensesCard()}{emergencyCard()}{merchantsCard()}{investingNudge()}
        </div>
        <div className="sec">
          <div className="sec-hd"><span className="n">3</span><h3>You vs Paytm Money</h3></div>
          {badgesRow()}
        </div>
        <div className="homebar" />
      </div>
      {storyViewer()}
      {budgetSheet()}
    </div>
  )

  return { node, ledger }
}

/* ==========================================================================
   LEDGER — off-screen only (§2.2). The engine diagnostic never reaches a user.
   ========================================================================== */

const LEDGER_ORDER = ['PRD clash', 'Structure', 'Sheet', 'Story open', 'Slot · rail', 'Slot · card',
  'Slot · nudge', 'Slot · action', 'Slot · row', 'State', 'Rule', 'Edge', 'OPEN']

function Ledger({ rows }: { rows: LedgerRow[] }) {
  const by: Record<string, LedgerRow[]> = {}
  rows.forEach(r => { (by[r.group] = by[r.group] || []).push(r) })
  return (
    <>
      {LEDGER_ORDER.filter(g => by[g]).map(g => (
        <React.Fragment key={g}>
          <div className="lgroup">
            {g === 'Structure' ? 'Structure — always renders' : (g === 'PRD clash' ? 'Needs a ruling' : g)}
          </div>
          {by[g].map((r, i) => {
            const off = r.state === 'held'
            const cls = g === 'PRD clash' ? 'clash'
              : (g === 'Structure' ? 'struct' : (off ? 'off' : (g === 'OPEN' ? 'hold' : 'on')))
            return (
              <div className={'lrow' + (off ? ' is-off' : '')} key={g + i}>
                <span className={'dot ' + cls} />
                <span className="body">
                  <span className="k">{r.name}</span>
                  <Html className="why" h={r.why} />
                </span>
                <span className="id">{r.id}</span>
              </div>
            )
          })}
        </React.Fragment>
      ))}
    </>
  )
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function InsightsBuilderPage() {
  const [S, setS] = useState<Cfg>({ ...BASE })
  const [openStory, setOpenStory] = useState<number | null>(null)
  const [sheet, setSheet] = useState<string | null>(null)
  const [railSeen, setRailSeen] = useState(false)
  const [annotate, setAnnotate] = useState(true)

  const on: Handlers = {
    openStory: i => { setOpenStory(i); setRailSeen(true) },
    navStory: d => setOpenStory(cur => {
      if (cur === null) return null
      const n = cur + d, len = RAILS[S.rail].length
      return n < 0 || n >= len ? null : n
    }),
    closeAll: () => { setOpenStory(null); setSheet(null) },
    openSheet: s => setSheet(s),
  }

  const setAxis = (id: AxisId, v: string) => {
    setS(prev => ({ ...prev, [id]: v }))
    setOpenStory(null)
    setSheet(null)
  }

  const { node, ledger } = buildPage(S, openStory, sheet, railSeen, on)
  const fired = ledger.filter(r => r.state === 'fired').length
  const held = ledger.filter(r => r.state === 'held').length
  const clash = ledger.filter(r => r.group === 'PRD clash').length

  return (
    <div className={annotate ? 'annotate' : undefined}>
      <style>{CSS}</style>
      <div className="shell">

        <div className="masthead">
          <div>
            <h1>Insights tab — Build your user</h1>
            <div className="sub">
              Design pass 5. Every element traces to <b>PRD-insights-tab.md</b>; the visual language is the Paytm Money
              dark system from Figma. Pick a case on the left, the screen rebuilds. The right rail reports why.
            </div>
          </div>
          <div className="meta">
            376 × 812 · Inter · Figma tokens<br />
            fixtures: bankaadump8527379520.json<br />
            tap a story bubble to open its card
          </div>
        </div>

        <div className="work">
          <aside className="builder">
            <h2>Build your user</h2>
            <p className="hint">
              Five things to play with. Everything else on the page is fixed at the reference user, because it does not
              change between cases.
            </p>
            {AXES.map(a => (
              <div className="axis" key={a.id}>
                <div className="axis-hd"><label>{a.label}</label><span className="ref">{a.ref}</span></div>
                <div className="opts">
                  {a.opts.map(([v, l]) => (
                    <button key={v} className={'opt' + (a.warn ? ' warn' : '')}
                      aria-pressed={S[a.id] === v} onClick={() => setAxis(a.id, v)}>{l}</button>
                  ))}
                </div>
                {a.note && (
                  <Html className="note"
                    h={a.note.replace(/^(REVERSED|ADDED|REMOVED|OPEN)/, '<b>$1</b>')} />
                )}
              </div>
            ))}
            <label className="switch">
              <input type="checkbox" checked={annotate} onChange={e => setAnnotate(e.target.checked)} /> Show §refs on screen
            </label>
            <label className="switch">
              <input type="checkbox" checked={railSeen} onChange={e => setRailSeen(e.target.checked)} /> Story rail already read
            </label>
          </aside>

          <div className="stage">
            <div className="stage-bar">
              <span>August · complete period</span>
              <span className="fill" />
              <span>{fired} fired · {held} held · {clash} need a ruling</span>
            </div>
            <div className="device">{node}</div>
          </div>

          <aside className="ledger">
            <h2>Why this page</h2>
            <p className="hint">
              Off-screen only (§2.2). Red dots are places this build contradicts the PRD because of the 7 Sep review —
              each needs a written ruling before this becomes a spec.
            </p>
            <Ledger rows={ledger} />
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   STYLES — identical to insights-builder.html so the two stay in sync.
   Font: add Inter + IBM Plex Mono via next/font or a <link> in your layout.
   ========================================================================== */

const CSS = `
/* ============================================================
   TOKENS — Figma file fgrzarARcLLVjIabtxAe65
   ============================================================ */
:root{
  --bg:#101010; --s1:#1c1c1c; --s2:#202020; --s3:#282828;
  --bd-weak:#242424; --bd-med:#343536; --bd-mod:#cacaca;
  --t-strong:#ffffff; --t-mod:#ebecee; --t-med:#8b8c8c; --t-dim:#6a6b6c;
  --pri:#409dff; --pri-weak:#1a2534;
  --pos:#20f572; --pos-weak:#16281c;
  --neg:#ff4e3e; --neg-weak:#2c1f1e;
  --not:#ff9d45; --not-weak:#2b231a;
  --lime-s:#cdff82; --teal:#00c3d0; --cyan:#3cd3fe; --mint:#91ffbb; --red-m:#f3a9b4;
  --r-s:4px; --r-12:12px; --r-16:16px; --r-20:20px; --r-full:200px;
  --ui:'Inter',system-ui,-apple-system,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
}
*{box-sizing:border-box}
body{margin:0;background:#0a0a0b}
.shell{background:#0a0a0b;color:#e7e7ea;font-family:var(--ui);font-size:13px;-webkit-font-smoothing:antialiased;min-height:100vh}

/* ============================================================
   WORKBENCH (review shell — not the product)
   ============================================================ */
.shell{max-width:1700px;margin:0 auto;padding:26px 22px 80px}
.masthead{border-bottom:1px solid #1d1d20;padding-bottom:16px;margin-bottom:20px;display:flex;align-items:flex-end;gap:24px;flex-wrap:wrap}
.masthead h1{margin:0;font-size:18px;font-weight:600;letter-spacing:-.01em}
.masthead .sub{color:#78787f;font-size:12px;margin-top:5px;line-height:1.5;max-width:660px}
.masthead .meta{margin-left:auto;font-family:var(--mono);font-size:10px;color:#5c5c63;text-align:right;line-height:1.7}
.work{display:grid;grid-template-columns:284px minmax(0,1fr) 336px;gap:24px;align-items:start}
@media(max-width:1420px){.work{grid-template-columns:268px minmax(0,1fr)}.ledger{grid-column:1/-1}}
@media(max-width:960px){.work{grid-template-columns:1fr}}
.builder,.ledger{position:sticky;top:18px;max-height:calc(100vh - 40px);overflow-y:auto;
  background:#121215;border:1px solid #1e1e22;border-radius:12px;padding:13px 13px 18px;scrollbar-width:thin}
.builder::-webkit-scrollbar,.ledger::-webkit-scrollbar{width:8px}
.builder::-webkit-scrollbar-thumb,.ledger::-webkit-scrollbar-thumb{background:#26262b;border-radius:8px}
.builder h2,.ledger h2{margin:0 0 3px;font-size:13px;font-weight:600}
.builder .hint,.ledger .hint{color:#6d6d75;font-size:11px;line-height:1.5;margin:0 0 13px}
.preset-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.preset{text-align:left;background:#17171b;border:1px solid #232329;color:#c9c9d0;border-radius:8px;
  padding:7px 8px;font:inherit;font-size:11px;cursor:pointer;line-height:1.3}
.preset:hover{border-color:#33333b;color:#fff}
.preset b{display:block;font-size:11px;font-weight:600;color:#e9e9ee}
.preset span{color:#6d6d75;font-size:10px}
.axis{border-top:1px solid #1c1c20;padding-top:10px;margin-top:10px}
.axis-hd{display:flex;align-items:baseline;gap:6px;margin-bottom:6px}
.axis-hd label{font-size:11.5px;font-weight:600;color:#d6d6dc}
.axis-hd .ref{font-family:var(--mono);font-size:9.5px;color:#5a5a62;margin-left:auto}
.opts{display:flex;flex-wrap:wrap;gap:4px}
.opt{font:inherit;font-size:10.5px;line-height:1;padding:6px 8px;border-radius:6px;cursor:pointer;
  background:#17171b;border:1px solid #232329;color:#9a9aa2;white-space:nowrap}
.opt:hover{color:#e6e6ec;border-color:#33333b}
.opt[aria-pressed=true]{background:#18293c;border-color:#2f5c8c;color:#8fc4ff;font-weight:600}
.opt.warn[aria-pressed=true]{background:#2a2113;border-color:#4a381c;color:var(--not)}
.axis .note{display:block;font-size:10px;color:#5f5f67;line-height:1.45;margin-top:6px}
.axis .note b{color:var(--not);font-weight:600}
.switch{display:flex;align-items:center;gap:7px;font-size:11px;color:#9a9aa2;cursor:pointer;margin-top:11px}
.switch input{accent-color:var(--pri)}
.stage{display:flex;flex-direction:column;align-items:center;gap:13px}
.stage-bar{width:100%;display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:10px;color:#5c5c63}
.stage-bar .fill{flex:1;height:1px;background:#1d1d20}
.device{width:376px;height:812px;flex:0 0 auto;background:var(--bg);border-radius:30px;overflow:hidden;position:relative;
  border:1px solid #2a2a2f;box-shadow:0 30px 70px -20px #000,0 0 0 8px #16161a}
.lgroup{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#55555c;
  margin:13px 0 5px;padding-bottom:4px;border-bottom:1px solid #1c1c20}
.lrow{display:flex;gap:7px;padding:5px 0;font-size:11px;line-height:1.4;align-items:flex-start}
.lrow .dot{width:6px;height:6px;border-radius:50%;flex:0 0 auto;margin-top:4px}
.lrow .dot.on{background:var(--pos)}.lrow .dot.off{background:#3a3a41}
.lrow .dot.struct{background:var(--pri)}.lrow .dot.hold{background:var(--not)}
.lrow .dot.clash{background:var(--neg)}
.lrow .body{flex:1;min-width:0}
.lrow .k{color:#d0d0d6}.lrow.is-off .k{color:#6b6b73}
.lrow .why{color:#6d6d75;font-size:10px;display:block;margin-top:1px}
.lrow .why b{color:#a6a6ae;font-weight:600}
.lrow .id{font-family:var(--mono);font-size:9.5px;color:#55555c;flex:0 0 auto}

/* ============================================================
   THE PRODUCT
   ============================================================ */
.ph{font-family:var(--ui);color:var(--t-strong);font-size:13px;line-height:19px;position:relative;
  height:100%;display:flex;flex-direction:column}
.statusbar{display:flex;align-items:center;justify-content:space-between;padding:13px 19px 5px;font-size:13.5px;font-weight:600}
.statusbar .icons{display:flex;gap:4px;align-items:center}
.statusbar .icons i{display:block;background:#fff;border-radius:1px}
.navbar{display:flex;align-items:center;gap:11px;padding:9px 15px 11px}
.navbar .ttl{font-size:15px;font-weight:600;line-height:21px}
.tabs{display:flex;margin:0 15px 15px;background:var(--s2);border-radius:var(--r-full);padding:3px}
.tabs button{flex:1;font:inherit;font-size:12.5px;font-weight:500;color:var(--t-med);background:none;
  border:1px solid transparent;border-radius:var(--r-full);padding:7px 4px;cursor:pointer}
.tabs button.on{color:var(--t-strong);font-weight:600;border-color:var(--bd-mod);background:#0f0f0f}
.scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 0 22px;scrollbar-width:none}
.scroll::-webkit-scrollbar{display:none}
.sec{padding:0 15px}
.sec+.sec{margin-top:22px}
.sec-hd{display:flex;align-items:center;gap:7px;margin:0 0 9px}
.sec-hd .n{font-family:var(--mono);font-size:9.5px;color:var(--t-med);border:1px solid var(--bd-weak);border-radius:var(--r-s);padding:1px 4px}
.sec-hd h3{margin:0;font-size:15px;font-weight:600;line-height:21px;letter-spacing:-.01em}

.card{background:var(--s2);border-radius:var(--r-20);padding:14px;position:relative;overflow:hidden}
.card+.card{margin-top:10px}
.card.flat{background:none;padding:0;overflow:visible}
.hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.hd h4{margin:0;font-size:14px;font-weight:600;line-height:20px;letter-spacing:-.005em}
.hd .sub{font-size:11px;line-height:15px;color:var(--t-med);margin-top:2px}
.cap{font-size:11.5px;line-height:16px;color:var(--t-med)}
.num{font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.pos{color:var(--pos)}.neg{color:var(--neg)}.not{color:var(--not)}.pri{color:var(--pri)}
.assumed{display:inline-block;font-size:8.5px;line-height:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:var(--t-med);background:var(--s3);border-radius:3px;padding:2px 4px;vertical-align:1px}
.anno{text-align:right;font-family:var(--mono);font-size:8px;letter-spacing:.08em;
  color:#5a5a62;line-height:11px;margin:0 0 6px;pointer-events:none}
.card.flat .anno{text-align:left}
.badge-t .anno,.acard .anno{margin:0 0 5px}
.anno{display:none}
.annotate .anno{display:block}
.annotate .card.flat .anno{text-align:left}
.chev{width:16px;height:16px;flex:0 0 auto}

/* --- balance --- */
.balance{background:linear-gradient(140deg,#20241f 0%,#1c1f1d 42%,#1c1c1c 100%)}
.balance::after{content:'';position:absolute;right:-44px;top:-54px;width:180px;height:180px;border-radius:50%;
  background:radial-gradient(circle,#20f5721c,transparent 68%)}
.balance .amt{font-size:29px;line-height:34px;font-weight:500;margin:2px 0 0}
.balance .tools{position:absolute;right:14px;top:38px;display:flex;gap:7px}
.iconbtn{width:32px;height:32px;border-radius:50%;border:1px solid var(--bd-med);background:#ffffff08;display:grid;place-items:center;cursor:pointer}
.chips{display:flex;gap:6px;margin-top:11px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;
  -webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 24px),transparent 100%);
  mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 24px),transparent 100%)}
.chips::-webkit-scrollbar{display:none}
.chip{display:flex;align-items:center;gap:5px;flex:0 0 auto;padding:3px 9px 3px 3px;border-radius:var(--r-full);
  background:#ffffff0a;border:1px solid var(--bd-weak)}
.chip .lg{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;font-size:8px;font-weight:700;color:#0b0b0b}
.chip .m{font-size:11px;font-weight:500;color:var(--t-mod);white-space:nowrap;letter-spacing:-.01em}
.chip.stale{border-color:#4a381c;background:var(--not-weak)}
.chip .fd{width:5px;height:5px;border-radius:50%;background:var(--not)}
.addacct{margin-top:11px;display:inline-flex;align-items:center;gap:5px;background:var(--pri-weak);color:var(--pri);
  border:none;border-radius:var(--r-full);padding:8px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.dateline{margin-top:9px;font-size:11px;line-height:15px;color:var(--t-med)}

/* --- story rail --- */
.rail{display:flex;gap:11px;overflow-x:auto;padding:2px 15px 3px;scrollbar-width:none;margin:0 -15px}
.rail::-webkit-scrollbar{display:none}
.story{flex:0 0 auto;width:62px;text-align:center;cursor:pointer;background:none;border:none;padding:0;font:inherit}
.story .ring{display:block;width:58px;height:58px;border-radius:50%;padding:2px;margin:0 auto;
  background:conic-gradient(from 200deg,#20f572,#3cd3fe,#409dff,#cdff82,#20f572)}
.story.seen .ring{background:var(--bd-med)}
.story.nm .ring{background:conic-gradient(from 200deg,#54585c,#8b8c8c,#3a3b3c,#54585c)}
.story .inner{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:var(--bg);border:2px solid var(--bg);overflow:hidden}
.story .gl{width:100%;height:100%;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;letter-spacing:-.03em;color:#0b0b0b}
.story .lb{display:block;font-size:10px;line-height:13px;color:var(--t-med);margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.story.seen .lb{color:var(--t-dim)}

/* --- cashflow (3 bars) --- */
.periodchip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--bd-med);border-radius:var(--r-full);
  padding:6px 11px;font-size:12px;font-weight:500;color:var(--t-mod);background:none;font-family:inherit;cursor:pointer}
.chart .cols{display:flex;align-items:flex-end;gap:10px}
.col{flex:1;display:flex;flex-direction:column;align-items:center}
.col .v{font-size:11px;line-height:15px;font-weight:600;margin-bottom:5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.col .plot{width:100%;display:flex;align-items:flex-end;justify-content:center}
.bar{width:100%;max-width:52px;border-radius:9px 9px 0 0;min-height:3px;
  background-image:repeating-linear-gradient(115deg,#ffffff12 0 2px,transparent 2px 7px)}
.bar.stub{border-radius:3px;height:4px!important}
.axisline{height:1px;background:var(--bd-med)}
.names{display:flex;gap:10px;margin-top:7px}
.names span{flex:1;text-align:center;font-size:10.5px;line-height:14px;color:var(--t-med)}
.chartcap{margin-top:11px;padding-top:10px;border-top:1px solid var(--bd-weak);font-size:11px;line-height:16px;color:var(--t-med)}

/* --- the restored wireframe row --- */
.qrow{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:10px -15px 0;padding:0 15px 2px}
.qrow::-webkit-scrollbar{display:none}
.qcard{flex:0 0 auto;background:var(--s2);border:1px solid var(--bd-weak);border-radius:var(--r-16);
  padding:10px 12px;font:inherit;color:var(--t-mod);cursor:pointer;text-align:left;min-width:104px}
.qcard b{display:block;font-size:12.5px;font-weight:600;line-height:17px;color:var(--t-strong)}
.qcard span{display:block;font-size:10px;line-height:14px;color:var(--t-med);margin-top:2px}
.qcard.hot{background:linear-gradient(140deg,#16281c,#1c1c1c 75%);border-color:#20402a}

/* --- action items: compact scroll cards --- */
.arow{display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;margin:0 -15px;padding:0 15px 3px}
.arow::-webkit-scrollbar{display:none}
.acard{flex:0 0 auto;width:246px;background:var(--s2);border-radius:var(--r-16);padding:12px;position:relative}
.acard .eb{font-size:11px;font-weight:600;line-height:15px}
.acard .tt{font-size:13px;font-weight:500;line-height:18px;color:var(--t-strong);margin-top:1px}
.acard .x{position:absolute;top:9px;right:9px;background:none;border:none;color:var(--t-med);font-size:15px;line-height:1;cursor:pointer;padding:2px}
.acard .rule{height:1px;background:var(--bd-weak);margin:10px -12px 9px}
.acard .ft{display:flex;align-items:center;justify-content:space-between;gap:8px}
.acard .ft span{font-size:11.5px;line-height:16px;color:var(--t-med)}
.pill{background:var(--pri);color:#0a1524;border:none;border-radius:var(--r-full);padding:7px 15px;
  font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.pill.ghost{background:none;border:1px solid var(--bd-med);color:var(--t-mod)}
.acard .lg2{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:13px;margin-bottom:8px}

/* --- donut --- */
.donut-wrap{display:flex;align-items:center;gap:14px}
.donut{flex:0 0 auto;position:relative;width:126px;height:126px}
.donut svg{transform:rotate(-90deg);display:block}
.donut .mid{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.donut .mid b{font-size:16px;font-weight:600;line-height:20px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.donut .mid span{font-size:9.5px;line-height:13px;color:var(--t-med);margin-top:1px}
.dleg{flex:1;min-width:0}
.dleg button{display:flex;width:100%;align-items:center;gap:7px;background:none;border:none;padding:4px 0;font:inherit;cursor:pointer;text-align:left}
.dleg .sw{width:7px;height:7px;border-radius:2px;flex:0 0 auto}
.dleg .nm{flex:1;min-width:0;font-size:11.5px;line-height:16px;color:var(--t-mod);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dleg .pc{font-size:11px;line-height:16px;color:var(--t-med);font-variant-numeric:tabular-nums}
.etotal{font-size:27px;line-height:32px;font-weight:500;letter-spacing:-.02em}
.ecmp{font-size:12px;line-height:17px;color:var(--t-med);margin:3px 0 13px}
.crow{display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;padding:9px 0;font:inherit;cursor:pointer;text-align:left}
.crow+.crow{border-top:1px solid var(--bd-weak)}
.crow .sw{width:7px;height:7px;border-radius:2px;flex:0 0 auto}
.crow .nm{flex:1;min-width:0;font-size:12.5px;font-weight:500;line-height:18px;color:var(--t-mod)}
.crow .nm i{font-style:normal;color:var(--t-med);font-weight:400;font-size:11px}
.crow .am{font-size:12.5px;font-weight:600;line-height:18px;font-variant-numeric:tabular-nums}
.crow .pcs{font-size:10.5px;line-height:14px;color:var(--t-med);min-width:38px;text-align:right;font-variant-numeric:tabular-nums}
.viewall{width:100%;margin-top:11px;background:none;color:var(--pri);border:1px solid var(--bd-med);border-radius:var(--r-full);
  padding:10px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
.disclose{margin-top:12px;padding-top:10px;border-top:1px solid var(--bd-weak);font-size:10.5px;line-height:15px;color:var(--t-dim)}
.empty{font-size:12px;line-height:18px;color:var(--t-med);padding:4px 0}

/* --- emergency fund --- */
.ef .goalbar{position:relative;height:34px;border-radius:9px;background:var(--s3);overflow:hidden;margin:12px 0 7px}
.ef .goalbar i{position:absolute;left:0;top:0;bottom:0;
  background-image:repeating-linear-gradient(115deg,#ffffff14 0 2px,transparent 2px 7px),linear-gradient(90deg,#1b7a45,#20f572)}
.ef .goalbar u{position:absolute;top:0;bottom:0;width:2px;background:#fff;opacity:.7}
.ef .glab{display:flex;justify-content:space-between;font-size:11px;line-height:15px;color:var(--t-med)}
.ef .glab b{color:var(--t-mod);font-weight:600}
.ef .verdict{display:block;font-size:13px;line-height:19px;margin:11px 0 0;color:var(--t-mod)}
.ef .verdict b{color:var(--t-strong)}
.frow{display:flex;align-items:center;gap:10px;padding:9px 0;width:100%;background:none;border:none;font:inherit;cursor:pointer;text-align:left}
.frow+.frow{border-top:1px solid var(--bd-weak)}
.frow .fl{width:30px;height:30px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;
  font-size:11px;font-weight:700;color:#fff;letter-spacing:-.02em}
.frow .fm{flex:1;min-width:0}
.frow .fm b{display:block;font-size:12.5px;font-weight:600;line-height:17px;color:var(--t-strong);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.frow .fm span{display:flex;align-items:center;gap:5px;font-size:10.5px;line-height:15px;color:var(--t-med);margin-top:1px}
.frow .st{background:var(--pos-weak);color:var(--pos);border-radius:3px;padding:1px 4px;font-size:9px;font-weight:600}
.frow .fr{text-align:right;flex:0 0 auto}
.frow .fr b{display:block;font-size:12.5px;font-weight:600;line-height:17px;color:var(--pos);font-variant-numeric:tabular-nums}
.frow .fr span{display:block;font-size:9.5px;line-height:13px;color:var(--t-med)}
.fundhd{font-size:11px;line-height:15px;color:var(--t-med);margin:13px 0 2px;padding-top:12px;border-top:1px solid var(--bd-weak)}

/* --- top merchants --- */
.mrow{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:2px 14px 4px}
.mrow::-webkit-scrollbar{display:none}
.mtile{flex:0 0 auto;width:66px;background:none;border:none;padding:0;font:inherit;cursor:pointer;text-align:center}
.mtile .ml{width:46px;height:46px;border-radius:50%;margin:0 auto;display:grid;place-items:center;
  font-size:12px;font-weight:700;color:#fff;letter-spacing:-.02em;border:1px solid #ffffff14}
.mtile .mn{display:block;font-size:10.5px;font-weight:500;line-height:14px;color:var(--t-mod);margin-top:6px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mtile .ma{display:block;font-size:10px;line-height:13px;color:var(--t-med);font-variant-numeric:tabular-nums}
.mtile .lst{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--pos);vertical-align:1px;margin-right:3px}

/* --- compact nudge --- */
.nz{padding:13px 14px}
.nz .eb{font-size:9.5px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--t-med);margin-bottom:5px}
.nz h4{margin:0 0 4px;font-size:14px;font-weight:600;line-height:20px;letter-spacing:-.01em}
.nz p{margin:0;font-size:12px;line-height:17px;color:#b3b4b6}
.nz .ctas{display:flex;gap:7px;margin-top:11px}
.nz.warm{background:linear-gradient(140deg,#2b231a,#1c1c1c 70%)}
.nz.good{background:linear-gradient(140deg,#16281c,#1c1c1c 70%)}
.nz.cool{background:linear-gradient(140deg,#1a2534,#1c1c1c 70%)}
.mini{height:6px;border-radius:var(--r-full);background:var(--s3);overflow:hidden;margin:10px 0 6px;display:flex}
.mini i{display:block;height:100%}
.mini .a{background:linear-gradient(90deg,#409dff,#3cd3fe)}
.mini .b{background:linear-gradient(90deg,#20f572,#91ffbb)}
.mlg{display:flex;justify-content:space-between;font-size:10.5px;line-height:14px;color:var(--t-med)}

/* --- badges --- */
.badges{display:flex;gap:10px}
.badge-t{flex:1;background:var(--s2);border-radius:var(--r-20);padding:13px;min-height:118px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.badge-t.hot{background:linear-gradient(150deg,#16281c,#1c1c1c 68%)}
.badge-t .big{font-size:23px;line-height:27px;font-weight:600;letter-spacing:-.02em}
.badge-t .c2{font-size:11px;line-height:15px;color:var(--t-mod);margin-top:3px}
.badge-t .ft2{margin-top:auto;padding-top:9px;font-size:10px;line-height:14px;color:var(--t-med)}
.badge-t .lb2{height:4px;border-radius:var(--r-full);background:var(--s3);overflow:hidden;margin:8px 0 5px}
.badge-t .lb2 i{display:block;height:100%;background:linear-gradient(90deg,#409dff,#3cd3fe)}
.badge-t .g2{width:26px;height:26px;border-radius:50%;background:var(--s3);display:grid;place-items:center;font-size:12px;margin-bottom:7px}
.homebar{width:104px;height:4px;border-radius:4px;background:#fff;opacity:.8;margin:12px auto 8px}

/* --- budget + badge pair --- */
.pair{display:flex;gap:10px;margin-top:10px}
.pcard{flex:1;min-width:0;background:var(--s2);border:1px solid var(--bd-weak);border-radius:var(--r-20);
  padding:12px;font:inherit;color:var(--t-mod);cursor:pointer;text-align:left;position:relative;overflow:hidden}
.pcard .plab{font-size:10px;line-height:14px;color:var(--t-med);letter-spacing:.02em}
.pcard .pval{font-size:17px;line-height:23px;font-weight:600;color:var(--t-strong);margin-top:2px;
  font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.pcard .pbar{height:5px;border-radius:var(--r-full);background:var(--s3);overflow:hidden;margin:9px 0 6px;position:relative}
.pcard .pbar i{position:absolute;left:0;top:0;bottom:0;border-radius:var(--r-full)}
.pcard .pst{font-size:10.5px;line-height:14px}
.pcard .cta2{font-size:12px;line-height:17px;font-weight:600;color:var(--pri);margin-top:9px}
.pcard.badge{background:linear-gradient(160deg,#17302c 0%,#1b2422 55%,#1c1c1c 100%);border-color:#20403a;
  display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center;padding:11px 10px 12px}
.pcard.badge svg{display:block;margin:0 auto 7px}
.pcard.badge .tier{display:inline-block;background:#2f6f63;color:#d9fff5;border-radius:6px;
  padding:3px 9px;font-size:10px;font-weight:700;letter-spacing:.1em}
.pcard.badge .who{font-size:11.5px;line-height:16px;font-weight:600;color:var(--t-strong);margin-top:7px}
.pcard.badge .whos{font-size:9.5px;line-height:13px;color:var(--t-med);margin-top:1px}

/* --- bottom sheet --- */
.sheet{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;justify-content:flex-end;background:#000000a6}
.sheet .panel{background:#1a1a1a;border-radius:22px 22px 0 0;padding:10px 15px 20px;border-top:1px solid var(--bd-med)}
.sheet .grab{width:38px;height:4px;border-radius:4px;background:var(--bd-med);margin:0 auto 14px}
.sheet h4{margin:0;font-size:17px;font-weight:600;line-height:23px;letter-spacing:-.01em}
.sheet .sh{font-size:12px;line-height:17px;color:var(--t-med);margin:5px 0 16px}
.sheet .amt2{font-size:32px;line-height:36px;font-weight:500;letter-spacing:-.025em;font-variant-numeric:tabular-nums;
  border-bottom:1.5px dashed var(--bd-med);display:inline-block;padding-bottom:4px}
.sheet .qch{display:flex;gap:7px;margin:16px 0 0;overflow-x:auto;scrollbar-width:none}
.sheet .qch::-webkit-scrollbar{display:none}
.sheet .qch button{flex:0 0 auto;background:var(--s3);border:1px solid var(--bd-weak);color:var(--t-mod);
  border-radius:var(--r-full);padding:8px 12px;font:inherit;font-size:11.5px;cursor:pointer;text-align:left;line-height:15px}
.sheet .qch button b{display:block;font-size:12.5px;font-weight:600;color:var(--t-strong)}
.sheet .qch button.on{border-color:var(--pri);background:var(--pri-weak)}
.sheet .note2{font-size:11px;line-height:16px;color:var(--t-dim);margin:16px 0 14px;padding-top:13px;border-top:1px solid var(--bd-weak)}
.sheet .pill{width:100%;padding:13px;font-size:14px}
.sheet .later2{width:100%;background:none;border:none;color:var(--t-med);font:inherit;font-size:12.5px;
  padding:11px 0 0;cursor:pointer}

/* --- story viewer --- */
.viewer{position:absolute;inset:0;background:#0b0b0c;z-index:40;display:flex;flex-direction:column}
.viewer .segs{display:flex;gap:3px;padding:12px 12px 0}
.viewer .segs i{flex:1;height:2.5px;border-radius:2px;background:#ffffff2e;overflow:hidden}
.viewer .segs i.done{background:#fff}
.viewer .segs i.now::after{content:'';display:block;height:100%;width:55%;background:#fff}
.viewer .vh{display:flex;align-items:center;gap:9px;padding:12px 14px 0}
.viewer .vh .gl{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;color:#0b0b0b}
.viewer .vh .vt{flex:1;min-width:0}
.viewer .vh .vt b{display:block;font-size:12.5px;font-weight:600;line-height:17px}
.viewer .vh .vt span{display:block;font-size:10px;line-height:13px;color:var(--t-med)}
.viewer .vx{background:none;border:none;color:#fff;font-size:19px;line-height:1;cursor:pointer;padding:2px 4px;opacity:.8}
.viewer .vbody{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 22px;position:relative}
.viewer .vk{font-size:10px;font-family:var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--t-med);margin-bottom:10px}
.viewer .vbig{font-size:38px;line-height:42px;font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.viewer .vsub{font-size:14px;line-height:21px;color:var(--t-mod);margin-top:11px}
.viewer .vmeta{margin-top:16px;padding-top:13px;border-top:1px solid #ffffff1a;font-size:11.5px;line-height:17px;color:var(--t-med)}
.viewer .vft{padding:16px 16px 26px}
.viewer .vft .pill{width:100%;padding:13px;font-size:14px}
.viewer .vnone{font-size:11.5px;line-height:16px;color:var(--t-med);text-align:center;padding:6px 10px 0}
.viewer .taps{position:absolute;inset:0;display:flex}
.viewer .taps button{flex:1;background:none;border:none;cursor:pointer}
.viewer .glow{position:absolute;inset:0;pointer-events:none}
`
