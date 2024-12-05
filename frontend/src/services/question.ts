/**
 * @file Token
 * @module service.setting

 */

import storage from './storage'

const QUESTIONS = 'questions'

export const getQuestions = () => {
  return storage.getJSON(QUESTIONS)
}

export const setQuestions = (questions: any): void => {
  storage.setJSON(QUESTIONS, questions)
}
export const removeQuestions = () => {
  storage.remove(QUESTIONS)
}

const token = {
  getQuestions,
  setQuestions,
  removeQuestions,
}

export default token
