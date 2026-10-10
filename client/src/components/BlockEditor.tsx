import { useRef, useState } from 'react';
import { Icon } from './Icon';
import { SegmentedControl, type SegmentedOption } from './SegmentedControl';
import type { Align, Block, EditorBlock } from '../lib/types';

interface BlockEditorProps {
  blocks: EditorBlock[];
  onChange: (id: string, patch: Partial<Block>) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
}

const TYPE_LABEL: Record<Block['type'], string> = {
  text: 'Texto',
  separator: 'Separador',
  qr: 'Código QR',
  image: 'Imagen',
  feed: 'Espacio',
};

const blockName = (block: EditorBlock, index: number) => `bloque ${index + 1} (${TYPE_LABEL[block.type]})`;

export function BlockEditor({ blocks, onChange, onMove, onRemove }: BlockEditorProps) {
  if (blocks.length === 0) {
    return <p className="empty">El ticket está vacío. Agrega un bloque o carga el ejemplo.</p>;
  }
  return (
    <ol className="blocks">
      {blocks.map((block, i) => (
        <li key={block.id} className="block">
          <header>
            <span className="block-type">{TYPE_LABEL[block.type]}</span>
            <div className="block-actions">
              {/* Nombres con tipo y posición: "Subir" a secas se repite igual en cada bloque para el lector de pantalla */}
              <button className="icon" aria-label={`Subir ${blockName(block, i)}`} onClick={() => onMove(block.id, -1)} disabled={i === 0}>
                <Icon name="arrowUp" size={18} />
              </button>
              <button className="icon" aria-label={`Bajar ${blockName(block, i)}`} onClick={() => onMove(block.id, 1)} disabled={i === blocks.length - 1}>
                <Icon name="arrowDown" size={18} />
              </button>
              <button className="icon danger" aria-label={`Eliminar ${blockName(block, i)}`} onClick={() => onRemove(block.id)}>
                <Icon name="close" size={18} />
              </button>
            </div>
          </header>
          <BlockFields block={block} onChange={(patch) => onChange(block.id, patch)} />
        </li>
      ))}
    </ol>
  );
}

function BlockFields({ block, onChange }: { block: EditorBlock; onChange: (patch: Partial<Block>) => void }) {
  switch (block.type) {
    case 'text':
      return (
        <>
          <textarea
            value={block.text}
            rows={Math.min(8, Math.max(2, block.text.split('\n').length))}
            placeholder="Escribe el texto…"
            onChange={(e) => onChange({ text: e.target.value })}
          />
          <div className="row wrap">
            <AlignPicker value={block.align} onChange={(align) => onChange({ align })} />
            <label className="check">
              <input type="checkbox" checked={block.bold} onChange={(e) => onChange({ bold: e.target.checked })} />
              Negrita
            </label>
            <label className="check">
              <input type="checkbox" checked={block.underline} onChange={(e) => onChange({ underline: e.target.checked })} />
              Subrayado
            </label>
            <label className="inline">
              Tamaño
              <select value={block.size} onChange={(e) => onChange({ size: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
                {[1, 2, 3, 4].map((s) => <option key={s} value={s}>{s}×</option>)}
              </select>
            </label>
          </div>
        </>
      );
    case 'qr':
      return (
        <>
          <input value={block.data} placeholder="URL o texto" onChange={(e) => onChange({ data: e.target.value })} />
          <div className="row wrap">
            <AlignPicker value={block.align} onChange={(align) => onChange({ align })} />
            <label className="inline">
              Tamaño
              <input type="range" min={3} max={12} value={block.moduleSize} onChange={(e) => onChange({ moduleSize: Number(e.target.value) })} />
            </label>
          </div>
        </>
      );
    case 'image':
      return (
        <div className="row wrap">
          <small>{block.width}×{block.height} puntos</small>
          <AlignPicker value={block.align} onChange={(align) => onChange({ align })} />
        </div>
      );
    case 'feed':
      return (
        <label className="inline">
          Líneas
          <input type="number" min={1} max={20} value={block.lines} onChange={(e) => onChange({ lines: clampLines(e.target.value) })} />
        </label>
      );
    case 'separator':
      return null;
  }
}

const clampLines = (value: string) => Math.min(20, Math.max(1, Number(value) || 1));

const ALIGN_OPTIONS: Array<SegmentedOption<Align>> = [
  { value: 'left', label: 'Izq.' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Der.' },
];

function AlignPicker({ value, onChange }: { value: Align; onChange: (align: Align) => void }) {
  return <SegmentedControl label="Alineación" options={ALIGN_OPTIONS} value={value} onChange={onChange} isSmall />;
}

interface ImagePickerProps {
  onPick: (file: File, dither: boolean) => void;
}

export function ImagePicker({ onPick }: ImagePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dither, setDither] = useState(true);
  return (
    <>
      <button className="secondary" onClick={() => input.current?.click()}>+ Imagen</button>
      <label className="check" title="Mejor para fotos; desactívalo para logos">
        <input type="checkbox" checked={dither} onChange={(e) => setDither(e.target.checked)} />
        Tramado
      </label>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file, dither);
          e.target.value = '';
        }}
      />
    </>
  );
}
