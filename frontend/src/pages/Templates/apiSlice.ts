import { ActiveStatus } from './../../models/status'
import { Endpoint, generateEndpointVersionning, mappingQueryToApiQuery } from '@/utils/api'
import { TAG_TYPES } from '../api/tags'
import { apiSlice } from '../api'
import { HTTP_METHOD, HttpPaginateResult, HttpResponseSuccessList } from '@/services/axiosHelper'
import { Template } from './model'

const MODULE_NAME = 'template'
const PARAMS_KEY = 'id'

const endpoints: Record<
  | 'getAllTemplates'
  | 'addTemplate'
  | 'updateTemplate'
  | 'deleteTemplate'
  | 'deleteMultipleTemplates',
  Endpoint
> = {
  getAllTemplates: {
    endpoint: `/${MODULE_NAME}/getAll`,
  },
  addTemplate: {
    endpoint: `/${MODULE_NAME}/add`,
  },
  updateTemplate: {
    endpoint: `/${MODULE_NAME}/edit/${PARAMS_KEY}`,
  },
  deleteTemplate: {
    endpoint: `/${MODULE_NAME}/delete/${PARAMS_KEY}`,
  },
  deleteMultipleTemplates: {
    endpoint: `/${MODULE_NAME}/delete`,
  },
}

export const templateApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTemplates: builder.query<HttpResponseSuccessList<Template>, any>({
      query: (queries) => {
        return {
          url: generateEndpointVersionning(endpoints.getAllTemplates),
          method: HTTP_METHOD.GET,
          params: mappingQueryToApiQuery(queries),
        }
      },
      providesTags: (
        result: HttpResponseSuccessList<Template> = {
          result: {} as HttpPaginateResult<Template>,
        }
      ) => [
        { type: TAG_TYPES.TEMPLATE, id: 'PARTIAL-LIST' },
        ...(result?.result?.data?.map(({ _id }) => ({ type: TAG_TYPES.TEMPLATE, id: _id })) ??
          []),
      ],
    }),
    addTemplate: builder.mutation<any, Template>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.addTemplate),
          method: HTTP_METHOD.POST,
          data,
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.TEMPLATE, id: 'PARTIAL-LIST' }],
    }),
    updateTemplate: builder.mutation<any, Template>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.updateTemplate).replace(
            PARAMS_KEY,
            data._id
          ),
          method: HTTP_METHOD.PUT,
          data,
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.TEMPLATE, id: 'PARTIAL-LIST' }],
    }),
    updateTemplateStatus: builder.mutation<any, { status: ActiveStatus; _id: string }>({
      query: (data: { status: ActiveStatus; _id: string }) => {
        return {
          url: generateEndpointVersionning(endpoints.updateTemplate).replace(
            PARAMS_KEY,
            data._id
          ),
          method: HTTP_METHOD.PATCH,
          data: { status: data.status },
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.TEMPLATE, id: 'PARTIAL-LIST' }],
    }),
    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: generateEndpointVersionning(endpoints.deleteTemplate).replace(PARAMS_KEY, id),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.TEMPLATE, id: id },
        { type: TAG_TYPES.TEMPLATE, id: 'PARTIAL-LIST' },
      ],
    }),
    deleteMultipleTemplates: builder.mutation({
      query: (ids) => ({
        url: generateEndpointVersionning(endpoints.deleteMultipleTemplates),
        method: HTTP_METHOD.DELETE,
        data: { questionIds: ids },
      }),
      invalidatesTags: (result, error, ids) => [
        { type: TAG_TYPES.TEMPLATE, id: ids },
        { type: TAG_TYPES.TEMPLATE, id: 'PARTIAL-LIST' },
      ],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetAllTemplatesQuery,
  useAddTemplateMutation,
  useUpdateTemplateMutation,
  useUpdateTemplateStatusMutation,
  useDeleteTemplateMutation,
  useDeleteMultipleTemplatesMutation,
} = templateApi
