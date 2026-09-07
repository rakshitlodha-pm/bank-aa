# Insights Tab — Product Requirements

**Owner:** Rakshit Lodha (PM) · **Surface:** Paytm Money app, Insights tab
**Status:** Section-by-section spec. One decision open (§13.1).
**Reference screens:** `screens.html` (8 full screens) · `case-nudges.html` (14 nudge frames)
**Evidence base:** `bankaadump8527379520.json` — one consented AA deposits dump
**Source wireframes:** `Wireframes/` — four hand sketches by Rakshit, indexed in §1.2

---

## 1. What this is

The **Insights tab** is one of three tabs — Insights / Transactions / My accounts — driven by consented Account Aggregator bank data.

**Graded on engagement and retention first, AUM second.** The numbers are the reason people open the tab; conversion is the second-order effect, not the brief. Any decision in this document that trades legibility for conversion should be read against that ordering.

### 1.1 The three things that make this hard

| | |
|---|---|
| **Most money cannot be named** | On the reference dump, 67% of a month's outflow is money we can count but not identify — a credit-card bill with no merchant behind it, a mandate behind a payment gateway, and transfers to people. The merchant list works on the remaining third. |
| **There is no feedback loop** | Categories are engine-derived only. The user cannot correct a row. Categorisation quality is therefore a **launch gate, not a feedback loop** — every category number is our claim alone. |
| **Every user is a thin-data user some of the time** | On the 2nd of a month, a user with 13 months of history and 24 matched brands has 9 transactions, 2 categories and 0 matched merchants. The thin-data fallbacks are load-bearing for everyone, roughly a third of the days in a month. |

### 1.2 Source wireframes

Four hand sketches, all dated 7 Sep 2026, in `Wireframes/`. Everything specified below traces back to one of them.

| File | What it establishes | Specified in |
|---|---|---|
| `Wireframes/WhatsApp Image 2026-09-07 at 12.45.15 PM.jpeg` | Total balance with per-bank chips and `+ Add More`; the **"How your money moves?"** four-bar chart (Money In / Money Invested / Your Expenses / Savings) with a `Last 30 days` chip; `Set your Budget`; a `Great job you're a top investor!` badge; `ICICI Bank A/c, out of sync — Fix Now` | §5.1, §5.3, §5.4, §7, §8.2 |
| `Wireframes/WhatsApp Image 2026-09-07 at 12.45.30 PM.jpeg` | **"Your Expenses Breakdown"** and expense categorisation as a pie (Travel 28% · Subscription 40% · Rent 10% · Others 22%); the emergency-fund bar at ₹5,00,000 with `Shortfall: ₹3,00,000` and `Invest Now` | §6.1, §6.2, §7.1 |
| `Wireframes/WhatsApp Image 2026-09-07 at 12.45.42 PM.jpeg` | **"Some other Interesting Insights"** as a row of circles (Blinkit, Travel, +1) annotated *"This can come on top"* — the story rail; **"You v/s Paytm Money"** as two badge tiles (`Top 3% of Paytm Money Investors`, `Top 1% of Travellers`) | §5.2, §8.2, §9.4 |
| `Wireframes/WhatsApp Image 2026-09-07 at 1.31.53 PM.jpeg` | The **credit-card L2**: `You spent ₹1.5L on credit cards`, then per-issuer rows (`SBI ↗ ₹50,000`, `ICICI ↗ ₹1L`), then `View CC Stocks` | §9.2 |

### 1.3 Where the build departed from the wireframes, and why

| Wireframe showed | Now specified as | Reason |
|---|---|---|
| `Set your Budget` (12.45.15) | **No budget at all** — engine-derived nudges only (§6.3, §7) | A budget the user sets is a target they can fail, mute and abandon. Nudges measured against the user's own median need no configuration and cannot be gamed by raising the number. |
| Expense categorisation as a **pie** (12.45.30) | **Ranked horizontal bars** (§6.2) | On the reference dump the top category is 40.6% and the 12th is 1.2%. A pie cannot render that range legibly, and bars sort by size, which is the question the user is actually asking. |
| `Savings` as the fourth bar (12.45.15) | **`Left over`**, allowed to go negative below the axis (§5.3) | On the reference dump the figure is −₹40,558. Calling a negative number "savings" is wrong; *Left over* survives the sign. |
| `Invest Now` on the emergency fund (12.45.30) | **`Explore`** until holdings exist (§12.1) | The engine cannot yet say "you already own this", so a buy button can tell someone to buy a fund they already hold. |
| Story circles **on top** (12.45.42, annotated) | Below the balance card, above the chart (§5.2) | Kept close to the annotation, but the rail is the most merchant-dependent element on the page. It only earns that position because of the never-empty floor in §5.2. |

