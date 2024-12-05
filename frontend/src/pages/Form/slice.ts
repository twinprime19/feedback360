import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Relation } from '@/constants/relation'
import { Result, ResultTypes } from './model'
import { getQuestions } from '@/services/question'
import { Question } from '../Questions/model'

export const defaultPoint = 0
export const defaultAnswer = ''

export interface FormState {
  reviewQuestions: Result[]
  answerQuestions: Result[]
}

interface SetFieldValuePayload {
  fieldName: keyof FormState
  value: number | string | Relation
  question?: string
}

const initialState: FormState = {
  reviewQuestions:
    getQuestions()?.questions?.map((item: Question) => ({
      question: item?._id,
      type: item?.type,
      point: defaultPoint,
      answer: defaultAnswer,
    })) || [],
  answerQuestions:
    getQuestions()?.answerQuestions?.map((item: Question) => ({
      question: item?._id,
      type: item?.type,
      point: item?.type === ResultTypes.POINT ? defaultPoint : 0,
      answer: defaultAnswer,
    })) || [],
}

export const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    reset() {
      return initialState
    },
    setFieldValue(state, action: PayloadAction<SetFieldValuePayload>) {
      const { question, value, fieldName } = action.payload
      if (fieldName in state) {
        if (Array.isArray(state[fieldName])) {
          const questionIndex = (state[fieldName] as Result[]).findIndex(
            (q: Result) => q.question === question
          )

          if (questionIndex !== -1) {
            if (typeof value === 'number')
              (state[fieldName] as Result[])[questionIndex].point = value
            else (state[fieldName] as Result[])[questionIndex].answer = value
          }
        }
      }
    },
    setState(state, action: PayloadAction<FormState>) {
      const { answerQuestions, reviewQuestions } = action.payload
      state.answerQuestions = answerQuestions
      state.reviewQuestions = reviewQuestions
      return state
    },
  },
})

export const { reset, setFieldValue, setState } = formSlice.actions

export const getReviewValueByQuestion = (state: FormState, question: string) => {
  return state.reviewQuestions.find((item) => item.question === question)
}

export const getAnswerValueByQuestion = (state: FormState, question: string) => {
  return state.answerQuestions.find((item) => item.question === question)
}

export const getFirstEmptyReviewQuestion = (state: FormState) => {
  return state.reviewQuestions.find(
    (item) => item.point === defaultPoint && item.type === ResultTypes.POINT
  )?.question
}

// export const getFirstEmptyAnswerQuestion = (state: FormState) => {
//   return state.answerQuestions.find(
//     (item) => item.point === defaultPoint && item.type === ResultTypes.POINT
//   )?.question
// }

export const getFirstEmptyAnswerQuestion = (arr: Result[]) => {
  return arr.find((item) => item.point === defaultPoint && item.type === ResultTypes.POINT)
    ?.question
}

export default formSlice.reducer
