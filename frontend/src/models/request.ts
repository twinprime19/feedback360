/**
 * @file Global http request and response interface

 */

export interface GeneralQueryParams {
  [key: string]: number | string | void
}

export interface GeneralPaginateQueryParams extends GeneralQueryParams {
  page?: number
  page_size?: number
}

export interface Pagination {
  current_page: number
  total_page: number
  page_size: number
  total: number
}

export interface ResponseData<T> {
  data: T
}

export interface ResponsePaginationData<T> {
  data: T[]
  pagination?: Pagination
}