---

## 2. Scope

### 2.1 In scope
- One scrolling page, three sections, fixed order
- Engine-derived nudges (no user configuration of any kind)
- L2 drill-downs per category, per story, per badge
- Period selection (this month / last complete month / 3 / 6 / 12 months)

### 2.2 Explicitly out of scope
| Not building | Why |
|---|---|
| **User-set budgets** | Reversed. The engine nudges; the user configures nothing. See §7.3. |
| **User tagging / category correction** | Reversed 7 Sep 2026. Would make the Section 3 spending percentile incoherent — it would compare our taxonomy to theirs. |
| **A system-states layer** | No card announcing a suppressed category, no "tag it yourself" prompt, no "money we cannot name" card. The last of these is an engine diagnostic; it belongs in threshold tuning, never on a user's screen. |
| **Card-statement data** | A separate AA data type. Sets the ceiling on merchant coverage for heavy card users. |
| **Performance figures** | Live prices are not modelled. Nothing anywhere says "you would have made X". |
| **Buy buttons** | Blocked until holdings exist — see §12.1. |

---

## 3. Architecture

### 3.1 One page, three sections, in this order

1. **Your bank** — universal. Nothing here needs a merchant match.
2. **Your expenses** — where the commercial payload lives.
3. **You vs Paytm Money** — cohort comparison. Needs no AA consent at all.

There is **no fourth section**.

### 3.2 Structure vs slots — the core mechanism

There is **no persona branching anywhere.**

**Structural components always render.** They are the page, not candidates for it: the balance card, the story rail, the cashflow chart, the expense breakup, the ranked category list, the badge row, partial-period handling.

**Ranked slots compete for space.** One fixed list, evaluated in the same order for every user. The page is whatever survives the thresholds.

A thin-data user loses the merchant-dependent slots and still has roughly seven insights left. That is the whole fallback story; it needs no separate design.

### 3.3 What varies between users

Every difference between the eight reference screens is a threshold met or missed — never a branch on who the user is:

- The story rail loses merchant bubbles and falls back to non-merchant ones
- The cashflow chart gains or loses a negative *Left over*
- The category list runs from 7 rows to 15
- The nudge stack runs from one card to three, always in the same order
- The badge row degrades comparative → non-comparative → locked

### 3.4 Test fixtures, not variants
The four data-richness personas (Rich / Dense-but-anonymous / Typical / Thin) survive as **test fixtures only**. Use them to check what a page degrades to. They are not page variants and must not appear in code as branches.

---

## 4. Data foundation

### 4.1 Definitions — these must be implemented exactly

| Term | Definition | Reference value |
|---|---|---|
| **Rail** | Derived from the **narration prefix**, never from `mode`/`txnMode` | — |
| **Investment outflow** | Narration matches a broker or mandate rail (RAZORPAY, ETMONEY, INDMONEY, ZERODHA, GROWW, …) | ₹1,45,335 in Aug |
| **Expenses** | Gross debit outflow **minus** investment outflow **minus** transfers between the user's own linked accounts. Credit-card bill payments **are** expenses. | ₹3,12,581 in Aug |
| **Median month** | Median monthly expenses over the last **6 complete months** | **₹2,06,592** |
| **Cover target** | 6 × median month | **₹12,39,554** |
| **Liquid balance** | Sum of balances across linked deposit accounts | ₹13,55,326 |
| **Period** | The chip the user selected | — |

### 4.2 Why the 6-month window and not 12

| Anchor | Value | Months the user exceeds it |
|---|---|---|
| 12-month median | ₹1,21,924 | **6 of 12** |
| 6-month median | ₹2,06,592 | 3 of 12 |

Spending stepped up mid-year — ₹74,601 in March against ₹4,79,465 in July. A 12-month anchor understates current commitments, and a comparison the user fails half the time is noise. This is the same failure mode as sizing a goal on a trailing average, which understated this user's rent commitment by 69%.

### 4.3 The eligibility rule

> **Eligibility looks back 12 months. The displayed figure respects the selected period.**

