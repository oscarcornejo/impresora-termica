import { choosePrinterChannel, type ServiceInfo } from '../src/printer/printerChannel';

const characteristic = (service: string, uuid: string, props: string[]) => ({
  service,
  characteristic: uuid,
  properties: Object.fromEntries(props.map((p) => [p, p])),
});

describe('canal de escritura de la impresora', () => {
  test('impresora "cat": usa AE01 para escribir y AE02 para saber cuándo pausar', () => {
    const info: ServiceInfo = {
      characteristics: [
        characteristic('AE30', 'AE01', ['WriteWithoutResponse']),
        characteristic('AE30', 'AE02', ['Notify']),
      ],
    };
    expect(choosePrinterChannel('YT01', info)).toEqual({
      protocol: 'cat',
      write: { service: 'AE30', characteristic: 'AE01', withoutResponse: true },
      notify: { service: 'AE30', characteristic: 'AE02' },
    });
  });

  test('ESC/POS: la primera característica en la que se pueda escribir', () => {
    const info: ServiceInfo = {
      characteristics: [
        characteristic('180A', '2A29', ['Read']),
        characteristic('18F0', '2AF1', ['Write']),
      ],
    };
    expect(choosePrinterChannel('PT-210', info)).toEqual({
      protocol: 'escpos',
      write: { service: '18F0', characteristic: '2AF1', withoutResponse: false },
      notify: null,
    });
  });

  test('una "cat" sin su servicio se trata como ESC/POS', () => {
    const info: ServiceInfo = { characteristics: [characteristic('FF00', 'FF02', ['WriteWithoutResponse', 'Write'])] };
    expect(choosePrinterChannel('YT01', info)?.protocol).toBe('escpos');
    expect(choosePrinterChannel('YT01', info)?.write.withoutResponse).toBe(true);
  });

  test('sin dónde escribir no hay canal', () => {
    expect(choosePrinterChannel('Audífonos', { characteristics: [characteristic('180F', '2A19', ['Read', 'Notify'])] })).toBeNull();
    expect(choosePrinterChannel('X', {})).toBeNull();
  });
});
