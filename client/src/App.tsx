import { useEffect, useRef, useState } from 'react';
import { AccountPanel } from './components/AccountPanel';
import { ConnectionPanel } from './components/ConnectionPanel';
import { PaperPanel } from './components/PaperPanel';
import { PrinterChip } from './components/PrinterChip';
import { PrinterSheet } from './components/PrinterSheet';
import type { PrintControls } from './components/PrintPanel';
import { SalePage } from './pages/SalePage';
import { ProductsPage } from './pages/ProductsPage';
import { DesignerPage } from './pages/DesignerPage';
import { usePrinter } from './lib/usePrinter';
import { useBusiness } from './lib/useBusiness';
import { sampleReceipt } from './lib/blocks';
import { useSaleSession } from './lib/saleSession';
import { PAPER_CHARS, type Darkness, type EditorBlock, type PaperWidth } from './lib/types';

type Tab = 'sale' | 'products' | 'designer';

const TABS: Array<[Tab, string]> = [
  ['sale', 'Vender'],
  ['products', 'Productos'],
  ['designer', 'Diseñador'],
];

interface AppProps {
  account: { email: string; onSignOut: () => void };
}

export default function App({ account }: AppProps) {
  const printer = usePrinter();
  const { business, error: businessError, save: saveBusiness } = useBusiness();
  const [tab, setTab] = useState<Tab>('sale');
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(58);
  const [cut, setCut] = useState(false);
  const [darkness, setDarkness] = useState<Darkness>('max');
  const sale = useSaleSession();
  const [designBlocks, setDesignBlocks] = useState<EditorBlock[]>(() => sampleReceipt(PAPER_CHARS[58]));
  const [notice, setNotice] = useState<string | null>(null);
  // El último envío falló: en Vender el error se muestra junto al botón, con la opción de reintentar.
  const [hasPrintFailed, setHasPrintFailed] = useState(false);
  const [isBusinessErrorDismissed, setIsBusinessErrorDismissed] = useState(false);
  const [isPrinterSheetOpen, setIsPrinterSheetOpen] = useState(false);
  const isConnected = printer.status.connected;

  // Al lograr la conexión, el panel se cierra solo para volver directo a vender.
  useEffect(() => {
    if (isConnected) setIsPrinterSheetOpen(false);
  }, [isConnected]);

  // Las impresoras "cat" (como la YT01) solo imprimen 384 puntos de ancho y no tienen cortador.
  const isCatPrinter = printer.protocol === 'cat';
  const effectiveWidth: PaperWidth = isCatPrinter ? 58 : paperWidth;

  // Un doble toque llega antes de que React desactive el botón: el ref corta el segundo envío.
  const isPrintingRef = useRef(false);

  async function print(blocks: EditorBlock[]) {
    if (isPrintingRef.current || blocks.length === 0) return false;
    isPrintingRef.current = true;
    setNotice(null);
    setHasPrintFailed(false);
    try {
      const result = await printer.print({ paperWidth: effectiveWidth, cut, darkness, blocks });
      setHasPrintFailed(!result);
      if (result) setNotice('Enviado a la impresora');
      return Boolean(result);
    } finally {
      isPrintingRef.current = false;
    }
  }

  // Cerrar la venta limpia también los avisos de la anterior, para que no se arrastren a la siguiente.
  function startNewSale() {
    sale.newSale();
    setNotice(null);
    setHasPrintFailed(false);
    printer.clearError();
  }

  const controls: PrintControls = {
    paperWidth: effectiveWidth,
    hasTearLine: isCatPrinter && cut,
    canPrint: printer.busy === null && isConnected,
    isConnected,
    busyLabel: printer.busy,
    openPrinter: () => setIsPrinterSheetOpen(true),
    notice,
    printError: hasPrintFailed ? printer.error : null,
    print,
  };

  function changeTab(next: Tab) {
    setNotice(null);
    setTab(next);
  }

  function editInDesigner(blocks: EditorBlock[]) {
    setDesignBlocks(blocks);
    changeTab('designer');
  }

  const error = printer.error ?? (isBusinessErrorDismissed ? null : businessError);
  const dismissError = () => {
    printer.clearError();
    setHasPrintFailed(false);
    setIsBusinessErrorDismissed(true);
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>Impresora térmica</h1>
        {/* Navegación entre pantallas (no pestañas): aria-current marca dónde estás, sin prometer flechas */}
        <nav className="tabs" aria-label="Secciones">
          {TABS.map(([value, label]) => (
            <button key={value} type="button" aria-current={tab === value ? 'page' : undefined} onClick={() => changeTab(value)}>
              {label}
            </button>
          ))}
        </nav>
        <PrinterChip isConnected={isConnected} name={printer.connectedName} onOpen={() => setIsPrinterSheetOpen(true)} />
      </header>

      <PrinterSheet isOpen={isPrinterSheetOpen} onClose={() => setIsPrinterSheetOpen(false)}>
        {printer.error && (
          <p className="warning" role="alert">{printer.error}</p>
        )}
        <ConnectionPanel
          status={printer.status}
          connectedName={printer.connectedName}
          protocol={printer.protocol}
          isBusy={printer.busy !== null}
          onConnect={printer.connect}
          onDisconnect={printer.disconnect}
        />
        <PaperPanel
          paperWidth={effectiveWidth}
          cut={cut}
          darkness={darkness}
          isCatPrinter={isCatPrinter}
          onPaperWidthChange={setPaperWidth}
          onCutChange={setCut}
          onDarknessChange={setDarkness}
        />
        <AccountPanel email={account.email} onSignOut={account.onSignOut} />
      </PrinterSheet>

      <main className="layout">
        {tab === 'sale' && (
          <SalePage
            business={business}
            sale={sale}
            onNewSale={startNewSale}
            controls={controls}
            onEditInDesigner={editInDesigner}
            onGoToProducts={() => changeTab('products')}
          />
        )}
        {tab === 'products' && <ProductsPage business={business} onBusinessSave={saveBusiness} />}
        {tab === 'designer' && <DesignerPage blocks={designBlocks} onBlocksChange={setDesignBlocks} controls={controls} />}
      </main>

      {/* En Vender el error de impresión ya se ve junto al botón: no se repite como aviso flotante. */}
      {error && !isPrinterSheetOpen && !(tab === 'sale' && controls.printError) && (
        // En Vender y Diseñador el aviso va arriba: abajo taparía la barra fija de cobro o de impresión.
        <div className={`toast ${tab === 'products' ? '' : 'is-top'}`} role="alert">
          <span>{error}</span>
          <button className="link" onClick={dismissError}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