One rule, and it does most of the work of the entire fallback story. It is why a merchant insight reads "₹1,21,600 over the year" on the 2nd of a month instead of vanishing.

### 4.4 Comparison rules

- **Compare to a median, never to last month.** One bonus month poisons every month-on-month comparison for a year. Month-on-month may exist as a secondary view only.
- **Partial periods compare like-for-like** — the same N days of the median month, never against a whole one.
- **Never say "almost certainly."** If the engine cannot name a flow, it counts the money and leaves it unnamed. Never infer intent from a counterparty string.

### 4.5 Traps found by breaking on them

| Trap | Consequence for the build |
|---|---|
| `mode`/`txnMode` captures ~9% of real UPI traffic | Always derive the rail from the narration prefix |
| `merchantName` is ~86% populated but mixes people, self-transfers and payment aggregators; only ~16% of outflow is a genuine commercial merchant | Merchant resolution needs its own list; the field is a hint, not an answer |
| "Money out" is not "expenses" — ~63% of gross outflow is investments and transfers | See the definition in §4.1 |
| **The bank's own labels are wrong.** A ₹22,178 credit-card payment to Aditya Birla was tagged *income tax*, two minutes from its ₹8,219 twin that was tagged correctly. A ₹6,360 SBI EMI, identical for 13 months, was also tagged as income tax. | Never trust `category` from the FIP |
| **Two card statements can land in one calendar month.** August held ₹1,05,164 on the 1st and ₹21,656 on the 31st. | A hot-month nudge must detect and name this, or it accuses the user of doubling their spending |
| Rent is detectable without a merchant: stable payee, paid 1st–7th, preceded by a lump sum at a near-integer multiple | Rent must be split out of People & transfers |
| Account metadata is a cheap unused signal — a branch field reading "Indmoney" identifies what an account is for | Use it before matching strings |

### 4.6 Honesty about the evidence

**One user is one user.** Every coverage percentage derived from this dump is a target, not a measurement, and every threshold in §11 is a first guess that needs tuning against real traffic. Say so whenever one is quoted.

Anything that could only come from a cohort must be labelled **assumed**, and nothing else on the page may read from it. Three figures qualify: the investing percentile, the ₹18,400 band median, and the 1,340 connected-account count.

PII in the source file (PAN, date of birth, address, email, mobile) must be excluded from every output, and counterparty names must be initialled before display.

---

## 5. Section 1 — Your bank

Universal. Nothing in this section needs a merchant match, so it renders identically for the richest and thinnest user.

### 5.1 Card — Balance

**Purpose:** the number the user came for.
**Inputs:** linked account balances, sync status, account metadata.
**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.15 PM.jpeg` — the top card, ₹11,00,000 over `ICICI` / `Axis` / `+ Add More`.

| State | Trigger | Behaviour |
|---|---|---|
| **Default** | ≥1 account synced | Total balance, account chips (bank + masked last 4), `+ Add account` |
| **Single account** | exactly 1 linked | Same, one chip. No degradation. |
| **Hidden** | user tapped the eye | Figures masked, chips remain. Persists across sessions. |
| **Stale** | any account past its refresh window | Chip for that account marked stale; total annotated with the last-refreshed date |
| **Consent expired** | FIP consent lapsed | Balance still shown at last known value, explicitly dated. Triggers the action item in §5.4. |

**Edge cases**
- More than 4 accounts: chips scroll horizontally; never wrap to a third row.
- A ₹39 account still gets a chip. Do not hide small accounts — the Federal account in the dump exists to fund an investing app, which is itself a signal.

### 5.2 Card — Story rail

**Purpose:** the merchant payload, in the highest real estate on the page. Instagram/Snap grammar: gradient ring for unseen, flat grey once read, segment bars, tap to advance, swipe down to dismiss.

**Position:** below the balance card, above the cashflow chart.
**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.42 PM.jpeg` — the row of circles under *"Some other Interesting Insights"*, annotated *"This can come on top"*. See §1.3 for why it sits below the balance card instead.

| State | Trigger | Behaviour |
|---|---|---|
| **Unseen** | slot fired this period, not opened | Gradient ring |
| **Seen** | opened | Flat grey ring. **Does not reorder** — a rail that reshuffles between sessions destroys the muscle memory the pattern is borrowed for. |
| **Non-merchant fallback** | fewer than 3 merchant stories qualify | Grey-gradient ring; content from balance/history alone (idle cash, your year, your rent, an upcoming EMI) |
| **Minimum floor** | any user | **The rail must never render empty.** The last two slots are reserved for insights that fire on balance and history alone. |

