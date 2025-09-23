import * as fs from "fs";
import * as path from "path";
import { Image, Image64 } from "../preload/types";
import { getTags, loadData, saveData } from "./tags";
import { Filter } from "./types";

// const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".bmp"];

export async function imgbase64(filePath:string) {
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
}

export async function getImagesFromFolder(
  tagsPath: string,
  folderPath: string,
  filter: Filter | undefined,
  page: number = 0,
  pageSize: number = 10
) {
  try {
    const tagsFile = loadData(tagsPath)
    const items = Object.entries(tagsFile)
    const start = page * pageSize;

    const filtred: Image[] = items.filter(([name, option])=>{
      const containsAll = filter === undefined?true: filter.filter.tags.every(el =>
        option.tags.some(item => item.toLowerCase() === el.toLowerCase())
      );
      return filter === undefined || (name.toLowerCase().includes(filter.search.toLowerCase()) && containsAll)
    }).map(([name, option])=>({
      name,
      tags: option.tags,
      path: option.path,
      fullPath: path.join(folderPath, option.path)
    }))

    const allPages = Math.ceil(filtred.length / pageSize) 
    const sliceImage = filtred.slice(start, start + pageSize)

    return {img:sliceImage, pages:allPages}
  } catch (err) {
    console.error("Ошибка при чтении папки:", err);
    return {img:[], pages:1};
  }
}

export async function getImage(
  tagsPath: string,
  folderPath: string,
  name: string,
  filter: Filter
): Promise<Image64 | null> {
  try {
    const tagsFile = loadData(tagsPath)
    const items = Object.entries(tagsFile)

    const filtred: Image[] = items.filter(([name, option])=>{
      const containsAll = filter === undefined?true: filter.filter.tags.every(el =>
        option.tags.some(item => item.toLowerCase() === el.toLowerCase())
      );
      return filter === undefined || (name.toLowerCase().includes(filter.search.toLowerCase()) && containsAll)
    }).map(([name, option])=>({
      name,
      tags: option.tags,
      path: option.path,
      fullPath: path.join(folderPath, option.path)
    }))

    const data = filtred.find(item=>item.name === name)
    if (!data) return null
    const image = data.path
    const imgPath = data.fullPath
    const tags = getTags(folderPath, tagsPath, imgPath)


    // Получаем список всех имён
    const index = filtred.indexOf(data)

    // Определяем prev/next
    const prev = index > 0 ? filtred[index - 1].name : undefined
    const next = index < filtred.length - 1 ? filtred[index + 1].name : undefined

    return {
      path: image,
      fullPath: imgPath,
      base64: await imgbase64(imgPath),
      tags,
      name,
      prev,
      next
    }
  } catch (err) {
    console.error("Ошибка при чтении папки 2:", err);
    return null
  }
}

// Удаление изображения
export async function deleteImage(tagsPath: string, folderPath: string, name: string): Promise<boolean> {
  try {
    const tagsFile = loadData(tagsPath);
    const data = tagsFile[name];
    if (!data) return false;

    const imgPath = path.join(folderPath, data.path);

    // Удаляем сам файл, если он существует
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
    }

    // Удаляем запись из JSON
    delete tagsFile[name];
    saveData(tagsPath, tagsFile)

    return true;
  } catch (err) {
    console.error("Ошибка при удалении изображения:", err);
    return false;
  }
}