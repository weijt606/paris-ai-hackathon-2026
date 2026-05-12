# Demo playbook — Live demo at 18:00

Paris is a **live demo**, not a Loom upload. You stand in front of judges, hit "play," and tell a story in ~2 minutes.

## What worked in Berlin

- **Approaching judges for a second in-person demo** — saved our Top 3 placement. Don't passively wait for results.
- **Deep sponsor integration** — judges see effort. One sponsor used deeply > three sponsors used shallow.
- **A clear "wow" moment in the first 15 seconds** — judges form an opinion fast. Don't bury the lede.

## What didn't work

- **Preview/beta APIs in the demo path** — rate-limited mid-demo. Switch to GA before submission.
- **Sponsor APIs taken on faith** — enhancement that helps marketing demos may hurt your scenario. A/B test before betting on it.
- **Ad-hoc demo with no script** — recorded almost ad-libbed. Two minutes is short; every 10 seconds must be designed.

## The 2-minute script template

```
0:00 – 0:15  HOOK
  - One sentence problem statement that judges feel emotionally.
  - One sentence product promise. No tech yet.

0:15 – 0:45  DEMO MOMENT 1
  - Show the magic. Don't explain — show.
  - Hands on keyboard, real interaction, no slides.

0:45 – 1:15  DEMO MOMENT 2
  - Show depth: the sponsor integration, the surprising affordance.
  - Optional: show the failure mode you handled (it makes you look serious).

1:15 – 1:45  WHY IT MATTERS
  - Who uses this, what changes for them.
  - Social/emotional resonance — Berlin's winner won on this dimension.

1:45 – 2:00  CLOSE
  - What's next (one sentence).
  - Thank judges, sponsors by name. Smile.
```

Practice this script three times **out loud**. Time it. If you go over 2 minutes, cut content.

## Pre-demo checklist (T-1 hour)

- [ ] `pnpm build && pnpm start` runs locally (production build, not dev mode)
- [ ] All sponsor calls work end-to-end with real keys
- [ ] `NEXT_PUBLIC_DEMO_MODE=true` also works end-to-end (offline fallback)
- [ ] Audio output works on the demo laptop's actual speakers
- [ ] Browser permissions: mic, camera (if used)
- [ ] Network: confirm the venue WiFi reaches every sponsor API
- [ ] Backup: phone hotspot ready in case venue WiFi dies
- [ ] Demo script printed or on phone — don't rely on memory under pressure
- [ ] One teammate operates the demo, one teammate narrates — don't multitask
- [ ] Stop touching code. Anything you touch in the last hour will break.

## Failure recovery

If something breaks on stage:

1. **Don't apologize for >2 seconds.** "Quick fix — meanwhile let me tell you about X."
2. **Switch to demo mode if needed.** `DEMO_MODE=true` should always work. That's the contract.
3. **Pivot to the why.** If the demo dies, the *story* still matters. Sell the vision.
4. **Offer a second demo.** "Happy to show this live again after the session." Berlin showed this works.

## Post-demo

- Talk to judges. Hackathons are social — your network from this event is the real prize.
- Note what other teams built — informs strategy for the next event (UCWS Singapore is 30 days; very different game).
