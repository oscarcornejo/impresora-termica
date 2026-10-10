import { useState } from 'react';
import { BlockEditor, ImagePicker } from '../components/BlockEditor';
import { PrintPanel, type PrintControls } from '../components/PrintPanel';
import { createBlock, moveBlock, removeBlock, sampleReceipt, updateBlock, withId } from '../lib/blocks';
import { fileToImageBlock } from '../lib/image';
import { PAPER_CHARS, PAPER_DOTS, type EditorBlock } from '../lib/types';

interface DesignerPageProps {
  blocks: EditorBlock[];
  onBlocksChange: (update: (prev: EditorBlock[]) => EditorBlock[]) => void;
  controls: PrintControls;
}

export function DesignerPage({ blocks, onBlocksChange, controls }: DesignerPageProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const add = (block: EditorBlock) => onBlocksChange((prev) => [...prev, block]);

  async function addImage(file: File, dither: boolean) {
    setImageError(null);
    try {
      const image = await fileToImageBlock(file, PAPER_DOTS[controls.paperWidth], { dither, align: 'center' });
      add(withId({ type: 'image', ...image }));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'No se pudo cargar la imagen');
    }
  }

  return (
    <div className="page designer-page">
      <section className="panel">
        <div className="editor-head">
          <h2>Contenido</h2>
          <div className="row wrap">
            <button className="secondary" onClick={() => onBlocksChange(() => sampleReceipt(PAPER_CHARS[controls.paperWidth]))}>Ejemplo</button>
            <button className="secondary" onClick={() => onBlocksChange(() => [])}>Vaciar</button>
          </div>
        </div>
        <div className="row wrap add-bar">
          <button className="secondary" onClick={() => add(createBlock('text'))}>+ Texto</button>
          <button className="secondary" onClick={() => add(createBlock('separator'))}>+ Separador</button>
          <button className="secondary" onClick={() => add(createBlock('qr'))}>+ QR</button>
          <button className="secondary" onClick={() => add(createBlock('feed'))}>+ Espacio</button>
          <ImagePicker onPick={addImage} />
        </div>
        {imageError && <p className="warning" role="alert">{imageError}</p>}
        <BlockEditor
          blocks={blocks}
          onChange={(id, patch) => onBlocksChange((prev) => updateBlock(prev, id, patch))}
          onMove={(id, delta) => onBlocksChange((prev) => moveBlock(prev, id, delta))}
          onRemove={(id) => onBlocksChange((prev) => removeBlock(prev, id))}
        />
      </section>

      <PrintPanel blocks={blocks} controls={controls} />
    </div>
  );
}
