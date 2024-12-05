import { ResultTypes } from '../Form/model'

export type Question = {
  _id: string
  title: string
  content: string
  type: ResultTypes
  status: number
  deletedAt: any
  createdBy: string
  updatedBy: any
  deletedBy: any
  extends: any[]
  createdAt: string
  updatedAt: string
  id: number
  __v: number
}
