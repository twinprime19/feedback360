/**
 * @file General sort state

 */

import React from 'react'
import * as Icon from '@ant-design/icons'

const ASC = 1
const DESC = -1

export enum SortTypeBase {
  Asc = ASC,
  Desc = DESC,
}

export enum SortTypeWithHot {
  Asc = ASC,
  Desc = DESC,
  Hot = 2,
}

const sortTypeMap = new Map(
  [
    {
      id: SortTypeWithHot.Desc,
      name: 'desc',
      icon: <Icon.SortDescendingOutlined />,
    },
    {
      id: SortTypeWithHot.Asc,
      name: 'asc',
      icon: <Icon.SortAscendingOutlined />,
    },
    {
      id: SortTypeWithHot.Hot,
      name: 'hot',
      icon: <Icon.FireOutlined />,
    },
  ].map((item) => [item.id, item])
)

export const st = (state: number) => sortTypeMap.get(state)!
