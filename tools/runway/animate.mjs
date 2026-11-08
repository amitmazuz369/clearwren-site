#!/usr/bin/env node
// Turn a still image (a social card, a product screenshot, the wren) into a short
// video clip with Runway's image_to_video endpoint, then save the clip locally.
//
//   npm run animate -- ../../site/assets/social/ig-launch-1.jpg --prompt "..." --dry-run
//
// Request fields differ per model, so only models whose fields are spelled out in
// MODELS below are accepted. Check https://docs.dev.runwayml.com/api.md before
// adding one. The API secret is read by the SDK from RUNWAYML_API_SECRET.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import RunwayML, { TaskFailedError, TaskTimedOutError } from '@runwayml/sdk';

const RUNWAY_RATIOS = ['1280:720', '720:1280', '1104:832', '960:960', '832:1104', '1584:672'];

// Fields from the image_to_video reference (api.md); creditsPerSecond from
// https://docs.dev.runwayml.com/guides/pricing.md. Both checked 2026-11-08.
// The price is only used for the balance check before a run; after the task is
// created, the API's own estimatedCost is checked again (see animate()).
export const MODELS = {
  gen4_turbo: { ratios: RUNWAY_RATIOS, minDuration: 2, maxDuration: 10, promptRequired: false, promptMax: 1000, creditsPerSecond: 5 },
  'gen4.5': { ratios: RUNWAY_RATIOS, minDuration: 2, maxDuration: 10, promptRequired: true, promptMax: 1000, creditsPerSecond: 12 },
};

export function maxCost(model, duration) {
  return MODELS[model].creditsPerSecond * duration;
}

// Refuse any run that could take the balance below `keep` credits.
export function checkBudget({ balance, cost, keep = 0 }) {
  if (!Number.isFinite(balance)) throw new Error('Could not read the credit balance from Runway. Not running.');
  if (balance - cost < keep) {
    const floor = keep > 0 ? ` and keep ${keep} in reserve` : '';
    throw new Error(`Not enough credits: balance ${balance}, this run can cost up to ${cost}${floor}. Nothing was sent.`);
  }
  return balance - cost;
}

export const DEFAULTS = {
  model: 'gen4_turbo', // cheaper drafts; re-run the keeper with --model gen4.5
  ratio: '832:1104', // closest to Instagram's 4:5 portrait (1080x1350)
  duration: 5,
  out: 'out',
};

const IMAGE_TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MIN_UPLOAD_BYTES = 512; // ephemeral uploads reject smaller files

export function buildRequest({ model, promptImage, prompt, ratio, duration, seed }) {
  const spec = MODELS[model];
  if (!spec) {
    throw new Error(`Unsupported model "${model}". Supported here: ${Object.keys(MODELS).join(', ')}.`);
  }
  if (!spec.ratios.includes(ratio)) {
    throw new Error(`Ratio "${ratio}" is not valid for ${model}. Use one of: ${spec.ratios.join(', ')}.`);
  }
  if (!Number.isInteger(duration) || duration < spec.minDuration || duration > spec.maxDuration) {
    throw new Error(`Duration for ${model} must be a whole number from ${spec.minDuration} to ${spec.maxDuration}.`);
  }
  const text = (prompt ?? '').trim();
  if (spec.promptRequired && !text) {
    throw new Error(`${model} needs --prompt describing the motion you want.`);
  }
  if (text.length > spec.promptMax) {
    throw new Error(`Prompt is ${text.length} characters; ${model} accepts at most ${spec.promptMax}.`);
  }

  const body = {
    model,
    promptImage: [{ uri: promptImage, position: 'first' }],
    ratio,
    duration,
  };
  if (text) body.promptText = text;
  if (seed !== undefined) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
      throw new Error('Seed must be a whole number from 0 to 4294967295.');
    }
    body.seed = seed;
  }
  return body;
}

export function checkLocalImage(file) {
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_TYPES.has(ext)) {
    throw new Error(`"${file}" is not a JPEG, PNG or WebP image.`);
  }
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    throw new Error(`Image not found: ${file}`);
  }
  if (stat.size < MIN_UPLOAD_BYTES) {
    throw new Error(`"${file}" is smaller than ${MIN_UPLOAD_BYTES} bytes, which Runway uploads reject.`);
  }
}

