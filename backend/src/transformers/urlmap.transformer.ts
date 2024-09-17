/**
 * @file URL transformer
 * @module transformer/link
 */

import * as APP_CONFIG from '@app/app.config'

export function getTagUrl(tagSlug: string): string {
  return `${APP_CONFIG.APP.FE_URL}/tag/${tagSlug}`
}

export function getCategoryUrl(categorySlug: string): string {
  return `${APP_CONFIG.APP.FE_URL}/category/${categorySlug}`
}

export function getArticleUrl(articleId: string | number): string {
  return `${APP_CONFIG.APP.FE_URL}/article/${articleId}`
}
