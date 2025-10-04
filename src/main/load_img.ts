import * as fs from 'fs'
import * as path from 'path'

import { loadData, saveData } from './tags'
import { Filter } from './types'
import { Image, Image64 } from '../preload/types'
import { loadSequences, saveSequences } from './group'

export async function imgbase64(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  const mime =
    ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : ext === '.png'
        ? 'image/png'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.mp4'
            ? 'video/mp4'
            : ext === '.avi'
              ? 'video/x-msvideo'
              : ext === '.mov'
                ? 'video/quicktime'
                : ''
  if (!mime) return ''
  const buffer = fs.readFileSync(filePath)
  const data = `data:${mime};base64,${buffer.toString('base64')}`
  return data
}

export async function getImagesFromFolderAll(
  tagsPath: string,
  folderPath: string,
  filter: Filter | undefined
): Promise<Image[]> {
  const tagsFile = loadData(tagsPath)
  const items = Object.entries(tagsFile)

  const filtred: Image[] = items
    .filter(([name, option]) => {
      const containsAll =
        filter === undefined
          ? true
          : filter.filter.tags.every((el) =>
              option.tags.some((item) => item.toLowerCase() === el.toLowerCase())
            )
      return (
        filter === undefined ||
        (name.toLowerCase().includes(filter.search.toLowerCase()) && containsAll)
      )
    })
    .map(([name, option]) => ({
      name,
      tags: option.tags,
      path: option.path,
      order: option.order,
      fullPath: path.join(folderPath, option.path)
    }))

  const sorter =
    filter && filter.filter.tags.length > 0
      ? filtred.sort((a, b) => {
          const orderA = a.order ?? '' // значение по умолчанию пустая строка
          const orderB = b.order ?? ''
          return orderA.localeCompare(orderB) // сравниваем строки
        })
      : filtred
  return sorter
}

export async function getImagesFromFolder(
  tagsPath: string,
  folderPath: string,
  filter: Filter | undefined,
  page: number = 0,
  pageSize: number = 10
): Promise<{
  img: Image[]
  pages: number
}> {
  try {
    const sorter = await getImagesFromFolderAll(tagsPath, folderPath, filter)

    const start = page * pageSize
    const allPages = Math.ceil(sorter.length / pageSize)
    const sliceImage = sorter.slice(start, start + pageSize)

    return { img: sliceImage, pages: allPages }
  } catch (err) {
    console.error('Ошибка при чтении папки:', err)
    return { img: [], pages: 1 }
  }
}

export async function getImagesFromFolderNotTag(
  tagsPath: string,
  folderPath: string,
  page: number = 0,
  pageSize: number = 10
): Promise<{
  img: Image[]
  pages: number
}> {
  try {
    const tagsFile = loadData(tagsPath)
    const items = Object.entries(tagsFile)
    const start = page * pageSize

    const filtred: Image[] = items
      .filter(([_, option]) => option.tags.length === 0)
      .map(([name, option]) => ({
        name,
        tags: option.tags,
        path: option.path,
        fullPath: path.join(folderPath, option.path)
      }))

    const allPages = Math.ceil(filtred.length / pageSize)
    const sliceImage = filtred.slice(start, start + pageSize)

    return { img: sliceImage, pages: allPages }
  } catch (err) {
    console.error('Ошибка при чтении папки:', err)
    return { img: [], pages: 1 }
  }
}

