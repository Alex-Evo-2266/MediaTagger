import * as fs from "fs";
import * as path from "path";
import { TagsFileType } from "./types";

export function getFileInTagsFile(baseDir: string, file: string)
{
  const fileName = path.relative(baseDir, file);
  return fileName
}

// Загрузка JSON
export function loadData(jsonPath: string):TagsFileType {
  if (!fs.existsSync(jsonPath)) return {};
  const raw = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw);
}

// Сохранение JSON
function saveData(jsonPath: string, data: Record<string, any>) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
}

// Получение тегов для файла
export function getTags(baseDir: string, jsonPath: string, filePath: string): string[] {
  const fileName = getFileInTagsFile(baseDir, filePath)
  const data = loadData(jsonPath);
  return data[fileName]?.tags || [];
}

// Сохранение тегов для файла
export function saveTags(jsonPath: string, name: string, tags: string[]) {
  const data = loadData(jsonPath);
  if (!data[name]) return;
  data[name].tags = tags;
  saveData(jsonPath, data);
}

// Сохранение тегов для файла
export function createTags(baseDir: string, jsonPath: string, filePath: string, name: string | null, tags: string[]) {
  const data = loadData(jsonPath);
  const fileName = getFileInTagsFile(baseDir, filePath)
  if(name === null) name = fileName
  if (!data[name]) data[name] = {
    tags: [],
    path: fileName
  };
  data[name].tags = tags;
  saveData(jsonPath, data);
}
