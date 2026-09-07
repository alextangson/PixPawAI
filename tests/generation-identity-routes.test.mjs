import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const fixture = await sharp({ create: { width: 32, height: 32, channels: 3, background: 'white' } }).png().toBuffer();
const detailed = { petType: 'dog', hasPet: true, isSafe: true, breed: 'unknown', detectedColors: 'white fur' };
const quick = { petType: 'dog', hasPet: true, isClear: true, quality: 'good' };
const body = { style: 'Christmas-Vibe', imageUrl: 'https://fixture.invalid/dog.png', prompt: 'my pet', detailedAnalysis: detailed };
function request(data) {
  return new Request('https://fixture.invalid/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

function harness(settings = {}) {
  const calls = { rpc: [], models: [], inserts: [], uploads: [], moderation: [], analysis: 0, visionModels: [] };
  let generation;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'TEST-USER' } } }) },
    rpc: async (name, args) => { calls.rpc.push({ name, args }); return { data: 9, error: null }; },
    storage: { from: bucket => ({
      upload: async (key) => { calls.uploads.push({ bucket, key }); return { data: { path: key }, error: null }; },
      getPublicUrl: key => ({ data: { publicUrl: `https://fixture.invalid/${key}` } }),
    }) },
    from(table) {
      const query = {
        select() { return query; }, eq() { return query; },
        insert(row) { calls.inserts.push({ table, row }); if (table === 'generations') generation = { id: 'TEST-GEN', ...row }; return query; },
        update() { return query; }, delete() { return query; },
        single: async () => ({ data: table === 'profiles' ? { credits: 10 } : table === 'styles'
          ? { recommended_strength_min: 0.92, recommended_guidance: 2.5, enable_go_fast: false } : generation, error: null }),
        then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
      };
      return query;
    },
  };
  const quiet = { log() {}, info() {}, error() {}, warn() {} };
  const cache = new Map();
  const fetcher = async (url, init) => {
    if (url.includes('api.creem.io/v1/moderation/prompt')) {
      calls.moderation.push(JSON.parse(init.body));
      if (settings.moderationFails) throw new Error('synthetic moderation failure');
      return Response.json({
        id: 'mod_SYNTHETIC',
        decision: settings.moderationDecision ?? 'allow',
        usage: { units: 1 },
      });
    }
    if (url.includes('siliconflow')) {
      calls.analysis++;
      calls.visionModels.push(JSON.parse(init.body).model);
      if (settings.analysisFails) return Response.json({ error: 'synthetic provider failure' }, { status: 503 });
      return Response.json({ choices: [{ message: { content: settings.analysisContent ?? JSON.stringify({ ...detailed, multiplePets: 1 }) } }] });
    }
    if (url.includes('create-share-card')) return new Response(null, { status: 503 });
    return new Response(fixture);
  };
  function load(relative) {
    relative = path.normalize(relative);
    if (cache.has(relative)) return cache.get(relative);
    const source = readFileSync(path.join(root, relative), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    const imports = name => {
      if (name === 'next/server' || name === 'sharp') return require(name);
      if (name === 'replicate') return class { async run(model, options) { calls.models.push({ model, ...options }); return ['https://fixture.invalid/output.png']; } };
      if (name === '@/lib/supabase/server') return { createClient: async () => client, createAdminClient: () => client };
      if (name === '@/lib/supabase/styles') return { getStyleConfigWithFallback: async () => ({
        id: 'Christmas-Vibe', label: 'Merry Christmas',
        // Reproduce the old database row, not just the repaired local preset.
        promptSuffix: ', wearing a fluffy red and white Santa hat, high-end commercial photography',
      }) };
      if (name === '@/lib/rate-limit') return { checkRateLimitSmart: async () => ({ success: true }), getClientIp: () => 'TEST-IP' };
      if (name === '@/lib/guest-credits') return {};
      if (name === '@/lib/watermark') return { applyWatermark: async buffer => buffer };
      if (name === '@/lib/moderation/violation-tracker') return { checkUserViolations: async () => ({ allowed: true }), logViolation: async () => {} };
      if (name === '@/lib/moderation/keyword-filter') return { filterPrompt: prompt => ({ cleaned: prompt, blocked: false }) };
      if (name === '@/lib/logger') return { logger: new Proxy({}, { get: () => () => {} }), logPromptBuild() {} };
      if (name.endsWith('feature-flags')) return { FEATURE_FLAGS: { USE_NEW_PROMPT_SYSTEM: settings.newSystem !== false, DISABLE_CONFLICT_CLEANING: false } };
      let resolved = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(relative), name);
      resolved = existsSync(path.join(root, `${resolved}.ts`)) ? `${resolved}.ts` : `${resolved}/index.ts`;
      return load(resolved);
    };
    // Actual route and prompt builders; only external I/O and unrelated policy services are mocked.
    vm.runInThisContext(`(function(require,module,exports,fetch,console,process,setTimeout) { ${output}\n})`, { filename: relative })(
      imports, module, module.exports, fetcher, quiet,
      { env: { REPLICATE_API_TOKEN: 'SYNTHETIC', SILICONFLOW_API_KEY: 'SYNTHETIC', CREEM_MODERATION_API_KEY: 'SYNTHETIC' } },
      callback => { callback(); return 0; },
    );
    cache.set(relative, module.exports);
    return module.exports;
  }
  return { calls, post: route => load(`app/api/${route}/route.ts`).POST };
}