**Hard requirement:** the rail's ability to fill without merchant data is what buys it the position above the cashflow chart. If the floor is not implemented, the rail moves below the expense breakup.

**Story content rules**
- A story may end with **no action**. If every bubble routes to a buy, the rail becomes advertising and the tab stops being worth opening.
- No performance figures inside a story.
- Sector stories must word the claim weakly: the user is MakeMyTrip's customer, not ixigo's.

### 5.3 Card — Cashflow chart

**Purpose:** the money component. Four bars: In, Invested, Spent, Left over.

**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.15 PM.jpeg` — *"How your money moves?"*, four bars labelled Money In / Money Invested / Your Expenses / Savings, with a `Last 30 days` chip. The fourth bar is renamed *Left over* here (§1.3).

**Scale:** one scale, set by the largest of the four values in the period. Every label names a value the chart reaches.

| State | Trigger | Behaviour |
|---|---|---|
| **Complete period** | period has ended | Four bars, all labelled |
| **Negative Left over** | in − invested − spent < 0 | Bar renders **below the axis**, rounded on the bottom, labelled with the negative figure. Shown plainly. |
| **Partial period** | period still running | *Left over* is **withheld and labelled**, not shown as a true-but-useless negative. Caption states days elapsed and when income normally arrives. |
| **Zero income in period** | no credit yet | In renders as a labelled stub at ₹0. Do not hide the bar. |
| **Outlier period** | one value ≥ 3× the next largest | Keep the true scale. Add a caption naming the outlier. Do not clip the bar or drop the month — that would hide the most consequential event in the user's year. |

**Reference:** August reads In ₹4,17,358 · Invested ₹1,45,335 · Spent ₹3,12,581 · Left over **−₹40,558**. The negative is real: the card bill and the mandate both cleared on the 1st and salary did not land until the 31st.

### 5.4 Card — Action items

**Purpose:** a thin rail of things only the user can fix. Both current items are data-quality asks; they earn the interruption because they make every other number on the page better.

**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.15 PM.jpeg` — `ICICI Bank A/c, out of sync` with `Fix Now`. The external-mutual-funds item was added in discussion, not sketched.

| Item | Trigger | Copy requirement | States |
|---|---|---|---|
| **Account out of sync** | consent expired or refresh window passed | Must name the stake in the user's own numbers — *"96% of your ₹13,55,326 balance is in this account"* — not just "out of sync" | Default · Fixing · Fixed · Dismissed-for-session |
| **Track external mutual funds** | investment outflow detected with no matching holdings | Must state what we know and refuse to name it: money leaves on the 1st against a gateway narration, same reference monthly. That is all. | Default · In progress · Imported · Dismissed |

**Rules**
- `Later` hides for the session only. Both items return, because every figure on the page is wrong while they are true.
- The external-funds item is the **highest-leverage item on the page**: it is how holdings arrive, and holdings gate every buy button (§12.1).

---

## 6. Section 2 — Your expenses

### 6.1 Card — Expense breakup

**Purpose:** the period total, compared to the user's own median.
**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.30 PM.jpeg` — *"Your Expenses Breakdown"*.

| State | Trigger | Behaviour |
|---|---|---|
| **Default** | complete period | Total + comparison to median month + top 4 categories + `View all N` |
| **Hot** | ≥ 1.25 × median month | Total, multiple, and — where one category explains the excess — that sentence |
| **Cheap** | ≤ 0.75 × median month | Total, multiple, and the reason for the gap where one exists |
| **Partial** | period still running | Compared to **the same N days** of the median month, never to a whole one |
| **No expenses yet** | period has none | Total ₹0, category list replaced by one line stating the period is empty |

### 6.2 Card — Ranked category list

**Purpose:** where the money went, ordered by size.
**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.30 PM.jpeg` — *"Expense Categorisation"*, drawn as a pie. Specified as ranked bars instead; reasoning in §1.3.

**Bars** are scaled to the **largest category**, not to total spend, so the smaller rows stay readable next to a 40%+ first row. The percentage beneath each row is share of period spend.

