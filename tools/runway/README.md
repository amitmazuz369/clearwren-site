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

## Cost

From [Runway's pricing page](https://docs.dev.runwayml.com/guides/pricing.md) on 2026-11-08,
at $0.01 per credit: `gen4_turbo` 5 credits/second, `gen4.5` 12 credits/second. A 5 s draft
is 25 credits on turbo, 60 on Gen-4.5. The script prints the API's own maximum charge when a
task starts. Failed and moderated runs are billed too, and the script never retries on its own.

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
