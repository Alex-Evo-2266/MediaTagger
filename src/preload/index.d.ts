import { ElectronAPI } from '@electron-toolkit/preload'
import type { Filter, Images, MediaFile } from "./types";

interface API {
  readFileAsBase64: (filePath: string) => Promise<string>;
  loadImage: (filter: Filter, page?: number) => Promise<Images>
  getImage: (page:number, indexInPage: number, filter?: Filter) => Promise<Image | null>
  copyImage: () => Promise<string[] | null>;
  saveTags: (file:string, tags: string[]) => Promise<>;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
