import * as fs from 'fs'
import * as path from 'path'

import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'

import {
  deleteImage,
  getImage,
  getImagesFromFolder,
  getImagesFromFolderNotTag,
  imgbase64,
  renameImageFile
} from './load_img'
import { syncTagsWithFiles } from './sinhron'
import { createTags, renameInFile, saveTags } from './tags'
import { Filter, Images } from './types'

let mainWindow: BrowserWindow | null = null
let userDataPath: string
let configPath: string
let tagsPath: string
let imagesPath: string
const IMG_IN_PAGE = 10
const isDev = process.env.NODE_ENV === 'development'

function chooseDataFolder(): string | undefined {
  const result = dialog.showOpenDialogSync({
    title: 'Выберите папку для хранения данных',
    properties: ['openDirectory', 'createDirectory']
  })

  if (!result || result.length === 0) {
    return undefined
  }

  return result[0]
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Создаём меню
  const menu = Menu.buildFromTemplate([
    {
      label: 'Основное',
      submenu: [
        {
          label: 'Выбрать папку данных',
          click: () => {
            const folder = chooseDataFolder()
            if (!folder) return

            initDataFolder(folder)

            if (isDev) {
              mainWindow?.loadURL('http://localhost:5173') // Vite dev server
            } else {
              mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html')) // production
            }

            // Можно уведомить renderer о путях
            mainWindow?.webContents.once('dom-ready', () => {
              mainWindow?.webContents.send('paths-initialized', {
                configPath,
                tagsPath,
                imagesPath
              })
            })
          }
        },
        {
          label: 'Добавить изображение',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            if (!mainWindow) return

            addImage().then((res) => {
              if (!mainWindow) return
              mainWindow.webContents.send('tags-updated', res)
            })
          }
        },
        {
          label: 'Синхронизировать изображения',
          click: (_menuItem) => {
            if (!mainWindow) return

            const updated = syncTagsWithFiles(tagsPath, imagesPath)

            // Отправляем событие в renderer о том, что данные обновились
            mainWindow.webContents.send('tags-updated', updated)
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          role: 'quit'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools()
        },
        {
          label: 'Посказать изображения без тегов',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            if (!mainWindow) return
            mainWindow.webContents.send('toggle-no-tag-images', menuItem.checked)
          }
        }
      ]
    }
  ])

  Menu.setApplicationMenu(menu)

  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/alt.html'))
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/alt.html'))
  }
}

app.on('ready', createWindow)

function initDataFolder(folder: string): void {
  userDataPath = folder
  configPath = path.join(userDataPath, 'config.json')
  tagsPath = path.join(userDataPath, 'tags.json')
  imagesPath = path.join(userDataPath, 'images')

  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true })
  if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath, { recursive: true })
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({}), 'utf-8')
  if (!fs.existsSync(tagsPath)) fs.writeFileSync(tagsPath, JSON.stringify({}), 'utf-8')

  console.log('Папка данных выбрана:', userDataPath)
}

async function addImage(): Promise<boolean> {
  const result = await dialog.showOpenDialog({
    title: 'Выберите изображение',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] }]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return false
  }

  const copiedPaths: string[] = []

  for (const selectedFile of result.filePaths) {
    const fileName = path.basename(selectedFile)
    const destination = path.join(imagesPath, fileName)
    createTags(imagesPath, tagsPath, destination, null, [])
    try {
      fs.copyFileSync(selectedFile, destination)
      copiedPaths.push(destination)
    } catch (err) {
      console.error(`Ошибка при копировании ${selectedFile}:`, err)
    }
  }

  return true // вернём путь к скопированному файлу
}

// IPC: сохранить теги
ipcMain.handle('save-tags', async (_, name, tags) => {
  saveTags(tagsPath, name, tags)
  return true
})

// IPC: загрузить теги
ipcMain.handle('readFileAsBase64', async (_, filePath: string) => {
  return await imgbase64(filePath)
})

ipcMain.handle('load-image', async (_, filters: Filter, page: number = 0): Promise<Images> => {
  const data = await getImagesFromFolder(tagsPath, imagesPath, filters, page, IMG_IN_PAGE)
  return {
    imgs: data.img,
    page: page + 1,
    next_img: page + 20,
    pages: data.pages,
    imgInPage: IMG_IN_PAGE
  }
})

ipcMain.handle('load-image-no-tag', async (_, page: number = 0): Promise<Images> => {
  const data = await getImagesFromFolderNotTag(tagsPath, imagesPath, page, IMG_IN_PAGE)
  return {
    imgs: data.img,
    page: page + 1,
    next_img: page + 20,
    pages: data.pages,
    imgInPage: IMG_IN_PAGE
  }
})

ipcMain.handle('get-image', async (_event, name: string, filter: Filter) => {
  const data = await getImage(tagsPath, imagesPath, name, filter)
  return data
})

ipcMain.handle('delete-image', async (_event, name: string) => {
  const data = await deleteImage(tagsPath, imagesPath, name)
  return data
})

ipcMain.handle('rename-image', async (_event, oldName: string, newName: string) => {
  return await renameInFile(tagsPath, oldName, newName)
})

ipcMain.handle('rename-image-file', async (_event, oldName: string, newName: string) => {
  return await renameImageFile(tagsPath, imagesPath, oldName, newName)
})
