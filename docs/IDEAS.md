# Ideas board

Shared scratchpad for product concepts before we lock in a direction on event day.

**How to use:**

1. Copy the template below into the "Active ideas" section.
2. Fill in whatever you can — incomplete entries are fine, encourage discussion.
3. Score against the matrix honestly. A 3/5 idea with all teammates committed beats a 5/5 idea no one wants to build.
4. After 10:45 on event day, we pick ONE and the rest get moved to "Parked."

**Don't:** delete other people's entries. Comment with `> @yourname:` instead.

**Naming:** `<your-name>-<short-slug>` (e.g., `wei-pitch-coach`). Keep the slug filesystem-safe (lowercase, hyphens) since it may become a folder name.

---

## Scoring matrix (社会价值 vs 工程现实)

Adapted from the Obsidian "08-经验分析与获奖策略" + Berlin retro lessons. Rate each dimension **1–5** (5 = strongest).

| Dimension | Weight | What "5" looks like | What "1" looks like |
|---|---:|---|---|
| **Social / emotional resonance** (社会价值) | 25% | Judges feel something immediately — elderly care, climate, accessibility, mental health | Tool for highly technical niche, judges need explanation |
| **Sponsor integration depth** (赞助商集成深度) | 25% | ≥2 sponsors deeply integrated (not just API calls — feature-level dependency) | One sponsor used shallowly, or none |
| **Demo-ability in 90s** (Demo 可演示性) | 20% | One on-screen action produces a wow moment in <15s | Needs setup, explanation, or multi-screen orchestration |
| **Technical feasibility** (技术可行性) | 15% | Core loop buildable in 4h with our scaffold | Requires research, novel ML, or unproven sponsor APIs |
| **Competitive density** (竞争密度) | 15% | Unlikely 5+ teams will build the same thing | "AI chatbot for X" or another GPT wrapper |

**Total = sum(score × weight)**. Anything **≥4.0** is a serious contender. <3.0 → park it.

---

## Template — copy this block

````markdown
### 💡 `<your-name>-<short-slug>`

**One-liner:** _(15 words max)_ _e.g., "Voice-controlled pitch coach that scores your delivery in real time."_

**Author:** `<github-handle>` · **Status:** `idea` | `discussed` | `committed` | `parked` · **Updated:** `YYYY-MM-DD`

#### Problem
_Who hurts, when, and why. One paragraph._

#### Product
_What does it do? What does the user see / feel / hear in the first 30 seconds?_

#### Demo moment (the wow)
_The single 5-second action you'd show the judge first. If you can't describe it, the demo doesn't have one yet._

#### Sponsor mapping
| Sponsor | How it's used | Depth (shallow/medium/deep) |
|---|---|---|
| OpenAI | _e.g., reasoning over user input_ | deep |
| Fal | _e.g., generate the visual response_ | medium |
| Gradium | _e.g., TTS the coach response_ | medium |

#### Tech approach (high-level)
_Three bullets max. Which adapters from `src/lib/*` you'll use, what new code is needed._
- ...
- ...
- ...

#### Scoring
| Dimension | Score (1–5) | Reasoning |
|---|---:|---|
| Social / emotional resonance | _x_ | _why_ |
| Sponsor integration depth | _x_ | _why_ |
| Demo-ability in 90s | _x_ | _why_ |
| Technical feasibility | _x_ | _why_ |
| Competitive density | _x_ | _why_ |
| **Weighted total** | **_x.x_** | |

#### Risks / open questions
- _What could kill this? (sponsor API limitations, time, novelty risk)_
- _What's the fallback if the core sponsor doesn't work?_

#### Wildcard fit
_If this could be repositioned for the wildcard track, how? (Berlin retro: keep a wildcard backup.)_
````

---

## Worked examples (delete or adapt — these are illustrative)

### 💡 `example-grandma-call`

**One-liner:** Daily voice call from an AI companion to elderly family members — summarizes mood and flags concerns to family.

