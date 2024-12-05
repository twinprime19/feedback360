import { removeToken, setToken } from '@/services/token'
import { createSlice } from '@reduxjs/toolkit'
import { authApi } from './apiSlice'
import { getLoggedUser, removeLoggedUser, setLoggedUser } from '@/services/loggedUser'
import { informationApi } from '../Information/apiSlice'

const initialState = {
  data: {},
  isLogined: true,
  loggedUser: {} as any,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout() {
      removeToken()
      removeLoggedUser()
      return initialState
    },
    updateFullname: (state, action) => {
      state.loggedUser.fullname = action.payload
    },
    setUserState: (state) => {
      const loggedUserStorage = getLoggedUser()
      state.loggedUser = loggedUserStorage
      state.isLogined = true
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      const { user, access_token } = payload?.result
      setToken(access_token)
      setLoggedUser(user)
      state.loggedUser = user
      state.isLogined = true
    })
    builder.addMatcher(authApi.endpoints.validateToken.matchFulfilled, (state, { payload }) => {
      state.loggedUser = payload
      state.isLogined = true
      setLoggedUser(payload)
    })
    builder.addMatcher(
      informationApi.endpoints.updateProfile.matchFulfilled,
      (state, { payload }) => {
        setLoggedUser(payload)
        state.loggedUser = payload
      }
    )
  },
})

export const { logout, updateFullname, setUserState } = authSlice.actions

export default authSlice.reducer
