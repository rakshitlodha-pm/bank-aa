# Paytm Money — Insights Engine

Working context for the Insights tab. Read this before proposing anything on this
project. Every decision below was made by Rakshit (PM) unless marked otherwise;
where a call is still open it says so, and it stays open until he makes it.

## What this is

The **Insights tab** — one of three tabs (Insights / Transactions / My Accounts) —
driven by consented Account Aggregator bank data.

Graded on **engagement and retention first, AUM second.** The numbers are the reason
people open the tab; conversion is the second-order effect, not the brief.

## How to work on this

- **Discuss options and let Rakshit decide before writing any PRD or spec.** Lay out
  the real alternatives with a recommendation, ask only the questions that fork the
  outcome, wait. Analysis and data verification beforehand are welcome — it is the
  *deliverable* that waits.
- Sequence agreed for this project: **discuss → design/wireframe → thesis → written spec.**
- Ask in prose in the terminal. Do not use the AskUserQuestion picker.
- Do not upgrade your own proposal into "a decision we made." If it was your idea and
  he has not ruled on it, label it.

## Architecture

**One page, three sections, in this order:**

1. **Your bank** — universal. Nothing here needs a merchant match.
2. **Your expenses** — where the commercial payload lives.
3. **You vs Paytm Money** — cohort comparison. Needs no AA consent at all.

**There is no fourth section and no system-states layer.** Specifically dropped: the
card announcing a suppressed category, the "tag it yourself" prompt, and the "money we
cannot name" card. That last one is an engine diagnostic — it belongs in the thesis and
in threshold tuning, never on a user's screen.

### Structure vs slots

This is the core mechanism. There is **no persona branching anywhere.**

- **Structural components always render.** They are the page, not candidates for it:
  the period money tiles, the flow chart, accounts and balances, the ranked category
  list, the spend/invest rates, partial-month handling, the non-comparative badge.
- **Ranked slots compete for space.** One fixed list, evaluated in the same order for
  every user. The page is whatever survives the thresholds. Roughly three slots render
  per section; the rest go behind an expander.
- A thin-data user loses the merchant-dependent slots and still has about seven
  insights left. That is the whole fallback story — it needs no separate design.
- **`category → sector players` is a conditional P0**: it earns P0 only when
  `merchant → listed parent` fails to fire. Its priority depends on the data.

The four data-richness personas (Rich / Dense-but-anonymous / Typical / Thin) survive
as **test fixtures**, not as page variants. Use them to check what a page degrades to.

## Rules the engine must obey

- **Eligibility looks back 12 months; the displayed figure respects the selected
  period.** One rule, and it does most of the work. It is why a merchant insight says
  "₹1,21,600 over the year" on the 2nd of the month instead of vanishing.
- **Compare to a median, never to last month.** One bonus month poisons every
  month-on-month comparison for a year. Month-on-month may exist as a second view only.
- **Partial periods compare like-for-like** — same N days of the previous month, never
  against a whole one. `Left over` is *withheld and labelled* on a partial period, not
  shown as a true-but-useless negative.
- **Never say "almost certainly."** If the engine cannot name a flow, it counts the
  money and leaves it unnamed. Do not infer intent from a counterparty string.
- **No performance figures.** Live prices are not modelled, so nothing anywhere says
  "you would have made X."
- **Holdings must exist before any buy button ships.** The engine cannot yet say
  "you already own this," and a buy button without that is not shippable.
- **Wealthtech is investable, payment gateways are not.** Users are ET Money's and
  INDmoney's customers in a way they would recognise; nobody is Razorpay's.

### No user tagging

Reversed on 7 Sep 2026 — it had previously been a yes. Categories are **engine-derived
only**, and the user cannot correct a row, in Insights or anywhere else.

The reason it matters beyond the tab: user-supplied tags would make the Section 3
spending percentile incoherent, because it would compare our taxonomy to theirs. The
consequence to accept is that **categorisation quality is a launch gate, not a feedback
loop** — every category number is our claim alone, with no recourse and no labelled
data arriving from users. Coverage improves only as fast as we extend the merchant list
and narration rules.

### OPEN — the sensitive-category blocklist

Whether the blocklist rule survives is **not yet decided.** The rule, as designed:
health, gambling, penalties, welfare and insurance never earn a slot, never get a
celebratory frame and never get a buy button — silently, with no card explaining the
suppression, and with the category still showing its real number in the ranked list.

If the rule goes, those categories re-enter the slot queue as ordinary categories with
buy buttons attached. Do not build either way until Rakshit rules.

## AA data — traps found by breaking on them

- **`mode` / `txnMode` captures ~9% of real UPI traffic.** Always derive the rail from
  the narration prefix.
- **`merchantName` is ~86% populated but mixes people, self-transfers and payment
  aggregators.** Only ~16% of outflow is a genuine commercial merchant.
- **"Money out" is not "expenses."** ~63% of gross outflow is investments and transfers.
- **Never size a goal on a trailing average.** A rent that started mid-window
  understated current commitments by 69%.
- **Rent is detectable without a merchant**: stable payee, paid 1st–7th, preceded by a
  lump sum at a near-integer multiple of the monthly amount (the deposit).
- **Account metadata is a cheap signal we are not using.** A branch field reading
  "Indmoney" identifies what an account is for without matching a single string.
- **Do not trust the bank's own labels.** A ₹6,360 SBI EMI, identical for 13 months,
  was tagged by the bank as income tax.

## The ceiling, stated plainly

On the reference dump, **67% of a month's outflow is money we can count but cannot
name**: the credit-card bill (no merchant, no sector, no stock behind the largest bar
on the page), a monthly mandate sitting behind a payment gateway, and transfers to
people. Card-statement consent is a separate AA data type and is out of scope. The
merchant list works on the remaining third, and on that third it is close to complete.

## The growth loop

Section 3 needs no bank consent — Paytm Money already knows how millions of people
invest. So **the comparison is the reason to connect a bank account.** The consent
screen leads with "see where you stand," not "see your expenses," and Section 3 pays
for its own cohort. The spending percentile stays locked until enough users have
connected.

## Data source and honesty about it

`bankaadump8527379520.json` — one Account Aggregator **deposits** dump: 1,265
transactions, 3 savings accounts, 2 Aug 2025 – 1 Sep 2026. It contains PAN, date of
birth, address, email and mobile; exclude all of them from any output.

**One user is one user.** Every coverage percentage derived from this dump is a target,
not a measurement, and every threshold in the slot list is a first guess that needs
tuning against real traffic. Say so whenever you quote one.

Label anything that could only come from a cohort as **assumed**, and make sure nothing
else on the page reads from it.

## Artefacts in this directory

- `insights-tab-rakshit.html` — design pass 2: the full tab on real data, rendered
  twice (a complete month, and the same user two days into a new month).
- `insight-catalogue.html` — every component side by side, with the ranking worksheet.
  Contains the dropped system-states section; treat that part as superseded.
- `merchant-match-list.html` — merchant resolution working.

## Open items

1. The sensitive-category blocklist — see above. The only one that changes behaviour.
2. How many slots a section actually renders, and three-with-expander vs all stacked.
3. Whether the P1 tier survives contact with real traffic. P1 exists almost entirely
   for thinner data; a rich user never sees past P0.
4. Whether `Left over` stays plainly negative or gets its own treatment.
5. Whether one insight is hoisted above the fold. Honest candidate is idle balance —
   it needs no merchant data and fires for everyone.
6. Whether Groww belongs on a Paytm Money screen. The logic says yes; ask a human.
