import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cartCount } from '@core/cart';
import { useSaleSession } from '@core/saleSession';
import type { EditorBlock, PaperWidth } from '@core/types';
import { useBusiness } from '@core/useBusiness';
import { useAppData } from './data/AppDataContext';
import { PrinterPicker } from './printer/PrinterPicker';
import { usePrinter } from './printer/usePrinter';
import { ProductsScreen } from './screens/ProductsScreen';
import { SaleScreen } from './screens/SaleScreen';
import type { PrintControls } from './screens/sale/printControls';
import type { PaperOptions } from './screens/settings/PaperSettings';
import { SettingsScreen } from './screens/SettingsScreen';
import { PrinterChip } from './ui/PrinterChip';
import { TabBar } from './ui/TabBar';
import { colors, space } from './ui/theme';

type Tab = 'sale' | 'products' | 'settings';

const TITLES: Record<Tab, string> = { sale: 'Vender', products: 'Productos', settings: 'Ajustes' };

interface MainScreenProps {
  email: string;
  onSignOut: () => Promise<void>;
}

export function MainScreen({ email, onSignOut }: MainScreenProps) {
  const { top } = useSafeAreaInsets();
  const printer = usePrinter();
  const { business, error: businessError, save: saveBusiness } = useBusiness(useAppData());
  const sale = useSaleSession();
  const [tab, setTab] = useState<Tab>('sale');
  const [paper, setPaper] = useState<PaperOptions>({ paperWidth: 58, cut: false, darkness: 'max' });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasPrintFailed, setHasPrintFailed] = useState(false);
  // Un doble toque llega antes de que React desactive el botón: el ref corta el segundo envío.
  const isPrintingRef = useRef(false);

  // Al lograr la conexión, la hoja se cierra sola para volver directo a vender.
  useEffect(() => {
    if (printer.isConnected) setIsPickerOpen(false);
  }, [printer.isConnected]);

  // Las impresoras "cat" (como la YT01) solo imprimen 384 puntos de ancho.
  const isCatPrinter = printer.protocol === 'cat';
  const paperWidth: PaperWidth = isCatPrinter ? 58 : paper.paperWidth;

  async function print(blocks: EditorBlock[]) {
    if (isPrintingRef.current || blocks.length === 0) return false;
    isPrintingRef.current = true;
    setNotice(null);
    setHasPrintFailed(false);
    try {
      const isPrinted = await printer.print({ paperWidth, cut: paper.cut, darkness: paper.darkness, blocks });
      setHasPrintFailed(!isPrinted);
      if (isPrinted) setNotice('Enviado a la impresora');
      return isPrinted;
    } finally {
      isPrintingRef.current = false;
    }
  }

  // Cerrar la venta limpia también los avisos de la anterior.
  function startNewSale() {
    sale.newSale();
    setNotice(null);
    setHasPrintFailed(false);
    printer.clearError();
  }

  const controls: PrintControls = {
    paperWidth,
    hasTearLine: isCatPrinter && paper.cut,
    isConnected: printer.isConnected,
    busyLabel: printer.busy,
    canPrint: printer.busy === null && printer.isConnected,
    printError: hasPrintFailed ? printer.error : null,
    notice,
    openPrinter: () => setIsPickerOpen(true),
    print,
  };

  const itemCount = cartCount(sale.cart);

  return (
    <View style={styles.app}>
      <View style={[styles.header, { paddingTop: top + space(2) }]}>
        <Text accessibilityRole="header" style={styles.title}>{TITLES[tab]}</Text>
        <PrinterChip isConnected={printer.isConnected} name={printer.name} busy={printer.busy} onPress={() => setIsPickerOpen(true)} />
      </View>

      <View style={styles.body}>
        {tab === 'sale' && (
          <SaleScreen business={business} sale={sale} onNewSale={startNewSale} controls={controls} onGoToProducts={() => setTab('products')} />
        )}
        {tab === 'products' && <ProductsScreen />}
        {tab === 'settings' && (
          <SettingsScreen
            printer={printer}
            onOpenPrinter={() => setIsPickerOpen(true)}
            paper={paper}
            onPaperChange={setPaper}
            business={business}
            businessError={businessError}
            onBusinessSave={saveBusiness}
            email={email}
            onSignOut={onSignOut}
          />
        )}
      </View>

      <TabBar
        tabs={[
          { value: 'sale', label: 'Vender', badge: tab === 'sale' ? undefined : itemCount },
          { value: 'products', label: 'Productos' },
          { value: 'settings', label: 'Ajustes' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <PrinterPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} printer={printer} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space(3),
    paddingHorizontal: space(4),
    paddingBottom: space(2),
    backgroundColor: colors.bg,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  body: { flex: 1 },
});
