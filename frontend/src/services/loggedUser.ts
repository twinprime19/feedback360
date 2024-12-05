/**
 * @file Token
 * @module service.loggedUser

 */

import storage from './storage'

const LOGGED_USER = 'loggedUser'

export const getLoggedUser = () => {
  return storage.getJSON(LOGGED_USER)
}

export const setLoggedUser = (loggedUser: any): void => {
  storage.setJSON(LOGGED_USER, loggedUser)
}
export const removeLoggedUser = () => {
  storage.remove(LOGGED_USER)
}
const token = {
  getLoggedUser,
  setLoggedUser,
  removeLoggedUser,
}

export default token
