export function getValueIfStarts(obj, str) {
  for (const [key, value] of Object.entries(obj)) {
    if (str.startsWith(key)) {
      return value;
    }
  }
  return undefined; // если не найдено
}

export function customSort(array: string[], symbols: Record<string, any>) {
  const symbolKeys = Object.keys(symbols);

  return array.sort((a, b) => {
    const aIsSymbol = symbolKeys.includes(a[0]);
    const bIsSymbol = symbolKeys.includes(b[0]);

    if (aIsSymbol && !bIsSymbol) return -1; // a идёт раньше
    if (!aIsSymbol && bIsSymbol) return 1;  // b идёт раньше

    return a.localeCompare(b); // алфавитная сортировка
  });
}