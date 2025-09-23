import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import * as fs from "fs";
import * as path from "path";
import { Filter, Images } from "./types";
import { getImage, getImagesFromFolder } from "./load_img";
import { saveTags } from "./tags";

let mainWindow: BrowserWindow | null = null;
const IMG_IN_PAGE = 10

const userDataPath = app.getAppPath(); // путь к папке, где лежит исполняемый файл

console.log("путь", userDataPath)

const configPath = path.join(userDataPath, "config.json");
const tagsPath = path.join(userDataPath, "tags.json");
const imagesPath = path.join(userDataPath, "images");

function createFile(filePath:string){
  // Проверяем, есть ли файл
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}), "utf-8"); // создаём пустой JSON
    console.log("Файл создан");
  } else {
    console.log("Файл уже существует");
  }
}

function createDir(dirPath:string){
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log("Папка создана");
  } else {
    console.log("Папка уже существует");
  }
}

createDir(imagesPath)
createFile(configPath)
createFile(tagsPath)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Создаём меню
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "Open Folder",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openDirectory"]
            });
            if (result.canceled || result.filePaths.length === 0) return;
            // Можно отправить путь в renderer через ipc
            mainWindow.webContents.send("folder-selected", result.filePaths[0]);
          }
        },
        { type: "separator" },
        {
          label: "Exit",
          role: "quit"
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle DevTools",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => mainWindow?.webContents.toggleDevTools()
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL("http://localhost:5173"); // Vite dev server
}



app.on("ready", createWindow);

// IPC: сохранить теги
ipcMain.handle("save-tags", async (_, file, tags) => {
  saveTags(imagesPath, tagsPath, file, tags)
  return true;
});

// IPC: загрузить теги
ipcMain.handle("readFileAsBase64", async (_, filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".png"
          ? "image/png"
          : ext === ".gif"
          ? "image/gif"
          : ext === ".mp4"
          ? "video/mp4"
          : ext === ".avi"
          ? "video/x-msvideo"
          : ext === ".mov"
          ? "video/quicktime"
          : "";
      if (!mime) return "";
      const buffer = fs.readFileSync(filePath);
      const data = `data:${mime};base64,${buffer.toString("base64")}`;
      return data;
});


ipcMain.handle("load-image", async (_, filters: Filter, page: number = 0):Promise<Images> => {
  const data = await getImagesFromFolder(imagesPath, filters.search, page, IMG_IN_PAGE)
  return {imgs: data.img, page: page + 1, next_img: page + 20, pages: data.pages, imgInPage:IMG_IN_PAGE}
});

// обработчик для выбора файла
ipcMain.handle("copy-image", async (_event) => {
  const result = await dialog.showOpenDialog({
    title: "Выберите изображение",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif"] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const copiedPaths: string[] = [];
  
  for (const selectedFile of result.filePaths) {
    const fileName = path.basename(selectedFile);
    const destination = path.join(imagesPath, fileName);

    try {
      fs.copyFileSync(selectedFile, destination);
      copiedPaths.push(destination);
    } catch (err) {
      console.error(`Ошибка при копировании ${selectedFile}:`, err);
    }
  }

  return copiedPaths; // вернём путь к скопированному файлу
});

ipcMain.handle("get-image", async (_event, page:number, index: number) => {
  const data = await getImage(imagesPath, page, index, tagsPath, IMG_IN_PAGE)
  return data
});