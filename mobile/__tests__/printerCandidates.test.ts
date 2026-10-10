import { rankPrinterCandidates } from '../src/printer/printerCandidates';

const device = (id: string, name: string | undefined, rssi: number) => ({ id, name, rssi, advertising: { localName: undefined } });

describe('lista de impresoras encontradas', () => {
  test('muestra solo dispositivos con nombre, las impresoras primero y luego por señal', () => {
    const ranked = rankPrinterCandidates([
      device('1', 'AirPods', -40),
      device('2', undefined, -30),
      device('3', 'YT01', -80),
      device('4', 'PT-210', -60),
      device('5', 'Tele', -50),
    ]);
    expect(ranked.map((d) => d.name)).toEqual(['PT-210', 'YT01', 'AirPods', 'Tele']);
    expect(ranked[0].isLikelyPrinter).toBe(true);
    expect(ranked[2].isLikelyPrinter).toBe(false);
  });

  test('usa el nombre anunciado si el sistema no da otro', () => {
    const ranked = rankPrinterCandidates([{ id: '9', rssi: -50, advertising: { localName: 'GB02' } }]);
    expect(ranked).toEqual([{ id: '9', name: 'GB02', rssi: -50, isLikelyPrinter: true }]);
  });
});
