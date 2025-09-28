import fs from "fs";
import { getImage, getImagesFromFolder, imgbase64 } from "./load_img";
import { GalleryItem, Image64, Image64WithGroup, ImageWithGroup } from "../preload/types";
import { Filter } from "./types";
import { loadData } from "./tags";

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
export async function getItemsWithGroup(
  tagsPath: string,
  folderPath: string,
  sequencesPath: string,
  filter?: Filter
): Promise<GalleryItem[]> {
  const sequences = loadSequences(sequencesPath);

  const groupedImages = new Set(Object.values(sequences).flatMap((seq) => seq));

  const groups: GalleryItem[] = [];
  for (const [seqName, files] of Object.entries(sequences)) {
    if (files.length === 0) continue;

    // Проверка фильтра
    let matchSearch = true;
    if (filter?.search) {
      matchSearch = seqName.toLowerCase().includes(filter.search.toLowerCase());
    }

    let matchTags = true;
    if (filter && filter.filter.tags.length > 0) {
      // Проверяем: есть ли хотя бы один файл в группе с нужным тегом
      const tagsFile = loadData(tagsPath);
      matchTags = files.some((fileName) => {
        const fileData = tagsFile[fileName];
        if (!fileData) return false;
        return filter.filter.tags.every((tag) =>
          fileData.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
      });
    }

    if (!matchSearch || !matchTags) continue;

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

  return allItems;
}


export async function getGalleryItems(
  tagsPath: string,
  folderPath: string,
  sequencesPath: string,
  filter?: Filter,
  page: number = 0,
  pageSize: number = 10
): Promise<{ items: GalleryItem[]; pages: number }> {
  const allItems = await getItemsWithGroup(tagsPath, folderPath, sequencesPath, filter);

  const totalPages = Math.ceil(allItems.length / pageSize);
  const start = page * pageSize;
  const items = allItems.slice(start, start + pageSize);

  return { items, pages: totalPages };
}


export async function getImageWhithGroup(
  tagsPath: string,
  folderPath: string,
  nameTuple: [string, string?],
  sequencesPath: string,
  filter?: Filter
): Promise<Image64WithGroup | null> {
  try {
    const [fileName, groupName] = nameTuple;

    const items = await getItemsWithGroup(tagsPath, folderPath, sequencesPath, filter);

    // Создаём плоский список галереи
    const flatList: { name: string; group?: string }[] = [];
    for (const item of items) {
      if (item.type === "group") {
        for (const imgName of item.images) {
          flatList.push({ name: imgName, group: item.name });
        }
      } else {
        flatList.push({ name: item.name });
      }
    }

    const currentIndex = flatList.findIndex(
      (el) => el.name === fileName && el.group === groupName
    );

    if (currentIndex === -1) return null;

    const prevItem = flatList[currentIndex - 1];
    const nextItem = flatList[currentIndex + 1];

    const data = await getImage(tagsPath, folderPath, fileName, filter);
    if (!data) return null;

    const prev: [string, string?] | undefined =
      prevItem ? [prevItem.name, prevItem.group] : undefined;

    const next: [string, string?] | undefined =
      nextItem ? [nextItem.name, nextItem.group] : undefined;

    return {
      path: data.path,
      fullPath: data.fullPath,
      base64: await imgbase64(data.fullPath),
      order: data.order,
      tags: data.tags,
      name: fileName,
      group: groupName,
      prev,
      next,
    };
  } catch (err) {
    console.error("Ошибка при чтении файла:", err);
    return null;
  }
}