test('unknown detailed analysis falls back to quick dog; old 0.92 config is capped', async () => {
  for (const newSystem of [true, false]) {
    const h = harness({ newSystem });
    const response = await h.post('generate')(request({ ...body, detailedAnalysis: { ...detailed, petType: 'unknown' }, quickAnalysis: quick, strength: 0.92 }));
    assert.equal(response.status, 200);
    assert.equal(h.calls.analysis, 0);
    assert.deepEqual(h.calls.moderation, [{ prompt: 'my pet' }]);
    assert.equal(h.calls.models.length, 1);
    assert.match(h.calls.models[0].input.prompt, /^Pet portrait of the same dog/);
    assert.match(h.calls.models[0].input.prompt, /Santa hat/i);
    assert.equal(h.calls.models[0].input.prompt_strength, 0.9);
    assert.equal(h.calls.models[0].input.disable_safety_checker, false);
    assert.ok(h.calls.models[0].input.image);
    assert.equal(h.calls.inserts.find(x => x.table === 'generations').row.metadata.analysisDataSource, 'quick');
    assert.equal(h.calls.rpc.filter(x => x.name === 'decrement_credits').length, 1);
  }
});

test('Creem flag, deny, and outage block before persistence, billing, or generation', async () => {
  for (const settings of [
    { moderationDecision: 'flag', expectedStatus: 400, expectedCode: 'PROMPT_REJECTED' },
    { moderationDecision: 'deny', expectedStatus: 400, expectedCode: 'PROMPT_REJECTED' },
    { moderationFails: true, expectedStatus: 503, expectedCode: 'MODERATION_UNAVAILABLE' },
  ]) {
    const h = harness(settings);
    const response = await h.post('generate')(request(body));
    assert.equal(response.status, settings.expectedStatus);
    assert.equal((await response.json()).code, settings.expectedCode);
    assert.equal(h.calls.moderation.length, 1);
    assert.equal(h.calls.models.length, 0);
    assert.equal(h.calls.rpc.length, 0);
    assert.equal(h.calls.inserts.length, 0);
  }
});

test('unknown identity and provider failure never generate, save, or charge', async () => {
  const h = harness({ analysisFails: true });
  const response = await h.post('generate')(request({ ...body, detailedAnalysis: { petType: 'unknown' }, quickAnalysis: { petType: 'pet' } }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'PET_IDENTITY_UNAVAILABLE');
  assert.equal(h.calls.models.length, 0);
  assert.equal(h.calls.rpc.length, 0);
  assert.equal(h.calls.inserts.length, 0);
  assert.equal(h.calls.uploads.length, 0);
});

test('backend analysis can recover when both client results are unknown', async () => {
  const h = harness();
  const response = await h.post('generate')(request({ ...body, detailedAnalysis: { petType: 'unknown' }, quickAnalysis: { petType: 'pet' } }));
  assert.equal(response.status, 200);
  assert.equal(h.calls.analysis, 1);
  assert.deepEqual(h.calls.visionModels, ['Qwen/Qwen3-VL-8B-Instruct']);
  assert.match(h.calls.models[0].input.prompt, /same dog/);
});

test('missing reference and explicit no-pet or unsafe results cannot spend credits', async () => {
  for (const overrides of [{ imageUrl: '' }, { detailedAnalysis: { ...detailed, hasPet: false } }, { detailedAnalysis: { ...detailed, isSafe: false } }]) {
    const h = harness();
    assert.ok((await h.post('generate')(request({ ...body, ...overrides }))).status >= 400);
    assert.equal(h.calls.models.length, 0);
    assert.equal(h.calls.rpc.length, 0);
  }
});

test('Test Lab and cat portraits use the same identity and strength guards', async () => {
  const h = harness();
  const response = await h.post('generate')(request({ ...body, testMode: true, strength: 1, detailedAnalysis: { ...detailed, petType: 'cat' } }));
  assert.equal(response.status, 200);
  assert.match(h.calls.models[0].input.prompt, /same cat/);
  assert.equal(h.calls.models[0].input.prompt_strength, 0.9);
  assert.equal(h.calls.rpc.length, 0);
});

test('analysis routes return retryable errors, never fake successful pet detection', async () => {
  for (const route of ['check-quality', 'quick-quality-check']) {
    for (const settings of [{ analysisFails: true }, { analysisContent: 'unparseable' }, { analysisContent: JSON.stringify({ hasPet: true, isSafe: true, petType: 'unknown' }) }]) {
      const h = harness(settings);
      const response = await h.post(route)(request({ imageUrl: body.imageUrl }));
      assert.equal(response.status, 503, route);
      const result = await response.json();
      assert.equal(result.code, 'PET_ANALYSIS_UNAVAILABLE');
      assert.notEqual(result.hasPet, true);
      assert.notEqual(result.isSafe, true);
      assert.ok(h.calls.visionModels.every(model => model === 'Qwen/Qwen3-VL-8B-Instruct'));
    }
  }
});
