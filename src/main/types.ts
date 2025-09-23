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
  name: string
  tags: string[]
  next?: string
  order?: string
  prev?: string
}

export type Image64 = {
  img: string
  name: string
  base64: string
  tags: string[]
  order?: string
  next?: string
  prev?: string
}

export type Images = {
  imgs: Image[]
  page: number
  next_img: number | null
  pages: number
  imgInPage: number
}

export type TagData = {
  tags: string[]
  path: string
  order?: string
}

export type TagsFileType = Record<string, TagData>
