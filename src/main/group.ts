import fs from "fs";

export function loadSequences(sequencesPath: string): Record<string, string[]> {
  if (!fs.existsSync(sequencesPath)) return {};
  return JSON.parse(fs.readFileSync(sequencesPath, "utf-8"));
}

export function saveSequences(sequencesPath: string, sequences: Record<string, string[]>) {
  fs.writeFileSync(sequencesPath, JSON.stringify(sequences, null, 2), "utf-8");
}

export function addToSequence(sequencesPath: string, seqName: string, imagePath: string) {
  const sequences = loadSequences(sequencesPath);
  if (!sequences[seqName]) sequences[seqName] = [];
  if (!sequences[seqName].includes(imagePath)) {
    sequences[seqName].push(imagePath);
    saveSequences(sequencesPath, sequences);
  }
}

export function removeFromSequence(sequencesPath: string, seqName: string, imagePath: string) {
  const sequences = loadSequences(sequencesPath);
  if (sequences[seqName]) {
    sequences[seqName] = sequences[seqName].filter(p => p !== imagePath);
    saveSequences(sequencesPath, sequences);
  }
}

/**
 * Добавить несколько изображений в последовательность
 */
export function addArrToSequence(sequencesPath: string, seqName: string, imagePaths: string[]) {
  const sequences = loadSequences(sequencesPath);
  if (!sequences[seqName]) sequences[seqName] = [];

  // добавляем только новые
  imagePaths.forEach(img => {
    if (!sequences[seqName].includes(img)) {
      sequences[seqName].push(img);
    }
  });

  saveSequences(sequencesPath, sequences);
}

/**
 * Заменить порядок в последовательности
 * Передаём полностью новый массив
 */
export function reorderSequence(sequencesPath: string, seqName: string, newOrder: string[]) {
  const sequences = loadSequences(sequencesPath);
  if (!sequences[seqName]) {
    throw new Error(`Последовательность ${seqName} не найдена`);
  }

  // фильтруем: оставляем только те, что реально есть в группе
  const existing = sequences[seqName];
  sequences[seqName] = newOrder.filter(img => existing.includes(img));

  saveSequences(sequencesPath, sequences);
}

/**
 * Создать новую последовательность
 */
export function createSequence(sequencesPath: string, seqName: string, imagePaths: string[] = []) {
  const sequences = loadSequences(sequencesPath);
  if (sequences[seqName]) {
    throw new Error(`Последовательность ${seqName} уже существует`);
  }
  sequences[seqName] = [...new Set(imagePaths)];
  saveSequences(sequencesPath, sequences);
}

/**
 * Удалить последовательность
 */
export function deleteSequence(sequencesPath: string, seqName: string) {
  const sequences = loadSequences(sequencesPath);
  delete sequences[seqName];
  saveSequences(sequencesPath, sequences);
}

export function getGroup(sequencesPath: string, seqName: string){
    const sequences = loadSequences(sequencesPath);
    if (!sequences[seqName])
        throw new Error(`Последовательность ${seqName} не найдена`);
    return sequences[seqName]
}