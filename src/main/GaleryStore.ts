import fs from "fs";
import path from "path";
import { Filter, GalleryItem, Image, Image64, Image64WithGroup } from "../preload/types";
import { StoreDataGroups, StoreDataImages, StoreDataTags } from "./types";
import { getUngroupedImages } from "./utils/ImageNoGroup";
import { getNoTagImages } from "./utils/noTags";
import { imgbase64 } from "./utils/base64";


export interface GroupData {
    order: string[];
    groups: Record<string, string[]>;
}

export class GalleryStore {
    private images: StoreDataImages = new Map<string, Image>();

    private groups: StoreDataGroups = new Map<string, string[]>();
    private groupOrder: string[] = [];
    private imagesNoGroup = new Set<string>();

    private tagIndex: StoreDataTags = new Map<string, Set<string>>();
    private imageGroups = new Map<string, Set<string>>();

    constructor(
        private tagsPath: string,
        private groupsPath: string,
        private imagesPath: string
    ) {}

    load() {
        this.loadImages();
        this.loadGroups();
        this.buildIndexes();

        this.imagesNoGroup = getUngroupedImages(this.images, this.groups)

        console.log("images", this.images)
        console.log("groups", this.groups)
        console.log("tagIndex", this.tagIndex)
        console.log("imageGroups", this.imageGroups)
        console.log("imagesNoGroup", this.imagesNoGroup)
    }

    reload() {
        this.images.clear();
        this.groups.clear();
        this.groupOrder = [];
        this.tagIndex.clear();
        this.imageGroups.clear();

        this.load();
    }

    private loadImages() {
        if (!fs.existsSync(this.tagsPath)) return;

        const data = JSON.parse(
            fs.readFileSync(this.tagsPath, "utf8")
        );

        for (const [name, value] of Object.entries<any>(data)) {
            this.images.set(name, {
                name,
                path: value.path,
                tags: this.normalizeTags(value.tags ?? []),
                order: value.order,
                fullPath: path.join(
                    this.imagesPath,
                    value.path
                )
            });
        }
    }

    private loadGroups() {
        if (!fs.existsSync(this.groupsPath)) return;

        const data: GroupData = JSON.parse(
            fs.readFileSync(this.groupsPath, "utf8")
        );

        this.groupOrder = data.order ?? [];

        for (const [name, images] of Object.entries(
            data.groups ?? {}
        )) {
            this.groups.set(name, images);
        }
    }

    normalizeTag(tag: string): string {
        return tag.trim().replace(/\s+/g, ' ').toLowerCase();
    }

    normalizeTags(tags: string[]): string[] {
        const unique = new Set<string>();
        const normalized: string[] = [];

        for (const tag of tags) {
            const value = this.normalizeTag(tag);

            if (!value || unique.has(value)) {
                continue;
            }

            unique.add(value);
            normalized.push(value);
        }

        return normalized;
    }

