import type { Darkness, PaperWidth } from '../lib/types';
import { SegmentedControl, type SegmentedOption } from './SegmentedControl';

const DARKNESS_OPTIONS: Array<SegmentedOption<Darkness>> = [
  { value: 'normal', label: 'Normal' },
  { value: 'dark', label: 'Oscura' },
  { value: 'max', label: 'Máxima' },
];

interface PaperPanelProps {
  paperWidth: PaperWidth;
  cut: boolean;
  darkness: Darkness;
  /** Impresora "cat" (YT01…): solo 58 mm, sin cortador y con intensidad ajustable. */
  isCatPrinter: boolean;
  onPaperWidthChange: (width: PaperWidth) => void;
  onCutChange: (cut: boolean) => void;
  onDarknessChange: (darkness: Darkness) => void;
}

export function PaperPanel({
  paperWidth, cut, darkness, isCatPrinter, onPaperWidthChange, onCutChange, onDarknessChange,
}: PaperPanelProps) {
  return (
    <section className="panel">
      <h3>Papel</h3>
      <SegmentedControl
        label="Ancho del papel"
        options={([58, 80] as const).map((w) => ({ value: w, label: `${w} mm`, isDisabled: isCatPrinter && w !== 58 }))}
        value={paperWidth}
        onChange={onPaperWidthChange}
      />
      <label className="check">
        <input type="checkbox" checked={cut} onChange={(e) => onCutChange(e.target.checked)} />
        {isCatPrinter
          ? 'Avanzar papel y marcar línea de corte ✂'
          : 'Cortar papel al terminar (si la impresora tiene cortador)'}
      </label>
      {isCatPrinter && (
        <>
          <h4>Intensidad</h4>
          <SegmentedControl label="Intensidad de impresión" options={DARKNESS_OPTIONS} value={darkness} onChange={onDarknessChange} />
        </>
      )}
    </section>
  );
}
