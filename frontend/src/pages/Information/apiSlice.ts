/* eslint-disable */
import { apiSlice } from '@/pages/api'
import { HTTP_METHOD } from '@/services/axiosHelper'
import { Endpoint, generateEndpointVersionning } from '@/utils/api'
import { TAG_TYPES } from '../api/tags'
import { Profile } from './model'
import { omit } from 'lodash'
import { User } from '../User/model'

const endpoints: Record<'update', Endpoint> = {
  update: {
    endpoint: `/auth/update-profile`,
  },
}

export const informationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, Partial<Profile>>({
      query: (user) => ({
        url: generateEndpointVersionning(endpoints.update),
        method: HTTP_METHOD.POST,
        data: user,
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useUpdateProfileMutation } = informationApi
