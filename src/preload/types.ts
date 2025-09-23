export type MediaFile = {
  path: string;
  tags: string[];
  order?: string
};


export type Filter = {
  search: string
  filter: {
    tags: string[]
  }
};

export type Image = {
  path: string
  fullPath: string
  name: string
  tags: string[]
  next?: string
  prev?: string
}

export type Image64 = {
  path: string
  fullPath: string
  name: string
  base64: string
  tags: string[]
  next?: string
  prev?: string
}

export type Images = {
  imgs: Image[]
  page: number,
  next_img: number | null
  pages: number
  imgInPage: number
}