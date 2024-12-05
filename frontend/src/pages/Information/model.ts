import { GenderState } from '@/models/gender'

export type Profile = {
  userName: string
  fullname: string
  emailAddress: string
  phone: string
  gender: GenderState
  avatar: any
}
