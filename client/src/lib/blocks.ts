import type { Block, BlockType, EditorBlock } from './types';

let counter = 0;
const nextId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

const DEFAULTS: Record<Exclude<BlockType, 'image'>, () => Block> = {
  text: () => ({ type: 'text', text: '', align: 'left', bold: false, underline: false, size: 1 }),
  separator: () => ({ type: 'separator' }),
  qr: () => ({ type: 'qr', data: 'https://', align: 'center', moduleSize: 6 }),
  feed: () => ({ type: 'feed', lines: 1 }),
};

export function createBlock(type: Exclude<BlockType, 'image'>, overrides: Partial<Block> = {}): EditorBlock {
  return { ...DEFAULTS[type](), ...overrides, id: nextId() } as EditorBlock;
}

export function withId(block: Block): EditorBlock {
  return { ...block, id: nextId() };
}

export function updateBlock(blocks: EditorBlock[], id: string, patch: Partial<Block>): EditorBlock[] {
  return blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EditorBlock) : b));
}

export function removeBlock(blocks: EditorBlock[], id: string): EditorBlock[] {
  return blocks.filter((b) => b.id !== id);
}

export function moveBlock(blocks: EditorBlock[], id: string, delta: -1 | 1): EditorBlock[] {
  const from = blocks.findIndex((b) => b.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= blocks.length) return blocks;
  const next = [...blocks];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// Impresoras sin cortador: marca dónde rasgar. Ids fijos para que la vista previa no cambie de key.
const TEAR_LINE_BLOCKS: EditorBlock[] = [
  { id: 'tear-feed', type: 'feed', lines: 1 },
  { id: 'tear-line', type: 'text', text: `${'- '.repeat(7)}✂${' -'.repeat(7)}`, align: 'center', bold: false, underline: false, size: 1 },
];

export function withTearLine<T extends Block>(blocks: T[]): Array<T | EditorBlock> {
  return [...blocks, ...TEAR_LINE_BLOCKS];
}

/** Une dos columnas en una línea del ancho del papel: "Café      $2.500". */
export function twoColumns(left: string, right: string, width: number): string {
  const space = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

export function sampleReceipt(chars: number): EditorBlock[] {
  const now = new Date().toLocaleString('es');
  return [
    createBlock('text', { text: 'MI NEGOCIO', align: 'center', bold: true, size: 2 }),
    createBlock('text', { text: 'Av. Siempre Viva 742\nTel: +56 9 1234 5678', align: 'center' }),
    createBlock('separator'),
    createBlock('text', { text: now }),
    createBlock('separator'),
    createBlock('text', {
      text: [
        twoColumns('2 x Café', '$5.000', chars),
        twoColumns('1 x Medialuna', '$1.800', chars),
        twoColumns('1 x Jugo natural', '$3.200', chars),
      ].join('\n'),
    }),
    createBlock('separator'),
    createBlock('text', { text: twoColumns('TOTAL', '$10.000', chars), bold: true }),
    createBlock('feed', { lines: 1 }),
    createBlock('qr', { data: 'https://example.com/boleta/123' }),
    createBlock('text', { text: '¡Gracias por su compra!', align: 'center' }),
  ];
}
