import * as fs from 'fs'
import * as path from 'path'
import { MediaFile } from '../preload/types'

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']

/**
 * Рекурсивно собирает все файлы с поддерживаемыми расширениями в папке
 */
function getAllFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath))
    } else {
      if (SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
        results.push(filePath)
      }
    }
  })
  return results
}

/**
 * Синхронизирует теги с файлами на диске
 */
export function syncTagsWithFiles(tagsPath: string, imagesPath: string): string[] {
  // Загружаем JSON с тегами
  let tagsFile: Record<string, { tags: string[]; path: string }> = {}
  if (fs.existsSync(tagsPath)) {
    const raw = fs.readFileSync(tagsPath, 'utf-8')
    tagsFile = JSON.parse(raw)
  }

  // Получаем все пути, которые уже есть в tagsFile (по полю path)
  const existingPaths = new Set(Object.values(tagsFile).map((entry) => entry.path))

  // Получаем все файлы в папке
  const allFiles = getAllFiles(imagesPath)
  const addedPaths: string[] = []

  allFiles.forEach((fullPath) => {
    const relativePath = path.relative(imagesPath, fullPath)
    const name = relativePath.replace(/\\/g, '/') // кроссплатформенность

    // Проверяем по полю path
    if (!existingPaths.has(name)) {
      // создаём новый уникальный ключ (например, используем сам path как ключ)
      tagsFile[name] = { tags: [], path: name }
      existingPaths.add(name)
      addedPaths.push(name)
    }
  })

  // Сохраняем JSON только если были изменения
  if (addedPaths.length > 0) {
    fs.writeFileSync(tagsPath, JSON.stringify(tagsFile, null, 2), 'utf-8')
  }

  return addedPaths
}

export function findMissingFiles(tagsPath: string, imagesPath: string): string[] {
  if (!fs.existsSync(tagsPath)) return []

  const raw = fs.readFileSync(tagsPath, 'utf-8')
  const tagsFile: Record<string, MediaFile> = JSON.parse(raw)

  const missing: string[] = []

  Object.values(tagsFile).forEach((entry) => {
    const fullPath = path.join(imagesPath, entry.path)
    if (!fs.existsSync(fullPath)) {
      missing.push(entry.path)
    }
  })

  return missing
}

/**
 * Находит дубликаты по полю path в JSON
 */
export function findDuplicatePaths(tagsPath: string): string[][] {
  if (!fs.existsSync(tagsPath)) return []

  const raw = fs.readFileSync(tagsPath, 'utf-8')
  const tagsFile: Record<string, MediaFile> = JSON.parse(raw)

  const pathMap = new Map<string, string[]>()

  Object.entries(tagsFile).forEach(([key, entry]) => {
    if (!pathMap.has(entry.path)) pathMap.set(entry.path, [])
    pathMap.get(entry.path)!.push(key)
  })

  // Оставляем только дубликаты (где больше 1 ключа на path)
  const duplicates = Array.from(pathMap.values()).filter((keys) => keys.length > 1)

  return duplicates
}

export function mergeDuplicatePaths(tagsPath: string): {removedPaths: string[], updatePaths: string[]} {
  if (!fs.existsSync(tagsPath)) return {removedPaths: [], updatePaths: []}

  const raw = fs.readFileSync(tagsPath, 'utf-8')
  const tagsFile: Record<string, MediaFile> = JSON.parse(raw)

  const pathMap = new Map<string, { key: string; tags: Set<string> }>()

    const removedPaths: string[] = []
    const updatePaths: string[] = []

  // Проходим по всем объектам
  Object.entries(tagsFile).forEach(([key, entry]) => {
    if (!pathMap.has(entry.path)) {
      pathMap.set(entry.path, { key, tags: new Set(entry.tags) })
    } else {
      // Есть дубликат: объединяем теги
      const existing = pathMap.get(entry.path)!
      entry.tags.forEach((t) => existing.tags.add(t))
      removedPaths.push(key)
      updatePaths.push(existing.key)
      // Удаляем текущий дубликат из tagsFile
      delete tagsFile[key]
    }
  })

  // Перезаписываем tags из Set в массив
  pathMap.forEach(({ key, tags }) => {
    tagsFile[key].tags = Array.from(tags)
  })

  // Сохраняем JSON только если были изменения
  if (removedPaths.length > 0) {
    fs.writeFileSync(tagsPath, JSON.stringify(tagsFile, null, 2), 'utf-8')
  }

  return {removedPaths, updatePaths}
}