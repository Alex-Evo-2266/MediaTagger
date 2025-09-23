import { contextBridge, ipcRenderer } from "electron";
import { Filter } from "./types";

contextBridge.exposeInMainWorld("api", {
  saveTags: (file: string, tags: string[]) => ipcRenderer.invoke("save-tags", file, tags),
  readFileAsBase64: (filePath: string) => ipcRenderer.invoke("readFileAsBase64", filePath),
  loadImage: (filter: Filter, page: number = 0) => ipcRenderer.invoke("load-image", filter, page),
  copyImage: () =>
    ipcRenderer.invoke("copy-image"),
  getImage: (name: string, filter?: Filter) => ipcRenderer.invoke("get-image", name, filter),
  deleteImg: (name:string) => ipcRenderer.invoke("delete-image", name),
   renameImg: (oldName:string, newName:string) => ipcRenderer.invoke("rename-image", oldName, newName),
});
