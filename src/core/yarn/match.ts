import { differenceCiede2000 } from 'culori';
import type { MatchedYarn, PaletteColor, Yarn } from '../types';

/**
 * Match palette colors to real yarn using CIEDE2000 perceptual distance.
 *
 * CIEDE2000 (in Lab space) is the industry-standard color-difference metric; it
 * models how *different two colors look to a human*, which RGB distance does not.
 * Using it here is the difference between "that's the right blue" and "why did it
 * pick teal?".
 */
const deltaE = differenceCiede2000();

export function matchYarn(hex: string, yarns: Yarn[]): MatchedYarn | undefined {
  let best: Yarn | undefined;
  let bestD = Infinity;
  for (const yarn of yarns) {
    const d = deltaE(hex, yarn.hex);
    if (d < bestD) {
      bestD = d;
      best = yarn;
    }
  }
  return best ? { yarn: best, deltaE: bestD } : undefined;
}

/** Return a copy of the palette with each color's nearest yarn attached. */
export function matchPalette(palette: PaletteColor[], yarns: Yarn[]): PaletteColor[] {
  return palette.map((c) => ({ ...c, yarn: matchYarn(c.hex, yarns) }));
}
