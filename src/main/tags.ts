import * as fs from 'fs'
import * as path from 'path'

import { dialog } from 'electron'

import { TagData, TagsFileType } from './types'

export function getFileInTagsFile(baseDir: string, file: string): string {
  const fileName = path.relative(baseDir, file)
  return fileName
}

// Загрузка JSON
export function loadData(jsonPath: string): TagsFileType {
  if (!fs.existsSync(jsonPath)) return {}
  const raw = fs.readFileSync(jsonPath, 'utf-8')
  return JSON.parse(raw)
}

// Сохранение JSON
export function saveData(jsonPath: string, data: Record<string, TagData>): void {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
}

// Получение тегов для файла
export function getTags(baseDir: string, jsonPath: string, filePath: string): string[] {
  const fileName = getFileInTagsFile(baseDir, filePath)
  const data = loadData(jsonPath)
  return data[fileName]?.tags || []
}

// Сохранение тегов для файла
export function saveTags(jsonPath: string, name: string, tags: string[], order?: string): void {
  const data = loadData(jsonPath)
  if (!data[name]) return
  data[name].tags = tags
  data[name].order = order
  saveData(jsonPath, data)
}

// Сохранение тегов для файла
export function createTags(
  baseDir: string,
  jsonPath: string,
  filePath: string,
  name: string | null,
  tags: string[]
): void {
  const data = loadData(jsonPath)
  const fileName = getFileInTagsFile(baseDir, filePath)
  if (name === null) name = fileName
  if (!data[name])
    data[name] = {
      tags: [],
      path: fileName
    }
  data[name].tags = tags
  saveData(jsonPath, data)
}

export function getAllTags(tagsPath: string): string[] {
  const tagsFile = loadData(tagsPath)
  const allTags = Object.values(tagsFile)
    .flatMap((item: TagData) => item.tags ?? [])
    .map((t: string) => t.toLowerCase())

  // Убираем дубликаты
  return Array.from(new Set(allTags))
}

export function renameInFile(tagsPath: string, oldName: string, newName: string): boolean {
  const tagsFile = loadData(tagsPath)
  if (newName in tagsFile) {
    // throw Error("name alrady exist")
    console.error('такой файл уже существует')
    return false
  }
  tagsFile[newName] = { ...tagsFile[oldName] }
  delete tagsFile[oldName]
  saveData(tagsPath, tagsFile)
  return true
}

export function rebuildTagsFile(
  tagsPath: string,
  imagesPathOld: string,
  imagesPath: string
): boolean {
  if (!fs.existsSync(tagsPath)) {
    dialog.showErrorBox('Ошибка', 'Файл tags.json не найден')
    return false
  }

  try {
    const raw = fs.readFileSync(tagsPath, 'utf-8')
    const data: TagsFileType = JSON.parse(raw)

    const rebuilt: Record<string, TagData> = {}

    for (const [fileName, entry] of Object.entries(data)) {
      const oldRelPath = entry.path // старый относительный путь (от imagesPathOld)
      const absOldPath = path.join(imagesPathOld, oldRelPath)

      // получаем путь относительно новой папки
      const newPath = path.relative(imagesPath, absOldPath)

      rebuilt[fileName] = {
        ...entry,
        path: newPath
      }
    }

    fs.writeFileSync(tagsPath, JSON.stringify(rebuilt, null, 2), 'utf-8')
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Готово',
      message: 'tags.json успешно перестроен под новый формат'
    })
    return true
  } catch (err) {
    dialog.showErrorBox('Ошибка при перестроении', String(err))
    return false
  }
}
