import type { Yarn, YarnWeight } from '../types';
import redHeartSuperSaver from '../../data/yarns/red-heart-super-saver.json';
import caronSimplySoft from '../../data/yarns/caron-simply-soft.json';
import lionBrandVannasChoice from '../../data/yarns/lion-brand-vannas-choice.json';

interface YarnLineFile {
  brand: string;
  line: string;
  weight: string;
  yardsPerSkein: number;
  note?: string;
  colors: { colorName: string; hex: string }[];
}

const FILES: YarnLineFile[] = [
  redHeartSuperSaver as YarnLineFile,
  caronSimplySoft as YarnLineFile,
  lionBrandVannasChoice as YarnLineFile,
];

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Flatten every color of every seeded line into a single Yarn list. */
export const ALL_YARNS: Yarn[] = FILES.flatMap((file) =>
  file.colors.map((c) => ({
    id: `${slug(file.brand)}-${slug(file.line)}-${slug(c.colorName)}`,
    brand: file.brand,
    line: file.line,
    colorName: c.colorName,
    hex: c.hex,
    weight: file.weight as YarnWeight,
    yardsPerSkein: file.yardsPerSkein,
  })),
);

export interface YarnLine {
  brand: string;
  line: string;
  weight: YarnWeight;
  yardsPerSkein: number;
  note?: string;
  count: number;
}

export const YARN_LINES: YarnLine[] = FILES.map((file) => ({
  brand: file.brand,
  line: file.line,
  weight: file.weight as YarnWeight,
  yardsPerSkein: file.yardsPerSkein,
  note: file.note,
  count: file.colors.length,
}));

export function lineKey(brand: string, line: string): string {
  return `${brand} ${line}`;
}

/** Yarns for one specific line (or all lines if not specified). */
export function getYarns(brand?: string, line?: string): Yarn[] {
  return ALL_YARNS.filter(
    (y) => (brand ? y.brand === brand : true) && (line ? y.line === line : true),
  );
}
