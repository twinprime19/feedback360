import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '@/pages/api'
import formSlice from '@/pages/Form/slice'
import authSlice from '@/pages/Login/slice'

export const store = configureStore({
  reducer: {
    form: formSlice,
    auth: authSlice,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
