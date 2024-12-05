import { DEFAULT_FONT_SIZE } from '@/config'

export enum FontType {
  HEADER = 1,
  TITLE = 2,
  SUB_TITLE = 3,
  CONTENT = 4,
}

export const fontSizes = [
  {
    type: FontType.HEADER,
    fontSize: 36,
  },
  {
    type: FontType.TITLE,
    fontSize: 24,
  },
  {
    type: FontType.SUB_TITLE,
    fontSize: 18,
  },
  {
    type: FontType.CONTENT,
    fontSize: 14,
  },
]

export const getFSFromType = (type: FontType) =>
  fontSizes.find((item) => item.type === type)?.fontSize || DEFAULT_FONT_SIZE
