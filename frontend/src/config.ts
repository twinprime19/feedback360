/**
 * @file Global config

 */

import type { SizeType } from 'antd/lib/config-provider/SizeContext'

export const PREFIX_VERSION = 'v'
export const DEFAULT_VERSION = '1.0'

export const APP_AUTH_HEADER_KEY = 'Authorization'
export const APP_CONTENT_SPACE_SIZE: SizeType = 'middle'
export const APP_COLOR_PRIMARY = '#2d4432'
export const APP_COLOR_SECONDARY = '#f18903'
export const APP_LAYOUT_GUTTER_SIZE = 24
export const APP_LAYOUT_GUTTER_SIZE_20 = 20
export const APP_LAYOUT_GUTTER_SIZE_16 = 16
export const APP_LAYOUT_GUTTER_SIZE_14 = 14
export const APP_LAYOUT_GUTTER_SIZE_8 = 8
export const APP_LAYOUT_GUTTER_SIZE_6 = 6
export const APP_LAYOUT_GUTTER_SIZE_4 = 4
export const APP_LAYOUT_GUTTER_SIZE_2 = 2

export const TABLE_HEADER_COLOR = '#007b4c'
export const DEFAULT_FONT_SIZE = 11
export const BORDER_RADIUS = 5

export const VITE_ENV = import.meta.env
export const ENV = import.meta.env.MODE
export const isDev = ENV === 'development'
export const BASE_PATH = import.meta.env.VITE_BASE_URL as string
export const API_URL = import.meta.env.VITE_API_URL as string
export const DOMAIN = import.meta.env.VITE_DOMAIN as string
export const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID as string
export const ENABLED_AD = Boolean(import.meta.env.VITE_ENABLE_AD)
export const ENABLEd_HASH_ROUTER = Boolean(import.meta.env.VITE_ENABLE_HASH_ROUTER)

export const DEFAULT_FONT_FAMILY = 'Arial'

export const FILE = {
  MAX_MB_SIZE: 2,
  ACCEPT_EXTENSIONS: ['JPG', 'PNG', 'JPEG'],
}

export const PASSWORD = {
  minLength: 6,
  maxLength: 256,
}

export const pageStep = 20
export const tokenSeparators = ','
