import test from 'node:test';
import assert from 'node:assert/strict';
import { answer, authorize, chunk, evaluate, grounded, retrieve, seed } from '../lib/engine.ts';
test('evaluation suite rejects wrong answers, missing evidence and provider failures', async () => { for (const result of await evaluate())
    assert.equal(result.passed, true, result.name); });
test('separate business knowledge never mixes', () => { assert.equal(retrieve('returns delivery', seed('studio').docs).length, 0); assert.ok(retrieve('returns delivery', seed('northstar').docs).length); });
test('customer cannot approve, assign, upload or evaluate', () => { for (const action of ['reply', 'assign', 'upload', 'evaluate', 'retry', 'reopen'])
    assert.throws(() => authorize('customer', action)); assert.doesNotThrow(() => authorize('customer', 'ask')); });
test('agents can review but cannot change knowledge or run owner evaluations', () => { assert.doesNotThrow(() => authorize('agent', 'reply')); assert.throws(() => authorize('agent', 'upload')); assert.throws(() => authorize('agent', 'evaluate')); });
test('a ready source is required', async () => { const docs = seed('northstar').docs.map(d => ({ ...d, status: 'Processing' })); const r = await answer('returns delivery', docs); assert.equal(r.draft, ''); assert.equal(r.sources.length, 0); });
test('only exact source excerpts pass grounding', () => { const source = { id: '1', name: 'policy', quote: 'Returns are accepted within 30 days.' }; assert.equal(grounded('Returns are accepted within 365 days.', [source]), false); assert.equal(grounded(source.quote, [source]), true); assert.equal(grounded('', [source]), false); });
test('documents are split into inspectable passages', () => { assert.deepEqual(chunk('First policy.\n\nSecond policy.'), ['First policy.', 'Second policy.']); });
test('new answer cannot implicitly become a delivered reply', async () => { const r = await answer('returns delivery', seed('northstar').docs); assert.ok(r.draft); assert.equal('reply' in r, false); });
