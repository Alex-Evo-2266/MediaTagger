import { ElectronAPI } from '@electron-toolkit/preload'
import type { Filter, Images, MediaFile } from "./types";

interface API {
  readFileAsBase64: (filePath: string) => Promise<string>;
  loadImage: (filter: Filter, page?: number) => Promise<Images>
  getImage: (name: string, filter?: Filter) => Promise<Image | null>
  copyImage: () => Promise<string[] | null>;
  saveTags: (name:string, tags: string[]) => Promise<>;
  deleteImg: (name:string) => Promise<>;
  renameImg: (oldName:string, newName:string) => Promise<>;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