| State | Trigger | Behaviour |
|---|---|---|
| **Default** | ≥ 1 category | Top 4 shown, rest behind `View all N` |
| **Few categories** | < 4 categories | Show all. No placeholder rows. |
| **Sensitive category present** | category on the blocklist | Shows its **real number in its true rank**. No celebratory frame, no button, no explanation of the suppression. |
| **Every row tappable** | always | Opens the category L2 (§9.2) |

**Required disclosure:** the list must carry one line stating that categories are worked out by us and cannot be corrected by the user. This is the price of §2.2 and it belongs where the user notices a wrong row.

### 6.3 The nudge stack

Nudges replace the budget entirely. **The engine decides what to say; the user configures nothing.** Nudges render in fixed rank order, roughly three per section with the rest behind an expander (§13.2).

Universal nudge rules:

1. Everything is measured against the user's **own median month**. Never last month, never a target the user picked.
2. **A nudge may have no ask.** Three of the fourteen reference frames carry no button. If every card ends in a purchase the tab reads as an ad break.
3. **Every nudge names its cause** when the engine honestly knows it, and stays silent about cause when it does not.
4. **Credit before instruction.** Where there is genuine progress, state it before the ask.
5. **No verdict before day 8** of a period. See §7.4.
6. Sensitive categories never produce a nudge (§13.1).

---

## 7. Nudge families — every card, every state

### 7.1 Family A — Emergency fund

