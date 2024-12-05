/**
 * @file App route config

 */

import React from 'react'
import * as Icon from '@ant-design/icons'
import { generatePath } from 'react-router-dom'

export enum RouteKey {
  Form,
  Statistics,
  Login,
  Templates,
  Questions,
  User,
  UserList,
  UserCreate,
  UserUpdate,
  ChangePassword,
  Information,
}

export interface RouteConfig {
  id: RouteKey
  name: string
  path: string
  subPath?: string
  icon?: React.ReactElement
  pather?(...args: Array<any>): string
}

export const routeMap: ReadonlyMap<RouteKey, RouteConfig> = new Map(
  [
    {
      id: RouteKey.Form,
      name: 'form',
      path: '/form/:formId',
      subPath: ':formId',
      pather(formId: string) {
        return generatePath(this.path, { formId })
      },
    },
    {
      id: RouteKey.Statistics,
      name: 'statistics',
      path: '/statistics',
      icon: <Icon.AreaChartOutlined />,
    },
    {
      id: RouteKey.Login,
      name: 'login',
      path: '/login',
    },
    {
      id: RouteKey.Templates,
      name: 'templates',
      path: '/templates',
    },
    {
      id: RouteKey.User,
      name: 'user',
      path: '/user',
    },
    {
      id: RouteKey.UserList,
      name: 'user-list',
      path: '/user/list',
      subPath: 'list',
    },
    {
      id: RouteKey.UserCreate,
      name: 'user-create',
      path: '/user/create',
      subPath: 'create',
    },
    {
      id: RouteKey.UserUpdate,
      name: 'user-update',
      path: '/user/update/:_id',
      subPath: 'update/:_id',
      pather(_id: string) {
        return generatePath(this.path, { _id })
      },
    },
    {
      id: RouteKey.Questions,
      name: 'questions',
      path: '/questions',
      icon: <Icon.QuestionCircleOutlined />,
    },
    {
      id: RouteKey.ChangePassword,
      name: 'change-password',
      path: '/change-password',
      icon: <Icon.QuestionCircleOutlined />,
    },
    {
      id: RouteKey.Information,
      name: 'information',
      path: '/information',
      icon: <Icon.UserOutlined />,
    },
  ].map((route) => [route.id, route])
)

export const rc = (routeKey: RouteKey): RouteConfig => {
  return routeMap.get(routeKey)!
}
export const rcByPath = (routePath: string) => {
  return Array.from(routeMap.values()).find((route) => route.path === routePath)
}
export const isRoute = (routePath: string, routeKey: RouteKey) => {
  return routeMap.get(routeKey)?.path === routePath
}
export const getRouteNameBySubpath = (subpath: string) => {
  const routeArray = Array.from(routeMap.values())
  return routeArray.find((route) =>
    route.subPath ? route.subPath === subpath : route.path === subpath
  )
}
