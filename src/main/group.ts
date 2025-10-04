import fs from 'fs'

import { getImage, getImagesFromFolderAll, imgbase64 } from './load_img'
import { loadData } from './tags'
import { Filter } from './types'
import { GalleryItem, GroupInFile, Image64, Image64WithGroup } from '../preload/types'

export function loadSequences(sequencesPath: string): GroupInFile {
  if (!fs.existsSync(sequencesPath)) return { order: [], groups: {} }
  const data = JSON.parse(fs.readFileSync(sequencesPath, 'utf-8'))
  if ('order' in data && 'groups' in data) return data
  return { order: [], groups: {} }
}

export function getAllGroups(sequencesPath: string): Record<string, string[]> {
  const data = loadSequences(sequencesPath)
  const out: Record<string, string[]> = {}
  data.order.forEach((name) => {
    out[name] = data.groups[name]
  })
  return out
}

export function saveSequences(
  sequencesPath: string,
  sequences: Record<string, string[]>,
  order: string[]
): void {
  fs.writeFileSync(sequencesPath, JSON.stringify({ order, groups: sequences }, null, 2), 'utf-8')
}

export function addToSequence(sequencesPath: string, seqName: string, imagePath: string): void {
  const fileData = loadSequences(sequencesPath)
  const sequences = fileData.groups
  const order = fileData.order
  if (!sequences[seqName]) {
    sequences[seqName] = []
    if (!order.includes(seqName)) order.push(seqName)
  }
  if (!sequences[seqName].includes(imagePath)) {
    sequences[seqName].push(imagePath)
    saveSequences(sequencesPath, sequences, order)
  }
}

export function removeFromSequence(
  sequencesPath: string,
  seqName: string,
  imagePath: string
): void {
  const { groups, order } = loadSequences(sequencesPath)
  if (groups[seqName]) {
    groups[seqName] = groups[seqName].filter((p) => p !== imagePath)
    saveSequences(sequencesPath, groups, order)
  }
}

/**
 * Добавить несколько изображений в последовательность
 */
export function addArrToSequence(
  sequencesPath: string,
  seqName: string,
  imagePaths: string[]
): void {
  const { groups, order } = loadSequences(sequencesPath)
  if (!groups[seqName]) {
    groups[seqName] = []
    if (!order.includes(seqName)) order.push(seqName)
  }

  // добавляем только новые
  imagePaths.forEach((img) => {
    if (!groups[seqName].includes(img)) {
      groups[seqName].push(img)
    }
  })

  saveSequences(sequencesPath, groups, order)
}

/**
 * Заменить порядок в последовательности
 * Передаём полностью новый массив
 */
export function reorderSequence(sequencesPath: string, seqName: string, newOrder: string[]): void {
  const { groups, order } = loadSequences(sequencesPath)
  if (!groups[seqName]) {
    throw new Error(`Последовательность ${seqName} не найдена`)
  }

  // фильтруем: оставляем только те, что реально есть в группе
  const existing = groups[seqName]
  groups[seqName] = newOrder.filter((img) => existing.includes(img))

  saveSequences(sequencesPath, groups, order)
}

/**
 * Создать новую последовательность
 */
export function createSequence(
  sequencesPath: string,
  seqName: string,
  imagePaths: string[] = []
): void {
  const sequences = loadSequences(sequencesPath)
  if (sequences.groups[seqName]) {
    throw new Error(`Последовательность ${seqName} уже существует`)
  }
  sequences.groups[seqName] = [...new Set(imagePaths)]
  sequences.order.push(seqName)
  saveSequences(sequencesPath, sequences.groups, sequences.order)
}

/**
 * Удалить последовательность
 */
export function deleteSequence(sequencesPath: string, seqName: string): void {
  const sequences = loadSequences(sequencesPath)
  delete sequences.groups[seqName]
  sequences.order = sequences.order.filter((name) => name !== seqName)
  saveSequences(sequencesPath, sequences.groups, sequences.order)
}

export function reorderGroups(sequencesPath: string, newOrder: string[]): void {
  const sequences = loadSequences(sequencesPath)

  // оставляем только те, которые реально есть
  sequences.order = newOrder.filter((name) => sequences.groups[name])
  for (const item in sequences.groups) {
    if (!sequences.order.includes(item)) sequences.order.push(item)
  }

  saveSequences(sequencesPath, sequences.groups, sequences.order)
}

