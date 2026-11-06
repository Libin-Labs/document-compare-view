import {
  compareDocuments,
  diffText,
  type CompareBlock,
  type AlignedRow,
  type TextEdit,
} from '@lp-labs/document-compare-view';
const left: CompareBlock[] = [{ id: 'p', text: 'old' }];
const rows: AlignedRow[] = compareDocuments(left, [{ id: 'p', text: 'new' }]);
const edits: TextEdit[] = diffText('😀', '😀!');
const offset: number = edits[0]!.left;
// @ts-expect-error blocks require stable identifiers
compareDocuments([{ text: 'bad' }], []);
void [rows, offset];
