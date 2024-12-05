import { generateEndpointVersionning } from './../../utils/api'
/* eslint-disable */
import { apiSlice } from '@/pages/api'
import { HTTP_METHOD } from '@/services/axiosHelper'
import { Endpoint } from '@/utils/api'
import { ChangePassword } from './model'

const endpoints: Record<'changePassword', Endpoint> = {
  changePassword: {
    endpoint: `/auth/change-password`,
  },
}

export const patientApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    changePasswordPatient: builder.mutation<any, Partial<ChangePassword>>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.changePassword),
          method: HTTP_METHOD.POST,
          data,
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const { useChangePasswordPatientMutation } = patientApi
