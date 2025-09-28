import fs from "fs";
import { getImage, getImagesFromFolder } from "./load_img";
import { GalleryItem, Image64 } from "../preload/types";
import { Filter } from "./types";

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

export async function getGroup(
    tagsPath: string,
    folderPath: string,
    sequencesPath: string, 
    seqName: string
): Promise<Image64[]>{
    const sequences = loadSequences(sequencesPath);
    if (!sequences[seqName])
        throw new Error(`Последовательность ${seqName} не найдена`);
    const images = sequences[seqName]
    const imagesParse: (Image64 | null)[] = []
    for (const element of images) {
        imagesParse.push(await getImage(tagsPath, folderPath, element) ) 
    }
    images.map(img => {
        getImage(tagsPath, folderPath, img)
    })
    return imagesParse.filter((img): img is Image64 => img !== null);
}




/**
 * Получить список для галереи: обычные изображения + группы
 */
export async function getGalleryItems(
  tagsPath: string,
  folderPath: string,
  sequencesPath: string,
  filter: Filter,
  page: number = 0,
  pageSize: number = 10
): Promise<{ items: GalleryItem[]; pages: number }> {
  // 1. Загружаем группы
  const sequences = loadSequences(sequencesPath);

  // Собираем все имена файлов, которые входят в группы
  const groupedImages = new Set(
    Object.values(sequences).flatMap((seq) => seq)
  );

  const groups: GalleryItem[] = [];
  for (const [seqName, files] of Object.entries(sequences)) {
    if (files.length === 0) continue;

    const matchSearch =
      !filter.search || seqName.toLowerCase().includes(filter.search.toLowerCase());

    if (!matchSearch) continue;

    const first = await getImage(tagsPath, folderPath, files[0], filter);
    groups.push({
      type: "group",
      name: seqName,
      images: files,
      preview: first,
    });
  }

  // 2. Загружаем одиночные картинки
  const { img } = await getImagesFromFolder(tagsPath, folderPath, filter);

  const images: GalleryItem[] = img
    .filter((image) => !groupedImages.has(image.name)) // убираем те, что в группах
    .map((image) => ({
      type: "image",
      ...image,
    }));

  // 3. Объединяем
  const allItems = [...groups, ...images];

  // Пагинация (по общему списку)
  const totalPages = Math.ceil(allItems.length / pageSize);
  const start = page * pageSize;
  const items = allItems.slice(start, start + pageSize);

  return { items, pages: totalPages };
}