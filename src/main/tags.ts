import * as fs from "fs";
import * as path from "path";

function getFileInTagsFile(baseDir: string, file: string)
{
  const fileName = path.relative(baseDir, file);
  return fileName
}

// Загрузка JSON
function loadData(jsonPath: string) {
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
export function saveTags(baseDir: string, jsonPath: string, filePath: string, tags: string[]) {
  const data = loadData(jsonPath);
  const fileName = getFileInTagsFile(baseDir, filePath)
  if (!data[fileName]) data[fileName] = {};
  data[fileName].tags = tags;
  saveData(jsonPath, data);
}
