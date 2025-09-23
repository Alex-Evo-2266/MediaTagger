import { ElectronAPI } from '@electron-toolkit/preload'

import type { Filter, Images } from './types'

interface API {
  readFileAsBase64: (filePath: string) => Promise<string>
  loadImage: (filter: Filter, page?: number) => Promise<Images>
  loadImageNoTag: (page?: number) => Promise<Images>
  getImage: (name: string, filter?: Filter) => Promise<Image | null>
  saveTags: (name: string, tags: string[]) => Promise<void>
  deleteImg: (name: string) => Promise<void>
  renameImg: (oldName: string, newName: string) => Promise<void>
  renameImgFile: (oldName: string, newName: string) => Promise<boolean>
  onTagsUpdated: (callback: (updated: boolean) => void) => Electron.IpcRenderer
  onToggleNoImageView: (callback: (enabled: boolean) => void) => void
  selectFolder: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