export async function getGroup(
  tagsPath: string,
  folderPath: string,
  sequencesPath: string,
  seqName: string
): Promise<Image64[]> {
  const { groups } = loadSequences(sequencesPath)
  if (!groups[seqName]) throw new Error(`Последовательность ${seqName} не найдена`)
  const images = groups[seqName]
  const imagesParse: (Image64 | null)[] = []
  for (const element of images) {
    imagesParse.push(await getImage(tagsPath, folderPath, element))
  }
  images.map((img) => {
    getImage(tagsPath, folderPath, img)
  })
  return imagesParse.filter((img): img is Image64 => img !== null)
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
  const { groups: sequences, order } = loadSequences(sequencesPath)

  const groupedImages = new Set(Object.values(sequences).flatMap((seq) => seq))

  const groups: GalleryItem[] = []
  const data: [string, string[]][] = order.map((name) => [name, sequences[name]])
  for (const [seqName, files] of data) {
    if (files.length === 0) continue

    // Проверка фильтра
    let matchSearch = true
    if (filter?.search) {
      matchSearch = seqName.toLowerCase().includes(filter.search.toLowerCase())
    }

    let matchTags = true
    if (filter && filter.filter.tags.length > 0) {
      // Проверяем: есть ли хотя бы один файл в группе с нужным тегом
      const tagsFile = loadData(tagsPath)
      matchTags = files.some((fileName) => {
        const fileData = tagsFile[fileName]
        if (!fileData) return false
        return filter.filter.tags.every((tag) =>
          fileData.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        )
      })
    }

    if (!matchSearch || !matchTags) continue

    const first = await getImage(tagsPath, folderPath, files[0])
    groups.push({
      type: 'group',
      name: seqName,
      images: files,
      preview: first
    })
  }

  // 2. Загружаем одиночные картинки
  const img = await getImagesFromFolderAll(tagsPath, folderPath, filter)
  const images: GalleryItem[] = img
    .filter((image) => !groupedImages.has(image.name)) // убираем те, что в группах
    .map((image) => ({
      type: 'image',
      ...image
    }))

  // 3. Объединяем
  const allItems = [...groups, ...images]

  return allItems
}

export async function getGalleryItems(
  tagsPath: string,
  folderPath: string,
  sequencesPath: string,
  filter?: Filter,
  page: number = 0,
  pageSize: number = 10
): Promise<{ items: GalleryItem[]; pages: number }> {
  const allItems = await getItemsWithGroup(tagsPath, folderPath, sequencesPath, filter)

  const totalPages = Math.ceil(allItems.length / pageSize)
  const start = page * pageSize
  const items = allItems.slice(start, start + pageSize)

  return { items, pages: totalPages }
}

export async function getImageWhithGroup(
  tagsPath: string,
  folderPath: string,
  nameTuple: [string, string?],
  sequencesPath: string,
  filter?: Filter
): Promise<Image64WithGroup | null> {
  try {
    const [fileName, groupName] = nameTuple

    const items = await getItemsWithGroup(tagsPath, folderPath, sequencesPath, filter)

    // Создаём плоский список галереи
    const flatList: { name: string; group?: string }[] = []

    const index = groupName
      ? items.findIndex((el) => el.type === 'group' && el.name === groupName)
      : items.findIndex((el) => el.type === 'image' && el.name === fileName)
    if (index === -1) return null
    const prevIndex = index > 0 ? index - 1 : undefined
    const nextIndex = index < items.length - 1 ? index + 1 : undefined
    const items_s = [items[index]]
    if (prevIndex !== undefined) items_s.unshift(items[prevIndex])
    if (nextIndex !== undefined) items_s.push(items[nextIndex])

    for (const item of items_s) {
      if (item.type === 'group') {
        for (const imgName of item.images) {
          flatList.push({ name: imgName, group: item.name })
        }
      } else {
        flatList.push({ name: item.name })
      }
    }

    const currentIndex = flatList.findIndex((el) => el.name === fileName && el.group === groupName)

    if (currentIndex === -1) return null

    const prevItem = flatList[currentIndex - 1]
    const nextItem = flatList[currentIndex + 1]

    const data = await getImage(tagsPath, folderPath, fileName)
    if (!data) return null

    const prev: [string, string?] | undefined = prevItem
      ? [prevItem.name, prevItem.group]
      : undefined

    const next: [string, string?] | undefined = nextItem
      ? [nextItem.name, nextItem.group]
      : undefined

    return {
      path: data.path,
      fullPath: data.fullPath,
      base64: await imgbase64(data.fullPath),
      order: data.order,
      tags: data.tags,
      name: fileName,
      group: groupName,
      prev,
      next
    }
  } catch (err) {
    console.error('Ошибка при чтении файла:', err)
    return null
  }
}

export function renameGroup(
  sequencesPath: string,
  oldName: string,
  newName: string
): void {
  const { groups, order } = loadSequences(sequencesPath);

  if (groups[newName]) {
    throw new Error("name already exists");
  }

  if (!groups[oldName]) {
    throw new Error("old name not found");
  }

  groups[newName] = groups[oldName];
  delete groups[oldName];

  const newOrder = order.map(item => (item === oldName ? newName : item));

  saveSequences(sequencesPath, groups, newOrder);
}