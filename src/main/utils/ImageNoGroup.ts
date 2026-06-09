import { StoreDataGroups, StoreDataImages } from "../types";

export function getUngroupedImages(
    images: StoreDataImages,
    groups: StoreDataGroups
): Set<string> {
    const groupedImages = new Set<string>();

    for (const imageIds of groups.values()) {
        for (const imageId of imageIds) {
            groupedImages.add(imageId);
        }
    }

    const result = new Set<string>();

    for (const [id, _] of images.entries()) {
        if (!groupedImages.has(id)) {
            result.add(id);
        }
    }

    return result;
}