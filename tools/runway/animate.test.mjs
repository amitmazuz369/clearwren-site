import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildRequest, resolveImage, outputName, animate, maxCost, checkBudget, MODELS } from './animate.mjs';

const img = 'https://clearwren.com/assets/social/ig-launch-1.jpg';

test('builds a gen4_turbo request without a prompt', () => {
  assert.deepEqual(buildRequest({ model: 'gen4_turbo', promptImage: img, ratio: '832:1104', duration: 5 }), {
    model: 'gen4_turbo',
    promptImage: [{ uri: img, position: 'first' }],
    ratio: '832:1104',
    duration: 5,
  });
});

test('gen4.5 requires a prompt', () => {
  assert.throws(() => buildRequest({ model: 'gen4.5', promptImage: img, ratio: '960:960', duration: 5 }), /needs --prompt/);
});

test('rejects models, ratios and durations the endpoint does not accept', () => {
  assert.throws(() => buildRequest({ model: 'gen3a_turbo', promptImage: img, ratio: '960:960', duration: 5 }), /Unsupported model/);
  assert.throws(() => buildRequest({ model: 'gen4_turbo', promptImage: img, ratio: '1080:1350', duration: 5 }), /not valid/);
  assert.throws(() => buildRequest({ model: 'gen4_turbo', promptImage: img, ratio: '960:960', duration: 11 }), /2 to 10/);
  assert.throws(() => buildRequest({ model: 'gen4_turbo', promptImage: img, ratio: '960:960', duration: 2.5 }), /2 to 10/);
  assert.throws(
    () => buildRequest({ model: 'gen4_turbo', promptImage: img, ratio: '960:960', duration: 5, prompt: 'x'.repeat(1001) }),
    /at most 1000/,
  );
});

test('every listed model offers the default ratio', () => {
  for (const spec of Object.values(MODELS)) assert.ok(spec.ratios.includes('832:1104'));
});

test('HTTPS images pass through; other schemes and missing files are refused', async () => {
  const client = { uploads: { createEphemeral: () => assert.fail('should not upload') } };
  assert.equal(await resolveImage(client, img), img);
  await assert.rejects(resolveImage(client, 'http://clearwren.com/a.jpg'), /HTTPS/);
  await assert.rejects(resolveImage(client, './nope.jpg'), /not found/);
  await assert.rejects(resolveImage(client, './notes.txt'), /not a JPEG/);
});

test('local images go through an ephemeral upload', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-'));
  const file = path.join(dir, 'card.png');
  fs.writeFileSync(file, Buffer.alloc(1024));
  let uploaded = false;
  const client = { uploads: { createEphemeral: async () => ((uploaded = true), { uri: 'runway://abc' }) } };
  assert.equal(await resolveImage(client, file), 'runway://abc');
  assert.ok(uploaded);
});

test('output names keep the source name and a task prefix', () => {
  const id = '11111111-2222-4333-8444-555555555555';
  assert.equal(outputName('../../site/assets/social/ig-launch-1.jpg', id, 0, 'https://x.test/v/abc.mp4?sig=1'), 'ig-launch-1-11111111.mp4');
  assert.equal(outputName(img, id, 1, 'https://x.test/v/abc'), 'ig-launch-1-11111111-2.mp4');
});

test('animate submits once, waits on the pending task, and saves the output', async (t) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-out-'));
  const id = 'aaaaaaaa-0000-4000-8000-000000000000';
  let createCalls = 0;
  let sentBody;
  const client = {
    organization: { retrieve: async () => ({ creditBalance: 100 }) },
    tasks: { delete: () => assert.fail('should not cancel') },
    uploads: { createEphemeral: () => assert.fail('URL input should not upload') },
    imageToVideo: {
      create(body) {
        createCalls += 1;
        sentBody = body;
        const pending = Promise.resolve({ id, estimatedCost: { credits: 25 } });
        pending.waitForTaskOutput = async () => ({ id, status: 'SUCCEEDED', output: ['https://cdn.test/clip.mp4'] });
        return pending;
      },
    },
  };
  t.mock.method(globalThis, 'fetch', async () => new Response(Buffer.from('fake-mp4')));

  const logs = [];
  const result = await animate(
    client,
    { image: img, model: 'gen4_turbo', ratio: '832:1104', duration: 5, prompt: 'slow push in', out },
    (m) => logs.push(m),
  );

  assert.equal(createCalls, 1);
  assert.equal(sentBody.promptText, 'slow push in');
  assert.match(logs[0], /Balance 100 credits\. This run: up to 25\. Left after: at least 75/);
  assert.match(logs[1], /25 credits/);
  assert.deepEqual(result.saved, [path.join(out, 'ig-launch-1-aaaaaaaa.mp4')]);
  assert.equal(fs.readFileSync(result.saved[0], 'utf8'), 'fake-mp4');
});

test('price table gives the worst case per run', () => {
  assert.equal(maxCost('gen4_turbo', 5), 25);
  assert.equal(maxCost('gen4.5', 10), 120);
});

test('budget check never lets the balance go below the floor', () => {
  assert.equal(checkBudget({ balance: 25, cost: 25 }), 0);
  assert.throws(() => checkBudget({ balance: 24, cost: 25 }), /Not enough credits/);
  assert.throws(() => checkBudget({ balance: 100, cost: 25, keep: 80 }), /keep 80 in reserve/);
  assert.throws(() => checkBudget({ balance: undefined, cost: 25 }), /Could not read/);
});

const opts = { image: img, model: 'gen4_turbo', ratio: '832:1104', duration: 5, out: os.tmpdir() };

test('a low balance stops the run before any upload or generation', async () => {
  const client = {
    organization: { retrieve: async () => ({ creditBalance: 20 }) },
    uploads: { createEphemeral: () => assert.fail('should not upload') },
    imageToVideo: { create: () => assert.fail('should not generate') },
  };
  await assert.rejects(animate(client, opts, () => {}), /balance 20, this run can cost up to 25/);
});

test('the reserve floor is respected', async () => {
  const client = {
    organization: { retrieve: async () => ({ creditBalance: 100 }) },
    imageToVideo: { create: () => assert.fail('should not generate') },
  };
  await assert.rejects(animate(client, { ...opts, keep: 80 }, () => {}), /Not enough credits/);
});

test('a task quoted above the balance is cancelled at once', async () => {
  const id = 'bbbbbbbb-0000-4000-8000-000000000000';
  let cancelled;
  const client = {
    organization: { retrieve: async () => ({ creditBalance: 30 }) },
    tasks: { delete: async (taskId) => { cancelled = taskId; } },
    imageToVideo: {
      create() {
        const pending = Promise.resolve({ id, estimatedCost: { credits: 40 } });
        pending.waitForTaskOutput = () => assert.fail('should not wait on a cancelled task');
        return pending;
      },
    },
  };
  await assert.rejects(animate(client, opts, () => {}), /quoted 40 credits.*cancelled/);
  assert.equal(cancelled, id);
});
