export type MediaFile = {
  path: string;
  tags: string[];
  order?: string
};


export type Filter = {
  search: string
  filter: string
};

export type Images = {
  imgs: string[]
  page: number,
  next_img: number | null
  pages: number
  imgInPage: number
}

export type Image = {
  img: string
  base64: string
  tags: string[]
}