/**
 * @file mongoose paginate plugin
 * @module utils/paginate
 */

import lodashMerge from 'lodash/merge'
import type { Model, Document, Schema, FilterQuery, QueryOptions } from 'mongoose'
import { SortType } from '@app/constants/biz.constant'

export interface PaginateResult<T> {
  documents: Array<T>
  total: number
  page: number
  pageSize: number
  totalPage: number
}

export type PaginateQuery<T = any> = FilterQuery<T>
export interface PaginateOptions {
  /** paginate options */
  page?: number
  pageSize?: number
  dateSort?: SortType
  /** original options */
  projection?: string | object | null
  /** mongoose queryOptions */
  sort?: QueryOptions['sort']
  lean?: QueryOptions['lean']
  populate?: QueryOptions['populate']
  /** original options for `model.find` */
  $queryOptions?: QueryOptions
}

const DEFAULT_OPTIONS: Required<Pick<PaginateOptions, 'page' | 'pageSize' | 'dateSort' | 'lean'>> = Object.freeze({
  page: 1,
  pageSize: 50,
  dateSort: -1,
  lean: false,
})

export interface PaginateModel<T extends Document> extends Model<T> {
  paginate(query?: PaginateQuery<T>, options?: PaginateOptions): Promise<PaginateResult<T>>
}

export function mongoosePaginate(schema: Schema) {
  schema.statics.paginate = paginate
}

export function paginate<T>(this: Model<T>, filterQuery: PaginateQuery<T> = {}, options: PaginateOptions = {}) {
  const { page, pageSize, dateSort, projection, $queryOptions, ...resetOptions } = lodashMerge(
    { ...DEFAULT_OPTIONS },
    { ...options }
  )

  const findQueryOptions = {
    ...resetOptions,
    ...$queryOptions,
  }

  // query
  const countQuery = this.countDocuments ? this.countDocuments(filterQuery).exec() : this.count(filterQuery).exec()
  const pageQuery = this.find(filterQuery, projection, {
    skip: (page - 1) * pageSize,
    limit: pageSize,
    sort: dateSort ? { _id: dateSort } : findQueryOptions.sort,
    ...findQueryOptions,
  }).exec()

  return Promise.all([countQuery, pageQuery]).then(([countResult, pageResult]) => {
    const result: PaginateResult<T> = {
      documents: pageResult,
      total: countResult,
      page,
      pageSize,
      totalPage: Math.ceil(countResult / pageSize) || 1,
    }
    return result
  })
}
