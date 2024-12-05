import { apiSlice } from '@/pages/api'
import { HTTP_METHOD } from '@/services/axiosHelper'
import { Endpoint, generateEndpointVersionning } from '@/utils/api'

const MODULE_NAME = 'auth'

const endpoints: Record<'login' | 'validateToken', Endpoint> = {
  login: {
    endpoint: `/${MODULE_NAME}/login`,
  },
  validateToken: {
    endpoint: `/${MODULE_NAME}/auth-token`,
  },
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, any>({
      query: (account) => {
        return {
          url: generateEndpointVersionning(endpoints.login),
          method: HTTP_METHOD.POST,
          data: account,
        }
      },
    }),
    validateToken: builder.query<any, any>({
      query: () => {
        return {
          url: generateEndpointVersionning(endpoints.validateToken),
          method: HTTP_METHOD.GET,
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const { useLoginMutation, useValidateTokenQuery, useLazyValidateTokenQuery } = authApi
