import * as fs from 'fs'
import * as path from 'path'

import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'

import {
  addArrToSequence,
  deleteSequence,
  getGalleryItems,
  getGroup,
  getImageWhithGroup,
  getAllGroups,
  removeFromSequence,
  reorderGroups,
  reorderSequence
} from './group'
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
import { ImagesWithGroup } from '../preload/types'

let mainWindow: BrowserWindow | null = null
let userDataPath: string
let configPath: string
let tagsPath: string
let groupPath: string
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
          accelerator: 'CmdOrCtrl+O',
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
                imagesPath,
                groupPath
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
          label: 'Выход',
          role: 'quit'
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Панель разработчика',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools()
        },
        {
          label: 'Страница',
          submenu: [
            {
              label: 'Все медиа',
              type: 'radio',
              checked: false,
              click: () => {
                if (!mainWindow) return
                mainWindow.webContents.send('navigate', 'all')
              }
            },
            {
              label: 'Посказать изображения без тегов',
              type: 'radio',
              checked: false,
              click: () => {
                if (!mainWindow) return
                mainWindow.webContents.send('navigate', 'notag')
              }
            },
            {
              label: 'Группы',
              type: 'radio',
              checked: false,
              click: () => {
                if (!mainWindow) return
                mainWindow.webContents.send('navigate', 'groups')
              }
            },
            {
              label: 'Галерея',
              type: 'radio',
              checked: true,
              click: () => {
                if (!mainWindow) return
                mainWindow.webContents.send('navigate', 'withGroup')
              }
            }
          ]
        }
      ]
    }
  ])

  Menu.setApplicationMenu(menu)

  mainWindow.loadFile(path.join(__dirname, '../renderer/alt.html'))
}

app.on('ready', createWindow)

function initDataFolder(folder: string): void {
  userDataPath = folder
  configPath = path.join(userDataPath, 'config.json')
  tagsPath = path.join(userDataPath, 'tags.json')
  groupPath = path.join(userDataPath, 'sequences.json')
  imagesPath = userDataPath

  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true })
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({}), 'utf-8')
  if (!fs.existsSync(tagsPath)) fs.writeFileSync(tagsPath, JSON.stringify({}), 'utf-8')
  if (!fs.existsSync(groupPath)) fs.writeFileSync(groupPath, JSON.stringify({}), 'utf-8')

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
ipcMain.handle('save-tags', async (_, name, tags, order) => {
  saveTags(tagsPath, name, tags, order)
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

ipcMain.handle('select-data-folder', async () => {
  const folder = chooseDataFolder()
  if (!folder) return null

  initDataFolder(folder)

  if (isDev) {
    mainWindow?.loadURL('http://localhost:5173') // Vite dev server
  } else {
    mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html')) // production
  }

  return folder
})

ipcMain.handle('add-image-in-group', async (_event, group: string, image: string) => {
  return await addArrToSequence(groupPath, group, [image])
})

ipcMain.handle('add-images-in-group', async (_event, group: string, image: string[]) => {
  return await addArrToSequence(groupPath, group, image)
})

ipcMain.handle('delete-image-in-group', async (_event, group: string, image: string) => {
  return await removeFromSequence(groupPath, group, image)
})

ipcMain.handle('get-all-groups', async (_event) => {
  return await getAllGroups(groupPath)
})

ipcMain.handle('get-group', async (_event, group: string) => {
  return await getGroup(tagsPath, imagesPath, groupPath, group)
})

ipcMain.handle('delete-group', async (_event, group: string) => {
  return await deleteSequence(groupPath, group)
})

ipcMain.handle('reorder-in-group', async (_event, group: string, images: string[]) => {
  return await reorderSequence(groupPath, group, images)
})

ipcMain.handle('reorder-group', async (_event, groups: string[]) => {
  return await reorderGroups(groupPath, groups)
})

ipcMain.handle(
  'load-image-with-group',
  async (_, filters: Filter, page: number = 0): Promise<ImagesWithGroup> => {
    const data = await getGalleryItems(tagsPath, imagesPath, groupPath, filters, page, IMG_IN_PAGE)
    return {
      imgs: data.items,
      page: page + 1,
      next_img: page + 20,
      pages: data.pages,
      imgInPage: IMG_IN_PAGE
    }
  }
)

ipcMain.handle('get-image-with-group', async (_event, name: [string, string?], filter: Filter) => {
  const data = await getImageWhithGroup(tagsPath, imagesPath, name, groupPath, filter)
  return data
})
