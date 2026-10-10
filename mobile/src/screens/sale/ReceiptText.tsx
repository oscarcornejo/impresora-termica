import { StyleSheet, Text, View } from 'react-native';
import { PAPER_CHARS, type Block, type PaperWidth } from '@core/types';
import { radius, space } from '../../ui/theme';

const FONT = 'Menlo';
const BASE_SIZE = 12;

/** Vista previa del comprobante en texto monoespaciado, como sale del papel. */
export function ReceiptText({ blocks, paperWidth }: { blocks: Block[]; paperWidth: PaperWidth }) {
  const chars = PAPER_CHARS[paperWidth];
  return (
    <View style={styles.paper} accessibilityLabel="Vista previa del comprobante">
      {blocks.map((block, index) => {
        if (block.type === 'separator') return <Text key={index} style={styles.line} numberOfLines={1}>{'-'.repeat(chars)}</Text>;
        if (block.type === 'feed') return <Text key={index} style={styles.line}>{'\n'.repeat(Math.max(0, block.lines - 1))}</Text>;
        if (block.type !== 'text') return null;
        return (
          <Text
            key={index}
            style={[
              styles.line,
              { textAlign: block.align, fontSize: BASE_SIZE * Math.min(block.size, 2) },
              block.bold && styles.bold,
              block.underline && styles.underline,
            ]}
          >
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    alignSelf: 'center',
    backgroundColor: '#fffefb',
    padding: space(4),
    borderRadius: radius.s,
    shadowColor: '#281e0a',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  line: { fontFamily: FONT, fontSize: BASE_SIZE, color: '#111', lineHeight: 17 },
  bold: { fontWeight: '700' },
  underline: { textDecorationLine: 'underline' },
});