export async function getImage(
  tagsPath: string,
  folderPath: string,
  name: string,
  filter?: Filter
): Promise<Image64 | null> {
  try {
    const tagsFile = loadData(tagsPath)
    const items = Object.entries(tagsFile)

    const filtred: Image[] = items
      .filter(([name, option]) => {
        const containsAll =
          filter === undefined
            ? true
            : filter.filter.tags.every((el) =>
                option.tags.some((item) => item.toLowerCase() === el.toLowerCase())
              )
        return (
          filter === undefined ||
          (name.toLowerCase().includes(filter.search.toLowerCase()) && containsAll)
        )
      })
      .map(([name, option]) => ({
        name,
        tags: option.tags,
        path: option.path,
        order: option.order,
        fullPath: path.join(folderPath, option.path)
      }))

    const sorter =
      filter && filter.filter.tags.length > 0
        ? filtred.sort((a, b) => {
            const orderA = a.order ?? '' // значение по умолчанию пустая строка
            const orderB = b.order ?? ''
            return orderA.localeCompare(orderB) // сравниваем строки
          })
        : filtred

    const data = sorter.find((item) => item.name === name)
    if (!data) return null
    const image = data.path
    const imgPath = data.fullPath

    // Получаем список всех имён
    const index = sorter.indexOf(data)

    // Определяем prev/next
    const prev = index > 0 ? sorter[index - 1].name : undefined
    const next = index < sorter.length - 1 ? sorter[index + 1].name : undefined

    return {
      path: image,
      fullPath: imgPath,
      base64: await imgbase64(imgPath),
      order: data.order,
      tags: data.tags,
      name,
      prev,
      next
    }
  } catch (err) {
    console.error('Ошибка при чтении папки 2:', err)
    return null
  }
}

// Удаление изображения
export async function deleteImage(
  tagsPath: string,
  sequencesPath: string,
  folderPath: string,
  name: string
): Promise<boolean> {
  try {
    const tagsFile = loadData(tagsPath)
    const data = tagsFile[name]
    if (!data) return false

    const imgPath = path.join(folderPath, data.path)

    // Удаляем сам файл, если он существует
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath)
    }

    // Удаляем запись из JSON
    delete tagsFile[name]
    saveData(tagsPath, tagsFile)

    // 🧹 Удаляем из групп, если есть sequencesPath
    if (sequencesPath) {
      const { groups, order } = loadSequences(sequencesPath);

      let modified = false;
      for (const groupName of Object.keys(groups)) {
        const images = groups[groupName];
        const newImages = images.filter((img: string) => img !== name);
        if (newImages.length !== images.length) {
          groups[groupName] = newImages;
          modified = true;
        }
      }

      if (modified) {
        saveSequences(sequencesPath, groups, order);
      }
    }

    return true
  } catch (err) {
    console.error('Ошибка при удалении изображения:', err)
    return false
  }
}

/**
 * Переименование файла изображения
 * @param tagsPath путь к JSON с тегами
 * @param folderPath путь к папке с изображениями
 * @param oldName текущее имя (ключ в JSON)
 * @param newName новое имя файла (должно включать расширение)
 * @returns true если успешно, false при ошибке
 */
export async function renameImageFile(
  tagsPath: string,
  sequencesPath: string,
  folderPath: string,
  oldName: string,
  newName: string
): Promise<boolean> {
  try {
    const tagsFile = loadData(tagsPath);
    const data = tagsFile[oldName];
    if (!data) {
      console.error("Файл с таким именем не найден");
      return false;
    }

    const oldPath = path.join(folderPath, data.path)
    const newPath = path.join(folderPath, newName)

    // Проверяем, что файл с новым именем не существует
    if (fs.existsSync(newPath)) {
      console.error('Файл с таким именем уже существует')
      return false
    }

    // Переименовываем файл на диске
    fs.renameSync(oldPath, newPath)

    // Обновляем JSON
    delete tagsFile[oldName]
    tagsFile[newName] = { ...data, path: newName }
    saveData(tagsPath, tagsFile)

    if (sequencesPath) {
      const { groups, order } = loadSequences(sequencesPath);
      let modified = false;

      for (const groupName of Object.keys(groups)) {
        const images = groups[groupName];
        const updatedImages = images.map((img: string) =>
          img === oldName ? newName : img
        );

        if (JSON.stringify(updatedImages) !== JSON.stringify(images)) {
          groups[groupName] = updatedImages;
          modified = true;
        }
      }

      if (modified) {
        saveSequences(sequencesPath, groups, order);
        console.log(`Имя "${oldName}" обновлено на "${newName}" во всех группах.`);
      }
    }


    return true
  } catch (err) {
    console.error('Ошибка при переименовании файла:', err)
    return false
  }
}
