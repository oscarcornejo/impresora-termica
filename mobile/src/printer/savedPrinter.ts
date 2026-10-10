// La última impresora conectada: al abrir la app se reconecta sola, sin volver a buscarla.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

const KEY = 'impresora-termica:printer:v1';
const savedPrinterSchema = z.object({ id: z.string().min(1), name: z.string() });

export type SavedPrinter = z.infer<typeof savedPrinterSchema>;

export async function loadSavedPrinter(): Promise<SavedPrinter | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? savedPrinterSchema.safeParse(JSON.parse(raw)) : null;
    return parsed?.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const savePrinter = (printer: SavedPrinter) => AsyncStorage.setItem(KEY, JSON.stringify(printer)).catch(() => {});

export const forgetPrinter = () => AsyncStorage.removeItem(KEY).catch(() => {});
