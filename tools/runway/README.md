# Runway clips

Local script that turns a still image (a social card, a screenshot, the wren) into a
2–10 second video clip with Runway Dev's `image_to_video` endpoint. Nothing here is
deployed: the Pages workflow publishes `site/` only.

## Setup

```bash
cd tools/runway
npm install
cp .env.example .env   # then paste a project key from https://dev.runway.com
```

`.env` is git-ignored. Keep the key out of `site/`, commits and chat.

## Use

Check the request first. A dry run sends nothing and costs nothing:

```bash
npm run animate -- ../../site/assets/social/ig-launch-1.jpg \
  --prompt "Static camera. Soft light drifts across the card; all text stays still and sharp." \
  --dry-run
```

Drop `--dry-run` to generate. The clip is saved to `out/` (git-ignored), because
Runway's output links expire.

| Flag | Default | Notes |
| --- | --- | --- |
| `--model` | `gen4_turbo` | `gen4.5` for the final take; it requires `--prompt` |
| `--ratio` | `832:1104` | Closest to Instagram 4:5. `720:1280` for Reels/Stories, `960:960` square |
| `--duration` | `5` | Whole seconds, 2–10 |
| `--seed` | random | Reuse the seed of a take you liked |

Input can be a local JPEG/PNG/WebP (sent as a 24-hour ephemeral upload) or an HTTPS
URL already live on clearwren.com.

## Credits and spending

Check the balance any time. It is a free read and generates nothing:

```bash
npm run balance
```

Every live run is guarded twice:

1. **Before anything is uploaded**, the script reads the balance and works out the worst
   case for the run from the prices in `MODELS` (from
   [Runway's pricing page](https://docs.dev.runwayml.com/guides/pricing.md), 2026-11-08:
   `gen4_turbo` 5 credits/second, `gen4.5` 12 credits/second, $0.01 per credit). If the
   balance would drop below the floor, it stops and sends nothing.
2. **After the task is created**, it compares Runway's own maximum for that task
   (`estimatedCost`) with the balance. If that does not fit, it cancels the task at once
   and tells you to update the price table.

The floor is 0 by default. To always keep some credits in reserve, pass `--keep 200` or set
`RUNWAY_KEEP_CREDITS=200` in `.env`.

A 5 s draft costs 25 credits on turbo and 60 on Gen-4.5. Failed and moderated runs are billed
too, and the script never retries on its own.

What the script cannot control:

- **Autobilling.** Runway Dev is prepaid. If autobilling is turned on in the portal's Billing
  tab, Runway charges your card (at least 1,000 credits, $10) whenever the balance drops below
  your threshold. Leave it off if you want spending capped at what you bought.
- **Parallel runs or other keys.** The check is a snapshot. Run one generation at a time, and
  remember that other keys in the same project spend from the same balance.

## Known limits

- Video models tend to warp text and UI. Prompt for a static camera and still text, and
  check every frame before posting. Cards with little text work best.
- 1080x1350 cards are cropped slightly to fit `832:1104`; keep text away from the left and
  right edges.
- Only `gen4_turbo` and `gen4.5` are wired in. Other models take different fields; read
  <https://docs.dev.runwayml.com/api.md> before adding one to `MODELS`.

## Tests

```bash
npm test
```

The tests mock the SDK and make no network calls.
