import { HTTP_METHOD, HttpResponseSuccessOne, http } from '@/services/axiosHelper'
import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import { AxiosRequestConfig } from 'axios'
import { TAG_TYPES } from './tags'
import { Endpoint, generateEndpointVersionning } from '@/utils/api'
import { ThumbnailResponse, VoiceResponse } from '@/models/file'

export type ResponseError = {
  status: string
  data: any
  statusText: string
}

const MODULE_NAME = 'media'

const endpoints: Record<'upload' | 'audio', Endpoint> = {
  upload: {
    endpoint: `/${MODULE_NAME}`,
  },
  audio: {
    endpoint: `/audio/synthesize`,
  },
}

const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: '' }
  ): BaseQueryFn<
    {
      url: string
      method: AxiosRequestConfig['method']
      data?: AxiosRequestConfig['data']
      params?: AxiosRequestConfig['params']
      headers?: AxiosRequestConfig['headers']
    },
    unknown,
    ResponseError
  > =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await http.request({ url: baseUrl + url, method, data, params, headers })
      return { data: result.data }
    } catch (axiosError: any) {
      return {
        error: {
          status: axiosError?.status,
          data: axiosError?.response?.data || axiosError?.data,
          statusText: `${axiosError?.status} ${axiosError?.statusText}`,
        },
      }
    }
  }
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  keepUnusedDataFor: 60,
  tagTypes: Object.values(TAG_TYPES).filter((k) => typeof k === 'string'),
  endpoints: (builder) => ({
    uploadMedia: builder.mutation<HttpResponseSuccessOne<ThumbnailResponse>, FormData>({
      query: (form) => {
        return {
          url: generateEndpointVersionning(endpoints.upload),
          method: HTTP_METHOD.POST,
          data: form,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      },
    }),
    generateVoice: builder.mutation<
      VoiceResponse,
      { text: string; scenario: string; node?: string }
    >({
      query: (data) => {
        return {
          url: generateEndpointVersionning(endpoints.audio),
          method: HTTP_METHOD.POST,
          data: data,
        }
      },
    }),
  }),
})

export const { useGenerateVoiceMutation, useUploadMediaMutation } = apiSlice
