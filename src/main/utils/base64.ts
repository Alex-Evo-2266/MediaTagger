import * as path from 'path'
import * as fs from 'fs'

export function imgbase64(filePath: string): string {
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