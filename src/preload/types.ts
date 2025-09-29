export type MediaFile = {
  path: string
  tags: string[]
  order?: string
}

export type Filter = {
  search: string
  filter: {
    tags: string[]
    order?: string
  }
}

export type Image = {
  path: string
  fullPath: string
  order?: string
  name: string
  tags: string[]
  next?: string
  prev?: string
}

export type Image64 = {
  path: string
  fullPath: string
  order?: string
  name: string
  tags: string[]
  next?: string
  prev?: string
  base64: string
}

export type ImageWithGroup = {
  path: string
  fullPath: string
  order?: string
  group?: string
  name: string
  tags: string[]
  next?: [string, string?]
  prev?: [string, string?]
}

export type Image64WithGroup = {
  path: string
  fullPath: string
  order?: string
  group?: string
  name: string
  tags: string[]
  next?: [string, string?]
  prev?: [string, string?]
  base64: string
}

export type GalleryItem =
  | ({ type: 'image' } & Image)
  | {
      type: 'group'
      name: string // имя группы
      images: string[] // список имён файлов
      preview: Image | null // превьюшка
    }

export type Images = {
  imgs: Image[]
  page: number
  next_img: number | null
  pages: number
  imgInPage: number
}

export type ImagesWithGroup = {
  imgs: GalleryItem[]
  page: number
  next_img: number | null
  pages: number
  imgInPage: number
}

export type GroupInFile = {
  order: string[]
  groups: Record<string, string[]>
}
