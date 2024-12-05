/**
 * @file Token
 * @module service.token

 */

import storage from './storage'

const TOKEN_STORAGE_KEY = 'access_token'
const TOKEN_BIRTH_TIME = 'token_birth_time'
const TOKEN_EXPIRES_IN = 'token_expires_in'
const GENERAL_SETTING = 'general_setting'

export const getToken = () => {
  return storage.get(TOKEN_STORAGE_KEY)
}

export const setToken = (token: string): void => {
  const currentTime = Math.floor(Date.now() / 1000)
  const expiresIn = currentTime + 9000

  storage.set(TOKEN_STORAGE_KEY, token)
  storage.set(TOKEN_BIRTH_TIME, String(currentTime))
  storage.set(TOKEN_EXPIRES_IN, String(expiresIn))
}

export const removeToken = () => {
  storage.remove(TOKEN_STORAGE_KEY)
  storage.remove(TOKEN_EXPIRES_IN)
  storage.remove(TOKEN_BIRTH_TIME)
  storage.remove(GENERAL_SETTING)
}

export const isTokenValid = () => {
  const token = getToken()
  const tokenIsOk = token?.split('.').length === 3
  return tokenIsOk
}

export const getTokenCountdown = (): number => {
  const expiresIn = Number(localStorage.getItem(TOKEN_EXPIRES_IN))
  const borthTime = Number(localStorage.getItem(TOKEN_BIRTH_TIME))
  const deadLine = borthTime + expiresIn
  const now = +new Date() / 1000
  return deadLine > now ? Math.floor(deadLine - now) : 0
}

export const checkExpiredToken = (): boolean => {
  const expiresIn = Number(localStorage.getItem(TOKEN_EXPIRES_IN))
  if (!expiresIn) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime > expiresIn
}

const token = {
  getToken,
  setToken,
  removeToken,
  isTokenValid,
  getTokenCountdown,
}

export default token
