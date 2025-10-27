export function getValueIfStarts(obj, str) {
  for (const [key, value] of Object.entries(obj)) {
    if (str.startsWith(key)) {
      return value;
    }
  }
  return undefined; // если не найдено
}