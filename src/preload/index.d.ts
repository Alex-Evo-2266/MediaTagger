import { ElectronAPI } from '@electron-toolkit/preload'

import type { Filter, Image64, Images } from './types'

interface API {
  readFileAsBase64: (filePath: string) => Promise<string>
  loadImage: (filter: Filter, page?: number) => Promise<Images>
  loadImageNoTag: (page?: number) => Promise<Images>
  getImage: (name: string, filter?: Filter) => Promise<Image | null>
  saveTags: (name: string, tags: string[], order?: string) => Promise<void>
  deleteImg: (name: string) => Promise<void>
  renameImg: (oldName: string, newName: string) => Promise<void>
  renameImgFile: (oldName: string, newName: string) => Promise<boolean>
  onTagsUpdated: (callback: (updated: boolean) => void) => Electron.IpcRenderer
  onNavigate: (callback: (page: string) => void) => void
  selectFolder: () => void
  addImageInGroup: (group: string, nameImage: string) => Promise<void>
  deleteImageInGroup: (group: string, nameImage: string) => Promise<void>
  getGroups: () => Promise<Record<string, string[]>>
  getGroup: (group: string) => Promise<Image64[]>
  deleteGroup: (group: string) => Promise<void>
  reorderGroup: (group: string, images: string[]) => Promise<void>
  loadImageWithGroup: (filter: Filter, page?: number) => Promise<ImagesWithGroup>
  getImageWithGroup: (name: [string, string?], filter?: Filter) => Promise<Image64WithGroup | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
