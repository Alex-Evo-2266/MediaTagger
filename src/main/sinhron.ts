import * as fs from 'fs'
import * as path from 'path'

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
export function syncTagsWithFiles(tagsPath: string, imagesPath: string): boolean {
  // Загружаем JSON с тегами
  let tagsFile: Record<string, { tags: string[]; path: string }> = {}
  if (fs.existsSync(tagsPath)) {
    const raw = fs.readFileSync(tagsPath, 'utf-8')
    tagsFile = JSON.parse(raw)
  }

  // Получаем все файлы в папке
  const allFiles = getAllFiles(imagesPath)

  let updated = false

  allFiles.forEach((fullPath) => {
    const relativePath = path.relative(imagesPath, fullPath)
    const name = relativePath.replace(/\\/g, '/') // для кроссплатформенности
    if (!tagsFile[name]) {
      tagsFile[name] = { tags: [], path: name }
      updated = true
    }
  })

  // Сохраняем JSON только если были изменения
  if (updated) {
    fs.writeFileSync(tagsPath, JSON.stringify(tagsFile, null, 2), 'utf-8')
  }

  return updated
}