// HTTPS URLs (for example a page already live on clearwren.com) go straight to the API.
// Local files are sent as an ephemeral upload, usable for 24 hours.
export async function resolveImage(client, input) {
  if (/^https:\/\//i.test(input)) return input;
  if (/^[a-z]+:\/\//i.test(input)) throw new Error('Image URLs must use HTTPS.');
  checkLocalImage(input);
  const { uri } = await client.uploads.createEphemeral(fs.createReadStream(input));
  return uri;
}

export function outputName(input, taskId, index, url) {
  const source = /^https:\/\//i.test(input) ? new URL(input).pathname : input;
  const base = path.basename(source).replace(/\.[^.]+$/, '') || 'clip';
  const ext = path.extname(new URL(url).pathname) || '.mp4';
  const suffix = index > 0 ? `-${index + 1}` : '';
  return `${base}-${taskId.slice(0, 8)}${suffix}${ext}`;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

export async function animate(client, opts, log = console.log) {
  const keep = opts.keep ?? 0;

  // 1. Balance check before anything is uploaded or generated.
  const { creditBalance } = await client.organization.retrieve();
  const cost = maxCost(opts.model, opts.duration);
  const left = checkBudget({ balance: creditBalance, cost, keep });
  log(`Balance ${creditBalance} credits. This run: up to ${cost}. Left after: at least ${left}.`);

  const promptImage = await resolveImage(client, opts.image);
  const body = buildRequest({ ...opts, promptImage });

  // No await on create(): waitForTaskOutput() lives on the pending promise.
  const pending = client.imageToVideo.create(body);
  const { id, estimatedCost } = await pending;

  // 2. Second check against Runway's own maximum for this task, in case the
  // price table above is out of date. Cancel straight away if it does not fit.
  const charged = estimatedCost?.credits;
  if (!Number.isFinite(charged) || creditBalance - charged < keep) {
    await client.tasks.delete(id).catch(() => {});
    throw new Error(
      `Runway quoted ${charged ?? 'no'} credits for task ${id}, more than the balance allows. ` +
        'The task was cancelled. Update creditsPerSecond in MODELS from the pricing page.',
    );
  }
  log(`Task ${id} started (${body.model}, ${body.ratio}, ${body.duration}s). Max charge: ${charged} credits.`);

  const task = await pending.waitForTaskOutput({ timeout: 10 * 60 * 1000 });

  fs.mkdirSync(opts.out, { recursive: true });
  const saved = [];
  for (const [i, url] of task.output.entries()) {
    const dest = path.join(opts.out, outputName(opts.image, task.id, i, url));
    await download(url, dest);
    saved.push(dest);
  }
  return { taskId: task.id, saved };
}

function usage() {
  return `Usage: npm run animate -- <image file or https URL> [options]

  --prompt "<text>"     Motion to add (required for gen4.5)
  --model <id>          ${Object.keys(MODELS).join(' | ')} (default ${DEFAULTS.model})
  --ratio <w:h>         default ${DEFAULTS.ratio}; 720:1280 for Reels/Stories, 960:960 for square
  --duration <seconds>  2-10 (default ${DEFAULTS.duration})
  --seed <n>            repeat a result you liked
  --out <dir>           where clips are saved (default ${DEFAULTS.out}/)
  --keep <credits>      never let the balance drop below this (default 0, or RUNWAY_KEEP_CREDITS)
  --dry-run             print the request without calling Runway (no credits used)

       npm run balance  show the credit balance (free, no generation)`;
}

function needSecret() {
  if (process.env.RUNWAYML_API_SECRET) return true;
  console.error('RUNWAYML_API_SECRET is not set. Put it in tools/runway/.env (see .env.example); that file is git-ignored.');
  return false;
}

async function showBalance(client) {
  const org = await client.organization.retrieve();
  console.log(`Credit balance: ${org.creditBalance} credits ($${(org.creditBalance / 100).toFixed(2)} at $0.01 each)`);
  console.log(`Tier limit: ${org.tier.maxMonthlyCreditSpend} credits of purchases per 30 days`);
}

async function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      prompt: { type: 'string' },
      model: { type: 'string', default: DEFAULTS.model },
      ratio: { type: 'string', default: DEFAULTS.ratio },
      duration: { type: 'string', default: String(DEFAULTS.duration) },
      seed: { type: 'string' },
      out: { type: 'string', default: DEFAULTS.out },
      keep: { type: 'string', default: process.env.RUNWAY_KEEP_CREDITS ?? '0' },
      'dry-run': { type: 'boolean', default: false },
      balance: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.balance) {
    if (!needSecret()) return 1;
    await showBalance(new RunwayML());
    return 0;
  }

  if (values.help || positionals.length !== 1) {
    console.log(usage());
    return values.help ? 0 : 1;
  }

  const opts = {
    image: positionals[0],
    prompt: values.prompt,
    model: values.model,
    ratio: values.ratio,
    duration: Number(values.duration),
    seed: values.seed === undefined ? undefined : Number(values.seed),
    out: values.out,
    keep: Number(values.keep),
  };
  if (!Number.isInteger(opts.keep) || opts.keep < 0) {
    console.error('--keep must be a whole number of credits, 0 or more.');
    return 1;
  }

  if (values['dry-run']) {
    const isUrl = /^https:\/\//i.test(opts.image);
    if (!isUrl) checkLocalImage(opts.image);
    const placeholder = isUrl ? opts.image : `runway://<ephemeral upload of ${opts.image}>`;
    console.log(JSON.stringify(buildRequest({ ...opts, promptImage: placeholder }), null, 2));
    console.log(`\nUp to ${maxCost(opts.model, opts.duration)} credits by the price table. Dry run: nothing was sent to Runway.`);
    return 0;
  }

  if (!needSecret()) return 1;

  // Validate before spending an upload.
  buildRequest({ ...opts, promptImage: 'https://example.invalid/check.jpg' });

  try {
    const { taskId, saved } = await animate(new RunwayML(), opts);
    console.log(`Done (task ${taskId}). Saved:\n${saved.map((f) => `  ${f}`).join('\n')}`);
    return 0;
  } catch (error) {
    if (error instanceof TaskFailedError) {
      const t = error.taskDetails;
      console.error(`Task ${t.id} ended ${t.status}: ${t.failure ?? 'no reason given'}${t.failureCode ? ` [${t.failureCode}]` : ''}`);
      console.error('Moderated or failed runs are still billed. Not retrying automatically.');
      return 1;
    }
    if (error instanceof TaskTimedOutError) {
      console.error(`Stopped waiting after 10 minutes. Task ${error.taskDetails.id} may still finish; check it in the Developer Portal.`);
      return 2;
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error.message ?? error);
      process.exit(1);
    },
  );
}
