import assert from 'node:assert/strict';
import test from 'node:test';
import { diffText, compareDocuments } from '../dist/esm/index.js';

const reconstruct = (edits, side) =>
  edits
    .filter((e) => e.kind !== (side === 'left' ? 'insert' : 'delete'))
    .map((e) => e.text)
    .join('');
test('actual character edits and UTF-16 offsets preserve emoji boundaries', () => {
  const edits = diffText('😀cat', '😀coat');
  assert.deepEqual(edits, [
    { kind: 'equal', text: '😀c', left: 0, right: 0 },
    { kind: 'insert', text: 'o', left: 3, right: 3 },
    { kind: 'equal', text: 'at', left: 3, right: 4 },
  ]);
  assert.equal(reconstruct(edits, 'left'), '😀cat');
  assert.equal(reconstruct(edits, 'right'), '😀coat');
});
test('block identities align modified, inserted and removed rows', () => {
  const rows = compareDocuments(
    [
      { id: 'a', text: 'old' },
      { id: 'b', text: 'gone' },
      { id: 'd', text: 'same' },
    ],
    [
      { id: 'a', text: 'new' },
      { id: 'c', text: 'added' },
      { id: 'd', text: 'same' },
    ],
  );
  assert.deepEqual(
    rows.map((r) => r.kind),
    ['modified', 'delete', 'insert', 'equal'],
  );
  assert.equal(rows[1].right, null);
  assert.equal(rows[2].left, null);
  assert.equal(reconstruct(rows[0].edits, 'left'), 'old');
  assert.equal(reconstruct(rows[0].edits, 'right'), 'new');
});
test('empty and identical documents and text', () => {
  assert.deepEqual(diffText('', ''), []);
  assert.deepEqual(compareDocuments([], []), []);
  assert.deepEqual(diffText('same', 'same'), [{ kind: 'equal', text: 'same', left: 0, right: 0 }]);
  assert.equal(reconstruct(diffText('', 'hello'), 'right'), 'hello');
});
test('deterministic reconstruction for many bounded inputs', () => {
  const values = ['a', 'ab', 'ba', '😀x', 'x😀', '', 'a\u0301'];
  for (const a of values)
    for (const b of values) {
      const edits = diffText(a, b);
      assert.equal(reconstruct(edits, 'left'), a);
      assert.equal(reconstruct(edits, 'right'), b);
    }
});
test('rows own their block records', () => {
  const left = [{ id: 'x', text: 'a' }],
    rows = compareDocuments(left, [{ id: 'x', text: 'b' }]);
  left[0].text = 'mutated';
  assert.equal(rows[0].left.text, 'a');
});
test('matrix, duplicate IDs and text capacity fail', () => {
  assert.throws(() => diffText('a'.repeat(500), 'b'.repeat(500)), RangeError);
  assert.throws(
    () =>
      compareDocuments(
        [
          { id: 'x', text: 'a' },
          { id: 'x', text: 'b' },
        ],
        [],
      ),
    TypeError,
  );
  assert.throws(() => diffText('x'.repeat(100001), ''), RangeError);
  assert.throws(() => compareDocuments(new Array(1001), []), RangeError);
});
