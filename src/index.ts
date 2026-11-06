export interface CompareBlock {
  id: string;
  text: string;
}
export interface TextEdit {
  kind: 'equal' | 'insert' | 'delete';
  text: string;
  left: number;
  right: number;
}
export interface AlignedRow {
  kind: 'equal' | 'modified' | 'insert' | 'delete';
  left: CompareBlock | null;
  right: CompareBlock | null;
  edits: TextEdit[];
}
function sequence(a: readonly string[], b: readonly string[]): ('equal' | 'insert' | 'delete')[] {
  if ((a.length + 1) * (b.length + 1) > 250_000)
    throw new RangeError('Diff matrix exceeds 250000 cells');
  const cols = b.length + 1,
    dp = new Uint32Array((a.length + 1) * cols);
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i * cols + j] =
        a[i] === b[j]
          ? 1 + dp[(i + 1) * cols + j + 1]!
          : Math.max(dp[(i + 1) * cols + j]!, dp[i * cols + j + 1]!);
  const steps: ('equal' | 'insert' | 'delete')[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      steps.push('equal');
      i++;
      j++;
    } else if (
      i < a.length &&
      (j === b.length || dp[(i + 1) * cols + j]! >= dp[i * cols + j + 1]!)
    ) {
      steps.push('delete');
      i++;
    } else {
      steps.push('insert');
      j++;
    }
  }
  return steps;
}
/** Unicode code-point diff with original UTF-16 offsets; no normalization. */
export function diffText(left: string, right: string): TextEdit[] {
  if (
    typeof left !== 'string' ||
    typeof right !== 'string' ||
    left.length > 100_000 ||
    right.length > 100_000
  )
    throw new RangeError('Text limit');
  if (left === right) return left ? [{ kind: 'equal', text: left, left: 0, right: 0 }] : [];
  const a = [...left],
    b = [...right],
    result: TextEdit[] = [];
  let i = 0,
    j = 0,
    l = 0,
    r = 0;
  for (const kind of sequence(a, b)) {
    const text = kind === 'insert' ? b[j++]! : a[i++]!;
    if (kind === 'equal') j++;
    const last = result.at(-1);
    if (last?.kind === kind) last.text += text;
    else result.push({ kind, text, left: l, right: r });
    if (kind !== 'insert') l += text.length;
    if (kind !== 'delete') r += text.length;
  }
  return result;
}
export function compareDocuments(
  left: readonly CompareBlock[],
  right: readonly CompareBlock[],
): AlignedRow[] {
  for (const blocks of [left, right]) {
    if (!Array.isArray(blocks) || blocks.length > 1000) throw new RangeError('Block limit');
    const ids = new Set<string>();
    let size = 0;
    for (const block of blocks) {
      if (
        typeof block.id !== 'string' ||
        !block.id ||
        block.id.length > 128 ||
        ids.has(block.id) ||
        typeof block.text !== 'string' ||
        block.text.length > 100_000
      )
        throw new TypeError('Invalid block');
      ids.add(block.id);
      size += block.text.length;
      if (size > 1_000_000) throw new RangeError('Document text limit');
    }
  }
  const rows: AlignedRow[] = [];
  let i = 0,
    j = 0;
  for (const step of sequence(
    left.map((b) => b.id),
    right.map((b) => b.id),
  )) {
    const a = step === 'insert' ? null : { ...left[i++]! };
    const b = step === 'delete' ? null : { ...right[j++]! };
    rows.push({
      kind: a && b ? (a.text === b.text ? 'equal' : 'modified') : (step as 'insert' | 'delete'),
      left: a,
      right: b,
      edits:
        a && b
          ? diffText(a.text, b.text)
          : a
            ? [{ kind: 'delete', text: a.text, left: 0, right: 0 }]
            : [{ kind: 'insert', text: b!.text, left: 0, right: 0 }],
    });
  }
  return rows;
}