    private levenshteinDistance(left: string, right: string): number {
        if (left === right) return 0;
        if (!left.length) return right.length;
        if (!right.length) return left.length;

        const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

        for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
        for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

        for (let i = 1; i <= left.length; i += 1) {
            for (let j = 1; j <= right.length; j += 1) {
                const cost = left[i - 1] === right[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[left.length][right.length];
    }

    getTagSuggestions(term: string, limit: number = 20): string[] {
        const normalized = this.normalizeTag(term);
        const allTags = this.getAllTags();

        if (!normalized) {
            return allTags.slice(0, limit);
        }

        const exactMatches = allTags.filter((tag) => tag === normalized);
        const prefixMatches = allTags.filter((tag) => tag.startsWith(normalized) && tag !== normalized);
        const containsMatches = allTags.filter(
            (tag) => tag.includes(normalized) && !exactMatches.includes(tag) && !prefixMatches.includes(tag)
        );

        const maxDistance = Math.max(1, Math.ceil(normalized.length * 0.2));
        const fuzzyMatches = allTags.filter((tag) => {
            if (exactMatches.includes(tag) || prefixMatches.includes(tag) || containsMatches.includes(tag)) {
                return false;
            }

            if (normalized.length < 3) {
                return false;
            }

            return this.levenshteinDistance(tag, normalized) <= maxDistance;
        });

        return [...exactMatches, ...prefixMatches, ...containsMatches, ...fuzzyMatches].slice(0, limit);
    }

    private buildIndexes() {
        for (const image of this.images.values()) {
            for (const tag of image.tags) {
                const key = this.normalizeTag(tag);

                if (!key) continue;

                if (!this.tagIndex.has(key)) {
                    this.tagIndex.set(key, new Set());
                }

                this.tagIndex
                    .get(key)!
                    .add(image.name);
            }
        }

        for (const [group, images] of this.groups) {
            for (const image of images) {
                if (!this.imageGroups.has(image)) {
                    this.imageGroups.set(
                        image,
                        new Set()
                    );
                }

                this.imageGroups
                    .get(image)!
                    .add(group);
            }
        }
    }

    setTag(name: string, tags: string[], order?: string){
        const img = this.images.get(name)
        if (!img) return
        img.tags = this.normalizeTags(tags)
        img.order = order

        this.tagIndex.clear();
        this.buildIndexes();

        this.saveTagsFile()
    }

    getImages(
        filter: Filter | undefined,
        page: number = 0,
        pageSize: number = 10):{
          img: Image[]
          pages: number
        }{
        try {
            const sorter = this.search(filter)
        
            const start = page * pageSize
            const allPages = Math.ceil(sorter.length / pageSize)
            const sliceImage = sorter.slice(start, start + pageSize)
        
            return { img: sliceImage, pages: allPages }
        } catch (err) {
            console.error('Ошибка при чтении папки:', err)
            return { img: [], pages: 1 }
        }
    }

    getImageNoTag(page: number = 0,
        pageSize: number = 10) {

        try {
            const data = [...getNoTagImages(this.images, this.tagIndex).values()]
            console.log("map data", data)
        
            const start = page * pageSize
            const allPages = Math.ceil(data.length / pageSize)
            const sliceImage = data.slice(start, start + pageSize)
        
            return { img: sliceImage, pages: allPages }
        } catch (err) {
            console.error('Ошибка при чтении папки:', err)
            return { img: [], pages: 1 }
        }
    }

    getImage(name: string, filter: Filter){
        try{
            const sorter = this.search(filter)
            const data = sorter.find((item) => item.name === name)
            if (!data) return null
            const image = data.path
            const imgPath = data.fullPath
        
            // Получаем список всех имён
            const index = sorter.indexOf(data)
        
            // Определяем prev/next
            const prev = index > 0 ? sorter[index - 1].name : undefined
            const next = index < sorter.length - 1 ? sorter[index + 1].name : undefined
        
            return {
                path: image,
                fullPath: imgPath,
                base64: imgbase64(imgPath),
                order: data.order,
                tags: data.tags,
                name,
                prev,
                next
            }
        } catch (err) {
            console.error('Ошибка при чтении папки 2:', err)
            return null
        }
    }
        
    deleteImage(name: string): boolean {
        const image = this.images.get(name);

        if (!image) {
            return false;
        }

        // Удаляем из коллекции изображений
        this.images.delete(name);

        // Удаляем из индекса тегов
        for (const tag of image.tags) {
            const set = this.tagIndex.get(tag.toLowerCase());

            if (!set) continue;

            set.delete(name);

            if (set.size === 0) {
                this.tagIndex.delete(tag.toLowerCase());
            }
        }

        // Удаляем из групп
        for (const [group, images] of this.groups) {
            const filtered = images.filter(
                imgName => imgName !== name
            );

            if (filtered.length !== images.length) {
                this.groups.set(group, filtered);
            }
        }

        // Удаляем из индекса групп
        this.imageGroups.delete(name);

        // Пересчитываем изображения без группы
        this.imagesNoGroup = getUngroupedImages(
            this.images,
            this.groups
        );

        if (fs.existsSync(image.fullPath)) {
            fs.unlinkSync(image.fullPath);
        }

        // Сохраняем изменения
        this.saveTagsFile();
        this.saveGroupsFile();

        return true;
    }

    renameImage(oldName: string, newName: string): boolean {
        const image = this.images.get(oldName);

        // нет старого
        if (!image) {
            console.error("файл с таким именем не найден");
            return false;
        }

        // уже существует новое имя
        if (this.images.has(newName)) {
            console.error("такой файл уже существует");
            return false;
        }

        // 1. переносим image
        this.images.set(newName, {
            ...image,
            name: newName
        });
        this.images.delete(oldName);

        // 2. обновляем tagIndex
        for (const tag of image.tags) {
            const key = tag.toLowerCase();

            const set = this.tagIndex.get(key);
            if (!set) continue;

            set.delete(oldName);
            set.add(newName);
        }

        // 3. обновляем groups
        let modifiedGroups = false;

        for (const [group, images] of this.groups) {
            const updated = images.map(img =>
                img === oldName ? newName : img
            );

            if (updated !== images) {
                this.groups.set(group, updated);
                modifiedGroups = true;
            }
        }

        // 4. обновляем imageGroups
        const groupsOfImage = this.imageGroups.get(oldName);

        if (groupsOfImage) {
            this.imageGroups.delete(oldName);
            this.imageGroups.set(newName, groupsOfImage);
        }

        // 5. пересчёт ungrouped (если используешь)
        this.imagesNoGroup = getUngroupedImages(
            this.images,
            this.groups
        );

        // 6. сохраняем файлы
        this.saveTagsFile();

        if (modifiedGroups) {
            this.saveGroupsFile();
        }

        return true;
    }

    renameImageFile(oldName: string, newName: string): boolean {
        try {
            const image = this.images.get(oldName);

            if (!image) {
                console.error("Файл с таким именем не найден");
                return false;
            }

            const oldPath = image.fullPath;
            const newPath = path.join(
                this.imagesPath,
                newName
            );

            // проверка конфликта
            if (fs.existsSync(newPath)) {
                console.error("Файл с таким именем уже существует");
                return false;
            }

            // 1. переименовываем файл на диске
            fs.renameSync(oldPath, newPath);

            // 2. обновляем images map
            this.images.delete(oldName);

            const updatedImage: Image = {
                ...image,
                name: newName,
                path: newName,
                fullPath: newPath
            };

            this.images.set(newName, updatedImage);

            // 3. обновляем tagIndex
            for (const tag of image.tags) {
                const key = tag.toLowerCase();

                const set = this.tagIndex.get(key);
                if (!set) continue;

                set.delete(oldName);
                set.add(newName);
            }

            // 4. обновляем groups
            let modifiedGroups = false;

            for (const [group, images] of this.groups) {
                const updated = images.map(img =>
                    img === oldName ? newName : img
                );

                if (updated !== images) {
                    this.groups.set(group, updated);
                    modifiedGroups = true;
                }
            }

            // 5. обновляем imageGroups
            const groupSet = this.imageGroups.get(oldName);
            if (groupSet) {
                this.imageGroups.delete(oldName);
                this.imageGroups.set(newName, groupSet);
            }

            // 6. пересчёт no-group кеша
            this.imagesNoGroup = getUngroupedImages(
                this.images,
                this.groups
            );

            // 7. сохраняем файлы
            this.saveTagsFile();

            if (modifiedGroups) {
                this.saveGroupsFile();
            }

            return true;

        } catch (err) {
            console.error("Ошибка при переименовании файла:", err);
            return false;
        }
    }

    addToSequence(seqName: string, imageName: string): void {
        let group = this.groups.get(seqName);

        if (!group) {
            group = [];
            this.groups.set(seqName, group);

            if (!this.groupOrder.includes(seqName)) {
                this.groupOrder.push(seqName);
            }
        }

        if (!group.includes(imageName)) {
            group.push(imageName);
        }

        // обновляем reverse index
        if (!this.imageGroups.has(imageName)) {
            this.imageGroups.set(imageName, new Set());
        }

        this.imageGroups.get(imageName)!.add(seqName);

        // пересчёт кеша без группы
        this.imagesNoGroup = getUngroupedImages(this.images, this.groups);

        this.saveGroupsFile();
    }

    removeFromSequence(seqName: string, imageName: string): void {
        const group = this.groups.get(seqName);
        if (!group) return;

        const updated = group.filter(img => img !== imageName);

        if (updated.length === 0) {
            this.groups.delete(seqName);

            this.groupOrder = this.groupOrder.filter(
                name => name !== seqName
            );
        } else {
            this.groups.set(seqName, updated);
        }

        // обновляем reverse index
        const set = this.imageGroups.get(imageName);
        if (set) {
            set.delete(seqName);
            if (set.size === 0) {
                this.imageGroups.delete(imageName);
            }
        }

        this.imagesNoGroup = getUngroupedImages(this.images, this.groups);

        this.saveGroupsFile();
    }

    addArrToSequence(seqName: string, imageNames: string[]): void {
        let group = this.groups.get(seqName);

        if (!group) {
            group = [];
            this.groups.set(seqName, group);

            if (!this.groupOrder.includes(seqName)) {
                this.groupOrder.push(seqName);
            }
        }

        for (const img of imageNames) {
            if (!group.includes(img)) {
                group.push(img);
            }

            if (!this.imageGroups.has(img)) {
                this.imageGroups.set(img, new Set());
            }

            this.imageGroups.get(img)!.add(seqName);
        }

        this.imagesNoGroup = getUngroupedImages(this.images, this.groups);

        this.saveGroupsFile();
    }

    getAllGroups(): Record<string, string[]> {
        const out: Record<string, string[]> = {};

        for (const name of this.groupOrder) {
            const group = this.groups.get(name);
            if (group) {
                out[name] = [...group];
            }
        }

        return out;
    }

    async getGroup(seqName: string): Promise<Image64[]> {
        const group = this.groups.get(seqName);

        if (!group) {
            throw new Error(`Последовательность ${seqName} не найдена`);
        }

        const result: Image64[] = [];

        for (const name of group) {
            const image = this.images.get(name);

            if (!image) {
                result.push({
                    name,
                    tags: [],
                    path: "",
                    fullPath: "",
                    base64: ""
                });
                continue;
            }

            result.push({
                name: image.name,
                tags: image.tags,
                path: image.path,
                fullPath: image.fullPath,
                base64: imgbase64(image.fullPath)
            });
        }

        return result;
    }

    deleteSequence(seqName: string): void {
        if (!this.groups.has(seqName)) return;

        const images = this.groups.get(seqName)!;

        // 1. удалить группу
        this.groups.delete(seqName);

        // 2. обновить порядок
        this.groupOrder = this.groupOrder.filter(
            name => name !== seqName
        );

        // 3. обновить reverse index (imageGroups)
        for (const img of images) {
            const set = this.imageGroups.get(img);

            if (!set) continue;

            set.delete(seqName);

            if (set.size === 0) {
                this.imageGroups.delete(img);
            }
        }

        // 4. пересчёт "без группы"
        this.imagesNoGroup = getUngroupedImages(
            this.images,
            this.groups
        );

        // 5. сохранить
        this.saveGroupsFile();
    }

    reorderGroups(newOrder: string[]): void {
        const existing = new Set(this.groups.keys());

        // 1. оставляем только валидные группы из нового порядка
        const filteredOrder = newOrder.filter(name => existing.has(name));

        // 2. добавляем отсутствующие группы в конец (как у тебя было)
        for (const name of this.groups.keys()) {
            if (!filteredOrder.includes(name)) {
                filteredOrder.push(name);
            }
        }

        this.groupOrder = filteredOrder;

        this.saveGroupsFile();
    }

    reorderSequence(seqName: string, newOrder: string[]): void {
        const group = this.groups.get(seqName);

        if (!group) {
            throw new Error(`Последовательность ${seqName} не найдена`);
        }

        const existing = new Set(group);

        // оставляем только валидные элементы и убираем дубликаты
        const reordered: string[] = [];

        for (const img of newOrder) {
            if (existing.has(img) && !reordered.includes(img)) {
                reordered.push(img);
            }
        }

        // (опционально) если хочешь сохранить "потерянные" элементы в конце:
        for (const img of group) {
            if (!reordered.includes(img)) {
                reordered.push(img);
            }
        }

        this.groups.set(seqName, reordered);

        this.saveGroupsFile();
    }

    getGroupsByImage(imageName: string): string[] {
        const groups = this.imageGroups.get(imageName);

        if (!groups) return [];

        return Array.from(groups);
    }
            
    getAllTags(): string[] {
        return Array.from(this.tagIndex.keys()).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
    }

    renameGroup(oldName: string, newName: string): void {
        if (!this.groups.has(oldName)) {
            throw new Error("old name not found");
        }

        if (this.groups.has(newName)) {
            throw new Error("name already exists");
        }

        const group = this.groups.get(oldName)!;

        // 1. перенос данных группы
        this.groups.set(newName, group);
        this.groups.delete(oldName);

        // 2. обновление порядка
        this.groupOrder = this.groupOrder.map(name =>
            name === oldName ? newName : name
        );

        // 3. обновление reverse index (imageGroups)
        for (const img of group) {
            const set = this.imageGroups.get(img);
            if (!set) continue;

            set.delete(oldName);
            set.add(newName);
        }

        // 4. сохранить
        this.saveGroupsFile();
    }

    getImageWithGroup(
        nameTuple: [string, string?],
        filter?: Filter
    ): Image64WithGroup | null {
        try {
            const [fileName, groupName] = nameTuple;

            const items = this.getItemsWithGroup(filter);

            // 1. находим индекс в списке
            const index = groupName
                ? items.findIndex(
                    (el) => el.type === "group" && el.name === groupName
                )
                : items.findIndex(
                    (el) => el.type === "image" && el.name === fileName
                );

            if (index === -1) return null;

            const windowItems = [
                items[index - 1],
                items[index],
                items[index + 1]
            ].filter(Boolean) as GalleryItem[];

            // 2. flatten window
            const flatList: { name: string; group?: string }[] = [];

            for (const item of windowItems) {
                if (item.type === "group") {
                    for (const img of item.images) {
                        flatList.push({
                            name: img,
                            group: item.name
                        });
                    }
                } else {
                    flatList.push({
                        name: item.name
                    });
                }
            }

            // 3. ищем текущий элемент
            const currentIndex = flatList.findIndex(
                (el) =>
                    el.name === fileName &&
                    el.group === groupName
            );

            if (currentIndex === -1) return null;

            const prevItem = flatList[currentIndex - 1];
            const nextItem = flatList[currentIndex + 1];

            const image = this.images.get(fileName);
            if (!image) return null;

            return {
                path: image.path,
                fullPath: image.fullPath,
                base64: imgbase64(image.fullPath),
                order: image.order,
                tags: image.tags,
                name: fileName,
                group: groupName,
                prev: prevItem
                    ? [prevItem.name, prevItem.group]
                    : undefined,
                next: nextItem
                    ? [nextItem.name, nextItem.group]
                    : undefined
            };
        } catch (err) {
            console.error("Ошибка при чтении файла:", err);
            return null;
        }
    }

    setTags(
        name: string,
        tags: string[]
    ): void {
        const image = this.images.get(name);

        if (!image) return;

        // обновляем данные
        image.tags = this.normalizeTags(tags);

        // сохраняем
        this.saveTagsFile();

        // пересобираем индекс тегов (если ты его используешь)
        this.tagIndex.clear();
        this.buildIndexes();
    }

    addImageFromPath(filePath: string): Image | null {
        try {
            const fileName = path.basename(filePath);
            const destination = path.join(this.imagesPath, fileName);

            // защита от дублей
            if (this.images.has(fileName)) {
                console.warn(`Изображение ${fileName} уже существует`);
                return null;
            }

            // проверка конфликта файла на диске
            if (fs.existsSync(destination)) {
                console.warn(`Файл ${fileName} уже существует в папке`);
                return null;
            }

            // 1. копируем файл
            fs.copyFileSync(filePath, destination);

            // 2. создаём запись
            const image: Image = {
                name: fileName,
                path: fileName,
                fullPath: destination,
                tags: [],
                order: undefined
            };

            this.images.set(fileName, image);

            // 3. добавляем в tagIndex (пусто, но структура поддерживается)
            // (ничего не нужно, потому что tags = [])

            // 4. пересчёт "без групп"
            this.imagesNoGroup = getUngroupedImages(
                this.images,
                this.groups
            );

            // 5. сохраняем
            this.saveTagsFile();

            return image;

        } catch (err) {
            console.error("Ошибка при добавлении изображения:", err);
            return null;
        }
    }

    getGalleryItems(
        filter?: Filter,
        page: number = 0,
        pageSize: number = 10
    ): { items: GalleryItem[]; pages: number } {

        const allItems = this.getItemsWithGroup(filter);

        const pages = Math.ceil(allItems.length / pageSize);
        const start = page * pageSize;

        return {
            items: allItems.slice(start, start + pageSize),
            pages
        };
    }

    getItemsWithGroup(filter?: Filter): GalleryItem[] {
        const result: GalleryItem[] = [];

        // 1. ГРУППЫ
        for (const groupName of this.groupOrder) {
            const images = this.groups.get(groupName);
            if (!images || images.length === 0) continue;

            let matchSearch = true;
            if (filter?.search) {
                matchSearch = groupName
                    .toLowerCase()
                    .includes(filter.search.toLowerCase());
            }

            let matchTags = true;
            if (filter?.filter?.tags?.length) {
                matchTags = images.some((imgName) => {
                    const img = this.images.get(imgName);
                    if (!img) return false;

                    return filter.filter.tags.every((tag) =>
                        img.tags.some(
                            (t) => t.toLowerCase() === tag.toLowerCase()
                        )
                    );
                });
            }

            if (!matchSearch || !matchTags) continue;

            const firstImageName = images[0];
            const firstImage = this.images.get(firstImageName);

            result.push({
                type: "group",
                name: groupName,
                images,
                preview: firstImage
                    ? {
                        name: firstImage.name,
                        tags: firstImage.tags,
                        path: firstImage.path,
                        fullPath: firstImage.fullPath,
                        // base64: imgbase64(firstImage.fullPath)
                    }
                    : null
            });
        }

        // 2. ОДИНОЧНЫЕ ИЗОБРАЖЕНИЯ
        const groupedImages = new Set(
            [...this.groups.values()].flat()
        );

        for (const image of this.images.values()) {
            if (groupedImages.has(image.name)) continue;

            let matchSearch = true;
            if (filter?.search) {
                matchSearch = image.name
                    .toLowerCase()
                    .includes(filter.search.toLowerCase());
            }

            let matchTags = true;
            if (filter?.filter?.tags?.length) {
                matchTags = filter.filter.tags.every((tag) =>
                    image.tags.some(
                        (t) => t.toLowerCase() === tag.toLowerCase()
                    )
                );
            }

            if (!matchSearch || !matchTags) continue;

            result.push({
                type: "image",
                ...image
            });
        }

        return result;
    }
    
        

    search(filter?: Filter) {
        if (!filter) {
            return [...this.images.values()];
        }

        let candidates: Set<string> | null = null;

        for (const tag of filter.filter.tags) {
            const current =
                this.tagIndex.get(
                    tag.toLowerCase()
                ) ?? new Set();

            if (!candidates) {
                candidates = new Set(current);
            } else {
                const f = [...candidates].filter((x) => current.has(x))
                candidates = new Set(f);
            }
        }

        let images =
            candidates === null
                ? [...this.images.values()]
                : [...candidates]
                      .map((x) =>
                          this.images.get(x)
                      )
                      .filter(Boolean) as Image[];

        if (filter.search) {
            const search =
                filter.search.toLowerCase();

            images = images.filter((img) =>
                img.name
                    .toLowerCase()
                    .includes(search)
            );
        }

        return images;
    }

    saveTagsFile() {
        const out: Record<string, any> = {};

        for (const image of this.images.values()) {
            out[image.name] = {
                path: image.path,
                tags: this.normalizeTags(image.tags),
                order: image.order
            };
        }

        fs.writeFileSync(
            this.tagsPath,
            JSON.stringify(out, null, 2)
        );
    }

    saveGroupsFile() {
        const groups: Record<
            string,
            string[]
        > = {};

        for (const [name, images] of this.groups) {
            groups[name] = images;
        }

        fs.writeFileSync(
            this.groupsPath,
            JSON.stringify(
                {
                    order: this.groupOrder,
                    groups
                },
                null,
                2
            )
        );
    }

    

}