import { StyleSheet, Switch, Text, View } from 'react-native';
import type { Darkness, PaperWidth } from '@core/types';
import { Segmented, type SegmentedOption } from '../../ui/Segmented';
import { colors, MIN_TOUCH, space, text } from '../../ui/theme';

const DARKNESS_OPTIONS: Array<SegmentedOption<Darkness>> = [
  { value: 'normal', label: 'Normal' },
  { value: 'dark', label: 'Oscura' },
  { value: 'max', label: 'Máxima' },
];

export interface PaperOptions {
  paperWidth: PaperWidth;
  cut: boolean;
  darkness: Darkness;
}

interface PaperSettingsProps {
  options: PaperOptions;
  /** Las "cat" (como la YT01) solo usan papel de 58 mm y no tienen cortador. */
  isCatPrinter: boolean;
  onChange: (options: PaperOptions) => void;
}

export function PaperSettings({ options, isCatPrinter, onChange }: PaperSettingsProps) {
  const set = <K extends keyof PaperOptions>(key: K) => (value: PaperOptions[K]) => onChange({ ...options, [key]: value });
  return (
    <>
      <View style={styles.group}>
        <Text style={styles.label}>Ancho del papel</Text>
        <Segmented
          label="Ancho del papel"
          options={([58, 80] as const).map((w) => ({ value: w, label: `${w} mm`, isDisabled: isCatPrinter && w !== 58 }))}
          value={isCatPrinter ? 58 : options.paperWidth}
          onChange={set('paperWidth')}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{isCatPrinter ? 'Línea para cortar al final' : 'Cortar el papel al final'}</Text>
        <Switch
          accessibilityLabel={isCatPrinter ? 'Línea para cortar al final' : 'Cortar el papel al final'}
          value={options.cut}
          onValueChange={set('cut')}
          trackColor={{ true: colors.ok, false: colors.line }}
        />
      </View>
      {isCatPrinter && (
        <View style={styles.group}>
          <Text style={styles.label}>Intensidad</Text>
          <Segmented label="Intensidad de impresión" options={DARKNESS_OPTIONS} value={options.darkness} onChange={set('darkness')} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: space(2) },
  label: { fontSize: text.meta, color: colors.inkSoft, fontWeight: '500' },
  switchRow: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(3) },
  switchLabel: { flex: 1, fontSize: text.body, color: colors.ink },
});
