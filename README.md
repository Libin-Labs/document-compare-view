# @lp-labs/document-compare-view

Original bounded LCS document-block alignment and Unicode text edits for side-by-side views.

Original, independent MIT implementation. Zero runtime, peer or sibling dependencies. Requires Node.js 18+; strict TypeScript declarations support both ESM and CommonJS.

## Install

```sh
npm install @lp-labs/document-compare-view
```

## Quickstart

```js
import { diffText, compareDocuments } from '@lp-labs/document-compare-view';
const edits = diffText('cat', 'coat');
const rows = compareDocuments(
  [{ id: 'p1', text: 'cat' }],
  [
    { id: 'p1', text: 'coat' },
    { id: 'p2', text: 'New' },
  ],
);
if (
  !edits.some((e) => e.kind === 'insert' && e.text === 'o') ||
  rows[0].kind !== 'modified' ||
  rows[1].kind !== 'insert'
)
  throw new Error('Diff mismatch');
```

## API and types

`diffText(left, right): TextEdit[]` returns coalesced equal/insert/delete runs with text and original UTF-16 left/right offsets. Diffs operate on Unicode code points, without normalization; deletion wins LCS ties. `compareDocuments(left: readonly CompareBlock[], right): AlignedRow[]` aligns stable unique block ids with LCS and produces equal/modified/insert/delete rows, nullable left/right copies and text edits. Moved blocks are a delete and insert; changed text within matching ids is a modified row, not a new block. Reconstruct either side by excluding insert or delete runs respectively.

## Customize

Supply stable editor block ids and plain text to align views. Prepartition large documents into sections before comparing. Render returned rows using your own UI and escape text there.

## Errors and bounds

1000 blocks per document, 100,000 text units per block, 1,000,000 per document; each LCS matrix at most 250,000 cells. O(n*m) time/memory per matrix; identical text takes a linear/equality fast path. Exceeding any matrix limit throws rather than silently degrading diff quality. No third-party diff, HTML rendering, Word/PDF parsing or formatting comparison.

Invalid runtime inputs throw TypeError/RangeError or the documented typed error. Adapter errors propagate unchanged unless specifically noted; asynchronous methods reject. Inputs must be ordinary typed data, not hostile proxies or accessors. No I/O happens at import time. All runtime exports are documented above and the example executes without optional packages.

## Development

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

Build emits dist/esm and dist/cjs with matching declarations. Tests use Node's test runner; consumer.mts and consumer.cts validate meaningful bare-package imports and expected type errors. Only TypeScript ^5.9.3 and Prettier ^3.6.2 are development dependencies.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
