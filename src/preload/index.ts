import { contextBridge, ipcRenderer } from 'electron'

import { Filter } from './types'

contextBridge.exposeInMainWorld('api', {
  saveTags: (file: string, tags: string[], order?: string) =>
    ipcRenderer.invoke('save-tags', file, tags, order),
  readFileAsBase64: (filePath: string) => ipcRenderer.invoke('readFileAsBase64', filePath),
  loadImage: (filter: Filter, page: number = 0) => ipcRenderer.invoke('load-image', filter, page),
  loadImageNoTag: (page: number = 0) => ipcRenderer.invoke('load-image-no-tag', page),
  loadImageWithGroup: (filter: Filter, page: number = 0) =>
    ipcRenderer.invoke('load-image-with-group', filter, page),
  getImage: (name: string, filter?: Filter) => ipcRenderer.invoke('get-image', name, filter),
  getImageWithGroup: (name: [string, string?], filter?: Filter) =>
    ipcRenderer.invoke('get-image-with-group', name, filter),
  deleteImg: (name: string) => ipcRenderer.invoke('delete-image', name),
  renameImg: (oldName: string, newName: string) =>
    ipcRenderer.invoke('rename-image', oldName, newName),
  renameImgFile: (oldName: string, newName: string) =>
    ipcRenderer.invoke('rename-image-file', oldName, newName),
  onTagsUpdated: (callback: (updated: boolean) => void) =>
    ipcRenderer.on('tags-updated', (_event, updated) => callback(updated)),
  onNavigate: (callback: (page: string) => void) => {
    ipcRenderer.on('navigate', (_, page: string) => callback(page))
  },
  selectFolder: () => ipcRenderer.invoke('select-data-folder'),
  addImageInGroup: (group: string, nameImage: string) =>
    ipcRenderer.invoke('add-image-in-group', group, nameImage),
  addImagesInGroup: (group: string, nameImages: string[]) =>
    ipcRenderer.invoke('add-images-in-group', group, nameImages),
  deleteImageInGroup: (group: string, nameImage: string) =>
    ipcRenderer.invoke('delete-image-in-group', group, nameImage),
  getGroups: () => ipcRenderer.invoke('get-all-groups'),
  getGroup: (group: string) => ipcRenderer.invoke('get-group', group),
  deleteGroup: (group: string) => ipcRenderer.invoke('delete-group', group),
  reorderGroup: (group: string, images: string[]) =>
    ipcRenderer.invoke('reorder-group', group, images)
})