**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.30 PM.jpeg` — the ₹5,00,000 bar with `Shortfall: ₹3,00,000` and `Invest Now`. That sketch is state **A2** below; the other four states were derived from it.

**This family speaks in every situation, including when the fund is finished.** The situation changes the tone and the destination of surplus money, never whether we speak.

| State | Trigger | Headline shape | Action |
|---|---|---|---|
| **A1 · Nothing set aside** | cover < 1 month | *"You have about N days of cover"* | A starting amount — `round(median × 2.5%)` to nearest ₹500 — **not** the target. A user four days from zero cannot act on ₹12,39,554. |
| **A2 · Short** | 1 ≤ cover < 5 months | *"You are ₹X from six months of cover"* | Monthly figure = `shortfall ÷ 24`. Always framed over two years, never as a lump. |
| **A3 · Nearly there** | 5 ≤ cover < 6 months | *"One more month and you are covered"* | Positive card. States a date derived from the **observed** 3-month rate of change. The only forecasting state, and only because there is a measured rate to forecast from. |
| **A4 · Covered** | cover ≥ 6 months, surplus < 3 × median month | Praise first and specifically, then the surplus | Route to **arbitrage or liquid**. Name what the surplus currently earns in savings interest — that is more persuasive than a projection and needs no forward figure. |
| **A5 · Covered, large surplus** | cover ≥ 6 months, surplus ≥ 3 × median month | *"You are covered N months over"* | Route to **index funds / ETFs**, plus a "keep ₹X liquid" option so the nudge never implies emptying the buffer |

**Explicitly rejected:** an earlier draft stayed silent when the surplus was under 1× a month. That was wrong. A finished emergency fund is the best news the tab has, and it must always be said.

**Reference case:** the dump user holds ₹13,55,326 against a ₹12,39,554 target — 6.6 months, surplus ₹1,15,772 (0.56× a month), earning about ₹3,400 a year. State A4, routed to arbitrage.

### 7.2 Family B — Investing that slipped

| State | Trigger | Behaviour |
|---|---|---|
| **B1 · Level fell** | median investment of last 3 months is >15% below the median of the prior 9 | Quote `Σ (old level − actual)` across **every** month since the drop, so a pause and a step-down are one number. Second button is **"₹X is right for now"** — a real dismissal, not a snooze, because some step-downs are deliberate and the engine cannot tell. |
| **B2 · Never started** | zero investment outflow in 12 months **and** median leftover > 10% of income | Must hedge: *"some of it may be invested somewhere we cannot see."* Deposits data cannot see a direct-plan investor, and a confident "you invest nothing" to someone who does is unrecoverable. Second action routes to the external-holdings import — the only thing that can prove the nudge wrong. |
| **B3 · Steady** | ran ≥ 6 consecutive months with < 5% variation | Positive, **no button**. Exists so the family is not exclusively bad news. |

**Reference case:** the mandate ran ₹2,05,000 for eight months, paused in May (₹1,000) and June (₹20,000), then resumed at **₹1,45,000 and stayed there**. Against the old rate, ₹5,09,899 not invested — ₹3,90,000 from the pause and ₹1,19,899 from the quiet step-down. A missed-SIP alert would have reported "2 months missed" and been wrong.

### 7.3 Family C — Expenses running hot

Nothing in this family is measured against a number the user chose.

| State | Trigger | Behaviour |
|---|---|---|
| **C1 · Hot** | period spend ≥ 1.25 × median month | Before speaking, check whether a **single category** explains the excess. If one does, that sentence replaces the generic one. |
| **C2 · Cheap** | period spend ≤ 0.75 × median month | Positive, **no button**. Names the reason for the gap where one exists — praising someone because a bill simply did not arrive teaches them to distrust the next compliment. |
| **C3 · Partial** | before day 8 of the period | **No verdict.** Show composition — committed vs discretionary — which is true on every day of every month. |

**Reference case:** August at ₹3,12,581 is 1.5× the median month, and the cause is two card statements in one calendar month. Without that second sentence, the honest conclusion from ₹3,12,581 is "I overspent badly", which is not what happened. **This is the frame that most needs the engine to be right; naming the wrong cause is worse than saying nothing.**

### 7.4 Why pacing cannot be linear — the evidence behind C3

Share of a month's expenses already gone by the **end of day two**, across the last 12 months of the dump:

| | | | | | | | | | | | |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 21.3% | 9.3% | 8.7% | 0.7% | 1.2% | 25.6% | 10.4% | 0.5% | 3.1% | 0.3% | 1.1% | **54.4%** |

- Median: **5.9%** · linear assumption: **6.7%**
- The median almost exactly matches the straight line, which is what makes the rule dangerous: it looks correct on average and is wrong in the two months that matter.
- A linear pace rule would have declared a **12× overspend on 1 August** and a **22× underspend in June**.

**Requirement:** no pace verdict before day 8. After day 8, compare against the same N days of the median month, never against a fraction of the period budget.

### 7.5 Family D — Recurring load

| State | Trigger | Behaviour |
|---|---|---|
| **D1 · Subscriptions** | ≥ 3 merchants recurring in ≥ 3 of the last 6 months | Report **yearly**. ₹3,441 a month is ignorable; ₹41,294 a year is a decision. Must state explicitly that there is nothing to buy where no listed parent exists. |
| **D2 · Frequency** | one merchant with ≥ 40 payments in 12 months **and** average ≤ ₹500 | Reports a **count**, not a spend. Strictly factual, no tone, no judgement about the merchant. |

**Reference case:** 12 recurring services, ₹41,294 over the year, none with a listed Indian parent. Astrotalk took **74 payments** averaging ₹250 — more separate payments than any other merchant including Blinkit, and a figure that would never rank in a category list.

### 7.6 Family E — Held by rule

| State | Trigger | Behaviour |
|---|---|---|
| **E1 · Sensitive category** | category ∈ {health, gambling, penalties, welfare, insurance} | Keeps its real number in every total and every ranked list. Excluded from nudges, celebratory framing and buy buttons. **Silently** — no card announces the suppression. |

**The cost, stated so the decision can be made on evidence:** on the dump this category is ₹38,293, sits 3rd in the ranked list, and has two perfectly good listed companies behind it (Apollo, Global Health). It gets nothing.

---

## 8. Section 3 — You vs Paytm Money

**Needs no bank consent from anyone.** Paytm Money already knows how millions of people invest, which makes this both the cheapest section to build and the reason to connect an account at all.

### 8.1 The growth loop
**The comparison is the reason to connect a bank account.** The consent screen leads with *"see where you stand"*, not *"see your expenses"*, and Section 3 pays for its own cohort.

### 8.2 Card — Badge tiles

| State | Trigger | Behaviour |
|---|---|---|
| **Comparative** | cohort exists for this metric | Percentile + the cohort median. Every figure marked **assumed**. |
| **Non-comparative** | no cohort available | Degrades to a streak true of one person — *"10 of 12 months on time"*. **Does not invent a percentile and does not disappear.** |
| **Locked** | fewer than 5,000 connected accounts | States the threshold and shows progress against it. This tile is the argument for connecting an account, so it should look like it is filling up. |
| **Not yet applicable** | user has no investing history | Locked variant: *"starts once you make a first investment"* |

**Wireframe:** `Wireframes/WhatsApp Image 2026-09-07 at 12.45.42 PM.jpeg` — *"You v/s Paytm Money"* as two tiles, `Top 3% of Paytm Money Investors` and `Top 1% of Travellers`. The second is a spending-cohort claim and therefore starts **locked** (§11, the 5,000-account gate).

**Badge L2 requirement:** tapping a badge must answer *compared to whom* without being asked — the user's figure, the cohort median, the band, the cohort size, and the window. A percentile nobody can interrogate is just a compliment, and the first support ticket will ask exactly this.

---

## 9. L2 / L3 screens

### 9.1 Shape
Every drill-down has the same three-part shape: **your number → the breakdown → the route out.** What fills the middle depends on what the data can carry.

### 9.2 Category L2

| Case | Middle section | Route out |
|---|---|---|
| **Merchant with listed parent** | Merchant breakdown | The parent's stock page |
| **Merchant, no listed parent** (Travel → MakeMyTrip) | Merchant breakdown | **Sector sheet**, worded as the weaker claim |
| **No merchant at all** (Credit card bills) | **The issuers you actually pay**, each with its 12-month figure and an outbound ↗ to its listed parent | Sector sheet for the wider set |
| **No merchant, no sector** (People & transfers) | Payee count and largest payees, initialled | **None.** Nobody is a listed company, and we will not guess why money went to a person. |
| **Sensitive** (Health) | Sub-breakdown only | **None.** No comparison, no suggestion, no button. |

**Wireframe for the credit-card case:** `Wireframes/WhatsApp Image 2026-09-07 at 1.31.53 PM.jpeg` — `You spent ₹1.5L on credit cards`, per-issuer rows with outbound arrows (`SBI ↗ ₹50,000`, `ICICI ↗ ₹1L`), then `View CC Stocks`. Built as specified; the reference dump supplied three issuers rather than two.

**Credit card L2 — required content.** This is the largest category on the reference dump (₹1,26,820, 40.6%) and the one we know least about. It must state plainly that we can see the bill and not what is inside it, and it must surface all three issuers using the 12-month eligibility rule: ICICI ₹3,17,971, Aditya Birla ₹30,397, and an auto-debiting card ••7465 at ₹24,673 whose issuer the narration never names.

### 9.3 Sector sheet
A bottom sheet, not a page, until a sector needs filters or more than ~6 names.
**Ordering is the whole idea:** companies whose bills the user actually pays rank above companies merely in the sector, each carrying its own rupee figure. That is the difference between an insight and a stock list.

### 9.4 Story L2/L3
Full-screen story with segment progress. Stock destinations use the existing stock page. Sector destinations open the sheet in §9.3.

---

## 10. Copy rules

1. Write from the user's side of the screen. Name things by what people recognise.
2. **Never "almost certainly."** The largest single line in this user's outflow (₹1,45,000 monthly against `ACH/RAZORPAY PAYMENTS PV`) is almost certainly the same mandate that moved from another app in February. We do not say so. It is counted as investment and left unnamed.
3. Breach and overspend copy is **factual, never scolding**. A darker card and a red figure; no banners, no alarm icons, no advice.
4. Where a figure is assumed, mark it. Where a figure is withheld, say it is withheld and why.
5. Counterparty names are initialled. Full names off a UPI narration are other people's data.
6. **"There is nothing to buy here"** is a valid and required sentence. Saying it out loud is what makes the other nudges credible.

---

## 11. Thresholds

Every value below is a **first guess that needs tuning against real traffic.** None is a measurement.

| Threshold | Value | Governs |
|---|---|---|
| Median window | 6 complete months | Every comparison on the page |
| Cover multiple | 6 × median month | Emergency-fund target |
| Surplus routing split | 3 × median month | Liquid vs long-horizon destination |
| Hot month | ≥ 1.25 × median month | C1 |
| Cheap month | ≤ 0.75 × median month | C2 |
| Partial-period quiet window | first **7 days** | C3, and all pace verdicts |
| Investing-drop detection | last 3 months' median > 15% below prior 9 | B1 |
| Steady-investing praise | ≥ 6 months, < 5% variation | B3 |
| Subscription nudge | ≥ 3 merchants in ≥ 3 of last 6 months | D1 |
| Frequency nudge | ≥ 40 payments in 12 months, avg ≤ ₹500 | D2 |
| Merchant insight floor | 12-month spend ≥ ₹10,000 | Story rail, merchant slots |
| Category → sector | category ≥ 5% of period spend and holds no listed merchant | Conditional P0 |
| Idle balance | balance ÷ median month > 6 | Idle-cash slot |
| Spending-cohort gate | 5,000 connected accounts | Section 3 locked state |
| Nudges rendered before expander | 3 | §13.2 — open |

---

## 12. Dependencies and launch gates

### 12.1 Holdings — blocks every buy button
The engine cannot yet say *"you already own this."* A buy button without that can tell someone to buy a fund they already hold. **Until holdings exist, every commercial CTA reads "Explore", not "Invest".** The external-funds action item (§5.4) is how holdings arrive, which makes it the highest-leverage item on the page.

### 12.2 Categorisation quality — a launch gate
No user tagging means no labelled data ever arrives from users. Coverage improves only as fast as we extend the merchant list and narration rules. Category accuracy must be measured and signed off before launch, not after.

### 12.3 Investable-universe rule
**Wealthtech is investable; payment gateways are not.** Users are ET Money's and INDmoney's customers in a way they would recognise. Nobody is Razorpay's.

### 12.4 The ceiling, stated plainly
On the reference dump, **67% of a month's outflow is money we can count but cannot name** — the credit-card bill, a mandate behind a gateway, and transfers to people. Card-statement consent is a separate AA data type and out of scope. The merchant list works on the remaining third, and on that third it is close to complete. This ceiling is set by data access, not by the merchant list.

---

## 13. Open decisions

### 13.1 The sensitive-category blocklist — **not yet decided**
The rule, as designed: health, gambling, penalties, welfare and insurance never earn a slot, never get a celebratory frame and never get a buy button — silently, with the category still showing its real number in the ranked list.

If the rule goes, those categories re-enter the slot queue as ordinary categories with buy buttons attached.

**Do not build either way until this is ruled on.** It changes exactly one screen (the sensitive category L2) and one nudge family (E). Nothing else in this document depends on it.

### 13.2 Slot count per section
Three with an expander, or all stacked. Currently specified as three.

### 13.3 Whether the P1 tier survives real traffic
P1 exists almost entirely for thinner data; a rich user never sees past P0.

### 13.4 Whether *Left over* stays plainly negative
Currently plain, below the axis. Alternative is its own treatment.

### 13.5 Whether the frequency nudge (D2) ever carries a tone
Currently a bare count. The engine arguably has no business having an opinion about what someone buys.

### 13.6 Whether a hot month suppresses buy buttons elsewhere in the same session
Nudging someone to invest in the session where we told them they overspent is a tone question, not a data one.

### 13.7 Whether Groww belongs on a Paytm Money screen
The logic says yes. This one needs a human.

---

## 14. Appendix — reference figures

All from `bankaadump8527379520.json`: 1,265 transactions, 3 savings accounts, 2 Aug 2025 – 1 Sep 2026.
Wireframes referenced throughout live in `Wireframes/` and are indexed in §1.2.

| Figure | Value |
|---|---|
| Balance | ₹13,55,326 (ICICI ₹12,97,750 · Axis ₹57,536 · Federal ₹39) |
| August: in / invested / spent / left over | ₹4,17,358 / ₹1,45,335 / ₹3,12,581 / **−₹40,558** |
| Median month (6) / (12) | ₹2,06,592 / ₹1,21,924 |
| Cover target / held / surplus | ₹12,39,554 / ₹13,55,326 / ₹1,15,772 |
| Top August categories | Credit card bills ₹1,26,820 (40.6%) · Rent ₹40,006 · Health ₹38,293 · People ₹35,650 (27 payees) · Travel ₹20,998 |
| Card bills, 12 months | ICICI ₹3,17,971 · Aditya Birla ₹30,397 · card ••7465 ₹24,673 |
| Mandate | ₹2,05,000 × 8 months → May ₹1,000, June ₹20,000 → ₹1,45,000 × 2. **₹5,09,899 behind the old rate** |
| Blinkit | 91 orders, ₹1,21,600 (parent Eternal, listed) |
| Astrotalk | 74 payments, ₹18,526, avg ₹250 |
| Subscriptions | 12 services, ₹41,294/yr, no listed Indian parent |
| SBI loan EMI | ₹6,360 × 13 months, zero variation, tagged *income tax* by the bank |
| Rent | ₹40,006 to a person, 1st–7th monthly |
| 1–2 Sep | ₹50,855 spent, 9 transactions, 2 categories, **0 merchants matched** |
| Assumed figures (3) | top 3% percentile · ₹18,400 band median · 1,340 connected accounts |
