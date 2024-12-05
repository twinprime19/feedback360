/* eslint-disable */
import { apiSlice } from '@/pages/api'
import { HttpPaginateResult, HTTP_METHOD, HttpResponseSuccessList } from '@/services/axiosHelper'
import { Endpoint, generateEndpointVersionning } from '@/utils/api'
import { TAG_TYPES } from '../api/tags'
import { User, UserCreate, UserUpdate } from './model'
import { omit } from 'lodash'
import { ActiveStatus } from '@/models/status'

const MODULE_NAME = 'user'
const MODULE_NAME_FORM = 'form'
const PARAMS_KEY = 'id'

const endpoints: Record<'index' | 'getById' | 'import', Endpoint> = {
  index: {
    endpoint: `/${MODULE_NAME}`,
  },
  getById: {
    endpoint: `/${MODULE_NAME}/${PARAMS_KEY}`,
  },
  import: {
    endpoint: `/${MODULE_NAME}/import`,
  },
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIndexUser: builder.query<HttpResponseSuccessList<User>, any>({
      query: (params) => ({
        url: generateEndpointVersionning(endpoints.index),
        method: HTTP_METHOD.GET,
        params: params,
      }),
      providesTags: (
        result: HttpResponseSuccessList<User> = {
          result: {} as HttpPaginateResult<User>,
        },
        _error,
        _arg
      ) => [
        { type: TAG_TYPES.USER, id: 'PARTIAL-LIST' },
        ...(result?.result?.data?.map(({ id }) => ({ type: TAG_TYPES.USER, id: id })) ?? []),
      ],
    }),
    getUserById: builder.query<User, any>({
      query: (_id) => ({
        url: generateEndpointVersionning(endpoints.getById).replace(PARAMS_KEY, _id),
        method: HTTP_METHOD.GET,
      }),
      providesTags: (result: User = {} as User, _error, _arg1) => [
        { type: TAG_TYPES.USER, id: result.id },
      ],
    }),
    addUser: builder.mutation<UserCreate, Partial<UserCreate>>({
      query: (user) => {
        return {
          url: generateEndpointVersionning(endpoints.index),
          method: HTTP_METHOD.POST,
          data: user,
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.USER, id: 'PARTIAL-LIST' }],
    }),
    updateUser: builder.mutation<
      UserUpdate & { id: string },
      Partial<UserUpdate & { id: string }>
    >({
      query: (user) => ({
        url: generateEndpointVersionning(endpoints.getById).replace(PARAMS_KEY, user.id!),
        method: HTTP_METHOD.PUT,
        data: omit(user, ['id']),
      }),
      invalidatesTags: (result, error, arg) => [{ type: TAG_TYPES.USER, id: arg.id }],
    }),
    updateUserStatus: builder.mutation<any, { status: ActiveStatus; id: string }>({
      query: (data: { status: ActiveStatus; id: string }) => {
        return {
          url: generateEndpointVersionning(endpoints.getById).replace(PARAMS_KEY, data.id),
          method: HTTP_METHOD.PATCH,
          data: { status: data.status },
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: TAG_TYPES.USER, id: arg.id }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: generateEndpointVersionning(endpoints.getById).replace(PARAMS_KEY, id),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.USER, id: id },
        { type: TAG_TYPES.USER, id: 'PARTIAL-LIST' },
      ],
    }),
    deleteMultipleUsers: builder.mutation({
      query: (ids) => ({
        url: generateEndpointVersionning(endpoints.index),
        method: HTTP_METHOD.DELETE,
        data: { userIds: ids },
      }),
      invalidatesTags: (result, error, ids) => [
        { type: TAG_TYPES.USER, id: ids },
        { type: TAG_TYPES.USER, id: 'PARTIAL-LIST' },
      ],
    }),
    importUser: builder.mutation<any, FormData>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.import),
          method: HTTP_METHOD.POST,
          data: data,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.USER, id: 'PARTIAL-LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetIndexUserQuery,
  useAddUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useDeleteMultipleUsersMutation,
  useLazyGetUserByIdQuery,
  useImportUserMutation,
} = userApi
