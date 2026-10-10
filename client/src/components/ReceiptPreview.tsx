import type { EditorBlock, PaperWidth } from '../lib/types';
import { PAPER_CHARS, PAPER_DOTS } from '../lib/types';

interface ReceiptPreviewProps {
  blocks: EditorBlock[];
  paperWidth: PaperWidth;
}

// Aproximación visual: 1 punto de impresora = 1 px CSS en la vista previa.
export function ReceiptPreview({ blocks, paperWidth }: ReceiptPreviewProps) {
  const dots = PAPER_DOTS[paperWidth];
  const chars = PAPER_CHARS[paperWidth];
  return (
    <div className="paper" style={{ width: dots, ['--chars' as string]: chars }}>
      {blocks.map((block) => (
        <PreviewBlock key={block.id} block={block} chars={chars} />
      ))}
      <div className="tear" aria-hidden />
    </div>
  );
}

function PreviewBlock({ block, chars }: { block: EditorBlock; chars: number }) {
  switch (block.type) {
    case 'text':
      return (
        <pre
          className="p-text"
          style={{
            textAlign: block.align,
            fontWeight: block.bold ? 700 : 400,
            textDecoration: block.underline ? 'underline' : 'none',
            fontSize: `calc(var(--char-size) * ${block.size})`,
          }}
        >
          {block.text || ' '}
        </pre>
      );
    case 'separator':
      return <pre className="p-text">{'-'.repeat(chars)}</pre>;
    case 'qr':
      return (
        <div className="p-qr" style={{ justifyContent: flexAlign(block.align) }}>
          <div className="qr-placeholder" style={{ width: block.moduleSize * 25, height: block.moduleSize * 25 }}>
            <span>QR</span>
            <small>{block.data}</small>
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="p-image" style={{ justifyContent: flexAlign(block.align) }}>
          <img src={block.previewUrl} width={block.width} height={block.height} alt="" />
        </div>
      );
    case 'feed':
      return <div style={{ height: `calc(var(--feed-line) * ${block.lines})` }} />;
  }
}

const flexAlign = (align: 'left' | 'center' | 'right') =>
  ({ left: 'flex-start', center: 'center', right: 'flex-end' })[align];
