/**
 * Confetti reduction — the step that makes a quantized image actually crochetable.
 *
 * Quantization (especially with dithering, but also on busy photos) scatters
 * isolated single stitches of a color surrounded by another color. Those orphan
 * stitches are tedious and ugly to crochet (constant color changes for one
 * stitch). This pass finds connected components of equal color and dissolves any
 * smaller than a threshold into the color that borders them most.
 *
 * Cells are never added or removed, only recolored — so the total stitch count is
 * conserved. Level 0 is a no-op.
 */

const THRESHOLD_BY_LEVEL = [0, 2, 3, 5, 8]; // components with size < threshold are dissolved
const MAX_PASSES = 6;

export function reduceConfetti(
  cells: Int16Array,
  width: number,
  height: number,
  level: number,
): Int16Array {
  const lvl = Math.max(0, Math.min(4, Math.round(level)));
  const threshold = THRESHOLD_BY_LEVEL[lvl];
  const result = new Int16Array(cells); // copy; never mutate input
  if (threshold <= 0) return result;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const changed = onePass(result, width, height, threshold);
    if (!changed) break;
  }
  return result;
}

function onePass(cells: Int16Array, width: number, height: number, threshold: number): boolean {
  const n = width * height;
  const visited = new Uint8Array(n);
  const stack: number[] = [];
  // Reassignments computed against the current grid, applied after the full scan
  // so within-pass changes don't cascade unpredictably.
  const reassign: { members: number[]; to: number }[] = [];

  for (let start = 0; start < n; start++) {
    if (visited[start]) continue;
    const color = cells[start];

    // Flood-fill this component (4-connectivity).
    const members: number[] = [];
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;
    while (stack.length > 0) {
      const i = stack.pop()!;
      members.push(i);
      const x = i % width;
      const y = (i / width) | 0;
      if (x > 0) pushIf(i - 1, color, cells, visited, stack);
      if (x < width - 1) pushIf(i + 1, color, cells, visited, stack);
      if (y > 0) pushIf(i - width, color, cells, visited, stack);
      if (y < height - 1) pushIf(i + width, color, cells, visited, stack);
    }

    if (members.length >= threshold) continue;

    // Find the color that borders this component the most.
    const borderCounts = new Map<number, number>();
    for (const i of members) {
      const x = i % width;
      const y = (i / width) | 0;
      addBorder(borderCounts, x > 0 ? cells[i - 1] : -1, color);
      addBorder(borderCounts, x < width - 1 ? cells[i + 1] : -1, color);
      addBorder(borderCounts, y > 0 ? cells[i - width] : -1, color);
      addBorder(borderCounts, y < height - 1 ? cells[i + width] : -1, color);
    }
    let bestColor = -1;
    let bestCount = 0;
    for (const [c, count] of borderCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestColor = c;
      }
    }
    if (bestColor >= 0) reassign.push({ members, to: bestColor });
  }

  if (reassign.length === 0) return false;
  for (const { members, to } of reassign) {
    for (const i of members) cells[i] = to;
  }
  return true;
}

function pushIf(
  i: number,
  color: number,
  cells: Int16Array,
  visited: Uint8Array,
  stack: number[],
): void {
  if (!visited[i] && cells[i] === color) {
    visited[i] = 1;
    stack.push(i);
  }
}

function addBorder(counts: Map<number, number>, neighborColor: number, ownColor: number): void {
  if (neighborColor < 0 || neighborColor === ownColor) return;
  counts.set(neighborColor, (counts.get(neighborColor) ?? 0) + 1);
}
