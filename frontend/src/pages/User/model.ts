import { ActiveStatus } from '@/models/status'
import { FormType } from '../Form/model'
import { GenderState } from '@/models/gender'

export type User = {
  _id: string
  userName: string
  fullname: string
  emailAddress: string
  position: string
  phone: string
  avatar: any
  status: ActiveStatus
  isSuperAdmin: boolean
  roles: any[]
  deletedAt: any
  updatedBy: any
  deletedBy: any
  createdAt: string
  updatedAt: string
  forms: FormType[]
  __v: number
  id: string
  gender: GenderState
}

export type UserCreate = {
  userName: string
} & UserUpdate

export type UserUpdate = {
  id?: string
  fullname: string
  emailAddress: string
  status: ActiveStatus
  position: string
}
