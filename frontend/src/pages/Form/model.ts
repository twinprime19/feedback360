import { Relation } from '@/constants/relation'
import { Question } from '../Questions/model'
import { User } from '../User/model'
import { MailSendingStatus } from '@/models/emailSendingStatus'

export enum ResultTypes {
  POINT = 0,
  TEXT = 1,
}

export enum QuestionTypes {
  REVIEW = 'review',
  ANSWER = 'answer',
}

export type Result = {
  question: string
  type: ResultTypes
  point: number
  answer: string
}

export type Template = {
  _id: string
  title: string
  template: TemplateChild
  deletedAt: any
  createdBy: string
  updatedBy: any
  deletedBy: any
  createdAt: string
  updatedAt: string
  __v: number
  id: string
}

export type FormType = {
  _id: string
  template: Template
  user: User
  time: string
  deletedAt: any
  createdBy: string
  updatedBy: any
  deletedBy: any
  assessors: any[]
  createdAt: string
  updatedAt: string
  relationship: Relation
  id: number
  __v: number
  isSubmitted: boolean
  logDatas: any[]
}

export type LogData = {
  link: string
  emailAddress: string
  code: string
  status: MailSendingStatus
  accepted: string[]
  rejected: string[]
  messageId: string
  envelope: { from: string; to: string[] }
  response: string
  time: string
}

export type TemplateChild = {
  reviewQuestions: Question[]
  answerQuestions: Question[]
  questions: QuestionNewType[]
}

export type FeedbackAdd = {
  form: string
  relationship_id: string
  fullname: string
  position: string
  result: Result[]
}

export type SendEmailType = {
  form: string
  listEmailAddress: string[]
  relationship: Relation
}

export type QuestionNewType = {
  title: string
  children: Children[]
}

export type Children = {
  title: string
  questions: QuestionChildren[]
}

export type QuestionChildren = {
  _id: string
  title: string
  content: string
  type: ResultTypes
  status: number
  extends: any[]
  deletedAt: any
  updatedBy: any
  deletedBy: any
  createdAt: string
  updatedAt: string
  id: number
  __v: number
}

export type FeedbackType = {
  _id: string
  relationship_id: string
  time: string
  relationship: Relation
}
