import { Endpoint, generateEndpointVersionning, mappingQueryToApiQuery } from '@/utils/api'
import { TAG_TYPES } from '../api/tags'
import { apiSlice } from '../api'
import {
  HTTP_METHOD,
  HttpPaginateResult,
  HttpResponseSuccessList,
  HttpResponseSuccessOne,
} from '@/services/axiosHelper'
import { FormType, FeedbackAdd, SendEmailType, FeedbackType } from './model'

const MODULE_NAME_FEEDBACK = 'feedback'
const MODULE_NAME_FORM = 'form'
const PARAMS_KEY = 'id'

const endpoints: Record<
  | 'addFeedback'
  | 'getFormById'
  | 'addFormForUser'
  | 'getAllForms'
  | 'sendEmail'
  | 'getFormRelationship'
  | 'getListFeedback'
  | 'deleteFeedback',
  Endpoint
> = {
  addFeedback: {
    endpoint: `/${MODULE_NAME_FEEDBACK}/add`,
  },
  getFormById: {
    endpoint: `/${MODULE_NAME_FORM}/get/${PARAMS_KEY}`,
  },
  addFormForUser: {
    endpoint: `/${MODULE_NAME_FORM}/add`,
  },
  getAllForms: {
    endpoint: `/${MODULE_NAME_FORM}/getAll`,
  },
  sendEmail: {
    endpoint: `/${MODULE_NAME_FORM}/send`,
  },
  getFormRelationship: {
    endpoint: `/${MODULE_NAME_FORM}/get-relationship/${PARAMS_KEY}`,
  },
  getListFeedback: {
    endpoint: `/${MODULE_NAME_FEEDBACK}/list-pagination`,
  },
  deleteFeedback: {
    endpoint: `/${MODULE_NAME_FEEDBACK}/delete/${PARAMS_KEY}`,
  },
}

export const feedbackApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addFeedback: builder.mutation<any, FeedbackAdd>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.addFeedback),
          method: HTTP_METHOD.POST,
          data,
        }
      },
      invalidatesTags: () => [{ type: TAG_TYPES.FEEDBACK, id: 'PARTIAL-LIST' }],
    }),
    getFormById: builder.query<HttpResponseSuccessOne<FormType>, { id: string }>({
      query: ({ id }) => {
        return {
          url: generateEndpointVersionning(endpoints.getFormById).replace(PARAMS_KEY, id),
          method: HTTP_METHOD.GET,
        }
      },
      providesTags: (
        result: HttpResponseSuccessOne<FormType> = {
          result: {} as FormType,
        }
      ) => [{ type: TAG_TYPES.FORM, id: result?.result._id }],
    }),
    addFormForUser: builder.mutation<any, { template: string; user: string }>({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.addFormForUser),
          method: HTTP_METHOD.POST,
          data,
        }
      },
      invalidatesTags: () => [{ type: TAG_TYPES.FORM, id: 'PARTIAL-LIST' }],
    }),
    getAllForms: builder.query<HttpResponseSuccessList<FormType>, any>({
      query: (queries) => {
        return {
          url: generateEndpointVersionning(endpoints.getAllForms),
          method: HTTP_METHOD.GET,
          params: mappingQueryToApiQuery(queries),
        }
      },
      providesTags: (
        result: HttpResponseSuccessList<FormType> = {
          result: {} as HttpPaginateResult<FormType>,
        }
      ) => [
        { type: TAG_TYPES.FORM, id: 'PARTIAL-LIST' },
        ...(result?.result?.data?.map(({ _id }) => ({ type: TAG_TYPES.FORM, id: _id })) ?? []),
      ],
    }),
    sendEmail: builder.mutation<SendEmailType, Partial<SendEmailType>>({
      query: (user) => {
        return {
          url: generateEndpointVersionning(endpoints.sendEmail),
          method: HTTP_METHOD.POST,
          data: user,
        }
      },
    }),
    getFormRelationship: builder.query<HttpResponseSuccessOne<FormType>, { id: string }>({
      query: ({ id }) => {
        return {
          url: generateEndpointVersionning(endpoints.getFormRelationship).replace(PARAMS_KEY, id),
          method: HTTP_METHOD.GET,
        }
      },
      providesTags: (
        result: HttpResponseSuccessOne<FormType> = {
          result: {} as FormType,
        }
      ) => [{ type: TAG_TYPES.FORM, id: result?.result._id }],
    }),
    getListFeedback: builder.query<HttpResponseSuccessList<FeedbackType>, any>({
      query: (queries) => {
        return {
          url: generateEndpointVersionning(endpoints.getListFeedback),
          method: HTTP_METHOD.GET,
          params: mappingQueryToApiQuery(queries),
        }
      },
    }),
    deleteFeedback: builder.mutation<any, string>({
      query: (id) => {
        return {
          url: generateEndpointVersionning(endpoints.deleteFeedback).replace(PARAMS_KEY, id),
          method: HTTP_METHOD.DELETE,
        }
      },
    }),
  }),
  overrideExisting: true,
})

export const {
  useAddFeedbackMutation,
  useGetFormByIdQuery,
  useGetFormRelationshipQuery,
  useAddFormForUserMutation,
  useGetAllFormsQuery,
  useSendEmailMutation,
  useGetListFeedbackQuery,
  useDeleteFeedbackMutation,
} = feedbackApi
