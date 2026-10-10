/** Storage en memoria con la misma interfaz que localStorage (pruebas, o si el navegador lo bloquea). */
export function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  let data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data = new Map(data).set(key, String(value)); },
    removeItem: (key) => { const next = new Map(data); next.delete(key); data = next; },
    clear: () => { data = new Map(); },
  };
}
