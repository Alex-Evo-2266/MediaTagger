import { StoreDataImages, StoreDataTags } from "../types";

export function getNoTagImages(
    images: StoreDataImages,
    tags: StoreDataTags
): StoreDataImages {
    const groupedImages = new Set<string>();

    for (const imageIds of tags.values()) {
        for (const imageId of imageIds) {
            groupedImages.add(imageId);
        }
    }

    const result: StoreDataImages = new Map();

    for (const [id, image] of images.entries()) {
        if (!groupedImages.has(id)) {
            result.set(id, image);
        }
    }

    return result;
}