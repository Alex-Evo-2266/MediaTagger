import * as fs from "fs";
import * as path from "path";
import { Image } from "../preload/types";
import { getTags } from "./tags";

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".bmp"];

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
  folderPath: string,
  search: string = "",
  page: number = 0,
  pageSize: number = 10
) {
  try {
    const files = await fs.promises.readdir(folderPath);
    const pagesAll = Math.floor(files.length / pageSize) 
    
    // Фильтруем изображения и по названию
    const images = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext) && file.toLowerCase().includes(search.toLowerCase());
    });

    // Разбиваем на порции
    const start = page * pageSize;
    const pagedImages = images.slice(start, start + pageSize);

    return {img:pagedImages.map((file) => path.join(folderPath, file)), pages:pagesAll}
  } catch (err) {
    console.error("Ошибка при чтении папки:", err);
    return {img:[], pages:1};
  }
}


export async function getImage(
  folderPath: string,
  page: number,
  index: number,
  tagsPath: string,
  pageSize: number = 10
):Promise<Image | null> {
  try {
    const files = await fs.promises.readdir(folderPath);
    console.log(page, pageSize, page * pageSize, index, (page * pageSize) + index)
    const globalIndex = (page * pageSize) + index
    
    const image = files[globalIndex]
    console.log(image)
    const imgPath = path.join(folderPath, image)
    const tags = getTags(folderPath, tagsPath, imgPath)
    return {img: imgPath, base64: await imgbase64(imgPath), tags:tags}
  } catch (err) {
    console.error("Ошибка при чтении папки:", err);
    return null
  }
}