**Author:** `example` · **Status:** `parked` (Berlin's winner was similar — pick a fresher angle) · **Updated:** `2026-05-12`

#### Problem
Elderly relatives often go days without conversation. Family members want to know they're OK but feel guilty about call frequency. Existing solutions (medical alert buttons, text check-ins) miss the emotional layer.

#### Product
Set up a number for your grandparent. Every morning, an AI agent calls them, chats naturally about their day, and sends the family a daily mood summary. If the call detects distress signals (confusion, sadness, missed call patterns), family is alerted.

#### Demo moment (the wow)
Live-call a phone on stage. The phone rings, the AI introduces itself warmly in fluent French, asks about the weather, gets a response, transcribes it, and texts the "family" Slack with a one-sentence summary — all in 30 seconds.

#### Sponsor mapping
| Sponsor | How it's used | Depth |
|---|---|---|
| Slng.ai | Real-time voice agent over telephony | deep |
| Gradium | TTS for warm/natural voice, STT for caller side | deep |
| Anthropic | Reasoning + mood classification + family summary | deep |

#### Tech approach
- `src/lib/voice/slng.ts` → creates the outbound agent session
- `src/lib/voice/gradium.ts` → TTS for natural French voice; STT for response
- `src/lib/ai/anthropic.ts` → classifies mood from transcript + drafts family summary

#### Scoring
| Dimension | Score | Reasoning |
|---|---:|---|
| Social / emotional resonance | 5 | Universal — everyone has elderly relatives |
| Sponsor integration depth | 5 | Three sponsors all load-bearing |
| Demo-ability in 90s | 4 | Live phone call is visceral; risk: bad WiFi |
| Technical feasibility | 3 | Slng.ai stub needs real SDK; calling out costs minutes |
| Competitive density | 2 | **Berlin winner was nearly identical** — judges will compare |
| **Weighted total** | **3.9** | Strong on heart, weak on freshness |

#### Risks / open questions
- Berlin's overall winner was telli + ai-coustics for an elder-care phone product. Reusing this exact angle invites unfavorable comparison. Need a fresh framing.
- Phone-call demo requires venue WiFi + actual phone — fragile.

#### Wildcard fit
If wildcard, lean into the family-side dashboard angle (Slack/iMessage summaries) rather than the call itself — different focus, same emotional core.

---

### 💡 `example-pitch-mirror`

**One-liner:** Record your hackathon pitch and instantly see how it lands — eye contact, filler words, pacing, and which judge personas would buy in.

**Author:** `example` · **Status:** `idea` · **Updated:** `2026-05-12`

#### Problem
Founders pitch under pressure with no feedback loop. Coaches are expensive and slow. Hackathon teams (literally including us) practice their demo cold and miss obvious issues.

#### Product
Click record, deliver your 2-minute pitch to the laptop. Instantly get: a per-sentence transcript with filler words highlighted, a generated audio "what a VC heard" version, an image of the "judge mood meter" timeline, and a Claude-written critique from three personas (skeptical VC, friendly mentor, technical judge).

#### Demo moment (the wow)
Live: one of us pitches our own product on stage for 30 seconds. Within 5 seconds of stopping, the screen shows the timeline, the personas' critiques scroll in, and the "skeptical VC" voice plays back saying "I'd want to see traction data."

#### Sponsor mapping
| Sponsor | How it's used | Depth |
|---|---|---|
| Gradium | Real-time STT during the pitch | deep |
| Anthropic | Generates the 3 persona critiques + line-by-line feedback | deep |
| Fal | Generates the "judge mood meter" visualization | medium |
| OpenAI | TTS the persona voices in playback | medium |

#### Tech approach
- `MicCapture` component for the recording UI
- `/api/stt` for the live transcript
- `/api/chat` (provider=anthropic) for the three persona critiques in parallel
- `/api/image` for the timeline visual; OpenAI TTS for the persona playback

#### Scoring
| Dimension | Score | Reasoning |
|---|---:|---|
| Social / emotional resonance | 3 | Founders relate hard, but not universal |
| Sponsor integration depth | 5 | All four sponsors materially used |
| Demo-ability in 90s | 5 | Meta-pitch on stage = instant judge engagement |
| Technical feasibility | 4 | Scaffold already has 80% of this |
| Competitive density | 3 | Crowded space, but the multi-persona spin is unusual |
| **Weighted total** | **4.0** | Solid all-rounder, strong demo |

#### Risks / open questions
- Live STT latency on venue WiFi could ruin the "instant" feel — pre-test
- Multi-persona LLM calls in parallel: cost / rate-limit concerns
- Is "AI feedback on pitches" too on-the-nose at a hackathon? (Might also be very on-the-nose in a *good* way.)

#### Wildcard fit
Native fit. Berlin's W1 "PitchCoach" rated ⭐⭐⭐⭐⭐ for wildcard — this is the steroid version.

---

## Active ideas

_Add your entries below. Newest at the top._

<!-- Drop your filled-in template here -->

---

## Parked ideas

_Ideas we considered and decided against. Keep the entry + a "why parked" note so we don't re-litigate it._

<!-- Move parked entries here, add: -->
<!-- **Why parked:** _(2026-05-XX, by @yourname)_ one sentence on why we passed. -->

---

## Decision log

_Append-only log of group decisions. Format: `YYYY-MM-DD HH:MM — decision (decided by @who)`._

- _2026-05-12 — Created ideas board. Awaiting team input._
