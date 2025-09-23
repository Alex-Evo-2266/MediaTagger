import { contextBridge, ipcRenderer } from "electron";
import { Filter } from "./types";

contextBridge.exposeInMainWorld("api", {
  saveTags: (file: string, tags: string[]) => ipcRenderer.invoke("save-tags", file, tags),
  readFileAsBase64: (filePath: string) => ipcRenderer.invoke("readFileAsBase64", filePath),
  loadImage: (filter: Filter, page: number = 0) => ipcRenderer.invoke("load-image", filter, page),
  getImage: (name: string, filter?: Filter) => ipcRenderer.invoke("get-image", name, filter),
  deleteImg: (name:string) => ipcRenderer.invoke("delete-image", name),
  renameImg: (oldName:string, newName:string) => ipcRenderer.invoke("rename-image", oldName, newName),
  renameImgFile: (oldName:string, newName:string) => ipcRenderer.invoke("rename-image-file", oldName, newName),
  onTagsUpdated: (callback: (updated: boolean) => void) =>
    ipcRenderer.on("tags-updated", (_event, updated) => callback(updated)),
});
