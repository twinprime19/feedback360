import { ActiveStatus } from './../../models/status'
import { Endpoint, generateEndpointVersionning, mappingQueryToApiQuery } from '@/utils/api'
import { TAG_TYPES } from '../api/tags'
import { apiSlice } from '../api'
import { HTTP_METHOD, HttpPaginateResult, HttpResponseSuccessList } from '@/services/axiosHelper'
import { Question } from '../Questions/model'

const MODULE_NAME_QUESTION = 'question'
const PARAMS_KEY = 'id'

const endpoints: Record<
  | 'getAllQuestions'
  | 'addQuestion'
  | 'updateQuestion'
  | 'deleteQuestion'
  | 'deleteMultipleQuestions',
  Endpoint
> = {
  getAllQuestions: {
    endpoint: `/${MODULE_NAME_QUESTION}/getAll`,
  },
  addQuestion: {
    endpoint: `/${MODULE_NAME_QUESTION}/add`,
  },
  updateQuestion: {
    endpoint: `/${MODULE_NAME_QUESTION}/edit/${PARAMS_KEY}`,
  },
  deleteQuestion: {
    endpoint: `/${MODULE_NAME_QUESTION}/delete/${PARAMS_KEY}`,
  },
  deleteMultipleQuestions: {
    endpoint: `/${MODULE_NAME_QUESTION}/delete`,
  },
}

export const statisticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllQuestions: builder.query<HttpResponseSuccessList<Question>, any>({
      query: (queries) => {
        return {
          url: generateEndpointVersionning(endpoints.getAllQuestions),
          method: HTTP_METHOD.GET,
          params: mappingQueryToApiQuery(queries),
        }
      },
      providesTags: (
        result: HttpResponseSuccessList<Question> = {
          result: {} as HttpPaginateResult<Question>,
        }
      ) => [
        { type: TAG_TYPES.QUESTION, id: 'PARTIAL-LIST' },
        ...(result?.result?.data?.map(({ _id }) => ({ type: TAG_TYPES.QUESTION, id: _id })) ??
          []),
      ],
    }),
    addQuestion: builder.mutation<any, Question>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.addQuestion),
          method: HTTP_METHOD.POST,
          data,
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.QUESTION, id: 'PARTIAL-LIST' }],
    }),
    updateQuestion: builder.mutation<any, Question>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.updateQuestion).replace(
            PARAMS_KEY,
            data._id
          ),
          method: HTTP_METHOD.PUT,
          data,
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.QUESTION, id: 'PARTIAL-LIST' }],
    }),
    updateQuestionStatus: builder.mutation<any, { status: ActiveStatus; _id: string }>({
      query: (data: { status: ActiveStatus; _id: string }) => {
        return {
          url: generateEndpointVersionning(endpoints.updateQuestion).replace(
            PARAMS_KEY,
            data._id
          ),
          method: HTTP_METHOD.PATCH,
          data: { status: data.status },
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.QUESTION, id: 'PARTIAL-LIST' }],
    }),
    deleteQuestion: builder.mutation({
      query: (id) => ({
        url: generateEndpointVersionning(endpoints.deleteQuestion).replace(PARAMS_KEY, id),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.QUESTION, id: id },
        { type: TAG_TYPES.QUESTION, id: 'PARTIAL-LIST' },
      ],
    }),
    deleteMultipleQuestions: builder.mutation({
      query: (ids) => ({
        url: generateEndpointVersionning(endpoints.deleteMultipleQuestions),
        method: HTTP_METHOD.DELETE,
        data: { questionIds: ids },
      }),
      invalidatesTags: (result, error, ids) => [
        { type: TAG_TYPES.QUESTION, id: ids },
        { type: TAG_TYPES.QUESTION, id: 'PARTIAL-LIST' },
      ],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetAllQuestionsQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useUpdateQuestionStatusMutation,
  useDeleteQuestionMutation,
  useDeleteMultipleQuestionsMutation,
} = statisticsApi
