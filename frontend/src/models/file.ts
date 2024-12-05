import { Moment } from 'moment'

export type ThumbnailResponse = {
  id: string
  title: string
  caption: string
  thumbnail: {
    path: string
    title: string
    sizes: {
      avatar: {
        width: number
        height: number
        path: string
      }
      medium: {
        width: number
        height: number
        path: string
      }
      medium_large: {
        width: number
        height: number
        path: string
      }
      medium_square: {
        width: number
        height: number
        path: string
      }
      thumbnail: {
        width: number
        height: number
        path: string
      }
    }
  }
  createdAt: string | Date | Moment
  updatedAt: Date | Moment | string
}

export type VoiceResponse = {
  _id: string
  audio: {
    path: string
    size: number
  }
  cation: string
  title: string
  createdAt: string | Date | Moment
  updatedAt: Date | Moment | string
}
